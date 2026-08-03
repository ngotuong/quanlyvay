import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";

export const repositoryRoot = path.resolve(__dirname, "../../../..");
const localProjectId = "QuanLyVayCaNhan";
const databaseContainer = `supabase_db_${localProjectId}`;
const kongContainer = `supabase_kong_${localProjectId}`;

function cliWorks() {
  return spawnSync("supabase", ["status", "-o", "env"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).status === 0;
}

function cleanLocalDatabaseThroughDocker() {
  execFileSync("docker", [
    "exec",
    databaseContainer,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    [
      "truncate table public.audit_logs, public.push_subscriptions, public.notifications,",
      "public.expenses, public.interest_periods, public.loan_lifecycle_events,",
      "public.transactions, public.loans, public.counterparties, public.profiles",
      "restart identity cascade; delete from auth.users;",
    ].join(" "),
  ], { cwd: repositoryRoot, stdio: "inherit" });
}

function localEnvironmentThroughDocker(): Record<string, string> {
  const kongConfig = execFileSync("docker", ["exec", kongContainer, "cat", "/home/kong/kong.yml"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const publishableKey = kongConfig.match(/headers\.apikey == '(sb_publishable_[^']+)'/)?.[1];
  const secretKey = kongConfig.match(/headers\.apikey == '(sb_secret_[^']+)'/)?.[1];
  if (!publishableKey || !secretKey) throw new Error("Không đọc được local Supabase API keys từ Kong.");
  return {
    API_URL: "http://127.0.0.1:54321",
    PUBLISHABLE_KEY: publishableKey,
    SECRET_KEY: secretKey,
    ANON_KEY: publishableKey,
    SERVICE_ROLE_KEY: secretKey,
  };
}

export function resetLocalDatabase() {
  if (cliWorks()) {
    execFileSync("supabase", ["db", "reset"], { cwd: repositoryRoot, stdio: "inherit" });
    return;
  }
  cleanLocalDatabaseThroughDocker();
}

export function localSupabaseEnvironment(): Record<string, string> {
  if (!cliWorks()) return localEnvironmentThroughDocker();
  const output = execFileSync("supabase", ["status", "-o", "env"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  return Object.fromEntries(output.split("\n")
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((match) => [match![1], match![2]]));
}
