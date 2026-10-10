import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";

const base = "http://127.0.0.1:3101";
const password = readFileSync(resolve(process.cwd(), "test/e2e/global-setup.ts"), "utf8").match(/password: "([^"]+)"/)![1];
const partnerName = ("C94 Đối tác tên dài cần đọc đầy đủ bằng bàn phím và giữ đúng nhận diện ").repeat(4).slice(0, 200);
const loanName = ("C94 Khoản vay tên dài cần xác nhận đúng trước khi ghi giao dịch tài chính ").repeat(4).slice(0, 200);
let loanId = "";
const observations: unknown[] = [];
test.afterAll(() => { const out = resolve(process.cwd(), "../../.cache/c94"); mkdirSync(out, { recursive: true }); writeFileSync(resolve(out, "regression-evidence.json"), JSON.stringify({ method: "Guarded synthetic C20-test, real Chromium production DOM and accessibility snapshot, existing test budgets unchanged", observations }, null, 2)); });

test.beforeAll(async () => {
  test.setTimeout(300000);
  if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
  await globalSetup();
  const env = localSupabaseEnvironment();
  expect(new URL(env.API_URL).port).toBe(process.env.CI === "true" ? "54321" : "55321");
  const owner = createClient(env.API_URL, env.PUBLISHABLE_KEY || env.ANON_KEY, { auth: { persistSession: false } });
  const admin = createClient(env.API_URL, env.SECRET_KEY || env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();
  const cp = await owner.rpc("create_counterparty", { p_name: partnerName, p_notes: "Dữ liệu giả C94" }); expect(cp.error).toBeNull();
  const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: cp.data, p_name: loanName, p_direction: "LENDING", p_original_principal_vnd: "1284500000", p_disbursement_date: "2026-09-06", p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: randomUUID(), p_notes: "Dữ liệu giả C94" });
  expect(loan.error).toBeNull(); loanId = loan.data;
  expect((await owner.rpc("record_expense", { p_loan_id: null, p_transaction_date: "2026-10-01", p_amount_vnd: "100000", p_category: "Mẫu C94", p_idempotency_key: randomUUID(), p_note: "Dữ liệu giả" })).error).toBeNull();
});

async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: base }, { name: "qlv_theme", value: "system", url: base }]);
  await page.goto("/login"); await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e"); await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
}
async function ready(page: Page, route: string) {
  await page.goto(route); await expect(page.locator("#main-content")).toBeVisible(); await expect(page.locator(".content-loading")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}
async function openTables(page: Page) {
  await page.locator(".dashboard-analysis > summary").click();
  for (const details of await page.locator(".chart-data-details").all()) await details.locator("summary").click();
}

test("C94 mobile cards and desktop tables retain every row, header, zero and exact amount", async ({ page }) => {
  test.setTimeout(180000); await login(page);
  let baseline: unknown;
  for (const colorScheme of ["light", "dark"] as const) for (const width of [375, 390, 768, 1024, 1440]) {
    await page.emulateMedia({ colorScheme }); await page.setViewportSize({ width, height: 900 });
    await ready(page, "/dashboard?from=2026-01-01&to=2026-10-09"); await openTables(page);
    const data = await page.locator(".dashboard-data-table").evaluateAll(tables => tables.map(table => ({
      headers: [...table.querySelectorAll("thead th")].map(e => e.textContent),
      rows: [...table.querySelectorAll("tbody tr")].map(row => [...row.querySelectorAll("th,td")].map(cell => (cell.querySelector("[data-disclosure-name],.table-card-value") ?? cell).textContent)),
    })));
    if (!baseline) baseline = data;
    expect(data).toEqual(baseline);
    await expect(page.getByRole("table")).toHaveCount(2);
    await expect(page.locator(".dashboard-data-table .table-card-label:not([aria-hidden='true'])")).toHaveCount(0);
    const painted = await page.locator(".dashboard-data-table").evaluateAll(tables => tables.map(table => ({
      scrolling: table.scrollWidth > table.clientWidth,
      display: getComputedStyle(table.querySelector("tbody tr")!).display,
      money: [...table.querySelectorAll<HTMLElement>(".table-card-value")].filter(e => e.getClientRects().length).every(e => e.scrollWidth <= e.clientWidth + 1),
    })));
    observations.push({ task: "table semantics/data", colorScheme, width, data, painted });
    expect(painted.every(row => row.money)).toBe(true);
    if (width < 1024) { expect(painted.every(row => !row.scrolling && row.display === "block")).toBe(true); }
    else expect(painted.every(row => row.display === "table-row")).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const layout = await page.locator(".dashboard-focus-grid").evaluate(grid => {
      const [task, cash] = [...grid.children].map(e => e.getBoundingClientRect());
      const kpi = document.querySelector(".dashboard-primary-metrics")!.getBoundingClientRect();
      return { kpiFirst: kpi.bottom <= task.top, cashBelow: task.bottom <= cash.top, sameWidth: Math.abs(task.width - cash.width) < 1 };
    });
    observations.push({ task: "A hierarchy", colorScheme, width, layout });
    expect(layout).toEqual({ kpiFirst: true, cashBelow: true, sameWidth: true });
  }
  expect(JSON.stringify(baseline)).toContain("0\u00a0₫");
  expect(JSON.stringify(baseline)).toContain("1.284.500.000\u00a0₫");
  await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)", exact: true }).first().click();
  const ax = await page.locator("#main-content").ariaSnapshot();
  expect(ax).not.toContain(partnerName); expect(ax).not.toContain("1.284.500.000");
  await expect(page.locator(".name-disclosure-toggle")).toHaveCount(0);
});

test("C94 full-name disclosure is keyboard usable outside headings and navigation links", async ({ page }) => {
  test.setTimeout(120000); await page.setViewportSize({ width: 375, height: 667 }); await login(page);
  for (const [route, identity, selector] of [["/loans?q=C94", loanName, ".loan-name-disclosure"], ["/loans/" + loanId, loanName, ".loan-detail-heading .name-disclosure"], ["/counterparties?q=C94", partnerName, ".counterparty-card-heading .name-disclosure"]]) {
    await ready(page, route);
    const scope = page.locator(selector).filter({ hasText: identity }).first();
    await expect(scope.locator("[data-disclosure-name]")).toHaveText(identity);
    const toggle = scope.locator(".name-disclosure-toggle"); await expect(toggle).toBeVisible(); await expect(toggle).toHaveText("Xem đầy đủ");
    expect(await toggle.evaluate(el => !!el.closest("a,h1,h2,h3"))).toBe(false);
    const current = page.url(); await toggle.focus(); await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true"); expect(page.url()).toBe(current);
    const controlled = await toggle.getAttribute("aria-controls");
    expect(await page.locator(`[id="${controlled}"]`).evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    observations.push({ task: "keyboard name", route, identityCharacters: identity.length, controlled, urlUnchanged: current === page.url(), fullName: true, focusRetained: true });
    await expect(toggle).toBeFocused(); await page.keyboard.press("Space"); await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)", exact: true }).first().click();
    expect(await page.locator("#main-content").ariaSnapshot()).not.toContain(identity); await expect(scope.locator("button")).toHaveCount(0);
    await page.getByRole("button", { name: "Hiển thị số tiền", exact: true }).first().click();
  }
});

test("C94 painted helper text and notification hover/selected/focus remain distinct", async ({ page }) => {
  test.setTimeout(120000); await login(page);
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme }); await page.setViewportSize({ width: 375, height: 900 });
    await ready(page, "/expenses"); await page.locator(".expense-category-details > summary").first().click();
    expect(await page.locator(".expense-category-value small").first().evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBe(14);
    await ready(page, "/settings"); expect(await page.locator(".managed-user-status").first().evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBe(14);
    await ready(page, "/notifications");
    const selected = page.locator(".notification-filters [data-active='true']"); const other = page.locator(".notification-filters [data-active='false']");
    await expect(selected).toHaveAttribute("aria-current", "page"); await other.hover();
    expect(await other.evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(await selected.evaluate(e => getComputedStyle(e).backgroundColor));
    await other.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab"); expect(await other.evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe("none");
  }
});


test("C94 reflow320, short viewport and root text200 retain data and usable name controls", async ({ page }) => {
  test.setTimeout(180000); await login(page);
  for (const colorScheme of ["light", "dark"] as const) for (const mode of [{ width: 320, height: 900, text: 100 }, { width: 375, height: 667, text: 100 }, { width: 375, height: 900, text: 200 }, { width: 1440, height: 900, text: 200 }]) {
    await page.emulateMedia({ colorScheme }); await page.setViewportSize({ width: mode.width, height: mode.height });
    for (const route of ["/dashboard", "/loans?q=C94", "/loans/" + loanId, "/counterparties?q=C94", "/expenses", "/settings", "/notifications"]) {
      await ready(page, route);
      if (route === "/dashboard") await openTables(page);
      await page.evaluate(text => { document.documentElement.style.fontSize = `${text}%`; }, mode.text);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} ${colorScheme} ${JSON.stringify(mode)}`).toBe(true);
      const names = await page.locator(".name-disclosure-toggle").evaluateAll(es => es.filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }));
      expect(names.every(Boolean)).toBe(true);
      const money = await page.locator(".dashboard-data-table .table-card-value").evaluateAll(es => es.filter(e => e.getClientRects().length).every(e => e.scrollWidth <= e.clientWidth + 1));
      expect(money, `${route} ${colorScheme} ${JSON.stringify(mode)} money`).toBe(true);
      observations.push({ task: "reflow/short/root text200", route, colorScheme, ...mode, nameTargets: names.length, moneyFits: money, painted: await page.locator("[data-disclosure-name],.table-card-value,.expense-category-value small,.managed-user-status").evaluateAll(es => es.filter(e => e.getClientRects().length).map(e => ({ class: e.className, font: getComputedStyle(e).fontSize }))) });
      await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
    }
  }
});

test("C94 probe candidates are reconciled against painted money and open reversal controls", async ({ page }) => {
  test.setTimeout(120000); await login(page);
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme }); await page.setViewportSize({ width: 1440, height: 900 }); await ready(page, "/dashboard");
    const zeros = await page.locator(".vnd-number").evaluateAll(es => es.filter(e => e.textContent === "0").map(e => {
      const pixel = (color: string) => { const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1; const c = canvas.getContext("2d")!; c.fillStyle = color; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data]; };
      let opacity = 1, painted = true, background: number[] | undefined;
      for (let n: Element | null = e; n; n = n.parentElement) {
        const style = getComputedStyle(n); opacity *= Number(style.opacity);
        if (style.visibility === "hidden" || style.display === "none" || (n instanceof HTMLDetailsElement && !n.open && !n.querySelector(":scope > summary")?.contains(e))) painted = false;
        const bg = pixel(style.backgroundColor); if (!background && bg[3] === 255) background = bg;
      }
      const r = e.getBoundingClientRect(); painted &&= r.width > 0 && r.height > 0 && opacity > 0.05;
      const fg = pixel(getComputedStyle(e).color), bg = background ?? [255, 255, 255, 255], alpha = fg[3] / 255 * opacity;
      const blended = fg.slice(0, 3).map((v, i) => v * alpha + bg[i] * (1 - alpha));
      const luminance = (rgb: number[]) => rgb.slice(0, 3).map(v => { const s = v / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const a = luminance(blended), b = luminance(bg);
      return { text: e.textContent, tooltip: !!e.closest(".chart-tooltip"), metric: !!e.closest(".dashboard-metric"), opacity, painted, foreground: fg, background: bg, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
    }));
    observations.push({ task: "Evon zero-money paint reconciliation", colorScheme, zeros });
    expect(zeros.filter(x => x.painted).every(x => x.ratio >= 4.5)).toBe(true);
    const control = page.locator(".cash-bar-control").first(); await control.hover(); await expect(control.locator(".chart-tooltip")).toHaveCSS("opacity", "1");
    await ready(page, "/expenses");
    const reversals = page.locator(".inline-reversal"); await expect(reversals.first()).toBeVisible(); await reversals.first().locator("summary").click();
    const button = reversals.first().getByRole("button", { name: "Xác nhận đảo", exact: true }); await expect(button).toBeVisible();
    const geometry = await button.evaluate(e => { const range = document.createRange(); range.selectNodeContents(e); const s = getComputedStyle(e); return { width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height, textHeight: range.getBoundingClientRect().height, lineHeight: parseFloat(s.lineHeight) }; });
    observations.push({ task: "Evon open reversal reconciliation", colorScheme, geometry });
    expect(geometry.textHeight).toBeLessThanOrEqual(geometry.lineHeight + 1); expect(geometry.height).toBeGreaterThanOrEqual(44);
  }
});
