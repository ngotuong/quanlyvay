/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const out = resolve('../../docs/audit-c62');
test('C62 evidence capture on isolated synthetic database', async ({page, context}) => {
 test.skip(process.env.C62_AUDIT !== 'true', 'Run separately with C62_AUDIT=true; owns isolated setup fixtures.');
 test.setTimeout(120000); mkdirSync(out,{recursive:true});
 const evidence:any={routes:[], observations:{}, timings:[]};
 await context.addCookies([{name:'qlv_privacy_mode',value:'false',url:'http://127.0.0.1:3101'}]);
 await page.goto('/login');
 await page.screenshot({path:out+'/login-desktop.png',fullPage:true});
 await page.getByLabel('Tên đăng nhập').fill('c6_owner_e2e');
 await page.getByLabel('Mật khẩu',{exact:true}).fill('OwnerE2eTemp123');
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await expect(page).toHaveURL(/change-password/);
 await page.getByLabel('Mật khẩu mới',{exact:true}).fill('123456');
 await page.getByLabel('Nhập lại mật khẩu mới').fill('123456');
 await page.getByRole('button',{name:'Lưu mật khẩu mới'}).click();
 await expect(page).toHaveURL(/dashboard/);
 for(const width of [375,390,768,1024,1440]) {
  await page.setViewportSize({width,height:900});
  for(const route of ['/dashboard','/loans','/loans/new','/counterparties','/expenses','/notifications','/account','/settings','/audit']) {
   const start=Date.now();await page.goto(route);await page.locator('#main-content').waitFor();await expect(page.locator('.content-loading')).toHaveCount(0);await page.waitForTimeout(100);
   const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,headings:[...document.querySelectorAll('h1,h2')].map(e=>e.textContent),smallTargets:[...document.querySelectorAll('button,a,input,select,summary')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<44||r.width<44)}).map(e=>({text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,65),height:Math.round(e.getBoundingClientRect().height)}))}));
   evidence.routes.push({width,route,ms:Date.now()-start,...metrics});
   if([390,1440].includes(width))await page.screenshot({path:out+`/${route.slice(1).replaceAll('/','-')}-${width}.png`,fullPage:true});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.goto('/loans');
 const detail=page.locator('a[href^="/loans/"]').filter({hasNotText:'Tạo khoản vay'}).first();await detail.click();
 await expect(page).toHaveURL(/\/loans\/[0-9a-f-]+/);const loanUrl=page.url(); evidence.observations.loanUrl=loanUrl;
 await page.getByRole('button',{name:'Giao dịch',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Ghi giao dịch'});
 await dialog.getByLabel('Số tiền (VND)').fill('1000');
 const start=Date.now();await dialog.getByRole('button',{name:'Ghi nhận',exact:true}).click();
 await expect(dialog.locator('.action-message')).toHaveAttribute('data-success','true');
 evidence.observations.payment={ms:Date.now()-start,dialogOpen:await dialog.isVisible(),message:await dialog.locator('.action-message').innerText(),amount:await dialog.getByLabel('Số tiền (VND)').inputValue()};
 await page.screenshot({path:out+'/payment-success-390.png',fullPage:true});
 await page.keyboard.press('Escape');
 for(const width of [375,390,768,1024,1440]){await page.setViewportSize({width,height:900});await page.goto(loanUrl);await expect(page.locator('.content-loading')).toHaveCount(0);await page.screenshot({path:out+`/loan-detail-${width}.png`,fullPage:true});}
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Giảm gốc',exact:true}).click();
 writeFileSync(out+'/evidence.json',JSON.stringify(evidence,null,2));
 evidence.observations.restructureLabels=await page.getByRole('dialog').filter({visible:true}).innerText();
 await page.keyboard.press('Escape');
 // Observe route pending while RSC requests are delayed, then recovery.
 await page.route('**/*',async route=>{if(route.request().headers()['rsc']==='1')await new Promise(r=>setTimeout(r,1800));await route.continue();});
 for(let i=0;i<3;i++) {await page.goto('/dashboard');const t=Date.now();await page.getByRole('link',{name:'Khoản vay',exact:true}).last().click();await page.waitForTimeout(120);const pending=await page.locator('.global-route-progress').getAttribute('data-visible');await expect(page).toHaveURL(/\/loans/);evidence.timings.push({route:'dashboard→loans',pendingAt120ms:pending,ms:Date.now()-t,delayMs:1800});}
 await page.unroute('**/*');
 await context.setOffline(true);await page.waitForTimeout(200);evidence.observations.offline=await page.locator('body').innerText();await context.setOffline(false);
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:844,height:390});await page.goto(loanUrl);await page.getByRole('button',{name:'Giao dịch',exact:true}).click();await page.screenshot({path:out+'/drawer-landscape-reduced-motion.png',fullPage:true});
 evidence.observations.landscape=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,dialog:document.querySelector('dialog[open]')?.getBoundingClientRect().toJSON()}));
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.goto(loanUrl);await page.getByRole('button',{name:'Giảm gốc',exact:true}).click();
 await page.getByLabel('Ghi chú',{exact:true}).filter({visible:true}).fill('Bản nháp audit');
 let confirms=0;page.on('dialog',async d=>{confirms++;await d.dismiss()});await page.keyboard.press('Escape');
 evidence.observations.dirtyRestructure={confirmations:confirms,open:await page.locator('dialog[open]').count()};
 page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());await page.goto('/dashboard');await expect(page.locator('.content-loading')).toHaveCount(0);await page.getByRole('button',{name:'Thêm',exact:true}).last().click();evidence.observations.mobileMore=await page.locator('dialog[open]').innerText();await page.keyboard.press('Escape');
 await page.goto('/counterparties');await page.locator('summary').filter({hasText:'Chỉnh sửa thông tin'}).first().click();await page.getByLabel('Tên đối tác').last().fill('Bản nháp không lưu');
 page.removeAllListeners('dialog');page.on('dialog',async d=>{confirms++;await d.dismiss()});const beforeCancel=confirms;await page.getByRole('link',{name:'Khoản vay',exact:true}).last().click();await page.waitForTimeout(200);evidence.observations.cancelNavigation={confirmations:confirms-beforeCancel,url:page.url(),progress:await page.locator('.global-route-progress').getAttribute('data-visible')};
 // Clear the dirty draft, then hold a real navigation longer than the progress timeout.
 await page.getByLabel('Tên đối tác').last().fill('Đối tác thông báo E2E');
 page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());await page.goto('/dashboard');await expect(page.locator('.content-loading')).toHaveCount(0);
 await page.route('**/*',async route=>{if(route.request().headers()['rsc']==='1')await new Promise(r=>setTimeout(r,10000));await route.continue()});
 await page.getByRole('link',{name:'Khoản vay',exact:true}).last().click();await page.waitForTimeout(8400);evidence.observations.slowNavigation={url:page.url(),progress:await page.locator('.global-route-progress').getAttribute('data-visible')};await expect(page).toHaveURL(/loans/);await page.unroute('**/*');
 await page.emulateMedia({colorScheme:'dark'});await page.goto('/dashboard');await expect(page.locator('.content-loading')).toHaveCount(0);await page.screenshot({path:out+'/dashboard-dark-390.png',fullPage:true});
 await page.emulateMedia({colorScheme:'light'});await page.setViewportSize({width:640,height:450});await page.goto('/loans');await expect(page.locator('.content-loading')).toHaveCount(0);await page.evaluate(()=>document.documentElement.style.fontSize='200%');evidence.observations.text200={overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};await page.screenshot({path:out+'/loans-text200.png',fullPage:true});
 writeFileSync(out+'/evidence.json' ,JSON.stringify(evidence,null,2));
});
