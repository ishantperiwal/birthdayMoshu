import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewFollower} from '../preview-follower.js';

test('she follows, stops close without overlapping, and stays idle once arrived',()=>{
  const follower=createPreviewFollower(),target={x:0,z:0};let position={x:0,z:8},next;
  for(let i=0;i<600;i++){next=follower.step(1/60,position,target,[],()=>true);position=next;}
  assert.ok(position.z>=1.9&&position.z<1.93);assert.equal(next.moving,false);
  const idle=follower.step(1/60,position,{x:0,z:-.1},[],()=>true);assert.equal(idle.moving,false);
  assert.equal(follower.step(1/60,position,{x:0,z:-2},[],()=>true).moving,true);
});
test('blocked movement stops the walking animation and respects the island boundary',()=>{
  const follower=createPreviewFollower();
  const next=follower.step(1/60,{x:0,z:4},{x:0,z:0},[],()=>false);
  assert.equal(next.z,4);assert.equal(next.moving,false);
});
test('following keeps tree and prop hitboxes',()=>{
  const follower=createPreviewFollower(),rock={x:0,z:2,radius:.5};let position={x:0,z:4};
  for(let i=0;i<180;i++){
    position=follower.step(1/60,position,{x:0,z:-2},[rock],()=>true);
    assert.ok(Math.hypot(position.x-rock.x,position.z-rock.z)>=.8);
  }
});
