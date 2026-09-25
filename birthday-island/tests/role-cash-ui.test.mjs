import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const url=new URL('../cash-dash.js',import.meta.url);
let source=await readFile(url,'utf8');
source=source.replace("import * as THREE from 'three';",`
class Vector3{set(){return this;}project(){return this;}}
class Quaternion{setFromAxisAngle(){return this;}multiply(){return this;}}
class Object3D{position=new Vector3();rotation={set(){}};quaternion=new Quaternion();scale={setScalar(){}};updateMatrix(){}}
class InstancedMesh{instanceMatrix={setUsage(){}};setMatrixAt(){}}
const THREE={Vector3,Quaternion,Object3D,InstancedMesh,MeshBasicMaterial:class{},BoxGeometry:class{},Color:class{}};`)
 .replace(/import \{cashBundleGeometry\} from '[^']+';/,'const cashBundleGeometry=()=>({});')
 .replace("'./cash-dash-state.js'",JSON.stringify(new URL('../cash-dash-state.js',import.meta.url).href));
const {buildCashDash}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('host waits for manual cash start; guest gets no replay controls',()=>{
  const savedNow=Date.now;let time=1000;Date.now=()=>time;
  const element=()=>({children:[],style:{},classList:{toggle(){}},append(...c){this.children.push(...c);},setAttribute(){},addEventListener(){}});
  globalThis.matchMedia=()=>({matches:true});
  try{
    for(const male of [true,false]){
      time=1000;let candles=false,starts=0;const card=element();
      globalThis.document={body:element(),createElement:element,querySelector:()=>card};
      const dash=buildCashDash({scene:{add(){}},camera:{},ground:()=>0,resolveSite:(x,z)=>({x,z}),rewards:{restore(){}},online:false,male,roleUI:true,getNetwork:()=>null,isPlaying:()=>true,candlesBlown:()=>candles,getCollector:()=>null,onPickup(){},onStart(){starts++;}});
      dash.update();const button=card.children[0],timer=document.body.children[0];
      assert.equal(button.hidden,!male);assert.equal(button.disabled,true);
      candles=true;dash.update();time=10000;dash.update();
      if(male){assert.equal(starts,0);assert.equal(timer.hidden,true);dash.start();dash.update();}
      assert.equal(starts,1);assert.equal(timer.children[1].textContent,'3');
      time=80000;dash.update();assert.equal(button.hidden,true);
    }
  }finally{Date.now=savedNow;}
});
