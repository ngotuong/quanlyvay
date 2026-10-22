import { expect, test, type Page, type Locator } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { localSupabaseEnvironment } from "./helpers";

const enabled = process.env.C86_AUDIT === "true";
const out = resolve(process.cwd(), "../../docs/audit-c86");
const cache = resolve(process.cwd(), "../../.cache/c86");
const local = localSupabaseEnvironment();
// Reuse the existing public disposable fixture in memory; never use OWNER credentials.
const password = readFileSync(resolve(process.cwd(), "test/e2e/global-setup.ts"), "utf8").match(/password: "([^"]+)"/)![1];
const matrix: unknown[] = [];
const evidence: Record<string, unknown> = {};
function persist() { writeFileSync(resolve(out, "local-evidence.json"), JSON.stringify({ method: "Synthetic Chrome production build, guarded C20-test API55321/DB55322", matrix, evidence }, null, 2)); }
async function ready(page: Page, route: string) {
  await page.goto(route); await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator(".content-loading")).toHaveCount(0);
}
async function metrics(page: Page) {
  return page.evaluate(() => {
    const visible = (e: Element) => { const r=e.getBoundingClientRect(); return r.width>0 && r.height>0 && getComputedStyle(e).visibility!=="hidden" && !e.closest('details:not([open]) > :not(summary)'); };
    const selectors=["body",".dashboard-metric p",".dashboard-metric strong",".dashboard-preset-control select",".attention-toggle",".advanced-filter-trigger",".loan-card-heading h2",".due-dates",".nav-link",".surface-card"];
    return { width:innerWidth, theme:document.documentElement.dataset.theme, overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
      measurements:selectors.map(selector=>{const e=document.querySelector(selector);if(!e||!visible(e))return {selector,missing:true};const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {selector,width:r.width,height:r.height,top:r.top,font:s.fontSize,weight:s.fontWeight,background:s.backgroundColor,color:s.color,border:s.borderColor};}),
      smallText:[...document.querySelectorAll("main p,main small,main strong,main h2,.nav-link")].filter(visible).map(e=>parseFloat(getComputedStyle(e).fontSize)).filter(n=>n<14),
      fontLoaded:document.fonts.status, h1:[...document.querySelectorAll("h1")].filter(visible).length };
  });
}
test("C86 observation: 36 journeys, visual hierarchy and startup feedback", async ({ page, context }) => {
  test.skip(!enabled,"Opt-in C86 audit; observations do not certify defect-free UX"); test.setTimeout(900000);
  mkdirSync(out,{recursive:true});mkdirSync(cache,{recursive:true});
  const admin=createClient(local.API_URL,local.SECRET_KEY||local.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  const owner=createClient(local.API_URL,local.PUBLISHABLE_KEY||local.ANON_KEY,{auth:{persistSession:false}});
  const sign=await owner.auth.signInWithPassword({email:"c6_owner_e2e@auth.local",password});expect(sign.error).toBeNull();
  expect((await admin.from("profiles").update({must_change_password:false}).eq("user_id",sign.data.user!.id)).error).toBeNull();
  const cp=await owner.rpc("create_counterparty",{p_name:"C86 Đối tác mẫu",p_notes:"Liên hệ giả để audit"});expect(cp.error).toBeNull();
  for(let i=0;i<7;i++) {
    const loan=await owner.rpc("create_loan_v3",{p_counterparty_id:cp.data,p_name:`C86 Khoản mẫu ${i+1}`,p_direction:"LENDING",p_original_principal_vnd:1000000+i*100000,p_disbursement_date:`2026-09-${String(6+i).padStart(2,"0")}`,p_term_days:null,p_interest_cycle_days:30,p_initial_period_rate_percent:3,p_interest_reminder_offset_days:0,p_idempotency_key:randomUUID(),p_notes:"Số liệu giả"});expect(loan.error).toBeNull();
  }
  for(let i=0;i<26;i++)expect((await owner.rpc("record_expense",{p_loan_id:null,p_transaction_date:"2026-10-01",p_amount_vnd:100000+i*1000,p_category:i%2?"Văn phòng":"Vận hành",p_idempotency_key:randomUUID(),p_note:"Chi phí giả"})).error).toBeNull();
  await context.addCookies([{name:"qlv_privacy_mode",value:"false",url:"http://127.0.0.1:3101"},{name:"qlv_theme",value:"system",url:"http://127.0.0.1:3101"}]);
  await ready(page,"/login");await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");await page.getByLabel("Mật khẩu",{exact:true}).fill(password);await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).toHaveURL(/dashboard/);
  page.on("dialog",async d=>{await d.accept();});
  const failures:string[]=[];
  for(const theme of ["light","dark"] as const)for(const width of [375,390,1440]) {
    await context.addCookies([{name:"qlv_theme",value:theme,url:"http://127.0.0.1:3101"}]);await page.emulateMedia({colorScheme:theme});await page.setViewportSize({width,height:900});
    for(const journey of ["loan","task","counterparty","notification","expense","theme"]) {
      let clicks=0,historyActions=0,textEdits=0,autoScrollMoves=0;const steps:string[]=[];const routes:string[]=[];
      const route=journey==="loan"||journey==="theme"?"/loans":journey==="task"?"/dashboard":journey==="counterparty"?"/counterparties":journey==="notification"?"/notifications":"/expenses";
      await ready(page,route);const before=await metrics(page);
      const nav=()=>{const u=new URL(page.url());const next=u.pathname.replace(/\/loans\/[^/]+/,"/loans/:id")+u.search;if(routes.at(-1)!==next)routes.push(next);};nav();
      const click=async(l:Locator,label:string)=>{const y=await page.evaluate(()=>scrollY);await l.click();clicks++;steps.push(label);const after=await page.evaluate(()=>scrollY);if(after!==y)autoScrollMoves++;nav();};
      let status="PASS",error="";
      try {
        if(journey==="loan") {
          await page.getByLabel("Tên khoản vay hoặc đối tác").fill("Khoản thông báo E2E");textEdits++;steps.push("Tìm tên khoản vay");await expect(page).toHaveURL(/q=/);nav();
          await click(page.locator(".loan-card").first(),"Mở khoản vay");await expect(page.getByRole("button",{name:"Giao dịch",exact:true})).toBeVisible();nav();
          await click(page.getByRole("button",{name:"Giao dịch",exact:true}),"Mở giao dịch");await expect(page.locator("dialog[open]")).toBeVisible();await page.locator("dialog[open]").press("Escape");steps.push("Escape hủy");await expect(page.locator("dialog[open]")).toHaveCount(0);
        } else if(journey==="task") {
          await click(page.locator(".attention-card .due-item").first(),"Công việc đến khoản vay");await expect(page.locator("dialog[open]")).toBeVisible();nav();await page.locator("dialog[open]").press("Escape");steps.push("Escape đóng giao dịch");await expect(page.locator("dialog[open]")).toHaveCount(0);await page.goBack({waitUntil:"domcontentloaded"});historyActions++;steps.push("Back về dashboard");await expect(page).toHaveURL(/dashboard/);nav();
        } else if(journey==="counterparty") {
          await page.getByLabel("Tìm tên hoặc ghi chú đối tác").fill("C86 Đối tác mẫu");textEdits++;await click(page.getByRole("button",{name:"Tìm kiếm",exact:true}),"Tìm đối tác");await expect(page).toHaveURL(/q=/);nav();
          const editor=page.locator(".edit-details").first();await click(editor.locator("summary"),"Mở chỉnh sửa");await editor.getByLabel("Tên đối tác").fill("C86 nháp bỏ");textEdits++;steps.push("Nhập nháp, không lưu");await click(editor.locator("summary"),"Đóng và xác nhận bỏ nháp");await expect(editor).not.toHaveAttribute("open","");
        } else if(journey==="notification") {
          await click(page.locator(".filter-pills").getByRole("link",{name:/Chưa đọc/}),"Lọc chưa đọc");await expect(page).toHaveURL(/unread=true/);nav();await page.goBack({waitUntil:"domcontentloaded"});historyActions++;await page.goForward({waitUntil:"domcontentloaded"});historyActions++;steps.push("Back rồi Forward giữ bộ lọc");await expect(page).toHaveURL(/unread=true/);nav();
        } else if(journey==="expense") {
          await click(page.locator(".expense-category-details > summary"),"Mở phân bổ");await expect(page.locator(".expense-category-list")).toBeVisible();await click(page.getByRole("link",{name:"Trang sau",exact:true}),"Cuộn tự động và trang sau");await expect(page).toHaveURL(/page=2/);nav();await page.goBack({waitUntil:"domcontentloaded"});historyActions++;steps.push("Back về trang đầu");await expect(page).toHaveURL(/\/expenses$/);nav();
        } else {
          if(width<1280)await click(page.getByRole("button",{name:"Thêm",exact:true}),"Mở Thêm");await click(page.getByRole("link",{name:"Cài đặt",exact:true}).filter({visible:true}),"Mở Cài đặt");await expect(page.getByRole("radio",{name:theme==="light"?"Tối":"Sáng",exact:true})).toBeVisible();nav();await click(page.getByRole("radio",{name:theme==="light"?"Tối":"Sáng",exact:true}),"Đổi giao diện");await page.goBack({waitUntil:"domcontentloaded"});historyActions++;steps.push("Back về nội dung");await expect(page).toHaveURL(/loans/);nav();
        }
      } catch(e) {status="FAIL";error=String(e).slice(0,900);failures.push(`${width}/${theme}/${journey}`);}
      const after=await metrics(page);matrix.push({journey,width,theme,status,steps,counts:{clicks,historyActions,textEdits,runnerAutoScrollMoves:autoScrollMoves,explicitUserScrolls:"NOT_MEASURED",urlTransitions:routes.length-1},routes,before,after,error});persist();
      if(journey==="task"&&width===390||journey==="loan"&&width===1440)await page.screenshot({path:resolve(out,`${journey}-${width}-${theme}.png`),fullPage:true});
    }
    await context.addCookies([{name:"qlv_theme",value:theme,url:"http://127.0.0.1:3101"}]);
    await ready(page,"/dashboard");await page.screenshot({path:resolve(out,`dashboard-${width}-${theme}.png`),fullPage:true});
  }
  evidence.failures=failures;
  for(const theme of ["light","dark"] as const) {
    const cold=await context.newPage();await cold.setViewportSize({width:390,height:900});await context.addCookies([{name:"qlv_theme",value:theme,url:"http://127.0.0.1:3101"}]);await cold.setExtraHTTPHeaders({"x-e2e-auth-delay-ms":"2000"});const begin=Date.now();const navigation=cold.goto("/dashboard");
    await expect(cold.locator(".initial-app-loading")).toBeVisible({timeout:1500});const fallbackMs=Date.now()-begin;await cold.screenshot({path:resolve(out,`startup-${theme}.png`)});await navigation;await expect(cold.locator(".initial-app-loading")).toHaveCount(0);evidence[`startup-${theme}`]={controlledAuthDelayMs:2000,fallbackVisibleMs:fallbackMs,resolvedMs:Date.now()-begin,postFirstByteOnly:true};persist();await cold.close();
  }
  await ready(page,"/dashboard");await page.route("**/*",async r=>{if(r.request().headers().rsc==="1")await new Promise(done=>setTimeout(done,1800));await r.continue();});
  const next=page.getByRole("link",{name:"Khoản vay",exact:true}).filter({visible:true}).click();await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible","true");evidence.navigationDelayedFeedback=true;await next;await expect(page).toHaveURL(/loans/);await page.unrouteAll({behavior:"wait"});
  await context.addCookies([{name:"qlv_theme",value:"system",url:"http://127.0.0.1:3101"}]);
  await context.storageState({path:resolve(cache,"synthetic-storage.json")});
  if(process.env.C86_EVON==="true") {
    const original=readFileSync("/Users/ngotuong/.codex/skills/evondev-ui-ux/scripts/probe.mjs","utf8");
    expect(original.split("await browser.newContext({").length-1).toBe(3);
    writeFileSync(resolve(cache,"probe.mjs"),original.replaceAll("await browser.newContext({","await browser.newContext({ storageState: process.env.C86_STORAGE_STATE,"));
    const req=createRequire(resolve(process.cwd(),"package.json"));const pw=dirname(createRequire(req.resolve("@playwright/test/package.json")).resolve("playwright/package.json"));
    await Promise.all(["dashboard","loans"].flatMap(route=>[false,true].map(async dark=>{
      const label=`${route}-${dark?"dark":"light"}`;const probeOut=resolve(cache,`evon-${label}`);
      const args=[resolve(cache,"probe.mjs"),`http://127.0.0.1:3101/${route}`,"--pw",pw,"--widths","375,390,768,1024,1280,1440,1920","--wait","300","--out",probeOut];if(dark)args.push("--dark");else args.push("--sweep","1440,375,20");
      const result=await new Promise<{code:number|null;log:string}>((done,reject)=>{const child=spawn(process.execPath,args,{env:{...process.env,C86_STORAGE_STATE:resolve(cache,"synthetic-storage.json")}});let log="";child.stdout.on("data",d=>{log+=d;});child.stderr.on("data",d=>{log+=d;});child.on("error",reject);child.on("close",code=>done({code,log}));});
      writeFileSync(resolve(out,`evon-${label}.txt`),result.log.replaceAll(cache,".cache/c86"));evidence[`evon-${label}`]={exitCode:result.code,rawReport:`.cache/c86/evon-${label}/report.json`};expect(result.code).toBe(0);
    })));
  }
  persist();expect(matrix).toHaveLength(36);expect(failures,"Observation failures retained; diagnose before calling matrix complete").toEqual([]);
});

test("C86 supplement: reconcile probe contrast and keyboard theme",async({page,context})=>{
  test.skip(!enabled,"Opt-in C86 evidence");test.setTimeout(120000);
  mkdirSync(out,{recursive:true});
  const admin=createClient(local.API_URL,local.SECRET_KEY||local.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  const owner=createClient(local.API_URL,local.PUBLISHABLE_KEY||local.ANON_KEY,{auth:{persistSession:false}});
  const sign=await owner.auth.signInWithPassword({email:"c6_owner_e2e@auth.local",password});expect(sign.error).toBeNull();
  expect((await admin.from("profiles").update({must_change_password:false}).eq("user_id",sign.data.user!.id)).error).toBeNull();
  expect((await owner.rpc("record_expense",{p_loan_id:null,p_transaction_date:"2026-10-01",p_amount_vnd:100000,p_category:"C86 tooltip proof",p_idempotency_key:randomUUID(),p_note:"Dữ liệu giả"})).error).toBeNull();
  await context.addCookies([{name:"qlv_privacy_mode",value:"false",url:"http://127.0.0.1:3101"}]);
  await page.goto("/login");await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");await page.getByLabel("Mật khẩu",{exact:true}).fill(password);await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).toHaveURL(/dashboard/);
  const proof:unknown[]=[];
  for(const theme of ["light","dark"] as const){
    await context.addCookies([{name:"qlv_theme",value:theme,url:"http://127.0.0.1:3101"}]);await page.setViewportSize({width:1440,height:900});await ready(page,"/dashboard");
    const tooltip=page.locator('.cash-bar-control').first().locator('.chart-tooltip');
    const before=await tooltip.evaluate(e=>{let opacity=1;for(let n:Element|null=e;n;n=n.parentElement)opacity*=Number(getComputedStyle(n).opacity);return {opacity,color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor};});
    await page.locator('.cash-bar-control').first().hover();await expect(tooltip).toHaveCSS("opacity","1");
    const after=await tooltip.evaluate(e=>({opacity:getComputedStyle(e).opacity,color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor}));
    proof.push({theme,before,after});await page.screenshot({path:resolve(out,`tooltip-${theme}.png`)});
  }
  await ready(page,"/settings");await page.getByRole("radio",{name:"Sáng",exact:true}).check();await page.getByRole("radio",{name:"Sáng",exact:true}).press("ArrowRight");await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.getByRole("radio",{name:"Tối",exact:true}).press("ArrowRight");await expect(page.locator("html")).toHaveAttribute("data-theme","system");
  writeFileSync(resolve(out,"probe-reconciliation.json"),JSON.stringify({proof,keyboardArrowsLightDarkSystem:true,note:"Probe isVisible tests node opacity only; child span inside ancestor tooltip opacity0 produces ratio1 although not painted."},null,2));
});
