import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";
import { todayInVietnam } from "../../src/lib/business/format";

const base = "http://127.0.0.1:3101";
const password = readFileSync(resolve(process.cwd(), "test/e2e/global-setup.ts"), "utf8").match(/password: "([^"]+)"/)![1];
const out = resolve(process.cwd(), "../../.cache/c97/after");
const evidence: unknown[] = [];
const local = localSupabaseEnvironment();
const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
let loan = "";
test.beforeAll(async () => {
  test.setTimeout(300000);
  if (process.env.E2E_DATABASE_PREPARED === "true") resetLocalDatabase();
  await globalSetup(); expect(new URL(local.API_URL).port).toBe("55321");
  const signed = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password }); expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signed.data.user!.id)).error).toBeNull();
  const cp = await owner.rpc("create_counterparty", { p_name: "C97 Đối tác giả", p_notes: "Dữ liệu giả loading/motion" }); expect(cp.error).toBeNull();
  const date = new Date(todayInVietnam() + "T00:00:00Z"); date.setUTCDate(date.getUTCDate() - 28);
  const created = await owner.rpc("create_loan_v3", { p_counterparty_id: cp.data, p_name: "C97 Khoản giả", p_direction: "LENDING", p_original_principal_vnd: "1284500000", p_disbursement_date: date.toISOString().slice(0,10), p_term_days: null, p_interest_cycle_days: 30, p_initial_period_rate_percent: 3, p_interest_reminder_offset_days: 0, p_idempotency_key: randomUUID(), p_notes: "Dữ liệu giả" }); expect(created.error).toBeNull(); loan = created.data;
  mkdirSync(out, { recursive: true });
});
test.afterAll(() => writeFileSync(resolve(out, "evidence.json"), JSON.stringify({ method: "Chromium production build, guarded C20-test, simulated delays/viewport; not physical device or 60fps certification", evidence }, null, 2)));
async function login(page: Page) {
  await page.context().clearCookies(); await page.context().addCookies([{name:"qlv_privacy_mode",value:"false",url:base}]);
  await page.goto("/login"); await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e"); await page.getByLabel("Mật khẩu",{exact:true}).fill(password); await page.getByRole("button",{name:"Đăng nhập",exact:true}).click(); await expect(page).toHaveURL(/dashboard/);
}
async function frames(page: Page) { await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done())))); }
async function startShifts(page: Page) {
  await page.evaluate(() => {
    type Shift = { value: number; hadRecentInput: boolean; startTime: number };
    const target = window as unknown as { c97Shifts: Shift[]; c97Observer?: PerformanceObserver };
    target.c97Observer?.disconnect(); target.c97Shifts=[];
    target.c97Observer = new PerformanceObserver(list => { for(const e of list.getEntries()) { const s=e as PerformanceEntry & Shift; target.c97Shifts.push({value:s.value,hadRecentInput:s.hadRecentInput,startTime:s.startTime}); } });
    target.c97Observer.observe({type:"layout-shift"});
  });
}
async function shifts(page: Page) {
  await frames(page);
  return page.evaluate(() => {
    const entries=(window as unknown as {c97Shifts:{value:number;hadRecentInput:boolean;startTime:number}[]}).c97Shifts;
    return { entries, cls: entries.filter(e=>!e.hadRecentInput).reduce((n,e)=>n+e.value,0), recentInputScore:entries.filter(e=>e.hadRecentInput).reduce((n,e)=>n+e.value,0) };
  });
}
async function follow(page: Page, path: string) {
  if (path.startsWith("/loans/")) {
    if (path === "/loans/new") await page.getByRole("link",{name:"Tạo khoản vay",exact:true}).filter({visible:true}).click();
    else await page.locator(`.loan-card[href^="${path}"]`).click();
  } else {
    let link=page.locator(`.app-nav a[href="${path}"]`).filter({visible:true});
    if (!(await link.count())) { await page.getByRole("button",{name:/Thêm/}).click(); link=page.locator(`.mobile-more-sheet[open] a[href="${path}"]`); }
    await link.click();
  }
}

test("C97 route skeletons stream in their own regions and meet measured loading/content budget", async ({page}) => {
  test.setTimeout(300000); await page.emulateMedia({reducedMotion:"reduce"}); await login(page);
  await page.route("**/*",route => route.request().headers()["next-router-prefetch"] ? route.abort("aborted") : route.continue());
  const paths: [string,string][] = [["/dashboard","dashboard"],["/loans","loans"],[`/loans/${loan}`,"loan"],["/loans/new","new-loan"],["/counterparties","counterparties"],["/expenses","expenses"],["/notifications","notifications"],["/audit","audit"],["/settings","settings"]];
  for(const theme of ["light","dark"] as const) for(const width of [375,1280]) for(const [path,screen] of paths) {
    await page.setExtraHTTPHeaders({}); await page.context().addCookies([{name:"qlv_theme",value:theme,url:base}]); await page.emulateMedia({colorScheme:theme}); await page.setViewportSize({width,height:900});
    await page.goto(path.startsWith("/loans/") ? "/loans" : path === "/dashboard" ? "/settings" : "/dashboard"); await expect(page.locator(".content-loading")).toHaveCount(0);
    await page.setExtraHTTPHeaders({"x-e2e-auth-delay-ms":"2000"}); await startShifts(page); const start=Date.now(); await follow(page,path);
    const loading=page.locator(`.content-loading[data-loading-route="${screen}"]`); await expect(loading).toBeVisible();
    await expect(loading).toHaveAttribute("aria-busy","true"); expect(await loading.locator("input,button,a").count()).toBe(0); expect(await loading.locator(".skeleton").first().evaluate(e=>getComputedStyle(e).animationName)).toBe("none");
    if(["dashboard","loans","loan"].includes(screen)) await page.screenshot({path:resolve(out,`loading-${screen}-${width}-${theme}.png`),animations:"disabled"});
    const fallbackGeometry=await loading.evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,children:[...e.querySelector("div[aria-hidden]")!.children].map(n=>{const r=n.getBoundingClientRect();return {class:n.className,y:r.y,height:r.height};})})); await startShifts(page); // The declared region window begins at the painted fallback, excluding the intentional route change.
    await expect(loading).toHaveCount(0); await page.evaluate(()=>document.fonts.ready); const shift=await shifts(page); const metrics=await page.locator("#main-content").evaluate(e=>({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),scroll:scrollY,children:[...e.children].filter(n=>n.getBoundingClientRect().height>0).map(n=>{const r=n.getBoundingClientRect();return {class:n.className,y:r.y,height:r.height}})}));
    evidence.push({task:"route-region",theme,width,height:900,screen,delayMs:2000,elapsedMs:Date.now()-start,fallbackGeometry,shift,metrics}); expect(metrics.overflow).toBe(0); expect(shift.cls).toBeLessThanOrEqual(.1); await expect(page.locator(".navigation-feedback-message")).toHaveCount(0);
    if(["dashboard","loans","loan"].includes(screen))await page.screenshot({path:resolve(out,`content-${screen}-${width}-${theme}.png`),animations:"disabled"});
  }
  await page.setExtraHTTPHeaders({});
});

test("C97 cold streamed auth and delayed self-hosted fonts keep private theme/status",async({browser})=>{
  test.setTimeout(120000);
  for(const theme of ["light","dark"] as const) for(const delay of [2000,10000]) {
    const context=await browser.newContext({viewport:{width:375,height:900},colorScheme:theme,reducedMotion:"reduce"}); await context.addCookies([{name:"qlv_theme",value:theme,url:base}]); const page=await context.newPage();
    await page.route("**/*.woff2",async route=>{await new Promise(done=>setTimeout(done,2000));await route.continue();}); await page.setExtraHTTPHeaders({"x-e2e-auth-delay-ms":String(delay)});
    const nav=page.goto("/login"); const splash=page.locator(".initial-app-loading"); await expect(splash).toBeVisible({timeout:1500}); await expect(page.locator("html")).toHaveAttribute("data-theme",theme); await expect(page.getByText("C97 Khoản giả",{exact:true})).toHaveCount(0); expect(await splash.locator(".initial-app-loading-track > span").evaluate(e=>getComputedStyle(e).animationName)).toBe("none"); await startShifts(page); await nav; await page.evaluate(()=>document.fonts.ready); await expect(page.getByRole("heading",{name:"Đăng nhập an toàn"})).toBeVisible(); const shift=await shifts(page);
    evidence.push({task:"cold-auth-font",theme,delayMs:delay,fontDelayMs:2000,shift,beforeHtmlGuarantee:false}); expect(shift.cls).toBeLessThanOrEqual(.1); await context.close();
  }
});

function task(page: Page) { return page.locator(`.attention-card a[href="/loans/${loan}?transaction=interest"]`); }
function sheet(page: Page) { return page.getByRole("dialog",{name:"Ghi giao dịch",exact:true}); }
async function dismiss(page: Page) { await sheet(page).getByRole("button",{name:"Hủy",exact:true}).click(); await expect(sheet(page)).toBeHidden(); }

test("C97 drawer delayed read, slow error, retry and abort preserve geometry and draft",async({page})=>{
  test.setTimeout(150000); await page.emulateMedia({reducedMotion:"reduce"}); await login(page);
  for(const theme of ["light","dark"] as const) for(const [width,height] of [[375,900],[1280,900],[375,420]]) for(const delay of [2000,10000]) {
    await page.context().addCookies([{name:"qlv_theme",value:theme,url:base}]); await page.setViewportSize({width,height}); await page.goto("/dashboard");
    await page.route("**/payment-context?*",async route=>{await new Promise(done=>setTimeout(done,delay));await route.continue();});
    await task(page).click(); const dialog=sheet(page); await expect(dialog).toBeVisible(); await expect(dialog.getByText("Đang tải số dư…",{exact:true})).toBeVisible(); const before=await dialog.boundingBox(); const cancel=dialog.getByRole("button",{name:"Hủy",exact:true}); await cancel.focus(); await startShifts(page);
    await expect(dialog.getByRole("button",{name:"Ghi nhận",exact:true})).toBeEnabled(); await expect(dialog.getByRole("button",{name:"Hủy",exact:true})).toBeFocused(); const after=await dialog.boundingBox(),shift=await shifts(page); expect(after).toEqual(before); expect(shift.cls).toBeLessThanOrEqual(.1); evidence.push({task:"drawer-read",theme,width,height,delayMs:delay,before,after,shift});
    await page.unroute("**/payment-context?*"); await dismiss(page); await expect(task(page)).toBeFocused();
  }
  await page.setViewportSize({width:375,height:812}); await page.goto("/dashboard"); let fail=true;
  await page.route("**/payment-context?*",async route=>{if(fail){await new Promise(done=>setTimeout(done,2000));await route.abort("failed");}else await route.continue();});
  await task(page).click(); await expect(sheet(page).getByRole("button",{name:"Thử lại",exact:true})).toBeVisible(); await expect(sheet(page).locator("input")).toHaveCount(0); fail=false; await sheet(page).getByRole("button",{name:"Thử lại",exact:true}).click(); await expect(sheet(page).getByRole("button",{name:"Ghi nhận",exact:true})).toBeEnabled();
  const note=sheet(page).getByLabel("Ghi chú",{exact:true}); await note.fill("Giữ bản nháp khi tải lại"); fail=true; await sheet(page).getByLabel("Ngày thanh toán").fill("2026-10-09"); await expect(sheet(page).getByRole("button",{name:"Thử lại",exact:true})).toBeVisible(); await expect(note).toHaveValue("Giữ bản nháp khi tải lại"); await expect(sheet(page).getByRole("button",{name:"Ghi nhận",exact:true})).toBeDisabled();
  page.once("dialog",d=>d.accept()); await dismiss(page); await page.unroute("**/payment-context?*");
  let release!:()=>void; const waiting=new Promise<void>(done=>{release=done;}); await page.route("**/payment-context?*",async route=>{await waiting;try{await route.continue();}catch{}}); await task(page).click(); await expect(sheet(page).getByText("Đang tải số dư…",{exact:true})).toBeVisible(); await dismiss(page); release(); await page.unroute("**/payment-context?*"); await expect(sheet(page)).toHaveCount(0); await expect(task(page)).toBeFocused(); evidence.push({task:"read-error-retry-abort",draftPreserved:true,noStaleReopen:true});
});

test("C97 damped drag, snapback, capture cancel, four prompts and native disclosure semantics",async({page})=>{
  test.setTimeout(60000); await login(page); await page.setViewportSize({width:375,height:812}); await page.emulateMedia({reducedMotion:"no-preference"}); await task(page).click();const dialog=sheet(page);await expect(dialog.getByRole("button",{name:"Ghi nhận",exact:true})).toBeEnabled();await expect(dialog).toHaveCSS("animation-duration","0.22s"); await dialog.evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{})));});
  const grab=dialog.locator(".ui-sheet-grabber");const box=await grab.boundingBox();expect(box).not.toBeNull();const x=box!.x+box!.width/2,y=box!.y+12;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+60,{steps:5});await expect(dialog).toHaveAttribute("data-dragging","true");expect(await dialog.locator(".ui-bottom-sheet-surface").evaluate(e=>getComputedStyle(e).transitionDuration)).toBe("0s");const translate=await dialog.locator(".ui-bottom-sheet-surface").evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m42);expect(translate).toBeGreaterThan(0);expect(translate).toBeLessThan(60);await page.mouse.up();await expect(dialog).not.toHaveAttribute("data-dragging","true");await expect(dialog).toBeVisible();await expect(dialog.locator(".ui-bottom-sheet-surface")).toHaveCSS("transition-duration","0.32s");
  for(const event of ["pointercancel","lostpointercapture"]) { await expect.poll(()=>dialog.locator(".ui-bottom-sheet-surface").evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m42)).toBeLessThan(.1); await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+120,{steps:5});if(event === "lostpointercapture") { await grab.evaluate(e=>e.releasePointerCapture(1)); await page.mouse.move(x,y+121); } else await grab.dispatchEvent(event,{pointerId:1});await page.mouse.up();await expect(dialog).toBeVisible();await expect(dialog).not.toHaveAttribute("data-dragging","true"); }
  await expect.poll(()=>dialog.locator(".ui-bottom-sheet-surface").evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m42)).toBeLessThan(.1);
  await dialog.getByLabel("Ghi chú",{exact:true}).fill("Bản nháp motion");let prompts=0;const reject=async(d:import("@playwright/test").Dialog)=>{prompts++;await d.dismiss();};page.on("dialog",reject);
  await dialog.getByRole("button",{name:"Đóng ghi giao dịch",exact:true}).click();await page.mouse.click(1,1);await page.keyboard.press("Escape");await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+120,{steps:5});await page.mouse.up();expect(prompts).toBe(4);await expect(dialog.getByLabel("Ghi chú",{exact:true})).toHaveValue("Bản nháp motion");page.off("dialog",reject);page.once("dialog",d=>d.accept());await dismiss(page);await expect(task(page)).toBeFocused();
  const details=page.locator(".dashboard-analysis");const summary=details.locator("summary").first();await summary.focus();await page.keyboard.press("Enter");await expect(details).toHaveAttribute("open","");await expect(details.locator(".dashboard-analysis-content")).toBeVisible();await page.keyboard.press("Space");await expect(details).not.toHaveAttribute("open","");await expect(details.locator(".dashboard-analysis-content")).toBeHidden();await expect(summary).toBeFocused();
  await page.emulateMedia({reducedMotion:"reduce"});await task(page).click();await expect(sheet(page).getByRole("button",{name:"Ghi nhận",exact:true})).toBeEnabled();await expect(sheet(page)).toHaveCSS("animation-name","none");await expect(sheet(page).locator(".ui-bottom-sheet-surface")).toHaveCSS("transition-duration","0s");await dismiss(page); evidence.push({task:"motion-gesture-disclosure",damping:translate,snapbackMs:320,prompts,captureCancel:true,reducedMotionStatic:true,nativeKeyboardHidden:true,physicalDeviceFps:"NOT_TESTED"});
});

test("C97 pending blocks drag/dismiss and transport error retains the financial draft",async({page})=>{
  test.setTimeout(60000);await login(page);await page.setViewportSize({width:375,height:420});await task(page).click();const dialog=sheet(page);await expect(dialog.getByRole("button",{name:"Ghi nhận",exact:true})).toBeEnabled();
  await dialog.getByLabel("Số tiền (VND)",{exact:true}).fill("1000");await dialog.getByLabel("Ghi chú",{exact:true}).fill("C97 nháp pending");const before=await admin.from("transactions").select("id",{count:"exact",head:true}).eq("loan_id",loan);expect(before.error).toBeNull();
  let release!:()=>void,entered!:()=>void;const hold=new Promise<void>(done=>{release=done;}),started=new Promise<void>(done=>{entered=done;});
  await page.route("**/*",async route=>{if(route.request().method()==="POST"&&route.request().headers()["next-action"]){entered();await hold;await route.abort("failed");}else await route.continue();});
  await dialog.getByRole("button",{name:"Ghi nhận",exact:true}).click();await started;await expect(dialog.locator("form")).toHaveAttribute("aria-busy","true");await expect(dialog.getByRole("button",{name:"Đang lưu ghi giao dịch",exact:true})).toBeDisabled();
  const grab=await dialog.locator(".ui-sheet-grabber").boundingBox();expect(grab).not.toBeNull();await page.mouse.move(grab!.x+grab!.width/2,grab!.y+12);await page.mouse.down();await page.mouse.move(grab!.x+grab!.width/2,grab!.y+132,{steps:5});await page.mouse.up();await expect(dialog).not.toHaveAttribute("data-dragging","true");await expect(dialog).toBeVisible();await page.keyboard.press("Escape");await expect(dialog).toBeVisible();
  release();await expect(dialog.getByRole("button",{name:"Ghi nhận",exact:true})).toBeEnabled();await expect(dialog.getByLabel("Ghi chú",{exact:true})).toHaveValue("C97 nháp pending");await page.unroute("**/*");const after=await admin.from("transactions").select("id",{count:"exact",head:true}).eq("loan_id",loan);expect(after.error).toBeNull();expect(after.count).toBe(before.count);page.once("dialog",d=>d.accept());await dismiss(page);await expect(task(page)).toBeFocused();evidence.push({task:"pending-gesture-transport-error",viewport:{width:375,height:420},draftPreserved:true,dragBlocked:true,escapeBlocked:true,transactionCountUnchanged:true});
});
