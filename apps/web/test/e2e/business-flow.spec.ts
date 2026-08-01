import { expect, test } from "@playwright/test";

test("owner creates a counterparty, loan, payment and bad-debt event", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("OwnerE2eTemp123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/change-password/);
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("OwnerE2eFinal123");
  await page.getByLabel("Nhập lại mật khẩu mới").fill("OwnerE2eFinal123");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("link", { name: "Đối tác" }).first().click();
  await page.getByLabel("Tên đối tác").first().fill("Anh Nam E2E");
  await page.getByLabel("Ghi chú").first().fill("Đối tác được tạo bởi Playwright");
  await page.getByRole("button", { name: "Thêm đối tác" }).click();
  await expect(page.getByRole("heading", { name: "Anh Nam E2E" })).toBeVisible();

  await page.getByRole("link", { name: "Khoản vay" }).first().click();
  await page.getByRole("link", { name: "Tạo khoản vay" }).first().click();
  await page.getByLabel("Tên khoản vay").fill("Khoản vay E2E");
  await page.getByLabel("Đối tác").selectOption({ label: "Anh Nam E2E" });
  await page.getByLabel("Số tiền gốc (VND)").fill("10000000");
  await page.getByLabel("Số ngày vay").fill("30");
  await page.getByLabel("Lãi suất (%/ngày)").fill("0.1");
  await page.getByRole("button", { name: "Tạo khoản vay" }).click();

  await expect(page.getByRole("heading", { name: "Khoản vay E2E" })).toBeVisible();
  await page.getByLabel("Số tiền (VND)").first().fill("300000");
  await page.getByLabel("Ghi chú").first().fill("Thu lãi kỳ đầu");
  await page.getByRole("button", { name: "Ghi nhận", exact: true }).click();
  await expect(page.getByText("Đã ghi nhận thanh toán.")).toBeVisible();
  await expect(page.getByText("Thanh toán lãi")).toBeVisible();

  await page.getByText("Lãi suất / nợ xấu").click();
  await page.getByLabel("Thao tác").selectOption("BAD_DEBT_START");
  await page.getByLabel("Ghi chú").nth(2).fill("Khách chậm thanh toán");
  await page.getByRole("button", { name: "Cập nhật", exact: true }).click();
  await expect(page.getByText("Nợ xấu").first()).toBeVisible();
  await expect(page.getByText("Chuyển nợ xấu")).toBeVisible();

  await page.getByRole("link", { name: "Lịch sử" }).first().click();
  await expect(page.getByRole("heading", { name: "Lịch sử chỉnh sửa" })).toBeVisible();
  await expect(page.getByText(/Thực hiện bởi C6 Owner E2E/).first()).toBeVisible();
});

test("business pages remain usable at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("OwnerE2eFinal123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("dashboard is responsive and readable in light and dark modes", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("OwnerE2eFinal123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Lợi nhuận tiền mặt", { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: /Biểu đồ cột/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dòng tiền theo tháng" })).toBeVisible();
  await page.getByText("Xem bảng số liệu").click();
  await expect(page.getByRole("columnheader", { name: "Tiền vào" })).toBeVisible();
  const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim());
  expect(background).toBe("#08111f");
});

test("PWA manifest, service worker and notification center are available", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("OwnerE2eFinal123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).display).toBe("standalone");
  const worker = await page.request.get("/sw.js");
  expect(worker.ok()).toBe(true);
  expect(await worker.text()).toContain('addEventListener("push"');

  await page.getByRole("link", { name: /Thông báo/ }).first().click();
  await expect(page.getByRole("heading", { name: "Thông báo", exact: true })).toBeVisible();
  await expect(page.getByText("Khoản vay đã quá hạn", { exact: true })).toBeVisible();
  await expect(page.getByText("Mọi tài khoản đều nhận cùng lịch nhắc", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await page.evaluate(async () => Boolean(await navigator.serviceWorker.ready))).toBe(true);
});
