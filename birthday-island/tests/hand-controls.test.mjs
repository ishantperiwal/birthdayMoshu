import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source=await readFile(new URL('../main.js',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('function handsLinked()'),source.indexOf('const povClaspPosition='));
const keys=source.split('\n').filter(l=>l.includes("if(e.code==='KeyE'&&nearest")||l.includes("if(e.code==='KeyH'&&!e.repeat")).join('\n');
function fixture(){
  let handCalls=0,otherCalls=0;
  const env={companion:{holding:false,throwing:false,bouquetActive:false,anchor:{visible:true,position:{distanceTo:()=>2}}},network:null,isPassenger:false,bouquetControls:{},stargazing:{},stoneSkipping:{},avatar:{},playerRig:{position:{}},handInteraction:{reach:3.7,action(){handCalls++;}},nearest:null};
  const api=runInNewContext(`(()=>{${helpers}return {available:canHoldHands,key(e){${keys}}};})()`,env);
  return {env,api,get handCalls(){return handCalls;},get otherCalls(){return otherCalls;},other:{action(){otherCalls++;}}};
}
test('E only interacts with objects; H alone toggles hands',()=>{
  const f=fixture();f.env.nearest=f.env.handInteraction;f.api.key({code:'KeyE'});assert.equal(f.handCalls,0);
  f.env.nearest=f.other;f.api.key({code:'KeyE'});assert.equal(f.otherCalls,1);
  f.api.key({code:'KeyH'});assert.equal(f.handCalls,1);f.api.key({code:'KeyH',repeat:true});assert.equal(f.handCalls,1);
});
test('occupied hands hide the prompt and block new hand holding',()=>{
  for(const [owner,key] of [['avatar','bouquetActive'],['companion','bouquetActive'],['companion','throwing'],['stoneSkipping','active'],['bouquetControls','received']]){
    const f=fixture();f.env[owner][key]=true;assert.equal(f.api.available(),false);
    f.api.key({code:'KeyH'});assert.equal(f.handCalls,0);
  }
});
test('H can always release an existing clasp even if an item was just picked up',()=>{
  const f=fixture();f.env.companion.holding=true;f.env.stoneSkipping.active=true;
  assert.equal(f.api.available(),false);f.api.key({code:'KeyH'});assert.equal(f.handCalls,1);
});
