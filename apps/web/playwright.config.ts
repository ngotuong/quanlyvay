import { execFileSync } from "node:child_process";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const repositoryRoot = path.resolve(__dirname, "../..");
const output = execFileSync("supabase", ["status", "-o", "env"], {
  cwd: repositoryRoot,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
const local = Object.fromEntries(
  output.split("\n").map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/)).filter(Boolean).map((match) => [match![1], match![2]]),
);

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  globalSetup: "./test/e2e/global-setup.ts",
  globalTeardown: "./test/e2e/global-teardown.ts",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    channel: "chrome",
  },
  webServer: {
    command: "pnpm exec next dev -p 3100",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.PUBLISHABLE_KEY || local.ANON_KEY,
      SUPABASE_SECRET_KEY: local.SECRET_KEY || local.SERVICE_ROLE_KEY,
    },
  },
});
