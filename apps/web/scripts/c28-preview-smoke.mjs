import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const evidenceDirectory = resolve(repositoryRoot, ".cache/c28-preview-smoke");
const previewUrl = process.env.C28_PREVIEW_URL;
if (!previewUrl?.startsWith("https://")) throw new Error("C28_PREVIEW_URL must be an HTTPS immutable Preview URL.");

const environmentFile = resolve(repositoryRoot, process.env.C28_ENV_FILE ?? ".vercel/.env.preview.local");
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
const username = `c28_smoke_${suffix}`;
const email = `${username}@auth.local`;
const password = `C28${randomUUID().replaceAll("-", "")}9`;
const admin = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
const evidence = { previewUrl, account: username, role: "EDITOR", routes: [], ui: {}, consoleErrors: [], cleanup: {} };
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
    user_metadata: { provisioned_by_app: "true", username, display_name: "C28 Preview Smoke", app_role: "EDITOR" },
  }), "create smoke account");
  userId = created.user.id;
  await required(await admin.from("profiles").update({ must_change_password: false }).eq("user_id", userId), "activate smoke account");

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: "light", reducedMotion: "reduce" });
    page.on("console", (message) => { if (message.type() === "error") evidence.consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => evidence.consoleErrors.push(error.message));

    await page.goto(`${previewUrl}/login`);
    if (!(await page.locator('img[src*="brand-symbol-192.png"]').count())) throw new Error("new brand symbol missing on login");
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL(/\/dashboard$/);
    const revealPrivateData = page.getByRole("button", { name: "Hiển thị số tiền" });
    if (await revealPrivateData.count()) await revealPrivateData.click();
    evidence.ui.privacyRevealed = true;

    const routes = ["/dashboard", "/loans", "/counterparties", "/expenses", "/notifications", "/account"];
    for (const route of routes) {
      await page.goto(`${previewUrl}${route}`);
      await page.locator("#main-content h1").first().waitFor({ state: "attached" });
      if (await page.getByRole("heading", { name: "Chưa thể tải dữ liệu" }).count()) throw new Error(`failed route ${route}`);
      if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error(`horizontal overflow at ${route}`);
      evidence.routes.push(route);
    }

    await page.goto(`${previewUrl}/loans`);
    const quickAction = page.getByRole("link", { name: "Ghi giao dịch cho khoản vay" }).first();
    await quickAction.waitFor({ state: "visible" });
    await quickAction.click();
    await page.waitForURL(/transaction=1/);
    await page.waitForLoadState("networkidle");
    const sheet = page.getByRole("dialog", { name: "Ghi giao dịch" });
    evidence.ui.quickActionUrl = page.url();
    evidence.ui.quickActionDialogCount = await sheet.count();
    evidence.ui.quickActionAutoOpened = await sheet.isVisible();
    if (!evidence.ui.quickActionAutoOpened) {
      await page.screenshot({ path: resolve(evidenceDirectory, "quick-action-failed.png"), fullPage: true });
      throw new Error(`quick action did not auto-open: ${page.url()}`);
    }
    await sheet.getByRole("button", { name: /Đóng/ }).click();
    await sheet.waitFor({ state: "hidden" });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${previewUrl}/loans`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error("mobile loans horizontal overflow");
    await page.getByRole("button", { name: "Thêm" }).click();
    const menuSheet = page.getByRole("dialog", { name: "Tiện ích khác" });
    await menuSheet.waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await menuSheet.waitFor({ state: "hidden" });
    await page.screenshot({ path: resolve(evidenceDirectory, "loans-mobile.png"), fullPage: true });

    const manifest = await page.request.get(`${previewUrl}/manifest.webmanifest`);
    const manifestJson = await manifest.json();
    for (const src of ["/icons/brand-logo-192.png", "/icons/brand-logo-512.png", "/icons/brand-logo-maskable-512.png"]) {
      if (!manifestJson.icons?.some((icon) => icon.src === src)) throw new Error(`manifest missing ${src}`);
      if (!(await page.request.get(`${previewUrl}${src}`)).ok()) throw new Error(`icon unavailable ${src}`);
    }
    for (const path of ["/icons/favicon-16.png", "/icons/favicon-32.png", "/icons/apple-touch-icon.png"]) {
      if (!(await page.request.get(`${previewUrl}${path}`)).ok()) throw new Error(`icon unavailable ${path}`);
    }
    if (evidence.consoleErrors.length) throw new Error(`browser console errors: ${evidence.consoleErrors.join(" | ")}`);
    evidence.ui = { brand: true, quickAction: true, bottomSheet: true, mobileMenu: true, noHorizontalOverflow: true, pwaIcons: true };
  } finally {
    await browser.close();
  }
} finally {
  if (userId) {
    await admin.from("profiles").update({ is_active: false }).eq("user_id", userId);
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    evidence.cleanup = { profileDeactivated: true, authUserBanned: true };
  }
  writeFileSync(resolve(evidenceDirectory, "result.json"), `${JSON.stringify(evidence, null, 2)}\n`);
}

console.log(JSON.stringify({ status: "ok", evidence: ".cache/c28-preview-smoke/result.json", ...evidence }, null, 2));
