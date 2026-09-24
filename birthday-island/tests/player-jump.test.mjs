import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPlayerJump} from '../player-jump.js';

for(const fps of [30,60,120])test(`jump rises and lands without hovering at ${fps} fps`,()=>{
  const jump=createPlayerJump();let y=2,peak=y;
  assert.equal(jump.start(),true);
  for(let frame=0;frame<fps;frame++){
    y=jump.update(y,2,1/fps);peak=Math.max(peak,y);
    if(jump.active)assert.equal(jump.start(),false);
    assert.ok(y>=2);
  }
  assert.ok(Math.abs(peak-2.54)<.01);
  assert.equal(y,2);assert.equal(jump.active,false);
  assert.equal(jump.start(),true);
});

test('landing follows terrain and cancelling removes residual launch velocity',()=>{
  const jump=createPlayerJump();jump.start();let y=0;
  for(let i=0;i<90;i++)y=jump.update(y,-.4,1/60);
  assert.equal(y,-.4);assert.equal(jump.active,false);
  jump.start();jump.reset();assert.equal(jump.update(3,3,.1),3);
});

test('both cheering hands stay above and in front of the shoulders',async()=>{
  const source=await readFile(new URL('../character.js',import.meta.url),'utf8');
  const body=source.match(/arms\.forEach\(\(arm,i\)=>\{(arm\.rotation\.x=[\s\S]*?)\}\);root\.position/)[1];
  const pose=new Function('arm','i','stride','blend','cheer',body);
  for(const i of [0,1])for(const stride of [0,1,3,5]){
    const arm={rotation:{}};pose(arm,i,stride,1,1);
    const {x,z}=arm.rotation;
    // Arms start downward; local forward is -Z (Three.js XYZ Euler order).
    assert.ok(-Math.cos(z)*Math.cos(x)>.6);
    assert.ok(-Math.cos(z)*Math.sin(x)<-.5);
  }
});
