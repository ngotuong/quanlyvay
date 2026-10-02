import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment } from "./helpers";

// Regression uses only the guarded disposable local database.
const out = resolve(process.cwd(), "../../docs/remediation-c75");
const evidence: Record<string, unknown> = { method: "Headless Chrome, local production build, synthetic isolated DB :55321", matrix: [], observations: {} };
const matrix: unknown[] = [];
const observations: Record<string, unknown> = {};
let loanId = "";
let generatedLoanId = "";
let password = "OwnerE2eTemp123";
test.beforeAll(async () => {
  mkdirSync(out, { recursive: true });
  const local = localSupabaseEnvironment();
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  let signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  if (signed.error) { password = "123456"; signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password }); }
  if (signed.error || !signed.data.user) throw signed.error || new Error("Missing synthetic owner");
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const updated = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user.id);
  if (updated.error) throw updated.error;
  const existing = await owner.from("counterparties").select("id").eq("name", "Đối tác synthetic C75").maybeSingle();
  if (existing.error) throw existing.error;
  const counterpart = existing.data ? { data: existing.data.id, error: null } : await owner.rpc("create_counterparty", { p_name: "Đối tác synthetic C75", p_notes: "Không phải dữ liệu thật" });
  if (counterpart.error) throw counterpart.error;
  for (let index = 0; index < 12; index++) {
    const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: counterpart.data, p_name: index === 11 ? "Đối tác synthetic C75 · Đi vay · 1.000.000 · Nhãn generated" : `C75 đối tác synthetic tên dài để phân biệt khoản cho vay · Cho vay · 1.000.000 · khoản ${index + 1}`, p_direction: index % 2 ? "BORROWING" : "LENDING", p_original_principal_vnd: 1000000, p_disbursement_date: "2026-08-01", p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: `c75-loan-${index}`, p_notes: null });
    if (loan.error) throw loan.error;
    if (!index) loanId = loan.data;
    if (index === 11) generatedLoanId = loan.data;
  }
});
test.afterAll(() => {
  // A targeted friction rerun retains the separately captured matrix; it does not claim to recapture it.
  const prior = !matrix.length && existsSync(resolve(out, "evidence.json")) ? JSON.parse(readFileSync(resolve(out, "evidence.json"), "utf8")) : {};
  writeFileSync(resolve(out, "evidence.json"), JSON.stringify({ ...evidence, matrix: matrix.length ? matrix : prior.matrix ?? [], observations: { ...prior.observations, ...observations } }, null, 2));
});
async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}
async function ready(page: Page, route: string) {
  await page.goto(route);
  await page.locator("#main-content").waitFor();
  await expect(page.locator(".content-loading")).toHaveCount(0);
}
async function capture(page: Page, name: string) { await page.screenshot({ path: resolve(out, name), fullPage: true }); }


test("C75 task identity, exact source set, focus and notifications hierarchy", async ({ page }) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    (window as Window & { __permissionRequests?: number }).__permissionRequests = 0;
    if ("Notification" in window) Notification.requestPermission = async () => {
      (window as Window & { __permissionRequests?: number }).__permissionRequests!++;
      return "denied";
    };
  });
  await login(page);
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    for (const width of [375,390,1440]) {
      await page.setViewportSize({ width, height: 844 });
      await ready(page, "/dashboard");
      const card = page.locator(".attention-card");
      const kpis = page.locator(".dashboard-primary-metrics");
      const kpiBox = (await kpis.boundingBox())!;
      const taskBox = (await card.boundingBox())!;
      expect(kpiBox.y + kpiBox.height).toBeLessThanOrEqual(taskBox.y);
      expect(await kpis.evaluate(e => Boolean(e.nextElementSibling?.querySelector(".attention-card")))).toBe(true);
      const count = Number(await card.locator(".count-badge").innerText());
      expect(count).toBeGreaterThanOrEqual(13);
      await expect(card.locator(".due-item")).toHaveCount(5);
      const initial = await card.locator(".due-item").evaluateAll(es => es.map(e => ({ href: e.getAttribute("href"), text: e.textContent })));
      const toggle = card.locator(".attention-toggle");
      const chart = page.locator(".cash-flow-card");
      const chartHeight = (await chart.boundingBox())!.height;
      await expect(toggle).toHaveText(`Xem toàn bộ ${count} việc cần xử lý`);
      await toggle.focus();
      const before = await page.evaluate(() => scrollY);
      await page.keyboard.press("Enter");
      await expect(card.locator(".due-item")).toHaveCount(count);
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBe(before);
      const all = await card.locator(".due-item").evaluateAll(es => es.map(e => ({ href: e.getAttribute("href"), text: e.textContent })));
      expect(new Set(all.map(e => e.href)).size).toBe(count);
      expect(all.slice(0,5)).toEqual(initial);
      const expandedChartHeight = (await chart.boundingBox())!.height;
      if (width === 1440) expect(Math.abs(expandedChartHeight - chartHeight)).toBeLessThan(1);
      const metrics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, clipped: [...document.querySelectorAll<HTMLElement>(".due-main strong,.due-main small,.due-value small")].filter(e => e.scrollWidth > e.clientWidth).length }));
      expect(metrics).toEqual({ overflow: false, clipped: 0 });
      await capture(page, `dashboard-${width}-${theme}.png`);
      await toggle.click();
      await expect(card.locator(".due-item")).toHaveCount(5);
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBe(before);
      const collapsedChartHeight = (await chart.boundingBox())!.height;
      if (width === 1440) expect(Math.abs(collapsedChartHeight - chartHeight)).toBeLessThan(1);
      await ready(page, "/notifications");
      const list = page.locator(".notification-list");
      const disclosure = page.locator(".push-settings-disclosure");
      expect(await list.evaluate((e) => Boolean(e.nextElementSibling?.matches(".push-settings-disclosure")))).toBe(true);
      await expect(disclosure).not.toHaveAttribute("open", "");
      const summary = disclosure.locator("summary");
      const markerClearance = await summary.evaluate(e => e.getBoundingClientRect().right - e.querySelector("small")!.getBoundingClientRect().right);
      expect(markerClearance).toBeGreaterThanOrEqual(28);
      await summary.focus(); await page.keyboard.press("Enter");
      await expect(page.getByLabel("Giờ nhận thông báo")).toBeVisible();
      await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", /true|false/);
      await page.keyboard.press("Enter");
      await expect(page.getByLabel("Giờ nhận thông báo")).not.toBeVisible();
      await capture(page, `notifications-${width}-${theme}.png`);
      expect(await page.evaluate(() => (window as Window & { __permissionRequests?: number }).__permissionRequests)).toBe(0);
      matrix.push({ width, theme, taskCount: count, chartHeight, expandedChartHeight, collapsedChartHeight, ...metrics });
    }
  }
});

test("C75 privacy metadata and distinct unread empty state", async ({ page }) => {
  await login(page);
  for (const [label, id] of [["custom",loanId],["generated",generatedLoanId]]) {
    await ready(page, `/loans/${id}`);
    await page.getByRole("button", { name: "Ẩn số tiền" }).click();
    await expect(page.locator(".loan-heading-metadata")).toHaveText(/Nội dung đang ẩn · Giải ngân/);
    await expect(page.locator(".loan-detail-heading")).not.toContainText("Đối tác synthetic C75");
    const attributes = await page.locator("[aria-label],[title]").evaluateAll(es => es.map(e => `${e.getAttribute("aria-label")} ${e.getAttribute("title")}`).join("\n"));
    expect(attributes).not.toContain("Đối tác synthetic C75");
    await capture(page, `privacy-${label}.png`);
    await page.getByRole("button", { name: "Hiển thị số tiền" }).click();
  }
  await ready(page, "/notifications?unread=true");
  const markAll = page.getByRole("button", { name: "Đánh dấu đã đọc", exact: true });
  if (await markAll.count()) await markAll.click();
  await expect(page.getByRole("heading", { name: "Bạn đã đọc hết thông báo" })).toBeVisible();
  await page.getByRole("link", { name: "Xem tất cả thông báo" }).click();
  await expect(page.locator(".notification-item").first()).toBeVisible();
  await expect(page.locator('.filter-pills a[aria-current="page"]')).toHaveText("Tất cả");
  // Unread fixture set is known nonempty; all-read is not misrepresented as a missing runner.
  const local = localSupabaseEnvironment();
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const profile = await admin.from("profiles").select("user_id").eq("username", "c6_owner_e2e").single();
  expect(profile.error).toBeNull();
  const removed = await admin.from("notifications").delete().eq("user_id", profile.data!.user_id);
  expect(removed.error).toBeNull();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Chưa có thông báo", exact: true })).toBeVisible();
  observations.emptyState = "unread empty copy, CTA and genuinely empty All verified";
});

test("C75 explicit back retains search and tab loading remains visible", async ({ page }) => {
  await login(page);
  await ready(page, "/loans");
  await page.getByLabel("Tên khoản vay hoặc đối tác").fill("C75");
  await expect(page).toHaveURL(/q=C75/);
  await page.locator(".loan-card").first().click();
  await expect(page).toHaveURL(/returnTo=/);
  await page.route("**/*", async route => {
    if (route.request().headers().rsc === "1") await new Promise(resolve => setTimeout(resolve,1800));
    await route.continue();
  });
  await page.getByRole("navigation", { name: "Nội dung khoản vay" }).getByRole("link", { name: "Lịch sử" }).click();
  await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "true");
  await expect(page).toHaveURL(/tab=history/);
  await page.unroute("**/*");
  await page.getByRole("link", { name: "Quay lại danh sách" }).click();
  await expect(page).toHaveURL(/q=C75/);
  await expect(page.getByLabel("Tên khoản vay hoặc đối tác")).toHaveValue("C75");
  observations.navigation = "explicit back preserves query; controlled RSC1800ms shows route progress";
});
