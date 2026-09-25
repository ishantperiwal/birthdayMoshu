import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {slideGaze,GAZE_PITCH_MIN,GAZE_PITCH_MAX} from '../gaze-limits.js';

// Run the real input and update code without constructing the meadow meshes.
const source=await readFile(new URL('../stargazing.js',import.meta.url),'utf8');
test('entry changes pose only under full black and reveals it afterward',async()=>{
  const animations=[],events=[];
  const blackout={animate(frames,options){let resolve;const animation={frames,options,finished:new Promise(r=>resolve=r),cancel(){},resolve:()=>resolve()};animations.push(animation);return animation;}};
  const enterSource=source.slice(source.indexOf('  async function enter(site)'),source.indexOf('  function settle(site)'));
  const enter=runInNewContext(`(()=>{let active=false,entering=false,leaving=false,transitionId=0,fadeAnimation=null;${enterSource}return enter;})()`,
    {companion:{throwing:false},keys:{},ui:{},lock(){},blackout,settle:site=>events.push(site),canStart:()=>true,onBlocked(){}});
  const pending=enter('blanket');assert.equal(events.length,0);
  assert.equal(animations[0].frames[1].opacity,1);
  animations[0].resolve();await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(events,['blanket']);assert.equal(animations[1].frames[0].opacity,1);
  assert.equal(animations[1].frames[1].opacity,0);
  animations[1].resolve();await pending;
});
function fixture(reduced=true){
  const listeners={},sent=[],animations=[];
  const blackout={animate(frames){let resolve;const animation={frames,finished:new Promise(r=>resolve=r),cancel(){},resolve:()=>resolve()};animations.push(animation);return animation;}};
  class Vector3{
    constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
    copy(v){Object.assign(this,v);return this;}
    unproject(){this.z=-.35+this.y*.4;this.x*=.5;this.y=1;return this;} sub(){return this;} normalize(){return this;}
    multiplyScalar(){return this;} add(){return this;}
    distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
    toArray(a=[],i=0){a[i]=this.x;a[i+1]=this.y;a[i+2]=this.z;return a;}
  }
  const listen=(name,fn)=>listeners[name]=fn;
  const document={addEventListener:listen,body:{style:{},append(){},classList:{contains:()=>false,remove(){},add(){}}},
    createElement:()=>({style:{},hidden:true,addEventListener(){}}),
    exitPointerLock(){this.pointerLockElement=null;listeners.pointerlockchange();}};
  const ui={style:{},requestPointerLock(){document.pointerLockElement=ui;listeners.pointerlockchange();}};
  const attributes={position:{},inkBirth:{}};
  class Euler{set(x,y,z){Object.assign(this,{x,y,z});return this;}}
  class Quaternion{setFromEuler(e){this.euler={...e};return this;}slerp(q){this.euler=q.euler;return this;}copy(q){this.euler=q.euler;return this;}multiply(q){this.sway={...q.euler};return this;}}
  const transform=()=>({position:new Vector3(),rotation:new Vector3(),up:new Vector3(),scale:new Vector3()});
  const playerRig=transform(),avatar={root:transform(),setFirstPerson(){}},companion={anchor:transform(),throwing:false};
  const env={THREE:{Vector3,Quaternion,Euler,MathUtils:{clamp:(n,a,b)=>Math.max(a,Math.min(b,n))}},
    blackout,getComputedStyle:()=>({opacity:'0'}),playerRig,avatar,companion,keys:{},canMovePartner:()=>false,onLeave(){env.returned=true;document.pointerLockElement='world';},
    window:{addEventListener:listen,matchMedia:()=>({matches:reduced})},document,ui,
    innerWidth:1000,innerHeight:800,camera:{position:new Vector3(),quaternion:new Quaternion(),updateMatrixWorld(){},getWorldPosition(v){return v.copy(this.position);}},
    max:12000,positions:new Float32Array(36000),inkBirth:new Float32Array(12000),
    geo:{attributes,count:0,setDrawRange(start,count){this.count=count;},computeBoundingSphere(){}},sparkleTime:{value:0},
    eraseTime:{value:-100},eraseSpan:{value:1},fadeLimit:{value:1e9},inkMotion:{value:1},
    ink:{},sprinkle(){},clearDust(){},onInk:p=>sent.push(p),sites:[],interactive:[],
    // Module-level gaze limits, read from the real source.
    slideGaze,GAZE_PITCH_MIN,GAZE_PITCH_MAX};
  const body=source.slice(source.indexOf('  let active=false'));
  const api=runInNewContext(`(function(){${body.replace('  return {receiveInk',`  active=true;lock();
    saved={player:playerRig,avatar:avatar.root,visible:false,camera:{...playerRig},parent:{add(){}}};
    camera.rotation=new THREE.Vector3();camera.up=new THREE.Vector3();camera.scale=new THREE.Vector3();
    return {receiveInk`)})()`,env);
  const mouse=(type,x=200,y=150,buttons=1)=>listeners[type]({button:0,buttons,clientX:x,clientY:y,movementX:50,movementY:40,preventDefault(){}});
  const key=code=>api.keyDown({code,preventDefault(){}});
  return {api,document,ui,sent,mouse,key,env,animations};
}
test('Pictionary retains ink and prevents the guesser from drawing',()=>{
  const f=fixture();f.api.setGame(true,true);f.api.startDrawing();
  f.mouse('mousedown');f.mouse('mousemove',300,220);f.mouse('mouseup');
  const count=f.env.geo.count;assert.ok(count>0);f.api.update(90);assert.equal(f.env.geo.count,count);
  f.api.setGame(true,false);f.mouse('mousedown');f.mouse('mousemove',450,300);f.mouse('mouseup');assert.equal(f.env.geo.count,count);
  f.api.clearInk();assert.equal(f.env.geo.count,0);
});
test('click stays in look mode; D unlocks the cursor without starting a stroke',()=>{
  const f=fixture();f.mouse('mousedown');assert.equal(f.api.drawMode,false);f.key('KeyD');
  assert.equal(f.document.pointerLockElement,null);assert.equal(f.api.active,true);
  assert.ok(f.ui.style.cursor.startsWith('url("data:image/svg+xml,'));
  assert.ok(f.ui.style.cursor.endsWith('16 16, default'));assert.equal(f.sent.length,0);
  f.api.update(.1);
});

test('camera drift continues in drawing mode without cursor steering',()=>{
  const f=fixture(false);f.api.update(.1);
  f.key('KeyD');
  for(let t=.15;t<=1.5;t+=.05)f.api.update(t);
  const before={...f.env.camera.quaternion.sway};
  const aim={...f.env.camera.quaternion.euler};
  f.mouse('mousemove',900,700,0);f.api.update(2);
  assert.notDeepEqual(f.env.camera.quaternion.sway,before);
  assert.deepEqual(f.env.camera.quaternion.euler,aim);
  f.key('Escape');f.mouse('mousemove');f.api.update(3);
  assert.notDeepEqual(f.env.camera.quaternion.euler,aim);
});
test('separate strokes start at actual cursor positions and share every segment',()=>{
  const f=fixture();f.key('KeyD');
  f.mouse('mousedown',100,100);f.mouse('mousemove',400,100);
  f.mouse('mousemove',700,100);f.mouse('mouseup');
  f.mouse('mousemove',800,600,0);f.api.update(.2);
  f.mouse('mousedown',800,600);f.mouse('mousemove',500,600);
  assert.equal(f.sent.length,3);
  assert.deepEqual(Array.from(f.sent[0]).slice(0,2),[-40,100]);
  assert.deepEqual(Array.from(f.sent[1]).slice(0,3),Array.from(f.sent[0]).slice(3));
  assert.ok(Math.abs(f.sent[2][0]-30)<1e-8);assert.equal(f.sent[2][1],100);
});
test('two Escapes fade to black before standing and return control after revealing',async()=>{
  const f=fixture();f.key('KeyD');
  f.key('Escape');assert.equal(f.api.active,true);
  assert.equal(f.document.pointerLockElement,f.ui);assert.equal(f.ui.style.cursor,'');
  f.key('Escape');assert.equal(f.api.active,true);assert.equal(f.env.returned,undefined);
  assert.equal(f.animations[0].frames[1].opacity,1);
  f.key('Escape');assert.equal(f.animations.length,1);
  f.animations[0].resolve();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.ui.hidden,true);assert.equal(f.api.active,true);
  assert.equal(f.animations[1].frames[0].opacity,1);assert.equal(f.animations[1].frames[1].opacity,0);
  f.animations[1].resolve();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.api.active,false);assert.equal(f.env.returned,true);
  assert.equal(f.document.pointerLockElement,'world');
  assert.equal(f.sent.length,0);
});

test('a long sentence stays visible, then erases in writing order after inactivity',()=>{
  const f=fixture();f.key('KeyD');
  for(let t=0;t<=10;t+=2){
    f.api.update(t);f.mouse('mousedown',100,100);f.mouse('mousemove',400,100);f.mouse('mouseup');
  }
  assert.equal(f.env.geo.count,12);assert.equal(f.env.eraseTime.value,-100);
  f.api.update(12.9);assert.equal(f.env.geo.count,12);
  f.api.update(14.5);
  assert.ok(f.env.geo.count<12&&f.env.geo.count>0);
  assert.ok(f.env.inkBirth[0]>0); // oldest marks were reclaimed first
  f.api.update(20);assert.equal(f.env.geo.count,0);
});

test('new ink refreshes waiting ink but cannot restart an active fade',()=>{
  const f=fixture();f.key('KeyD');
  f.api.receiveInk([0,0,0,1,1,1]);f.api.update(2.9);
  f.api.receiveInk([1,1,1,2,2,2]);f.api.update(5);
  assert.equal(f.env.geo.count,4);assert.equal(f.env.eraseTime.value,-100);
  f.api.update(6.2);assert.notEqual(f.env.eraseTime.value,-100);
  f.mouse('mousedown',100,100);f.mouse('mousemove',400,100);f.mouse('mouseup');
  assert.notEqual(f.env.eraseTime.value,-100);f.api.update(10);
  assert.equal(f.env.geo.count,2);
  f.api.update(16);assert.equal(f.env.geo.count,0);
});
test('stargazing refuses to start until the celebration allows it',async()=>{
  const animations=[];let blocked=0;
  const blackout={animate(frames){const animation={frames,finished:new Promise(()=>{}),cancel(){}};animations.push(animation);return animation;}};
  const enterSource=source.slice(source.indexOf('  async function enter(site)'),source.indexOf('  function settle(site)'));
  const enter=runInNewContext(`(()=>{let active=false,entering=false,leaving=false,transitionId=0,fadeAnimation=null;${enterSource}return enter;})()`,
    {companion:{throwing:false},keys:{},ui:{},lock(){},blackout,settle(){},canStart:()=>false,onBlocked(){blocked++;}});
  await enter('blanket');
  assert.equal(blocked,1);assert.equal(animations.length,0);
});
