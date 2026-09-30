import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { localSupabaseEnvironment } from "./helpers";

const local = localSupabaseEnvironment();
const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const credentials = { email: "c6_owner_e2e@auth.local", username: "c6_owner_e2e", password: "OwnerE2eTemp123" };
let paymentLoanId = "";
let settlementLoanId = "";
let restructureLoanId = "";
const matrixLoans = new Map<number, string>();

test.beforeAll(async () => {
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  let signIn = await owner.auth.signInWithPassword({ email: credentials.email, password: credentials.password });
  if (signIn.error) {
    credentials.password = "123456";
    signIn = await owner.auth.signInWithPassword({ email: credentials.email, password: credentials.password });
  }
  if (signIn.error || !signIn.data.user) throw signIn.error || new Error("C63 owner session was not created.");
  const { error: profileError } = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signIn.data.user.id);
  if (profileError) throw profileError;
  const { data: counterpartyId, error: counterpartyError } = await owner.rpc("create_counterparty", { p_name: "Đối tác C63 tổng hợp", p_notes: null });
  if (counterpartyError) throw counterpartyError;
  async function createLoan(name: string, key: string) {
    const { data: loanId, error: loanError } = await owner.rpc("create_loan_v3", {
      p_counterparty_id: counterpartyId,
      p_name: name,
      p_direction: "LENDING",
      p_original_principal_vnd: 1_000_000,
      p_disbursement_date: "2026-08-01",
      p_term_days: null,
      p_interest_cycle_days: 30,
      p_initial_period_rate_percent: 3,
      p_interest_reminder_offset_days: 0,
      p_idempotency_key: `${key}-${randomUUID()}`,
      p_notes: null,
    });
    if (loanError || !loanId) throw loanError || new Error("C63 loan was not created.");
    return loanId as string;
  }
  paymentLoanId = await createLoan("C63 thanh toán", "c63-payment-loan");
  settlementLoanId = await createLoan("C63 tất toán", "c63-settlement-loan");
  restructureLoanId = await createLoan("C63 giảm gốc", "c63-restructure-loan");
  for (const width of [375, 390, 1440]) matrixLoans.set(width, await createLoan(`C63 matrix ${width}`, "c63-matrix"));
});

async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(credentials.username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("cold auth shows a private startup fallback for 2s and 10s", async ({ page, context }) => {
  test.setTimeout(45_000);
  await context.clearCookies();
  await page.setExtraHTTPHeaders({ "x-e2e-auth-delay-ms": "2000" });
  const publicNavigation = page.goto("/login");
  const startup = page.getByText("Đang mở không gian tài chính…", { exact: true });
  await expect(startup).toBeVisible({ timeout: 1_500 });
  await expect(page.getByText("C63 thanh toán", { exact: true })).toHaveCount(0);
  await publicNavigation;
  await expect(page.getByRole("heading", { name: "Đăng nhập an toàn" })).toBeVisible();

  await page.setExtraHTTPHeaders({});
  await page.getByLabel("Tên đăng nhập").fill(credentials.username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.setExtraHTTPHeaders({ "x-e2e-auth-delay-ms": "10000" });
  const privateNavigation = page.goto(`/loans/${paymentLoanId}`);
  await expect(startup).toBeVisible({ timeout: 1_500 });
  await expect(page.getByText("C63 thanh toán", { exact: true })).toHaveCount(0);
  await privateNavigation;
  await expect(page).toHaveURL(new RegExp(`/loans/${paymentLoanId}$`));
  await expect(page.locator(".loan-detail-heading")).toBeVisible();
});

test("payment failures preserve input and repeated successes close, announce and restore focus", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.goto(`/loans/${paymentLoanId}`);
  await page.evaluate(() => {
    Object.assign(window, { c63SuccessCount: 0 });
    window.addEventListener("app:toast", event => {
      if ((event as CustomEvent).detail.message === "Đã ghi nhận thanh toán.") (window as unknown as { c63SuccessCount: number }).c63SuccessCount++;
    });
  });
  const trigger = page.getByRole("button", { name: "Giao dịch", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Ghi giao dịch" });
  const amount = dialog.getByLabel("Số tiền (VND)");

  let abortNextAction = true;
  await page.route("**/*", async route => {
    if (abortNextAction && route.request().method() === "POST" && route.request().headers()["next-action"]) {
      abortNextAction = false;
      await route.abort("failed");
      return;
    }
    await route.continue();
  });
  await amount.fill("1111");
  await dialog.getByRole("button", { name: "Ghi nhận", exact: true }).click();
  await expect(dialog.getByText(/Chưa thể xác nhận thao tác/)).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(amount).toHaveValue("1.111");
  await page.unroute("**/*");

  let delayNextAction = true;
  await page.route("**/*", async route => {
    if (delayNextAction && route.request().method() === "POST" && route.request().headers()["next-action"]) {
      delayNextAction = false;
      await new Promise(resolve => setTimeout(resolve, 900));
    }
    await route.continue();
  });
  await dialog.getByRole("button", { name: "Ghi nhận", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Đang lưu ghi giao dịch" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeHidden();
  await page.unroute("**/*");
  await expect(page.locator(".ui-toast")).toHaveAttribute("aria-label", "Đã ghi nhận thanh toán.");
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Đóng thông báo" }).click();

  await trigger.click();
  await expect(dialog.getByLabel("Số tiền (VND)")).toHaveValue("");
  await expect(dialog.locator(".action-message")).toHaveCount(0);
  await dialog.getByLabel("Số tiền (VND)").fill("2000");
  await dialog.getByRole("button", { name: "Ghi nhận", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".ui-toast")).toHaveAttribute("aria-label", "Đã ghi nhận thanh toán.");
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => (window as unknown as { c63SuccessCount: number }).c63SuccessCount)).toBe(2);
});

test("settlement and principal restructure share dirty, validation and success lifecycle", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await page.goto(`/loans/${restructureLoanId}`);
  const restructureTrigger = page.getByRole("button", { name: "Giảm gốc", exact: true });
  await restructureTrigger.click();
  const restructure = page.getByRole("dialog", { name: "Giảm gốc và mở kỳ mới" });
  await restructure.getByLabel("Số gốc thực trả (VND)").fill("0");
  await expect(restructure.getByText("Số gốc thực trả phải lớn hơn 0.")).toBeVisible();
  await expect(restructure.getByText("Đang tính phương án chính xác…")).toHaveCount(0);

  let confirmations = 0;
  page.once("dialog", async prompt => { confirmations += 1; await prompt.dismiss(); });
  await page.keyboard.press("Escape");
  await expect(restructure).toBeVisible();
  expect(confirmations).toBe(1);
  page.once("dialog", prompt => prompt.accept());
  await page.keyboard.press("Escape");
  await expect(restructure).toBeHidden();
  await restructureTrigger.click();
  await expect(restructure.getByLabel("Số gốc thực trả (VND)")).toHaveValue("");
  await restructure.getByLabel("Số gốc thực trả (VND)").fill("100000");
  await expect(restructure.getByText("100.000 ₫", { exact: true }).first()).toBeVisible();
  await restructure.getByLabel(/Tôi xác nhận gốc thực trả/).check();
  await restructure.getByRole("button", { name: "Xác nhận giảm gốc" }).click();
  await expect(restructure).toBeHidden();
  await expect(restructureTrigger).toBeFocused();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/loans/${settlementLoanId}`);
  const settlementTrigger = page.getByRole("button", { name: "Tất toán", exact: true });
  await settlementTrigger.click();
  const settlement = page.getByRole("dialog", { name: "Tất toán khoản vay" });
  await expect(settlement.getByText("Tổng tất toán")).toBeVisible();
  await settlement.getByLabel(/Tôi xác nhận hệ thống/).check();
  await settlement.getByRole("button", { name: "Tất toán toàn bộ" }).click();
  await expect(settlement).toBeHidden();
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.getByText("Khoản vay đã tất toán.")).toBeVisible();
});

test("cancelled and long navigation keep progress aligned with the real transition", async ({ page }) => {
  test.setTimeout(45_000);
  await login(page);
  await page.goto("/counterparties");
  const editor = page.locator("details").filter({ hasText: "Chỉnh sửa thông tin" }).first();
  await editor.locator("summary").click();
  const name = editor.getByLabel("Tên đối tác");
  const originalName = await name.inputValue();
  await name.fill(`${originalName} bản nháp`);
  page.once("dialog", prompt => prompt.dismiss());
  await page.getByRole("link", { name: "Khoản vay", exact: true }).last().click();
  await page.waitForTimeout(250);
  await expect(page).toHaveURL(/\/counterparties$/);
  await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "false");

  await name.fill(originalName);
  await page.goto("/dashboard");
  await page.route("**/*", async route => {
    if (route.request().headers().rsc === "1") await new Promise(resolve => setTimeout(resolve, 10_000));
    await route.continue();
  });
  const navigation = page.getByRole("link", { name: "Khoản vay", exact: true }).last().click();
  await page.waitForTimeout(8_400);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "true");
  await expect(page.getByText("Nội dung đang tải lâu hơn dự kiến…")).toBeAttached();
  await navigation;
  await expect(page).toHaveURL(/\/loans$/);
  await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "false");
  await page.unroute("**/*");

  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "false");
  await page.goForward();
  await expect(page).toHaveURL(/\/loans$/);
  await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "false");
});

for (const width of [375, 390, 1440]) {
  test(`all financial drawers commit once and reset at ${width}px`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: width === 390 ? 480 : 900 });
    await page.emulateMedia({ colorScheme: width === 390 ? "dark" : "light", reducedMotion: "reduce" });
    await login(page);
    const loanId = matrixLoans.get(width)!;
    await page.goto(`/loans/${loanId}`);
    await page.evaluate(() => {
      Object.assign(window, { c63Events: [] });
      window.addEventListener("app:toast", event => {
        (window as unknown as { c63Events: unknown[] }).c63Events.push({
          message: (event as CustomEvent).detail.message,
          openDialogs: document.querySelectorAll("dialog[open]").length,
        });
      });
    });
    const paymentTrigger = page.getByRole("button", { name: "Giao dịch", exact: true });
    await paymentTrigger.click();
    const payment = page.getByRole("dialog", { name: "Ghi giao dịch" });
    await page.keyboard.press("Tab");
    expect(await payment.evaluate(dialog => dialog.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Shift+Tab");
    expect(await payment.evaluate(dialog => dialog.contains(document.activeElement))).toBe(true);
    await payment.getByLabel("Loại tiền").selectOption("PRINCIPAL_PAYMENT");
    await payment.getByLabel("Ngày thanh toán").fill("2026-08-01");
    await payment.getByLabel("Số tiền (VND)").fill("1000");
    // Two synchronous submit attempts exercise the hook guard before React disables controls.
    await payment.locator("form").evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit(); });
    await expect(payment).toBeHidden();
    await expect(paymentTrigger).toBeFocused();
    const rows = await admin.from("transactions").select("id").eq("loan_id", loanId).eq("type", "PRINCIPAL_PAYMENT");
    expect(rows.error).toBeNull();
    expect(rows.data).toHaveLength(1);
    await paymentTrigger.click();
    await expect(payment.getByLabel("Số tiền (VND)")).toHaveValue("");
    await page.keyboard.press("Escape");
    await expect(payment).toBeHidden();

    const trigger = page.getByRole("button", { name: "Giảm gốc", exact: true });
    await trigger.click();
    const restructure = page.getByRole("dialog", { name: "Giảm gốc và mở kỳ mới" });
    const amount = restructure.getByLabel("Số gốc thực trả (VND)");
    await amount.fill("999999999");
    await expect(restructure.locator('[role="alert"]').filter({ hasText: /.+/ }).first()).toBeVisible();
    await expect(restructure.getByRole("button", { name: "Xác nhận giảm gốc" })).toBeDisabled();
    await amount.fill("10000");
    await amount.fill("20000");
    await expect(restructure.locator('[name="expectedPrincipalBeforeVnd"]')).toHaveValue("999000");
    await amount.fill("invalid");
    await expect(restructure.locator(".restructure-preview")).toHaveCount(0);
    await expect(restructure.getByText("Đang tính phương án chính xác…")).toHaveCount(0);
    await amount.fill("20000");
    const date = restructure.getByLabel("Dư gốc mới có hiệu lực từ ngày");
    await date.fill("2026-08-02");
    await expect(restructure.locator("legend")).toContainText("2/8/2026");
    await restructure.getByLabel(/Tôi xác nhận gốc thực trả/).check();
    await restructure.getByRole("button", { name: "Xác nhận giảm gốc" }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`drawer-${width}.png`), fullPage: true });
    await restructure.getByRole("button", { name: "Xác nhận giảm gốc" }).click();
    await expect(restructure).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(amount).toHaveValue("");
    await expect(restructure.locator(".restructure-preview")).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Tất toán", exact: true }).click();
    const settlement = page.getByRole("dialog", { name: "Tất toán khoản vay" });
    await expect(settlement.getByText("979.000 ₫", { exact: true })).toBeVisible();
    await settlement.getByLabel(/Tôi xác nhận hệ thống/).check();
    await settlement.getByRole("button", { name: "Tất toán toàn bộ" }).click();
    await expect(settlement).toBeHidden();
    await expect(page.locator("#main-content")).toBeFocused();
    await expect(page.getByText("Khoản vay đã tất toán.")).toBeVisible();
    const events = await page.evaluate(() => (window as unknown as { c63Events: { openDialogs: number }[] }).c63Events);
    expect(events).toHaveLength(3);
    expect(events.every(event => event.openDialogs === 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("resume and expired cookies preserve the auth boundary; query tabs finish progress", async ({ page, context }) => {
  await login(page);
  await page.goto(`/loans/${paymentLoanId}?tab=overview`);
  const other = await context.newPage();
  await other.goto("about:blank");
  await other.bringToFront();
  await page.bringToFront();
  await expect(page.locator(".initial-app-loading")).toHaveCount(0);
  const tabs = page.getByRole("navigation", { name: "Nội dung khoản vay" });
  await tabs.getByRole("link", { name: "Lịch sử" }).click();
  await expect(page).toHaveURL(/tab=history/);
  await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "false");
  await tabs.getByRole("link", { name: "Lịch sử" }).click();
  await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "false");
  await other.close();
  // Expire only the local fixture's browser session, then request the private deep link.
  const authCookies = (await context.cookies()).filter(cookie => cookie.name.startsWith("sb-"));
  expect(authCookies.length).toBeGreaterThan(0);
  await context.addCookies(authCookies.map(cookie => ({ ...cookie, expires: 1 })));
  await page.goto(`/loans/${paymentLoanId}`);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("C63 thanh toán", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Đăng nhập an toàn" })).toBeVisible();
});

test("all drawer dismissal routes ask once and keep or discard the draft consistently", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.goto(`/loans/${paymentLoanId}`);
  for (const [triggerName, title] of [["Giao dịch", "Ghi giao dịch"], ["Giảm gốc", "Giảm gốc và mở kỳ mới"], ["Tất toán", "Tất toán khoản vay"]]) {
    const trigger = page.getByRole("button", { name: triggerName, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: title });
    const note = dialog.getByLabel("Ghi chú", { exact: true });
    await note.fill("Bản nháp C63");
    let prompts = 0;
    const keep = async (prompt: import("@playwright/test").Dialog) => { prompts++; await prompt.dismiss(); };
    page.on("dialog", keep);
    await dialog.getByRole("button", { name: `Đóng ${title.toLocaleLowerCase("vi")}`, exact: true }).click();
    expect(prompts).toBe(1);
    await page.mouse.click(2, 2);
    expect(prompts).toBe(2);
    await page.keyboard.press("Escape");
    expect(prompts).toBe(3);
    await expect(note).toHaveValue("Bản nháp C63");
    page.off("dialog", keep);
    page.once("dialog", async prompt => { prompts++; await prompt.accept(); });
    const grabber = await dialog.locator(".ui-sheet-grabber").boundingBox();
    expect(grabber).not.toBeNull();
    await page.mouse.move(grabber!.x + grabber!.width / 2, grabber!.y + grabber!.height / 2);
    await page.mouse.down();
    await page.mouse.move(grabber!.x + grabber!.width / 2, grabber!.y + grabber!.height / 2 + 110, { steps: 5 });
    await page.mouse.up();
    await expect(dialog).toBeHidden();
    expect(prompts).toBe(4);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(note).toHaveValue("");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
});
