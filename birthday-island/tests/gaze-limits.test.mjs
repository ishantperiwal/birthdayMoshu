import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampGaze,slideGaze} from '../gaze-limits.js';
test('dress view stops above the neck and narrows sideways motion',()=>{
  assert.deepEqual(clampGaze(3,-1),{yaw:.22,pitch:.18});
  assert.equal(clampGaze(-3,.18).yaw,-.22);
  assert.equal(clampGaze(3,1.22).yaw,1.25);
  let previous=0;
  for(let p=.18;p<1.6;p+=.01){const g=clampGaze(3,p);assert.ok(g.yaw>=previous);previous=g.yaw;}
});
test('downward diagonals slide toward the dress inside unchanged limits',()=>{
  for(const side of [-1,1]){
    let gaze={yaw:side*1.25,pitch:1.1};
    for(let i=0;i<120;i++){
      const next=slideGaze(gaze.yaw+side*.02,gaze.pitch-.01,gaze.pitch);
      assert.ok(next.pitch<=gaze.pitch);
      assert.deepEqual(next,clampGaze(next.yaw,next.pitch));
      assert.ok(Math.abs(next.yaw-gaze.yaw)<.04);
      gaze=next;
    }
    assert.equal(gaze.yaw,side*.22);
    assert.ok(gaze.pitch>=.18&&gaze.pitch<.2);
  }
});
test('sideways input still slides toward the sky',()=>{
  const gaze=slideGaze(.24,.4,.4);
  assert.ok(gaze.pitch>.4);
  assert.deepEqual(gaze,clampGaze(gaze.yaw,gaze.pitch));
});
test('dress pan eases toward the end independently of mouse event batching',()=>{
  let pitch=.34,lastStep=.011;
  for(let i=0;i<60;i++){
    const next=slideGaze(0,pitch-.01,pitch).pitch;
    const step=pitch-next;
    assert.ok(step>0&&step<lastStep);
    lastStep=step;pitch=next;
  }
  const batched=slideGaze(0,.34-.6,.34).pitch;
  assert.ok(Math.abs(pitch-batched)<1e-10);
  assert.ok(pitch>.18&&pitch<.185);
});
