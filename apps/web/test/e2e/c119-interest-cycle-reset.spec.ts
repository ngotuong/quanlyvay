import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { localSupabaseEnvironment } from "./helpers";
import { todayInVietnam, formatDate } from "../../src/lib/business/format";

test("C119 attaches a new cycle to an existing rate event through the form", async ({ page }, testInfo) => {
  const local = localSupabaseEnvironment();
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  let password = "123456";
  let signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  if (signed.error) {
    password = "OwnerE2eTemp123";
    signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  }
  expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();
  const today = todayInVietnam();
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 37);
  const cp = await owner.rpc("create_counterparty", { p_name: "C119 synthetic", p_notes: null });
  expect(cp.error).toBeNull();
  const loan = await owner.rpc("create_loan_v3", {
    p_counterparty_id: cp.data, p_name: "C119 synthetic cycle", p_direction: "LENDING",
    p_original_principal_vnd: "1000000", p_disbursement_date: date.toISOString().slice(0, 10),
    p_term_days: null, p_interest_cycle_days: 15, p_initial_period_rate_percent: 0,
    p_interest_reminder_offset_days: 1, p_idempotency_key: randomUUID(), p_notes: null,
  });
  expect(loan.error).toBeNull();
  expect((await owner.rpc("record_lifecycle_event_v2", {
    p_loan_id: loan.data, p_event_type: "RATE_CHANGE", p_effective_date: today,
    p_idempotency_key: randomUUID(), p_period_rate_percent: "1.5",
  })).error).toBeNull();
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto(`/loans/${loan.data}?tab=settings`);
  await page.locator("details").filter({ hasText: "Lãi suất và trạng thái nợ xấu" }).locator("summary").click();
  await page.getByLabel("Lãi suất mới (%/15 ngày)", { exact: true }).fill("1,5");
  await page.getByLabel("Lấy ngày hiệu lực làm ngày đầu chu kỳ mới").check();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("c119-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Cập nhật", exact: true }).click();
  await expect(page.getByText("Đã cập nhật lịch sử khoản vay.")).toBeVisible();
  await page.getByRole("link", { name: "Lịch sử", exact: true }).click();
  await expect(page.getByText(`Mở chu kỳ mới từ ${formatDate(today)}`)).toBeVisible();
  const schedule = await owner.rpc("get_loan_schedule_summary", { p_loan_id: loan.data, p_as_of_date: today });
  expect(schedule.error).toBeNull();
  const periodEnd = new Date(`${today}T00:00:00Z`);
  periodEnd.setUTCDate(periodEnd.getUTCDate() + 14);
  expect(schedule.data.nextInterestPeriodEndDate).toBe(periodEnd.toISOString().slice(0, 10));
  expect((await owner.from("loan_lifecycle_events").select("id").eq("loan_id", loan.data)).data).toHaveLength(1);
});
