import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { dashboardReminderWindow } from "../../src/lib/business/dashboard-period";
import { formatDate, todayInVietnam } from "../../src/lib/business/format";
import { localSupabaseEnvironment } from "./helpers";

const initialPassword = readFileSync(resolve(process.cwd(), "test/e2e/global-setup.ts"), "utf8").match(/password: "([^"]+)"/)![1];
let ownerPassword = initialPassword;
const base = "http://127.0.0.1:3101";
const local = localSupabaseEnvironment();
const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
const evidence = resolve(process.cwd(), "../../.cache/c117");
const today = todayInVietnam();
const reminderWindow = dashboardReminderWindow(today);

function daysBefore(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: base }]);
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(ownerPassword);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.beforeAll(async () => {
  test.setTimeout(180_000);
  let signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password: "123456" });
  if (signed.error) {
    ownerPassword = initialPassword;
    signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password: ownerPassword });
  } else {
    ownerPassword = "123456";
  }
  expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();

  const counterparty = await owner.rpc("create_counterparty", {
    p_name: "C117 Đối tác tổng hợp",
    p_notes: "Dữ liệu giả kiểm thử C117",
  });
  expect(counterparty.error).toBeNull();

  for (const fixture of [
    { name: "C117 khoản cho vay", direction: "LENDING", principal: "10000000", rate: "3" },
    { name: "C117 khoản đi vay", direction: "BORROWING", principal: "4000000", rate: "0.75" },
  ] as const) {
    const loan = await owner.rpc("create_loan_v3", {
      p_counterparty_id: counterparty.data,
      p_name: fixture.name,
      p_direction: fixture.direction,
      p_original_principal_vnd: fixture.principal,
      p_disbursement_date: daysBefore(today, 28),
      p_term_days: null,
      p_interest_cycle_days: 30,
      p_initial_period_rate_percent: fixture.rate,
      p_interest_reminder_offset_days: 0,
      p_idempotency_key: randomUUID(),
      p_notes: "Dữ liệu giả C117",
    });
    expect(loan.error).toBeNull();

    const transactions = fixture.direction === "LENDING"
      ? [["PRINCIPAL_PAYMENT", "2000000"], ["INTEREST_PAYMENT", "150000"]]
      : [["INTEREST_PAYMENT", "20000"]];
    for (const [type, amount] of transactions) {
      const recorded = await owner.rpc("record_financial_transaction", {
        p_loan_id: loan.data,
        p_type: type,
        p_transaction_date: today,
        p_amount_vnd: amount,
        p_idempotency_key: randomUUID(),
        p_note: "Giao dịch giả C117",
      });
      expect(recorded.error).toBeNull();
    }
  }
  mkdirSync(evidence, { recursive: true });
});

test("C117 lịch nhắc dùng trọn tháng hiện tại, độc lập bộ lọc báo cáo", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard?from=2026-08-01&to=2026-08-31&preset=custom");
  const label = `${formatDate(reminderWindow.start)}–${formatDate(reminderWindow.end)}`;
  await expect(page.getByRole("region", { name: "Khoảng báo cáo 01/08/2026–31/08/2026" })).toBeVisible();
  await expect(page.getByRole("heading", { name: new RegExp(`lịch nhắc · ${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) })).toBeVisible();
  await expect(page.locator(".attention-card").filter({ hasText: /C117 Đối tác tổng hợp.*Cho vay/ })).toBeVisible();
});

test("C117 tìm đối tác hiển thị đủ tổng hợp, riêng tư và responsive", async ({ page }) => {
  test.setTimeout(300_000);
  await login(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/counterparties?q=C117%20Đối%20tác%20tổng%20hợp");
  const card = page.locator(".counterparty-card").filter({ hasText: "C117 Đối tác tổng hợp" });
  await expect(card).toBeVisible();
  const summary = page.locator(".counterparty-card .counterparty-financial-grid").first();
  await expect(summary).toContainText("Đang cho vay");
  await expect(summary).toContainText("8.000.000");
  await expect(summary).toContainText("Đang đi vay");
  await expect(summary).toContainText("4.000.000");
  await expect(summary).toContainText("Lãi đã thu");
  await expect(summary).toContainText("150.000");
  await expect(summary).toContainText("Lãi đã trả");
  await expect(summary).toContainText("20.000");
  expect(await summary.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(4);

  await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)", exact: true }).click();
  await expect(summary).not.toContainText("8.000.000");
  await expect(summary.locator(".privacy-amount-masked")).toHaveCount(4);
  expect(await page.locator("#main-content").ariaSnapshot()).not.toContain("8.000.000");
  await page.getByRole("button", { name: "Hiển thị số tiền", exact: true }).click();

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await summary.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.context().storageState({ path: resolve(evidence, "storage-state.json") });
  await page.screenshot({ path: resolve(evidence, "counterparties-375-light.png"), fullPage: true, animations: "disabled" });

  if (process.env.C117_EVON === "true") {
    const original = readFileSync("/Users/ngotuong/.codex/skills/evondev-ui-ux/scripts/probe.mjs", "utf8");
    expect(original.split("await browser.newContext({").length - 1).toBe(3);
    const probe = resolve(evidence, "probe.mjs");
    writeFileSync(probe, original.replaceAll("await browser.newContext({", "await browser.newContext({ storageState: process.env.C117_STORAGE_STATE,"));
    const packageRequire = createRequire(resolve(process.cwd(), "package.json"));
    const playwrightDirectory = dirname(createRequire(packageRequire.resolve("@playwright/test/package.json")).resolve("playwright/package.json"));
    const jobs = [
      { name: "counterparties-light", route: "/counterparties?q=C117%20Đối%20tác%20tổng%20hợp", dark: false },
      { name: "counterparties-dark", route: "/counterparties?q=C117%20Đối%20tác%20tổng%20hợp", dark: true },
      { name: "dashboard-light", route: "/dashboard?from=2026-08-01&to=2026-08-31&preset=custom", dark: false },
      { name: "dashboard-dark", route: "/dashboard?from=2026-08-01&to=2026-08-31&preset=custom", dark: true },
    ];
    for (const job of jobs) {
      const output = resolve(evidence, `probe-${job.name}`);
      const args = [probe, `${base}${job.route}`, "--pw", playwrightDirectory, "--widths", "375,768,1024,1440", "--wait", "1800", "--out", output];
      if (job.dark) args.push("--dark"); else args.push("--sweep", "1440,375,20");
      const exitCode = await new Promise<number | null>((done, reject) => {
        const child = spawn(process.execPath, args, { env: { ...process.env, C117_STORAGE_STATE: resolve(evidence, "storage-state.json") } });
        child.on("error", reject);
        child.on("close", done);
      });
      expect(exitCode, `visual probe ${job.name}`).toBe(0);
      expect(JSON.parse(readFileSync(resolve(output, "report.json"), "utf8")).widths).toHaveLength(4);
    }
  }
});
