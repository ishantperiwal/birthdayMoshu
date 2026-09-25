import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

test('seated looking moves only the camera and clamps both axes',async()=>{
  const source=await readFile(new URL('../grass-seat.js',import.meta.url),'utf8');
  const body=source.slice(source.indexOf('look(dx,dy){')+'look(dx,dy){'.length,source.indexOf('  },update(){'));
  const player={rotation:{x:0,y:-Math.PI,z:0}},cameraPivot={rotation:{x:-.06,y:0}};
  const look=runInNewContext(`(dx,dy)=>{${body}}`,{player,cameraPivot,THREE:{MathUtils:{clamp:(x,a,b)=>Math.max(a,Math.min(b,x))}}});
  look(10000,-10000);
  assert.equal(cameraPivot.rotation.y,-.42);assert.equal(cameraPivot.rotation.x,.22);
  look(-20000,20000);
  assert.equal(cameraPivot.rotation.y,.42);assert.equal(cameraPivot.rotation.x,-.35);
  assert.deepEqual(player.rotation,{x:0,y:-Math.PI,z:0});
});
