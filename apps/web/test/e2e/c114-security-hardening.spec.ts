import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { localSupabaseEnvironment } from "./helpers";

const username = "c114_recovery_e2e";
const email = `${username}@auth.local`;
const temporaryPassword = "C114Temporary123";
const firstPassword = "C114PrivatePass123";
const resetPassword = "C114ResetPass123";
const finalPassword = "C114FinalPass123";
let admin: SupabaseClient;
let userId: string;

async function login(page: Page, password: string) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}

async function changePassword(page: Page, password: string) {
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill(password);
  await page.getByLabel("Nhập lại mật khẩu mới", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Lưu mật khẩu mới", exact: true }).click();
}

test.beforeAll(async () => {
  const local = localSupabaseEnvironment();
  admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const created = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      provisioned_by_app: "true",
      username,
      display_name: "C114 Recovery E2E",
      app_role: "VIEWER",
    },
  });
  if (created.error) {
    expect(created.error.message).toMatch(/already.*registered/i);
    const existing = await admin.from("profiles").select("user_id").eq("username", username).single();
    expect(existing.error).toBeNull();
    userId = existing.data!.user_id;
    expect((await admin.auth.admin.updateUserById(userId, { password: temporaryPassword })).error).toBeNull();
    expect((await admin.from("profiles").update({ must_change_password: true, password_reset_generation: 0 }).eq("user_id", userId)).error).toBeNull();
  } else {
    userId = created.data.user!.id;
  }
});

test("C114 production responses use unique Next.js nonces and keep the PWA boot path", async ({ page, request }) => {
  const first = await request.get("/login");
  const second = await request.get("/login");
  const firstPolicy = first.headers()["content-security-policy"];
  const secondPolicy = second.headers()["content-security-policy"];
  const scriptDirective = firstPolicy.split(";").find(part => part.trim().startsWith("script-src "))!;
  const firstNonce = scriptDirective.match(/'nonce-([^']+)'/)?.[1];
  const secondNonce = secondPolicy.match(/'nonce-([^']+)'/)?.[1];
  expect(first.status()).toBe(200);
  expect(scriptDirective).not.toContain("'unsafe-inline'");
  expect(scriptDirective).not.toContain("'unsafe-eval'");
  expect(firstNonce).toBeTruthy();
  expect(secondNonce).toBeTruthy();
  expect(firstNonce).not.toBe(secondNonce);

  const violations: string[] = [];
  page.on("console", message => {
    if (message.type() === "error" && /content security policy|refused to/i.test(message.text())) violations.push(message.text());
  });
  await page.context().addCookies([{ name: "qlv_theme", value: "dark", url: "http://127.0.0.1:3101" }]);
  const response = await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const browserNonce = response!.headers()["content-security-policy"].match(/'nonce-([^']+)'/)?.[1];
  const scripts = await page.locator("script").evaluateAll(nodes => nodes.map(script => ({
    nonce: (script as HTMLScriptElement).nonce,
    src: (script as HTMLScriptElement).src,
  })));
  expect(scripts.length).toBeGreaterThan(0);
  expect(scripts.some(script => script.nonce === browserNonce)).toBe(true);
  expect(scripts.filter(script => !script.src).every(script => script.nonce === browserNonce)).toBe(true);
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL ?? ""))
    .toContain("/sw.js");
  expect(violations).toEqual([]);

  const worker = await request.get("/sw.js");
  expect(worker.status()).toBe(200);
  expect(worker.headers()["content-security-policy"]).toContain("script-src 'self'");
});

test("C114 password completion recovers by exact server generation and rejects stale proof", async ({ page }) => {
  await login(page, temporaryPassword);
  await expect(page).toHaveURL(/\/change-password$/);
  await changePassword(page, firstPassword);
  await expect(page).toHaveURL(/\/dashboard$/);

  const completed = await admin.from("profiles")
    .select("must_change_password,password_reset_generation")
    .eq("user_id", userId)
    .single();
  expect(completed.error).toBeNull();
  expect(completed.data).toEqual({ must_change_password: false, password_reset_generation: 0 });
  const authUser = await admin.auth.admin.getUserById(userId);
  expect(authUser.data.user?.app_metadata.password_change_generation).toBe(0);

  // Recreate the post-Auth/pre-profile failure window. The next authenticated read must heal it.
  expect((await admin.from("profiles").update({ must_change_password: true }).eq("user_id", userId)).error).toBeNull();
  await page.context().clearCookies();
  await login(page, firstPassword);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect.poll(async () => (await admin.from("profiles").select("must_change_password").eq("user_id", userId).single()).data?.must_change_password)
    .toBe(false);

  // A later OWNER reset advances the generation, so the old completion marker cannot clear it.
  expect((await admin.from("profiles").update({ must_change_password: true, password_reset_generation: 1 }).eq("user_id", userId)).error).toBeNull();
  expect((await admin.auth.admin.updateUserById(userId, { password: resetPassword })).error).toBeNull();
  await page.context().clearCookies();
  await login(page, resetPassword);
  await expect(page).toHaveURL(/\/change-password$/);
  await page.reload();
  expect((await admin.from("profiles").select("must_change_password").eq("user_id", userId).single()).data?.must_change_password).toBe(true);

  const local = localSupabaseEnvironment();
  const managed = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  expect((await managed.auth.signInWithPassword({ email, password: resetPassword })).error).toBeNull();
  expect((await managed.from("profiles").update({ must_change_password: false }).eq("user_id", userId)).error).not.toBeNull();

  await changePassword(page, finalPassword);
  await expect(page).toHaveURL(/\/dashboard$/);
  const final = await admin.from("profiles")
    .select("must_change_password,password_reset_generation")
    .eq("user_id", userId)
    .single();
  expect(final.data).toEqual({ must_change_password: false, password_reset_generation: 1 });
  expect((await admin.auth.admin.getUserById(userId)).data.user?.app_metadata.password_change_generation).toBe(1);

  await page.context().clearCookies();
  await login(page, firstPassword);
  await expect(page.getByRole("alert").filter({ hasText: "Tên đăng nhập hoặc mật khẩu không đúng" }))
    .toBeVisible();
  await login(page, finalPassword);
  await expect(page).toHaveURL(/\/dashboard$/);
});
