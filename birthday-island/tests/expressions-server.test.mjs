import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {expressionRemaining,cleanExpression} from '../expressions.js';

// Run the real message handler with only the Cloudflare host/storage stubbed.
const workerURL=new URL('../server/worker.js',import.meta.url);
let source=await readFile(workerURL,'utf8');
source=source.replace("import {DurableObject} from 'cloudflare:workers';",'class DurableObject {constructor(ctx){this.ctx=ctx;}}');
source=source.replaceAll("'../control-mode.js'",JSON.stringify(new URL('../control-mode.js',workerURL).href));
source=source.replaceAll("'./protocol.js'",JSON.stringify(new URL('./protocol.js',workerURL).href));
const {IslandRoom}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function roomFixture(){
  let stored=null;
  const ctx={getWebSockets:()=>[],storage:{sql:{exec(query,...args){
    if(query.startsWith('INSERT'))stored=args[0];
    return {toArray:()=>stored?[{data:stored}]:[]};
  }}}};
  const room=new IslandRoom(ctx,{});
  const client=user=>{const messages=[];const ws={send:raw=>messages.push(JSON.parse(raw)),serializeAttachment(){}};
    room.sockets.set(ws,{user,lastSeen:Date.now(),lastPose:0});return {ws,messages};};
  return {room,ctx,male:client('ISHIEE'),female:client('MOSHIEE')};
}

test('gesture events are temporary, validated, rate limited, and cannot spoof the actor',async()=>{
  const {room,male,female}=roomFixture();
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'gesture',value:'invalid'}}));
  assert.equal(female.messages.length,0);
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'gesture',value:'wave',actor:'MOSHIEE'}}));
  assert.equal(female.messages.at(-1).actor,'ISHIEE');assert.equal(female.messages.at(-1).event.value,'wave');
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'gesture',value:'cheer'}}));
  assert.equal(female.messages.length,1);
  await room.webSocketMessage(female.ws,JSON.stringify({type:'event',event:{type:'gesture',value:'cheer'}}));
  assert.equal(male.messages.at(-1).actor,'MOSHIEE');assert.equal(male.messages.at(-1).event.value,'cheer');
  assert.equal(room.data.world.gesture,undefined);
});

test('both players can set their own expression, broadcast and restore it',async()=>{
  const {room,ctx,male,female}=roomFixture();
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'expression',value:'surprised'}}));
  assert.equal(female.messages.at(-1).world.expressions.ISHIEE,'surprised');
  await room.webSocketMessage(female.ws,JSON.stringify({type:'event',event:{type:'expression',value:'happy'}}));
  assert.deepEqual(male.messages.at(-1).world.expressions,{ISHIEE:'surprised',MOSHIEE:'happy'});
  assert.equal(new IslandRoom(ctx,{}).data.world.expressions.ISHIEE,'surprised');
  room.sockets.get(male.ws).lastExpression=0;
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'expression',value:'normal'}}));
  assert.equal(female.messages.at(-1).world.expressions.ISHIEE,'normal');
});
test('expression events reject invalid values and cannot impersonate a partner',async()=>{
  const {room,male,female}=roomFixture();
  for(const value of ['<script>',{},null,3]){
    await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'expression',value}}));
  }
  assert.equal(female.messages.length,0);
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'expression',value:'sad',user:'MOSHIEE',actor:'MOSHIEE'}}));
  assert.equal(room.data.world.expressions.ISHIEE,'sad');
  assert.equal(room.data.world.expressions.MOSHIEE,undefined);
  assert.equal(female.messages.at(-1).actor,'ISHIEE');
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'expression',value:'surprised'}}));
  assert.equal(room.data.world.expressions.ISHIEE,'sad');
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'mood',value:'day'}}));
  assert.equal(room.data.world.mood,'night');
});
test('stored expressions expire and a fresh click can restart the same expression',async()=>{
  const {room,ctx,male}=roomFixture();
  const select=()=>room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'expression',value:'happy'}}));
  await select();const end=room.data.world.expressionUntil.ISHIEE;
  assert.ok(expressionRemaining(end)>3900);
  assert.equal(expressionRemaining(new IslandRoom(ctx,{}).data.world.expressionUntil.ISHIEE,end+1),0);
  room.data.world.expressionUntil.ISHIEE=1;room.sockets.get(male.ws).lastExpression=0;
  await select();assert.ok(room.data.world.expressionUntil.ISHIEE>1);
  assert.equal(cleanExpression('wink'),null);
});
