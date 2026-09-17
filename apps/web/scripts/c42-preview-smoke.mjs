import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const evidenceDirectory = resolve(repositoryRoot, ".cache/c42-preview-smoke");
const previewUrl = process.env.C42_PREVIEW_URL;
const refreshToken = process.env.C42_REFRESH_TOKEN;
const expectedInterestVnd = process.env.C42_EXPECTED_INTEREST_VND;

if (!previewUrl?.startsWith("https://")) throw new Error("C42_PREVIEW_URL must be an HTTPS Preview URL.");
if (!refreshToken) throw new Error("C42_REFRESH_TOKEN is required.");
if (!expectedInterestVnd) throw new Error("C42_EXPECTED_INTEREST_VND is required.");

const environmentFile = resolve(repositoryRoot, ".vercel/.env.preview.local");
for (const line of readFileSync(environmentFile, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match || process.env[match[1]]) continue;
  const raw = match[2].trim();
  process.env[match[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !publishableKey) throw new Error("Preview Supabase public environment is incomplete.");

const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
  method: "POST",
  headers: { apikey: publishableKey, "content-type": "application/json" },
  body: JSON.stringify({ refresh_token: refreshToken }),
});
if (!response.ok) throw new Error(`Unable to exchange the temporary smoke session (${response.status}).`);
const session = await response.json();

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const cookieName = `sb-${projectRef}-auth-token`;
const encodedSession = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
const cookieChunks = [];
for (let offset = 0; offset < encodedSession.length; offset += 3180) cookieChunks.push(encodedSession.slice(offset, offset + 3180));

mkdirSync(evidenceDirectory, { recursive: true });
const evidence = {
  previewUrl,
  routes: [],
  notificationPayment: {},
  createLoanCta: {},
  counterpartyPicker: {},
  consoleErrors: [],
};

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light", reducedMotion: "reduce" });
  const hostname = new URL(previewUrl).hostname;
  await context.addCookies(cookieChunks.map((value, index) => ({
    name: cookieChunks.length === 1 ? cookieName : `${cookieName}.${index}`,
    value,
    domain: hostname,
    path: "/",
    secure: true,
    sameSite: "Lax",
  })));

  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on("console", message => { if (message.type() === "error") evidence.consoleErrors.push(message.text()); });
  page.on("pageerror", error => evidence.consoleErrors.push(error.message));

  await page.goto(`${previewUrl}/notifications`);
  await page.getByRole("heading", { name: "Thông báo", exact: true }).waitFor();
  if (page.url().includes("/login")) throw new Error("Temporary smoke session did not authenticate.");
  if (await page.getByRole("heading", { name: "Chưa thể tải dữ liệu" }).count()) throw new Error("Notifications route failed.");
  const revealPrivateData = page.getByRole("button", { name: "Hiển thị số tiền" });
  if (await revealPrivateData.count()) await revealPrivateData.click();
  evidence.routes.push("/notifications");

  const notification = page.locator(".notification-item-button").filter({ hasText: "C42 Preview Smoke" });
  await notification.waitFor();
  await notification.click();
  await page.waitForURL(/\/loans\/[^/]+\?tab=overview&transaction=interest/);
  await page.waitForLoadState("domcontentloaded");
  const paymentDialog = page.locator("dialog.transaction-dialog[open]");
  try {
    await paymentDialog.waitFor({ timeout: 8_000 });
  } catch {
    const trigger = page.getByRole("button", { name: "Ghi giao dịch", exact: true });
    evidence.notificationPayment = {
      autoOpened: false,
      dialogCount: await page.locator("dialog.transaction-dialog").count(),
      triggerCount: await trigger.count(),
      viewerNotice: Boolean(await page.getByText("Bạn đang ở chế độ chỉ xem.", { exact: false }).count()),
    };
    if (await trigger.count()) {
      await trigger.click();
      evidence.notificationPayment.manualOpenWorked = Boolean(await paymentDialog.count());
    }
    throw new Error(`Interest dialog did not auto-open: ${JSON.stringify(evidence.notificationPayment)}.`);
  }
  if (await paymentDialog.getByLabel("Loại tiền").inputValue() !== "INTEREST_PAYMENT") throw new Error("Notification did not select interest payment.");
  const amount = await paymentDialog.getByLabel("Số tiền (VND)").inputValue();
  if (amount !== expectedInterestVnd) throw new Error(`Unexpected authoritative interest amount: ${amount}.`);
  evidence.notificationPayment = { opened: true, type: "INTEREST_PAYMENT", amountVnd: amount, submitted: false };
  await paymentDialog.getByRole("button", { name: "Hủy" }).click();

  await page.goto(`${previewUrl}/loans`);
  await page.getByRole("heading", { name: "Các khoản vay" }).waitFor();
  const desktopCreateLinks = page.getByRole("link", { name: "Tạo khoản vay", exact: true });
  if (await desktopCreateLinks.count() !== 1) throw new Error("Desktop loans page does not have exactly one create-loan CTA.");
  evidence.routes.push("/loans");
  evidence.createLoanCta.desktopCount = 1;

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(200);
  const mobileCreateLinks = page.locator("a.loan-create-link");
  const mobileCreateLinkCount = await mobileCreateLinks.count();
  if (mobileCreateLinkCount !== 1) throw new Error(`Mobile loans page has ${mobileCreateLinkCount} create-loan CTAs.`);
  const mobileCreateLink = await mobileCreateLinks.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { label: element.textContent?.trim(), display: getComputedStyle(element).display, visibility: getComputedStyle(element).visibility, width: rect.width, height: rect.height };
  });
  if (!/Tạo khoản vay/.test(mobileCreateLink.label ?? "") || mobileCreateLink.display === "none" || mobileCreateLink.visibility === "hidden" || mobileCreateLink.width <= 0 || mobileCreateLink.height < 44) {
    throw new Error(`Mobile create-loan CTA is not usable: ${JSON.stringify(mobileCreateLink)}.`);
  }
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error("Mobile loans page has horizontal overflow.");
  evidence.createLoanCta.mobileCount = 1;
  evidence.createLoanCta.mobileNoHorizontalOverflow = true;

  await page.goto(`${previewUrl}/loans/new`);
  await page.getByRole("heading", { name: "Tạo khoản vay", exact: true }).waitFor();
  if (await page.getByLabel("Tìm đối tác").count()) throw new Error("Obsolete counterparty search field remains.");
  const counterparty = page.getByRole("combobox", { name: "Đối tác", exact: true });
  await counterparty.click();
  const firstOption = page.getByRole("option").first();
  const optionName = (await firstOption.innerText()).trim();
  if (!optionName) throw new Error("Counterparty picker has no options.");
  await counterparty.fill(optionName.slice(0, Math.min(5, optionName.length)));
  await page.getByRole("option").first().waitFor();
  const selectedName = (await page.getByRole("option").first().innerText()).trim();
  await counterparty.press("Enter");
  if (await counterparty.inputValue() !== selectedName) throw new Error("Enter did not select the highlighted counterparty.");
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error("Mobile new-loan page has horizontal overflow.");
  evidence.routes.push("/loans/new");
  evidence.counterpartyPicker = { singleCombobox: true, keyboardSelection: true, selectedName };

  if (evidence.consoleErrors.length) throw new Error(`Browser console errors: ${evidence.consoleErrors.join(" | ")}`);
} finally {
  await browser.close();
  writeFileSync(resolve(evidenceDirectory, `result-${new URL(previewUrl).hostname}.json`), `${JSON.stringify(evidence, null, 2)}\n`);
}

console.log(JSON.stringify({ status: "ok", previewUrl, evidence: `.cache/c42-preview-smoke/result-${new URL(previewUrl).hostname}.json` }, null, 2));
