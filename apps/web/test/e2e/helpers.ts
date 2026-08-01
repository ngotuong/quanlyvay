import { execFileSync } from "node:child_process";
import path from "node:path";

export const repositoryRoot = path.resolve(__dirname, "../../../..");

export function resetLocalDatabase() {
  execFileSync("supabase", ["db", "reset"], { cwd: repositoryRoot, stdio: "inherit" });
}

export function localSupabaseEnvironment() {
  const output = execFileSync("supabase", ["status", "-o", "env"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return Object.fromEntries(
    output.split("\n").map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/)).filter(Boolean).map((match) => [match![1], match![2]]),
  );
}
