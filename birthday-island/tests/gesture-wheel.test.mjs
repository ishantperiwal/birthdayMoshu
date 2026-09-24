import {test} from 'node:test';
import assert from 'node:assert/strict';
import {wheelSelection,WHEEL_ACTIONS,buildGestureWheel} from '../gesture-wheel.js';

test('center cancels and each directional sector selects its intended action',()=>{
  assert.equal(wheelSelection(0,0),-1);assert.equal(wheelSelection(25,30),-1);
  WHEEL_ACTIONS.forEach((action,i)=>{
    const angle=i*Math.PI*2/WHEEL_ACTIONS.length;
    assert.equal(wheelSelection(Math.sin(angle)*100,-Math.cos(angle)*100),i);
  });
  assert.ok(!WHEEL_ACTIONS.some(a=>a.id==='wink'));
});

test('right hold opens; movement only highlights; release commits once; center and Escape cancel',()=>{
  const listeners={},docListeners={},calls=[];
  class Element{
    constructor(){this.children=[];this.style={};this.classList={toggle(){},add(){},remove(){}};}
    append(...items){this.children.push(...items);}setAttribute(){}addEventListener(){}
  }
  const surface=new Element();
  globalThis.window={addEventListener:(name,handler)=>listeners[name]=handler};
  globalThis.document={createElement:()=>new Element(),createElementNS:()=>new Element(),body:new Element(),pointerLockElement:surface,addEventListener:(name,handler)=>docListeners[name]=handler};
  const wheel=buildGestureWheel({surface,canOpen:()=>true,onSelect:a=>calls.push(a.id),onOpen(){}});
  const event=(args={})=>({target:surface,button:2,preventDefault(){},stopImmediatePropagation(){},...args});
  listeners.mousedown(event());assert.equal(wheel.active,true);
  listeners.mousemove(event({movementX:0,movementY:-100}));assert.deepEqual(calls,[]);
  listeners.mouseup(event());assert.deepEqual(calls,['wave']);assert.equal(wheel.active,false);
  listeners.mouseup(event());assert.equal(calls.length,1);
  listeners.mousedown(event());listeners.mouseup(event());assert.equal(calls.length,1);
  listeners.mousedown(event());listeners.mousemove(event({movementX:0,movementY:-100}));listeners.keydown(event({code:'Escape'}));listeners.mouseup(event());assert.equal(calls.length,1);
  listeners.mousedown(event());listeners.blur();assert.equal(wheel.active,false);
});
