import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
test('birthday is fixed to midnight September 26 in Ireland',()=>{
  const setting=html.match(/const WELCOME_TIMER='([^']+)'/)[1];
  const fn=html.slice(html.indexOf('      function dublinTime'),html.indexOf('      const relative='));
  const timestamp=runInNewContext(`${fn};dublinTime('${setting}')`);
  assert.equal(new Date(timestamp).toISOString(),'2026-09-25T23:00:00.000Z');
});
test('first message waits, then six messages follow the final three minutes',()=>{
  const expression=html.match(/const index=(left<=180000[^;]+);/)[1];
  const index=left=>runInNewContext(expression,{left});
  assert.equal(index(600000),0);assert.equal(index(180000),0);
  for(let i=0;i<6;i++)assert.equal(index(180000-i*30000),i);
  assert.equal(index(0),5);
});
