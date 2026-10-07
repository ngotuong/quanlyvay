import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import ts from "typescript";
import { formatVnd } from "../../src/lib/business/format";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";

const base = "http://127.0.0.1:3101";
const out = resolve(process.cwd(), "../../docs/remediation-c90");
const cache = resolve(process.cwd(), "../../.cache/c90");
const capture = process.env.C90_EVIDENCE === "true";
const before = process.env.C90_PHASE === "before";
const phase = before ? "before" : "after";
const password = readFileSync(resolve(process.cwd(), "test/e2e/global-setup.ts"), "utf8").match(/password: "([^"]+)"/)![1];
// Playwright transforms imported JSX into its component-test objects. Compile the real
// component to ordinary React calls for this Node SSR presentation fixture instead.
mkdirSync(cache, { recursive: true });
const localRequire = createRequire(resolve(process.cwd(), "package.json"));
const compiledComponent = ts.transpileModule(readFileSync(resolve(process.cwd(), "src/components/ui/vnd-text.tsx"), "utf8"), { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
writeFileSync(resolve(cache, "vnd-text.cjs"), `const React = require(${JSON.stringify(localRequire.resolve("react"))});\n${compiledComponent}`);
const VndText = localRequire(resolve(cache, "vnd-text.cjs")).VndText;
let loanId = "";

test.beforeAll(async () => {
  // Match the existing isolated setup budget (C84); reset/readiness is not UI timing.
  test.setTimeout(300000);
  if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
  await globalSetup();
  const local = localSupabaseEnvironment();
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password }); expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();
  const cp = await owner.rpc("create_counterparty", { p_name: "C90 Đối tác mẫu", p_notes: "Dữ liệu giả" }); expect(cp.error).toBeNull();
  const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: cp.data, p_name: "C90 Khoản vay minh họa", p_direction: "LENDING", p_original_principal_vnd: "99999999999999999", p_disbursement_date: "2026-09-06", p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: randomUUID(), p_notes: "Dữ liệu giả" }); expect(loan.error).toBeNull(); loanId = loan.data;
  expect((await owner.rpc("record_expense", { p_loan_id: null, p_transaction_date: "2026-10-01", p_amount_vnd: "99999999999999999", p_category: "Minh họa", p_idempotency_key: randomUUID(), p_note: "Dữ liệu giả" })).error).toBeNull();
  if (capture) { mkdirSync(out, { recursive: true }); mkdirSync(cache, { recursive: true }); }
});

async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: base }, { name: "qlv_theme", value: "system", url: base }]);
  await page.goto("/login"); await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e"); await page.getByLabel("Mật khẩu", { exact: true }).fill(password); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
}
async function ready(page: Page, route: string) {
  await page.goto(route); await expect(page.locator("#main-content")).toBeVisible(); await expect(page.locator(".content-loading")).toHaveCount(0);
  await page.evaluate(async () => { await document.fonts.ready; });
}
async function geometry(page: Page, selector: string) {
  return page.evaluate(selector => {
    const painted = (e: Element) => {
      const r = e.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(e).visibility === "hidden") return false;
      for (let a: Element | null = e; a; a = a.parentElement) {
        if (Number(getComputedStyle(a).opacity) === 0) return false;
        if (a instanceof HTMLDetailsElement && !a.open && !a.querySelector(":scope>summary")?.contains(e)) return false;
      }
      return true;
    };
    const money = [...document.querySelectorAll<HTMLElement>(selector)].filter(e => painted(e) && e.querySelector(".vnd-number")).map(e => {
      const n = e.querySelector(".vnd-number")!, u = e.querySelector(".vnd-unit")!;
      const range = document.createRange(); range.selectNodeContents(n); const lines = [...range.getClientRects()].filter(r => r.width > 0);
      const ur = u.getBoundingClientRect(), er = e.getBoundingClientRect();
      const container = e.closest(".overview-supporting>div,.overview-primary,.overview-next,.dashboard-metric,.loan-card-values>div,.expense-budget-heading") || e.parentElement!;
      const cr = container.getBoundingClientRect(), style = getComputedStyle(container);
      const left = cr.left + parseFloat(style.paddingLeft), right = cr.right - parseFloat(style.paddingRight);
      return { text: e.textContent, numberLines: new Set(lines.map(r => Math.round(r.top))).size, unitSameLine: lines.some(r => ur.top < r.bottom && ur.bottom > r.top), fits: lines.every(r => r.left >= Math.max(left, er.left) - 1 && r.right <= Math.min(right, er.right) + 1) && ur.right <= right + 1, font: parseFloat(getComputedStyle(e).fontSize), opacity: getComputedStyle(n).opacity };
    });
    const tabs = [...document.querySelectorAll(".loan-tabs a")].map(e => { const r = document.createRange(); r.selectNodeContents(e); const rect = e.getBoundingClientRect(); return { label: e.textContent, lines: new Set([...r.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top))).size, height: rect.height }; });
    return { width: innerWidth, theme: document.documentElement.dataset.theme, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), money, tabs, bodyFont: getComputedStyle(document.body).fontSize };
  }, selector);
}

test("C90 exact VND glyphs, boundaries, privacy and loan-tab navigation", async ({ page, context }) => {
  test.setTimeout(240000);
  await login(page);
  const rows: unknown[] = [], stress: unknown[] = [], checks: unknown[] = [], observedFailures: unknown[] = [];
  const detailSelector = ".overview-primary strong,.overview-next strong,.overview-supporting strong";
  const otherRoutes = [["dashboard", "/dashboard", ".dashboard-primary-metrics strong"], ["loans", "/loans?q=C90", ".loan-card-values dd"], ["expenses", "/expenses", ".expense-budget-total,.expense-card .counterparty-card-heading>strong"]];
  const check = (m: Awaited<ReturnType<typeof geometry>>, label: string) => {
    expect(m.money.length, `${label}: meaningful painted money sample`).toBeGreaterThan(0);
    const bad = m.money.filter(v => v.numberLines !== 1 || !v.unitSameLine || !v.fits || v.opacity !== "1");
    if (m.overflow || bad.length || m.tabs.some(t => t.lines !== 1 || t.height < 44)) observedFailures.push({ label, ...m });
    if (!before) { expect(m.overflow, label).toBe(0); expect(bad, label).toEqual([]); expect(m.tabs.every(t => t.lines === 1 && t.height >= 44), label).toBe(true); expect(m.bodyFont).toBe("16px"); }
  };
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 768, 1024, 1440]) {
    await context.addCookies([{ name: "qlv_theme", value: theme, url: base }]); await page.emulateMedia({ colorScheme: theme === "light" ? "dark" : "light" }); await page.setViewportSize({ width, height: 900 });
    await ready(page, `/loans/${loanId}`);
    const m = await geometry(page, detailSelector); rows.push({ route: "detail", ...m }); check(m, `detail/${width}/${theme}`);
    if (!before) expect(m.money[0].font).toBeGreaterThanOrEqual(18);
    if (capture) await page.screenshot({ path: resolve(out, `${phase}-detail-${width}-${theme}.png`), fullPage: true });
    // Render the actual formatter and VndText into existing component slots, local DOM only.
    // Boundary/signed values are presentation fixtures, never sent to SQL/RPC.
    // Keep the original node identities so React privacy updates still address live nodes.
    await page.locator(detailSelector).evaluateAll(es => {
      (window as unknown as { c90PresentationNodes: Node[][] }).c90PresentationNodes = es.map(e => [...e.childNodes]);
    });
    for (const value of ["0", "1000000", "99999999999999999", "9223372036854775807", "-9223372036854775807"]) {
      const formatted = formatVnd(value), html = renderToStaticMarkup(createElement(VndText, { formatted }));
      await page.locator(detailSelector).evaluateAll((es, html) => es.forEach(e => { e.innerHTML = html; }), html);
      const s = await geometry(page, detailSelector); stress.push({ value, ...s });
      expect(s.money.every(v => v.text === formatted)).toBe(true); check(s, `stress/${value}/${width}/${theme}`);
      if (!before) expect(s.money[0].font).toBeGreaterThanOrEqual(18);
      if (capture && value === "9223372036854775807" && [375, 1440].includes(width)) await page.screenshot({ path: resolve(out, `${phase}-stress-max-${width}-${theme}.png`), fullPage: true });
    }
    await page.locator(detailSelector).evaluateAll(es => {
      const store = window as unknown as { c90PresentationNodes?: Node[][] };
      es.forEach((e, i) => e.replaceChildren(...store.c90PresentationNodes![i]));
      delete store.c90PresentationNodes;
    });
    if (!before) {
      const interest = page.getByRole("link", { name: "Các kỳ lãi", exact: true }); await interest.press("Enter"); await expect(page).toHaveURL(/tab=interest/); await expect(page.getByRole("link", { name: "Các kỳ lãi", exact: true })).toHaveAttribute("aria-current", "page");
      await page.goBack({ waitUntil: "domcontentloaded" }); await expect(page.locator(".overview-hero")).toBeVisible();
      await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)", exact: true }).click(); await expect(page.locator(".vnd-number")).toHaveCount(0); await expect(page.getByRole("button", { name: "Giao dịch", exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: "Hiển thị số tiền", exact: true }).click(); await expect(page.getByRole("button", { name: "Giao dịch", exact: true })).toBeVisible();
      checks.push({ width, theme, exactText: true, keyboardTabAndBack: true, privacyMoneyNodes: 0, restore: true });
    }
    for (const [label, route, selector] of otherRoutes) { await ready(page, route); const r = await geometry(page, selector); rows.push({ route: label, ...r }); check(r, `${label}/${width}/${theme}`); }
  }
  if (capture) writeFileSync(resolve(out, `${phase}-evidence.json`), JSON.stringify({ method: "Chrome production build + guarded C20-test. Actual local ledger screenshots; max/signed stress inserts real VndText markup into local presentation slots only, not financial mutations", rows, stress, checks, observedFailures }, null, 2));
  expect(rows).toHaveLength(40); expect(stress).toHaveLength(50);
  if (before) expect(observedFailures.length, "Known pre-fix UI failures are retained, not product PASS").toBeGreaterThan(0);
  else expect(observedFailures).toEqual([]);
});

test("C90 Evon detail fixed/sweep evidence", async ({ page, context }) => {
  test.skip(process.env.C90_EVON !== "true", "Opt-in visual probe; regression above is always enabled");
  test.setTimeout(240000); await login(page); mkdirSync(cache, { recursive: true }); mkdirSync(out, { recursive: true });
  await context.storageState({ path: resolve(cache, "synthetic-storage.json") });
  const original = readFileSync("/Users/ngotuong/.codex/skills/evondev-ui-ux/scripts/probe.mjs", "utf8"); expect(original.split("await browser.newContext({").length - 1).toBe(3);
  writeFileSync(resolve(cache, "probe.mjs"), original.replaceAll("await browser.newContext({", "await browser.newContext({storageState: process.env.C90_STORAGE_STATE,"));
  const req = createRequire(resolve(process.cwd(), "package.json")), pw = dirname(createRequire(req.resolve("@playwright/test/package.json")).resolve("playwright/package.json"));
  for (const dark of [false, true]) {
    const name = `detail-${dark ? "dark" : "light"}`; const args = [resolve(cache, "probe.mjs"), `${base}/loans/${loanId}`, "--pw", pw, "--widths", "375,390,768,1024,1280,1440,1920", "--wait", "300", "--out", resolve(cache, `evon-${name}`)]; if (dark) args.push("--dark"); else args.push("--sweep", "1440,375,20");
    const result = await new Promise<{ code: number | null; log: string }>((done, reject) => { const child = spawn(process.execPath, args, { env: { ...process.env, C90_STORAGE_STATE: resolve(cache, "synthetic-storage.json") } }); let log = ""; child.stdout.on("data", d => { log += d; }); child.stderr.on("data", d => { log += d; }); child.on("error", reject); child.on("close", code => done({ code, log })); });
    writeFileSync(resolve(out, `evon-${name}.txt`), result.log.replaceAll(cache, ".cache/c90")); writeFileSync(resolve(out, `evon-${name}.json`), readFileSync(resolve(cache, `evon-${name}/report.json`), "utf8").replaceAll(resolve(process.cwd(), "../.."), "[repository]")); expect(result.code).toBe(0);
  }
});
