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
try{
 const m=connect('MOSHIEE'),i=connect('ISHIEE');await m.wait(x=>x.welcome);await i.wait(x=>x.welcome);
 i.send({type:'event',actor:'MOSHIEE',event:{type:'chat',text:'  hi\nthere  '}});
 const msg=await m.wait(x=>x.event?.type==='chat');assert.equal(msg.actor,'ISHIEE');assert.equal(msg.event.text,'hi there');
 i.send({type:'event',event:{type:'chat',text:'spam'}});await sleep(150);assert.equal(m.messages.filter(x=>x.event?.type==='chat').length,1);
 m.send({type:'event',event:{type:'chat',text:'♡'.repeat(200)}});const reply=await i.wait(x=>x.actor==='MOSHIEE'&&x.event?.type==='chat');assert.equal(Array.from(reply.event.text).length,140);
 const snapshot=await m.wait(x=>x.welcome);assert.ok(!('chat' in snapshot.world));
 console.log('PASS: both roles, authenticated sender, sanitized text, 140-character limit, rate limit, no chat history in world.');
}finally{for(const c of clients)c.ws.terminate();await sleep(100);}
