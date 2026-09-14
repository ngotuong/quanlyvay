import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
});

function previousMonthRangeInHoChiMinh() {
  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "numeric",
    }).formatToParts(new Date()).filter((part) => part.type === "year" || part.type === "month").map((part) => [part.type, part.value]),
  );
  const year = Number(dateParts.year);
  const month = Number(dateParts.month);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  return {
    from: iso(new Date(Date.UTC(year, month - 2, 1))),
    editedFrom: iso(new Date(Date.UTC(year, month - 2, 2))),
    to: iso(new Date(Date.UTC(year, month - 1, 0))),
  };
}

test("owner creates a counterparty, loan, payment and bad-debt event", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("OwnerE2eTemp123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/change-password/);
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("123456");
  await page.getByLabel("Nhập lại mật khẩu mới").fill("123456");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();

  await page.getByRole("link", { name: "Đối tác" }).first().click();
  await page.getByLabel("Tên đối tác").first().fill("Anh Nam E2E");
  await page.getByLabel("Ghi chú").first().fill("Đối tác được tạo bởi Playwright");
  await page.getByRole("button", { name: "Thêm đối tác" }).click();
  await expect(page.getByRole("heading", { name: "Anh Nam E2E" })).toBeVisible();
  const createdToast = page.locator(".ui-toast");
  await expect(createdToast).toHaveAttribute("aria-label", "Đã thêm đối tác.");
  await expect(createdToast).toBeHidden({ timeout: 6_000 });

  await page.getByRole("link", { name: "Khoản vay" }).first().click();
  await page.getByRole("link", { name: "Tạo khoản vay" }).first().click();
  await page.getByRole("combobox", { name: "Đối tác" }).selectOption({ label: "Anh Nam E2E" });
  await page.getByRole("radio", { name: "Cho vay", exact: true }).check();
  await page.getByLabel("Số tiền gốc (VND)").fill("10000000");
  await expect(page.getByLabel("Số tiền gốc (VND)")).toHaveValue("10.000.000");
  await page.getByRole("radio", { name: "Có đáo hạn", exact: true }).check();
  await page.getByLabel("Số ngày vay (nếu có đáo hạn)").fill("30");
  await page.getByLabel("Lãi suất mỗi kỳ (%)").fill("3");
  await page.getByRole("button", { name: "Tạo khoản vay" }).click();

  await expect(page.getByRole("heading", { name: "Anh Nam E2E", exact: true })).toBeVisible();
  await expect(page.locator(".loan-detail-heading").getByText(/Giải ngân/)).not.toContainText("Anh Nam E2E");
  const loanTabs = page.getByRole("navigation", { name: "Nội dung khoản vay" });
  await expect(page.getByText("Lãi đã thu", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ghi giao dịch" }).click();
  await expect(page.getByRole("dialog", { name: "Ghi giao dịch" })).toBeVisible();
  await page.getByRole("dialog", { name: "Ghi giao dịch" }).getByRole("button", { name: "Hủy" }).click();
  await loanTabs.getByRole("link", { name: "Thiết lập" }).click();
  await expect(page.getByText("3%", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Lãi kỳ đầu đủ 30 ngày", { exact: true })).toBeVisible();
  await expect(page.getByText("300.000 ₫", { exact: true }).first()).toBeVisible();

  await page.getByText("Sửa dữ liệu ban đầu đã nhập sai").click();
  await page.getByLabel("Số tiền gốc ban đầu (VND)").fill("12000000");
  await page.getByLabel("Số ngày vay (nếu có đáo hạn)").last().fill("45");
  await page.getByLabel("Lãi suất mỗi kỳ (%)").last().fill("3.6");
  await page.getByLabel("Lý do điều chỉnh").fill("Nhập nhầm dữ liệu khi tạo khoản vay E2E");
  await page.getByLabel(/Tôi đã kiểm tra lại dữ liệu/).check();
  await page.getByRole("button", { name: "Áp dụng điều chỉnh" }).click();
  await expect(page.locator("#main-content").getByText("Đã điều chỉnh dữ liệu ban đầu và lưu đầy đủ lịch sử.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Anh Nam E2E", exact: true })).toBeVisible();
  await loanTabs.getByRole("link", { name: "Các kỳ lãi" }).click();
  const interestPeriod = page.locator(".period-list article").first();
  await interestPeriod.locator("summary").getByText("Ghi nhận đóng lãi", { exact: true }).click();
  await expect(interestPeriod.getByLabel("Số tiền (VND)")).not.toHaveValue("");
  await interestPeriod.getByLabel("Ghi chú").fill("Thu lãi kỳ đầu bằng nút điền nhanh");
  await interestPeriod.getByRole("button", { name: "Ghi nhận đóng lãi" }).click();
  await expect(interestPeriod.getByText("Đã đóng đủ", { exact: true })).toBeVisible();
  await loanTabs.getByRole("link", { name: "Lịch sử" }).click();
  await expect(page.getByText("Thanh toán lãi")).toBeVisible();

  await loanTabs.getByRole("link", { name: "Thiết lập" }).click();
  const lifecycleForm = page.locator("details").filter({ hasText: "Lãi suất / nợ xấu" });
  await lifecycleForm.getByText("Lãi suất / nợ xấu", { exact: true }).click();
  await lifecycleForm.getByLabel("Thao tác").selectOption("BAD_DEBT_START");
  await lifecycleForm.getByLabel("Ghi chú").fill("Khách chậm thanh toán");
  await lifecycleForm.getByRole("button", { name: "Cập nhật", exact: true }).click();
  await expect(page.locator("#main-content").getByText("Đã cập nhật lịch sử khoản vay.")).toBeVisible();
  await expect(page.getByText("Nợ xấu").first()).toBeVisible();
  await loanTabs.getByRole("link", { name: "Lịch sử" }).click();
  await expect(page.getByText("Chuyển nợ xấu")).toBeVisible();

  await page.getByRole("link", { name: "Nhật ký hệ thống" }).first().click();
  await expect(page.getByRole("heading", { name: "Nhật ký hệ thống" })).toBeVisible();
  await expect(page.locator(".timeline-item")).toHaveCount(25);
  await expect(page.getByText(/Trang 1 \/ \d+/)).toBeVisible();
  await expect(page.getByText(/\d+ bản ghi/)).toBeVisible();
  await expect(page.getByText("Trang trước", { exact: true })).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("link", { name: "Trang sau" }).click();
  await expect(page).toHaveURL(/\/audit\?page=2$/);
  await expect(page.getByText(/Trang 2 \/ \d+/)).toBeVisible();
  await page.getByRole("link", { name: "Trang trước" }).click();
  await expect(page).toHaveURL(/\/audit$/);
  await expect(page.getByText(/Thực hiện bởi C6 Owner E2E/).first()).toBeVisible();
  const loanAudit = page.locator(".timeline-item").filter({ hasText: "Tạo mới · Khoản vay" }).first();
  await expect(loanAudit).toBeVisible();
  await loanAudit.getByText("Xem dữ liệu thay đổi").click();
  await expect(loanAudit.locator("pre")).toContainText('"Hướng": "Cho vay"');
  await expect(loanAudit.locator("pre")).not.toContainText('"direction"');

  await page.goto("/expenses");
  await page.getByLabel("Số tiền (VND)").fill("150000");
  await expect(page.getByLabel("Số tiền (VND)")).toHaveValue("150.000");
  await page.getByLabel("Nhóm chi phí").fill("Vận hành E2E");
  await page.getByLabel("Ghi chú").fill("Chi phí chung E2E");
  await page.getByRole("button", { name: "Ghi chi phí chung" }).click();
  await expect(page.getByRole("heading", { name: "Vận hành E2E" })).toBeVisible();
});

test("owner settles and reverses the whole settlement without deleting history", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await page.getByRole("link", { name: "Khoản vay" }).first().click();
  await page.getByRole("link", { name: "Tạo khoản vay" }).first().click();
  await page.getByRole("combobox", { name: "Đối tác" }).selectOption({ label: "Anh Nam E2E" });
  await page.getByRole("radio", { name: "Đi vay", exact: true }).check();
  await page.getByLabel("Nhãn phân biệt (không bắt buộc)").fill("C16 hoàn tác tất toán");
  await page.getByLabel("Số tiền gốc (VND)").fill("1000000");
  await expect(page.getByLabel("Số tiền gốc (VND)")).toHaveValue("1.000.000");
  await page.getByLabel("Lãi suất mỗi kỳ (%)").fill("0");
  await page.getByRole("button", { name: "Tạo khoản vay" }).click();
  await expect(page.getByRole("heading", { name: "C16 hoàn tác tất toán" })).toBeVisible();
  await expect(page.getByText(/Nhắc lãi/)).toBeVisible();
  await page.getByRole("navigation", { name: "Nội dung khoản vay" }).getByRole("link", { name: "Thiết lập" }).click();
  const settlementForm = page.locator("details").filter({ hasText: "Tất toán khoản vay" });
  await settlementForm.getByText("Tất toán khoản vay").click();
  await settlementForm.getByLabel("Ghi chú").fill("Tất toán để kiểm thử hoàn tác C16");
  await settlementForm.getByText(/Tôi xác nhận hệ thống sẽ ghi toàn bộ/).click();
  await settlementForm.getByRole("button", { name: "Tất toán toàn bộ" }).click();
  await expect(page.getByText("Đã tất toán", { exact: true }).first()).toBeVisible();

  await page.getByText("Hoàn tác toàn bộ tất toán").click();
  await page.getByLabel("Lý do").fill("Tất toán nhầm trong kiểm thử C16");
  await page.getByLabel(/Tôi đã kiểm tra và muốn hoàn tác nguyên lần tất toán này/).check();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Hoàn tác tất toán" }).click();
  await expect(page.getByText("Đang hoạt động").first()).toBeVisible();
  await page.getByRole("navigation", { name: "Nội dung khoản vay" }).getByRole("link", { name: "Lịch sử" }).click();
  await expect(page.getByText("Hoàn tác tất toán", { exact: true }).last()).toBeVisible();
});

test("business pages remain usable at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.locator(".mobile-module-title")).toContainText("Tổng quan");
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
  await expect(page.locator(".page-heading-row h1:visible")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
  await page.getByRole("link", { name: "Khoản vay" }).first().click();
  await expect(page.locator(".mobile-module-title")).toContainText("Các khoản vay");
  await expect(page.getByRole("heading", { name: "Các khoản vay" })).toBeVisible();
  await expect(page.locator(".page-heading-row h1:visible")).toHaveCount(0);
  const [directionBox, statusBox] = await Promise.all([
    page.getByLabel("Hướng", { exact: true }).boundingBox(),
    page.getByLabel("Trạng thái", { exact: true }).boundingBox(),
  ]);
  expect(directionBox?.y).toBe(statusBox?.y);
  expect(Math.abs((directionBox?.width ?? 0) - (statusBox?.width ?? 0))).toBeLessThan(2);
  const filterBounds = await page.locator(".management-filters").evaluate((filter) => {
    const parent = filter.getBoundingClientRect();
    const controls = [...filter.querySelectorAll(".loan-filter-primary input, .loan-filter-primary select")].map((control) => control.getBoundingClientRect());
    return { parent: { left: parent.left, right: parent.right }, controls: controls.map((control) => ({ left: control.left, right: control.right })) };
  });
  expect(filterBounds.controls.every((control) => control.left >= filterBounds.parent.left && control.right <= filterBounds.parent.right)).toBe(true);
  const directionColors = await page.locator(".loan-card-icon").evaluateAll((icons) => Object.fromEntries(icons.map((icon) => [icon.getAttribute("data-direction"), getComputedStyle(icon).color])));
  expect(directionColors.LENDING).not.toBe(directionColors.BORROWING);
  const quickAction = page.getByRole("link", { name: "Ghi giao dịch cho khoản vay" }).first();
  await expect(quickAction).toBeVisible();
  await quickAction.click();
  await expect(page).toHaveURL(/transaction=1/);
  const quickDialog = page.getByRole("dialog", { name: "Ghi giao dịch" });
  await expect(quickDialog).toBeVisible();
  await quickDialog.getByRole("button", { name: "Hủy" }).click();
  await page.getByRole("link", { name: "Quay lại danh sách" }).click();
  await page.getByRole("button", { name: "Nâng cao" }).click();
  const advancedFilterDialog = page.getByRole("dialog", { name: "Ngày giải ngân và sắp xếp" });
  await expect(advancedFilterDialog).toBeVisible();
  expect(await advancedFilterDialog.evaluate((element) => getComputedStyle(element).animationName)).toBe("dialog-enter");
  await advancedFilterDialog.evaluate(async (element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  await expect(advancedFilterDialog.getByRole("button", { name: "Đóng", exact: true })).toHaveCount(0);
  await expect(advancedFilterDialog.getByRole("button", { name: "Đóng bộ lọc nâng cao", exact: true })).toBeVisible();
  await expect(advancedFilterDialog.getByLabel("Từ", { exact: true })).toBeVisible();
  await expect(advancedFilterDialog.getByLabel("Đến", { exact: true })).toBeVisible();
  const advancedGeometry = await advancedFilterDialog.evaluate((dialog) => {
    const dialogBox = dialog.getBoundingClientRect();
    const dates = [...dialog.querySelectorAll<HTMLInputElement>('input[type="date"]')].map((input) => input.getBoundingClientRect());
    return {
      centeredDelta: Math.abs(dialogBox.top - (innerHeight - dialogBox.bottom)),
      insideViewport: dialogBox.left >= 0 && dialogBox.right <= innerWidth,
      datesSameRow: dates.length === 2 && Math.abs(dates[0].top - dates[1].top) < 1,
      datesEqualWidth: dates.length === 2 && Math.abs(dates[0].width - dates[1].width) < 2,
      dateGap: dates.length === 2 ? dates[1].left - dates[0].right : 0,
      dateHeights: dates.map((date) => date.height),
      controlHeights: [...document.querySelectorAll<HTMLElement>(".loan-filter-primary input, .loan-filter-primary select, .advanced-filter-trigger")].map((control) => control.getBoundingClientRect().height),
    };
  });
  expect(advancedGeometry.centeredDelta).toBeLessThan(3);
  expect(advancedGeometry.insideViewport).toBe(true);
  expect(advancedGeometry.datesSameRow).toBe(true);
  expect(advancedGeometry.datesEqualWidth).toBe(true);
  expect(advancedGeometry.dateGap).toBeGreaterThanOrEqual(8);
  expect(advancedGeometry.dateHeights.every((height) => height >= 44)).toBe(true);
  expect(advancedGeometry.controlHeights.every((height) => Math.abs(height - 44) < 1)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(advancedFilterDialog).toBeHidden();
  for (const viewport of [{ width: 320, height: 700 }, { width: 812, height: 375 }]) {
    await page.setViewportSize(viewport);
    await page.getByRole("button", { name: "Nâng cao" }).click();
    await expect(advancedFilterDialog).toBeVisible();
    await advancedFilterDialog.evaluate(async (element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    const geometry = await advancedFilterDialog.evaluate((dialog) => {
      const box = dialog.getBoundingClientRect();
      const dates = [...dialog.querySelectorAll<HTMLInputElement>('input[type="date"]')].map((input) => input.getBoundingClientRect());
      const sameRow = dates.length === 2 && Math.abs(dates[0].top - dates[1].top) < 1;
      const equalWidth = dates.length === 2 && Math.abs(dates[0].width - dates[1].width) < 2;
      const gap = dates.length === 2 ? dates[1].left - dates[0].right : 0;
      return { centeredDelta: Math.abs(box.top - (innerHeight - box.bottom)), insideViewport: box.left >= 0 && box.right <= innerWidth, sameRow, equalWidth, gap, dateHeights: dates.map((date) => date.height), noPageOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth };
    });
    expect(geometry.centeredDelta).toBeLessThan(3);
    expect(geometry.insideViewport).toBe(true);
    expect(geometry.sameRow).toBe(true);
    expect(geometry.equalWidth).toBe(true);
    expect(geometry.gap).toBeGreaterThanOrEqual(8);
    expect(geometry.dateHeights.every((height) => height >= 44)).toBe(true);
    expect(geometry.noPageOverflow).toBe(true);
    await page.keyboard.press("Escape");
    await expect(advancedFilterDialog).toBeHidden();
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator(".loan-card").first().click();
  const mobileTabs = page.getByRole("navigation", { name: "Nội dung khoản vay" });
  await expect(mobileTabs.getByRole("link")).toHaveCount(4);
  const tabTops = await mobileTabs.getByRole("link").evaluateAll((links) => links.map((link) => Math.round(link.getBoundingClientRect().top)));
  expect(new Set(tabTops).size).toBe(1);
  await page.getByRole("button", { name: "Ghi giao dịch" }).click();
  const transactionDialog = page.getByRole("dialog", { name: "Ghi giao dịch" });
  await expect(transactionDialog).toBeVisible();
  expect(await transactionDialog.evaluate((element) => getComputedStyle(element).animationName)).toBe("dialog-enter");
  await transactionDialog.getByRole("button", { name: "Đóng" }).click();
  await expect(transactionDialog).toHaveClass(/is-closing/);
  await expect(transactionDialog).toBeHidden();
  await page.getByRole("button", { name: "Ghi giao dịch" }).click();
  await expect(transactionDialog).toBeVisible();
  await transactionDialog.evaluate(async (element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  expect(await transactionDialog.evaluate((dialog) => {
    const box = dialog.getBoundingClientRect();
    return Math.abs(box.top - (innerHeight - box.bottom));
  })).toBeLessThan(3);
  await page.keyboard.press("Escape");
  await expect(transactionDialog).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("editor can use personal settings but remains blocked from owner-only pages", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c13_editor_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("EditorE2eTemp123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/change-password/);
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("abcdef");
  await page.getByLabel("Nhập lại mật khẩu mới").fill("abcdef");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain("Inter");
  await expect(page.locator(".page-title-icon svg")).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByText("Tài khoản của tôi", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đổi mật khẩu" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tạo tài khoản" })).toHaveCount(0);
  await page.goto("/audit");
  await expect(page).toHaveURL(/dashboard/);
});

test("owner can manage more than one additional account", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "Tài khoản c13_editor_e2e" })).toBeVisible();
  await page.getByLabel("Tên đăng nhập").fill("c16_viewer_e2e");
  await page.getByLabel("Tên hiển thị").first().fill("C16 Viewer E2E");
  await page.getByLabel("Vai trò").first().selectOption("VIEWER");
  await page.getByLabel("Mật khẩu tạm", { exact: true }).fill("Viewer123");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();

  await expect(page.locator("#main-content").getByText("Đã tạo tài khoản.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tài khoản c16_viewer_e2e" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Tài khoản / })).toHaveCount(2);
});

test("dashboard is responsive and readable in light and dark modes", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    (window as Window & { __qaCls?: number }).__qaCls = 0;
    if ("PerformanceObserver" in window) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput) (window as Window & { __qaCls?: number }).__qaCls! += shift.value ?? 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
    }
  });
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();

  const viewports = [
    { width: 375, height: 900 },
    { width: 768, height: 900 },
    { width: 1024, height: 900 },
    { width: 1440, height: 900 },
    { width: 812, height: 375 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/dashboard");
    if (viewport.width < 1024) {
      await expect(page.locator(".mobile-module-title")).toContainText("Tổng quan");
      await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
      await expect(page.locator(".page-heading-row h1:visible")).toHaveCount(0);
    } else {
      await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
    }
    const primaryMetrics = page.locator(".dashboard-primary-metrics").first();
    await expect(primaryMetrics.getByText("Lãi ròng thực thu", { exact: true })).toBeVisible();
    await expect(primaryMetrics.getByText("Lãi ròng phát sinh", { exact: true })).toBeVisible();
    await expect(primaryMetrics.locator(".dashboard-metric")).toHaveCount(4);
    const comparisons = primaryMetrics.locator(".metric-comparison");
    await expect(comparisons.first()).toHaveAttribute("aria-label", /^(Tăng|Giảm|Không đổi) .* so với /);
    expect(await comparisons.allInnerTexts()).toEqual(expect.not.arrayContaining([expect.stringMatching(/Tăng|Giảm|so với/)]));
    await expect(page.getByRole("heading", { name: "Xu hướng dòng tiền" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lịch Dự Kiến" })).toBeVisible();
    await expect(page.getByText("Hành động còn tồn tại", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Lãi sắp đến lịch", { exact: true })).toHaveCount(0);
    const [attentionBox, cashFlowBox] = await Promise.all([
      page.locator(".attention-card").first().boundingBox(),
      page.locator(".cash-flow-card").first().boundingBox(),
    ]);
    expect((attentionBox?.y ?? 0) <= (cashFlowBox?.y ?? 0)).toBe(true);
    await expect(page.locator(".attention-groups").first()).not.toHaveCSS("overflow-y", "auto");
    await expect(page.getByRole("group", { name: /Biểu đồ cột/ }).first()).toBeVisible();
    const firstCashBar = page.locator(".cash-bar-control").first();
    await firstCashBar.click();
    await expect(firstCashBar).toHaveAttribute("aria-pressed", "true");
    await expect(firstCashBar.locator(".chart-tooltip")).toHaveCSS("opacity", "1");
    const tooltipGeometry = await page.locator(".cash-flow-card").first().evaluate((card) => {
      const viewport = card.querySelector<HTMLElement>(".cash-flow-chart-scroll")!.getBoundingClientRect();
      const tooltip = card.querySelector<HTMLElement>('.cash-bar-control[aria-pressed="true"] .chart-tooltip')!.getBoundingClientRect();
      const control = card.querySelector<HTMLElement>('.cash-bar-control[aria-pressed="true"]')!.getBoundingClientRect();
      return {
        tooltipInsideVertically: tooltip.top >= viewport.top && tooltip.bottom <= viewport.bottom,
        touchWidth: control.width,
        touchHeight: control.height,
      };
    });
    expect(tooltipGeometry.tooltipInsideVertically).toBe(true);
    expect(tooltipGeometry.touchWidth).toBeGreaterThanOrEqual(44);
    expect(tooltipGeometry.touchHeight).toBeGreaterThanOrEqual(44);
    await firstCashBar.press("Enter");
    await expect(firstCashBar).toHaveAttribute("aria-pressed", "false");
    await page.locator(".dashboard-analysis > summary").first().click();
    await expect(page.getByRole("heading", { name: "Phát sinh và thanh toán lãi" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Xu hướng dòng tiền" })).toBeVisible();
  await page.locator(".cash-flow-card .chart-data-details > summary").first().click();
  await expect(page.getByRole("columnheader", { name: "Tiền vào" })).toBeVisible();
  const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim());
  expect(background).toBe("#090d18");
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return { responseStartMs: navigation?.responseStart ?? 0, domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? 0, cls: (window as Window & { __qaCls?: number }).__qaCls ?? 0 };
  });
  expect(performanceMetrics.cls).toBeLessThan(0.1);
  await testInfo.attach("dashboard-performance.json", { body: JSON.stringify(performanceMetrics, null, 2), contentType: "application/json" });
});

test("owner customizes the preview-only dashboard playground without financial data", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();

  await page.goto("/ui-playground");
  const playground = page.locator("#main-content");
  await expect(playground.getByRole("heading", { name: "UI Playground · Tổng quan" })).toBeVisible();
  await expect(playground.getByText("Dữ liệu bên dưới hoàn toàn là dữ liệu mẫu.")).toBeVisible();

  await playground.getByRole("button", { name: "Mobile" }).click();
  await playground.getByRole("button", { name: "Tối" }).click();
  await playground.getByLabel("Tên module").fill("Tổng quan thử nghiệm");
  await playground.getByLabel("Số giao dịch").fill("18");
  await playground.getByLabel("Nhãn tab hiện tại").fill("Tháng 8");
  await playground.getByRole("slider", { name: "Cỡ chữ tab" }).fill("11");
  await playground.getByRole("slider", { name: "Chiều cao tab" }).fill("32");
  await playground.getByRole("slider", { name: "Padding ngang tab" }).fill("6");
  await playground.locator('.playground-color-control input[type="color"]').fill("#2563eb");
  await playground.getByRole("button", { name: "Đưa Lịch nhắc tháng này xuống" }).click();
  await playground.getByRole("checkbox", { name: "Xu hướng dòng tiền" }).uncheck();

  const canvas = playground.locator(".playground-canvas");
  await expect(playground.locator(".playground-canvas-shell")).toHaveAttribute("data-device", "mobile");
  await expect(canvas).toHaveAttribute("data-theme", "dark");
  await expect(canvas.locator(".playground-preview-header h2")).toHaveText("Tổng quan thử nghiệm");
  await expect(canvas.getByRole("button", { name: "Tháng 8" })).toBeVisible();
  await expect(canvas.getByText("Có 18 giao dịch trong tháng này")).toBeVisible();
  await expect(canvas.getByRole("heading", { name: "Xu hướng dòng tiền" })).toHaveCount(0);
  await expect(canvas.locator(".playground-period button").first()).toHaveCSS("font-size", "11px");
  await expect(canvas.locator(".playground-period button").first()).toHaveCSS("min-height", "32px");

  await canvas.getByRole("heading", { name: "Lịch Dự Kiến" }).click();
  await expect(playground.getByRole("button", { name: "Chữ và tiêu đề" })).toHaveAttribute("aria-pressed", "true");
  await playground.getByLabel("Tiêu đề lịch dự kiến").fill("Lịch sắp tới");
  await expect(canvas.getByRole("heading", { name: "Lịch sắp tới" })).toBeVisible();

  await canvas.locator(".playground-metric").first().click({ position: { x: 120, y: 12 } });
  await expect(playground.getByRole("button", { name: "Card", exact: true })).toHaveAttribute("aria-pressed", "true");
  await playground.getByRole("slider", { name: "Khoảng đệm card" }).fill("10");
  await expect(canvas.locator(".playground-metric").first()).toHaveCSS("padding", "10px");

  await page.reload();
  const restoredPlayground = page.locator("#main-content");
  const restoredCanvas = restoredPlayground.locator(".playground-canvas");
  await expect(restoredPlayground.locator(".playground-canvas-shell")).toHaveAttribute("data-device", "mobile");
  await expect(restoredCanvas).toHaveAttribute("data-theme", "dark");
  await expect(restoredCanvas.locator(".playground-preview-header h2")).toHaveText("Tổng quan thử nghiệm");
  await expect(restoredCanvas.locator(".playground-period button").first()).toHaveText("Tháng 8");
  await expect(restoredCanvas.getByRole("heading", { name: "Lịch sắp tới" })).toBeVisible();
  await expect(restoredCanvas.getByRole("heading", { name: "Xu hướng dòng tiền" })).toHaveCount(0);
});

test("dashboard periods and loan filters are deep-linkable", async ({ page }, testInfo) => {
  const previousMonth = previousMonthRangeInHoChiMinh();
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page.getByRole("link", { name: "Tháng này" })).toHaveAttribute("data-active", "true");
  await page.getByRole("link", { name: "Tháng trước" }).click();
  await expect(page).toHaveURL(/dashboard\?preset=previous_month/);
  await page.getByRole("button", { name: "Tùy chỉnh" }).click();
  await expect(page.getByLabel("Từ ngày")).toHaveValue(previousMonth.from);
  await expect(page.getByLabel("Đến ngày")).toHaveValue(previousMonth.to);
  await page.getByLabel("Từ ngày").fill(previousMonth.editedFrom);
  await expect(page).toHaveURL(new RegExp(`from=${previousMonth.editedFrom}&to=${previousMonth.to}`));
  await expect(page.getByRole("button", { name: "Áp dụng", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  const analysisSummary = page.locator(".dashboard-analysis > summary");
  expect(await analysisSummary.evaluate((element) => getComputedStyle(element, "::after").content)).toContain("+");
  await analysisSummary.click();
  expect(await analysisSummary.evaluate((element) => getComputedStyle(element, "::after").content)).toContain("−");
  await expect(page.getByText("Nợ xấu phải thu", { exact: true })).toBeVisible();

  await page.goto("/loans?status=BAD_DEBT");
  await expect(page.getByLabel("Trạng thái")).toHaveValue("BAD_DEBT");
  await expect(page.getByRole("link", { name: "Xóa tất cả" }).first()).toBeVisible();
  await expect(page.locator(".filter-pills").first()).toHaveCSS("flex-wrap", "nowrap");

  await page.getByLabel("Trạng thái").selectOption("ALL");
  await expect(page).toHaveURL(/status=ALL/);
  await page.getByLabel("Tên khoản vay hoặc đối tác").fill("C16 hoàn tác");
  await expect(page).toHaveURL(/q=C16/);
  await expect(page.getByRole("button", { name: "Áp dụng", exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "C16 hoàn tác tất toán" })).toBeVisible();
  await expect(page.locator(".loan-card-values").first().locator("div")).toHaveCount(3);
  await expect(page.locator(".loan-card-details").first().getByText("Lãi suất", { exact: true })).toBeVisible();
  const clickStartedAt = Date.now();
  await page.getByRole("heading", { name: "C16 hoàn tác tất toán" }).click();
  await expect(page.getByRole("link", { name: "Quay lại danh sách" })).toBeVisible();
  const clickToContentMs = Date.now() - clickStartedAt;
  expect(clickToContentMs).toBeLessThan(5_000);
  await testInfo.attach("loan-navigation-performance.json", { body: JSON.stringify({ clickToContentMs }, null, 2), contentType: "application/json" });
  await expect(page.getByRole("link", { name: "Quay lại danh sách" })).toHaveAttribute("href", /q=C16/);
  await page.getByRole("link", { name: "Quay lại danh sách" }).click();
  await expect(page).toHaveURL(/q=C16/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.goto("/loans?from=2026-99-99");
  await expect(page.getByRole("heading", { name: "Các khoản vay" })).toBeVisible();
  await expect(page.getByLabel("Trạng thái")).toHaveValue("ACTIVE");
  await expect(page.getByLabel("Từ", { exact: true })).toHaveValue("");
});

test("PWA manifest, service worker and notification center are available", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "granted", requestPermission: async () => "granted" },
    });
    Object.defineProperty(navigator, "setAppBadge", {
      configurable: true,
      value: async (count: number) => { (window as Window & { __appBadge?: number }).__appBadge = count; },
    });
    Object.defineProperty(navigator, "clearAppBadge", {
      configurable: true,
      value: async () => { (window as Window & { __appBadge?: number }).__appBadge = 0; },
    });
  });
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();

  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const manifestBody = await manifest.json();
  expect(manifestBody.display).toBe("standalone");
  expect(manifestBody.icons).toEqual([
    { src: "/icons/brand-logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/brand-logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/brand-logo-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ]);
  const headIcons = await page.evaluate(() => Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]')).map((link) => ({ rel: link.rel, href: new URL(link.href).pathname })));
  expect(headIcons).toEqual(expect.arrayContaining([
    { rel: "icon", href: "/favicon.ico" },
    { rel: "icon", href: "/icons/favicon-16.png" },
    { rel: "icon", href: "/icons/favicon-32.png" },
    { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
  ]));
  for (const icon of [...manifestBody.icons.map((item: { src: string }) => item.src), "/favicon.ico", "/icons/favicon-16.png", "/icons/favicon-32.png", "/icons/apple-touch-icon.png", "/icons/brand-symbol-192.png"]) {
    expect((await page.request.get(icon)).ok()).toBe(true);
  }
  const worker = await page.request.get("/sw.js");
  expect(worker.ok()).toBe(true);
  expect(await worker.text()).toContain('addEventListener("push"');
  expect(await worker.text()).toContain("setAppBadge");
  await expect.poll(() => page.evaluate(() => (window as Window & { __appBadge?: number }).__appBadge)).toBeGreaterThan(0);

  await page.getByRole("link", { name: /Thông báo/ }).first().click();
  await expect(page.getByRole("heading", { name: "Thông báo", exact: true })).toBeVisible();
  await expect(page.getByText("Khoản vay đã quá hạn", { exact: true })).toBeVisible();
  await expect(page.getByText("Đối tác thông báo E2E • 1.000.000\nGiải ngân : 01/08/2026\nDư gốc quá hạn : 1.000.000\nQuá hạn : 1 ngày", { exact: true })).toBeVisible();
  const notificationBackgrounds = await page.locator(".notification-item").evaluateAll((items) => Object.fromEntries(items.map((item) => [item.getAttribute("data-read"), getComputedStyle(item).backgroundColor])));
  expect(notificationBackgrounds.false).not.toBe(notificationBackgrounds.true);
  await expect(page.getByRole("heading", { name: "Thông báo trên thiết bị" })).toBeVisible();
  const pushToggle = page.getByRole("switch", { name: /thông báo trên thiết bị/i });
  await expect(pushToggle).toHaveAttribute("aria-checked", /true|false/);
  expect((await pushToggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByLabel("Giờ nhận thông báo")).toHaveValue("7");
  const [timeLabelBox, timeSelectBox] = await Promise.all([
    page.getByText("Giờ nhận thông báo", { exact: true }).boundingBox(),
    page.getByLabel("Giờ nhận thông báo").boundingBox(),
  ]);
  expect(Math.abs(timeLabelBox!.y - timeSelectBox!.y)).toBeLessThan(16);
  await page.getByLabel("Giờ nhận thông báo").selectOption("9");
  await expect(page.locator("#main-content").getByText("Đã đặt giờ nhận thông báo là 09:00.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Giờ nhận thông báo")).toHaveValue("9");
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification = async (title, options) => {
      (window as Window & { __testNotification?: { title: string; body?: string } }).__testNotification = { title, body: options?.body };
    };
  });
  await page.getByRole("button", { name: "Gửi thông báo thử" }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { __testNotification?: { title: string } }).__testNotification?.title)).toBe("Đến ngày thu lãi");
  await expect.poll(() => page.evaluate(() => (window as Window & { __testNotification?: { body?: string } }).__testNotification?.body)).toBe("Duy • 50.000.000\nGiải ngân : 24/07/2024\nSố lãi phải thu : 3.000.000");
  await expect(page.getByText("Không có dữ liệu nào được ghi vào hệ thống.", { exact: false })).toBeVisible();
  const unreadBefore = Number(await page.locator(".nav-badge").first().innerText());
  await page.getByRole("button", { name: /Khoản vay đã quá hạn/ }).first().click();
  await expect(page).toHaveURL(/\/loans\//);
  if (unreadBefore > 1) await expect(page.locator(".nav-badge").first()).toHaveText(String(unreadBefore - 1));
  else await expect(page.locator(".nav-badge")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as Window & { __appBadge?: number }).__appBadge)).toBe(unreadBefore > 1 ? unreadBefore - 1 : 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await page.evaluate(async () => Boolean(await navigator.serviceWorker.ready))).toBe(true);
});

test("Google Sync export requires its secret and supports an unchanged cursor", async ({ request }) => {
  const unauthorized = await request.get("/api/google-sync/export");
  expect(unauthorized.status()).toBe(401);

  const exported = await request.get("/api/google-sync/export", {
    headers: { "x-sync-secret": "e2e-sync-secret" },
  });
  expect(exported.ok()).toBe(true);
  const payload = await exported.json();
  expect(payload).toMatchObject({ schemaVersion: 3, unchanged: false });
  expect(Object.keys(payload.tables).sort()).toEqual([
    "auditLogs",
    "counterparties",
    "expenses",
    "interestPeriods",
    "legacyLoanOnboardings",
    "lifecycleEvents",
    "loanTermCorrections",
    "loans",
    "notifications",
    "settlementReversals",
    "transactions",
  ]);
  expect(payload.tables.auditLogs.length).toBeGreaterThan(0);
  for (const audit of payload.tables.auditLogs) {
    expect(Object.keys(audit).sort()).toEqual([
      "action",
      "actor_user_id",
      "changed_at",
      "id",
      "record_id",
      "request_id",
      "table_name",
    ]);
    expect(JSON.stringify(audit)).not.toMatch(/old_data|new_data|p256dh|auth_secret|endpoint/i);
  }

  const unchanged = await request.get(
    `/api/google-sync/export?cursor=${encodeURIComponent(payload.sourceVersion)}`,
    { headers: { "x-sync-secret": "e2e-sync-secret" } },
  );
  expect(unchanged.ok()).toBe(true);
  expect(await unchanged.json()).toEqual({
    schemaVersion: 3,
    sourceVersion: payload.sourceVersion,
    unchanged: true,
  });
});
