import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampWalkPitch,MIN_WALK_PITCH,MAX_WALK_PITCH} from '../look-limits.js';
test('walking view excludes the under-body cone while keeping upward looking',()=>{
  assert.equal(clampWalkPitch(-Math.PI/2),MIN_WALK_PITCH);
  assert.equal(clampWalkPitch(-100),MIN_WALK_PITCH);
  assert.equal(clampWalkPitch(.8),.8);
  assert.equal(clampWalkPitch(100),MAX_WALK_PITCH);
  const bottomRay=MIN_WALK_PITCH-29*Math.PI/180;
  assert.ok(bottomRay>-Math.PI/2+25*Math.PI/180);
});
