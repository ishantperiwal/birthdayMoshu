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
test('his bouquet action broadcasts to both viewers and survives a room restart',async()=>{
  const {room,ctx,male,female}=roomFixture();
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'bouquet',shown:true}}));
  assert.equal(male.messages.at(-1).world.bouquet,true);
  assert.equal(female.messages.at(-1).world.bouquet,true);
  assert.equal(female.messages.at(-1).actor,'ISHIEE');
  assert.equal(new IslandRoom(ctx,{}).data.world.bouquet,true);
  // Rapid toggles do not restart the gesture on everyone else's screen.
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'bouquet',shown:false}}));
  assert.equal(room.data.world.bouquet,true);
  room.sockets.get(male.ws).lastBouquet=0;
  await room.webSocketMessage(male.ws,JSON.stringify({type:'event',event:{type:'bouquet',shown:false}}));
  assert.equal(female.messages.at(-1).world.bouquet,false);
});
test('bouquet permission does not grant general world controls or accept spoofing',async()=>{
  const {room,male,female}=roomFixture();
  for(const [client,event] of [[female,{type:'bouquet',shown:true}],[male,{type:'bouquet',shown:'true'}],[male,{type:'hats'}]]){
    await room.webSocketMessage(client.ws,JSON.stringify({type:'event',event}));
  }
  assert.equal(room.data.world.bouquet,false);assert.equal(room.data.world.hats,false);
  assert.equal(female.messages.length,0);
});

const event=(room,client,event)=>room.webSocketMessage(client.ws,JSON.stringify({type:'event',event}));
function offerNearby(f){
  f.room.data.world.bouquet=true;f.room.data.world.bouquetOfferedAt=Date.now()-3000;
  f.room.data.poses={ISHIEE:{position:[0,0,0],lying:false},MOSHIEE:{position:[0,0,2],lying:false}};
}
test('she receives, both viewers see the transfer, and ownership persists',async()=>{
  const f=roomFixture();offerNearby(f);f.room.data.world.holding=true;
  await event(f.room,f.female,{type:'receive-bouquet'});
  assert.equal(f.male.messages.at(-1).world.bouquet,'received');
  assert.equal(f.female.messages.at(-1).world.holding,false);
  assert.equal(new IslandRoom(f.ctx,{}).data.world.bouquet,'received');
  const count=f.female.messages.length;
  await event(f.room,f.female,{type:'receive-bouquet'});
  await event(f.room,f.male,{type:'bouquet',shown:false});
  await event(f.room,f.male,{type:'bouquet',shown:true});
  await event(f.room,f.male,{type:'put-away-bouquet'});
  await event(f.room,f.female,{type:'hand'});
  await event(f.room,f.female,{type:'put-away-bouquet'}); // Wait for receiving to finish.
  assert.equal(f.female.messages.length,count);
  assert.equal(f.room.data.world.bouquet,'received');
  f.room.data.world.bouquetReceivedAt=Date.now()-1500;
  await event(f.room,f.female,{type:'put-away-bouquet'});
  assert.equal(f.male.messages.at(-1).world.bouquet,'stored');
  assert.equal(new IslandRoom(f.ctx,{}).data.world.bouquet,'stored');
  await event(f.room,f.male,{type:'bouquet',shown:true});
  assert.equal(f.room.data.world.bouquet,true);
});
test('receiving requires her, a completed offer, nearby upright partners and live presence',async()=>{
  for(const scenario of ['male','far','vertical','lying','offline','too-soon','hidden','stored']){
    const f=roomFixture();offerNearby(f);
    if(scenario==='far')f.room.data.poses.MOSHIEE.position[2]=8;
    if(scenario==='vertical')f.room.data.poses.MOSHIEE.position[1]=8;
    if(scenario==='lying')f.room.data.poses.ISHIEE.lying=true;
    if(scenario==='offline')f.room.sockets.delete(f.male.ws);
    if(scenario==='too-soon')f.room.data.world.bouquetOfferedAt=Date.now();
    if(scenario==='hidden')f.room.data.world.bouquet=false;
    if(scenario==='stored')f.room.data.world.bouquet='stored';
    const before=f.room.data.world.bouquet;
    await event(f.room,scenario==='male'?f.male:f.female,{type:'receive-bouquet'});
    assert.equal(f.room.data.world.bouquet,before,scenario);
    assert.equal(f.female.messages.length,0,scenario);
  }
});
