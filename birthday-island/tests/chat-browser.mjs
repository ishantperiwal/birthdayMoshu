import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/Users/ishant.p/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const vars=Object.fromEntries((await readFile(new URL('../server/.dev.vars',import.meta.url),'utf8')).trim().split('\n').map(l=>l.split('=')));
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const pages=[],errors=[];
 for(const user of ['MOSHIEE','ISHIEE']){
  const context=await browser.newContext({viewport:{width:1000,height:800}}),page=await context.newPage();pages.push(page);
  page.on('pageerror',e=>(errors.push(e.message),console.log(e.stack)));
  await page.route('**/main.js?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`\nwindow.__chats=[];const showChat=chatBubbles.show;chatBubbles.show=(user,text)=>{window.__chats.push({user,text});showChat(user,text);};window.__chatProbe=(user)=>{const b=scene.getObjectByName('chat-'+user);return b?{visible:b.visible,opacity:b.material.opacity,version:b.material.map.version}:null;};window.__chatView=()=>{const b=scene.getObjectByName('chat-ISHIEE');playerRig.rotation.y=Math.atan2(playerRig.position.x-b.position.x,playerRig.position.z-b.position.z);cameraPivot.rotation.x=.22;};window.__chatRange=()=>{const p=companion.anchor.position.clone();companion.anchor.position.copy(playerRig.position).add(new THREE.Vector3(30,0,0));chatBubbles.update();const b=scene.getObjectByName('chat-'+(isIshiee?'MOSHIEE':'ISHIEE'));const hidden=!b.visible;companion.anchor.position.copy(p);chatBubbles.update();return hidden;};`});});
  await page.goto(`http://127.0.0.1:8787/?inspect&view=companion&user=${user}#invite=${vars[user+'_TOKEN']}`);
  await page.waitForFunction(()=>!document.querySelector('#enter').disabled);await page.click('#enter');
 }
 const [m,i]=pages;
 await i.keyboard.press('Slash');assert.equal(await i.locator('#command label').textContent(),'A LITTLE MESSAGE');
 await i.locator('#command-input').fill('hello my sunshine ♡');await i.keyboard.press('Enter');
 await m.waitForFunction(()=>window.__chats.some(x=>x.user==='ISHIEE'&&x.text==='hello my sunshine ♡'));
 await m.waitForTimeout(250);const early=await m.evaluate(()=>window.__chatProbe('ISHIEE'));
 await m.waitForTimeout(500);const later=await m.evaluate(()=>window.__chatProbe('ISHIEE'));assert.ok(later.version>early.version,'typewriter redraws');
 assert.equal(await m.evaluate(()=>window.__chatRange()),true);
 await m.evaluate(()=>window.__chatView());await m.waitForTimeout(200);await m.screenshot({path:'/tmp/island-chat.png'});
 await m.keyboard.press('Slash');await m.locator('#command-input').fill('hello back!');await m.keyboard.press('Enter');
 await i.waitForFunction(()=>window.__chats.some(x=>x.user==='MOSHIEE'&&x.text==='hello back!'));
 await m.keyboard.press('Slash');await m.keyboard.press('Slash');assert.equal(await m.locator('#command label').textContent(),'ISLAND COMMAND');await m.keyboard.press('Escape');
 await m.waitForTimeout(7000);assert.equal((await m.evaluate(()=>window.__chatProbe('ISHIEE'))).visible,false);
 assert.deepEqual(errors,[]);console.log('PASS: two-way chat including passenger, typewriter reveal, distance hiding, expiry, // commands, no browser errors.');
}finally{await browser.close();}
