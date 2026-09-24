import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSkirtMotion} from '../skirt-motion.js';
import {createPreviewFollower} from '../preview-follower.js';

for(const fps of [30,60,120])test(`fabric trails travel and settles at ${fps} fps`,()=>{
  const motion=createSkirtMotion(),dt=1/fps,p={x:0,z:0};let offset,maxSide=0;
  motion.update(dt,p);
  for(let i=0;i<fps;i++){p.z-=4*dt;offset=motion.update(dt,p);maxSide=Math.max(maxSide,Math.abs(offset.x));}
  assert.ok(offset.z>.07&&offset.z<.11);
  assert.ok(maxSide>.02,'approaching fabric also has visible sideways motion');
  for(let i=0;i<fps*2;i++)offset=motion.update(dt,p);
  assert.ok(Math.hypot(offset.x,offset.z)<.0001);
});
test('running is restrained, direction follows travel, and teleports or stargazing reset lag',()=>{
  const motion=createSkirtMotion(),dt=1/60,p={x:0,z:0};motion.update(dt,p);let offset;
  for(let i=0;i<90;i++){p.x+=10*dt;offset=motion.update(dt,p);}
  assert.ok(offset.x<-.10&&offset.x>-.14);
  assert.ok(Math.hypot(offset.x,offset.z)<.14,'running remains restrained');
  p.x+=20;assert.deepEqual(motion.update(dt,p),{x:0,z:0});
  for(let i=0;i<30;i++){p.z+=dt*3;offset=motion.update(dt,p);}
  assert.ok(offset.z<0);assert.deepEqual(motion.update(dt,p,false),{x:0,z:0});
});

test('her actual follow movement produces lateral sway and settles on arrival',()=>{
  const follower=createPreviewFollower(),motion=createSkirtMotion(),dt=1/60;
  let position={x:0,z:8},offset,maxSide=0,minSide=0;
  motion.update(dt,position);
  for(let frame=0;frame<600;frame++){
    position=follower.step(dt,position,{x:0,z:0},[],()=>true);
    offset=motion.update(dt,position);
    maxSide=Math.max(maxSide,offset.x);minSide=Math.min(minSide,offset.x);
  }
  assert.ok(maxSide>.015&&minSide<-.015,'hem sways both ways while approaching');
  assert.ok(Math.hypot(offset.x,offset.z)<.0001,'no idle wobble after she stops');
});
