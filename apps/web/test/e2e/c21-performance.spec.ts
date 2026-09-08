import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
import { localSupabaseEnvironment } from "./helpers";

const local = localSupabaseEnvironment();
const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

test.beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: "c21_navigation@auth.local",
    password: "C21Navigation123",
    email_confirm: true,
    user_metadata: {
      provisioned_by_app: "true",
      username: "c21_navigation",
      display_name: "C21 Navigation",
      app_role: "VIEWER",
    },
  });
  if (error || !data.user) throw error || new Error("C21 navigation fixture was not created.");
  const { error: profileError } = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", data.user.id);
  if (profileError) throw profileError;
});

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c21_navigation");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("C21Navigation123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test("loan list to detail navigation is measured and delayed navigation exposes loading feedback", async ({ page }, testInfo) => {
  await login(page);
  await page.goto("/loans");
  const firstCard = page.locator(".loan-card").first();
  await expect(firstCard).toBeVisible();

  const href = await firstCard.getAttribute("href");
  expect(href).toMatch(/^\/loans\/[0-9a-f-]+/);
  const started = performance.now();
  await firstCard.click();
  await expect(page.locator("#main-content h1").first()).toBeVisible();
  const navigationMs = performance.now() - started;
  const measurement = JSON.stringify({ navigationMs: Math.round(navigationMs), href }, null, 2);
  const measurementPath = testInfo.outputPath("loan-navigation.json");
  await writeFile(measurementPath, measurement);
  await testInfo.attach("loan-navigation", { path: measurementPath, contentType: "application/json" });

  let delayed = false;
  let navigationAllowed = false;
  await page.route("**/loans/**", async (route) => {
    if (route.request().resourceType() === "fetch" && !navigationAllowed) {
      await route.abort();
      return;
    }
    if (!delayed && route.request().resourceType() === "fetch") {
      delayed = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await route.continue();
  });
  await page.goto("/loans?c21Loading=1");
  const delayedCard = page.locator(".loan-card").first();
  await expect(delayedCard).toBeVisible();
  await page.waitForTimeout(200);
  navigationAllowed = true;
  const delayedNavigation = delayedCard.click();
  await expect(page.locator(".content-loading")).toBeVisible({ timeout: 1_000 });
  await delayedNavigation;
  await expect(page.locator("#main-content h1").first()).toBeVisible();
  expect(delayed).toBe(true);
});
