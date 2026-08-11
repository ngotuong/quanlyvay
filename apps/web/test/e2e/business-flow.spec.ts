import { expect, test } from "@playwright/test";

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
  await expect(page.getByText("Đã điều chỉnh dữ liệu ban đầu và lưu đầy đủ lịch sử.")).toBeVisible();
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
  await expect(page.getByText("Nợ xấu").first()).toBeVisible();
  await loanTabs.getByRole("link", { name: "Lịch sử" }).click();
  await expect(page.getByText("Chuyển nợ xấu")).toBeVisible();

  await page.getByRole("link", { name: "Nhật ký hệ thống" }).first().click();
  await expect(page.getByRole("heading", { name: "Nhật ký hệ thống" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
  await page.getByRole("link", { name: "Khoản vay" }).first().click();
  await expect(page.getByRole("heading", { name: "Các khoản vay" })).toBeVisible();
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
  await page.getByRole("button", { name: "Nâng cao" }).click();
  const advancedFilterDialog = page.getByRole("dialog", { name: "Ngày giải ngân và sắp xếp" });
  await expect(advancedFilterDialog).toBeVisible();
  expect(await advancedFilterDialog.evaluate((element) => getComputedStyle(element).animationName)).toBe("sheet-enter");
  await advancedFilterDialog.getByRole("button", { name: "Đóng" }).click();
  await expect(advancedFilterDialog).toBeHidden();
  await page.locator(".loan-card").first().click();
  const mobileTabs = page.getByRole("navigation", { name: "Nội dung khoản vay" });
  await expect(mobileTabs.getByRole("link")).toHaveCount(4);
  const tabTops = await mobileTabs.getByRole("link").evaluateAll((links) => links.map((link) => Math.round(link.getBoundingClientRect().top)));
  expect(new Set(tabTops).size).toBe(1);
  await page.getByRole("button", { name: "Ghi giao dịch" }).click();
  const transactionDialog = page.getByRole("dialog", { name: "Ghi giao dịch" });
  await expect(transactionDialog).toBeVisible();
  expect(await transactionDialog.evaluate((element) => getComputedStyle(element).animationName)).toBe("sheet-enter");
  await transactionDialog.getByRole("button", { name: "Đóng" }).click();
  await expect(transactionDialog).toHaveClass(/is-closing/);
  await expect(transactionDialog).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("editor is redirected away from owner-only pages", async ({ page }) => {
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
  await expect(page).toHaveURL(/dashboard/);
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

  await expect(page.getByText("Đã tạo tài khoản.", { exact: true })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
    const primaryMetrics = page.locator(".dashboard-primary-metrics").first();
    await expect(primaryMetrics.getByText("Lãi ròng thực thu", { exact: true })).toBeVisible();
    await expect(primaryMetrics.getByText("Lãi ròng phát sinh", { exact: true })).toBeVisible();
    await expect(primaryMetrics.locator(".dashboard-metric")).toHaveCount(4);
    await expect(page.getByRole("heading", { name: "Xu hướng dòng tiền" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cần xử lý" })).toBeVisible();
    const [attentionBox, cashFlowBox] = await Promise.all([
      page.locator(".attention-card").first().boundingBox(),
      page.locator(".cash-flow-card").first().boundingBox(),
    ]);
    expect((attentionBox?.y ?? 0) <= (cashFlowBox?.y ?? 0)).toBe(true);
    await expect(page.locator(".attention-groups").first()).not.toHaveCSS("overflow-y", "auto");
    await expect(page.getByRole("group", { name: /Biểu đồ cột/ }).first()).toBeVisible();
    const firstCashBar = page.locator(".cash-bar-control").first();
    await firstCashBar.focus();
    await expect(firstCashBar.locator(".chart-tooltip")).toHaveCSS("opacity", "1");
    await page.locator(".dashboard-analysis > summary").first().click();
    await expect(page.getByRole("heading", { name: "Phát sinh và thanh toán lãi" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Xu hướng dòng tiền" })).toBeVisible();
  await page.locator(".cash-flow-card .chart-data-details > summary").click();
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

test("dashboard periods and loan filters are deep-linkable", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await page.getByRole("link", { name: "Tháng trước" }).click();
  await expect(page).toHaveURL(/dashboard\?preset=previous_month/);
  await page.getByRole("button", { name: "Tùy chỉnh" }).click();
  await expect(page.getByLabel("Từ ngày")).toHaveValue("2026-07-01");
  await expect(page.getByLabel("Đến ngày")).toHaveValue("2026-07-31");
  await page.getByRole("button", { name: "Đóng" }).click();
  await page.locator(".dashboard-analysis > summary").click();
  await expect(page.getByText("Nợ xấu phải thu", { exact: true })).toBeVisible();

  await page.goto("/loans?status=BAD_DEBT");
  await expect(page.getByLabel("Trạng thái")).toHaveValue("BAD_DEBT");
  await expect(page.getByRole("link", { name: "Xóa tất cả" }).first()).toBeVisible();
  await expect(page.locator(".filter-pills").first()).toHaveCSS("flex-wrap", "nowrap");

  await page.getByLabel("Trạng thái").selectOption("");
  await page.getByLabel("Tên khoản vay hoặc đối tác").fill("C16 hoàn tác");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page).toHaveURL(/q=C16/);
  await expect(page.getByRole("heading", { name: "C16 hoàn tác tất toán" })).toBeVisible();
  await expect(page.locator(".loan-card-values").first().locator("div")).toHaveCount(2);
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
  await expect(page.getByLabel("Giải ngân từ")).toHaveValue("");
});

test("PWA manifest, service worker and notification center are available", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();

  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).display).toBe("standalone");
  const worker = await page.request.get("/sw.js");
  expect(worker.ok()).toBe(true);
  expect(await worker.text()).toContain('addEventListener("push"');

  await page.getByRole("link", { name: /Thông báo/ }).first().click();
  await expect(page.getByRole("heading", { name: "Thông báo", exact: true })).toBeVisible();
  await expect(page.getByText("Khoản vay đã quá hạn", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Thông báo trên thiết bị" })).toBeVisible();
  const unreadBefore = Number(await page.locator(".nav-badge").first().innerText());
  await page.getByRole("button", { name: /Khoản vay đã quá hạn/ }).first().click();
  await expect(page).toHaveURL(/\/loans\//);
  if (unreadBefore > 1) await expect(page.locator(".nav-badge").first()).toHaveText(String(unreadBefore - 1));
  else await expect(page.locator(".nav-badge")).toHaveCount(0);
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
