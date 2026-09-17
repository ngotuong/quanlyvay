import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const targetUrl = process.env.C44_TARGET_URL;
const refreshToken = process.env.C44_REFRESH_TOKEN;
const environment = process.env.C44_ENVIRONMENT;

if (!targetUrl?.startsWith("https://")) throw new Error("C44_TARGET_URL must be HTTPS.");
if (!refreshToken) throw new Error("C44_REFRESH_TOKEN is required.");
if (!["preview", "production"].includes(environment)) throw new Error("C44_ENVIRONMENT is invalid.");

// Preview and Production intentionally share the same Supabase project. The
// Preview pull contains the public client values needed only to exchange the
// temporary smoke refresh token; no service credential is used by this script.
const environmentFile = resolve(root, ".vercel/.env.preview.local");
for (const line of readFileSync(environmentFile, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match || process.env[match[1]]) continue;
  const raw = match[2].trim();
  process.env[match[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !publishableKey) throw new Error("Supabase public environment is incomplete.");

const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
  method: "POST",
  headers: { apikey: publishableKey, "content-type": "application/json" },
  body: JSON.stringify({ refresh_token: refreshToken }),
});
if (!response.ok) {
  const failure = await response.json().catch(() => ({}));
  throw new Error(`Smoke session exchange failed (${response.status}, ${failure.error_code ?? failure.code ?? "unknown"}: ${failure.msg ?? failure.error_description ?? failure.message ?? ""}).`);
}
const session = await response.json();

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const cookieName = `sb-${projectRef}-auth-token`;
const encodedSession = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
const cookieChunks = [];
for (let offset = 0; offset < encodedSession.length; offset += 3180) {
  cookieChunks.push(encodedSession.slice(offset, offset + 3180));
}

const routes = ["/dashboard", "/notifications", "/loans", "/loans/new"];
const consoleErrors = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const hostname = new URL(targetUrl).hostname;
  await context.addCookies(cookieChunks.map((value, index) => ({
    name: cookieChunks.length === 1 ? cookieName : `${cookieName}.${index}`,
    value,
    domain: hostname,
    path: "/",
    secure: true,
    sameSite: "Lax",
  })));
  const page = await context.newPage();
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => consoleErrors.push(error.message));

  for (const route of routes) {
    const navigation = await page.goto(new URL(route, targetUrl).toString());
    if (!navigation?.ok()) throw new Error(`${route} returned ${navigation?.status() ?? "no response"}.`);
    if (page.url().includes("/login")) throw new Error(`${route} redirected to login.`);
    await page.locator("main").waitFor({ state: "visible" });
    if (await page.getByRole("heading", { name: "Chưa thể tải dữ liệu" }).count()) {
      throw new Error(`${route} reported a data error.`);
    }
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) {
      throw new Error(`${route} overflows at mobile width.`);
    }
  }

  if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(" | ")}`);
  console.log(JSON.stringify({ status: "ok", targetUrl, environment, routes, mobileWidth: 390, consoleErrors: 0 }));
} finally {
  await browser.close();
}
