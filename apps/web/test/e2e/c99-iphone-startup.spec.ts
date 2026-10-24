import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";

const base = "http://127.0.0.1:3101";
const password = readFileSync("test/e2e/global-setup.ts", "utf8").match(/password: "([^"]+)"/)![1];
test.beforeAll(async () => {
  test.setTimeout(300000);
  if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
  await globalSetup();
  const local = localSupabaseEnvironment();
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("username", "c6_owner_e2e")).error).toBeNull();
});

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator(".content-loading")).toHaveCount(0);
}

test("C99 iOS launch image matches the screen and follows manual/system theme changes", async ({ browser }) => {
  test.setTimeout(120000);
  // Chromium screen emulation verifies metadata selection, not iOS launch behavior.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: "light" });
  const page = await context.newPage();
  await login(page);
  await page.goto("/settings");
  const links = page.locator('link[rel="apple-touch-startup-image"]');
  await expect(links).toHaveCount(48);
  for (const [preference, device, expected] of [["Tối", "light", "dark"], ["Sáng", "dark", "light"], ["Theo thiết bị", "light", "light"], ["Theo thiết bị", "dark", "dark"]] as const) {
    await page.emulateMedia({ colorScheme: device });
    await page.getByRole("radio", { name: preference, exact: true }).check();
    await expect.poll(() => links.evaluateAll(es => es.filter(e => matchMedia((e as HTMLLinkElement).media).matches).map(e => (e as HTMLLinkElement).href))).toEqual([`${base}/icons/startup/390-844-3-portrait-${expected}.png`]);
    const response = await page.request.get(`/icons/startup/390-844-3-portrait-${expected}.png`);
    expect(response.ok()).toBe(true);
    const image = await response.body();
    expect(image.subarray(1, 4).toString()).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(1170);
    expect(image.readUInt32BE(20)).toBe(2532);
  }
  await context.close();
});

test("C99 standalone offline navigation shows a public error and never caches financial pages", async ({ page, context }) => {
  test.setTimeout(60000);
  await login(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await expect.poll(() => page.evaluate(async () => Boolean(await (await caches.open("qlv-public-offline-v1")).match("/offline.html")))).toBe(true);
  await context.setOffline(true);
  const response = await page.goto("/dashboard");
  expect(response?.status()).toBe(503);
  await expect(page.getByRole("heading", { name: "Đang mất kết nối", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Thử lại", exact: true })).toBeVisible();
  await expect(page.locator(".vnd-number,.app-nav,form")).toHaveCount(0);
  expect(await page.evaluate(async () => {
    const cache = await caches.open("qlv-public-offline-v1");
    return (await cache.keys()).map(r => new URL(r.url).pathname);
  })).toEqual(["/offline.html"]);
  await context.setOffline(false);
  await page.getByRole("link", { name: "Thử lại", exact: true }).click();
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator(".initial-app-loading,.content-loading")).toHaveCount(0);
  await expect(page.locator(".app-nav").first()).toBeVisible();
});


test("C99 navigation timing is bounded anonymous metadata and tracks a fresh delayed read", async ({ page }) => {
  test.setTimeout(60000);
  // Install before login so the controlled delayed navigation cannot consume a
  // warmed partial-prefetch shell instead of performing the fresh 2s read.
  await page.route("**/*", route => route.request().headers()["next-router-prefetch"] ? route.abort("aborted") : route.continue());
  await login(page);
  await page.setExtraHTTPHeaders({ "x-e2e-auth-delay-ms": "2000" });
  await page.getByRole("link", { name: "Khoản vay", exact: true }).filter({ visible: true }).click();
  await expect(page.locator(".content-loading")).toHaveCount(0);
  const output = page.locator("output[data-navigation-timing]");
  await expect.poll(async () => {
    const rows = JSON.parse((await output.getAttribute("data-navigation-timing")) ?? "[]");
    return rows.some((r: { kind: string; route: string; durationMs: number }) => r.kind === "content" && r.route === "loans" && r.durationMs >= 2000);
  }).toBe(true);
  const samples = JSON.parse((await output.getAttribute("data-navigation-timing"))!);
  expect(samples.length).toBeLessThanOrEqual(10);
  for (const sample of samples) {
    expect(Object.keys(sample).every(key => ["kind", "route", "durationMs", "ttfbMs", "bodyMs", "bytes"].includes(key))).toBe(true);
    expect(["document", "response", "content"]).toContain(sample.kind);
    expect(["dashboard", "loans", "counterparties", "notifications", "expenses", "settings", "audit", "loan-detail"]).toContain(sample.route);
    expect(Number.isFinite(sample.durationMs)).toBe(true);
    expect(sample.durationMs).toBeGreaterThanOrEqual(0);
  }
  await expect(output).toBeHidden();
});
