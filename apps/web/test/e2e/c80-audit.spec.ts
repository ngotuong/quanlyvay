import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment } from "./helpers";

// Observation only: a completed audit capture does not assert that the product is defect-free.
const enabled = process.env.C80_AUDIT === "true";
const out = resolve(process.cwd(), "../../docs/audit-c80");
const matrix: unknown[] = [];
const observations: Record<string, unknown> = {};
let loanId = "";
const password = "OwnerE2eTemp123";
test.beforeAll(async () => {
  if (!enabled) return;
  mkdirSync(out, { recursive: true });
  const local = localSupabaseEnvironment();
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  if (signed.error || !signed.data.user) throw signed.error || new Error("Missing synthetic owner");
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const profile = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user.id);
  if (profile.error) throw profile.error;
  const cp = await owner.rpc("create_counterparty", { p_name: "Đối tác mẫu C80", p_notes: "Dữ liệu giả, không phải khách hàng thật" });
  if (cp.error) throw cp.error;
  for (let i = 0; i < 8; i++) {
    const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: cp.data, p_name: `C80 khoản mẫu tên dài kiểm tra đọc đủ ngữ cảnh và thứ bậc ${i + 1}`, p_direction: i % 2 ? "BORROWING" : "LENDING", p_original_principal_vnd: 128450000, p_disbursement_date: "2025-10-01", p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: `c80-loan-${i}`, p_notes: null });
    if (loan.error) throw loan.error;
    if (!i) loanId = loan.data;
  }
});
test.afterAll(() => {
  if (enabled) writeFileSync(resolve(out, "local-evidence.json"), JSON.stringify({ method: "Headless Chromium local production build; guarded disposable Supabase API55321/DB55322; synthetic only", matrix, observations }, null, 2));
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
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator(".content-loading")).toHaveCount(0);
}
async function measure(page: Page) {
  return page.evaluate(() => {
    const visible = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
    const rect = (selector: string) => { const e = document.querySelector(selector); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + scrollY), width: Math.round(r.width), height: Math.round(r.height) }; };
    return { width: innerWidth, theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light", overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), visibleH1: [...document.querySelectorAll("h1")].filter(visible).length,
      kpis: rect(".dashboard-primary-metrics"), tasks: rect(".attention-card"), banner: rect(".action-hero-banner"), heading: rect(".page-heading-row"), firstLoan: rect(".loan-card"),
      tinyTargets: [...document.querySelectorAll("main a,main button,main input,main select,main summary")].filter(visible).filter(e => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map(e => ({ tag: e.tagName, class: e.className })),
      unlabelledFields: [...document.querySelectorAll<HTMLInputElement>("main input,main select,main textarea")].filter(visible).filter(e => !e.labels?.length && !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby")).length,
      clippedTaskText: [...document.querySelectorAll<HTMLElement>(".due-heading strong,.due-task,.due-dates")].filter(visible).filter(e => e.scrollWidth > e.clientWidth + 1).length,
      fontLoaded: document.fonts.check('14px "Inter"'),
    };
  });
}
test("C80 complete route and privacy observation matrix", async ({ page }) => {
  test.skip(!enabled, "Opt-in synthetic C80 audit");
  test.setTimeout(300000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.name));
  await login(page);
  const routes = [["dashboard", "/dashboard"], ["dashboard-custom", "/dashboard?from=2025-10-01&to=2026-10-03&preset=custom"], ["loans", "/loans"], ["counterparties", "/counterparties"], ["expenses", "/expenses"], ["notifications", "/notifications"], ["notifications-unread", "/notifications?unread=true"], ["settings", "/settings"], ...["overview", "interest", "history", "settings"].map(tab => [`detail-${tab}`, `/loans/${loanId}?tab=${tab}`])];
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 1440]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width, height: 900 });
    for (const [label, route] of routes) {
      await ready(page, route);
      const metrics = await measure(page);
      matrix.push({ route: label, privacy: "shown", ...metrics });
      if (["dashboard", "loans"].includes(label) && width !== 375) await page.screenshot({ path: resolve(out, `${label}-${width}-${theme}.png`), fullPage: true });
      if (label === "dashboard-custom") {
        await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)" }).first().click();
        const chart = page.locator(".cash-flow-card");
        observations[`chart-hidden-${width}-${theme}`] = await chart.evaluate(e => ({ repeatedPrivatePlaceholders: e.querySelectorAll(".bar-pair .privacy-placeholder").length, axis: [...e.querySelectorAll(".chart-y-axis > span")].map(n => n.textContent), hiddenControls: e.querySelectorAll(".cash-bar-control,[role=tooltip]").length, scrollWidth: e.querySelector(".cash-flow-chart-scroll")?.scrollWidth, clientWidth: e.querySelector(".cash-flow-chart-scroll")?.clientWidth }));
        if (width === 1440 || width === 390) await page.screenshot({ path: resolve(out, `dashboard-private-${width}-${theme}.png`), fullPage: true });
        matrix.push({ route: `${label}-private`, privacy: "hidden", ...await measure(page) });
        await page.getByRole("button", { name: "Hiển thị số tiền" }).first().click();
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await ready(page, "/dashboard");
  const range = page.locator(".dashboard-period-bar");
  observations.rangeDialog = {
    opened: await range.isVisible(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    displayedDates: await range.locator(".dashboard-date-control > span").allTextContents(),
  };
  observations.pageErrorCount = errors.length;
  observations.observedCompletion = true;
});
