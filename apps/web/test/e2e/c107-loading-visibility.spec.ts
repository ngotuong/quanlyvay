import { expect, test, type Browser, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { localSupabaseEnvironment } from "./helpers";

const base = "http://127.0.0.1:3101";
const capture = process.env.C107_EVIDENCE === "true";
const evidenceDirectory = resolve(process.cwd(), "../../docs/loading-c107");
const evidence: Record<string, unknown> = {};

test.beforeAll(async () => {
  if (capture) mkdirSync(evidenceDirectory, { recursive: true });
  const local = localSupabaseEnvironment();
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const profile = await admin.from("profiles").select("user_id").eq("username", "c6_owner_e2e").single();
  expect(profile.error).toBeNull();
  expect((await admin.auth.admin.updateUserById(profile.data!.user_id, { password: "OwnerE2eTemp123" })).error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", profile.data!.user_id)).error).toBeNull();
});

test.afterAll(() => {
  if (capture) writeFileSync(resolve(evidenceDirectory, "browser-evidence.json"), JSON.stringify(evidence, null, 2));
});

async function waitUntilReady(page: Page) {
  await expect(page.locator(".initial-app-loading,.content-loading")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-application-ready", "true");
}

async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: base }]);
  await page.goto(`${base}/login`);
  await waitUntilReady(page);
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("OwnerE2eTemp123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await waitUntilReady(page);
}

async function verifyInitialLoading(browser: Browser, theme: "light" | "dark", width: 390 | 1440) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: theme === "light" ? "dark" : "light",
    reducedMotion: "reduce",
  });
  await context.addCookies([{ name: "qlv_theme", value: theme, url: base }]);
  const page = await context.newPage();
  await page.setExtraHTTPHeaders({ "x-e2e-auth-delay-ms": "1200" });
  const startedAt = Date.now();
  const navigation = page.goto(`${base}/login`);
  const loading = page.locator(".application-boot-loading");
  await expect(loading).toBeVisible({ timeout: 1500 });
  const visibleAfterMs = Date.now() - startedAt;
  await expect(loading).toHaveAttribute("data-loading-variant", "initial");
  await expect(loading.getByRole("heading", { name: "Quản Lý Vay", exact: true })).toBeVisible();
  await expect(loading).toContainText("Đang mở không gian tài chính");
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  expect(await loading.locator(".initial-app-loading-track > span").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  const layout = await loading.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      position: style.position,
      background: style.backgroundColor,
      width: rect.width,
      height: rect.height,
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  expect(layout.position).toBe("fixed");
  expect(layout.width).toBe(width);
  expect(layout.height).toBeGreaterThanOrEqual(900);
  expect(layout.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(layout.overflow).toBeLessThanOrEqual(0);
  await expect(page.getByText("Đối tác thông báo E2E", { exact: true })).toHaveCount(0);
  if (capture) await page.screenshot({ path: resolve(evidenceDirectory, `initial-${width}-${theme}.png`) });
  await navigation;
  await expect(page.getByRole("heading", { name: "Đăng nhập an toàn" })).toBeVisible();
  await expect(loading).toHaveCount(0);
  evidence[`initial-${width}-${theme}`] = { visibleAfterMs, hiddenAfterMs: Date.now() - startedAt, layout };
  await context.close();
}

test("C107 first paint is branded, private and stable on mobile and desktop", async ({ browser }) => {
  test.setTimeout(120_000);
  for (const theme of ["light", "dark"] as const) {
    for (const width of [390, 1440] as const) await verifyInitialLoading(browser, theme, width);
  }
});

test("C107 warm resume restores visible feedback without motion", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  await waitUntilReady(page);
  await page.evaluate(() => {
    let state: DocumentVisibilityState = "hidden";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    (window as typeof window & { setC107Visibility?: (value: DocumentVisibilityState) => void }).setC107Visibility = (value) => { state = value; };
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(1100);
  const startedAt = Date.now();
  await page.evaluate(() => {
    (window as typeof window & { setC107Visibility?: (value: DocumentVisibilityState) => void }).setC107Visibility?.("visible");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const loading = page.locator('.application-boot-loading[data-loading-variant="resume"]');
  await expect(loading).toBeVisible();
  await expect(loading).toContainText("Đang khôi phục phiên làm việc");
  expect(await loading.locator(".initial-app-loading-track > span").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  if (capture) await page.screenshot({ path: resolve(evidenceDirectory, "warm-resume-390-light.png") });
  await expect(loading).toHaveCount(0);
  const visibleDurationMs = Date.now() - startedAt;
  expect(visibleDurationMs).toBeGreaterThanOrEqual(450);
  expect(visibleDurationMs).toBeLessThan(2500);
  evidence.warmResume = { visibleDurationMs, reducedMotion: true };
});

test("C107 route feedback persists through streamed loading and guards replaced content", async ({ page }) => {
  test.setTimeout(120_000);
  let delayRsc = false;
  const pendingRoutes = new Set<Promise<void>>();
  await page.route("**/*", (route) => {
    const pending = (async () => {
      if (route.request().headers()["next-router-prefetch"]) {
        await route.abort("aborted");
        return;
      }
      if (delayRsc && route.request().headers().rsc === "1") await new Promise((resolveDelay) => setTimeout(resolveDelay, 1100));
      await route.continue();
    })();
    pendingRoutes.add(pending);
    return pending.finally(() => pendingRoutes.delete(pending));
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page);
  delayRsc = true;
  const routes = [
    ["Khoản vay", "/loans", /\/loans$/],
    ["Đối tác", "/counterparties", /\/counterparties$/],
    ["Thông báo", "/notifications", /\/notifications$/],
    ["Tổng quan", "/dashboard", /\/dashboard$/],
  ] as const;
  const measurements: Array<Record<string, unknown>> = [];
  for (const [label, href, destination] of routes) {
    const startedAt = Date.now();
    await page.locator(`a[href="${href}"]`).filter({ visible: true }).click();
    const feedback = page.locator(".navigation-feedback-message");
    await expect(feedback).toBeVisible();
    await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "true");
    await expect(page.locator("html")).toHaveAttribute("data-navigation-pending", "true");
    await expect(page.locator("#main-content")).toHaveAttribute("aria-busy", "true");
    await expect(page.locator(".navigation-feedback-blocker")).toBeVisible();
    await expect(page).toHaveURL(destination);
    await expect(feedback).toBeVisible();
    if (capture && label === "Khoản vay") await page.screenshot({ path: resolve(evidenceDirectory, "route-feedback-390-light.png") });
    await expect(page.locator(".content-loading")).toHaveCount(0);
    await expect(feedback).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveAttribute("data-navigation-pending", "true");
    await expect(page.locator("#main-content")).not.toHaveAttribute("aria-busy", "true");
    await expect(page.locator(".navigation-feedback-blocker")).toHaveCount(0);
    const durationMs = Date.now() - startedAt;
    expect(durationMs).toBeGreaterThanOrEqual(1000);
    measurements.push({ label, durationMs });
  }
  delayRsc = false;
  while (pendingRoutes.size) await Promise.all(pendingRoutes);
  await page.unrouteAll({ behavior: "wait" });
  evidence.routeTransitions = measurements;
});

test("C108 slow startup retains recovery feedback instead of uncovering an empty page", async ({ page }) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await page.setExtraHTTPHeaders({ "x-e2e-auth-delay-ms": "10000" });
  const navigation = page.goto("/login");
  const loading = page.locator(".application-boot-loading");
  await expect(loading).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-application-loading", "true");
  // Advance the client deadline while the real server is still resolving Auth.
  await page.clock.fastForward(16_000);
  await expect(loading).toBeVisible();
  await expect(loading.getByRole("button", { name: "Tải lại trang" })).toBeVisible();
  await expect(loading).toHaveAttribute("data-loading-phase", "visible");
  await navigation;
  await expect(page.getByRole("heading", { name: "Đăng nhập an toàn" })).toBeVisible();
  await page.clock.resume();
  await expect(loading).toHaveCount(0);
});

test("C108 authenticated cold launch has continuous loading-to-content coverage", async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.addInitScript(() => {
    const samples: { loading: boolean; content: boolean }[] = [];
    Object.assign(window, { c108PaintSamples: samples });
    let seenLoading = false;
    const sample = () => {
      const boot = document.querySelector(".application-boot-loading");
      const loading = !!boot?.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
      const main = [...document.querySelectorAll<HTMLElement>("#main-content")].find(e => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
      const content = !!main?.innerText.trim() && ![...main.querySelectorAll(".content-loading")].some(e => e.checkVisibility());
      seenLoading ||= loading;
      if (seenLoading) samples.push({ loading, content });
      if (!seenLoading || loading || !content) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.setExtraHTTPHeaders({ "x-e2e-auth-delay-ms": "1200" });
  await page.reload();
  await waitUntilReady(page);
  const samples = await page.evaluate(() => (window as typeof window & { c108PaintSamples: { loading: boolean; content: boolean }[] }).c108PaintSamples);
  expect(samples.length).toBeGreaterThan(2);
  expect(samples.some(s => s.loading && !s.content)).toBe(true);
  expect(samples.at(-1)).toEqual({ loading: false, content: true });
  expect(samples.filter(s => !s.loading && !s.content)).toEqual([]);
});
