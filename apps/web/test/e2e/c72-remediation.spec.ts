import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";

const local = localSupabaseEnvironment();
const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let password = "OwnerE2eTemp123";
const out = resolve(process.cwd(), "../../docs/remediation-c72");
test.beforeAll(async () => {
  // Reset plus the existing 180s Auth readiness deadline must fit this fixture hook.
  test.setTimeout(300000);
  // This file's acceptance fixtures require exactly two expenses and thirteen tasks.
  // Earlier volume tests share the disposable DB. Reset only when their fixtures remain,
  // and only before this final, serial test file; the helper guards project/host/port.
  const marker = await admin.from("counterparties").select("id").eq("name", "C72 synthetic").maybeSingle();
  const transactions = await admin.from("transactions").select("id", { count: "exact", head: true });
  if (!marker.data && (transactions.count ?? 0) > 1) {
    // CI prepared the DB before the suite, but preceding tests have since mutated it.
    // Explicitly reset this guarded, disposable local DB before recreating its users.
    if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
    await globalSetup();
  }
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  let sign = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password });
  if (sign.error) { password = "123456"; sign = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password }); }
  if (sign.error || !sign.data.user) throw sign.error || new Error("Missing local fixture owner");
  const updated = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", sign.data.user.id);
  if (updated.error) throw updated.error;
  const existing = await owner.from("counterparties").select("id").eq("name", "C72 synthetic").maybeSingle();
  const party = existing.data ? { data: existing.data.id, error: null } : await owner.rpc("create_counterparty", { p_name: "C72 synthetic", p_notes: null });
  if (party.error) throw party.error;
  for (let i = 0; i < 12; i++) {
    const loan = await owner.rpc("create_loan_v3", { p_counterparty_id: party.data, p_name: `C72 khoản mẫu ${i+1}`, p_direction: "LENDING", p_original_principal_vnd: 1000000, p_disbursement_date: "2026-08-01", p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: `c72-loan-${i}`, p_notes: null });
    if (loan.error) throw loan.error;
  }
});
async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
  await page.goto("/login"); await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e"); await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/dashboard/);
}
async function rejectHistory(page: Page, direction: "back" | "forward") {
  const url = page.url(); const before = await page.evaluate(() => scrollY); let prompts = 0;
  page.once("dialog", async d => { prompts++; await d.dismiss(); });
  await page.evaluate(d => history[d](), direction); await page.waitForTimeout(350);
  expect(prompts).toBe(1); expect(page.url()).toBe(url); expect(await page.evaluate(() => scrollY)).toBe(before);
  await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible", "false");
}

test("C72 dirty Back/Forward keeps loan draft, URL, focus and history without loops", async ({ page }) => {
  await login(page); await page.goto("/loans"); await page.getByRole("link", { name: "Tạo khoản vay", exact: true }).click();
  const field = page.getByLabel("Nhãn phân biệt"); await field.fill("C72 draft");
  let linkPrompts = 0;
  page.once("dialog", async d => { linkPrompts++; await d.dismiss(); });
  await page.getByRole("link", { name: "Quay lại danh sách" }).evaluate((a: HTMLAnchorElement) => a.click());
  expect(linkPrompts).toBe(1); await expect(page).toHaveURL(/loans\/new/); await expect(field).toHaveValue("C72 draft");
  page.once("dialog", async d => { expect(d.type()).toBe("beforeunload"); await d.dismiss(); });
  await page.reload({ timeout: 3000 }).catch(error => { expect(String(error)).toMatch(/ERR_ABORTED|Timeout|cancelled/); });
  await expect(field).toHaveValue("C72 draft");
  await rejectHistory(page, "back"); await expect(field).toHaveValue("C72 draft"); await expect(field).toBeFocused();
  page.once("dialog", d => d.accept()); await page.evaluate(() => history.back()); await expect(page).toHaveURL(/\/loans$/); await expect(field).toBeHidden();
  await page.evaluate(() => history.forward()); await expect(page).toHaveURL(/loans\/new/);
  await expect(field).toHaveValue("");
  await page.getByRole("link", { name: "Quay lại danh sách" }).click(); await expect(page).toHaveURL(/\/loans$/); await expect(field).toBeHidden();
  await page.evaluate(() => history.back()); await expect(page).toHaveURL(/loans\/new/); await field.fill("Forward draft");
  await rejectHistory(page, "forward"); await expect(field).toHaveValue("Forward draft");
  page.once("dialog", d => d.accept()); await page.evaluate(() => history.forward()); await expect(page).toHaveURL(/\/loans$/);
});

test("C72 editor and expense sheet keep dirty drafts on history and dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await login(page);
  await page.locator(".app-sidebar").getByRole("link", { name: "Đối tác", exact: true }).click();
  const editor = page.locator(".edit-details").first(); await editor.locator("summary").click();
  await editor.getByLabel("Ghi chú").fill("C72 editor draft"); await rejectHistory(page, "back");
  await expect(editor.getByLabel("Ghi chú")).toHaveValue("C72 editor draft");
  page.once("dialog", d => d.dismiss()); await editor.locator("summary").click(); await expect(editor).toHaveAttribute("open", "");
  page.once("dialog", d => d.accept()); await editor.locator("summary").click(); await expect(editor).not.toHaveAttribute("open", "");
  await editor.locator("summary").click(); await expect(editor.getByLabel("Ghi chú")).not.toHaveValue("C72 editor draft");
  await editor.getByLabel("Ghi chú").fill("C72 again");
  page.once("dialog", d => d.accept()); await page.evaluate(() => history.back()); await expect(page).toHaveURL(/dashboard/);
  await page.locator(".app-sidebar").getByRole("link", { name: "Chi phí", exact: true }).click();
  await page.getByRole("button", { name: "Thêm chi phí", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Thêm chi phí" }); await sheet.getByLabel("Ghi chú").fill("C72 expense draft");
  await rejectHistory(page, "back"); await expect(sheet).toBeVisible(); await expect(sheet.getByLabel("Ghi chú")).toHaveValue("C72 expense draft");
  page.once("dialog", d => d.dismiss()); await page.keyboard.press("Escape"); await expect(sheet).toBeVisible();
  page.once("dialog", d => d.accept()); await page.keyboard.press("Escape"); await expect(sheet).toBeHidden();
  await page.getByRole("button", { name: "Thêm chi phí", exact: true }).click(); await expect(sheet.getByLabel("Ghi chú")).toHaveValue("");
  await page.keyboard.press("Escape");
});

test("C72 expense errors keep draft, duplicate submit commits once and repeated save resets", async ({ page }) => {
  test.setTimeout(60000); await page.setViewportSize({ width: 390, height: 844 }); await login(page); await page.goto("/expenses");
  const trigger = page.getByRole("button", { name: "Thêm chi phí", exact: true }); await trigger.click(); const sheet = page.getByRole("dialog", { name: "Thêm chi phí" });
  await sheet.getByLabel("Số tiền (VND)").fill("1000"); await sheet.getByLabel("Nhóm chi phí").fill("C72 expense one");
  await page.route("**/*", async r => { if (r.request().method() === "POST" && r.request().headers()["next-action"]) await r.abort("failed"); else await r.continue(); });
  await sheet.getByRole("button", { name: "Ghi chi phí chung" }).click(); await expect(sheet.getByText(/Chưa thể xác nhận thao tác/)).toBeVisible(); await expect(sheet.getByLabel("Số tiền (VND)")).toHaveValue("1.000"); await page.unroute("**/*");
  const key = await sheet.locator('[name="idempotencyKey"]').inputValue();
  await sheet.locator("form").evaluate((f: HTMLFormElement) => { f.requestSubmit(); f.requestSubmit(); }); await expect(sheet).toBeHidden(); await expect(trigger).toBeFocused();
  const rows = await admin.from("transactions").select("id").eq("idempotency_key", key); expect(rows.error).toBeNull(); expect(rows.data).toHaveLength(1);
  await trigger.click(); await expect(sheet.getByLabel("Số tiền (VND)")).toHaveValue(""); await sheet.getByLabel("Số tiền (VND)").fill("2000"); await sheet.getByLabel("Nhóm chi phí").fill("C72 expense two");
  await sheet.getByRole("button", { name: "Ghi chi phí chung" }).click(); await expect(sheet).toBeHidden();
  const list = page.getByRole("region", { name: "Danh sách chi phí chung" }); await expect(list.getByRole("heading", { name: "C72 expense two" })).toBeVisible();
  expect((await list.boundingBox())!.y).toBeLessThan(500);
  if (process.env.C72_EVIDENCE === "true") { mkdirSync(out, { recursive: true }); writeFileSync(resolve(out,"expense-lifecycle.json"), JSON.stringify({listTop:(await list.boundingBox())!.y,duplicateRows:rows.data?.length,defaultActions:4},null,2)); await page.screenshot({ path: resolve(out, "expenses-390-light.png"), fullPage: true }); }
});

test("C72 notifications expose pending, retry transport errors and active filter", async ({ page }) => {
  await login(page);
  const profile = await admin.from("profiles").select("user_id").eq("username", "c6_owner_e2e").single();
  const loan = await admin.from("loans").select("id").eq("name", "C72 khoản mẫu 1").single();
  const id = randomUUID();
  const inserted = await admin.from("notifications").insert({ id, user_id: profile.data!.user_id, loan_id: loan.data!.id, type: "LOAN_OVERDUE", notification_date: "2026-10-01", title: "C72 read-one fixture", body: "Synthetic notification", idempotency_key: `c72-read-${id}` });
  expect(inserted.error).toBeNull();
  await page.goto("/notifications?unread=true");
  let opens = 0;
  await page.route("**/*", async r => { if (r.request().method() === "POST" && r.request().headers()["next-action"]) { opens++; await new Promise(done => setTimeout(done,1200)); } await r.continue(); });
  const item = page.getByRole("button").filter({ hasText: "C72 read-one fixture" });
  await item.click(); await expect(item).toBeDisabled({ timeout: 200 }); await expect(item.getByRole("status")).toHaveText("Đang mở thông báo…", { timeout: 200 });
  await item.locator("..").evaluate((f: HTMLFormElement) => { f.requestSubmit(); f.requestSubmit(); });
  await expect(page).toHaveURL(new RegExp(`/loans/${loan.data!.id}`)); expect(opens).toBe(1); await page.unroute("**/*");
  const read = await admin.from("notifications").select("read_at").eq("id",id).single(); expect(read.data?.read_at).not.toBeNull();
  await admin.from("notifications").insert({ user_id: profile.data!.user_id, type: "LOAN_OVERDUE", notification_date: "2026-10-01", title: "C72 mark-all fixture", body: "Synthetic notification", idempotency_key: `c72-all-${randomUUID()}` });
  await page.goto("/notifications?unread=true");
  await expect(page.locator('.filter-pills a[aria-current="page"]')).toHaveText(/Chưa đọc/);
  await page.route("**/*", async r => { if (r.request().method() === "POST" && r.request().headers()["next-action"]) await r.abort("failed"); else await r.continue(); });
  await page.getByRole("button", { name: "Đánh dấu đã đọc", exact: true }).click(); await expect(page.getByText(/Chưa thể xác nhận thao tác/)).toBeVisible(); await page.unroute("**/*");
  let posts = 0;
  await page.route("**/*", async r => { if (r.request().method() === "POST" && r.request().headers()["next-action"]) { posts++; await new Promise(done => setTimeout(done,1200)); } await r.continue(); });
  await page.getByRole("button", { name: "Thử lại", exact: true }).click(); await expect(page.getByRole("button", { name: "Đang đánh dấu đã đọc…" })).toBeDisabled({ timeout: 200 });
  await page.locator(".notification-read-form").evaluate((f: HTMLFormElement) => { f.requestSubmit(); f.requestSubmit(); });
  await expect(page.getByRole("button", { name: "Đã đọc tất cả" })).toBeDisabled(); expect(posts).toBe(1); await page.unroute("**/*");
  await expect(page.getByText("Đã đánh dấu thông báo đã đọc.").first()).toBeVisible();
  await page.getByRole("link", { name: "Tất cả", exact: true }).click(); await expect(page.locator('.filter-pills a[aria-current="page"]')).toHaveText("Tất cả");
  await page.goBack(); await expect(page.locator('.filter-pills a[aria-current="page"]')).toHaveText(/Chưa đọc/);
  await page.goForward(); await expect(page.locator('.filter-pills a[aria-current="page"]')).toHaveText("Tất cả");
  await page.reload(); await expect(page.locator('.filter-pills a[aria-current="page"]')).toHaveCount(1);
});

test("C72 responsive hierarchy and all audited visible targets, light/dark/text zoom", async ({ page }) => {
  test.setTimeout(120000); await login(page); const measurements: unknown[] = [];
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    for (const width of [375,390,768,1024,1440]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of ["/dashboard", "/loans", "/counterparties", "/notifications", "/expenses"]) {
        await page.goto(route); await expect(page.locator(".content-loading")).toHaveCount(0);
        const data = await page.evaluate(() => {
          const controls = [...document.querySelectorAll<HTMLElement>(".edit-details > summary, .filter-pills a, .loan-card-quick-action, .dashboard-custom-trigger")].filter(e => e.getClientRects().length);
          return { visibleControls: controls.length, overflow: document.documentElement.scrollWidth > innerWidth, small: controls.filter(e => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(e => e.className), taskBottom: document.querySelector(".due-list a")?.getBoundingClientRect().bottom };
        });
        expect(data.overflow).toBe(false); expect(data.small).toEqual([]);
        if (route === "/dashboard" && width === 390) {
          const navTop = await page.locator(".mobile-nav-wrap").evaluate(e => e.getBoundingClientRect().top);
          // OWNER prefers the KPI cards before tasks; tasks remain reachable above the sticky nav.
          const firstTask = page.locator(".due-list a").first();
          // Playwright considers a row under the fixed nav visible in the viewport.
          // Center the requested row as a user would scroll, then keep the nav-clearance assertion.
          await firstTask.evaluate(e => e.scrollIntoView({ block: "center" }));
          expect((await firstTask.boundingBox())!.y + (await firstTask.boundingBox())!.height).toBeLessThan(navTop);
        }
        if (process.env.C72_EVIDENCE === "true" && [390,1440].includes(width)) { mkdirSync(out,{recursive:true}); await page.screenshot({ path: resolve(out, `${route.slice(1)}-${width}-${colorScheme}.png`), fullPage: true }); }
        await page.keyboard.press("Tab");
        const target = page.locator(".edit-details > summary:visible, .filter-pills a:visible, .loan-card-quick-action:visible, .dashboard-custom-trigger:visible").first();
        let focusVisible = true;
        if (await target.count()) {
          await target.focus(); await expect(target).toBeFocused();
          focusVisible = await target.evaluate(e => { const s=getComputedStyle(e); return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0 && s.outlineColor !== "rgba(0, 0, 0, 0)"; });
          expect(focusVisible, `${route} ${width} ${colorScheme} keyboard focus`).toBe(true);
        }
        await page.evaluate(() => scrollTo(0,0));
        measurements.push({ route, width, colorScheme, zoom: 100, focusVisible, ...data });
        await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
        const zoom = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, small: [...document.querySelectorAll<HTMLElement>(".edit-details > summary, .filter-pills a, .loan-card-quick-action, .dashboard-custom-trigger")].filter(e => e.getClientRects().length).filter(e => { const r=e.getBoundingClientRect(); return r.width<44 || r.height<44; }).map(e=>e.className) }));
        expect(zoom.overflow, `${route} ${width} ${colorScheme} text200%`).toBe(false); expect(zoom.small).toEqual([]); measurements.push({route,width,colorScheme,zoom:200,...zoom});
        await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
      }
    }
  }
  await page.setViewportSize({ width:640,height:700 }); await page.goto("/loans"); await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (process.env.C72_EVIDENCE === "true") writeFileSync(resolve(out,"geometry.json"),JSON.stringify(measurements,null,2));
});


test("C72 a real local RPC timeout stays unread and can retry after lock release", async ({ page }) => {
  test.skip(process.env.CI === "true", "Requires the named disposable local container; CI retains transport error coverage.");
  test.setTimeout(45000);
  expect(local.API_URL).toBe("http://127.0.0.1:55321");
  await login(page);
  const profile = await admin.from("profiles").select("user_id").eq("username", "c6_owner_e2e").single();
  const id = randomUUID();
  const inserted = await admin.from("notifications").insert({ id, user_id: profile.data!.user_id, type: "LOAN_OVERDUE", notification_date: "2026-10-01", title: "C72 RPC fixture", body: "Synthetic timeout only", idempotency_key: `c72-rpc-${id}` });
  expect(inserted.error).toBeNull();
  await page.goto("/notifications?unread=true");
  const lockProcess = spawn("docker", ["exec", "-i", "supabase_db_QuanLyVayCaNhan-C20-test", "psql", "-U", "postgres", "-d", "postgres", "-At"], { stdio: ["pipe", "pipe", "pipe"] });
  const done = new Promise<void>((resolve, reject) => { lockProcess.on("error", reject); lockProcess.on("exit", code => code === 0 ? resolve() : reject(new Error("Local fixture lock failed"))); });
  const locked = new Promise<void>((resolve, reject) => { lockProcess.stdout.on("data", data => { if (String(data).includes("C72_LOCKED")) resolve(); }); lockProcess.on("error", reject); });
  // A transient row lock, not a schema/function/role change. SELECT readers remain available.
  lockProcess.stdin.end(`begin;\nselect id from public.notifications where id='${id}' for update;\nselect 'C72_LOCKED';\nselect pg_sleep(12);\nrollback;\n`);
  try {
    await locked; await page.getByRole("button", { name: "Đánh dấu đã đọc", exact: true }).click();
    await expect(page.getByText("Chưa thể đánh dấu đã đọc. Hãy thử lại.").first()).toBeVisible();
    const row = await admin.from("notifications").select("read_at").eq("id", id).single(); expect(row.data?.read_at).toBeNull();
    await done; await page.getByRole("button", { name: "Thử lại", exact: true }).click(); await expect(page.getByRole("button", { name: "Đã đọc tất cả" })).toBeDisabled();
  } finally { await done; }
});
