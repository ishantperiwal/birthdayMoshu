import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBlinkTiming} from '../blink-timing.js';
test('eyes remain open between brief, eased blinks',()=>{
  const blink=createBlinkTiming(()=>.5);
  assert.equal(blink(0),0);assert.equal(blink(4.5),0);
  blink(4.6);assert.equal(blink(4.65),1);
  assert.ok(blink(4.74)>0&&blink(4.74)<1);
  assert.equal(blink(4.8),0);assert.equal(blink(6),0);
});
test('double blinks stop after two and return to a normal pause',()=>{
  const blink=createBlinkTiming(()=>0);blink(0);blink(2.4);
  assert.equal(blink(2.44),1);assert.equal(blink(2.56),0);
  blink(2.69);assert.equal(blink(2.73),1);assert.equal(blink(3),0);assert.equal(blink(4),0);
});
test('characters have independent timing and tolerate long hidden intervals',()=>{
  const a=createBlinkTiming(()=>0),b=createBlinkTiming(()=>1);a(0);b(0);
  a(2.4);assert.equal(a(2.45),1);assert.equal(b(2.45),0);
  a(100);assert.equal(a(100.05),1);assert.equal(a(100.2),0);
});
