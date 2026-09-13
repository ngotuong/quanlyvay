import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const evidenceDirectory = resolve(repositoryRoot, ".cache/c31-preview-smoke");
const previewUrl = process.env.C31_PREVIEW_URL;
if (!previewUrl?.startsWith("https://")) throw new Error("C31_PREVIEW_URL must be an HTTPS immutable Preview URL.");

const environmentFile = resolve(repositoryRoot, process.env.C31_ENV_FILE ?? ".vercel/.env.preview.local");
for (const line of readFileSync(environmentFile, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match || process.env[match[1]]) continue;
  const raw = match[2].trim();
  process.env[match[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !publishableKey || !secretKey) {
  const missing = [!supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL", !publishableKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", !secretKey && "SUPABASE_SECRET_KEY"].filter(Boolean);
  throw new Error(`Preview Supabase environment is incomplete: ${missing.join(", ")}.`);
}

mkdirSync(evidenceDirectory, { recursive: true });
const suffix = Date.now().toString(36);
const username = `c31_smoke_${suffix}`;
const email = `${username}@auth.local`;
const password = `C31${randomUUID().replaceAll("-", "")}9`;
const notificationBody = "C31 Test • 50.000.000\nGiải ngân : 24/07/2024\nSố lãi phải thu : 3.000.000";
const admin = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
const evidence = { previewUrl, account: username, role: "EDITOR", routes: [], ui: {}, consoleErrors: [], cleanup: {} };
let userId;
let notificationId;

async function required(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.code || "unknown"} ${result.error.message}`);
  return result.data;
}

try {
  const created = await required(await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { provisioned_by_app: "true", username, display_name: "C31 Preview Smoke", app_role: "EDITOR" },
  }), "create smoke account");
  userId = created.user.id;
  await required(await admin.from("profiles").update({ must_change_password: false }).eq("user_id", userId), "activate smoke account");
  const inserted = await required(await admin.from("notifications").insert({
    user_id: userId,
    type: "INTEREST_DUE",
    notification_date: "2026-09-13",
    title: "Đến ngày thu lãi",
    body: notificationBody,
    idempotency_key: `c31-smoke:${userId}`,
  }).select("id").single(), "create smoke notification");
  notificationId = inserted.id;

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: "light", reducedMotion: "reduce" });
    page.on("console", (message) => { if (message.type() === "error") evidence.consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => evidence.consoleErrors.push(error.message));

    await page.goto(`${previewUrl}/login`);
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL(/\/dashboard$/);
    const revealPrivateData = page.getByRole("button", { name: "Hiển thị số tiền" });
    if (await revealPrivateData.count()) await revealPrivateData.click();

    for (const route of ["/notifications", "/loans"]) {
      await page.goto(`${previewUrl}${route}`);
      await page.locator("#main-content h1").first().waitFor({ state: "attached" });
      if (await page.getByRole("heading", { name: "Chưa thể tải dữ liệu" }).count()) throw new Error(`failed route ${route}`);
      if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error(`horizontal overflow at ${route}`);
      evidence.routes.push(route);
    }

    await page.goto(`${previewUrl}/notifications`);
    const unread = page.locator('.notification-item[data-read="false"]');
    await unread.waitFor({ state: "visible" });
    const renderedBody = await unread.locator(".notification-body").innerText();
    if (renderedBody !== notificationBody) throw new Error(`notification body mismatch: ${JSON.stringify(renderedBody)}`);
    const unreadBackground = await unread.evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
    const read = page.locator('.notification-item[data-read="true"]');
    await read.waitFor({ state: "visible" });
    const readBackground = await read.evaluate((element) => getComputedStyle(element).backgroundColor);
    if (readBackground === unreadBackground) throw new Error("read and unread notification backgrounds are identical");

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${previewUrl}/loans`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error("mobile loans horizontal overflow");
    await page.getByRole("button", { name: /Nâng cao/ }).click();
    const dialog = page.getByRole("dialog", { name: "Ngày giải ngân và sắp xếp" });
    await dialog.waitFor({ state: "visible" });
    const dialogBox = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    if (dialogBox.left < 0 || dialogBox.right > 375 || dialogBox.top < 0 || dialogBox.bottom > 812) {
      throw new Error(`advanced filter dialog outside viewport: ${JSON.stringify(dialogBox)}`);
    }
    const dateBoxes = await dialog.locator('input[type="date"]').evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, height: rect.height };
    }));
    if (dateBoxes.length !== 2 || dateBoxes.some((box) => box.left < dialogBox.left || box.right > dialogBox.right || box.height < 40)) {
      throw new Error(`date controls outside dialog or undersized: ${JSON.stringify(dateBoxes)}`);
    }
    const overlap = dateBoxes[0].left < dateBoxes[1].right && dateBoxes[0].right > dateBoxes[1].left
      && dateBoxes[0].top < dateBoxes[1].bottom && dateBoxes[0].bottom > dateBoxes[1].top;
    if (overlap) throw new Error("advanced-filter date controls overlap");
    if (await dialog.getByRole("button", { name: "Đóng", exact: true }).count()) throw new Error("obsolete bottom Close button remains");
    await dialog.getByRole("button", { name: "Đóng bộ lọc nâng cao" }).click();
    await dialog.waitFor({ state: "hidden" });

    if (evidence.consoleErrors.length) throw new Error(`browser console errors: ${evidence.consoleErrors.join(" | ")}`);
    evidence.ui = {
      multilineNotification: true,
      distinctReadState: true,
      centeredAdvancedFilter: true,
      dateControlsDoNotOverlap: true,
      obsoleteCloseButtonRemoved: true,
      mobileNoHorizontalOverflow: true,
    };
  } finally {
    await browser.close();
  }
} finally {
  if (notificationId) {
    await admin.from("notifications").delete().eq("id", notificationId);
    evidence.cleanup.notificationDeleted = true;
  }
  if (userId) {
    await admin.from("profiles").update({ is_active: false }).eq("user_id", userId);
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    evidence.cleanup.profileDeactivated = true;
    evidence.cleanup.authUserBanned = true;
  }
  writeFileSync(resolve(evidenceDirectory, "result.json"), `${JSON.stringify(evidence, null, 2)}\n`);
}

console.log(JSON.stringify({ status: "ok", evidence: ".cache/c31-preview-smoke/result.json", ...evidence }, null, 2));
