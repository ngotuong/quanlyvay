import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";

const capture = process.env.C81_EVIDENCE === "true";
const out = resolve(process.cwd(), "../../docs/remediation-c81");
const cache = resolve(process.cwd(), "../../.cache/c81");
const evidence: { matrix: unknown[]; checks: unknown[] } = { matrix: [], checks: [] };
let owner: SupabaseClient;
let counterpartyId = "";
let loanId = "";
let password = "OwnerE2eTemp123";
test.beforeAll(async () => {
  // Reset plus the existing 180s Auth readiness deadline must fit this fixture hook.
  test.setTimeout(300000);
  const local = localSupabaseEnvironment();
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const marker = await admin.from("counterparties").select("id").eq("name", "Đối tác mẫu C81").maybeSingle();
  const count = await admin.from("loans").select("id", { count: "exact", head: true });
  if (marker.error || count.error) throw marker.error || count.error;
  // C80 geometry reference needs the same baseline, independent of earlier volume tests.
  // Only reset the guarded disposable DB, and never reset during a restarted C81 worker.
  if (!marker.data && (count.count ?? 0) > 1) {
    if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
    await globalSetup();
  }
  owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  let signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  if (signed.error) { password = "123456"; signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password }); }
  if (signed.error || !signed.data.user) throw signed.error || new Error("Missing synthetic owner");
  const updated = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user.id);
  if (updated.error) throw updated.error;
  const existing = await owner.from("counterparties").select("id").eq("name", "Đối tác mẫu C81").maybeSingle();
  if (existing.error) throw existing.error;
  const cp = existing.data ? { data: existing.data.id, error: null } : await owner.rpc("create_counterparty", { p_name: "Đối tác mẫu C81", p_notes: "Synthetic local only" });
  if (cp.error) throw cp.error;
  counterpartyId = cp.data;
  // Same eight amounts, dates, names, directions and cycles as the C80 reference capture.
  for (let i = 0; i < 8; i++) {
    const loan = await createLoan(`C80 khoản mẫu tên dài kiểm tra đọc đủ ngữ cảnh và thứ bậc ${i + 1}`, i % 2 ? "BORROWING" : "LENDING", 128450000, null, `reference-${i}`);
    if (!i) loanId = loan;
  }
  if (capture) mkdirSync(out, { recursive: true });
});
test.afterAll(() => {
  if (capture) writeFileSync(resolve(out, "browser-evidence.json"), JSON.stringify({ method: "Local production build, headless Chrome, isolated API55321/DB55322; synthetic only", ...evidence }, null, 2));
});
async function createLoan(name: string, direction: string, amount: number, term: number | null, key: string) {
  const result = await owner.rpc("create_loan_v3", { p_counterparty_id: counterpartyId, p_name: name, p_direction: direction, p_original_principal_vnd: amount, p_disbursement_date: "2025-10-01", p_term_days: term, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: `c81-${key}`, p_notes: null });
  if (result.error) throw result.error;
  return result.data as string;
}
async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}
async function hide(page: Page) { await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)" }).first().click(); }
async function show(page: Page) { await page.getByRole("button", { name: "Hiển thị số tiền", exact: true }).first().click(); }
async function geometry(page: Page) {
  return page.evaluate(() => {
    const bounds = (selector: string) => {
      const r = document.querySelector(selector)!.getBoundingClientRect();
      return { top: r.top + scrollY, bottom: r.bottom + scrollY, height: r.height };
    };
    const kpis = bounds(".dashboard-primary-metrics");
    const tasks = bounds(".attention-card");
    const clippedAmounts = [...document.querySelectorAll<HTMLElement>(".dashboard-primary-metrics strong")].filter(el => el.scrollWidth > el.clientWidth + 1).length;
    return { width: innerWidth, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), kpis, tasks, clippedAmounts };
  });
}
test("C81 compact dashboard reference, privacy restoration and record headings", async ({ page }) => {
  test.setTimeout(240000);
  await login(page);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.name));
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 768, 1024, 1280, 1440]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard?from=2026-10-01&to=2026-10-03&preset=custom");
    await expect(page.locator(".attention-card")).toBeVisible();
    const metrics = await geometry(page);
    expect(metrics.overflow).toBe(0);
    expect(metrics.clippedAmounts).toBe(0);
    expect(metrics.kpis.bottom).toBeLessThanOrEqual(metrics.tasks.top);
    if (width === 1440) expect(metrics.tasks.top).toBeLessThanOrEqual(460);
    if (width === 390) expect(metrics.tasks.top).toBeLessThanOrEqual(700);
    await expect(page.locator(".action-hero-banner")).toContainText("03/10/2026–02/11/2026");
    await expect(page.locator(".action-hero-banner")).not.toContainText("giao dịch trong tháng");
    evidence.matrix.push({ route: "dashboard-reference", theme, ...metrics });
    if (capture && [375, 390, 1440].includes(width)) await page.screenshot({ path: resolve(out, `dashboard-${width}-${theme}.png`), fullPage: true });
  }
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 1440]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard?from=2025-10-01&to=2026-10-03&preset=custom");
    const chart = page.locator(".cash-flow-card");
    const bars = await chart.locator(".cash-bar-control").count();
    expect(bars).toBe(26);
    const control = chart.locator(".cash-bar-control").first();
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
    await control.press("Escape");
    await expect(control).toHaveAttribute("aria-pressed", "false");
    await control.press("Enter");
    await expect(control).toHaveAttribute("aria-pressed", "true");
    await hide(page);
    await expect(chart.locator(".privacy-placeholder")).toHaveCount(1);
    await expect(chart.locator(".cash-bar-control,[role=tooltip],.cash-flow-chart")).toHaveCount(0);
    await expect(chart.locator(".chart-y-axis > span")).toHaveText(["—", "—", "—"]);
    await chart.locator("summary").focus(); await page.keyboard.press("Enter");
    expect(await chart.ariaSnapshot()).not.toMatch(/\d+(?:\.\d{3})*[\s\u00a0\u202f]*₫/);
    if (capture && width === 390) await page.screenshot({ path: resolve(out, `dashboard-private-${width}-${theme}.png`), fullPage: true });
    await show(page);
    await expect(chart.locator(".cash-bar-control")).toHaveCount(bars);
    await expect(chart.locator('[aria-pressed="true"]')).toHaveCount(0);
    await expect(chart.locator("table")).toBeVisible();
    evidence.matrix.push({ route: "chart-privacy", width, theme, notices: 1, controlsHidden: 0, restoredBars: bars, tableKeyboard: true });
    for (const tab of ["overview", "interest", "history", "settings"]) {
      await page.goto(`/loans/${loanId}?tab=${tab}`);
      for (const privacy of ["shown", "hidden"]) {
        if (privacy === "hidden") await hide(page);
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
        evidence.matrix.push({ route: `detail-${tab}`, width, theme, privacy, h1: 1, overflow: 0 });
      }
      await show(page);
    }
  }
  expect(errors).toEqual([]);
});

test("C81 compact rows preserve statuses, money, metadata, filtering and navigation", async ({ page }) => {
  test.setTimeout(150000);
  const active = await createLoan("C81 ngắn", "LENDING", 1284500000, null, "short");
  await createLoan("C81 quá hạn", "BORROWING", 1284500, 30, "overdue");
  const bad = await createLoan("C81 nợ xấu", "LENDING", 1284500, null, "bad");
  const event = await owner.rpc("record_lifecycle_event_v2", { p_loan_id: bad, p_event_type: "BAD_DEBT_START", p_effective_date: "2025-11-01", p_idempotency_key: "c81-bad-start", p_note: "Synthetic" });
  if (event.error) throw event.error;
  const settled = await createLoan("C81 tất toán", "BORROWING", 1284500, null, "settled");
  const settlement = await owner.rpc("settle_loan", { p_loan_id: settled, p_settlement_date: "2025-11-01", p_idempotency_key: "c81-settle", p_note: "Synthetic" });
  if (settlement.error) throw settlement.error;
  const longName = "C81 " + "Tên khoản cần đọc đầy đủ với ngữ cảnh và ngày tháng ".repeat(4).slice(0, 196);
  await createLoan(longName, "BORROWING", 1284500000, null, "long");
  for (let i = 0; i < 26; i++) await createLoan(`C81 trang ${String(i).padStart(2, "0")}`, i % 2 ? "BORROWING" : "LENDING", 1284500, null, `page-${i}`);
  await login(page);
  for (const theme of ["light", "dark"] as const) for (const width of [375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/loans?q=C81&status=ALL&sort=name");
    const short = page.locator(".loan-card").filter({ has: page.getByRole("heading", { name: "C81 ngắn", exact: true }) });
    await expect(short).toContainText("1.284.500.000");
    for (const label of ["Gốc ban đầu", "Dư nợ gốc", "Lãi phải thu", "Lãi đã thu", "Giải ngân", "Lãi suất", "Ngày đóng lãi"]) await expect(short).toContainText(label);
    if (width === 1440) expect((await short.boundingBox())!.height).toBeLessThanOrEqual(160);
    if (width < 600) {
      const cardHeight = (await short.boundingBox())!.height;
      expect(cardHeight, `mobile loan card height at ${width}px`).toBeLessThanOrEqual(315);
      const money = short.locator(".loan-card-values .privacy-amount").first();
      expect(await money.evaluate(el => getComputedStyle(el).whiteSpace)).toBe("nowrap");
      const moneyWidth = await money.evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth }));
      expect(moneyWidth.scroll, `money width at ${width}px: ${JSON.stringify(moneyWidth)}`).toBeLessThanOrEqual(moneyWidth.client + 1);
      const header = await short.locator(".loan-card-title-line").evaluate((line) => {
        const title = line.querySelector("h2")!.getBoundingClientRect();
        const tags = line.querySelector(".loan-card-tags")!.getBoundingClientRect();
        return { sameRow: Math.abs(title.top - tags.top) < 4 };
      });
      expect(header.sameRow).toBe(true);
    }
    await expect(page.getByRole("heading", { name: longName, exact: true })).toBeVisible();
    const zero = page.locator(".loan-card").filter({ has: page.getByRole("heading", { name: "C81 tất toán", exact: true }) });
    await expect(zero.locator(".loan-card-values")).toContainText("0 ₫");
    await expect(zero.locator('.status-badge')).toHaveAttribute("data-status", "SETTLED");
    await expect(zero.locator(".loan-card-details")).toContainText("Ngày tất toán");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBe(0);
    evidence.matrix.push({ route: "loans", width, theme, ordinaryHeight: (await short.boundingBox())!.height, overflow });
    if (capture && [375, 390, 1440].includes(width)) await page.screenshot({ path: resolve(out, `loans-${width}-${theme}.png`), fullPage: true });
    if (capture && width === 390) await page.screenshot({ path: resolve(out, `loans-${width}-${theme}-viewport.png`) });
  }
  for (const status of ["ACTIVE", "OVERDUE", "BAD_DEBT", "SETTLED"]) {
    await page.goto(`/loans?q=C81&status=${status}`);
    expect(await page.locator(".loan-card").count()).toBeGreaterThan(0);
    for (const badge of await page.locator(".loan-card .status-badge").all()) await expect(badge).toHaveAttribute("data-status", status);
  }
  for (const direction of ["LENDING", "BORROWING"]) {
    await page.goto(`/loans?q=C81&status=ALL&direction=${direction}&sort=outstanding_desc`);
    for (const card of await page.locator(".loan-card").all()) await expect(card).toHaveAttribute("data-direction", direction);
  }
  await page.goto("/loans?q=C81&status=ALL&sort=name&page=2");
  await expect(page.locator(".loan-card").first()).toBeVisible();
  await page.goto("/loans?q=C81-khong-ton-tai&status=ALL");
  await expect(page.getByRole("heading", { name: "Không tìm thấy khoản phù hợp" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Xóa bộ lọc", exact: true })).toBeVisible();
  const returnTo = "/loans?q=C81&direction=LENDING&status=ALL&sort=oldest";
  await page.goto(returnTo);
  const card = page.locator(`.loan-card[href^="/loans/${active}?"]`);
  await expect(card).toHaveAttribute("href", `/loans/${active}?returnTo=${encodeURIComponent(returnTo)}`);
  await card.locator("..").getByRole("link", { name: "Ghi giao dịch cho khoản vay" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  evidence.checks.push({ statuses: 4, directions: 2, zeroAndBillion: true, longNameCharacters: longName.length, pagination: true, noResults: true, returnToQuickAction: true });
});

test("C81 privacy create guard is explicit, keyboard accessible and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page);
  for (const [route, label] of [["/expenses", "Thêm chi phí"], ["/counterparties", "Thêm đối tác"]]) {
    await page.goto(route);
    await hide(page);
    const trigger = page.getByRole("button", { name: label, exact: true });
    await trigger.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: label, exact: true })).toBeHidden();
    await expect(page.locator(".privacy-create-notice [role=status]")).toContainText("Chế độ riêng tư đang bật");
    await expect(page.getByRole("button", { name: "Hiển thị số tiền", exact: true }).first()).toBeVisible();
    const reveal = page.getByRole("button", { name: "Hiển thị số tiền để tiếp tục", exact: true });
    await page.keyboard.press("Tab"); await expect(reveal).toBeFocused();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: label, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("form")).toBeVisible();
    await expect(dialog).not.toContainText("Hãy bấm");
    await page.keyboard.press("Escape"); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter"); await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape"); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
    evidence.checks.push({ route, noAutomaticReveal: true, explicitKeyboardReveal: true, focusReturned: true, repeatOpenClose: true });
  }
});

test("C81 Evon probe on authenticated synthetic app", async ({ page }) => {
  test.skip(!capture, "Optional local evidence probe; functional assertions above always run");
  test.setTimeout(900000);
  await login(page);
  mkdirSync(cache, { recursive: true });
  const storage = resolve(cache, "synthetic-state.json");
  await page.context().storageState({ path: storage });
  // Probe only uses our disposable test identity. No real account/browser storage is read.
  const skill = "/Users/ngotuong/.codex/skills/evondev-ui-ux";
  const source = readFileSync(resolve(skill, "scripts/probe.mjs"), "utf8");
  // Local adapter also guards a probe Range offset of -1 on text with nonbreaking spaces.
  // This preserves measurements; it changes neither installed skill nor product DOM.
  const adapted = source.replaceAll("browser.newContext({", "browser.newContext({ storageState: process.env.C81_STORAGE_STATE,")
    .replace("beforeRange.setEnd(textNode, rawLastSpace);", "beforeRange.setEnd(textNode, Math.max(0, rawLastSpace));");
  expect(adapted !== source).toBe(true);
  const script = resolve(cache, "probe.mjs");
  writeFileSync(script, adapted);
  const run = promisify(execFile);
  for (const route of ["dashboard", "loans"]) for (const theme of ["light", "dark"]) {
    const destination = resolve(cache, `probe-${route}-${theme}`);
    const query = route === "dashboard" ? "?from=2026-10-01&to=2026-10-03&preset=custom" : "?q=C81&status=ALL&sort=name";
    const args = [script, `http://127.0.0.1:3101/${route}${query}`, "--pw", process.cwd(), "--widths", "375,390,768,1024,1280,1440,1920", "--out", destination];
    if (theme === "dark") args.push("--dark"); else args.push("--sweep");
    const result = await run(process.execPath, args, { env: { ...process.env, C81_STORAGE_STATE: storage }, maxBuffer: 8 * 1024 * 1024 });
    writeFileSync(resolve(destination, "report.txt"), result.stdout);
    console.log(`C81 probe ${route} ${theme} completed: ${destination}`);
  }
});
