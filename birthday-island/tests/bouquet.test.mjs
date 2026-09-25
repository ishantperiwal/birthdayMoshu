import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bouquetPose,receivedBouquetPose,bouquetState} from '../bouquet-motion.js';
import {initialWorld,reduceWorld} from '../server/protocol.js';

test('flowers scale up while the arm lifts forward in under a second',()=>{
  assert.equal(bouquetPose(0,true).visible,false);
  assert.equal(bouquetPose(.10,true).visible,false);
  for(let t=0;t<=.85;t+=.01)assert.ok(bouquetPose(t,true).x>=0);
  assert.ok(bouquetPose(.3,true).scale>0&&bouquetPose(.3,true).scale<1);
  assert.equal(bouquetPose(.85,true).scale,1);
  assert.equal(bouquetPose(.85,true).x,1.28);
});
test('putting away lowers and shrinks the flowers without reaching behind',()=>{
  assert.equal(bouquetPose(0,false).visible,true);
  assert.ok(bouquetPose(.4,false).x<1.28&&bouquetPose(.4,false).x>=0);
  assert.equal(bouquetPose(.8,false).visible,false);
  assert.equal(bouquetPose(.85,false).active,false);
});
test('only his player can change bouquet state, with strict boolean input',()=>{
  const world=initialWorld();
  assert.equal(reduceWorld(world,{type:'bouquet',shown:true},'MOSHIEE'),null);
  assert.equal(reduceWorld(world,{type:'bouquet',shown:'yes'},'ISHIEE'),null);
  const next=reduceWorld(world,{type:'bouquet',shown:true},'ISHIEE');
  assert.equal(next.bouquet,true);assert.equal(world.bouquet,false);
  assert.equal(reduceWorld(next,{type:'bouquet',shown:true},'ISHIEE'),null);
  assert.equal(reduceWorld(next,{type:'bouquet',shown:false},'ISHIEE').bouquet,false);
  assert.equal(JSON.parse(JSON.stringify(next)).bouquet,true);
});

test('received bouquet lowers before disappearing and legacy snapshots normalize safely',()=>{
  assert.equal(bouquetState(true),'offered');assert.equal(bouquetState(undefined),'hidden');
  assert.equal(bouquetState('received'),'received');assert.equal(bouquetState('stored'),'stored');
  assert.equal(receivedBouquetPose(2,true).visible,true);
  assert.ok(receivedBouquetPose(.7,false).x<receivedBouquetPose(0,false).x);
  assert.equal(receivedBouquetPose(.7,false).visible,true);
  assert.equal(receivedBouquetPose(1,false).visible,false);
  assert.equal(receivedBouquetPose(1.2,false).active,false);
});

test('seen from outside she holds the received bouquet lower than in her own view',()=>{
  const own=receivedBouquetPose(2,true),outside=receivedBouquetPose(2,true,true);
  assert.ok(outside.x<own.x-.5);assert.ok(outside.x>.4);
  // Both start from the same outstretched receiving hand.
  assert.equal(receivedBouquetPose(0,true,true).x,receivedBouquetPose(0,true).x);
  assert.ok(receivedBouquetPose(.7,false,true).x<receivedBouquetPose(0,false,true).x);
});
