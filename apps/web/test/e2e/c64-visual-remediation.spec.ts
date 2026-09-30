import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment } from "./helpers";

const local = localSupabaseEnvironment();
const credentials = { username: "c6_owner_e2e", password: "OwnerE2eTemp123" };
const evidenceDirectory = resolve(process.cwd(), "../../docs/audit-c64");

test.beforeAll(async () => {
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  let signIn = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password: credentials.password });
  if (signIn.error) {
    credentials.password = "123456";
    signIn = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password: credentials.password });
  }
  if (signIn.error || !signIn.data.user) throw signIn.error || new Error("C64 owner session was not created.");
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signIn.data.user.id);
  if (error) throw error;
});

async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(credentials.username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function capture(page: Page, name: string) {
  if (process.env.C64_EVIDENCE !== "true") return;
  mkdirSync(evidenceDirectory, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDirectory, name), fullPage: true });
}

test("C64 content hierarchy, compact filters and responsive controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await expect(page.getByRole("heading", { name: "Việc cần xử lý" })).toBeVisible();
  await expect(page.locator(".dashboard-focus-grid")).toBeVisible();
  await capture(page, "dashboard-mobile-light.png");

  await page.goto("/loans");
  const controls = await page.locator(".loan-filters").evaluate((root) => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    heights: [...root.querySelectorAll<HTMLElement>("input, select, button, a")].filter(node => node.getClientRects().length > 0).map(node => node.getBoundingClientRect().height),
    height: root.getBoundingClientRect().height,
  }));
  expect(controls.overflow).toBe(false);
  expect(controls.heights.every(height => height >= 40)).toBe(true);
  expect(controls.height).toBeLessThan(180);
  await page.getByLabel("Tên khoản vay hoặc đối tác").fill("Khoản thông báo");
  await expect(page).toHaveURL(/q=Kho%E1%BA%A3n(?:\+|%20)th%C3%B4ng(?:\+|%20)b%C3%A1o/);
  await page.reload();
  await expect(page.getByLabel("Tên khoản vay hoặc đối tác")).toHaveValue("Khoản thông báo");
  await page.goto("/loans?status=BAD_DEBT");
  await expect(page.getByLabel("Trạng thái")).toHaveValue("BAD_DEBT");
  await page.waitForTimeout(750);
  await expect(page.locator(".loan-filters")).toBeVisible();
  await capture(page, "loans-filter-mobile-light.png");
  await page.goBack();
  await expect(page.getByLabel("Tên khoản vay hoặc đối tác")).toHaveValue("Khoản thông báo");
  await page.goForward();
  await expect(page.getByLabel("Trạng thái")).toHaveValue("BAD_DEBT");

  await page.setViewportSize({ width: 640, height: 700 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByLabel("Tên khoản vay hoặc đối tác")).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
});

test("C64 counterparties stay list-first and preserve search and drafts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/counterparties?q=C64+search+flow");
  await expect(page.getByRole("heading", { name: "Không tìm thấy đối tác" })).toBeVisible();

  await page.getByRole("button", { name: "Thêm đối tác", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Thêm đối tác" });
  await create.getByLabel("Tên đối tác").fill("C64 search flow");
  await create.getByLabel("Ghi chú").fill("Tạo từ luồng list-first");
  await create.getByRole("button", { name: "Thêm đối tác", exact: true }).click();
  await expect(create).toBeHidden();
  await expect(page).toHaveURL(/\/counterparties\?q=C64\+search\+flow$/);
  const card = page.locator(".counterparty-card").filter({ hasText: "C64 search flow" });
  await expect(card).toBeVisible();

  await card.getByText("Chỉnh sửa thông tin").click();
  await card.getByLabel("Ghi chú").fill("Đã sửa trong kết quả tìm kiếm");
  await card.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(card.locator("details")).not.toHaveAttribute("open", "");
  await expect(page).toHaveURL(/\/counterparties\?q=C64\+search\+flow$/);

  await page.getByRole("button", { name: "Thêm đối tác", exact: true }).click();
  await create.getByLabel("Tên đối tác").fill("Bản nháp C64");
  page.once("dialog", dialog => dialog.dismiss());
  await page.keyboard.press("Escape");
  await expect(create).toBeVisible();
  await expect(create.getByLabel("Tên đối tác")).toHaveValue("Bản nháp C64");
  page.once("dialog", dialog => dialog.accept());
  await page.keyboard.press("Escape");
  await expect(create).toBeHidden();
  await capture(page, "counterparties-mobile-light.png");
});

test("C64 successful previews hide retry and detail remains clear in dark desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await login(page);
  await page.goto("/loans?q=Kho%E1%BA%A3n+th%C3%B4ng+b%C3%A1o&status=ALL");
  await page.locator(".loan-card").first().click();
  await expect(page.locator(".overview-hero")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Nội dung khoản vay" })).toBeVisible();
  await capture(page, "loan-detail-desktop-dark.png");

  await page.getByRole("button", { name: "Tất toán", exact: true }).click();
  const settlement = page.getByRole("dialog", { name: "Tất toán khoản vay" });
  await expect(settlement.getByText("Tổng tất toán")).toBeVisible();
  await expect(settlement.getByRole("button", { name: "Tải lại bảng tất toán" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(settlement).toBeHidden();
});
