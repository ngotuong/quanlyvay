import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment } from "./helpers";

const capture = process.env.C78_EVIDENCE === "true";
const out = resolve(process.cwd(), "../../docs/remediation-c78");
const evidence: { matrix: unknown[]; focus: unknown[]; results: unknown[] } = { matrix: [], focus: [], results: [] };
const loans: { id: string; expected: number }[] = [];
let password = "OwnerE2eTemp123";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
function daysAgo(days: number) {
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * 86400000).toISOString().slice(0, 10);
}
test.beforeAll(async () => {
  if (capture) mkdirSync(out, { recursive: true });
  const local = localSupabaseEnvironment();
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  let signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  if (signed.error) { password = "123456"; signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password }); }
  if (signed.error || !signed.data.user) throw signed.error || new Error("Missing synthetic owner");
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const updated = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user.id);
  if (updated.error) throw updated.error;
  const existing = await owner.from("counterparties").select("id").eq("name", "Đối tác synthetic C78").maybeSingle();
  if (existing.error) throw existing.error;
  const counterparty = existing.data ? { data: existing.data.id, error: null } : await owner.rpc("create_counterparty", { p_name: "Đối tác synthetic C78", p_notes: "Fixture local riêng; không phải dữ liệu thật" });
  if (counterparty.error) throw counterparty.error;
  for (const [days, expected] of [[0, 1], [35, 2], [65, 3], [335, 12]]) {
    const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: counterparty.data, p_name: `C78 kỳ lãi ${expected}`, p_direction: "LENDING", p_original_principal_vnd: 87654321, p_disbursement_date: daysAgo(days), p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: `c78-period-${expected}`, p_notes: null });
    if (loan.error) throw loan.error;
    const calculated = await owner.rpc("calculate_loan", { p_loan_id: loan.data, p_as_of_date: today });
    if (calculated.error) throw calculated.error;
    expect(calculated.data.periods).toHaveLength(expected);
    loans.push({ id: loan.data, expected });
  }
});
test.afterAll(() => { if (capture) writeFileSync(resolve(out, "browser-evidence.json"), JSON.stringify({ method: "Local production build, headless Chrome, synthetic guarded DB :55322; no remote rollout", ...evidence }, null, 2)); });
test.afterEach(async ({ page }, info) => {
  // Failure location/status only; traces/screenshots remain in ignored Playwright artifacts.
  const active = info.status !== info.expectedStatus && !page.isClosed() ? await page.evaluate(() => ({ tag: document.activeElement?.tagName, close: document.activeElement?.hasAttribute("data-bottom-sheet-close") })).catch(() => null) : null;
  evidence.results.push({ title: info.title, status: info.status, activeOnFailure: active, failures: info.errors.map(() => ({ file: info.file, line: info.line })) });
});
async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}
async function hide(page: Page) { await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)" }).first().click(); }
async function show(page: Page) { await page.getByRole("button", { name: "Hiển thị số tiền" }).first().click(); }

test("C78 privacy scale, tooltips, zero/empty and period boundary matrix", async ({ page }) => {
  test.setTimeout(180000);
  await login(page);
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 1440]) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/dashboard?from=${daysAgo(360)}&to=${today}&preset=custom`);
    await expect(page.locator(".dashboard-primary-metrics")).toBeVisible();
    await expect(page.locator(".attention-card")).toBeVisible();
    const kpis = (await page.locator(".dashboard-primary-metrics").boundingBox())!;
    const tasks = (await page.locator(".attention-card").boundingBox())!;
    expect(kpis.y + kpis.height).toBeLessThanOrEqual(tasks.y);
    const card = page.locator(".cash-flow-card");
    const axis = card.locator(".chart-y-axis");
    await expect(axis).toBeVisible();
    const before = await axis.innerText();
    const barCount = await card.locator(".cash-bar-control").count();
    expect(barCount).toBeGreaterThan(0);
    await card.locator(".cash-bar-control").first().click();
    await expect(card.locator('[role="tooltip"][aria-hidden="false"]')).toBeVisible();
    await hide(page);
    await expect(axis.locator(":scope > span")).toHaveText(["—", "—", "—"]);
    await expect(card.locator(".cash-bar-control,[role=tooltip]")).toHaveCount(0);
    await card.locator("summary").click();
    await expect(card.locator('[aria-label*="₫"],[title*="₫"]')).toHaveCount(0);
    const money = /\d+(?:\.\d{3})*[\s\u00a0\u202f]*₫/;
    expect(await card.innerText()).not.toMatch(money);
    expect(await card.ariaSnapshot()).not.toMatch(money);
    if (capture) await card.screenshot({ path: resolve(out, `dashboard-hidden-${width}-${theme}.png`), style: ".mobile-header,.mobile-nav-wrap { visibility: hidden !important; }" });
    await show(page);
    await expect(axis).toHaveText(before.replaceAll(/\s+/g, " ").trim(), { useInnerText: true });
    await expect(card.locator(".cash-bar-control")).toHaveCount(barCount);
    evidence.matrix.push({ route: "dashboard", width, theme, beforeAxis: before, hiddenAxis: "— / — / —", restored: true, tooltipRemoved: true, kpisAboveTasks: true });
    for (const loan of loans) {
      await page.goto(`/loans/${loan.id}?tab=interest`);
      const chart = page.locator(".period-chart-card");
      await expect(chart).toBeVisible();
      const marks = chart.locator(loan.expected < 3 ? ".period-summary-bar" : ".period-chart-column");
      await expect(marks).toHaveCount(loan.expected < 3 ? 1 : loan.expected);
      const chartText = await chart.innerText();
      await hide(page);
      await expect(chart).toHaveCount(0);
      await expect(page.locator('#main-content [aria-label*="₫"],#main-content [title*="₫"]')).toHaveCount(0);
      expect(await page.locator("#main-content").innerText()).not.toMatch(money);
      expect(await page.locator("#main-content").ariaSnapshot()).not.toMatch(money);
      await show(page);
      await expect(chart).toHaveText(chartText.replaceAll(/\s+/g, " ").trim(), { useInnerText: true });
      evidence.matrix.push({ route: "loan-period", width, theme, periods: loan.expected, hiddenChartRemoved: true, restored: true });
    }
    // No transactions in this historical range: zero rows use the explicit empty state.
    await page.goto("/dashboard?from=2000-01-01&to=2000-01-31&preset=custom");
    await expect(page.locator(".cash-flow-card")).toContainText("Chưa có dòng tiền trong kỳ");
    await hide(page);
    await expect(page.locator(".cash-flow-card .chart-y-axis,.cash-flow-card .cash-bar-control")).toHaveCount(0);
    await show(page);
    evidence.matrix.push({ route: "dashboard-zero", width, theme, masked: true });
  }
});

test("C78 same C77 eager focus sequence passes 32 cycles without extra waits", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  for (const motion of ["no-preference", "reduce"] as const) for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: motion });
    for (let iteration = 0; iteration < 8; iteration++) {
      const trigger = page.getByRole("button", { name: "Thêm", exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Tiện ích khác" });
      const close = dialog.getByRole("button", { name: "Đóng tiện ích khác" });
      await expect(close).toBeFocused();
      const last = dialog.getByRole("link").last();
      await last.focus(); await expect(last).toBeFocused({ timeout: 1000 });
      await page.keyboard.press("Tab"); await expect(close).toBeFocused({ timeout: 1000 });
      await page.keyboard.press("Shift+Tab"); await expect(last).toBeFocused({ timeout: 1000 });
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      evidence.focus.push({ width, motion, iteration, eager: true, wrapAndReturn: true });
    }
  }
});

test("C78 keyboard quick close/reopen and navigation cancel pending focus work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const trigger = page.getByRole("button", { name: "Thêm", exact: true });
  const dialog = page.getByRole("dialog", { name: "Tiện ích khác" });
  await trigger.focus(); await page.keyboard.press("Enter");
  await expect(dialog.getByRole("button", { name: "Đóng tiện ích khác" })).toBeFocused();
  // Same JS task, before a frame: actual registered close/open handlers, no timer wait.
  await page.evaluate(() => {
    const sheet = document.querySelector<HTMLDialogElement>(".mobile-more-sheet[open]")!;
    sheet.querySelector<HTMLButtonElement>("[data-bottom-sheet-close]")!.click();
    document.querySelector<HTMLButtonElement>(`button[aria-controls="${sheet.id}"]`)!.click();
    sheet.querySelector<HTMLAnchorElement>('a[href="/settings"]')!.focus();
  });
  await expect(dialog.getByRole("link").last()).toBeFocused({ timeout: 1000 });
  await page.keyboard.press("Escape"); await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  // Start animated close and SPA navigation in one task; pathname must cancel old timer.
  await page.evaluate(() => {
    const sheet = document.querySelector<HTMLDialogElement>(".mobile-more-sheet[open]")!;
    sheet.querySelector<HTMLButtonElement>("[data-bottom-sheet-close]")!.click();
    sheet.querySelector<HTMLAnchorElement>('a[href="/settings"]')!.click();
  });
  await expect(page).toHaveURL(/\/settings/);
  await expect(dialog).toBeHidden(); await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  const last = dialog.getByRole("link").last();
  await last.focus(); await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Đóng tiện ích khác" })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
  evidence.focus.push({ keyboardOpen: true, closeBeforeFrameReopen: true, pendingCloseNavigation: true });
});
