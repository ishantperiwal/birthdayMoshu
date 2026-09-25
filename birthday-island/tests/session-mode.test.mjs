import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSession} from '../session-mode.js';
const resolve=(search='',hostname='127.0.0.1',hash='')=>resolveSession({search,hostname,hash});
test('local aliases choose real role UI without requiring transport or tokens',()=>{
  for(const [alias,user] of [['ishie','ISHIEE'],['moshie','MOSHIEE'],['ISHIEE','ISHIEE'],['MOSHIEE','MOSHIEE']]){
    for(const key of ['param','user'])assert.deepEqual(resolve(`?${key}=${alias}`),{user,online:false,roleUI:true,localRolePreview:true});
  }
  assert.equal(resolve().roleUI,false);assert.equal(resolve().online,false);
  assert.equal(resolve('?param=unknown').roleUI,false);
});
test('local preview never bypasses hosted authentication or explicit online requests',()=>{
  assert.equal(resolve('?param=moshie','island.example').online,true);
  assert.equal(resolve('?param=ishie&online=1').online,true);
  assert.equal(resolve('?user=ISHIEE','localhost','#invite=sample').online,true);
  assert.equal(resolve('?param=ishie','[::1]').localRolePreview,true);
});
