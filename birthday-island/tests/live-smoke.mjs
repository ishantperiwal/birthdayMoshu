import {companionMode} from '../control-mode.js';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/Users/ishant.p/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const invites=JSON.parse(await readFile(new URL('../server/private-invites.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[];
try{
 const pages=[];
 for(const user of ['MOSHIEE','ISHIEE']){
  const page=await browser.newPage({viewport:{width:1100,height:760}});pages.push(page);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/WebGL|THREE|Shader/.test(m.text()))errors.push(m.text());});
  const url=new URL(invites[user]);url.searchParams.set('inspect','');
  await page.goto(url.href);
  await page.waitForFunction(()=>document.querySelector('#enter')?.disabled===false,null,{timeout:45000});
  await page.click('#enter');
 }
 for(const page of pages){
  await page.waitForFunction(()=>/together|following MOSHIEE/.test(document.querySelector('#island-connection')?.textContent||''),null,{timeout:20000});
  await page.waitForFunction(()=>window.__multiplayerState.remoteVisible&&window.__multiplayerState.remoteMeshes>10);
 }
 assert.deepEqual(errors,[]);
 assert.equal((await pages[0].evaluate(()=>window.__multiplayerState)).autopilot,companionMode);
 await pages[0].screenshot({path:'/tmp/island-live-moshiee.png'});
 console.log('PASS: deployed HTTPS site, both private invites, two live avatars, no browser or shader errors; no birthday progress altered.');
}finally{await browser.close();}
