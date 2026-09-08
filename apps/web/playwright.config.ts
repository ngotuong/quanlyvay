import { defineConfig, devices } from "@playwright/test";
import { localSupabaseEnvironment } from "./test/e2e/helpers";

const local = localSupabaseEnvironment();

export default defineConfig({
  testDir: "./test/e2e",
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  globalSetup: "./test/e2e/global-setup.ts",
  globalTeardown: "./test/e2e/global-teardown.ts",
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    channel: "chrome",
  },
  webServer: {
    command: "pnpm exec next build && pnpm exec next start -p 3101",
    url: "http://127.0.0.1:3101/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.PUBLISHABLE_KEY || local.ANON_KEY,
      SUPABASE_SECRET_KEY: local.SECRET_KEY || local.SERVICE_ROLE_KEY,
      SYNC_SECRET: "e2e-sync-secret",
    },
  },
});
