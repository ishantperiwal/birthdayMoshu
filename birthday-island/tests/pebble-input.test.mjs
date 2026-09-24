import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {throwPower} from '../skipping-physics.js';
const source=await readFile(new URL('../stone-skipping.js',import.meta.url),'utf8');
const chargeFunctions=source.slice(source.indexOf('  function startCharge'),source.indexOf('  function distanceAt'));
const handlers=source.slice(source.indexOf('    pointerDown(e,player)'),source.indexOf('    update(dt,player,elapsed)'));
function fixture(){
  const env={throwPower,throws:[],distance:2,looking:true};
  const api=runInNewContext(`(()=>{
    let active=false,equipped=false,flight=null,wait=0,opponentPending=false,charge=-1,chargeSource=null,time=0;
    const root={position:{distanceTo:()=>distance}},held={updateWorldMatrix(){}};
    const pickup={reach:4.5,available:()=>looking&&!equipped&&!flight&&!opponentPending&&wait<=0,action(){active=true;equipped=true;}};
    function launch(power){throws.push(power);flight={};equipped=false;charge=-1;}
    function leave(){active=false;equipped=false;charge=-1;chargeSource=null;}
    ${chargeFunctions}
    return {${handlers}setTime(t){time=t;},get equipped(){return equipped;},get charging(){return charge>=0;}};
  })()`,env);
  const mouse={button:0,preventDefault(){}},space={code:'Space',preventDefault(){}};
  return {api,env,mouse,space};
}
test('pickup click does not throw; subsequent hold and release uses charged power',()=>{
  const f=fixture();f.api.pointerDown(f.mouse,{});f.api.pointerUp(f.mouse);
  assert.equal(f.api.equipped,true);assert.equal(f.env.throws.length,0);
  f.api.setTime(2);f.api.pointerDown(f.mouse,{});f.api.setTime(2.6);f.api.pointerUp(f.mouse);
  assert.equal(f.env.throws.length,1);assert.ok(Math.abs(f.env.throws[0]-throwPower(.6))<1e-10);
});
test('pickup requires looking toward nearby pebbles and ignores right click',()=>{
  const f=fixture();f.env.distance=5;assert.equal(f.api.pointerDown(f.mouse,{}),false);
  f.env.distance=2;f.env.looking=false;assert.equal(f.api.pointerDown(f.mouse,{}),false);
  f.env.looking=true;assert.equal(f.api.pointerDown({...f.mouse,button:2},{}),false);
});
test('mouse and keyboard releases cannot fire each other’s charge',()=>{
  const f=fixture();f.api.pointerDown(f.mouse,{});f.api.pointerUp(f.mouse);
  f.api.pointerDown(f.mouse,{});f.api.keyUp(f.space);assert.equal(f.env.throws.length,0);
  f.api.cancelCharge();f.api.keyDown(f.space);f.api.pointerUp(f.mouse);assert.equal(f.env.throws.length,0);
  f.api.setTime(.6);f.api.keyUp(f.space);assert.equal(f.env.throws.length,1);
});
test('focus cancellation and Escape do not release an accidental throw',()=>{
  const f=fixture();f.api.pointerDown(f.mouse,{});f.api.pointerUp(f.mouse);
  f.api.pointerDown(f.mouse,{});f.api.cancelCharge();f.api.pointerUp(f.mouse);
  assert.equal(f.env.throws.length,0);
  f.api.pointerDown(f.mouse,{});f.api.keyDown({code:'Escape'});f.api.pointerUp(f.mouse);
  assert.equal(f.env.throws.length,0);assert.equal(f.api.equipped,false);
});
