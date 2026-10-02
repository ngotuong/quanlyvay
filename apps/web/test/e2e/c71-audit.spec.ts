import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment } from "./helpers";

// Opt-in observation harness. Product defects are recorded, not hidden by PASS assertions.
const out = resolve(process.cwd(), "../../docs/audit-c71");
const evidence: Record<string, unknown> = { method: "Headless Chrome, local production build, synthetic isolated DB :55321", matrix: [], observations: {} };
const matrix: unknown[] = [];
const observations: Record<string, unknown> = {};
let loanId = "";
const password = "OwnerE2eTemp123";
test.beforeAll(async () => {
  if (process.env.C71_AUDIT !== "true") return;
  mkdirSync(out, { recursive: true });
  const local = localSupabaseEnvironment();
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  if (signed.error || !signed.data.user) throw signed.error || new Error("Missing synthetic owner");
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const updated = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user.id);
  if (updated.error) throw updated.error;
  const counterpart = await owner.rpc("create_counterparty", { p_name: "Đối tác synthetic C71", p_notes: "Không phải dữ liệu thật" });
  if (counterpart.error) throw counterpart.error;
  for (let index = 0; index < 12; index++) {
    const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: counterpart.data, p_name: `C71 khoản mẫu ${index + 1}`, p_direction: index % 2 ? "BORROWING" : "LENDING", p_original_principal_vnd: 1000000, p_disbursement_date: "2026-08-01", p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: `c71-loan-${index}`, p_notes: null });
    if (loan.error) throw loan.error;
    if (!index) loanId = loan.data;
  }
});
test.afterAll(() => {
  if (process.env.C71_AUDIT !== "true") return;
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

test("C71 screen/theme/viewport evidence and keyboard/reflow", async ({ page }) => {
  test.skip(process.env.C71_AUDIT !== "true", "Opt-in synthetic observation audit");
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await login(page);
  const routes = ["/dashboard", "/loans", "/loans/new", "/counterparties", "/expenses", "/notifications", "/settings", ...["overview", "interest", "history", "settings"].map(tab => `/loans/${loanId}?tab=${tab}`)];
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        const start = Date.now(); await ready(page, route);
        const metrics = await page.evaluate(() => {
          const visible = (e: Element) => {
            const closed = e.closest("details:not([open])");
            if (closed && !closed.querySelector("summary")?.contains(e)) return false;
            return e.getClientRects().length && getComputedStyle(e).visibility !== "hidden" && !e.classList.contains("sr-only");
          };
          const controls = [...document.querySelectorAll<HTMLElement>("button,a,input,select,summary")].filter(visible);
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            title: document.title,
            headings: [...document.querySelectorAll("h1,h2")].filter(visible).map(e => e.textContent),
            targetsUnder44: controls.filter(e => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(e => ({ text: (e.getAttribute("aria-label") || e.textContent || e.id).trim().slice(0, 80), width: Math.round(e.getBoundingClientRect().width * 10) / 10, height: Math.round(e.getBoundingClientRect().height * 10) / 10, class: e.className })),
            sections: [...document.querySelectorAll("#main-content > *, .counterparty-list, .push-settings, .notification-list")].filter(visible).map(e => ({ class: e.className, y: Math.round(e.getBoundingClientRect().top), height: Math.round(e.getBoundingClientRect().height) })),
          };
        });
        const label = route.includes(loanId) ? `detail-${route.split("=")[1]}` : route.slice(1).replaceAll("/", "-");
        matrix.push({ route: label, width, theme, durationMs: Date.now() - start, ...metrics });
        if ([390, 1440].includes(width)) await capture(page, `${label}-${width}-${theme}.png`);
      }
    }
  }
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 844, height: 390 });
  await ready(page, `/loans/${loanId}`); await page.getByRole("button", { name: "Giao dịch", exact: true }).click();
  observations.landscape = await page.getByRole("dialog", { name: "Ghi giao dịch" }).evaluate(e => ({ rect: e.getBoundingClientRect().toJSON(), overflow: document.documentElement.scrollWidth > innerWidth, animation: getComputedStyle(e).animationDuration }));
  await capture(page, "drawer-landscape-reduced-motion.png"); await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 640, height: 700 }); await ready(page, "/loans");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  observations.zoom200 = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth }));
  await capture(page, "loans-text200.png");
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page, "/dashboard");
  await page.getByRole("button", { name: "Thêm", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Tiện ích khác" });
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Tab");
  observations.sheetKeyboard = await sheet.evaluate(e => ({ focusInside: e.contains(document.activeElement) }));
  await page.keyboard.press("Escape");
  observations.pageErrors = errors;
});

test("C71 friction, browser back, offline, loading and pending evidence", async ({ page, context }) => {
  test.skip(process.env.C71_AUDIT !== "true", "Opt-in synthetic observation audit");
  test.setTimeout(150000);
  await page.setViewportSize({ width: 390, height: 844 }); await login(page);
  await ready(page, "/loans");
  await page.getByLabel("Tên khoản vay hoặc đối tác").fill("C71"); await expect(page).toHaveURL(/q=C71/);
  await page.evaluate(() => scrollTo(0, 600)); const scrollBefore = await page.evaluate(() => scrollY);
  await page.locator(".loan-card").first().click(); await expect(page).toHaveURL(/\/loans\/[0-9a-f-]+/);
  await page.goBack(); await expect(page).toHaveURL(/q=C71/);
  observations.filterBack = { query: await page.getByLabel("Tên khoản vay hoặc đối tác").inputValue(), scrollBefore, scrollAfter: await page.evaluate(() => scrollY) };

  await ready(page, "/loans"); await page.getByRole("link", { name: "Tạo khoản vay", exact: true }).click(); await expect(page).toHaveURL(/loans\/new/); await page.getByLabel("Nhãn phân biệt").fill("Bản nháp C71 chưa lưu");
  let confirms = 0; const listener = async (d: import("@playwright/test").Dialog) => { confirms++; await d.dismiss(); }; page.on("dialog", listener);
  await page.evaluate(() => history.back()); await page.waitForTimeout(500);
  observations.dirtyBrowserBack = { confirms, route: new URL(page.url()).pathname, draftInputCount: await page.getByLabel("Nhãn phân biệt").count() };
  page.off("dialog", listener);
  if (await page.getByLabel("Nhãn phân biệt").count()) await page.getByLabel("Nhãn phân biệt").fill("");

  await ready(page, "/notifications?unread=true");
  observations.notificationFilter = await page.locator(".filter-pills a").evaluateAll(es => es.map(e => ({ text: e.textContent, active: e.getAttribute("data-active"), current: e.getAttribute("aria-current"), background: getComputedStyle(e).backgroundColor })));
  await capture(page, "notifications-unread-390.png");
  await page.route("**/*", async route => { if (route.request().method() === "POST" && route.request().headers()["next-action"]) await new Promise(r => setTimeout(r, 1200)); await route.continue(); });
  await page.getByRole("button", { name: "Đánh dấu đã đọc", exact: true }).click(); await page.waitForTimeout(200);
  observations.notificationPending = { label: await page.getByRole("button", { name: "Đánh dấu đã đọc", exact: true }).innerText(), disabled: await page.getByRole("button", { name: "Đánh dấu đã đọc", exact: true }).isDisabled() };
  await expect(page.getByRole("button", { name: "Đánh dấu đã đọc", exact: true })).toHaveCount(0); await page.unroute("**/*");

  await ready(page, "/expenses");
  const submit = page.getByRole("button", { name: "Ghi chi phí chung", exact: true });
  const samples = [];
  for (let n = 1; n <= 2; n++) {
    await page.getByLabel("Số tiền (VND)").fill(String(n * 1000)); await page.getByLabel("Nhóm chi phí").fill(`C71 synthetic ${n}`);
    const before = Date.now(); await submit.click(); await expect(page.locator(".action-message[data-success=true]").first()).toBeVisible();
    await expect(page.getByLabel("Số tiền (VND)")).toHaveValue("");
    samples.push({ saveMs: Date.now() - before, actionsFromEmptyForm: 3 });
  }
  observations.expenseSave = samples;
  const local = localSupabaseEnvironment();
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const expenses = await admin.from("transactions").select("amount_vnd").is("loan_id", null).eq("type", "EXPENSE");
  expect(expenses.error).toBeNull(); expect(expenses.data).toHaveLength(2);
  observations.expenseRows = expenses.data; await capture(page, "expenses-populated-390.png");

  await ready(page, `/loans/${loanId}?tab=overview`);
  await page.route("**/*", async route => { if (route.request().headers().rsc === "1") await new Promise(r => setTimeout(r, 1800)); await route.continue(); });
  const start = Date.now(); await page.getByRole("navigation", { name: "Nội dung khoản vay" }).getByRole("link", { name: "Lịch sử" }).click();
  await page.waitForTimeout(150);
  observations.tabPending = { delayMs: 1800, progress: await page.locator(".global-route-progress").getAttribute("data-visible"), loadingCount: await page.locator(".content-loading").count() };
  await expect(page).toHaveURL(/tab=history/); observations.tabCommittedMs = Date.now() - start; await page.unroute("**/*");
  await context.setOffline(true); await page.waitForTimeout(200);
  observations.offline = await page.locator("body").innerText(); await capture(page, "offline-390.png");
  await context.setOffline(false);
  // Local abort before request dispatch: no ambiguity about an accepted remote mutation.
  await ready(page, `/loans/${loanId}`); await page.getByRole("button", { name: "Giao dịch", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Ghi giao dịch" }); await dialog.getByLabel("Số tiền (VND)").fill("1234");
  await page.route("**/*", async route => { if (route.request().method() === "POST" && route.request().headers()["next-action"]) await route.abort("failed"); else await route.continue(); });
  await dialog.getByRole("button", { name: "Ghi nhận", exact: true }).click(); await expect(dialog.getByText(/Chưa thể xác nhận thao tác/)).toBeVisible();
  observations.paymentFailure = { open: await dialog.isVisible(), amount: await dialog.getByLabel("Số tiền (VND)").inputValue() };
  await capture(page, "payment-error-390.png"); await page.unroute("**/*");
  const retryStart = Date.now();
  await dialog.getByRole("button", { name: "Ghi nhận", exact: true }).click(); await expect(dialog).toBeHidden();
  observations.paymentRetry = { ms: Date.now() - retryStart, focused: await page.getByRole("button", { name: "Giao dịch", exact: true }).evaluate(e => e === document.activeElement) };
  await ready(page, "/loans?q=C71"); const quickStart = Date.now();
  await page.getByRole("link", { name: "Ghi giao dịch cho khoản vay", exact: true }).first().click(); await expect(dialog).toBeVisible();
  await dialog.getByLabel("Số tiền (VND)").fill("2000"); await dialog.getByRole("button", { name: "Ghi nhận", exact: true }).click(); await expect(dialog).toBeHidden();
  observations.quickPayment = { actionsFromList: 3, elapsedMs: Date.now() - quickStart };
});
