import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moveAroundRocks} from '../rock-collision.js';
const land=()=>true;
test('sprinting cannot tunnel through a narrow pole or another player',()=>{
  for(const radius of [.09,.32]){
    const p=moveAroundRocks(-2,0,4,0,[{x:0,z:0,radius}],land,.30);
    assert.ok(p.x<=-radius-.30);assert.ok(Math.abs(p.z)<1e-8);
  }
});
test('rotated sign blocks its front and permits sliding along the board',()=>{
  const angle=1.08,c=Math.cos(angle),s=Math.sin(angle);
  const world=(x,z)=>({x:c*x+s*z,z:-s*x+c*z});
  const box={x:0,z:0,halfWidth:.635,halfDepth:.035,angle};
  const start=world(0,-2),delta=world(0,4);
  const p=moveAroundRocks(start.x,start.z,delta.x,delta.z,[box],land,.30);
  assert.ok(s*p.x+c*p.z<=-.335);
  const slide=world(2,0),q=moveAroundRocks(p.x,p.z,slide.x,slide.z,[box],land,.30);
  assert.ok(c*q.x-s*q.z>1.9);
});
test('overlapping inspection spawns recover without NaN or getting trapped',()=>{
  for(const obstacle of [{x:0,z:0,radius:.32},{x:0,z:0,halfWidth:.635,halfDepth:.035,angle:1.08}]){
    const p=moveAroundRocks(0,0,0,0,[obstacle],land,.30);
    assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));assert.ok(Math.hypot(p.x,p.z)>.33);
  }
});
test('hand-holding distance remains clear of body hitboxes',()=>{
  const p=moveAroundRocks(1.65,0,0,0,[{x:0,z:0,radius:.30}],land,.32);
  assert.equal(p.x,1.65);assert.equal(p.z,0);
});
