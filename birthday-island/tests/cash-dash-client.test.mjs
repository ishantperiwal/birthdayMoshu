import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CASH_SITES} from '../cash-dash-state.js';
const url=new URL('../cash-dash.js',import.meta.url);
let source=await readFile(url,'utf8');
source=source.replace("import * as THREE from 'three';",`class Vector3{constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}project(){return this.set(0,0,0);}}
class Quaternion{setFromAxisAngle(){return this;}multiply(){return this;}}
class Object3D{constructor(){this.position=new Vector3();this.rotation={set(){}};this.quaternion=new Quaternion();this.scale={setScalar(){}};}updateMatrix(){}}
class InstancedMesh{constructor(){this.instanceMatrix={setUsage(){}};}setMatrixAt(){}}
const THREE={Vector3,Quaternion,Object3D,InstancedMesh,MeshBasicMaterial:class{},BoxGeometry:class{},Color:class{}};`)
  .replace(/import \{cashBundleGeometry\} from '\.\/cash-bundle\.js[^']*';/,'const cashBundleGeometry=()=>({});')
  .replace("'./cash-dash-state.js'",JSON.stringify(new URL('./cash-dash-state.js',url).href));
const {buildCashDash}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('local dash starts after candles, collects without blocking, and stops exactly at timeout',()=>{
  const originalNow=Date.now,restore=[],credits=[],meshes=[];let time=1000,blown=false,sounds=0,starts=0;
  Date.now=()=>time;
  const element=()=>({children:[],style:{},attributes:{},append(...children){this.children.push(...children);},setAttribute(k,v){this.attributes[k]=v;},addEventListener(){}});
  const card=element(),collector={x:60,z:40};
  globalThis.document={body:element(),querySelector:()=>card,createElement:element};
  globalThis.matchMedia=()=>({matches:true});globalThis.innerWidth=1280;globalThis.innerHeight=720;
  try{
    // Deliberately place three pairs together to exercise multi-pickup feedback,
    // independently of the wider production layout.
    const resolveSite=(x,z)=>{const paired=CASH_SITES.slice(40,43).findIndex(s=>s.x===x&&s.z===z);return paired<0?{x,z}:{x:CASH_SITES[paired].x+.5,z:CASH_SITES[paired].z};};
    const dash=buildCashDash({scene:{add:m=>meshes.push(m)},camera:{},ground:()=>0,resolveSite,rewards:{restore:(...args)=>restore.push(args),collectInstant:r=>credits.push(r)},online:false,male:false,getNetwork:()=>null,isPlaying:()=>true,candlesBlown:()=>blown,getCollector:()=>collector,onPickup:()=>sounds++,onStart:()=>starts++});
    dash.update();assert.equal(meshes[0].visible,false);
    blown=true;dash.update();time=5999;dash.update();assert.equal(starts,0);
    time=6000;dash.update();assert.equal(starts,1);assert.equal(meshes[0].visible,true);
    const timer=document.body.children[0];
    assert.equal(timer.children[1].textContent,'3');
    time=7000;dash.update();assert.equal(timer.children[1].textContent,'2');
    time=8000;dash.update();assert.equal(timer.children[1].textContent,'1');
    Object.assign(collector,CASH_SITES[0]);time=8999;dash.update();assert.equal(credits.length,0);
    time=9000;dash.update();assert.equal(credits[0].total,10);assert.equal(credits[0].amount,10);assert.equal(credits[0].packages,2);assert.equal(sounds,1);
    dash.update();assert.equal(credits.length,1);
    Object.assign(collector,CASH_SITES[1]);time=9200;dash.update();assert.equal(credits[1].total,20);assert.equal(sounds,2);
    Object.assign(collector,CASH_SITES[2]);time=9250;dash.update();assert.equal(credits.length,2,'rapid pickups coalesce instead of stacking sounds');
    time=9300;dash.update();assert.equal(credits[2].total,30);assert.equal(credits[2].amount,10);assert.equal(sounds,3);
    time=59000;dash.update();assert.equal(timer.attributes['data-urgent'],'true');assert.equal(timer.children[1].textContent,'10s');
    assert.equal(timer.children[1].style.transform,'scale(1)','reduced motion skips the beat');
    Object.assign(collector,CASH_SITES[3]);time=69000;dash.update();assert.equal(credits.length,3);assert.equal(meshes[0].visible,false);
    assert.equal(timer.hidden,true,'no duplicate result total after the dash');
    assert.equal(meshes[1].visible,false,'glow disappears with cash');
    assert.equal(meshes[1].instanceMatrix,meshes[0].instanceMatrix,'glow shares the existing instance transforms');
    assert.equal(card.children[0].hidden,false,'local replay becomes available');
  }finally{Date.now=originalNow;}
});
