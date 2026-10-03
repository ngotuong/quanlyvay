import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment } from "./helpers";

// Read-only browser audit; fixtures exist only in the guarded disposable local DB.
test.skip(process.env.C77_AUDIT !== "true", "C77 evidence audit opt-in");
const out = resolve(process.cwd(), "../../docs/audit-c77");
const evidence: { matrix: unknown[]; focus: unknown[] } = { matrix: [], focus: [] };
let loanId = "";
test.beforeAll(async () => {
  if (process.env.C77_AUDIT !== "true") return;
  mkdirSync(out, { recursive: true });
  const local = localSupabaseEnvironment();
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  const sign = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password: "OwnerE2eTemp123" });
  if (sign.error || !sign.data.user) throw sign.error || new Error("Missing synthetic owner");
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const profile = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", sign.data.user.id);
  if (profile.error) throw profile.error;
  const loan = await owner.from("loans").select("id").eq("name", "Khoản thông báo E2E").single();
  if (loan.error) throw loan.error;
  loanId = loan.data.id;
});
test.afterAll(() => { if (process.env.C77_AUDIT === "true") writeFileSync(resolve(out, "browser-evidence.json"), JSON.stringify({ ...evidence, focusNote: "Audit completion is not a product PASS; failures are retained by stage, unchanged 1s assertions in eager and two-frame settled experiments." }, null, 2)); });
async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("OwnerE2eTemp123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test("C77 privacy chart matrix records current leakage without fixing it", async ({ page }) => {
  test.setTimeout(180000);
  await login(page);
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 1440]) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dashboard?from=2026-08-01&to=2026-10-03&preset=custom");
    const card = page.locator(".cash-flow-card");
    await expect(card.locator(".chart-y-axis")).toBeVisible();
    const bar = card.locator(".cash-bar-control").first();
    await bar.click();
    await expect(card.locator('[role="tooltip"][aria-hidden="false"]')).toBeVisible();
    const beforeAxis = await card.locator(".chart-y-axis").innerText();
    await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)" }).first().click();
    await expect(card.locator(".cash-bar-control")).toHaveCount(0);
    await expect(card.locator('[role="tooltip"]')).toHaveCount(0);
    await card.locator("summary").click();
    const visibleAxis = await card.locator(".chart-y-axis").innerText();
    const attrMoney = await card.locator('[aria-label*="₫"],[title*="₫"]').count();
    const tableText = await card.locator("table").innerText();
    const snapshot = await card.ariaSnapshot();
    evidence.matrix.push({ route: "dashboard", width, theme, beforeAxis, visibleAxis, axisLeaks: visibleAxis === beforeAxis, attrMoney, tableMasks: !tableText.includes("1.000.000"), accessibleAxisLeaks: snapshot.includes("1 tr") });
    await card.screenshot({ path: resolve(out, `dashboard-hidden-${width}-${theme}.png`) });
    await page.getByRole("button", { name: "Hiển thị số tiền" }).first().click();
    await expect(card.locator(".cash-bar-control").first()).toBeVisible();
    await page.goto(`/loans/${loanId}?tab=interest`);
    // Actual tab value is taken from the route links, not assumed.
    const periodLink = page.getByRole("link", { name: "Kỳ lãi", exact: true });
    if (await periodLink.count()) await periodLink.click();
    await expect(page.locator(".period-chart-card")).toBeVisible();
    const count = await page.locator(".period-chart-column").count();
    await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)" }).first().click();
    await expect(page.locator(".period-chart-card")).toHaveCount(0);
    evidence.matrix.push({ route: "loan-period", width, theme, visibleColumns: count, hiddenChartRemoved: true });
    await page.locator("#main-content").screenshot({ path: resolve(out, `loan-hidden-${width}-${theme}.png`) });
    await page.getByRole("button", { name: "Hiển thị số tiền" }).first().click();
  }
});

test("C77 focus stress captures boundary events and distinguishes timing", async ({ page }) => {
  test.setTimeout(180000);
  await login(page);
  await page.evaluate(() => {
    const w = window as Window & { c77Events?: unknown[] };
    w.c77Events = [];
    const describe = (e: EventTarget | null) => e instanceof HTMLElement ? { tag: e.tagName, close: e.hasAttribute("data-bottom-sheet-close"), href: e.getAttribute("href") } : null;
    for (const event of ["keydown", "focusin"]) document.addEventListener(event, e => { w.c77Events!.push({ event, time: performance.now(), key: e instanceof KeyboardEvent ? e.key : null, target: describe(e.target), active: describe(document.activeElement) }); }, true);
  });
  for (const motion of ["no-preference", "reduce"] as const) for (const width of [375, 390]) for (const timing of ["eager", "settled"] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: motion });
    for (let iteration = 0; iteration < 8; iteration++) {
      const trigger = page.getByRole("button", { name: "Thêm", exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Tiện ích khác" });
      const close = dialog.getByRole("button", { name: "Đóng tiện ích khác" });
      await expect(close).toBeFocused();
      if (timing === "settled") await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const last = dialog.getByRole("link").last();
      let stage = "last-focus";
      let failure: string | null = null;
      try {
        await last.focus(); await expect(last).toBeFocused({ timeout: 1000 });
        stage = "Tab-wrap";
        await page.keyboard.press("Tab"); await expect(close).toBeFocused({ timeout: 1000 });
        stage = "Shift-Tab-wrap";
        await page.keyboard.press("Shift+Tab"); await expect(last).toBeFocused({ timeout: 1000 });
      } catch { failure = stage; }
      const events = await page.evaluate(() => { const w = window as Window & { c77Events?: unknown[] }; const events = w.c77Events; w.c77Events = []; return events; });
      evidence.focus.push({ width, motion, timing, iteration, failure, events });
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
  }
  await page.goto("/counterparties");
  for (let iteration = 0; iteration < 10; iteration++) {
    const trigger = page.getByRole("button", { name: "Thêm đối tác", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Thêm đối tác", exact: true });
    const close = dialog.getByRole("button", { name: "Đóng thêm đối tác" });
    const last = dialog.locator('button:not([disabled]),input:not([disabled]),textarea:not([disabled])').last();
    await last.focus(); await page.keyboard.press("Tab"); await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab"); await expect(last).toBeFocused();
    await page.keyboard.press("Escape"); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
    evidence.focus.push({ drawer: "counterparty", iteration, wrap: true, escapeReturn: true });
  }
});
