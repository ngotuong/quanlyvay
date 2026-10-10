import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";
import { normalizeVnd } from "../../src/lib/business/vnd.mjs";

const base = "http://127.0.0.1:3101";
const password = readFileSync(resolve(process.cwd(), "test/e2e/global-setup.ts"), "utf8").match(/password: "([^"]+)"/)![1];
const out = resolve(process.cwd(), "../../.cache/c95/after");
const observations: unknown[] = [];
let loanId = "", limitedLoanId = "";
const local = localSupabaseEnvironment();
const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });

test.beforeAll(async () => {
  test.setTimeout(300000);
  if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
  await globalSetup();
  expect(new URL(local.API_URL).port).toBe(process.env.CI === "true" ? "54321" : "55321");
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();
  const cp = await owner.rpc("create_counterparty", { p_name: "C92 Minh An", p_notes: "Dữ liệu giả C95" }); expect(cp.error).toBeNull();
  for (const [name, amount] of [["C92 Vốn kinh doanh Minh An", "1284500000"], ["C95 Giới hạn giả", "100000000"]]) {
    const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: cp.data, p_name: name, p_direction: "LENDING", p_original_principal_vnd: amount, p_disbursement_date: "2026-09-06", p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: randomUUID(), p_notes: "Dữ liệu giả" });
    expect(loan.error).toBeNull();
    if (amount === "1284500000") loanId = loan.data; else limitedLoanId = loan.data;
  }
  mkdirSync(out, { recursive: true });
});
test.afterAll(() => writeFileSync(resolve(out, "evidence.json"), JSON.stringify({ method: "Actual production Chrome, guarded C20-test; same empty focused principal as baseline; select/clear/focus preparation excluded; no real phone", observations }, null, 2)));

async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: base }, { name: "qlv_theme", value: "system", url: base }]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login"); await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e"); await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
}
async function principal(page: Page, id = loanId) {
  await page.goto(`/loans/${id}?transaction=1`);
  const dialog = page.getByRole("dialog", { name: "Ghi giao dịch", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("group", { name: "Nhập nhanh tiền gốc" })).toHaveCount(0);
  await dialog.getByLabel("Loại tiền", { exact: true }).selectOption("PRINCIPAL_PAYMENT");
  await dialog.evaluate(e => Promise.all(e.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => undefined))));
  const input = dialog.getByLabel("Số tiền (VND)", { exact: true }); await input.fill(""); await input.focus();
  return { dialog, input, group: dialog.getByRole("group", { name: "Nhập nhanh tiền gốc" }) };
}
async function discard(page: Page) { page.once("dialog", d => d.accept()); await page.keyboard.press("Escape"); await expect(page.getByRole("dialog", { name: "Ghi giao dịch", exact: true })).toBeHidden(); }

test("C95 same-context 50/100/150/200m each take one chip action without submission", async ({ page }) => {
  test.setTimeout(180000); await login(page);
  let posts = 0; const errors: string[] = [];
  page.on("request", r => { if (r.method() === "POST" && r.headers()["next-action"]) posts++; });
  page.on("pageerror", e => errors.push(e.message));
  for (const colorScheme of ["light", "dark"] as const) for (const width of [375, 1280]) {
    await page.emulateMedia({ colorScheme }); await page.setViewportSize({ width, height: 900 });
    const { input, group } = await principal(page);
    for (const millions of [50, 100, 150, 200]) {
      await input.fill(""); await input.focus();
      const chip = group.getByRole("button", { name: `Cộng ${millions} triệu đồng`, exact: true });
      await expect(chip).toHaveAttribute("type", "button"); await chip.click();
      await expect(input).toHaveValue(`${millions}.000.000`); await expect(input).toBeFocused();
      const formValue = await input.evaluate(e => String(new FormData((e as HTMLInputElement).form!).get("amountVnd")));
      expect(normalizeVnd(formValue)).toBe(`${millions}000000`);
      const caret = await input.evaluate(e => (e as HTMLInputElement).selectionStart); expect(caret).toBe(`${millions}.000.000`.length);
      observations.push({ task: "one-action", colorScheme, width, height: 900, millions, chipActions: 1, digitKeys: 0, display: await input.inputValue(), normalized: normalizeVnd(formValue), submits: posts, caret });
      if (millions === 50) { await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: resolve(out, `principal-${width}-${colorScheme}.png`), animations: "disabled" }); }
    }
    await discard(page);
  }
  expect(posts).toBe(0); expect(errors).toEqual([]);
});

test("C95 draft, keyboard, native reset, invalid paste and inclusive context limit", async ({ page }) => {
  test.setTimeout(120000); await login(page);
  const { dialog, input, group } = await principal(page, limitedLoanId);
  await input.fill("0"); await input.press("Tab"); await expect(group.getByRole("button").first()).toBeFocused(); await page.keyboard.press("Enter");
  await expect(input).toHaveValue("50.000.000"); await expect(input).toBeFocused();
  await group.getByRole("button", { name: "Cộng 50 triệu đồng", exact: true }).click(); await expect(input).toHaveValue("100.000.000");
  await group.getByRole("button", { name: "Cộng 50 triệu đồng", exact: true }).click(); await expect(input).toHaveValue("100.000.000");
  const error = dialog.locator(".quick-amount-error"); await expect(error).toContainText("100.000.000");
  expect((await input.getAttribute("aria-describedby"))?.split(" ")).toContain(await error.getAttribute("id"));
  await input.fill("10000000"); await expect(input).toHaveValue("10.000.000"); await expect(error).toHaveCount(0);
  const prevented = await input.evaluate(e => {
    const data = new DataTransfer(); data.setData("text/plain", "-1.5");
    return !e.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  });
  expect(prevented).toBe(true); await expect(input).toHaveValue("10.000.000"); expect(await input.evaluate(e => (e as HTMLInputElement).validity.customError)).toBe(true);
  await input.fill("1"); expect(await input.evaluate(e => (e as HTMLInputElement).validity.customError)).toBe(false);
  await input.press("ArrowLeft"); await input.press("5"); await expect(input).toHaveValue("51"); expect(await input.evaluate(e => (e as HTMLInputElement).selectionStart)).toBe(1);
  await input.fill("9007199254740993"); await expect(input).toHaveValue("9.007.199.254.740.993");
  await group.getByRole("button").first().click(); await expect(input).toHaveValue("9.007.199.254.740.993"); await expect(error).toBeVisible();
  await dialog.getByLabel("Loại tiền").selectOption("INTEREST_PAYMENT"); await expect(group).toHaveCount(0); await expect(error).toHaveCount(0); await expect(input).toHaveValue("9.007.199.254.740.993");
  await input.evaluate(e => (e as HTMLInputElement).form!.reset()); await expect(input).toHaveValue(""); await expect(dialog.getByLabel("Loại tiền")).toHaveValue("INTEREST_PAYMENT");
  await dialog.getByLabel("Loại tiền").selectOption("PRINCIPAL_PAYMENT"); await group.getByRole("button").first().click();
  page.once("dialog", d => d.dismiss()); await page.keyboard.press("Escape"); await expect(dialog).toBeVisible(); await expect(input).toHaveValue("50.000.000");
  await discard(page); await page.getByRole("button", { name: "Giao dịch", exact: true }).click(); await expect(input).toHaveValue(""); await expect(group).toHaveCount(0);
  observations.push({ task: "keyboard/draft/reset/limit", inclusiveLimit: "100000000", oversizedDraftPreserved: "9007199254740993", invalidPastePrevented: prevented, keyboardChip: "Enter", manualTenMillion: true });
});

test("C95 pending and retry preserve exact draft and idempotency, then reset after one transaction", async ({ page }) => {
  test.setTimeout(120000); await login(page);
  const { dialog, input, group } = await principal(page);
  await group.getByRole("button").first().click(); await dialog.getByLabel("Ngày thanh toán").fill("2026-10-10");
  const key = await dialog.locator("input[name=idempotencyKey]").inputValue();
  let abort = true;
  await page.route("**/*", async route => { if (abort && route.request().method() === "POST" && route.request().headers()["next-action"]) { abort = false; await route.abort("failed"); } else await route.continue(); });
  await dialog.getByRole("button", { name: "Ghi nhận", exact: true }).click(); await expect(dialog.getByText(/Chưa thể xác nhận thao tác/)).toBeVisible();
  await expect(input).toHaveValue("50.000.000"); await expect(dialog.locator("input[name=idempotencyKey]")).toHaveValue(key); await page.unroute("**/*");
  let release!: () => void; const held = new Promise<void>(resolve => { release = resolve; }); let heldOnce = false;
  await page.route("**/*", async route => { if (!heldOnce && route.request().method() === "POST" && route.request().headers()["next-action"]) { heldOnce = true; await held; } await route.continue(); });
  await dialog.getByRole("button", { name: "Ghi nhận", exact: true }).click();
  try {
    await expect(dialog.locator("form")).toHaveAttribute("aria-busy", "true");
    for (const button of await group.getByRole("button").all()) await expect(button).toBeDisabled();
    await expect(input).toBeDisabled(); await page.keyboard.press("Escape"); await expect(dialog).toBeVisible();
  } finally { release(); }
  await expect(dialog).toBeHidden(); await page.unroute("**/*");
  await expect(page.getByRole("button", { name: "Giao dịch", exact: true })).toBeFocused();
  const replay = await owner.rpc("record_financial_transaction", { p_loan_id: loanId, p_type: "PRINCIPAL_PAYMENT", p_transaction_date: "2026-10-10", p_amount_vnd: "50000000", p_idempotency_key: key, p_note: null }); expect(replay.error).toBeNull();
  const rows = await admin.from("transactions").select("amount_vnd,type").eq("loan_id", loanId).eq("type", "PRINCIPAL_PAYMENT"); expect(rows.error).toBeNull(); expect(rows.data).toHaveLength(1); expect(String(rows.data![0].amount_vnd)).toBe("50000000");
  await page.getByRole("button", { name: "Giao dịch", exact: true }).click(); await expect(input).toHaveValue(""); await expect(group).toHaveCount(0);
  observations.push({ task: "submit/retry/pending/idempotency/reset", exactTransaction: "50000000", principalTransactions: rows.data!.length, replaySucceeded: true, draftAndKeyRetained: true });
});

test("C95 responsive hit targets and simulated keyboard retain usable chips", async ({ page }) => {
  test.setTimeout(180000); await login(page);
  for (const colorScheme of ["light", "dark"] as const) for (const [width, height] of [[320, 900], [375, 420], [390, 667], [768, 900], [1024, 900], [1440, 900]]) {
    await page.emulateMedia({ colorScheme }); await page.setViewportSize({ width, height });
    const { input, group } = await principal(page);
    const geometry = await group.getByRole("button").evaluateAll(es => es.map(e => { const r = e.getBoundingClientRect(); return { width: r.width, height: r.height, overflow: e.scrollWidth > e.clientWidth + 1 }; }));
    expect(geometry.every(r => r.width >= 44 && r.height >= 44 && !r.overflow), JSON.stringify({ width, height, colorScheme, geometry })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await group.getByRole("button", { name: "Cộng 200 triệu đồng", exact: true }).click(); await expect(input).toBeFocused(); await expect(input).toHaveValue("200.000.000");
    observations.push({ task: "responsive", colorScheme, width, height, geometry, simulatedKeyboard: height === 420 }); await discard(page);
  }
});
