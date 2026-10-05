import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";

const out = resolve(process.cwd(), "../../docs/remediation-c84");
const cache = resolve(process.cwd(), "../../.cache/c84");
const capture = process.env.C84_EVIDENCE === "true";
const evidence: { matrix: unknown[]; checks: string[] } = { matrix: [], checks: [] };
let owner: SupabaseClient;
let admin: SupabaseClient;
const base = "http://127.0.0.1:3101";
const password = "OwnerE2eTemp123";
const unbrokenName = `C84 ${"L".repeat(116)}`;
const unbrokenNote = "N".repeat(500);
let editedId = "";

test.beforeAll(async () => {
  test.setTimeout(300000);
  // A dedicated guarded baseline isolates counts and account lifecycle from other suites.
  if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
  await globalSetup();
  const local = localSupabaseEnvironment();
  owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();
  for (let i = 0; i < 26; i++) {
    const cp = await owner.rpc("create_counterparty", { p_name: i === 0 ? unbrokenName : `C84 Mẫu ${String(i).padStart(2, "0")}`, p_notes: i === 0 ? unbrokenNote : "Ghi chú giả" });
    expect(cp.error).toBeNull(); if (i === 0) editedId = cp.data;
    const expense = await owner.rpc("record_expense", { p_loan_id: null, p_transaction_date: "2026-10-01", p_amount_vnd: i === 0 ? 9999999999 : 100000 + i * 1000, p_category: i === 0 ? "C".repeat(80) : "Vận hành", p_idempotency_key: `c84-expense-${i}`, p_note: i === 0 ? unbrokenNote : "Chi phí giả" });
    expect(expense.error).toBeNull();
  }
  const loan = await admin.from("loans").select("id").eq("name", "Khoản thông báo E2E").single(); expect(loan.error).toBeNull();
  expect((await admin.from("notifications").insert(Array.from({ length: 26 }, (_, i) => ({ user_id: signed.data.user!.id, loan_id: loan.data!.id, type: "INTEREST_DUE", notification_date: "2026-10-01", title: `C84 nhắc mẫu ${i}`, body: "Đối tác giả • 1.000.000\nSố lãi phải thu : 30.000", idempotency_key: `c84-notification-${i}` })))).error).toBeNull();
  if (capture) { mkdirSync(out, { recursive: true }); mkdirSync(cache, { recursive: true }); }
});
test.afterAll(() => { if (capture) writeFileSync(resolve(out, "browser-evidence.json"), JSON.stringify({ method: "Chrome local production build; guarded synthetic API55321/DB55322", ...evidence }, null, 2)); });
async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: base }]);
  await page.goto("/login"); await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e"); await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
}
async function ready(page: Page, route: string) {
  await page.goto(route);
  // Authenticated /login streams a redirect through / to /dashboard. Wait for the
  // destination rather than measuring the temporary shell before navigation finishes.
  if (route === "/login") await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator(".content-loading")).toHaveCount(0);
}
async function pendingDelay(page: Page) {
  await page.route("**/*", async route => { if (route.request().method() === "POST" && route.request().headers()["next-action"]) await new Promise(done => setTimeout(done, 2000)); await route.continue(); });
}
async function abortAction(page: Page) {
  await page.route("**/*", async route => { if (route.request().method() === "POST" && route.request().headers()["next-action"]) await route.abort("failed"); else await route.continue(); });
}

test("C84 canonical pagination keeps count, filter, boundary and browser traversal", async ({ page }) => {
  test.setTimeout(90000); await login(page);
  for (const route of ["/counterparties?q=C84&page=99", "/expenses?page=99", "/notifications?unread=true&page=99"]) {
    await ready(page, route); await expect(page).toHaveURL(/page=2/); await expect(page.getByRole("navigation", { name: "Phân trang", exact: true }).locator("p")).toContainText("Trang 2 / 2");
    await expect(page.locator(".empty-state")).toHaveCount(0); await expect(page.getByText("Chưa thể tải dữ liệu", { exact: true })).toHaveCount(0);
  }
  await ready(page, "/counterparties?q=C84&page=2"); await expect(page.locator(".counterparty-list > article")).toHaveCount(1);
  await page.getByRole("link", { name: "Trang trước", exact: true }).click(); await expect(page).toHaveURL(/counterparties\?q=C84$/); await expect(page.locator(".counterparty-list > article")).toHaveCount(25);
  await page.goBack(); await expect(page).toHaveURL(/q=C84&page=2/); await page.goForward(); await expect(page).toHaveURL(/q=C84$/);
  await ready(page, "/counterparties?q=no-c84-match&page=99"); await expect(page).toHaveURL(/q=no-c84-match$/); await expect(page.getByRole("heading", { name: "Không tìm thấy đối tác" })).toBeVisible();
  await ready(page, "/counterparties?q=C84%20M%E1%BA%ABu&page=99"); await expect(page).not.toHaveURL(/page=/); await expect(page.locator(".counterparty-list > article")).toHaveCount(25);
  evidence.checks.push("F1 canonical filtered count 0/25/26, pagination URL/back/forward, no false empty/error");
});

test("C84 pending editor stays open, preserves error draft and closes on acknowledged save", async ({ page }) => {
  test.setTimeout(90000); await login(page); await ready(page, "/counterparties?q=C84%20L");
  const editor = page.locator(".edit-details").first(); await editor.locator("summary").click();
  await editor.getByLabel("Tên đối tác").fill("C84 L updated"); await pendingDelay(page);
  await editor.getByRole("button", { name: "Lưu thay đổi" }).click(); await expect(editor.getByRole("button", { name: "Đang lưu…" })).toBeDisabled();
  let confirmations = 0; const accept = async (dialog: import("@playwright/test").Dialog) => { confirmations++; await dialog.accept(); }; page.on("dialog", accept);
  await editor.locator("summary").click(); await expect(editor).toHaveAttribute("open", ""); expect(confirmations).toBe(0);
  await expect(editor).not.toHaveAttribute("open"); await expect(editor.locator("summary")).toBeFocused(); await page.unroute("**/*"); page.off("dialog", accept);
  expect((await admin.from("counterparties").select("name").eq("id", editedId).single()).data?.name).toBe("C84 L updated");
  await ready(page, "/counterparties?q=C84%20L"); const again = page.locator(".edit-details").first(); await again.locator("summary").click(); await again.getByLabel("Tên đối tác").fill(unbrokenName);
  await abortAction(page); await again.getByRole("button", { name: "Lưu thay đổi" }).click(); await expect(again.getByText(/Chưa thể xác nhận/)).toBeVisible(); await expect(again.getByLabel("Tên đối tác")).toHaveValue(unbrokenName);
  page.once("dialog", dialog => dialog.dismiss()); await again.locator("summary").click(); await expect(again).toHaveAttribute("open", ""); await expect(again.getByLabel("Tên đối tác")).toHaveValue(unbrokenName);
  await page.unroute("**/*"); await again.getByRole("button", { name: "Lưu thay đổi" }).click(); await expect(again).not.toHaveAttribute("open");
  evidence.checks.push("F2 pending dismiss no discard promise; error/cancel draft retained; retry acknowledged save/close/focus");
});

test("C84 settings lifecycle guards nested drafts, pending, error, retry and success", async ({ page }) => {
  test.setTimeout(120000); await login(page); await ready(page, "/settings");
  const details = page.locator(".managed-user-details").first(); await details.locator(':scope > summary').click();
  const form = details.locator("form").first(); await form.getByLabel("Tên hiển thị", { exact: true }).fill("C84 draft tài khoản");
  const reject = async (dialog: import("@playwright/test").Dialog) => dialog.dismiss(); page.on("dialog", reject);
  await page.getByRole("link", { name: /^Thông báo/ }).first().click(); await expect(page).toHaveURL(/settings/); await expect(form.getByLabel("Tên hiển thị", { exact: true })).toHaveValue("C84 draft tài khoản");
  await details.locator(':scope > summary').click(); await expect(details).toHaveAttribute("open", ""); page.off("dialog", reject);
  await abortAction(page); await form.getByRole("button", { name: "Lưu phân quyền" }).click(); await expect(form.getByText(/Chưa thể xác nhận/)).toBeVisible(); await expect(form.getByLabel("Tên hiển thị", { exact: true })).toHaveValue("C84 draft tài khoản");
  await page.unroute("**/*"); await pendingDelay(page); await form.getByRole("button", { name: "Lưu phân quyền" }).click(); await expect(form.getByRole("button", { name: "Đang lưu…" })).toBeDisabled();
  await page.getByRole("link", { name: /^Thông báo/ }).first().click(); await expect(page).toHaveURL(/settings/);
  await details.locator(':scope > summary').click(); await expect(details).toHaveAttribute("open", ""); await expect(details).not.toHaveAttribute("open"); await expect(details.locator(':scope > summary')).toBeFocused(); await page.unroute("**/*");
  await details.locator(':scope > summary').click(); await expect(details.getByLabel("Tên hiển thị", { exact: true })).toHaveValue("C84 draft tài khoản");
  const reset = details.locator(".managed-password-details"); await reset.locator("summary").click(); await reset.getByLabel("Mật khẩu tạm mới").fill("SyntheticPass123");
  page.once("dialog", dialog => dialog.dismiss()); await details.locator(':scope > summary').click(); await expect(reset.getByLabel("Mật khẩu tạm mới")).toHaveValue("SyntheticPass123");
  page.once("dialog", dialog => dialog.accept()); await details.locator(':scope > summary').click(); await expect(details).not.toHaveAttribute("open"); await details.locator(':scope > summary').click(); await reset.locator("summary").click(); await expect(reset.getByLabel("Mật khẩu tạm mới")).toHaveValue("");
  await ready(page, "/notifications"); // cleared dirty state permits leaving without a dialog
  evidence.checks.push("F3 settings nested close/navigation guard, transport error retry, pending, success close/focus, password cleared on discard (memory only)");
});

test("C84 manual/system theme SSR, persistence, no-JS and dirty-form isolation", async ({ page, browser }) => {
  test.setTimeout(120000); await page.emulateMedia({ colorScheme: "dark" }); await login(page); await ready(page, "/settings");
  const themes = page.locator(".theme-options"); await expect(themes.getByRole("radio", { name: "Theo thiết bị" })).toBeChecked();
  await themes.getByRole("radio", { name: "Sáng", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light"); expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("light");
  await page.emulateMedia({ colorScheme: "light" }); await themes.getByRole("radio", { name: "Tối", exact: true }).check();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
  const cookie = (await page.context().cookies()).find(item => item.name === "qlv_theme"); expect(cookie?.value).toBe("dark"); expect(cookie?.sameSite).toBe("Lax"); expect(cookie?.path).toBe("/");
  for (const route of ["/dashboard", "/loans", "/notifications", "/settings"]) { await ready(page, route); await expect(page.locator("html")).toHaveAttribute("data-theme", "dark"); }
  const details = page.locator(".create-user-details"); await details.locator("summary").click(); await details.getByLabel("Tên đăng nhập").fill("c84_unsaved");
  await themes.getByRole("radio", { name: "Sáng", exact: true }).focus(); await page.keyboard.press("ArrowRight"); await expect(themes.getByRole("radio", { name: "Tối", exact: true })).toBeChecked(); await expect(details.getByLabel("Tên đăng nhập")).toHaveValue("c84_unsaved");
  await themes.getByRole("radio", { name: "Theo thiết bị" }).check(); await page.emulateMedia({ colorScheme: "dark" }); expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark"); await expect(page.getByText("Đang theo thiết bị · Tối", { exact: true })).toBeVisible();
  page.once("dialog", d => d.accept()); await ready(page, "/settings");
  // Visit an SPA history entry before changing preference, then restore that entry.
  await page.locator('.theme-options').getByRole("radio", { name: "Sáng", exact: true }).check();
  await page.getByRole("link", { name: "Khoản vay", exact: true }).click(); await expect(page).toHaveURL(/\/loans$/);
  await page.goBack(); await expect(page).toHaveURL(/\/settings$/);
  await page.locator('.theme-options').getByRole("radio", { name: "Tối", exact: true }).check();
  await page.goForward(); await expect(page).toHaveURL(/\/loans$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.locator('meta[name="theme-color"]').evaluateAll(nodes => nodes.map(n => n.getAttribute("content")))).toEqual(["#0b1220", "#0b1220"]);
  await page.goBack(); await expect(page).toHaveURL(/\/settings$/); await expect(page.locator('.theme-options').getByRole("radio", { name: "Tối", exact: true })).toBeChecked();
  const state = await page.context().storageState();
  for (const preference of ["light", "dark", "invalid"] as const) {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: preference === "dark" ? "light" : "dark", storageState: state });
    await context.addCookies([{ name: "qlv_theme", value: preference, url: base }]); const nojs = await context.newPage(); await nojs.goto("/login");
    await expect(nojs.locator("html")).toHaveAttribute("data-theme", preference === "invalid" ? "system" : preference);
    expect(await nojs.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(preference === "light" ? "light" : "dark");
    const colors = await nojs.locator('meta[name="theme-color"]').evaluateAll(nodes => nodes.map(n => n.getAttribute("content"))); if (preference !== "invalid") expect(colors.every(c => c === (preference === "light" ? "#eaf0f8" : "#0b1220"))).toBe(true);
    await context.close();
  }
  await page.addInitScript(() => Object.defineProperty(document, "cookie", { get: () => "", set: () => {}, configurable: true })); await page.reload(); await page.locator(".theme-options").getByText("Sáng", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system"); await expect(page.getByText(/Trình duyệt không cho lưu lựa chọn/)).toBeVisible();
  evidence.checks.push("Theme manual overrides OS; keyboard, cookie/reload/routes/SSR no-JS, invalid/blocked fallback; settings draft/Auth unaffected");
});

function contrast(rgb1: string, rgb2: string) {
  const lum = (rgb: string) => { const channels = rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => { const s = rgb.startsWith("color(srgb") ? v : v / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }); return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722; };
  const a = lum(rgb1), b = lum(rgb2); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
test("C84 boundary text, amount, privacy and contrast matrix across both themes", async ({ page }) => {
  test.setTimeout(240000); await login(page);
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 768, 1024, 1440]) {
    await page.context().addCookies([{ name: "qlv_theme", value: theme, url: base }]); await page.emulateMedia({ colorScheme: theme === "light" ? "dark" : "light" }); await page.setViewportSize({ width, height: 900 });
    for (const route of ["counterparties", "expenses", "notifications", "settings", "dashboard", "loans", "login"]) {
      await ready(page, `/${route}`);
      if (route === "expenses") await page.locator(".expense-category-details > summary").click();
      if (route === "settings") await page.locator('.theme-options input:checked').focus();
      if (route === "notifications") await page.locator('.filter-pills a').last().hover();
      const result = await page.evaluate(() => {
        const visible = (e: Element) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let p = e.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement && !p.open && !p.querySelector(":scope > summary")?.contains(e)) return false; return true; };
        const text = [...document.querySelectorAll<HTMLElement>("main h2,main .notes-copy")].filter(e => (e.textContent?.length ?? 0) >= 80);
        const backgroundOf = (e: HTMLElement) => { for (let p: HTMLElement | null = e; p; p = p.parentElement) { const color = getComputedStyle(p).backgroundColor; if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") return color; } return "rgb(255, 255, 255)"; };
        const colors = [".page-description", ".eyebrow", ".notification-main small", ".unread-label", ".filter-pills a", ".theme-options label", ".expense-budget-total"].flatMap(selector => [...document.querySelectorAll<HTMLElement>(selector)].filter(visible).map(e => {
          let background = "rgb(255, 255, 255)"; for (let p: HTMLElement | null = e; p; p = p.parentElement) { const color = getComputedStyle(p).backgroundColor; if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") { background = color; break; } }
          return { selector, color: getComputedStyle(e).color, background, large: parseFloat(getComputedStyle(e).fontSize) >= 24 || (parseFloat(getComputedStyle(e).fontSize) >= 18.66 && Number(getComputedStyle(e).fontWeight) >= 700) };
        }));
        for (const e of [...document.querySelectorAll<HTMLInputElement>('main input[placeholder],main textarea[placeholder]')].filter(visible)) colors.push({ selector: "placeholder", color: getComputedStyle(e, "::placeholder").color, background: backgroundOf(e), large: false });
        const focusLabel = document.activeElement?.closest<HTMLElement>(".theme-options label");
        const focus = focusLabel ? { color: getComputedStyle(focusLabel).outlineColor, width: parseFloat(getComputedStyle(focusLabel).outlineWidth), background: backgroundOf(focusLabel.parentElement!) } : null;
        return { actualPath: location.pathname, width: innerWidth, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), clippedText: text.filter(e => e.scrollWidth > e.clientWidth + 1).length, nativeScheme: getComputedStyle(document.documentElement).colorScheme, colors,
          focus,
          tinySummary: [...document.querySelectorAll<HTMLElement>("main .compact-record-list summary,main .theme-options label")].filter(visible).filter(e => e.getBoundingClientRect().height < 44 || e.getBoundingClientRect().width < 44).length,
          clippedAmounts: [...document.querySelectorAll<HTMLElement>(".expense-card .counterparty-card-heading > strong,.expense-budget-total")].filter(visible).filter(e => e.scrollWidth > e.clientWidth + 1).length };
      });
      expect(result.overflow, `${route}/${width}/${theme}`).toBe(0); expect(result.clippedText).toBe(0); expect(result.clippedAmounts).toBe(0); expect(result.tinySummary).toBe(0); expect(result.nativeScheme).toBe(theme);
      for (const sample of result.colors) expect(contrast(sample.color, sample.background), `${route}/${sample.selector}/${theme}`).toBeGreaterThanOrEqual(sample.large ? 3 : 4.5);
      if (route === "settings") { expect(result.focus?.width).toBeGreaterThanOrEqual(2); expect(contrast(result.focus!.color, result.focus!.background)).toBeGreaterThanOrEqual(3); }
      evidence.matrix.push({ route, theme, ...result });
      if (capture && [390,1440].includes(width) && ["counterparties","expenses","notifications","settings"].includes(route)) await page.screenshot({ path: resolve(out, `${route}-${width}-${theme}.png`), fullPage: true });
    }
    await ready(page, "/expenses?page=2");
    const stressExpense = page.locator(".expense-card").filter({ hasText: "N".repeat(500) }); await expect(stressExpense).toBeVisible();
    const stress = await stressExpense.evaluate(e => {
      const text = [...e.querySelectorAll<HTMLElement>("h2,.notes-copy")]; const money = e.querySelector<HTMLElement>(".counterparty-card-heading > strong")!;
      const range = document.createRange(); range.selectNodeContents(money);
      return { overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), clippedText: text.filter(n => n.scrollWidth > n.clientWidth + 1).length, textLengths: text.map(n => n.textContent!.length), moneyHeight: range.getBoundingClientRect().height, moneyLine: parseFloat(getComputedStyle(money).lineHeight) };
    });
    expect(stress.overflow).toBe(0); expect(stress.clippedText).toBe(0); expect(stress.textLengths).toContain(80); expect(stress.textLengths).toContain(500); expect(stress.moneyHeight).toBeLessThanOrEqual(stress.moneyLine * 1.5);
    evidence.matrix.push({ route: "expenses-unbroken-page2", theme, width, ...stress });
    if (capture && [390,1440].includes(width)) await page.screenshot({ path: resolve(out, `expense-unbroken-${width}-${theme}.png`) });
    await ready(page, "/counterparties"); const menu = page.locator(".counterparty-menu").first(); await menu.locator("summary").click();
    const menuBounds = await menu.locator(".counterparty-menu-panel").evaluate(e => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, viewport: innerWidth }; });
    expect(menuBounds.left).toBeGreaterThanOrEqual(0); expect(menuBounds.right).toBeLessThanOrEqual(menuBounds.viewport);
    if (capture && width === 375) await page.screenshot({ path: resolve(out, `counterparty-menu-${width}-${theme}.png`) });
    await menu.locator("summary").focus(); await page.keyboard.press("Escape"); await expect(menu).not.toHaveAttribute("open"); await expect(menu.locator("summary")).toBeFocused();
    await ready(page, "/expenses"); const reversal = page.locator(".inline-reversal").first(); await reversal.locator("summary").click();
    const reverseButton = reversal.getByRole("button", { name: "Xác nhận đảo", exact: true }); await expect(reverseButton).toBeVisible();
    const textBounds = await reverseButton.evaluate(e => { const range = document.createRange(); range.selectNodeContents(e); return { height: range.getBoundingClientRect().height, line: parseFloat(getComputedStyle(e).lineHeight), width: e.getBoundingClientRect().width }; });
    expect(textBounds.height).toBeLessThanOrEqual(textBounds.line * 1.5); expect(textBounds.width).toBeGreaterThanOrEqual(44);
    evidence.matrix.push({ route: "expenses-open-reversal", theme, width, button: textBounds });
    if (capture && [390,1440].includes(width)) await page.screenshot({ path: resolve(out, `expense-reversal-${width}-${theme}.png`) });
    await reversal.locator("summary").click();
    await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)" }).first().click();
    await expect(page.locator(".expense-category-track,.expense-category-value")).toHaveCount(0); await expect(page.locator(".chart-privacy-notice")).toHaveCount(1);
    await page.reload(); await expect(page.locator(".expense-category-track,.expense-category-value")).toHaveCount(0);
    await page.getByRole("button", { name: "Hiển thị số tiền", exact: true }).first().click(); await page.locator(".expense-category-details > summary").click(); await expect(page.locator(".expense-category-track")).toHaveCount(2);
  }
  evidence.checks.push("F4/F5/F6/F7 manual opposite OS 70 route-width samples; complete text/nowrap amounts/44px/contrast; derived privacy absent on reload and restored");
});

test("C84 synthetic account creation/reset and viewer appearance access", async ({ page, browser }) => {
  test.setTimeout(90000); await login(page); await ready(page, "/settings");
  // Disposable account credentials exist only for this guarded local test run.
  const initialPassword = randomUUID().replaceAll("-", "");
  const resetPassword = randomUUID().replaceAll("-", "");
  const create = page.locator(".create-user-details"); await create.locator("summary").click();
  await create.getByLabel("Tên đăng nhập").fill("c84_viewer_test"); await create.getByLabel("Tên hiển thị", { exact: true }).fill("C84 tài khoản giả");
  await create.getByLabel("Vai trò").selectOption("VIEWER"); await create.getByLabel("Mật khẩu tạm", { exact: true }).fill(initialPassword);
  await create.getByRole("button", { name: "Tạo tài khoản", exact: true }).click(); await expect(create).not.toHaveAttribute("open"); await expect(create.locator("summary")).toBeFocused();
  const card = page.locator(".managed-user-card").filter({ hasText: "Tài khoản c84_viewer_test" }); await expect(card).toBeVisible();
  await card.locator(".managed-user-details > summary").click(); const reset = card.locator(".managed-password-details"); await reset.locator("summary").click();
  await reset.getByLabel("Mật khẩu tạm mới").fill(resetPassword); await reset.getByRole("button", { name: "Đặt mật khẩu tạm", exact: true }).click(); await expect(reset).not.toHaveAttribute("open"); await expect(reset.locator("summary")).toBeFocused();
  await reset.locator("summary").click(); await expect(reset.getByLabel("Mật khẩu tạm mới")).toHaveValue("");
  const local = localSupabaseEnvironment(); const viewer = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  const signed = await viewer.auth.signInWithPassword({ email: "c84_viewer_test@auth.local", password: resetPassword }); expect(signed.error).toBeNull();
  expect((await admin.from("profiles").select("must_change_password").eq("user_id", signed.data.user!.id).single()).data?.must_change_password).toBe(true);
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();
  const context = await browser.newContext(); const vp = await context.newPage(); await vp.goto("/login"); await vp.getByLabel("Tên đăng nhập").fill("c84_viewer_test"); await vp.getByLabel("Mật khẩu", { exact: true }).fill(resetPassword); await vp.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(vp).toHaveURL(/dashboard/); await ready(vp, "/settings");
  await expect(vp.locator(".theme-options input")).toHaveCount(3); await expect(vp.locator(".user-management-section")).toHaveCount(0); await context.close();
  evidence.checks.push("Local synthetic create/reset acknowledgments close/clear/focus; reset Auth must-change policy preserved; viewer appearance access without user administration");
});

test("C84 first-paint startup/login and financial drawer share manual theme", async ({ page, browser }) => {
  test.setTimeout(90000);
  for (const theme of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme: theme === "dark" ? "light" : "dark", viewport: { width: 390, height: 844 } });
    await context.addCookies([{ name: "qlv_theme", value: theme, url: base }]); const cold = await context.newPage();
    const errors: string[] = []; cold.on("pageerror", error => errors.push(error.name)); await cold.setExtraHTTPHeaders({ "x-e2e-auth-delay-ms": "2000" });
    const navigation = cold.goto("/login"); await expect(cold.locator(".initial-app-loading")).toBeVisible({ timeout: 1500 });
    await expect(cold.locator("html")).toHaveAttribute("data-theme", theme); expect(await cold.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(theme);
    await navigation; await expect(cold.getByRole("heading", { name: "Đăng nhập an toàn" })).toBeVisible(); expect(errors).toEqual([]); await context.close();
  }
  await page.context().addCookies([{ name: "qlv_theme", value: "dark", url: base }]); await page.emulateMedia({ colorScheme: "light" }); await page.setViewportSize({ width: 390, height: 844 }); await login(page);
  const loan = await admin.from("loans").select("id").eq("name", "Khoản thông báo E2E").single(); expect(loan.error).toBeNull(); await ready(page, `/loans/${loan.data!.id}`);
  await page.getByRole("button", { name: "Giao dịch", exact: true }).click(); const drawer = page.getByRole("dialog"); await expect(drawer).toBeVisible();
  expect(await drawer.evaluate(e => getComputedStyle(e).backgroundColor)).toBe("rgb(23, 34, 53)");
  const date = drawer.locator('input[type="date"]').first(); if (await date.count()) expect(await date.evaluate(e => getComputedStyle(e).colorScheme)).toBe("dark");
  await page.keyboard.press("Escape"); await expect(drawer).toBeHidden();
  evidence.checks.push("Manual contrary OS present during delayed first-paint startup/login; financial drawer/date theme and Escape unchanged");
});

test("C84 Evon fixed/sweep evidence", async ({ page }) => {
  test.skip(process.env.C84_EVON !== "true", "Opt-in Evon rendered evidence"); test.setTimeout(1200000);
  mkdirSync(out, { recursive: true }); mkdirSync(cache, { recursive: true }); await login(page);
  await page.context().storageState({ path: resolve(cache, "synthetic-storage.json") });
  const original = readFileSync("/Users/ngotuong/.codex/skills/evondev-ui-ux/scripts/probe.mjs", "utf8"); expect(original.split("await browser.newContext({").length - 1).toBe(3);
  writeFileSync(resolve(cache, "probe.mjs"), original.replaceAll("await browser.newContext({", "await browser.newContext({ storageState: process.env.C84_STORAGE_STATE,"));
  for (const route of ["counterparties","expenses","notifications","settings"]) for (const dark of [false,true]) {
    const probeOut = resolve(cache, `evon-${route}-${dark ? "dark" : "light"}`);
    const args = [resolve(cache,"probe.mjs"),`${base}/${route}`,"--pw",dirname(createRequire(createRequire(resolve(process.cwd(),"package.json")).resolve("@playwright/test/package.json")).resolve("playwright/package.json")),"--widths","375,390,768,1024,1440","--wait","300","--out",probeOut];
    if (dark) args.push("--dark"); else args.push("--sweep","1440,375,20");
    const log = await new Promise<string>((done,reject) => { const child=spawn(process.execPath,args,{env:{...process.env,C84_STORAGE_STATE:resolve(cache,"synthetic-storage.json")}}); let output=""; child.stdout.on("data",d=>output+=d); child.stderr.on("data",d=>output+=d); child.on("error",reject); child.on("close",code=>code===0?done(output):reject(new Error(`Evon ${route} ${code}`))); });
    writeFileSync(resolve(out,`evon-${route}-${dark?"dark":"light"}.txt`),log.replaceAll(cache,".cache/c84"));
  }
});
