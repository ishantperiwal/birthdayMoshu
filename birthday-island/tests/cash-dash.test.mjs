import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CASH_SITES,CASH_VALUE,dashPhase} from '../cash-dash-state.js';
import {initialWorld,reduceWorld} from '../server/protocol.js';
test('only Ishi starts after the candles, with three seconds to prepare and sixty to collect',()=>{
  const world={...initialWorld(),candles:true};
  assert.equal(reduceWorld(initialWorld(),{type:'cash-start'},'ISHIEE',1000),null);
  assert.equal(reduceWorld(world,{type:'cash-start'},'MOSHIEE',1000),null);
  const next=reduceWorld({...world,holding:true},{type:'cash-start'},'ISHIEE',1000);
  assert.equal(next.holding,false);
  assert.equal(next.cashDash.startAt,4000);assert.equal(next.cashDash.endAt,64000);
  assert.equal(dashPhase(next.cashDash,3999),'countdown');
  assert.equal(dashPhase(next.cashDash,4000),'running');
  assert.equal(dashPhase(next.cashDash,64000),'finished');
  assert.equal(reduceWorld(next,{type:'cash-start'},'ISHIEE',65000),null,'reconnecting or repeated clicks cannot reset earnings');
});
test('only Moshi collects, once per bundle, strictly within the deadline',()=>{
  let world=reduceWorld({...initialWorld(),candles:true},{type:'cash-start'},'ISHIEE',1000);
  const event={type:'cash-pickup',index:0};
  assert.equal(reduceWorld(world,event,'MOSHIEE',3999),null);
  assert.equal(reduceWorld(world,event,'ISHIEE',4000),null);
  world=reduceWorld(world,event,'MOSHIEE',4000);
  assert.deepEqual(world.cashDash.collected,[0]);
  assert.equal(reduceWorld(world,event,'MOSHIEE',5000),null);
  for(const index of [-1,50,NaN,1.2,'1'])assert.equal(reduceWorld(world,{...event,index},'MOSHIEE',5000),null);
  assert.ok(reduceWorld(world,{...event,index:1},'MOSHIEE',63999));
  assert.equal(reduceWorld(world,{...event,index:1},'MOSHIEE',64000),null);
  assert.deepEqual(JSON.parse(JSON.stringify(world)).cashDash,world.cashDash,'round survives persistence without resetting');
});
test('fifty five-euro bundles total 250 and occupy distinct safe inland sites',()=>{
  assert.equal(CASH_SITES.length,50);assert.equal(CASH_VALUE,5);
  assert.equal(CASH_SITES.length*CASH_VALUE,250);
  for(const site of CASH_SITES){
    assert.ok(Math.hypot(site.x/67,site.z/54)<.89);
    assert.equal(CASH_SITES[site.index],site);
    for(const other of CASH_SITES)if(other!==site)assert.ok(Math.hypot(site.x-other.x,site.z-other.z)>=4);
  }
});
