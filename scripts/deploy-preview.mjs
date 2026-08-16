import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  EXPECTED_VERCEL,
  assertDeploymentProvenance,
  assertPromotionProvenance,
  parseProjectInspection,
} from "./vercel-preview-provenance.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (process.cwd() !== root) {
  throw new Error(`Phải chạy từ repository root: ${root}`);
}

const linkedProject = JSON.parse(readFileSync(resolve(root, ".vercel/project.json"), "utf8"));
if (
  linkedProject.projectId !== EXPECTED_VERCEL.projectId ||
  linkedProject.orgId !== EXPECTED_VERCEL.orgId ||
  linkedProject.projectName !== EXPECTED_VERCEL.projectName ||
  linkedProject.settings?.rootDirectory !== EXPECTED_VERCEL.rootDirectory
) {
  throw new Error("Vercel project hoặc Root Directory không đúng; dừng trước khi tạo deployment remote.");
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} thất bại.`);
}

function captureResult(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} thất bại: ${(result.stderr || result.stdout).trim()}`);
  }
  return result;
}

function inspectDeployment(url) {
  const result = captureResult("vercel", [
    "inspect",
    url,
    "--scope",
    EXPECTED_VERCEL.orgSlug,
    "--format=json",
  ]);
  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    throw new Error("Không đọc được JSON từ `vercel inspect`; dừng fail-closed.");
  }
}

function inspectProject(projectName) {
  const result = captureResult("vercel", [
    "project",
    "inspect",
    projectName,
    "--scope",
    EXPECTED_VERCEL.orgSlug,
    "--yes",
    "--no-color",
  ]);
  return parseProjectInspection(`${result.stderr}\n${result.stdout}`);
}

function deploymentEvidence(requestedUrl, deployment = inspectDeployment(requestedUrl)) {
  return { requestedUrl, deployment, project: inspectProject(deployment.name) };
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

const previous = inspectDeployment(EXPECTED_VERCEL.stableAlias);
const previousUrl = `https://${previous.url}`;
const rollbackEvidence = deploymentEvidence(previousUrl, previous);
assertDeploymentProvenance(rollbackEvidence);

let candidateUrl = argumentValue("--candidate");
if (!candidateUrl) {
  console.log("Tạo candidate Preview chưa chuyển stable alias...");
  const result = captureResult("vercel", [
    "deploy",
    "--target=preview",
    "--scope",
    EXPECTED_VERCEL.orgSlug,
    "--yes",
    "--format=json",
  ]);
  const deployResult = JSON.parse(result.stdout.trim());
  const created = deployResult.deployment ?? deployResult;
  candidateUrl = created.url?.startsWith("http") ? created.url : `https://${created.url}`;
}
if (!candidateUrl) throw new Error("Không đọc được deployment candidate từ Vercel CLI.");

const candidate = inspectDeployment(candidateUrl);
const candidateEvidence = deploymentEvidence(candidateUrl, candidate);
const checkedCandidate = assertDeploymentProvenance(candidateEvidence);
candidateUrl = checkedCandidate.deploymentUrl;
await smoke(checkedCandidate.deploymentUrl);

if (!process.argv.includes("--verified-authenticated-smoke")) {
  console.log(JSON.stringify({
    status: "awaiting_authenticated_smoke",
    deploymentId: checkedCandidate.deploymentId,
    deploymentUrl: candidateUrl,
    nextCommand: `pnpm deploy:preview -- --candidate ${candidateUrl} --verified-authenticated-smoke`,
    requiredEvidence: [
      "Đăng nhập trên immutable URL và mở mọi route Auth/Server Component đã đổi.",
      "Xác nhận browser console sạch và không có runtime error mới trong Vercel logs.",
    ],
  }, null, 2));
  process.exit(0);
}

assertPromotionProvenance({ candidate: candidateEvidence, rollback: rollbackEvidence });
console.log(`Candidate đạt smoke: ${checkedCandidate.deploymentId}. Chuyển ${EXPECTED_VERCEL.stableAlias}...`);
run("vercel", ["alias", "set", candidateUrl, EXPECTED_VERCEL.stableAlias, "--scope", EXPECTED_VERCEL.orgSlug]);

try {
  await smoke(`https://${EXPECTED_VERCEL.stableAlias}`);
  const stable = inspectDeployment(EXPECTED_VERCEL.stableAlias);
  assertDeploymentProvenance(deploymentEvidence(`https://${stable.url}`, stable));
  if (stable.id !== checkedCandidate.deploymentId) throw new Error("Stable alias chưa trỏ đúng candidate vừa kiểm tra.");
} catch (error) {
  console.error("Hậu kiểm alias thất bại; khôi phục deployment cùng project đã xác minh.");
  run("vercel", ["alias", "set", previousUrl, EXPECTED_VERCEL.stableAlias, "--scope", EXPECTED_VERCEL.orgSlug]);
  const restored = inspectDeployment(EXPECTED_VERCEL.stableAlias);
  if (restored.id !== rollbackEvidence.deployment.id) throw new Error("Rollback alias không trỏ về deployment đã xác minh.", { cause: error });
  throw error;
}

console.log(JSON.stringify({
  status: "ok",
  deploymentId: checkedCandidate.deploymentId,
  deploymentUrl: candidateUrl,
  projectId: candidateEvidence.project.projectId,
  org: candidateEvidence.project.orgSlug,
  alias: `https://${EXPECTED_VERCEL.stableAlias}`,
}, null, 2));
