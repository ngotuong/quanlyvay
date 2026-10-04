const { execFileSync } = require("node:child_process");
const { readFileSync, mkdirSync, writeFileSync, symlinkSync, existsSync } = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const testWorkdir = process.env.CI === "true" ? root : path.join(root, ".cache/c20-test");
const environment = { ...process.env, SUPABASE_PROFILE: "supabase" };

function prepareTestEnvironment() {
  if (process.env.CI === "true") return;
  const directory = path.join(testWorkdir, "supabase");
  mkdirSync(directory, { recursive: true });
  const config = readFileSync(path.join(root, "supabase/config.toml"), "utf8")
    .replace('project_id = "QuanLyVayCaNhan"', 'project_id = "QuanLyVayCaNhan-C20-test"')
    .replace(/543(\d\d)/g, "553$1");
  writeFileSync(path.join(directory, "config.toml"), config);
  for (const name of ["migrations", "tests", "seed.sql"]) {
    const target = path.join(directory, name);
    if (!existsSync(target)) symlinkSync(path.join(root, "supabase", name), target);
  }
}

function localSupabaseEnvironment() {
  prepareTestEnvironment();
  const output = execFileSync("supabase", ["status", "-o", "env"], {
    cwd: testWorkdir, env: environment, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  const values = Object.fromEntries(output.split("\n")
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/)).filter(Boolean)
    .map((match) => [match[1], match[2]]));
  const url = new URL(values.API_URL);
  if (!["localhost", "127.0.0.1"].includes(url.hostname)
    || url.port !== (process.env.CI === "true" ? "54321" : "55321")) {
    throw new Error("Refusing non-isolated test target.");
  }
  return values;
}

// db reset restarts Auth/Storage; Docker may exchange their addresses while Kong caches DNS.
// Refresh only this guarded disposable project's gateway, then require the routed health check.
function testGatewayTarget({ apiUrl, config, ci = process.env.CI === "true" }) {
  const project = ci ? "QuanLyVayCaNhan" : "QuanLyVayCaNhan-C20-test";
  const url = new URL(apiUrl);
  const configuredProject = config.match(/^project_id\s*=\s*"([^"\n]+)"\s*$/m)?.[1];
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)
    || url.port !== (ci ? "54321" : "55321") || configuredProject !== project) {
    throw new Error("Refusing gateway restart outside disposable test project.");
  }
  return { project, container: `supabase_kong_${project}` };
}

function restartTestGateway({ apiUrl, config, ci = process.env.CI === "true", exec = execFileSync }) {
  const { project, container } = testGatewayTarget({ apiUrl, config, ci });
  const label = exec("docker", ["inspect", "--format", '{{index .Config.Labels "com.supabase.cli.project"}}', container], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  if (label !== project) throw new Error("Refusing unexpected test gateway container.");
  exec("docker", ["restart", container], { stdio: "ignore" });
  exec("docker", ["exec", container, "sh", "-c",
    "i=0; while [ $i -lt 20 ]; do wget -q -T 2 -O /dev/null http://127.0.0.1:8000/auth/v1/health && exit 0; i=$((i+1)); sleep 1; done; exit 1",
  ], { stdio: "ignore" });
}

function resetLocalDatabase() {
  const local = localSupabaseEnvironment();
  const config = readFileSync(path.join(testWorkdir, "supabase/config.toml"), "utf8");
  if (process.env.CI !== "true" && !config.includes('project_id = "QuanLyVayCaNhan-C20-test"')) {
    throw new Error("Refusing reset outside disposable test project.");
  }
  testGatewayTarget({ apiUrl: local.API_URL, config });
  execFileSync("supabase", ["db", "reset", "--local"], { cwd: testWorkdir, env: environment, stdio: "inherit" });
  restartTestGateway({ apiUrl: local.API_URL, config });
}

if (require.main === module) {
  prepareTestEnvironment();
  console.log(testWorkdir);
}

module.exports = { testWorkdir, prepareTestEnvironment, localSupabaseEnvironment, resetLocalDatabase, restartTestGateway };
