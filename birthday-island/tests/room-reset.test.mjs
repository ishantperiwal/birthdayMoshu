import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Run the real message handler with only the Cloudflare host/storage stubbed.
const workerURL=new URL('../server/worker.js',import.meta.url);
let source=await readFile(workerURL,'utf8');
source=source.replace("import {DurableObject} from 'cloudflare:workers';",'class DurableObject {constructor(ctx){this.ctx=ctx;}}');
// A data: module cannot resolve relative paths, so point every local import at its file.
source=source.replace(/from '(\.\.?\/[^']+)'/g,(_,path)=>'from '+JSON.stringify(new URL(path,workerURL).href));
const {IslandRoom}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

function roomFixture(){
  let stored=null,alarm=null;
  const ctx={getWebSockets:()=>[],storage:{setAlarm:async at=>{alarm=at;},sql:{exec(query,...args){
    if(query.startsWith('INSERT'))stored=args[0];
    return {toArray:()=>stored?[{data:stored}]:[]};
  }}}};
  const room=new IslandRoom(ctx,{});
  const client=user=>{const messages=[];const ws={send:raw=>messages.push(JSON.parse(raw)),serializeAttachment(){},close(){}};
    room.sockets.set(ws,{user,lastSeen:Date.now(),lastPose:0});return {ws,messages};};
  return {room,alarm:()=>alarm,male:client('ISHIEE'),female:client('MOSHIEE')};
}
const played=room=>{room.data.world.candles=true;room.data.world.gifts=[1,2];room.data.poses.MOSHIEE={position:[5,0,5],yaw:0,pitch:0};};

test('//reset from ISHIEE starts the room over and tells both players',async()=>{
  const {room,male,female}=roomFixture();played(room);
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'reset'}}));
  assert.equal(room.data.world.candles,false);assert.deepEqual(room.data.world.gifts,[]);assert.deepEqual(room.data.poses,{});
  assert.equal(female.messages.at(-1).event.type,'reset');
});
test('MOSHIEE cannot reset the room',async()=>{
  const {room,female}=roomFixture();played(room);
  await room.webSocketMessage(female.ws,JSON.stringify({type:'event',event:{type:'reset'}}));
  assert.equal(room.data.world.candles,true);
});
test('an empty room starts over after the grace period, not before',async()=>{
  const {room,male,female}=roomFixture();played(room);
  await room.disconnect(male.ws);await room.disconnect(female.ws);
  await room.alarm();
  assert.equal(room.data.world.candles,true,'a quick reconnect keeps the session');
  for(const user of ['ISHIEE','MOSHIEE'])room.data.away[user]=Date.now()-61000;room.data.saved=Date.now()-61000;
  await room.alarm();
  assert.equal(room.data.world.candles,false);assert.deepEqual(room.data.poses,{});
});
