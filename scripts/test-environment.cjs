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

function resetLocalDatabase() {
  localSupabaseEnvironment();
  const config = readFileSync(path.join(testWorkdir, "supabase/config.toml"), "utf8");
  if (process.env.CI !== "true" && !config.includes('project_id = "QuanLyVayCaNhan-C20-test"')) {
    throw new Error("Refusing reset outside disposable test project.");
  }
  execFileSync("supabase", ["db", "reset", "--local"], { cwd: testWorkdir, env: environment, stdio: "inherit" });
}

if (require.main === module) {
  prepareTestEnvironment();
  console.log(testWorkdir);
}

module.exports = { testWorkdir, prepareTestEnvironment, localSupabaseEnvironment, resetLocalDatabase };
