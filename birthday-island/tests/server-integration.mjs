import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import WebSocket from '../server/node_modules/ws/wrapper.mjs';
const vars=Object.fromEntries((await readFile(new URL('../server/.dev.vars',import.meta.url),'utf8')).trim().split('\n').map(l=>l.split('=')));
const base='ws://127.0.0.1:8787/api/connect';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function connect(user,token=vars[user+'_TOKEN']){
 const ws=new WebSocket(base+'?user='+user,['island',token],{origin:'http://127.0.0.1:8787'});const messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));ws.on('error',()=>{});
 const heartbeat=setInterval(()=>{if(ws.readyState===1)ws.send('{"type":"ping"}');},4000);heartbeat.unref();ws.on('close',()=>clearInterval(heartbeat));
 return {ws,messages,send:m=>ws.send(JSON.stringify(m)),async wait(fn,timeout=5000){const until=Date.now()+timeout;while(Date.now()<until){const found=messages.find(fn);if(found)return found;await sleep(30);}throw Error('Timed out: '+fn);}};
}
const pose={position:[-6,1,-9],yaw:1,pitch:0,moving:true,running:false,lying:false};
const clients=[];
try{
 const invalid=connect('ISHIEE','x'.repeat(43));clients.push(invalid);
 const code=await new Promise(r=>invalid.ws.on('unexpected-response',(_,res)=>{r(res.statusCode);res.resume();invalid.ws.terminate();}));assert.equal(code,403);
 const m=connect('MOSHIEE');clients.push(m);await m.wait(x=>x.welcome);
 m.send({type:'pose',pose,npc:{...pose,position:[-5,1,-9]}});await sleep(100);
 const i=connect('ISHIEE');clients.push(i);const welcome=await i.wait(x=>x.welcome);assert.deepEqual(welcome.poses.ISHIEE.position,[-5,1,-9]);assert.equal(welcome.npc,false);
 const duplicate=connect('ISHIEE');clients.push(duplicate);await duplicate.wait(x=>x.type==='error');
 i.send({type:'pose',pose:{...pose,position:[-4,1,-9]}});await m.wait(x=>x.type==='pose'&&x.user==='ISHIEE'&&x.pose.position[0]===-4);
 m.send({type:'event',event:{type:'mood',value:'sunset'}});await i.wait(x=>x.world?.mood==='sunset');await sleep(120);
 m.send({type:'event',event:{type:'hand'}});await i.wait(x=>x.world?.handRequest==='MOSHIEE');
 i.send({type:'event',event:{type:'hand'}});await m.wait(x=>x.world?.holding===true);
 i.ws.close();await m.wait(x=>x.online?.ISHIEE===false&&x.npc===false);
 m.messages.length=0;await m.wait(x=>x.npc===true,16000);
 m.send({type:'pose',pose,npc:{...pose,position:[-3,1,-8]}});await sleep(120);
 const rejoin=connect('ISHIEE');clients.push(rejoin);const again=await rejoin.wait(x=>x.welcome);assert.deepEqual(again.poses.ISHIEE.position,[-3,1,-8]);assert.equal(again.world.mood,'sunset');assert.equal(again.world.holding,false);
 rejoin.send({type:'event',event:{type:'gift',index:4}});rejoin.send({type:'event',event:{type:'hats'}});rejoin.send({type:'event',event:{type:'candles'}});
 await m.wait(x=>x.world?.gifts.includes(4)&&x.world?.hats&&x.world?.candles);
 console.log('PASS: shared gifts, hats and candles.');
 console.log('PASS: invite authentication, two roles, duplicate rejection, live movement, shared mood, consensual hands, disconnect grace, autopilot position handoff and reconnect.');
}finally{for(const c of clients)c.ws.terminate();await sleep(150);}
