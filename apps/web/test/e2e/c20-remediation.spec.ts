import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabaseEnvironment } from "./helpers";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

const local = localSupabaseEnvironment();
const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
let loanId: string;
async function login(page: Page, username = "c6_owner_e2e", password = "123456") {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
});
test.beforeAll(async () => {
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password: "123456" });
  if (signed.error || !signed.data.user) throw new Error("C20 owner fixture unavailable");
  const existing = await admin.from("loans").select("id").eq("name","C20 khoản 9.007.199.254.740.993").maybeSingle();
  if(existing.data) { loanId=existing.data.id; return; }
  const cp = await owner.rpc("create_counterparty", {p_name:"C20 bí mật 9.007.199.254.740.993",p_notes:"C20 ghi chú 9.007.199.254.740.993"});
  if (cp.error) throw cp.error;
  const loan = await owner.rpc("create_loan_v3", {
    p_counterparty_id:cp.data,p_name:"C20 khoản 9.007.199.254.740.993",p_direction:"LENDING",p_original_principal_vnd:"9007199254740993",
    p_disbursement_date:"2026-08-01",p_term_days:null,p_interest_cycle_days:30,p_initial_period_rate_percent:"0",p_interest_reminder_offset_days:0,p_idempotency_key:"c20-qa-loan",p_notes:"C20 ghi chú 9.007.199.254.740.993",
  });
  if (loan.error) throw loan.error; loanId=loan.data;
  const rows = Array.from({length:125},(_,index)=>({user_id:signed.data.user!.id,loan_id:loanId,type:"LOAN_OVERDUE",notification_date:`2026-01-01`,title:`C20 notice ${index}`,body:"9.007.199.254.740.993",read_at:index===0?null:"2026-09-01T00:00:00Z",created_at:new Date(Date.UTC(2026,0,1,0,0,index)).toISOString(),idempotency_key:`c20-notice-${index}`}));
  const notices=await admin.from("notifications").insert(rows); if(notices.error)throw notices.error;
});

test("privacy hides free text and money across routes, reload and pre-hydration", async ({page,context}, info) => {
  await login(page);
  await page.goto(`/loans/${loanId}`);
  await expect(page.getByRole("heading", {name:"C20 khoản 9.007.199.254.740.993"})).toBeVisible();
  await page.getByRole("button",{name:"Ẩn số tiền (Chế độ riêng tư)"}).first().click();
  for(const route of ["/dashboard","/loans","/loans?q=9.007.199.254.740.993",`/loans/${loanId}?tab=overview`,`/loans/${loanId}?tab=interest`,`/loans/${loanId}?tab=history`,`/loans/${loanId}?tab=settings`,"/expenses","/notifications","/audit","/counterparties"]){
    await page.goto(route);
    await expect(page.locator("#main-content h1").first()).toBeAttached();
    await expect(page.locator(".content-loading")).toHaveCount(0);
    await expect(page.getByRole("button",{name:"Hiển thị số tiền"}).first()).toBeVisible();
    expect(await page.locator("#main-content").innerText()).not.toContain("9.007.199.254.740.993");
    // URL metadata is not an accessible name; privacy is presentation, not URL/devtools redaction.
    expect((await page.locator("#main-content").ariaSnapshot()).split("\n").filter(line=>!line.trimStart().startsWith("- /url:")).join("\n")).not.toContain("9.007.199.254.740.993");
    expect(await page.locator('[title*="9.007.199"], [aria-label*="9.007.199"]')).toHaveCount(0);
  }
  const noJs = await context.browser()!.newContext({javaScriptEnabled:false,storageState:await context.storageState()});
  const ssr=await noJs.newPage(); await ssr.goto(`http://127.0.0.1:3101/loans/${loanId}?tab=settings`);
  expect(await ssr.locator("#main-content").innerText()).not.toContain("9.007.199.254.740.993");
  await noJs.close();
  await page.screenshot({path:info.outputPath("privacy.png"),fullPage:true});
  await page.getByRole("button",{name:"Hiển thị số tiền"}).first().click();
  await page.goto(`/loans/${loanId}?tab=settings`);
  await expect(page.getByLabel("Nhãn phân biệt (không bắt buộc)")).toHaveValue("C20 khoản 9.007.199.254.740.993");
});

test("form keeps values on validation/network failure; quick create, caret and unsaved confirmation", async ({page}) => {
  await login(page); await page.goto("/loans/new");
  await page.getByRole("radio",{name:"Cho vay",exact:true}).check();
  const money=page.getByLabel("Số tiền gốc (VND)"); await money.fill("1234567");
  await money.evaluate((input: HTMLInputElement)=>input.setSelectionRange(3,3));
  await page.keyboard.insertText("9");
  await expect(money).toHaveValue("12.934.567");
  expect(await money.evaluate((input:HTMLInputElement)=>input.selectionStart)).toBe(4);
  await money.evaluate(input => { const data=new DataTransfer();data.setData("text","-1000");input.dispatchEvent(new ClipboardEvent("paste",{bubbles:true,cancelable:true,clipboardData:data})); });
  await expect(money).toHaveValue("12.934.567");
  await money.fill("9007199254740993");
  await page.getByRole("button",{name:"Thêm đối tác mới"}).click();
  const dialog=page.getByRole("dialog",{name:"Thêm đối tác mới"});
  await dialog.getByLabel("Tên đối tác mới").fill("C20 quick created");
  await dialog.getByRole("button",{name:"Thêm và chọn"}).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("combobox",{name:"Đối tác",exact:true})).toContainText("C20 quick created");
  await expect(money).toHaveValue("9.007.199.254.740.993");
  await page.getByLabel("Lãi suất mỗi kỳ (%)").fill("101");
  await page.getByLabel("Ghi chú",{exact:true}).fill("C20 retained draft");
  await page.getByRole("button",{name:"Tạo khoản vay",exact:true}).click();
  await expect(page.getByLabel("Lãi suất mỗi kỳ (%)")).toHaveAttribute("aria-invalid","true");
  await expect(page.getByLabel("Lãi suất mỗi kỳ (%)")).toBeFocused();
  await expect(page.getByLabel("Ghi chú",{exact:true})).toHaveValue("C20 retained draft");
  await expect(money).toHaveValue("9.007.199.254.740.993");
  await page.getByLabel("Lãi suất mỗi kỳ (%)").fill("0");
  await page.route("**/loans/new",route=>route.request().method()==="POST"?route.abort("failed"):route.continue());
  await page.getByRole("button",{name:"Tạo khoản vay",exact:true}).click();
  await expect(page.getByText(/Chưa thể xác nhận thao tác/)).toBeVisible();
  await expect(page.getByLabel("Ghi chú",{exact:true})).toHaveValue("C20 retained draft");
  page.once("dialog",dialog=>dialog.dismiss());
  await page.getByRole("link",{name:"Quay lại danh sách"}).click(); await expect(page).toHaveURL(/loans\/new/);
});

test("old unread beyond 100 notices remains reachable and export changes with read state", async ({page,request}) => {
  await login(page); await page.goto("/notifications?page=6");
  await expect(page.getByText("C20 notice 0",{exact:true})).toBeVisible();
  const before=await (await request.get("/api/google-sync/export",{headers:{"x-sync-secret":"e2e-sync-secret"}})).json();
  await page.goto("/notifications?unread=true");
  await page.getByRole("button",{name:/C20 notice 0/}).click(); await expect(page).toHaveURL(new RegExp(loanId));
  const after=await (await request.get(`/api/google-sync/export?cursor=${before.sourceVersion}`,{headers:{"x-sync-secret":"e2e-sync-secret"}})).json();
  expect(after.unchanged).toBe(false); expect(after.sourceVersion).not.toBe(before.sourceVersion);
});

test("account available to all roles, mobile menu Escape/outside and logout", async ({page}) => {
  for(const [username,password] of [["c6_owner_e2e","123456"],["c13_editor_e2e","abcdef"],["c16_viewer_e2e","Viewer123"]]){
    await page.setViewportSize({width:375,height:812}); await login(page,username,password);
    if(page.url().includes("change-password")){
      await page.getByLabel("Mật khẩu mới",{exact:true}).fill("Viewer456");await page.getByLabel("Nhập lại mật khẩu mới").fill("Viewer456");await page.getByRole("button",{name:"Lưu mật khẩu mới"}).click();
    }
    const menu=page.locator(".mobile-more-nav:visible");await menu.locator("summary").click();await page.keyboard.press("Escape");await expect(menu).not.toHaveAttribute("open");
    await menu.locator("summary").click();await page.locator(".mobile-module-title").click();await expect(menu).not.toHaveAttribute("open");
    await menu.locator("summary").click();await menu.getByRole("link",{name:"Tài khoản của tôi"}).click();
    await expect(page.locator(".mobile-module-title")).toContainText("Tài khoản của tôi");await expect(menu).not.toHaveAttribute("open");
    await expect(page.getByRole("link",{name:"Đổi mật khẩu của tôi"})).toBeVisible();
    const previewResponse=await page.request.get(`/api/loans/${loanId}/settlement-preview?date=2026-09-07`);
    expect(previewResponse.status()).toBe(username==="c16_viewer_e2e"?403:200);
    if(username!=="c6_owner_e2e")await expect(page.getByRole("link",{name:"Cài đặt",exact:true})).toHaveCount(0);
    await page.locator("#main-content").getByRole("button",{name:"Đăng xuất"}).click();await expect(page).toHaveURL(/login/);
    await page.goto("/account");await expect(page).toHaveURL(/login/);
  }
});

test("all key routes responsive, keyboard and light/dark visual QA", async ({page},info) => {
  test.setTimeout(180000); await login(page);
  const routes=["/dashboard","/loans","/loans/new",`/loans/${loanId}?tab=overview`,`/loans/${loanId}?tab=interest`,`/loans/${loanId}?tab=history`,`/loans/${loanId}?tab=settings`,"/counterparties","/expenses","/notifications","/account","/settings","/audit"];
  for(const theme of ["light","dark"] as const){
    await page.emulateMedia({colorScheme:theme,reducedMotion:"reduce"});
    for(const width of [375,768,1024,1440]){
      await page.setViewportSize({width,height:900});
      for(const [index,route] of routes.entries()){
        await page.goto(route); await expect(page.locator("#main-content h1").first()).toBeAttached();
        await expect(page.locator(".content-loading")).toHaveCount(0);
        const recovery = page.getByRole("heading",{name:"Chưa thể tải dữ liệu"});
        for(let attempt=0;attempt<3&&await recovery.count();attempt++){
          await page.getByRole("button",{name:"Thử lại",exact:true}).click();
          await expect(page.locator("#main-content h1").first()).toBeAttached();
          await expect(page.locator(".content-loading")).toHaveCount(0);
        }
        await expect(page.getByRole("heading",{name:"Chưa thể tải dữ liệu"})).toHaveCount(0);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`${theme} ${width} ${route}`).toBe(true);
        for (const amount of await page.locator(".dashboard-metric strong, .period-summary-bar strong").all()) {
          expect(await amount.evaluate(element => element.scrollWidth <= element.clientWidth), `unclipped amount: ${theme} ${width} ${route}`).toBe(true);
        }
        if(width===375||width===1440) await page.screenshot({path:info.outputPath(`${theme}-${width}-${index}.png`),fullPage:true});
      }
    }
  }
  await page.setViewportSize({width:812,height:375});await page.goto("/loans/new");await page.addStyleTag({content:"html { font-size: 200% !important; }"});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({path:info.outputPath("landscape-zoom.png"),fullPage:true});
  await page.setViewportSize({width:375,height:375});await page.goto("/loans/new");
  await page.getByLabel("Số tiền gốc (VND)").focus();
  const submit=page.getByRole("button",{name:"Tạo khoản vay",exact:true});await submit.scrollIntoViewIfNeeded();
  const [submitBox,navBox]=await Promise.all([submit.boundingBox(),page.locator(".mobile-nav-wrap").boundingBox()]);
  expect(submitBox!.y+submitBox!.height).toBeLessThanOrEqual(navBox!.y);
  await page.screenshot({path:info.outputPath("keyboard-sized-viewport.png")});
});

test("login CTA at 375x667 and active colors have AA contrast", async ({page},info) => {
  await page.setViewportSize({width:375,height:667});await page.goto("/login");
  const cta=page.getByRole("button",{name:"Đăng nhập",exact:true});await expect(cta).toBeInViewport();
  await expect(page.getByText(/Quên mật khẩu/)).toBeVisible();
  await page.screenshot({path:info.outputPath("login-mobile.png"),fullPage:true});
  await login(page);await page.setViewportSize({width:1440,height:900});await page.goto(`/loans/${loanId}?tab=settings`);
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.getByText("Tất toán khoản vay",{exact:true}).click();
  await expect(page.getByRole("button",{name:"Tất toán toàn bộ",exact:true})).toBeEnabled();
  const checked = new Set<string>();
  for(const theme of ["light","dark"] as const){
    await page.emulateMedia({colorScheme:theme});
    for(const selector of [".primary-button:not(:disabled)",".danger-button:not(:disabled)",".primary-link",".nav-badge"]){
      const controls=page.locator(selector+":visible");
      for(let index=0;index<await controls.count();index++){
        const control=controls.nth(index); checked.add(selector);
        for(const state of ["normal","hover","focus"]){
          await page.mouse.move(0,0); await control.evaluate(element => (element as HTMLElement).blur());
          if(state==="hover")await control.hover(); if(state==="focus")await control.focus();
          await expect.poll(()=>control.evaluate(element=>{
            const style=getComputedStyle(element);const rgb=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number);
            const lum=(color:number[])=>color.map(value=>{const v=value/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
            const a=lum(rgb(style.color)),b=lum(rgb(style.backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
          }),{message:`${theme} ${selector} ${state}`}).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  }
  expect(checked.has(".danger-button:not(:disabled)")).toBe(true);
  await page.goto("/loans");
  const link=page.locator(".primary-link:visible").first();await expect(link).toBeVisible();
  for(const theme of ["light","dark"] as const) {
    await page.emulateMedia({colorScheme:theme});
    for(const state of ["normal","hover","focus"]) {
      await page.mouse.move(0,0); await link.evaluate(element => (element as HTMLElement).blur());
      if(state==="hover")await link.hover();if(state==="focus")await link.focus();
      await expect.poll(()=>link.evaluate(element=>{
        const style=getComputedStyle(element);
        const lum=(color:string)=>color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(value=>{const v=value/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        const a=lum(style.color),b=lum(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      }),{message:`${theme} primary link ${state}`}).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test("counterparty deletion reports success and refuses financial history", async ({page}) => {
  const created=await owner.rpc("create_counterparty",{p_name:"A C20 delete safely",p_notes:null});if(created.error)throw created.error;
  await login(page);await page.goto("/counterparties");
  page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Xóa A C20 delete safely",exact:true}).click();
  await expect(page.getByRole("status").filter({hasText:"Đã xóa đối tác chưa có lịch sử."})).toBeVisible();
  await expect(page.getByRole("heading",{name:"A C20 delete safely",exact:true})).toHaveCount(0);
  // The existing privacy fixture has a real (fake-data) loan history.
  page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Xóa C20 bí mật 9.007.199.254.740.993",exact:true}).click();
  await expect(page.getByText(/Không thể xóa đối tác đã có lịch sử/)).toBeVisible();
  expect((await admin.from("loans").select("id").eq("id",loanId).single()).data?.id).toBe(loanId);
});

test("settlement date preview rejects stale confirmation and can recover", async ({page}) => {
  const cp=await owner.rpc("create_counterparty",{p_name:"A C20 settlement",p_notes:null});if(cp.error)throw cp.error;
  const result=await owner.rpc("create_loan_v3",{p_counterparty_id:cp.data,p_name:"C20 settlement race",p_direction:"LENDING",p_original_principal_vnd:"1000000",p_disbursement_date:"2026-08-01",p_term_days:null,p_interest_cycle_days:30,p_initial_period_rate_percent:"3",p_interest_reminder_offset_days:0,p_idempotency_key:randomUUID(),p_notes:null});if(result.error)throw result.error;
  await login(page);await page.goto(`/loans/${result.data}?tab=settings`);await page.getByText("Tất toán khoản vay",{exact:true}).click();
  const date=page.getByLabel("Ngày tất toán",{exact:true}), preview=page.locator(".settlement-preview");
  await date.fill("2026-07-31");await expect(page.getByText(/Chưa thể tính tất toán/)).toBeVisible();
  await expect(page.getByRole("button",{name:"Tất toán toàn bộ",exact:true})).toBeDisabled();
  await date.fill("2026-08-02");await expect(preview).toContainText("2/8/2026");const first=await preview.innerText();
  await date.fill("2026-08-03");await expect(preview).toContainText("3/8/2026");expect(await preview.innerText()).not.toBe(first);
  await page.getByLabel(/Tôi xác nhận hệ thống/).check();
  const paid=await owner.rpc("record_financial_transaction",{p_loan_id:result.data,p_type:"PRINCIPAL_PAYMENT",p_transaction_date:"2026-08-02",p_amount_vnd:"100000",p_idempotency_key:randomUUID(),p_note:null});if(paid.error)throw paid.error;
  const stale=await owner.rpc("settle_loan_confirmed",{p_loan_id:result.data,p_settlement_date:"2026-08-03",p_idempotency_key:randomUUID(),p_expected_principal:"1000000",p_expected_interest:"3000",p_note:null});expect(stale.error?.code).toBe("PT409");
  await page.getByRole("button",{name:"Tất toán toàn bộ",exact:true}).click();
  await expect(page.getByText(/Số tiền đã thay đổi/)).toBeVisible();
  expect((await admin.from("loans").select("status").eq("id",result.data).single()).data?.status).not.toBe("SETTLED");
  await page.getByRole("button",{name:"Tải lại bảng tất toán"}).click();await expect(preview).toContainText("900.000");
  await expect(page.getByLabel(/Tôi xác nhận hệ thống/)).not.toBeChecked();await page.getByLabel(/Tôi xác nhận hệ thống/).check();
  await page.getByRole("button",{name:"Tất toán toàn bộ",exact:true}).click();
  await expect.poll(async()=>(await admin.from("loans").select("status").eq("id",result.data).single()).data?.status).toBe("SETTLED");
  await page.goto("/loans?status=SETTLED&q=C20+settlement+race");
  const settledCard=page.locator(".loan-card").filter({hasText:"C20 settlement race"});
  await expect(settledCard.getByText("Ngày tất toán",{exact:true})).toBeVisible();
  await expect(settledCard.getByText("3/8/2026",{exact:true})).toBeVisible();
  await expect(settledCard.getByText("Ngày đóng lãi",{exact:true})).toHaveCount(0);
});

test("DB errors differ from missing records, retry recovers and offline is explicit", async ({page,context,request}) => {
  // Fail closed: SQL fault injection is confined to the verified disposable test database.
  const url=new URL(local.API_URL);
  if(!["127.0.0.1","localhost"].includes(url.hostname)||url.port!==(process.env.CI==="true"?"54321":"55321"))throw new Error("Unsafe test target");
  const database=process.env.CI==="true"?"supabase_db_QuanLyVayCaNhan":"supabase_db_QuanLyVayCaNhan-C20-test";
  const sql=(statement:string)=>execFileSync("docker",["exec",database,"psql","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1","-c",statement],{stdio:"pipe"});
  await login(page);
  const anonymousPreview=await request.get(`/api/loans/${loanId}/settlement-preview?date=2026-09-07`);expect(anonymousPreview.status()).toBe(401);
  try{
    sql("revoke execute on function public.get_general_expenses_page(integer,integer) from authenticated;");
    await page.goto("/expenses");await expect(page.getByRole("heading",{name:"Chưa thể tải dữ liệu"})).toBeVisible();
    expect(await page.locator("#main-content").innerText()).not.toMatch(/permission denied|PGRST|postgres/i);
    sql("grant execute on function public.get_general_expenses_page(integer,integer) to authenticated;");
    await page.getByRole("button",{name:"Thử lại",exact:true}).click();await expect(page.getByText("Tổng chi phí",{exact:true})).toBeVisible();
  } finally {sql("grant execute on function public.get_general_expenses_page(integer,integer) to authenticated;");}
  try{
    sql("revoke execute on function public.get_google_sync_snapshot() from service_role;");
    const response=await request.get("/api/google-sync/export",{headers:{"x-sync-secret":"e2e-sync-secret"}});expect(response.status()).toBe(500);expect(await response.text()).not.toContain('"tables"');
  } finally {sql("grant execute on function public.get_google_sync_snapshot() to service_role;");}
  await page.goto(`/loans/${randomUUID()}`);await expect(page.getByRole("heading",{name:"Không tìm thấy nội dung"})).toBeVisible();
  await page.goto("/account");await context.setOffline(true);await expect(page.getByText(/Đang mất kết nối/)).toBeVisible();
  await context.setOffline(false);await expect(page.getByText(/Đang mất kết nối/)).toHaveCount(0);
});

test("large lists, exact text and concurrent export remain complete", async ({page,request}) => {
  test.setTimeout(120000);
  const counterparties=Array.from({length:1005},(_,index)=>({id:randomUUID(),name:`C20 volume ${String(index+1).padStart(4,"0")}`}));
  const cpResult=await admin.from("counterparties").insert(counterparties);if(cpResult.error)throw cpResult.error;
  const expenses=Array.from({length:1005},(_,index)=>({id:randomUUID(),type:"EXPENSE",transaction_date:"2026-01-01",amount_vnd:"1000",note:"C20 volume expense",idempotency_key:`c20-volume-expense-${index}`}));
  const transactions=await admin.from("transactions").insert(expenses);if(transactions.error)throw transactions.error;
  const categories=await admin.from("expenses").insert(expenses.map(row=>({transaction_id:row.id,category:"C20 volume"})));if(categories.error)throw categories.error;
  const reverse=await owner.rpc("reverse_transaction",{p_transaction_id:expenses[0].id,p_reversal_date:"2026-09-07",p_note:"C20 volume reversal",p_idempotency_key:"c20-volume-reverse",p_recalculate_through:"2026-09-07"});if(reverse.error)throw reverse.error;
  const history=await admin.from("transactions").insert(Array.from({length:1005},(_,index)=>({loan_id:loanId,type:"INTEREST_PAYMENT",transaction_date:"2026-08-02",amount_vnd:"1",idempotency_key:`c20-history-${index}`})));if(history.error)throw history.error;
  await login(page);await page.goto("/expenses");
  const total=(await page.getByText("Tổng chi phí",{exact:true}).locator("..").innerText()).replace(/\s/g,"");
  await page.goto("/expenses?page=41");await expect(page.getByText(/Trang 41/)).toBeVisible();expect((await page.getByText("Tổng chi phí",{exact:true}).locator("..").innerText()).replace(/\s/g,"")).toBe(total);
  await page.goto("/counterparties?page=41");await expect(page.getByText(/Trang 41/)).toBeVisible();
  await page.goto("/loans/new");await page.getByLabel("Tìm đối tác").fill("C20 volume 1005");await page.getByRole("combobox",{name:"Đối tác",exact:true}).selectOption({label:"C20 volume 1005"});
  page.once("dialog",dialog=>dialog.accept());await page.goto(`/loans/${loanId}?tab=history&page=41`);await expect(page.getByText("Giải ngân",{exact:true})).toBeVisible();
  const exact=await admin.from("loans").select("original_principal_vnd::text,initial_daily_rate_percent::text").eq("id",loanId).single();expect(exact.data?.original_principal_vnd).toBe("9007199254740993");expect(typeof exact.data?.initial_daily_rate_percent).toBe("string");
  for(let index=0;index<5;index++){
    const [response,mutation]=await Promise.all([
      request.get("/api/google-sync/export",{headers:{"x-sync-secret":"e2e-sync-secret"}}),
      owner.rpc("record_expense",{p_loan_id:null,p_transaction_date:"2026-09-07",p_amount_vnd:"1000",p_category:"C20 concurrent",p_idempotency_key:`c20-concurrent-${index}`,p_note:null}),
    ]);if(mutation.error)throw mutation.error;expect(response.ok()).toBe(true);const data=await response.json();
    const exportedExpenses=new Set(data.tables.expenses.map((row:{transaction_id:string})=>row.transaction_id));
    for(const row of data.tables.transactions) if(row.type==="EXPENSE")expect(exportedExpenses.has(row.id)).toBe(true);
    expect(data.tables.counterparties.length).toBeGreaterThan(1000);expect(data.tables.transactions.length).toBeGreaterThan(2000);
  }
});
