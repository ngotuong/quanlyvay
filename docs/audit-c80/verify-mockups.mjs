import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { chromium } = createRequire(process.cwd()+'/node_modules/.pnpm/playwright@1.62.1/noop.js')('playwright');
const browser=await chromium.launch({channel:"chrome"});const page=await browser.newPage();const rows=[];const interactions=[];const errors=[];page.on('pageerror',e=>errors.push(e.name));
const out='docs/audit-c80';
for(const variant of ['a','b'])for(const theme of ['light','dark'])for(const width of [375,390,768,1024,1280,1440,1920]){
 await page.setViewportSize({width,height:900});await page.goto(`http://127.0.0.1:3180/compact-${variant}.html?theme=${theme}`);await page.evaluate(()=>document.fonts.ready);
 const info=await page.evaluate(()=>{const b=s=>{const r=document.querySelector(s).getBoundingClientRect();return {y:Math.round(r.y),h:Math.round(r.height)}};return {overflow:document.documentElement.scrollWidth-innerWidth,kpis:b('.kpis'),tasks:b('.task-panel'),visibleH1:document.querySelectorAll('h1').length,clippedKpiAmounts:[...document.querySelectorAll('.kpi .value')].filter(e=>e.scrollWidth>e.clientWidth+1).length,fontLoaded:document.fonts.check('500 14px Inter'),fontFaces:[...document.fonts].filter(x=>x.status==='loaded').length,focusedOutline:null}});
 if(info.overflow>0||info.kpis.y+info.kpis.h>info.tasks.y||info.visibleH1!==1||info.clippedKpiAmounts||!info.fontLoaded||!info.fontFaces)throw Error('Mockup geometry/font failed');rows.push({variant,theme,width,...info});
 if([390,1440].includes(width))await page.screenshot({path:`${out}/compact-${variant}-${width}-${theme}.png`,fullPage:true});
 await page.getByRole('button',{name:'Ẩn số tiền trong mockup',exact:true}).press('Enter');
 if(await page.locator('.bar-chart').count()!==0||await page.locator('.chart-private').count()!==1)throw Error('Hidden chart');
 const hidden=await page.locator('[data-private-money]').allTextContents();if(hidden.some(x=>x!=='—'))throw Error('Hidden money');
 await page.getByRole('button',{name:'Hiển thị số tiền trong mockup',exact:true}).press('Enter');
 const restored=await page.locator('[data-private-money]').allTextContents();if(!restored[0].includes('1.285.000.000'))throw Error('Restore money');
 if(width===390){await page.goto(`http://127.0.0.1:3180/compact-${variant}.html?theme=${theme}&privacy=hidden`);await page.keyboard.press('Tab');const focus=await page.evaluate(()=>({text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle,outlineWidth:getComputedStyle(document.activeElement).outlineWidth}));if(focus.outline==='none')throw Error('No focus');interactions.push({variant,theme,keyboardPrivacy:'PASS',skipFocus:focus});await page.screenshot({path:`${out}/compact-${variant}-390-${theme}-hidden.png`,fullPage:true});}
}
// Temporary synthetic edge states only in a detached headless mockup context, never Production.
for(const variant of ['a','b'])for(const theme of ['light','dark']){
 await page.setViewportSize({width:375,height:900});await page.goto(`http://127.0.0.1:3180/compact-${variant}.html?theme=${theme}`);
 await page.evaluate(()=>{document.querySelector('.task-title').textContent='Khoản mẫu thử tên rất dài để đọc trên màn hình nhỏ. '.repeat(5).slice(0,200);document.querySelector('.task-money').textContent='0 ₫';document.querySelectorAll('.value')[1].textContent='1.284.500 ₫';});
 const edge=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,titleLength:document.querySelector('.task-title').textContent.length,zero:document.querySelector('.task-money').textContent}));if(edge.overflow>0)throw Error('Edge overflow');
 await page.evaluate(()=>{document.querySelectorAll('.task').forEach(e=>e.remove());document.querySelector('.notice').textContent='Chưa có lịch nhắc trong khoảng này.';document.querySelector('.count').textContent='0';});
 const empty=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,tasks:document.querySelectorAll('.task').length,notice:document.querySelector('.notice').textContent}));if(empty.overflow>0||empty.tasks)throw Error('Empty state');interactions.push({variant,theme,edge,empty});
}
for(const variant of ['a','b'])for(const theme of ['light','dark'])for(const width of [375,390,768,1024,1280,1440,1920]){
 await page.setViewportSize({width,height:900});await page.goto(`http://127.0.0.1:3180/loans-${variant}.html?theme=${theme}`);await page.evaluate(()=>document.fonts.ready);
 const info=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,visibleH1:document.querySelectorAll('h1').length,loans:document.querySelectorAll('.demo-loan').length,firstLoanHeight:Math.round(document.querySelector('.demo-loan').getBoundingClientRect().height),fontFaces:[...document.fonts].filter(x=>x.status==='loaded').length}));if(info.overflow>0||info.visibleH1!==1||!info.fontFaces)throw Error('Loan mockup geometry');rows.push({route:'loans',variant,theme,width,...info});
 if([390,1440].includes(width))await page.screenshot({path:`${out}/loans-${variant}-${width}-${theme}.png`,fullPage:true});
 await page.getByRole('button',{name:'Ẩn số tiền trong mockup',exact:true}).press('Enter');const hidden=await page.locator('[data-private-money]').allTextContents();if(hidden.some(x=>x!=='—'))throw Error('Loan privacy');await page.getByRole('button',{name:'Hiển thị số tiền trong mockup',exact:true}).press('Enter');if(!(await page.locator('[data-private-money]').first().textContent()).includes('500.000.000'))throw Error('Loan restore');
 if(width===375){await page.locator('.loan-identity h2').first().evaluate(e=>{e.textContent='Tên khoản mẫu kiểm tra rất dài trên màn nhỏ. '.repeat(6).slice(0,200)});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Loan long name overflow');interactions.push({route:'loans',variant,theme,longNameLength:200,overflow:0});}
}
await page.goto('http://127.0.0.1:3180/proposal.html');await page.setViewportSize({width:1440,height:900});await page.screenshot({path:`${out}/proposal-1440.png`,fullPage:true});
writeFileSync(`${out}/mockup-evidence.json`,JSON.stringify({method:'Headless Chromium, static local HTML, font ready, keyboard Enter/Tab; synthetic values only',matrix:rows,interactions,pageErrorCount:errors.length},null,2));await browser.close();console.log('PASS: 56 mockup width/theme samples; privacy, keyboard, long/zero/empty states; 21 screenshots');
