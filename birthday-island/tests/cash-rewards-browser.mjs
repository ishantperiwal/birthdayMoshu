import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire('/Users/ishant.p/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text()+' '+m.location().url);});
  await page.route('**/main.js?*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text())+`
window.__cashProbe=()=>({programs:renderer.info.programs.length,lights:(()=>{let n=0;scene.traverseVisible(o=>{if(o.isPointLight)n++;});return n;})()});`});
  });
  await page.goto('http://127.0.0.1:4173/?inspect&view=giftclose');
  await page.waitForFunction(()=>!document.querySelector('#enter').disabled);await page.click('#enter');
  await page.waitForTimeout(1600);
  const before=await page.evaluate(()=>window.__cashProbe());
  await page.evaluate(()=>{window.__rewardFrames=[];let last=performance.now();function frame(now){window.__rewardFrames.push(now-last);last=now;if(window.__rewardFrames.length<110)requestAnimationFrame(frame);}requestAnimationFrame(frame);});
  await page.keyboard.press('KeyE');await page.waitForTimeout(430);
  assert.equal(await page.locator('.cash-flight-layer canvas').count(),1);
  assert.equal(await page.locator('#gift-note').evaluate(e=>e.classList.contains('open')),false);
  await page.screenshot({path:'/tmp/island-cash-flight.png'});
  await page.waitForFunction(()=>document.querySelector('#gift-value').textContent==='₹1,500'&&document.querySelector('#gift-note').classList.contains('open'));
  assert.equal(await page.locator('#gift-count').textContent(),'1 / 10');
  const after=await page.evaluate(()=>window.__cashProbe());
  assert.equal(after.programs,before.programs,'Pickup must not compile new scene shaders');
  assert.equal(after.lights,before.lights,'Pickup must keep the light count stable');
  console.log('Collection render diagnostics:',JSON.stringify({before,after,frames:await page.evaluate(()=>{const a=window.__rewardFrames.slice(1).sort((a,b)=>a-b);return {median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};})}));
  assert.equal(await page.locator('.flying-banknote').count(),0);
  await page.locator('.keep-walking').click();await page.keyboard.press('KeyE');await page.waitForTimeout(150);
  assert.equal(await page.locator('#gift-value').textContent(),'₹1,500');
  await page.screenshot({path:'/tmp/island-cash-wallet.png'});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#enter').disabled);await page.click('#enter');
  await page.waitForTimeout(1600);await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>document.querySelector('#gift-value').textContent==='₹1,500');
  assert.equal(await page.locator('#gift-count').textContent(),'1 / 10');
  await page.locator('.keep-walking').click();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/island-cash-mobile.png'});
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: reward flight, incremental total, delayed note, duplicate protection, reduced motion, and mobile rendering.');
}finally{await browser.close();}
