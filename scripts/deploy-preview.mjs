import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_PROJECT_ID = "prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F";
const STABLE_ALIAS = "tindung-preview.vercel.app";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (process.cwd() !== root) {
  throw new Error(`Phải chạy từ repository root: ${root}`);
}

const linkedProject = JSON.parse(readFileSync(resolve(root, ".vercel/project.json"), "utf8"));
if (linkedProject.projectId !== EXPECTED_PROJECT_ID || linkedProject.settings?.rootDirectory !== "apps/web") {
  throw new Error("Vercel project hoặc Root Directory không đúng; dừng trước khi tạo deployment remote.");
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} thất bại.`);
}

function capture(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
}

function inspectDeployment(url) {
  return JSON.parse(capture("vercel", ["inspect", url, "--format=json"]));
}

function hasSingaporeFunctions(deployment) {
  const functions = deployment.builds
    ?.flatMap((build) => build.output ?? [])
    .filter((output) => output.type === "lambda" && output.lambda);
  return Boolean(functions?.length) && functions.every((output) => output.lambda.deployedTo?.includes("sin1"));
}

async function assertStatus(url, path, expected) {
  const response = await fetch(new URL(path, `${url}/`), { redirect: "manual" });
  if (!expected.includes(response.status)) {
    throw new Error(`Smoke ${path} trả ${response.status}; cần ${expected.join("|")}.`);
  }
}

async function smoke(url) {
  await assertStatus(url, "/login", [200]);
  await assertStatus(url, "/manifest.webmanifest", [200]);
  await assertStatus(url, "/api/google-sync/export", [401]);
  await assertStatus(url, "/api/notifications/run", [401]);
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} cần một giá trị.`);
  return value;
}

console.log("Kiểm tra local bắt buộc trước Preview...");
run("git", ["diff", "--check"]);
run("pnpm", ["lint"]);
run("pnpm", ["typecheck"]);
run("pnpm", ["test"]);
run("pnpm", ["build"]);
run("pnpm", ["test:e2e"]);

let previousUrl;
try {
  const previous = inspectDeployment(STABLE_ALIAS);
  previousUrl = `https://${previous.url}`;
} catch {
  previousUrl = undefined;
}

let candidateUrl = argumentValue("--candidate");
if (!candidateUrl) {
  console.log("Tạo candidate Preview chưa chuyển stable alias...");
  const deployResult = JSON.parse(capture("vercel", ["deploy", "--target=preview", "--yes", "--format=json"]));
  const created = deployResult.deployment ?? deployResult;
  candidateUrl = created.url?.startsWith("http") ? created.url : `https://${created.url}`;
}
if (!candidateUrl) throw new Error("Không đọc được deployment candidate từ Vercel CLI.");
const parsedCandidateUrl = new URL(candidateUrl);
if (parsedCandidateUrl.protocol !== "https:" || !parsedCandidateUrl.hostname.endsWith(".vercel.app")) {
  throw new Error("Candidate phải là immutable HTTPS URL của Vercel.");
}

const candidate = inspectDeployment(candidateUrl);
const candidateId = candidate.id;
if (candidate.target !== "preview" || candidate.readyState !== "READY" || !hasSingaporeFunctions(candidate)) {
  throw new Error("Candidate không đồng thời đạt target=preview, Ready và Functions sin1.");
}
await smoke(candidateUrl);

if (!process.argv.includes("--verified-authenticated-smoke")) {
  console.log(JSON.stringify({
    status: "awaiting_authenticated_smoke",
    deploymentId: candidateId,
    deploymentUrl: candidateUrl,
    nextCommand: `pnpm deploy:preview -- --candidate ${candidateUrl} --verified-authenticated-smoke`,
    requiredEvidence: [
      "Đăng nhập trên immutable URL và mở mọi route Auth/Server Component đã đổi.",
      "Xác nhận browser console sạch và không có runtime error mới trong Vercel logs.",
    ],
  }, null, 2));
  process.exit(0);
}

console.log(`Candidate đạt smoke: ${candidateId}. Chuyển ${STABLE_ALIAS}...`);
run("vercel", ["alias", "set", candidateUrl, STABLE_ALIAS]);

try {
  await smoke(`https://${STABLE_ALIAS}`);
  const stable = inspectDeployment(STABLE_ALIAS);
  if (stable.id !== candidateId) throw new Error("Stable alias chưa trỏ đúng candidate vừa kiểm tra.");
} catch (error) {
  if (previousUrl) {
    console.error("Hậu kiểm alias thất bại; khôi phục deployment trước đó.");
    run("vercel", ["alias", "set", previousUrl, STABLE_ALIAS]);
  }
  throw error;
}

console.log(JSON.stringify({ status: "ok", deploymentId: candidateId, deploymentUrl: candidateUrl, alias: `https://${STABLE_ALIAS}` }, null, 2));
