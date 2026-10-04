import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";

// Observation harness: successful capture is not a claim that the product has no defects.
test.use({ actionTimeout: 15000 });
const enabled = process.env.C83_AUDIT === "true";
const out = resolve(process.cwd(), "../../docs/audit-c83");
const cache = resolve(process.cwd(), "../../.cache/c83");
const matrix: unknown[] = [];
const observations: Record<string, unknown> = {};
const local = localSupabaseEnvironment();
const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const password = "OwnerE2eTemp123";

test.afterAll(() => {
  if (enabled && matrix.length) writeFileSync(resolve(out, "local-evidence.json"), JSON.stringify({ method: "Synthetic Chrome local production build; guarded C20-test API55321/DB55322", matrix, observations }, null, 2));
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
    const visible = (e: Element) => {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(e).visibility === "hidden") return false;
      for (let p = e.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement && !p.open && !p.querySelector(":scope > summary")?.contains(e)) return false;
      return true;
    };
    const controls = [...document.querySelectorAll<HTMLElement>("main a,main button,main input,main select,main summary")].filter(visible);
    return {
      width: innerWidth, theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      visibleH1: [...document.querySelectorAll("h1")].filter(visible).length,
      tinyTargets: controls.filter(e => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map(e => ({ tag: e.tagName, class: e.className })),
      unlabelledFields: [...document.querySelectorAll<HTMLInputElement>("main input,main select,main textarea")].filter(visible).filter(e => !e.labels?.length && !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby")).length,
      pagination: document.querySelector('nav[aria-label="Phân trang"] p')?.textContent,
      empty: [...document.querySelectorAll(".empty-state h2")].map(e => e.textContent),
      rowCount: document.querySelectorAll(".counterparty-list > article,.notification-list > article,.notification-list > form").length,
      expenseTotal: (() => { const e = document.querySelector("strong.text-indigo-600"); if (!e) return null; const s = getComputedStyle(e); const p = e.closest(".surface-card"); return { color: s.color, background: p ? getComputedStyle(p).backgroundColor : "", fontSize: s.fontSize, fontWeight: s.fontWeight }; })(),
    };
  });
}
test("C83 synthetic module matrix, lifecycle and Evon observation", async ({ page }) => {
  test.skip(!enabled, "Opt-in synthetic C83 audit");
  test.setTimeout(1200000);
  mkdirSync(out, { recursive: true }); mkdirSync(cache, { recursive: true });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  if (signed.error || !signed.data.user) throw signed.error || new Error("Missing synthetic owner");
  const profile = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user.id);
  expect(profile.error).toBeNull();
  await login(page);
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 768, 1024, 1440]) {
    await page.emulateMedia({ colorScheme: theme }); await page.setViewportSize({ width, height: 900 });
    await ready(page, "/expenses"); matrix.push({ route: "expenses-empty", privacy: "shown", ...await measure(page) });
  }
  for (let i = 0; i < 27; i++) {
    const result = await owner.rpc("create_counterparty", { p_name: i === 0 ? `C83 ${"Đối tác tên dài kiểm tra ".repeat(5)}`.slice(0, 120) : `C83 Đối tác mẫu ${String(i + 1).padStart(2, "0")}`, p_notes: i === 0 ? "Ghi chú giả kiểm tra đọc đủ. ".repeat(18).slice(0, 500) : "Dữ liệu giả để audit" });
    expect(result.error).toBeNull();
  }
  for (let i = 0; i < 26; i++) {
    const expense = await owner.rpc("record_expense", { p_loan_id: null, p_transaction_date: "2026-10-01", p_amount_vnd: i === 0 ? 1284500000 : 100000 + i * 1000, p_category: i === 0 ? "Chi phí vận hành tên dài để kiểm tra khả năng đọc trên màn hình nhỏ và tiền lớn" : i % 2 ? "Vận hành" : "Văn phòng", p_idempotency_key: `c83-expense-${i}`, p_note: "Dữ liệu tài chính giả, không phải chi phí thật" });
    expect(expense.error).toBeNull();
  }
  const loan = await admin.from("loans").select("id").eq("name", "Khoản thông báo E2E").single();
  expect(loan.error).toBeNull();
  const notifications = await admin.from("notifications").insert(Array.from({ length: 27 }, (_, i) => ({ user_id: signed.data.user!.id, loan_id: loan.data!.id, type: "INTEREST_DUE", notification_date: "2026-10-01", title: `C83 nhắc thu lãi mẫu ${i + 1}`, body: "Đối tác mẫu • 1.000.000\nSố lãi phải thu : 30.000\nDữ liệu giả dùng cho audit", idempotency_key: `c83-notification-${i}` })));
  expect(notifications.error).toBeNull();
  const routes = [
    ["counterparties", "/counterparties"], ["counterparties-page2", "/counterparties?page=2"], ["counterparties-page99", "/counterparties?page=99"], ["counterparties-search-empty", "/counterparties?q=c83-no-match"],
    ["expenses", "/expenses"], ["expenses-page2", "/expenses?page=2"], ["expenses-page99", "/expenses?page=99"],
    ["notifications", "/notifications"], ["notifications-unread", "/notifications?unread=true"], ["notifications-page99", "/notifications?unread=true&page=99"], ["settings", "/settings"],
  ];
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 768, 1024, 1440]) {
    await page.emulateMedia({ colorScheme: theme }); await page.setViewportSize({ width, height: 900 });
    for (const [label, route] of routes) {
      await ready(page, route); matrix.push({ route: label, privacy: "shown", ...await measure(page) });
      if ([390, 1440].includes(width) && ["counterparties", "expenses", "notifications", "settings", "notifications-page99"].includes(label)) await page.screenshot({ path: resolve(out, `${label}-${width}-${theme}.png`), fullPage: true });
    }
    await ready(page, "/expenses"); await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)" }).first().click();
    observations[`expense-private-${width}-${theme}`] = await page.locator("main").evaluate(e => ({ percentages: [...e.querySelectorAll("small.text-muted")].map(n => n.textContent).filter(t => t?.includes("%")), barWidths: [...e.querySelectorAll<HTMLElement>(".bg-indigo-600")].map(n => n.style.width), maskedAmounts: e.querySelectorAll(".privacy-amount-masked").length }));
    matrix.push({ route: "expenses-private", privacy: "hidden", ...await measure(page) });
    if (width === 390) await page.screenshot({ path: resolve(out, `expenses-private-${width}-${theme}.png`), fullPage: true });
    await page.getByRole("button", { name: "Hiển thị số tiền" }).first().click();
  }
  await page.setViewportSize({ width: 390, height: 900 }); await page.emulateMedia({ colorScheme: "light" });
  await ready(page, "/counterparties");
  const create = page.getByRole("button", { name: "Thêm đối tác", exact: true }); await create.click();
  const sheet = page.getByRole("dialog"); await sheet.getByLabel("Tên đối tác").fill("C83 saved through drawer");
  await page.route("**/*", async r => { if (r.request().method() === "POST" && r.request().headers()["next-action"]) await r.abort("failed"); else await r.continue(); });
  await sheet.getByRole("button", { name: "Thêm đối tác", exact: true }).click();
  await expect(sheet.getByText(/Chưa thể xác nhận thao tác/)).toBeVisible();
  observations.counterpartyErrorRetainsDraft = await sheet.getByLabel("Tên đối tác").inputValue() === "C83 saved through drawer";
  await page.unroute("**/*");
  await sheet.getByRole("button", { name: "Thêm đối tác", exact: true }).click(); await expect(sheet).toBeHidden(); await expect(create).toBeFocused();
  observations.counterpartySaveClosesReturnsFocus = true;
  const editor = page.locator(".edit-details").first(); await editor.locator("summary").click();
  const name = editor.getByLabel("Tên đối tác"); const editId = await editor.locator('[name="id"]').inputValue();
  await name.fill("C83 pending-close observation");
  await page.route("**/*", async r => { if (r.request().method() === "POST" && r.request().headers()["next-action"]) await new Promise(done => setTimeout(done, 2000)); await r.continue(); });
  await editor.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(editor.getByRole("button", { name: "Đang lưu…" })).toBeDisabled();
  let closeDialog = "";
  page.once("dialog", async d => { closeDialog = d.message(); await d.accept(); });
  await editor.locator("summary").click();
  observations.editorPendingClose = { closedWhilePending: await editor.getAttribute("open") === null, dialog: closeDialog };
  await page.waitForTimeout(2500); await page.unroute("**/*");
  const persisted = await admin.from("counterparties").select("name").eq("id", editId).single();
  observations.editorPendingClosePersisted = persisted.data?.name === "C83 pending-close observation";
  await ready(page, "/expenses"); const expenseTrigger = page.getByRole("button", { name: "Thêm chi phí", exact: true }); await expenseTrigger.click();
  const expenseSheet = page.getByRole("dialog"); await expenseSheet.getByLabel("Số tiền (VND)").fill("250000"); await expenseSheet.getByLabel("Nhóm chi phí").fill("C83 drawer save");
  await expenseSheet.getByRole("button", { name: "Ghi chi phí chung" }).click(); await expect(expenseSheet).toBeHidden(); await expect(expenseTrigger).toBeFocused();
  observations.expenseSaveClosesReturnsFocus = true;
  await ready(page, "/settings"); await page.getByText("Quản lý tài khoản", { exact: true }).first().click();
  await page.locator(".managed-user-details").first().getByLabel("Tên hiển thị", { exact: true }).fill("C83 unsaved settings draft");
  let navigationDialogs = 0; page.on("dialog", async d => { navigationDialogs++; await d.dismiss(); });
  await page.getByRole("link", { name: /^Thông báo/ }).first().click(); await expect(page).toHaveURL(/notifications/);
  observations.settingsDraftNavigation = { confirmDialogs: navigationDialogs, leftPage: true };
  await ready(page, "/settings"); await page.getByText("Quản lý tài khoản", { exact: true }).first().click();
  observations.settingsDraftLost = await page.locator(".managed-user-details").first().getByLabel("Tên hiển thị", { exact: true }).inputValue() !== "C83 unsaved settings draft";
  await page.emulateMedia({ colorScheme: "dark" }); observations.systemChange = await page.evaluate(() => ({ background: getComputedStyle(document.body).backgroundColor, dark: matchMedia("(prefers-color-scheme: dark)").matches }));
  await page.emulateMedia({ colorScheme: "light" });
  console.log("C83 lifecycle observations complete");
  await page.context().storageState({ path: resolve(cache, "synthetic-storage.json") });
  if (process.env.C83_EVON === "true") {
    const original = readFileSync("/Users/ngotuong/.codex/skills/evondev-ui-ux/scripts/probe.mjs", "utf8");
    const occurrences = original.split("await browser.newContext({").length - 1; expect(occurrences).toBe(3);
    const adapted = original.replaceAll("await browser.newContext({", "await browser.newContext({ storageState: process.env.C83_STORAGE_STATE,");
    writeFileSync(resolve(cache, "probe.mjs"), adapted);
    for (const route of ["counterparties", "expenses", "notifications", "settings"]) for (const dark of [false, true]) {
      console.log(`C83 Evon ${route} ${dark ? "dark" : "light"}`);
      const probeOut = resolve(cache, `evon-${route}-${dark ? "dark" : "light"}`);
      const args = [resolve(cache, "probe.mjs"), `http://127.0.0.1:3101/${route}`, "--pw", dirname(createRequire(createRequire(resolve(process.cwd(), "package.json")).resolve("@playwright/test/package.json")).resolve("playwright/package.json")), "--widths", "375,390,768,1024,1440", "--wait", "300", "--out", probeOut];
      if (dark) args.push("--dark"); else args.push("--sweep", "1440,375,20");
      const log = await new Promise<string>((done, reject) => {
        const child = spawn(process.execPath, args, { env: { ...process.env, C83_STORAGE_STATE: resolve(cache, "synthetic-storage.json") } });
        let output = ""; child.stdout.on("data", d => { output += d; }); child.stderr.on("data", d => { output += d; }); child.on("error", reject); child.on("close", code => code === 0 ? done(output) : reject(new Error(`Evon probe ${route} exit ${code}`)));
      });
      writeFileSync(resolve(out, `evon-${route}-${dark ? "dark" : "light"}.txt`), log.replaceAll(cache, ".cache/c83"));
      const report = JSON.parse(readFileSync(resolve(probeOut, "report.json"), "utf8"));
      observations[`evon-${route}-${dark ? "dark" : "light"}`] = { fixedWidths: report.widths.length, sweepSteps: report.sweep.length };
    }
  }
  observations.observedCompletion = true;
  writeFileSync(resolve(out, "local-evidence.json"), JSON.stringify({ method: "Synthetic Chrome local production build, guarded C20-test API55321/DB55322; observations are not product assertions", matrix, observations }, null, 2));
});

test("C83 supplemental valid unbroken text and unsupported push observations", async ({ page }) => {
  test.skip(!enabled, "Opt-in synthetic C83 audit");
  test.setTimeout(300000);
  // A full opt-in run executes the main observation first. Reset only this named
  // disposable fixture before the boundary case so pagination cannot hide long text.
  if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
  await globalSetup();
  mkdirSync(out, { recursive: true });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  expect(signed.error).toBeNull();
  const profile = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id);
  expect(profile.error).toBeNull();
  const cp = await owner.rpc("create_counterparty", { p_name: `C83 ${"L".repeat(116)}`, p_notes: "N".repeat(500) }); expect(cp.error).toBeNull();
  const expense = await owner.rpc("record_expense", { p_loan_id: null, p_transaction_date: "2026-10-01", p_amount_vnd: 9999999999, p_category: "C".repeat(80), p_idempotency_key: randomUUID(), p_note: "N".repeat(500) }); expect(expense.error).toBeNull();
  await login(page);
  const supplemental: unknown[] = [];
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 768, 1024, 1440]) for (const route of ["counterparties", "expenses"]) {
    await page.emulateMedia({ colorScheme: theme }); await page.setViewportSize({ width, height: 900 }); await ready(page, `/${route}`);
    const extra = await page.evaluate(() => ({
      longContent: [...document.querySelectorAll<HTMLElement>("main h2,main .notes-copy")].filter(e => (e.textContent?.length ?? 0) >= 80).map(e => ({ class: e.className, width: e.clientWidth, scrollWidth: e.scrollWidth, overflowX: getComputedStyle(e).overflowX, overflowWrap: getComputedStyle(e).overflowWrap })),
      reversalTargets: [...document.querySelectorAll<HTMLElement>(".inline-reversal > summary")].map(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height, pseudoHeight: getComputedStyle(e, "::after").height })),
      nativeColorScheme: getComputedStyle(document.documentElement).colorScheme,
    }));
    supplemental.push({ route, ...await measure(page), ...extra });
    if ([390,1440].includes(width)) await page.screenshot({ path: resolve(out, `unbroken-${route}-${width}-${theme}.png`) });
  }
  await page.addInitScript(() => { Object.defineProperty(window, "PushManager", { value: undefined, configurable: true }); Reflect.deleteProperty(window, "PushManager"); });
  await ready(page, "/notifications"); await page.locator(".push-settings-disclosure > summary").click();
  const push = await page.locator(".push-settings-disclosure").evaluate(e => ({ unsupported: !("PushManager" in window), summary: e.querySelector("summary")?.textContent, switchDisabled: e.querySelector<HTMLButtonElement>('[role="switch"]')?.disabled, switchName: e.querySelector('[role="switch"]')?.getAttribute("aria-label"), permission: "Notification" in window ? Notification.permission : "unavailable" }));
  writeFileSync(resolve(out, "supplemental-evidence.json"), JSON.stringify({ method: "Separate guarded synthetic fixture; valid schema-boundary unbroken text; PushManager removed before page load; no permission requested", supplemental, push }, null, 2));
});
