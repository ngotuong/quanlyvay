import { execFileSync } from "node:child_process";
import path from "node:path";

export const repositoryRoot = path.resolve(__dirname, "../../../..");
const supabaseEnvironment = {
  ...process.env,
  SUPABASE_PROFILE: process.env.SUPABASE_PROFILE?.trim() || "supabase",
};

export function resetLocalDatabase() {
  execFileSync("supabase", ["db", "reset"], {
    cwd: repositoryRoot,
    env: supabaseEnvironment,
    stdio: "inherit",
  });
}

export function localSupabaseEnvironment(): Record<string, string> {
  const output = execFileSync("supabase", ["status", "-o", "env"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: supabaseEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    });
  return Object.fromEntries(output.split("\n")
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((match) => [match![1], match![2]]));
}
