import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCashFlightPool} from '../cash-flight-pool.js';

test('overlapping flights finish independently; a full pool queues without dropping any',()=>{
  const pool=createCashFlightPool(2),done=[];
  pool.add({id:1},0,()=>done.push(1));pool.add({id:2},100,()=>done.push(2));pool.add({id:3},200,()=>done.push(3));
  const frame=time=>{const visible=[];pool.step(time,(_,r,t)=>visible.push([r.id,t]));return visible;};
  assert.deepEqual(frame(350),[[1,.5],[2,250/700]]);
  assert.deepEqual(done,[]);
  assert.deepEqual(frame(700),[[3,0],[2,600/700]]);assert.deepEqual(done,[1]);
  frame(800);assert.deepEqual(done,[1,2]);
  assert.deepEqual(frame(1400),[]);assert.deepEqual(done,[1,2,3]);
  pool.add({id:4},1500,()=>done.push(4));pool.clear();
  assert.deepEqual(frame(3000),[]);assert.deepEqual(done,[1,2,3,4]);
});

let source=await readFile(new URL('../cash-rewards.js',import.meta.url),'utf8');
source=source.replace("import * as THREE from 'three';",`
const allocations={renderers:0,meshes:0,materials:0},batches=[];let renders=0;
class Vector3{constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}}
class Quaternion{setFromAxisAngle(){return this;}multiply(){return this;}}
class Object3D{constructor(){this.position=new Vector3();this.rotation={set(){}};this.quaternion=new Quaternion();this.size=0;this.scale={setScalar:n=>this.size=n};}updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,size:this.size};}}
class InstancedMesh{constructor(g,m,count){allocations.meshes++;this.count=count;this.matrices=[];this.instanceMatrix={setUsage(){}};batches.push(this);}setMatrixAt(i,m){this.matrices[i]={...m};}}
const THREE={Vector3,Quaternion,Object3D,InstancedMesh,Scene:class{add(){}},OrthographicCamera:class{position={};updateProjectionMatrix(){}},MeshBasicMaterial:class{constructor(){allocations.materials++;}},WebGLRenderer:class{constructor(){allocations.renderers++;this.domElement={};}setPixelRatio(){}setClearColor(){}setSize(){}render(){renders++;}},MathUtils:{lerp:(a,b,t)=>a+(b-a)*t,smoothstep:t=>t*t*(3-2*t)}};
export const inspect=()=>({allocations,batches,renders});`)
 .replace(/import \{cashBundleGeometry\} from '[^']+';/,'const cashBundleGeometry=()=>({});');
for(const name of ['cash-flight-pool','cash-dash-state'])source=source.replace(`'./${name}.js'`,JSON.stringify(new URL(`../${name}.js`,import.meta.url).href));
const {buildCashRewards,inspect}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('HUD prewarms all slots, rapid pickups never reset totals, and fifty flights allocate no GPU resources',async()=>{
  let now=0;const savedPerformance=globalThis.performance;
  const element=()=>({children:[],append(c){this.children.push(c);},setAttribute(){},getBoundingClientRect:()=>({left:1100,top:20,width:60,height:60})});
  const value=element(),card=element(),icon=element(),reduced={matches:false};card.querySelector=()=>icon;
  globalThis.document={querySelector:s=>s==='#gift-value'?value:card,createElement:element,body:{...element(),classList:{contains:()=>true}}};
  globalThis.window={matchMedia:()=>reduced,addEventListener(){}};globalThis.ResizeObserver=class{observe(){}};
  globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.performance={now:()=>now};
  try{
    const rewards=buildCashRewards(),batch=inspect().batches.at(-1),initial={...inspect().allocations};
    assert.equal(inspect().renders,1);assert.equal(batch.matrices.length,17,'entire instance buffer uploaded before play');
    const pick=n=>rewards.collectInstant({total:n*5,x:100+n*10,y:500});
    pick(1);now=100;pick(2);now=350;rewards.update();
    assert.equal(batch.matrices.filter(m=>m.size>0).length,3,'icon plus both independent flights');
    now=700;rewards.update();assert.equal(value.textContent,'€10','first arrival cannot roll the amount back');
    assert.equal(batch.matrices.filter(m=>m.size>0).length,2,'second flight still travelling');
    rewards.restore(0);now=1000;
    for(let n=1;n<=50;n++)pick(n);
    rewards.update();assert.equal(batch.matrices.filter(m=>m.size>0).length,17);
    for(now=1700;now<=3800;now+=700)rewards.update();
    assert.equal(value.textContent,'€250');assert.equal(batch.matrices.filter(m=>m.size>0).length,1);
    assert.deepEqual(inspect().allocations,initial);
    rewards.restore(0);reduced.matches=true;
    await rewards.collect({total:5,x:100,y:500});rewards.update();
    assert.equal(value.textContent,'€5');assert.equal(batch.matrices.filter(m=>m.size>0).length,1);
  }finally{globalThis.performance=savedPerformance;}
});
