import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const evidenceDirectory = resolve(repositoryRoot, ".cache/c23-preview-smoke");
const previewUrl = process.env.C23_PREVIEW_URL;
if (!previewUrl?.startsWith("https://")) throw new Error("C23_PREVIEW_URL must be an HTTPS immutable Preview URL.");

for (const line of readFileSync(resolve(repositoryRoot, ".vercel/.env.preview.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match || process.env[match[1]]) continue;
  const raw = match[2].trim();
  process.env[match[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !publishableKey || !secretKey) throw new Error("Preview Supabase environment is incomplete.");

mkdirSync(evidenceDirectory, { recursive: true });
const suffix = Date.now().toString(36);
const username = `c23_smoke_${suffix}`;
const email = `${username}@auth.local`;
const password = `C23${randomUUID().replaceAll("-", "")}9`;
const admin = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
const viewer = createClient(supabaseUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
const evidence = { previewUrl, account: username, database: {}, browser: {} };
let userId;

async function required(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.code || "unknown"} ${result.error.message}`);
  return result.data;
}

try {
  const created = await required(await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { provisioned_by_app: "true", username, display_name: "C23 Preview Smoke", app_role: "VIEWER" },
  }), "create smoke account");
  userId = created.user.id;
  await required(
    await admin.from("profiles").update({ must_change_password: false }).eq("user_id", userId),
    "activate smoke account without first-login password change",
  );

  await required(await viewer.auth.signInWithPassword({ email, password }), "sign in smoke account");
  const bundle = await required(await viewer.rpc("get_management_dashboard_bundle_v3", {
    p_period_start: "2026-09-01",
    p_period_end: "2026-09-10",
    p_previous_start: "2026-08-01",
    p_previous_end: "2026-08-10",
    p_balance_start: "2026-08-31",
    p_balance_end: "2026-08-31",
  }), "read C23 dashboard bundle");
  const dashboard = bundle.dashboard;
  const previous = bundle.previousDashboard;
  const opening = bundle.previousBalanceDashboard;
  const september = dashboard.cashFlow.find((row) => row.month === "2026-09");
  const expected = {
    activeLendingOutstandingVnd: "3850000000",
    badDebtLendingOutstandingVnd: "510000000",
    totalLendingExposureVnd: "4360000000",
    activeBorrowingOutstandingVnd: "1100000000",
    cashProfitVnd: "7030000",
    previousCashProfitVnd: "3035000",
    openingLendingVnd: "3950000000",
    openingBorrowingVnd: "1200000000",
    inflowVnd: "107800000",
    outflowVnd: "100770000",
    netVnd: "7030000",
  };
  const actual = {
    activeLendingOutstandingVnd: dashboard.activeLendingOutstandingVnd,
    badDebtLendingOutstandingVnd: dashboard.badDebtLendingOutstandingVnd,
    totalLendingExposureVnd: dashboard.totalLendingExposureVnd,
    activeBorrowingOutstandingVnd: dashboard.activeBorrowingOutstandingVnd,
    cashProfitVnd: dashboard.cashProfitVnd,
    previousCashProfitVnd: previous.cashProfitVnd,
    openingLendingVnd: opening.activeLendingOutstandingVnd,
    openingBorrowingVnd: opening.activeBorrowingOutstandingVnd,
    inflowVnd: september?.inflowVnd,
    outflowVnd: september?.outflowVnd,
    netVnd: september?.netVnd,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) throw new Error(`${key}: expected ${value}, received ${actual[key]}`);
  }

  const qaLoans = await required(await admin.from("loans").select("id").eq("is_test_data", true), "count QA loans");
  const listed = await required(await viewer.rpc("list_loan_summaries_page", {
    p_as_of_date: "2026-09-10", p_query: "C21 TEST ONLY", p_direction: null, p_status: null,
    p_disbursed_from: null, p_disbursed_to: null, p_sort: "name", p_page: 1, p_size: 25,
  }), "check QA loan listing");
  const snapshot = await required(await admin.rpc("get_google_sync_snapshot"), "read Google Sync snapshot");
  if (qaLoans.length !== 6) throw new Error(`expected 6 classified QA loans, received ${qaLoans.length}`);
  if (listed.totalCount !== 0) throw new Error(`QA list returned ${listed.totalCount} rows`);
  if (snapshot.tables.loans.some((loan) => loan.name.startsWith("C21 TEST ONLY"))) throw new Error("QA loan leaked into Google Sync");
  if (snapshot.tables.counterparties.some((counterparty) => counterparty.name.startsWith("C21 TEST ONLY"))) throw new Error("QA counterparty leaked into Google Sync");
  evidence.database = { expected, actual, classifiedQaLoans: qaLoans.length, qaLoanListCount: listed.totalCount, googleSyncQaLoans: 0, googleSyncQaCounterparties: 0 };

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const consoleErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    await page.goto(`${previewUrl}/login`);
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL(/\/dashboard$/);
    await page.getByRole("button", { name: "Hiển thị số tiền" }).click();
    await page.getByRole("button", { name: "Ẩn số tiền" }).waitFor({ state: "visible" });
    const metrics = (await page.locator(".dashboard-primary-metrics").innerText()).replaceAll(/\s+/g, " ");
    for (const expectedText of [
      "3.850.000.000", "Giảm 100.000.000", "so với 31/8/2026",
      "7.030.000", "Tăng 3.995.000", "so với 01–10/8/2026",
    ]) if (!metrics.includes(expectedText)) throw new Error(`dashboard missing: ${expectedText}`);
    await page.getByText("Xem bảng số liệu", { exact: true }).click();
    const cashTable = await page.locator(".cash-flow-details").innerText();
    for (const expectedText of ["107.800.000", "100.770.000", "7.030.000"]) {
      if (!cashTable.includes(expectedText)) throw new Error(`cash-flow table missing: ${expectedText}`);
    }
    await page.goto(`${previewUrl}/loans?q=C21+TEST+ONLY`);
    if (!(await page.locator("body").innerText()).includes("0 kết quả")) throw new Error("QA loans remain visible in web list");
    if (consoleErrors.length) throw new Error(`browser console errors: ${consoleErrors.join(" | ")}`);
    evidence.browser = { dashboardLabels: true, cashFlowTable: true, qaLoanListCount: 0, consoleErrors };
  } finally {
    await browser.close();
  }
} finally {
  if (userId) {
    await admin.from("profiles").update({ is_active: false }).eq("user_id", userId);
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  }
  writeFileSync(resolve(evidenceDirectory, "result.json"), `${JSON.stringify(evidence, null, 2)}\n`);
}

console.log(JSON.stringify({ status: "ok", evidence: ".cache/c23-preview-smoke/result.json", ...evidence }, null, 2));
