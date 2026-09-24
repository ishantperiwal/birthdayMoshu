import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanPose,initialWorld,reduceWorld} from '../server/protocol.js';
test('rejects malformed, non-finite and out-of-island poses',()=>{
  assert.equal(cleanPose({position:[NaN,0,0],yaw:0,pitch:0}),null);
  assert.equal(cleanPose({position:[900,0,0],yaw:0,pitch:0}),null);
  assert.equal(cleanPose({position:[0,0,0],yaw:Infinity,pitch:0}),null);
  assert.deepEqual(cleanPose({position:[1,2,3],yaw:0,pitch:10}).pitch,1.5);
});
test('gift collection is idempotent and bounded',()=>{
  const world=reduceWorld(initialWorld(),{type:'gift',index:2},'MOSHIEE');
  assert.deepEqual(world.gifts,[2]);
  assert.equal(reduceWorld(world,{type:'gift',index:2},'ISHIEE'),null);
  assert.equal(reduceWorld(world,{type:'gift',index:10},'ISHIEE'),null);
});
test('hand holding requires two different participants and either can release',()=>{
  let world=reduceWorld(initialWorld(),{type:'hand'},'ISHIEE');
  world=reduceWorld(world,{type:'hand'},'ISHIEE');assert.equal(world.holding,false);
  world=reduceWorld(world,{type:'hand'},'MOSHIEE');assert.equal(world.holding,true);
  world=reduceWorld(world,{type:'hand'},'ISHIEE');assert.equal(world.holding,false);
});
test('candles release hands and cannot be blown twice',()=>{
  const world=reduceWorld({...initialWorld(),holding:true},{type:'candles'},'MOSHIEE');
  assert.equal(world.holding,false);assert.equal(world.candles,true);
  assert.equal(reduceWorld(world,{type:'candles'},'MOSHIEE'),null);
});
test('radio advances once per song, from the current song only',()=>{
  const world=reduceWorld(initialWorld(),{type:'radio',from:0,to:1},'MOSHIEE');
  assert.equal(world.radio,1);
  assert.equal(reduceWorld(world,{type:'radio',from:0,to:1},'ISHIEE'),null);
  assert.equal(reduceWorld(world,{type:'radio',from:1,to:99},'ISHIEE'),null);
  assert.equal(reduceWorld({...world,radio:undefined},{type:'radio',from:0,to:2},'ISHIEE').radio,2);
});
