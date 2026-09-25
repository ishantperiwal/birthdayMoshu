import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../jumping-fish.js',import.meta.url),'utf8'))
  .replace("import * as THREE from 'three';",'')
  .replace(/import \{SHORE,waterHeight\}[^;]+;/,'const SHORE={x:47,z:26};');
const {sampleFishJump,sampleNearbyFish,FISH_AREAS}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const main=await readFile(new URL('../main.js',import.meta.url),'utf8');
const island=main.slice(main.indexOf('function islandHeight('),main.indexOf('// Keep the birthday clearing'));
const terrain=main.slice(main.indexOf('function terrainHeight('),main.indexOf('function celebrationPathX('));
const ground=new Function(`const SHORE={x:47,z:26};const lerp=(a,b,t)=>a+(b-a)*t;
  const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  ${island}const gardenHeight=islandHeight(-8,-10);${terrain}return terrainHeight;`)();
let seed=719;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('nearby fish appear ahead over water, never inland or when looking straight up',()=>{
  const coast=(x,z)=>x>5?-5:2;
  const view={x:0,z:0,dx:1,dz:0};
  for(let i=0;i<50;i++){
    const f=sampleNearbyFish(view,coast,random);assert.ok(f);assert.ok(f.x>5);
    assert.ok(Math.abs(Math.atan2(f.z,f.x))<.7);
    for(let t=0;t<=1;t+=.05)assert.ok(coast(f.x+f.vx*f.duration*t,f.z+f.vz*f.duration*t)<-1.1);
  }
  assert.equal(sampleNearbyFish(view,()=>2,random),null);
  assert.equal(sampleNearbyFish({...view,dx:0,dz:0},coast,random),null);
});
test('both fish areas produce varied jumps wholly offshore',()=>{
  for(const area of FISH_AREAS){
    const jumps=Array.from({length:300},()=>sampleFishJump(area,ground,random));
    assert.ok(jumps.every(Boolean));
    for(const f of jumps)for(let t=0;t<=1;t+=.05)assert.ok(ground(f.x+f.vx*f.duration*t,f.z+f.vz*f.duration*t)<-1.05);
    assert.ok(Math.max(...jumps.map(f=>f.size))-Math.min(...jumps.map(f=>f.size))>.8);
    assert.ok(Math.max(...jumps.map(f=>f.x))-Math.min(...jumps.map(f=>f.x))>8);
  }
});
test('an unsuitable area skips a jump instead of placing a fish on land',()=>{
  assert.equal(sampleFishJump(FISH_AREAS[0],()=>2,random),null);
});
