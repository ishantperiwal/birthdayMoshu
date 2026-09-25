import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Run the actual following controller with rendering replaced by a motion spy.
const source=(await readFile(new URL('../companion.js',import.meta.url),'utf8'))
  .replace(/import \{DATE_OUTFIT\}[^;]+;/,'const DATE_OUTFIT={};')
  .replace("import * as THREE from 'three';",`
    class Vector3 {constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}copy(v){return this.set(v.x,v.y,v.z);}clone(){return new Vector3(this.x,this.y,this.z);}}
    class Quaternion {copy(){return this;}invert(){return this;}}
    class Group {constructor(){this.position=new Vector3();this.rotation=new Vector3();this.quaternion=new Quaternion();this.userData={};}}
    const THREE={Vector3,Quaternion,Group,MathUtils:{clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),smoothstep:(x,a,b)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}}};
  `)
  .replace(/import \{ buildCharacter \}[^;]+;/,`function buildCharacter(parent){return {root:{scale:{x:1,setScalar(x){this.x=x;}}},update(dt,moving,running){parent.userData.motion={moving,running};}};}`);
const {buildCompanion,HOLD_SPACING}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function fixture(options={}){
  const companion=buildCompanion({add(){}},{terrainHeight:()=>0,onIsland:()=>true,stageHeight:0,stageRadius:3,...options});
  companion.anchor.position.set(10,0,0);companion.celebrate();companion.update(2.2,{x:10,y:0,z:0});
  return companion;
}
test('a blocked companion stops his walking animation instead of walking through a prop',()=>{
  let calls=0;
  const c=fixture({resolveMove:(x,z)=>{calls++;return {x,z};}});
  c.update(.1,{x:0,y:0,z:0});
  assert.ok(calls>0);assert.equal(c.anchor.position.x,10);assert.equal(c.motion.moving,false);
});
for(const fps of [30,60,120])test(`following stops without residual foot shuffling at ${fps} fps`,()=>{
  const c=fixture(),player={x:0,y:0,z:0},dt=1/fps;
  let arrived=false;
  for(let i=0;i<fps*12;i++){
    c.update(dt,player);
    if(c.anchor.position.x<=3.350001){arrived=true;break;}
  }
  assert.equal(arrived,true);assert.ok(Math.abs(c.anchor.position.x-3.35)<1e-6);
  const stoppedX=c.anchor.position.x;
  for(let i=0;i<fps;i++){
    c.update(dt,player);
    assert.equal(c.anchor.position.x,stoppedX);
    assert.equal(c.anchor.userData.motion.moving,false);
    assert.equal(c.motion.moving,false);
  }
  player.x=-2;c.update(dt,player);
  assert.equal(c.motion.moving,true);assert.ok(c.anchor.position.x<stoppedX);
});
test('holding hands still approaches the closer hand-holding distance',()=>{
  const c=fixture();c.anchor.position.x=3.35;c.toggleHolding();
  for(let i=0;i<180;i++)c.update(1/60,{x:0,y:0,z:0});
  assert.ok(c.anchor.position.x<HOLD_SPACING+.02);assert.ok(c.anchor.position.x>=HOLD_SPACING);
  assert.equal(c.holdReady,true);
});

test('diagonal arrival does not restart walking on floating-point distance noise',()=>{
  const c=fixture(),player={x:0,y:0,z:0};c.anchor.position.set(10*Math.cos(.63),0,10*Math.sin(.63));
  for(let i=0;i<720;i++)c.update(1/60,player);
  const stopped=c.anchor.position.clone();
  for(let i=0;i<60;i++){
    c.update(1/60,player);assert.equal(c.motion.moving,false);
    assert.equal(c.anchor.position.x,stopped.x);assert.equal(c.anchor.position.z,stopped.z);
  }
});
