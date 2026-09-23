import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/Users/ishant.p/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const vars=Object.fromEntries((await readFile(new URL('../server/.dev.vars',import.meta.url),'utf8')).trim().split('\n').map(l=>l.split('=')));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const state=p=>p.evaluate(()=>window.__multiplayerState);
const distance=(a,b)=>Math.hypot(...a.map((v,j)=>v-b[j]));
try{
 const m=await browser.newPage({viewport:{width:1100,height:760}}),i=await browser.newPage({viewport:{width:1100,height:760}});
 for(const [p,user] of [[m,'MOSHIEE'],[i,'ISHIEE']]){
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.sent=[];const WS=window.WebSocket;window.WebSocket=class extends WS{send(d){try{window.sent.push(JSON.parse(d));}catch{}return super.send(d);}};});
  await p.goto('http://127.0.0.1:8787/?inspect&user='+user+'#invite='+vars[user+'_TOKEN']);
  await p.waitForFunction(()=>document.querySelector('#enter')?.disabled===false,null,{timeout:45000});await p.click('#enter');
 }
 await i.waitForFunction(()=>window.__multiplayerState.ownPose);
 await sleep(1200);
 assert.equal((await state(m)).autopilot,true);assert.equal((await state(i)).passenger,true);
 assert.ok(!await i.evaluate(()=>window.sent.some(m=>m.type==='pose')));
 const before=(await state(m)).remote.position;
 await i.keyboard.down('KeyW');await sleep(700);await i.keyboard.up('KeyW');
 assert.ok(distance(before,(await state(m)).remote.position)<.08,'ISHIEE cannot move the companion');
 await i.keyboard.press('Digit1');await i.keyboard.press('KeyF');await i.keyboard.press('KeyE');
 assert.ok(!await i.evaluate(()=>window.sent.some(m=>m.type==='event'&&['mood','fireworks','gift','candles'].includes(m.event.type))));
 await i.locator('#world canvas').click();await i.waitForFunction(()=>!!document.pointerLockElement);
 const yawBefore=(await state(i)).player.yaw;
 await i.evaluate(()=>window.dispatchEvent(new MouseEvent('mousemove',{movementX:180,movementY:-100})));
 await i.keyboard.down('KeyR');await m.waitForFunction(()=>window.__multiplayerState.gesture.pointing);
 assert.notEqual((await state(i)).player.yaw,yawBefore);
 await m.locator('#world canvas').click();await m.waitForFunction(()=>!!document.pointerLockElement);
 await m.evaluate(()=>{const s=window.__multiplayerState,dx=s.remote.position[0]-s.player.position[0],dz=s.remote.position[2]-s.player.position[2];const yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(s.remote.position[1]+1.3-s.player.position[1]-1.86,Math.hypot(dx,dz));window.dispatchEvent(new MouseEvent('mousemove',{movementX:(s.player.yaw-yaw)/.0022,movementY:(s.player.pitch-pitch)/.0018}));});
 await i.locator('#world canvas').click();await i.keyboard.down('KeyR');await m.waitForFunction(()=>window.__multiplayerState.gesture.pointBlend>.8);
 await m.screenshot({path:'/tmp/island-companion-pointing.png'});
 await i.keyboard.up('KeyR');await m.waitForFunction(()=>!window.__multiplayerState.gesture.pointing);
 const ground=(await state(m)).remote.position[1];
 await i.keyboard.press('Space');await m.waitForFunction(()=>window.__multiplayerState.gesture.jumping);
 const heights=[];for(let j=0;j<10;j++){heights.push((await state(m)).remote.position[1]);await sleep(100);}
 assert.ok(Math.max(...heights)>ground+.15,'Cheer visibly hops');
 await m.waitForFunction(()=>!window.__multiplayerState.gesture.jumping);
 await m.keyboard.press('KeyH');await m.waitForFunction(()=>window.__multiplayerState.holding);
 await i.waitForFunction(()=>window.__multiplayerState.ownPose.holding);
 await m.keyboard.press('KeyH');await m.waitForFunction(()=>!window.__multiplayerState.holding);
 const old=(await state(i)).ownPose.position;
 await m.keyboard.down('KeyW');await sleep(1600);await m.keyboard.up('KeyW');await sleep(1200);
 assert.ok(distance(old,(await state(i)).ownPose.position)>.2,'Viewer rides the original follow movement');
 await m.keyboard.press('Slash');await m.locator('#command-input').fill('stargaze');await m.locator('#command-input').press('Enter');
 await i.waitForFunction(()=>window.__multiplayerState.ownPose.lying);
 await sleep(500);
 await i.screenshot({path:'/tmp/island-companion-view-stargazing.png'});
 await m.keyboard.press('KeyQ');await i.waitForFunction(()=>!window.__multiplayerState.ownPose.lying);
 await i.close();await m.waitForFunction(()=>!window.__multiplayerState.online.ISHIEE);
 assert.equal((await state(m)).autopilot,true);
 assert.deepEqual(errors,[]);
 console.log('PASS: no ISHIEE walking or world controls; free mouse look; visible point and cheer; original hand holding/following; camera rides along and follows stargazing; autopilot continues after viewer leaves; no browser errors.');
}finally{await browser.close();}
