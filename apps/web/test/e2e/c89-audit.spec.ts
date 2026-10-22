import { expect, test, type Page, type Locator } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";

const enabled = process.env.C89_AUDIT === "true";
const base = "http://127.0.0.1:3101";
const out = resolve(process.cwd(), "../../docs/audit-c89");
const cache = resolve(process.cwd(), "../../.cache/c89");
const password = readFileSync(resolve(process.cwd(), "test/e2e/global-setup.ts"), "utf8").match(/password: "([^"]+)"/)![1];

async function ready(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator(".content-loading")).toHaveCount(0);
}
async function metrics(page: Page) {
  return page.evaluate(() => {
    const painted = (e: Element) => {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(e).visibility === "hidden") return false;
      for (let p: Element | null = e; p; p = p.parentElement) {
        if (Number(getComputedStyle(p).opacity) === 0) return false;
        if (p instanceof HTMLDetailsElement && !p.open && !p.querySelector(":scope>summary")?.contains(e)) return false;
      }
      return true;
    };
    const geometry = (e: Element) => {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return { width: r.width, height: r.height, top: r.top, font: s.fontSize, weight: s.fontWeight, color: s.color, background: s.backgroundColor };
    };
    const samples = ["body", ".dashboard-metric p", ".dashboard-metric strong", ".dashboard-preset-control select", ".attention-toggle", ".advanced-filter-trigger", ".loan-card-heading h2", ".expense-pagination-top", ".page-description"]
      .map(selector => { const e = [...document.querySelectorAll(selector)].find(painted); return e ? { selector, ...geometry(e) } : { selector, missing: true }; });
    const amounts = [...document.querySelectorAll<HTMLElement>(".dashboard-primary-metrics strong,.loan-card-values dd,.expense-budget-total,.due-task strong,.expense-card .counterparty-card-heading>strong")].filter(painted);
    const clippedAmounts = amounts.filter(e => { const range = document.createRange(); range.selectNodeContents(e); return range.getBoundingClientRect().width > e.clientWidth + 1; }).map(e => e.className);
    const kpi = document.querySelector(".dashboard-primary-metrics")?.getBoundingClientRect(), task = document.querySelector(".attention-card")?.getBoundingClientRect();
    return { width: innerWidth, theme: document.documentElement.dataset.theme, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), visibleH1: [...document.querySelectorAll("h1")].filter(painted).length, fontLoaded: document.fonts.status, scrollY, bodyHeight: document.body.scrollHeight, samples, clippedAmounts, kpiBeforeTask: kpi && task ? kpi.bottom <= task.top : null };
  });
}

test("C89 B acceptance: journeys, rendered matrix, loading and Evon evidence", async ({ page, context, browser }) => {
  test.skip(!enabled, "Opt-in C89 audit; evidence does not certify untested devices/states");
  test.setTimeout(900000);
  mkdirSync(out, { recursive: true }); mkdirSync(cache, { recursive: true });
  if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
  await globalSetup();
  const local = localSupabaseEnvironment();
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password }); expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();
  await context.addCookies([{ name: "qlv_privacy_mode", value: "false", url: base }, { name: "qlv_theme", value: "system", url: base }]);
  await page.goto("/login"); await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e"); await page.getByLabel("Mật khẩu", { exact: true }).fill(password); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
  const evidence: { matrix: unknown[]; journeys: unknown[]; checks: Record<string, unknown>; failures: unknown[] } = { matrix: [], journeys: [], checks: {}, failures: [] };
  const persist = () => writeFileSync(resolve(out, "local-evidence.json"), JSON.stringify({ method: "Chrome production build, guarded disposable C20-test API55321/DB55322, synthetic data only", ...evidence }, null, 2));
  page.on("pageerror", error => { evidence.failures.push({ type: "pageerror", message: error.message }); persist(); });
  await ready(page, "/expenses"); await expect(page.locator(".expense-record-list>article")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 900 }); await page.screenshot({ path: resolve(out, "expenses-empty-390-light.png"), fullPage: true });
  evidence.checks.expensesEmpty = await metrics(page);
  const cp = await owner.rpc("create_counterparty", { p_name: "C89 Đối tác mẫu", p_notes: "Dữ liệu giả cho nghiệm thu UX" }); expect(cp.error).toBeNull();
  let loanId = "";
  for (let i = 0; i < 7; i++) {
    const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: cp.data, p_name: i === 0 ? (`C89 ${"Tên khoản vay tiếng Việt dài ".repeat(8)}`).slice(0, 200) : `C89 Khoản mẫu ${i + 1}`, p_direction: "LENDING", p_original_principal_vnd: i === 0 ? "99999999999999999" : 1000000, p_disbursement_date: `2026-09-${String(6 + i).padStart(2, "0")}`, p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: randomUUID(), p_notes: "Dữ liệu giả, không quyết toán tại frontend" }); expect(loan.error).toBeNull(); if (i === 0) loanId = loan.data;
  }
  for (let i = 0; i < 26; i++) expect((await owner.rpc("record_expense", { p_loan_id: null, p_transaction_date: "2026-10-01", p_amount_vnd: i === 0 ? "99999999999999999" : 100000 + i * 1000, p_category: i === 0 ? "C".repeat(80) : "Vận hành", p_idempotency_key: randomUUID(), p_note: i === 0 ? "N".repeat(500) : "Chi phí giả" })).error).toBeNull();
  const routes = [["dashboard", "/dashboard"], ["loans", "/loans?q=C89"], ["detail", `/loans/${loanId}`], ["counterparties", "/counterparties?q=C89"], ["expenses", "/expenses"], ["notifications", "/notifications"], ["settings", "/settings"]];
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 768, 1024, 1440]) {
    await context.addCookies([{ name: "qlv_theme", value: theme, url: base }]); await page.emulateMedia({ colorScheme: theme === "light" ? "dark" : "light" }); await page.setViewportSize({ width, height: 900 });
    for (const [label, route] of routes) {
      await ready(page, route); const m = await metrics(page); evidence.matrix.push({ route: label, ...m });
      if (m.overflow || m.clippedAmounts.length || m.visibleH1 !== 1 || m.kpiBeforeTask === false) evidence.failures.push({ type: "matrix", route: label, ...m });
      if ([375, 1440].includes(width)) await page.screenshot({ path: resolve(out, `${label}-${width}-${theme}.png`), fullPage: true });
      persist();
    }
    for (const journey of ["loan", "task", "counterparty", "expense", "notification", "theme"]) {
      const route = journey === "loan" ? "/loans" : journey === "task" ? "/dashboard" : journey === "counterparty" ? "/counterparties" : journey === "expense" ? "/expenses" : journey === "notification" ? "/notifications" : "/settings";
      await ready(page, route); const start = await metrics(page); const steps: unknown[] = []; let clicks = 0, edits = 0, historyActions = 0;
      const click = async (l: Locator, label: string) => { const before = await page.evaluate(() => scrollY); await l.click(); clicks++; steps.push({ action: label, scrollBefore: before, scrollAfter: await page.evaluate(() => scrollY) }); };
      let result = "PASS", error = "";
      try {
        if (journey === "loan") {
          await page.getByLabel("Tên khoản vay hoặc đối tác").fill("C89"); edits++; await expect(page).toHaveURL(/q=C89/);
          await expect(page.locator(".loan-card")).toHaveCount(7);
          await click(page.locator(".advanced-filter-trigger"), "Mở bộ lọc nâng cao"); await expect(page.locator(".loan-filter-dialog[open]")).toBeVisible(); await page.keyboard.press("Escape"); await expect(page.locator("dialog[open]")).toHaveCount(0);
          await click(page.locator(".loan-card").first(), "Mở khoản vay"); await expect(page.getByRole("button", { name: "Giao dịch", exact: true })).toBeVisible();
          const trigger = page.getByRole("button", { name: "Giao dịch", exact: true }); await click(trigger, "Mở giao dịch"); await expect(page.locator("dialog[open]")).toBeVisible(); await page.keyboard.press("Escape"); await expect(page.locator("dialog[open]")).toHaveCount(0); await expect(trigger).toBeFocused();
          await page.goBack({ waitUntil: "domcontentloaded" }); historyActions++; await expect(page).toHaveURL(/q=C89/);
        } else if (journey === "task") {
          const toggle = page.locator(".attention-toggle"); await toggle.focus(); const before = await page.evaluate(() => scrollY);
          await toggle.press("Enter"); await expect(toggle).toBeFocused(); expect(await page.evaluate(() => scrollY)).toBe(before); await toggle.press("Enter");
          await click(page.locator(".attention-card .due-item").first(), "Công việc mở trực tiếp giao dịch"); await expect(page.locator("dialog[open]")).toBeVisible(); await page.keyboard.press("Escape"); await expect(page.locator("dialog[open]")).toHaveCount(0); await page.goBack({ waitUntil: "domcontentloaded" }); historyActions++; await expect(page).toHaveURL(/dashboard/);
        } else if (journey === "counterparty") {
          await page.getByLabel("Tìm tên hoặc ghi chú đối tác").fill("C89"); edits++; await click(page.getByRole("button", { name: "Tìm kiếm", exact: true }), "Tìm đối tác"); await expect(page).toHaveURL(/q=C89/);
          const editor = page.locator(".edit-details").first(); await click(editor.locator("summary"), "Mở chỉnh sửa"); const field = editor.getByLabel("Tên đối tác"); await field.fill("C89 nháp không lưu"); edits++;
          page.once("dialog", d => d.dismiss()); await click(editor.locator("summary"), "Hủy bỏ nháp giữ editor"); await expect(editor).toHaveAttribute("open", ""); await expect(field).toHaveValue("C89 nháp không lưu");
          page.once("dialog", d => d.accept()); await click(editor.locator("summary"), "Xác nhận bỏ nháp"); await expect(editor).not.toHaveAttribute("open", "");
        } else if (journey === "expense") {
          const top = page.getByRole("navigation", { name: "Phân trang đầu danh sách chi phí", exact: true }); const next = top.getByRole("link", { name: /^Trang sau/ }); const box = await next.boundingBox(); expect(box!.y + box!.height).toBeLessThan(900);
          await click(next, "Trang sau ở đầu danh sách"); await expect(page).toHaveURL(/page=2/); await expect(page.locator(".expense-record-list>article")).toHaveCount(1); await page.goBack({ waitUntil: "domcontentloaded" }); historyActions++; await expect(page.locator(".expense-record-list>article")).toHaveCount(25);
          const trigger = page.getByRole("button", { name: "Thêm chi phí", exact: true }); await click(trigger, "Mở thêm chi phí"); const sheet = page.getByRole("dialog", { name: "Thêm chi phí", exact: true }); await sheet.getByLabel("Ghi chú").fill("C89 nháp không lưu"); edits++;
          page.once("dialog", d => d.dismiss()); await page.keyboard.press("Escape"); await expect(sheet).toBeVisible(); await expect(sheet.getByLabel("Ghi chú")).toHaveValue("C89 nháp không lưu");
          page.once("dialog", d => d.accept()); await page.keyboard.press("Escape"); await expect(sheet).toBeHidden(); await expect(trigger).toBeFocused();
          steps.push({ action: "Escape hủy rồi xác nhận bỏ nháp", topPagerY: box!.y });
        } else if (journey === "notification") {
          await click(page.locator(".filter-pills").getByRole("link", { name: /Chưa đọc/ }), "Lọc chưa đọc"); await expect(page).toHaveURL(/unread=true/); await page.goBack({ waitUntil: "domcontentloaded" }); await page.goForward({ waitUntil: "domcontentloaded" }); historyActions += 2; await expect(page).toHaveURL(/unread=true/);
        } else {
          await click(page.getByRole("radio", { name: "Sáng", exact: true }), "Sáng"); await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
          await page.getByRole("radio", { name: "Sáng", exact: true }).press("ArrowRight"); await expect(page.locator("html")).toHaveAttribute("data-theme", "dark"); await page.getByRole("radio", { name: "Tối", exact: true }).press("ArrowRight"); await expect(page.locator("html")).toHaveAttribute("data-theme", "system"); await page.reload(); await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
          steps.push({ action: "Mũi tên qua Tối/Theo thiết bị, tải lại giữ tùy chọn" }); await context.addCookies([{ name: "qlv_theme", value: theme, url: base }]);
        }
      } catch (e) { result = "FAIL"; error = String(e); evidence.failures.push({ type: "journey", journey, width, theme, error }); }
      evidence.journeys.push({ journey, width, theme, clicks, textEdits: edits, historyActions, steps, result, error, initial: start, final: await metrics(page) }); persist();
      if (result === "FAIL") { page.once("dialog", d => d.accept()); await page.reload(); }
    }
  }
  // Auth delay is scoped to the existing local E2E hook, after the first HTML byte.
  for (const theme of ["light", "dark"] as const) for (const delay of [2000, 10000]) {
    const cold = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce", colorScheme: theme }); await cold.addCookies([{ name: "qlv_theme", value: theme, url: base }]); const tab = await cold.newPage(); await tab.setExtraHTTPHeaders({ "x-e2e-auth-delay-ms": String(delay) });
    const start = Date.now(); const navigation = tab.goto("/login"); await expect(tab.locator(".initial-app-loading")).toBeVisible({ timeout: 1500 }); const feedbackMs = Date.now() - start; await expect(tab.getByText("C89 Đối tác mẫu", { exact: true })).toHaveCount(0); if (delay === 2000) await tab.screenshot({ path: resolve(out, `startup-${theme}.png`) }); await navigation; await expect(tab.locator(".initial-app-loading")).toHaveCount(0);
    evidence.checks[`startup-${theme}-${delay}`] = { feedbackMs, resolveMs: Date.now() - start, controlledDelayMs: delay, beforeHtmlGuarantee: false }; persist(); await cold.close();
  }
  // Keep probe's rules unchanged; inject only this disposable fixture's storage state.
  if (process.env.C89_EVON === "true") {
    await context.addCookies([{ name: "qlv_theme", value: "system", url: base }]); await context.storageState({ path: resolve(cache, "synthetic-storage.json") });
    const original = readFileSync("/Users/ngotuong/.codex/skills/evondev-ui-ux/scripts/probe.mjs", "utf8"); expect(original.split("await browser.newContext({").length - 1).toBe(3);
    writeFileSync(resolve(cache, "probe.mjs"), original.replaceAll("await browser.newContext({", "await browser.newContext({storageState: process.env.C89_STORAGE_STATE,"));
    const req = createRequire(resolve(process.cwd(), "package.json")), pw = dirname(createRequire(req.resolve("@playwright/test/package.json")).resolve("playwright/package.json"));
    const jobs = routes.flatMap(([label, route]) => [false, true].map(dark => ({ label, route, dark })));
    // Two bounded local probe processes at a time; no Production URL or storage export.
    for (let i = 0; i < jobs.length; i += 2) await Promise.all(jobs.slice(i, i + 2).map(async ({ label, route, dark }) => {
      const name = `${label}-${dark ? "dark" : "light"}`; const args = [resolve(cache, "probe.mjs"), `${base}${route}`, "--pw", pw, "--widths", "375,390,768,1024,1280,1440,1920", "--wait", "300", "--out", resolve(cache, `evon-${name}`)]; if (dark) args.push("--dark"); else args.push("--sweep", "1440,375,20");
      const result = await new Promise<{ code: number | null; log: string }>((done, reject) => { const child = spawn(process.execPath, args, { env: { ...process.env, C89_STORAGE_STATE: resolve(cache, "synthetic-storage.json") } }); let log = ""; child.stdout.on("data", d => { log += d; }); child.stderr.on("data", d => { log += d; }); child.on("error", reject); child.on("close", code => done({ code, log })); });
      writeFileSync(resolve(out, `evon-${name}.txt`), result.log.replaceAll(cache, ".cache/c89")); evidence.checks[`evon-${name}`] = { exitCode: result.code, report: `.cache/c89/evon-${name}/report.json`, rulesUnchanged: true }; persist(); expect(result.code).toBe(0);
    }));
  }
  persist(); expect(evidence.matrix).toHaveLength(70); expect(evidence.journeys).toHaveLength(60); expect(evidence.failures, "Audit failures retained; investigate before certifying acceptance").toEqual([]);
});

test("C89 reconciliation and isolated CSS proposal, without runtime edits", async ({ page, context }) => {
  test.skip(process.env.C89_REVIEW !== "true", "Opt-in synthetic audit proposal only");
  test.setTimeout(180000);
  mkdirSync(out, { recursive: true });
  if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
  await globalSetup();
  const local = localSupabaseEnvironment();
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password }); expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();
  const cp = await owner.rpc("create_counterparty", { p_name: "C89 Đối tác minh họa", p_notes: "Dữ liệu giả" }); expect(cp.error).toBeNull();
  const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: cp.data, p_name: "C89 Khoản vay minh họa", p_direction: "LENDING", p_original_principal_vnd: "99999999999999999", p_disbursement_date: "2026-09-06", p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: randomUUID(), p_notes: "Dữ liệu giả" }); expect(loan.error).toBeNull();
  for (let i = 0; i < 2; i++) expect((await owner.rpc("record_expense", { p_loan_id: null, p_transaction_date: "2026-10-01", p_amount_vnd: i ? 100000 : "99999999999999999", p_category: "Minh họa", p_idempotency_key: randomUUID(), p_note: "Dữ liệu giả" })).error).toBeNull();
  await context.addCookies([{ name: "qlv_privacy_mode", value: "false", url: base }]);
  await page.goto("/login"); await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e"); await page.getByLabel("Mật khẩu", { exact: true }).fill(password); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
  const rows: unknown[] = [], proofs: unknown[] = [];
  const detailMeasure = (selector = ".overview-primary strong,.overview-next strong,.overview-supporting strong") => page.evaluate(selector => {
    const money = [...document.querySelectorAll<HTMLElement>(selector)].map(e => {
      const n = e.querySelector(".vnd-number")!, u = e.querySelector(".vnd-unit")!;
      const range = document.createRange(); range.selectNodeContents(n);
      const lines = [...range.getClientRects()].filter(r => r.width > 0).map(r => ({ top: r.top, bottom: r.bottom, width: r.width }));
      const ur = u.getBoundingClientRect();
      return { text: e.textContent, numberLines: new Set(lines.map(r => Math.round(r.top))).size, unitSameLine: lines.some(r => ur.top < r.bottom && ur.bottom > r.top), fits: Math.max(...lines.map(r => r.width)) <= e.clientWidth + 1 };
    });
    const tabs = [...document.querySelectorAll(".loan-tabs a")].map(e => { const r = document.createRange(); r.selectNodeContents(e); return { label: e.textContent, lines: new Set([...r.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top))).size, height: e.getBoundingClientRect().height }; });
    return { width: innerWidth, theme: document.documentElement.dataset.theme, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), money, tabs };
  }, selector);
  // Applied to this disposable browser document only, never to apps/web/src.
  const proposal = `
    .overview-primary strong,.overview-next strong,.overview-supporting strong { white-space:nowrap; overflow-wrap:normal; }
    .overview-supporting strong>span,.overview-supporting .vnd-number,.overview-supporting .vnd-unit { display:inline; white-space:nowrap; }
    .overview-primary:has(.vnd-number[data-extra-wide="true"]) { display:grid; grid-template-columns:44px minmax(0,1fr); align-items:center; }
    .overview-primary:has(.vnd-number[data-extra-wide="true"])>div { display:contents; }
    .overview-primary:has(.vnd-number[data-extra-wide="true"]) p { grid-column:2; grid-row:1; }
    .overview-primary:has(.vnd-number[data-extra-wide="true"]) strong { grid-column:1 / -1; font-size:clamp(18px,4.8vw,28px); }
    .overview-primary:has(.vnd-number[data-extra-wide="true"]) small { grid-column:1 / -1; }
    .loan-tabs .ui-tab-list { width:100%; }
    .loan-tabs a { flex:1 0 auto; white-space:nowrap; min-width:max-content; min-height:48px; }
  `;
  writeFileSync(resolve(out, "proposal.css"), `/* C89 isolated synthetic preview; not installed in product. */\n${proposal}`);
  for (const theme of ["light", "dark"] as const) {
    await context.addCookies([{ name: "qlv_theme", value: theme, url: base }]);
    for (const width of [375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 }); await ready(page, `/loans/${loan.data}`);
      const before = await detailMeasure();
      await page.screenshot({ path: resolve(out, `proposal-before-${width}-${theme}.png`), fullPage: true });
      await page.addStyleTag({ content: proposal });
      const after = await detailMeasure();
      await page.screenshot({ path: resolve(out, `proposal-after-${width}-${theme}.png`), fullPage: true });
      rows.push({ width, theme, before, after });
      expect(after.overflow).toBe(0); expect(after.money.every(m => m.numberLines === 1 && m.unitSameLine && m.fits)).toBe(true); expect(after.tabs.every(t => t.lines === 1 && t.height >= 44)).toBe(true);
    }
    const dashboardAmounts: unknown[] = [];
    await ready(page, "/dashboard");
    for (const width of [375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const m = await detailMeasure(".dashboard-primary-metrics strong");
      dashboardAmounts.push(m);
      expect(m.money.every(v => v.numberLines === 1 && v.unitSameLine && v.fits)).toBe(true);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    const tip = page.locator(".cash-bar-control").first();
    const hidden = await tip.locator(".chart-tooltip").evaluate(e => ({ opacity: getComputedStyle(e).opacity, color: getComputedStyle(e).color, background: getComputedStyle(e).backgroundColor }));
    await tip.focus(); await expect(tip.locator(".chart-tooltip")).toHaveCSS("opacity", "1");
    const shown = await tip.locator(".chart-tooltip").evaluate(e => ({ opacity: getComputedStyle(e).opacity, color: getComputedStyle(e).color, background: getComputedStyle(e).backgroundColor, children: [...e.querySelectorAll(".vnd-number,.vnd-unit")].map(n => ({ color: getComputedStyle(n).color })) }));
    await page.screenshot({ path: resolve(out, `tooltip-shown-${theme}.png`) });
    await ready(page, "/expenses");
    const closed = await page.locator(".danger-button").first().evaluate(e => ({ closedDetails: !!e.closest("details:not([open])"), computedHeight: e.getBoundingClientRect().height }));
    const disclosure = page.locator("details").filter({ has: page.locator(".danger-button") }).first(); await disclosure.locator("summary").click();
    const opened = await disclosure.locator(".danger-button").evaluate(e => { const range = document.createRange(); range.selectNodeContents(e); return { height: e.getBoundingClientRect().height, width: e.getBoundingClientRect().width, textHeight: range.getBoundingClientRect().height, lineHeight: getComputedStyle(e).lineHeight, openDetails: !!e.closest("details[open]") }; });
    await page.screenshot({ path: resolve(out, `expense-reversal-open-${theme}.png`) });
    expect(opened.openDetails).toBe(true); expect(opened.height).toBeGreaterThanOrEqual(44);
    proofs.push({ theme, dashboardAmounts, tooltip: { hidden, shown }, expenseReversal: { closed, opened } });
  }
  writeFileSync(resolve(out, "proposal-evidence.json"), JSON.stringify({ method: "Same local synthetic DOM before/after temporary page.addStyleTag, no runtime edits", rows, proofs }, null, 2));
});
