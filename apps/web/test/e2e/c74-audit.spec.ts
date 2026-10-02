import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment } from "./helpers";

// Opt-in observation harness. Product defects are recorded, not hidden by PASS assertions.
const out = resolve(process.cwd(), "../../docs/audit-c74");
const evidence: Record<string, unknown> = { method: "Headless Chrome, local production build, synthetic isolated DB :55321", matrix: [], observations: {} };
const matrix: unknown[] = [];
const observations: Record<string, unknown> = {};
let loanId = "";
const password = "OwnerE2eTemp123";
test.beforeAll(async () => {
  if (process.env.C74_AUDIT !== "true") return;
  mkdirSync(out, { recursive: true });
  const local = localSupabaseEnvironment();
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  if (signed.error || !signed.data.user) throw signed.error || new Error("Missing synthetic owner");
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const updated = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user.id);
  if (updated.error) throw updated.error;
  const counterpart = await owner.rpc("create_counterparty", { p_name: "Đối tác synthetic C74", p_notes: "Không phải dữ liệu thật" });
  if (counterpart.error) throw counterpart.error;
  for (let index = 0; index < 12; index++) {
    const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: counterpart.data, p_name: `C74 đối tác synthetic tên dài để phân biệt khoản cho vay · Cho vay · 1.000.000 · khoản ${index + 1}`, p_direction: index % 2 ? "BORROWING" : "LENDING", p_original_principal_vnd: 1000000, p_disbursement_date: "2026-08-01", p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: `c74-loan-${index}`, p_notes: null });
    if (loan.error) throw loan.error;
    if (!index) loanId = loan.data;
  }
});
test.afterAll(() => {
  if (process.env.C74_AUDIT !== "true") return;
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

test("C74 journey and viewport observation", async ({ page }) => {
  test.skip(process.env.C74_AUDIT !== "true", "Opt-in synthetic audit");
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await login(page);
  const routes = ["/dashboard", "/loans", "/counterparties", "/expenses", "/notifications?unread=true", ...["overview", "interest", "history", "settings"].map(tab => `/loans/${loanId}?tab=${tab}`)];
  for (const theme of (process.env.C74_FRICTION_ONLY === "true" ? [] : ["light", "dark"]) as ("light" | "dark")[]) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [375, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await ready(page, route);
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          h1: document.querySelector("h1")?.textContent,
          clippedTasks: [...document.querySelectorAll<HTMLElement>(".due-main strong,.due-main small,.due-value small")].filter(e => e.scrollWidth > e.clientWidth).map(e => ({ text: e.textContent, client: e.clientWidth, scroll: e.scrollWidth })),
          focus: document.activeElement?.tagName,
        }));
        const label = route.includes(loanId) ? `detail-${route.split("=")[1]}` : route.slice(1).replaceAll("?", "-");
        matrix.push({ route: label, width, theme, ...metrics });
        if ([390,1440].includes(width)) await capture(page, `${label}-${width}-${theme}.png`);
      }
    }
  }
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page, "/loans");
  await page.getByLabel("Tên khoản vay hoặc đối tác").fill("C74");
  await expect(page).toHaveURL(/q=C74/);
  await page.locator(".loan-card").first().click();
  await expect(page).toHaveURL(/returnTo=/);
  await page.getByRole("navigation", { name: "Nội dung khoản vay" }).getByRole("link", { name: "Lịch sử" }).click();
  await expect(page).toHaveURL(/tab=history/);
  await page.getByRole("link", { name: "Quay lại danh sách" }).click();
  await expect(page).toHaveURL(/q=C74/);
  observations.explicitBack = { retainedQuery: await page.getByLabel("Tên khoản vay hoặc đối tác").inputValue(), steps: 4 };
  await ready(page, "/dashboard");
  const all = page.locator(".attention-all-link");
  observations.dashboardAll = { count: await all.count(), text: await all.textContent(), href: await all.getAttribute("href") };
  await all.click(); await expect(page).toHaveURL(/\/loans$/);
  observations.dashboardDestinationHeading = await page.locator("h1").textContent();
  await ready(page, `/loans/${loanId}`);
  await page.getByRole("button", { name: "Ẩn số tiền" }).click();
  observations.privacyHeading = await page.locator(".loan-detail-heading p").innerText();
  await capture(page, "privacy-detail-390.png");
  await page.getByRole("button", { name: "Hiển thị số tiền" }).click();
  await ready(page, "/counterparties");
  await page.getByLabel("Tìm tên hoặc ghi chú đối tác").fill("C74");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(page).toHaveURL(/q=C74/);
  await expect(page.locator(".counterparty-card").first()).toBeVisible();
  observations.counterpartySearch = { steps: 2, count: await page.locator(".counterparty-card").count() };
  await page.getByRole("button", { name: "Thêm đối tác", exact: true }).click();
  const cp = page.getByRole("dialog", { name: "Thêm đối tác" });
  await cp.getByLabel("Tên đối tác").fill("C74 thêm synthetic");
  await cp.getByRole("button", { name: "Thêm đối tác", exact: true }).click();
  await expect(cp).not.toBeVisible();
  observations.counterpartySave = { autoClosed: true, focus: await page.evaluate(() => document.activeElement?.textContent), steps: 3 };
  await ready(page, "/expenses");
  await page.getByRole("button", { name: "Thêm chi phí", exact: true }).click();
  const expense = page.getByRole("dialog", { name: "Thêm chi phí" });
  await expense.getByLabel("Số tiền (VND)").fill("1234");
  await expense.getByLabel("Nhóm chi phí").fill("C74 synthetic");
  await expense.getByRole("button", { name: "Ghi chi phí chung", exact: true }).click();
  await expect(expense).not.toBeVisible();
  observations.expenseSave = { autoClosed: true, steps: 4, focus: await page.evaluate(() => document.activeElement?.textContent) };
  await page.getByRole("button", { name: "Thêm chi phí", exact: true }).click();
  await expense.getByLabel("Nhóm chi phí").fill("Bản nháp synthetic");
  let confirms = 0;
  const dismissDraft = async (dialog: import("@playwright/test").Dialog) => { confirms++; await dialog.dismiss(); };
  page.on("dialog", dismissDraft);
  await page.keyboard.press("Escape");
  observations.expenseDraft = { confirms, staysOpen: await expense.isVisible(), preserved: await expense.getByLabel("Nhóm chi phí").inputValue() };
  page.off("dialog", dismissDraft);
  page.once("dialog", dialog => dialog.accept());
  await page.keyboard.press("Escape");
  await expect(expense).not.toBeVisible();
  await ready(page, "/notifications?unread=true");
  observations.notificationFilter = await page.locator(".filter-pills a").evaluateAll(es => es.map(e => ({ text: e.textContent, current: e.getAttribute("aria-current") })));
  await page.getByRole("button", { name: "Đánh dấu đã đọc", exact: true }).click();
  await expect(page.locator(".notification-empty")).toBeVisible();
  observations.unreadEmpty = await page.locator(".notification-empty").innerText();
  await ready(page, "/expenses");
  await page.getByRole("button", { name: "Thêm chi phí", exact: true }).click();
  await expense.getByLabel("Số tiền (VND)").fill("5678");
  await expense.getByLabel("Nhóm chi phí").fill("C74 lỗi synthetic");
  await page.route("**/*", async route => {
    if (route.request().headers()["next-action"]) await route.abort("failed");
    else await route.continue();
  });
  await expense.getByRole("button", { name: "Ghi chi phí chung", exact: true }).click();
  await expect(expense.locator(".action-message")).toBeVisible();
  observations.expenseError = { message: await expense.locator(".action-message").innerText(), staysOpen: await expense.isVisible(), draft: await expense.getByLabel("Nhóm chi phí").inputValue() };
  await capture(page, "expense-error-390.png");
  await page.unroute("**/*");
  observations.pageErrors = errors;
});

test("C74 controlled loading and keyboard sheet evidence", async ({ page }) => {
  test.skip(process.env.C74_AUDIT !== "true", "Opt-in synthetic audit");
  await page.setViewportSize({ width: 375, height: 844 });
  await login(page);
  await ready(page, `/loans/${loanId}`);
  await page.route("**/*", async route => {
    if (route.request().headers().rsc === "1") await new Promise(resolve => setTimeout(resolve, 1800));
    await route.continue();
  });
  await page.getByRole("navigation", { name: "Nội dung khoản vay" }).getByRole("link", { name: "Lịch sử" }).click();
  await page.waitForTimeout(200);
  observations.tabLoading = { routeProgress: await page.locator(".global-route-progress").getAttribute("data-visible"), skeleton: await page.locator(".content-loading").count(), delayMs: 1800 };
  await expect(page).toHaveURL(/tab=history/);
  await page.unroute("**/*");
  await ready(page, "/expenses");
  await page.getByRole("button", { name: "Thêm chi phí", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Thêm chi phí" });
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Tab");
  observations.sheetKeyboard = await sheet.evaluate(e => ({ focusInside: e.contains(document.activeElement), rect: e.getBoundingClientRect().toJSON(), overflow: document.documentElement.scrollWidth > innerWidth }));
  await capture(page, "expense-sheet-375.png");
  await page.keyboard.press("Escape");
  await expect(sheet).not.toBeVisible();
  observations.sheetEscapeFocus = await page.evaluate(() => document.activeElement?.textContent);
});
