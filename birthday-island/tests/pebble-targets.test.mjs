import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createTargetGame,generateTarget,finishesInside,predictFinish} from '../pebble-targets.js';
const main=await readFile(new URL('../main.js',import.meta.url),'utf8');
const island=main.slice(main.indexOf('function islandHeight('),main.indexOf('// Keep the birthday clearing'));
const terrain=main.slice(main.indexOf('function terrainHeight('),main.indexOf('function celebrationPathX('));
const ground=new Function(`const SHORE={x:47,z:26};const lerp=(a,b,t)=>a+(b-a)*t;
const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
${island}const gardenHeight=islandHeight(-8,-10);${terrain}return terrainHeight;`)();
let seed=729;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const origin={x:45,y:ground(45,26)+1.5,z:26};
test('three rounds generate open-water hoops from the actual shore across wave phases',()=>{
  for(let round=1;round<=3;round++)for(let i=0;i<30;i++){
    const target=generateTarget(origin,round,i*9,ground,random);
    assert.ok(target,`round ${round} time ${i*9}`);
    for(let j=0;j<32;j++)assert.ok(ground(target.x+Math.cos(j*Math.PI/16)*target.radius,target.z+Math.sin(j*Math.PI/16)*target.radius)<-1.1);
  }
});
test('passing through, landing ashore and timing out never count as a win',()=>{
  const target={x:0,z:0,radius:3.2};
  const f={done:true,finish:'water',position:{x:3.2,z:0}};
  assert.equal(finishesInside(f,target),true);
  assert.equal(finishesInside({...f,position:{x:3.21,z:0}},target),false);
  assert.equal(finishesInside({...f,done:false},target),false);
  for(const finish of ['land','timeout',undefined])assert.equal(finishesInside({...f,finish},target),false);
});
test('misses keep the hoop; exactly three wins finish; replay and leaving reset',()=>{
  const game=createTargetGame();
  for(let i=1;i<=3;i++){
    assert.equal(game.prepare(origin,i,ground,random),true);assert.equal(game.round,i);
    const target=game.target;
    assert.equal(game.finish({done:true,finish:'water',position:{x:0,z:0}}),false);
    game.prepare(origin,i,ground,random);assert.equal(game.target,target);
    const hit={done:true,finish:'water',position:{...target}};
    assert.equal(game.finish(hit),true);assert.equal(game.finish(hit),false);
    assert.equal(game.wins,i);assert.equal(game.complete,i===3);
  }
  assert.equal(game.attempts,6);
  game.prepare(origin,8,ground,random);assert.equal(game.wins,0);assert.equal(game.round,1);
  game.reset();assert.equal(game.target,null);assert.equal(game.attempts,0);
});
test('prediction distinguishes final water contact from land and cannot generate on dry land',()=>{
  assert.equal(predictFinish({x:0,y:2,z:0},{x:1,y:-1,z:0},.1,0,()=>-5).finish,'water');
  assert.equal(predictFinish({x:0,y:2,z:0},{x:1,y:-1,z:0},.1,0,()=>1).finish,'land');
  assert.equal(generateTarget(origin,1,0,()=>10,random),null);
});
