import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canControlWorld,companionMode} from '../control-mode.js';
import {cleanLook,cleanPose} from '../server/protocol.js';
test('companion view gives only MOSHIEE world authority',()=>{
 assert.equal(companionMode,true);assert.equal(canControlWorld('ISHIEE'),false);assert.equal(canControlWorld('MOSHIEE'),true);
});
test('look input is bounded and cannot smuggle positions or interactions',()=>{
 assert.equal(cleanLook({yaw:NaN,pitch:0}),null);
 assert.equal(cleanLook({yaw:0,pitch:Infinity}),null);
 assert.deepEqual(cleanLook({time:50,yaw:1,pitch:9,pointing:true,position:[8,2,3],gift:1}),{time:50,yaw:1,pitch:1.5,pointing:true});
});
test('the authoritative companion pose carries holding state to the viewer',()=>{
 const p=cleanPose({time:100,position:[1,2,3],yaw:1,pitch:0,holding:true,holdReady:true});
 assert.equal(p.holding,true);assert.equal(p.holdReady,true);assert.deepEqual(p.position,[1,2,3]);
});
