import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import WebSocket from '../server/node_modules/ws/wrapper.mjs';
const vars=Object.fromEntries((await readFile(new URL('../server/.dev.vars',import.meta.url),'utf8')).trim().split('\n').map(l=>l.split('=')));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clients=[];
function connect(user){
 const ws=new WebSocket('ws://127.0.0.1:8787/api/connect?user='+user,['island',vars[user+'_TOKEN']],{origin:'http://127.0.0.1:8787'});
 const messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));ws.on('error',()=>{});
 const beat=setInterval(()=>{if(ws.readyState===1)ws.send('{"type":"ping"}');},4000);beat.unref();ws.on('close',()=>clearInterval(beat));
 const c={ws,messages,send:m=>ws.send(JSON.stringify(m)),async wait(fn){for(let j=0;j<200;j++){const m=messages.find(fn);if(m)return m;await sleep(25);}throw Error('Timed out: '+fn);}};clients.push(c);return c;
}
const pose={time:1,position:[-6,4,-9],yaw:0,pitch:0,moving:false,lying:false};
try{
 const m=connect('MOSHIEE');await m.wait(x=>x.welcome);
 m.send({type:'pose',pose,npc:{...pose,position:[-5,4,-9],holding:true,holdReady:true}});await sleep(100);
 const i=connect('ISHIEE');const welcome=await i.wait(x=>x.welcome);
 assert.equal(welcome.controlMode,'companion');assert.equal(welcome.npc,true);assert.deepEqual(welcome.poses.ISHIEE.position,[-5,4,-9]);
 const duplicate=connect('ISHIEE');await duplicate.wait(x=>x.type==='error');
 m.messages.length=0;
 i.send({type:'pose',pose:{...pose,position:[55,4,20]}});
 i.send({type:'event',event:{type:'mood',value:'day'}});
 i.send({type:'look',look:{time:100,yaw:1.25,pitch:.4,pointing:true}});
 const look=await m.wait(x=>x.type==='look');assert.equal(look.look.pointing,true);assert.equal(look.look.yaw,1.25);
 await sleep(150);assert.ok(!m.messages.some(x=>x.type==='pose'&&x.user==='ISHIEE'));assert.ok(!m.messages.some(x=>x.event?.type==='mood'));
 i.send({type:'event',event:{type:'cheer'}});await m.wait(x=>x.event?.type==='cheer');
 m.send({type:'pose',pose:{...pose,time:200},npc:{...pose,time:200,position:[-4,4.3,-8]}});
 await i.wait(x=>x.type==='pose'&&x.user==='ISHIEE'&&x.pose.position[0]===-4);
 i.ws.close();const offline=await m.wait(x=>x.online?.ISHIEE===false);assert.equal(offline.npc,true);
 console.log('PASS: MOSHIEE always owns movement; ISHIEE can only look/point/cheer; live POV pose is relayed; duplicate protection and uninterrupted autopilot after disconnect.');
}finally{for(const c of clients)c.ws.terminate();await sleep(100);}
