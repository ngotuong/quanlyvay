import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const evidenceDirectory = resolve(repositoryRoot, ".cache/c21-preview-smoke");
const previewUrl = process.env.C21_PREVIEW_URL;
if (!previewUrl?.startsWith("https://")) throw new Error("C21_PREVIEW_URL must be an HTTPS immutable Preview URL.");

function loadVercelEnvironment() {
  const source = readFileSync(resolve(repositoryRoot, ".vercel/.env.preview.local"), "utf8");
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    const raw = match[2].trim();
    process.env[match[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw;
  }
}

loadVercelEnvironment();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !publishableKey || !secretKey) throw new Error("Preview Supabase environment is incomplete.");

mkdirSync(evidenceDirectory, { recursive: true });
const suffix = Date.now().toString(36);
const username = process.env.C21_TEST_USERNAME ?? `c21_smoke_${suffix}`;
const email = `${username}@auth.local`;
const password = process.env.C21_TEST_PASSWORD ?? `C21${randomUUID().replaceAll("-", "")}9`;
const asOfDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

const owner = createClient(supabaseUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
const admin = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
let loanId;
const evidence = { previewUrl, asOfDate, account: username, financialHistoryPreserved: true, profiles: [], workflow: {}, runtime: {} };

async function required(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.code || "unknown"} ${result.error.message}`);
  return result.data;
}

async function inspectProfile(browser, profile) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    hasTouch: profile.hasTouch,
    isMobile: profile.isMobile,
    userAgent: profile.userAgent,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const expectedOfflineErrors = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (message.text().includes("ERR_INTERNET_DISCONNECTED")) expectedOfflineErrors.push(message.text());
    else consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${previewUrl}/login`);
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(/\/dashboard$/);

  const routes = [
    "/dashboard", "/loans", `/loans/${loanId}?tab=overview`, `/loans/${loanId}?tab=interest`,
    `/loans/${loanId}?tab=history`, `/loans/${loanId}?tab=settings`, "/loans/new", "/counterparties",
    "/expenses", "/notifications", "/account",
  ];
  for (const route of routes) {
    await page.goto(`${previewUrl}${route}`);
    await page.locator("#main-content h1").first().waitFor({ state: "attached" });
    if (new URL(page.url()).pathname !== new URL(route, previewUrl).pathname) {
      throw new Error(`${profile.name} redirected from ${route} to ${page.url()}`);
    }
    if (await page.getByRole("heading", { name: "Chưa thể tải dữ liệu" }).count()) throw new Error(`${profile.name} failed route ${route}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) throw new Error(`${profile.name} has horizontal overflow at ${route}`);
  }

  await page.goto(`${previewUrl}/loans/new`);
  await page.locator("#main-content h1").first().waitFor({ state: "attached" });
  if (await page.getByRole("heading", { name: "Chưa thể tải dữ liệu" }).count()) {
    await page.screenshot({ path: resolve(evidenceDirectory, `${profile.name}-new-loan-error.png`), fullPage: true });
    throw new Error(`${profile.name} failed route /loans/new before form inspection`);
  }
  const revealPrivateData = page.getByRole("button", { name: "Hiển thị số tiền" });
  if (await revealPrivateData.count()) await revealPrivateData.click();
  const lendingRadio = page.locator('input[name="direction"][value="LENDING"]');
  if (!(await lendingRadio.count())) {
    await page.screenshot({ path: resolve(evidenceDirectory, `${profile.name}-new-loan-missing-form.png`), fullPage: true });
    const body = (await page.locator("body").innerText()).replaceAll(/\s+/g, " ").slice(0, 300);
    throw new Error(`${profile.name} missing new-loan form at ${page.url()}: ${body}`);
  }
  await lendingRadio.check();
  await page.getByLabel("Số tiền gốc (VND)").fill("1234567");
  await page.getByLabel("Lãi suất mỗi kỳ (%)").fill("3");
  const submit = page.getByRole("button", { name: "Tạo khoản vay", exact: true });
  const controlHeights = await page.locator('.business-form input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), .business-form select, .business-form textarea, .business-form button, .business-form .segmented-control label').evaluateAll((elements) => elements.flatMap((element) => {
    const style = getComputedStyle(element);
    const height = element.getBoundingClientRect().height;
    return style.visibility !== "hidden" && style.display !== "none" && height > 0
      ? [{ tag: element.tagName, name: element.getAttribute("name"), className: element.className, height }]
      : [];
  }));
  const minimumControlHeight = Math.min(...controlHeights.map(({ height }) => height));
  if (minimumControlHeight < 44) {
    const undersized = controlHeights.filter(({ height }) => height < 44);
    throw new Error(`${profile.name} has controls below 44px: ${JSON.stringify(undersized)}`);
  }
  await submit.scrollIntoViewIfNeeded();
  if (!(await submit.isVisible())) throw new Error(`${profile.name} submit CTA is not visible`);

  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error(`${profile.name} overflows at 200% text zoom`);
  await page.screenshot({ path: resolve(evidenceDirectory, `${profile.name}-zoom-light.png`), fullPage: true });

  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.reload();
  await page.screenshot({ path: resolve(evidenceDirectory, `${profile.name}-dark.png`), fullPage: true });

  await page.setViewportSize({ width: profile.viewport.height, height: profile.viewport.width });
  await page.goto(`${previewUrl}/loans/new`);
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error(`${profile.name} landscape overflows`);
  await page.screenshot({ path: resolve(evidenceDirectory, `${profile.name}-landscape.png`), fullPage: true });

  await page.setViewportSize(profile.viewport);
  await page.goto(`${previewUrl}/account`);
  await context.setOffline(true);
  await page.getByText(/Đang mất kết nối/).waitFor({ state: "visible" });
  await context.setOffline(false);
  await page.getByText(/Đang mất kết nối/).waitFor({ state: "hidden" });

  const manifest = await page.request.get(`${previewUrl}/manifest.webmanifest`);
  if (!manifest.ok() || (await manifest.json()).display !== "standalone") throw new Error(`${profile.name} PWA manifest failed`);
  const serviceWorker = await page.request.get(`${previewUrl}/sw.js`);
  if (!serviceWorker.ok()) throw new Error(`${profile.name} service worker failed`);

  await page.goto(`${previewUrl}/loans`);
  const started = performance.now();
  await page.locator(`a[href^="/loans/${loanId}"]`).first().click();
  await page.locator("#main-content h1").first().waitFor({ state: "visible" });
  const navigationMs = Math.round(performance.now() - started);

  await page.goto(`${previewUrl}/account`);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.waitForURL(/\/login$/);
  evidence.profiles.push({
    name: profile.name, viewport: profile.viewport, routes: routes.length, minimumControlHeight,
    navigationMs, lightDark: true, textZoom200: true, landscape: true, offlineOnline: true,
    pwaManifest: true, serviceWorker: true, consoleErrors, expectedOfflineErrors,
  });
  if (consoleErrors.length) throw new Error(`${profile.name} console errors: ${consoleErrors.join(" | ")}`);
  await context.close();
}

try {
  await required(await owner.auth.signInWithPassword({ email, password }), "sign in test account");

  const existingLoanId = process.env.C21_EXISTING_LOAN_ID;
  if (existingLoanId) {
    loanId = existingLoanId;
    evidence.workflow = { loanId, reused: true };
  } else {
    const counterpartyId = await required(await owner.rpc("create_counterparty", {
    p_name: `C21 TEST ONLY ${suffix}`, p_notes: "Synthetic Preview QA record; never real financial data.",
    }), "create fake counterparty");
    loanId = await required(await owner.rpc("create_loan_v3", {
    p_counterparty_id: counterpartyId, p_name: `C21 TEST ONLY ${suffix}`, p_direction: "LENDING",
    p_original_principal_vnd: "9007199254740993", p_disbursement_date: asOfDate, p_term_days: null,
    p_interest_cycle_days: 30, p_initial_period_rate_percent: "0", p_interest_reminder_offset_days: 0,
    p_idempotency_key: `c21-preview-${suffix}-loan`, p_notes: "Synthetic Preview QA loan.",
  }), "create fake loan");
  const paymentId = await required(await owner.rpc("record_financial_transaction", {
    p_loan_id: loanId, p_type: "PRINCIPAL_PAYMENT", p_transaction_date: asOfDate, p_amount_vnd: "1",
    p_idempotency_key: `c21-preview-${suffix}-payment`, p_note: "Synthetic payment", p_recalculate_through: asOfDate,
  }), "record fake principal payment");
  await required(await owner.rpc("reverse_transaction", {
    p_transaction_id: paymentId, p_reversal_date: asOfDate, p_note: "Reverse synthetic payment",
    p_idempotency_key: `c21-preview-${suffix}-payment-reversal`, p_recalculate_through: asOfDate,
  }), "reverse fake principal payment");
  await required(await owner.rpc("record_lifecycle_event_v2", {
    p_loan_id: loanId, p_event_type: "BAD_DEBT_START", p_effective_date: asOfDate,
    p_idempotency_key: `c21-preview-${suffix}-bad-debt`, p_period_rate_percent: null,
    p_note: "Synthetic bad-debt state",
    }), "record fake bad-debt state");
    evidence.workflow = { counterpartyId, loanId, paymentId, paymentReversed: true, badDebtRecorded: true };
  }

  const classifiedLoan = await required(
    await admin.from("loans").update({ is_test_data: true }).eq("id", loanId).select("counterparty_id").single(),
    "classify fake loan",
  );
  await required(
    await admin.from("counterparties").update({ is_test_data: true }).eq("id", classifiedLoan.counterparty_id),
    "classify fake counterparty",
  );

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    await inspectProfile(browser, {
      name: "iphone-safari-like", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
      hasTouch: true, isMobile: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    });
    await inspectProfile(browser, {
      name: "android-chrome-like", viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625,
      hasTouch: true, isMobile: true,
      userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",
    });
  } finally {
    await browser.close();
  }
} finally {
  writeFileSync(resolve(evidenceDirectory, "result.json"), `${JSON.stringify(evidence, null, 2)}\n`);
}

console.log(JSON.stringify({
  status: "ok", account: username,
  loanId, profiles: evidence.profiles.map(({ name, navigationMs, minimumControlHeight }) => ({ name, navigationMs, minimumControlHeight })),
  evidence: ".cache/c21-preview-smoke/result.json",
}, null, 2));
