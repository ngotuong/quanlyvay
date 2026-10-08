import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { localSupabaseEnvironment, resetLocalDatabase } from "./helpers";
import globalSetup from "./global-setup";

const base="http://127.0.0.1:3101";
const out=resolve(process.cwd(),"../../docs/remediation-c87");
const cache=resolve(process.cwd(),"../../.cache/c87");
const capture=process.env.C87_EVIDENCE==="true";
const password=readFileSync(resolve(process.cwd(),"test/e2e/global-setup.ts"),"utf8").match(/password: "([^"]+)"/)![1];
let owner:SupabaseClient;
let loanId="";
let counterpartyId="";
const evidence:{matrix:unknown[];checks:Record<string,unknown>}={matrix:[],checks:{}};
test.beforeAll(async()=>{
  test.setTimeout(300000);
  if(process.env.E2E_DATABASE_PREPARED==="true")resetLocalDatabase();
  await globalSetup();
  const local=localSupabaseEnvironment();
  owner=createClient(local.API_URL,local.PUBLISHABLE_KEY||local.ANON_KEY,{auth:{persistSession:false}});
  const admin=createClient(local.API_URL,local.SECRET_KEY||local.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  const signed=await owner.auth.signInWithPassword({email:"c6_owner_e2e@auth.local",password});expect(signed.error).toBeNull();
  expect((await admin.from("profiles").update({must_change_password:false}).eq("user_id",signed.data.user!.id)).error).toBeNull();
  const cp=await owner.rpc("create_counterparty",{p_name:"C87 Đối tác mẫu",p_notes:"Số liệu giả để kiểm giao diện"});expect(cp.error).toBeNull();counterpartyId=cp.data;
  for(let i=0;i<7;i++){
    const loan=await owner.rpc("create_loan_v3",{p_counterparty_id:counterpartyId,p_name:`C87 Khoản mẫu ${i+1}`,p_direction:"LENDING",p_original_principal_vnd:i===0?1284500000:1000000,p_disbursement_date:`2026-09-${String(6+i).padStart(2,"0")}`,p_term_days:null,p_interest_cycle_days:30,p_initial_period_rate_percent:3,p_interest_reminder_offset_days:0,p_idempotency_key:randomUUID(),p_notes:"Dữ liệu giả"});expect(loan.error).toBeNull();if(i===0)loanId=loan.data;
  }
  for(let i=0;i<26;i++)expect((await owner.rpc("record_expense",{p_loan_id:null,p_transaction_date:"2026-10-01",p_amount_vnd:100000+i*1000,p_category:i===0?"C".repeat(80):"Vận hành",p_idempotency_key:randomUUID(),p_note:i===0?"N".repeat(500):"Chi phí giả"})).error).toBeNull();
  if(capture){mkdirSync(out,{recursive:true});mkdirSync(cache,{recursive:true});}
});
test.afterAll(()=>{if(capture)writeFileSync(resolve(out,"browser-evidence.json"),JSON.stringify({method:"Chrome local production build, synthetic C20-test API55321/DB55322",...evidence},null,2));});
async function login(page:Page){
  await page.context().addCookies([{name:"qlv_privacy_mode",value:"false",url:base}]);await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("c6_owner_e2e");await page.getByLabel("Mật khẩu",{exact:true}).fill(password);await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).toHaveURL(/dashboard/);
}
async function ready(page:Page,route:string){await page.goto(route);await expect(page.locator("#main-content")).toBeVisible();await expect(page.locator(".content-loading")).toHaveCount(0);}
async function measure(page:Page){
  return page.evaluate(()=>{
    const visible=(e:Element)=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(e).visibility==="hidden")return false;for(let p=e.parentElement;p;p=p.parentElement){if(p instanceof HTMLDetailsElement&&!p.open&&!p.querySelector(":scope>summary")?.contains(e))return false;if(Number(getComputedStyle(p).opacity)===0)return false;}return true;};
    const selectors=[".dashboard-metric p",".dashboard-metric strong",".dashboard-custom-trigger",".attention-toggle",".advanced-filter-trigger",".loan-card-heading h2",".app-sidebar",".mobile-nav-wrap .nav-link",".expense-pagination-top"];
    const clipped=[...document.querySelectorAll<HTMLElement>(".dashboard-primary-metrics strong,.loan-card-values dd,.expense-budget-total,.due-value strong,.expense-card .counterparty-card-heading>strong")].filter(visible).filter(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().width>e.clientWidth+1;});
    return {width:innerWidth,theme:document.documentElement.dataset.theme,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),visibleH1:[...document.querySelectorAll("h1")].filter(visible).length,clippedAmounts:clipped.map(e=>({class:e.className,width:e.clientWidth})),samples:selectors.map(selector=>{const e=[...document.querySelectorAll(selector)].find(visible);if(!e)return {selector,missing:true};const s=getComputedStyle(e),r=e.getBoundingClientRect();return {selector,font:s.fontSize,weight:s.fontWeight,width:r.width,height:r.height,top:r.top,color:s.color,background:s.backgroundColor};})};
  });
}

test("C87 compact header disclosure and early expense pagination preserve state",async({page})=>{
  test.setTimeout(120000);await login(page);
  for(const width of [375,390,1440]){
    await page.setViewportSize({width,height:900});await ready(page,"/dashboard");
    const card=page.locator(".attention-card"),toggle=card.locator(".attention-toggle");const count=Number(await card.locator(".count-badge").innerText());expect(count).toBeGreaterThan(5);
    await expect(toggle).toHaveText("Xem tất cả");await expect(toggle).toHaveAccessibleName(`Xem toàn bộ ${count} việc cần xử lý`);expect(await toggle.evaluate(e=>e.closest(".attention-heading")!==null)).toBe(true);
    const kpis=await page.locator(".dashboard-primary-metrics").boundingBox();const box=await card.boundingBox();expect(kpis!.y+kpis!.height).toBeLessThanOrEqual(box!.y);
    await toggle.focus();const scroll=await page.evaluate(()=>scrollY);await toggle.press("Enter");await expect(card.locator(".due-item")).toHaveCount(count);await expect(toggle).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(scroll);
    await toggle.press("Enter");await expect(card.locator(".due-item")).toHaveCount(5);await expect(toggle).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(scroll);
    const original=await page.locator(".dashboard-primary-metrics strong").allTextContents();
    await page.getByRole("button",{name:"Ẩn số tiền (Chế độ riêng tư)",exact:true}).filter({visible:true}).click();await expect(page.locator(".vnd-number")).toHaveCount(0);
    await page.getByRole("button",{name:"Hiển thị số tiền",exact:true}).filter({visible:true}).click();expect(await page.locator(".dashboard-primary-metrics strong").allTextContents()).toEqual(original);
    await ready(page,"/expenses");const top=page.getByRole("navigation",{name:"Phân trang đầu danh sách chi phí",exact:true});const footer=page.getByRole("navigation",{name:"Phân trang",exact:true});await expect(top).toBeVisible();await expect(footer).toBeVisible();
    const next=top.getByRole("link",{name:/^Trang sau/});const nextBox=await next.boundingBox();expect(nextBox!.y+nextBox!.height).toBeLessThan(900);const before=await page.evaluate(()=>scrollY);await next.click();await expect(page).toHaveURL(/page=2/);await expect(top.locator("p")).toContainText("Trang 2 / 2");await expect(page.locator(".expense-record-list>article")).toHaveCount(1);
    evidence.checks[`early-pagination-${width}`]={beforeScrollY:before,page2:true,afterScrollY:await page.evaluate(()=>scrollY),triggerTop:nextBox!.y};
    await page.goBack();await expect(page).toHaveURL(/\/expenses$/);await expect(page.locator(".expense-record-list>article")).toHaveCount(25);await page.goForward();await expect(page).toHaveURL(/page=2/);
  }
  await ready(page,"/expenses");
  const closedForms=await page.locator(".inline-reversal button").evaluateAll(es=>es.slice(0,8).map(e=>({closedAncestor:!e.closest("details")?.open,painted:e.checkVisibility({contentVisibilityAuto:true}),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
  await page.locator(".inline-reversal>summary").first().click();
  const shown=await page.locator(".inline-reversal[open] button").evaluate(e=>({painted:e.checkVisibility({contentVisibilityAuto:true}),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
  expect(closedForms.every(e=>e.closedAncestor&&!e.painted)).toBe(true);expect(shown.painted).toBe(true);
  mkdirSync(cache,{recursive:true});writeFileSync(resolve(cache,"closed-reversal-proof.json"),JSON.stringify({closedForms,shown},null,2));
});

test("C87 branded first-paint Auth and visible SPA feedback respect theme and cancellation",async({page,browser})=>{
  test.setTimeout(120000);
  for(const theme of ["light","dark"] as const)for(const delay of [2000,10000]){
    const context=await browser.newContext({viewport:{width:390,height:900},colorScheme:theme==="light"?"dark":"light",reducedMotion:"reduce"});await context.addCookies([{name:"qlv_theme",value:theme,url:base}]);const cold=await context.newPage();await cold.setExtraHTTPHeaders({"x-e2e-auth-delay-ms":String(delay)});
    const begin=Date.now();const nav=cold.goto("/login");const splash=cold.locator(".initial-app-loading");await expect(splash).toBeVisible({timeout:1500});await expect(splash.locator("img")).toBeVisible();await expect(splash.getByRole("heading",{name:"Quản Lý Vay",exact:true})).toBeVisible();const feedbackMs=Date.now()-begin;
    expect(await splash.locator(".initial-app-loading-track>span").evaluate(e=>getComputedStyle(e).animationName)).toBe("none");await expect(cold.getByText("C87 Đối tác mẫu",{exact:true})).toHaveCount(0);expect(await cold.locator("html").getAttribute("data-theme")).toBe(theme);
    if(capture&&delay===2000)await cold.screenshot({path:resolve(out,`startup-${theme}.png`)});await nav;
    evidence.checks[`startup-${theme}-${delay}`]={feedbackMs,navigation:await cold.evaluate(()=>{const n=performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;return {ttfbMs:n.responseStart-n.requestStart,responseEndMs:n.responseEnd,domContentLoadedMs:n.domContentLoadedEventEnd};}),beforeHtmlGuarantee:false};await context.close();
  }
  await login(page);
  let delayRsc=true;
  const pendingRoutes=new Set<Promise<void>>();
  await page.route("**/*",r=>{
    const pending=(async()=>{
      if(delayRsc&&r.request().headers().rsc==="1")await new Promise(done=>setTimeout(done,1800));
      await r.continue();
    })();
    pendingRoutes.add(pending);
    return pending.finally(()=>pendingRoutes.delete(pending));
  });
  await page.getByRole("link",{name:"Khoản vay",exact:true}).filter({visible:true}).click();await expect(page.locator(".navigation-feedback-message")).toBeVisible();await expect(page.locator(".global-route-progress")).toHaveAttribute("data-visible","true");await expect(page).toHaveURL(/loans/);await expect(page.locator(".navigation-feedback-message")).toHaveCount(0);
  // Keep interception registered until delayed callbacks finish. Removing it first can
  // auto-continue another in-flight route before its callback calls continue().
  delayRsc=false;
  while(pendingRoutes.size)await Promise.all(pendingRoutes);
  await page.unrouteAll({behavior:"wait"});
  // A dirty cancel must not leave a false loading state.
  await ready(page,"/counterparties?q=C87");const editor=page.locator(".edit-details").first();await editor.locator("summary").click();await editor.getByLabel("Tên đối tác").fill("C87 nháp không lưu");page.once("dialog",d=>d.dismiss());await page.getByRole("link",{name:"Khoản vay",exact:true}).filter({visible:true}).click();await expect(page).toHaveURL(/counterparties/);await expect(page.locator(".navigation-feedback-message")).toHaveCount(0);await expect(editor.getByLabel("Tên đối tác")).toHaveValue("C87 nháp không lưu");page.once("dialog",d=>d.accept());await editor.locator("summary").click();
});

test("C87 evidence: approved B across modules, bigint stress and Evon",async({page})=>{
  test.skip(!capture,"Opt-in C87 rendered evidence");test.setTimeout(900000);await login(page);
  const routes=[["dashboard","/dashboard"],["loans","/loans?q=C87"],["detail",`/loans/${loanId}`],["counterparties","/counterparties?q=C87"],["expenses","/expenses"],["notifications","/notifications"],["settings","/settings"]];
  const failures:unknown[]=[];
  if (process.env.C87_BEFORE === "true") {
    const before = await page.context().newPage();
    // Cookies are scoped to hostname, so the existing fixture login also covers port3190.
    await before.goto("http://127.0.0.1:3190/dashboard");
    await expect(before.locator("#main-content")).toBeVisible();
    for(const theme of ["light","dark"] as const) for(const width of [375,390,1440]) {
      await before.context().addCookies([{name:"qlv_theme",value:theme,url:base}]);
      await before.emulateMedia({colorScheme:theme==="light"?"dark":"light"});
      await before.setViewportSize({width,height:900});
      for(const route of ["dashboard","expenses","loans"]) {
        await before.goto(`http://127.0.0.1:3190/${route}`);
        await expect(before.locator("#main-content")).toBeVisible();
        await expect(before.locator(".content-loading")).toHaveCount(0);
        await before.screenshot({path:resolve(out,`before-${route}-${width}-${theme}.png`),fullPage:true});
      }
    }
    evidence.checks.beforeRender={source:"HEAD9813a6b archived runtime; identical C87 fixture DB/auth/date",port:3190};
    await before.close();
  }
  for(const theme of ["light","dark"] as const)for(const width of [375,390,768,1024,1440]){
    await page.context().addCookies([{name:"qlv_theme",value:theme,url:base}]);await page.emulateMedia({colorScheme:theme==="light"?"dark":"light"});await page.setViewportSize({width,height:900});
    for(const [label,route]of routes){await ready(page,route);
      const description=page.locator(".page-description").first();if(await description.count())await expect(description).toHaveCSS("font-size","16px");
      for(const notification of await page.locator(".notification-main").all())await expect(notification).toHaveCSS("font-size","16px");
      const m=await measure(page);evidence.matrix.push({route:label,...m});if(m.overflow||m.clippedAmounts.length||m.visibleH1!==1)failures.push({route:label,...m});if([375,390,1440].includes(width))await page.screenshot({path:resolve(out,`${label}-${width}-${theme}.png`),fullPage:true});}
  }
  evidence.checks.matrixFailures=failures;
  // Valid bigint boundary, written only to the isolated fixture; amounts remain authoritative.
  expect((await owner.rpc("create_loan_v3",{p_counterparty_id:counterpartyId,p_name:`C87 ${"Tên khoản vay tiếng Việt rất dài ".repeat(7)}`.slice(0,200),p_direction:"LENDING",p_original_principal_vnd:"99999999999999999",p_disbursement_date:"2026-09-01",p_term_days:null,p_interest_cycle_days:30,p_initial_period_rate_percent:3,p_interest_reminder_offset_days:0,p_idempotency_key:randomUUID(),p_notes:"Dữ liệu giả"})).error).toBeNull();
  expect((await owner.rpc("record_expense",{p_loan_id:null,p_transaction_date:"2026-10-01",p_amount_vnd:"99999999999999999",p_category:"C87 VND âm rất lớn",p_idempotency_key:randomUUID(),p_note:"Dữ liệu giả"})).error).toBeNull();
  for(const theme of ["light","dark"] as const)for(const width of [375,390,1440]){
    await page.context().addCookies([{name:"qlv_theme",value:theme,url:base}]);await page.setViewportSize({width,height:900});for(const route of ["/dashboard","/loans?q=C87","/expenses"]){await ready(page,route);const m=await measure(page);evidence.matrix.push({route:`stress${route}`,...m});if(m.overflow||m.clippedAmounts.length)failures.push({route:`stress${route}`,...m});}
    await ready(page,"/dashboard");await page.getByRole("button",{name:"Ẩn số tiền (Chế độ riêng tư)",exact:true}).filter({visible:true}).click();await expect(page.locator(".vnd-number[data-wide]")).toHaveCount(0);await page.getByRole("button",{name:"Hiển thị số tiền",exact:true}).filter({visible:true}).click();
  }
  // Reconcile hidden tooltip descendants and inspect an actually open reversal form.
  for(const theme of ["light","dark"] as const) {
    await page.context().addCookies([{name:"qlv_theme",value:theme,url:base}]);
    await page.setViewportSize({width:1440,height:900});await ready(page,"/dashboard");
    const tooltip=page.locator(".cash-bar-control").first().locator(".chart-tooltip");
    const before=await tooltip.evaluate(e=>{let opacity=1;for(let n:Element|null=e;n;n=n.parentElement)opacity*=Number(getComputedStyle(n).opacity);return {opacity,color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor};});
    await page.locator(".cash-bar-control").first().hover();await expect(tooltip).toHaveCSS("opacity","1");
    const after=await tooltip.evaluate(e=>({opacity:getComputedStyle(e).opacity,color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor}));
    evidence.checks[`tooltip-${theme}`]={before,after};
    await ready(page,"/expenses");await page.locator(".inline-reversal>summary").first().click();
    const button=page.locator(".inline-reversal[open]").getByRole("button",{name:"Xác nhận đảo",exact:true});
    const b=await button.evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);const s=getComputedStyle(e);return {height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width,textHeight:r.getBoundingClientRect().height,lineHeight:parseFloat(s.lineHeight),font:s.fontSize};});
    evidence.checks[`open-reversal-${theme}`]=b;expect(b.textHeight).toBeLessThanOrEqual(b.lineHeight+1);expect(b.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({path:resolve(out,`open-reversal-${theme}.png`)});
  }
  evidence.checks.matrixFailures=failures;
  writeFileSync(resolve(out,"browser-evidence.json"),JSON.stringify(evidence,null,2));
  if(process.env.C87_EVON==="true"){
    // Probe retains the bigint stress fixture; its raw output is reconciled with visible states.
    const original=readFileSync("/Users/ngotuong/.codex/skills/evondev-ui-ux/scripts/probe.mjs","utf8");expect(original.split("await browser.newContext({").length-1).toBe(3);writeFileSync(resolve(cache,"probe.mjs"),original.replaceAll("await browser.newContext({","await browser.newContext({storageState: process.env.C87_STORAGE_STATE,"));
    await page.context().addCookies([{name:"qlv_theme",value:"system",url:base}]);await page.context().storageState({path:resolve(cache,"synthetic-storage.json")});
    const req=createRequire(resolve(process.cwd(),"package.json")),pw=dirname(createRequire(req.resolve("@playwright/test/package.json")).resolve("playwright/package.json"));
    for(const route of ["dashboard","loans","expenses","settings"])for(const dark of [false,true]){
      const label=`${route}-${dark?"dark":"light"}`,args=[resolve(cache,"probe.mjs"),`${base}/${route}`,"--pw",pw,"--widths","375,390,768,1024,1280,1440,1920","--wait","300","--out",resolve(cache,`evon-${label}`)];if(dark)args.push("--dark");else args.push("--sweep","1440,375,20");
      const result=await new Promise<{code:number|null;log:string}>((done,reject)=>{let log="";const c=spawn(process.execPath,args,{env:{...process.env,C87_STORAGE_STATE:resolve(cache,"synthetic-storage.json")}});c.stdout.on("data",d=>log+=d);c.stderr.on("data",d=>log+=d);c.on("error",reject);c.on("close",code=>done({code,log}));});writeFileSync(resolve(out,`evon-${label}.txt`),result.log.replaceAll(cache,".cache/c87"));evidence.checks[`evon-${label}`]={exitCode:result.code};expect(result.code).toBe(0);
    }
  }
  expect(failures,"Rendered geometry failures remain visible in report").toEqual([]);
});
