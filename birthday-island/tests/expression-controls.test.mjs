import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildExpressionControls} from '../expression-controls.js';
class Element{
  constructor(){this.children=[];this.attributes={};this.handlers={};this.style={setProperty(){}};}
  append(...children){this.children.push(...children);}
  setAttribute(key,value){this.attributes[key]=value;}
  addEventListener(key,handler){this.handlers[key]=handler;}
  click(){if(!this.disabled)this.handlers.click?.();}
}
globalThis.document={createElement:()=>new Element()};
function fixture(options={}){
  const container=new Element(),calls=[];
  const controls=buildExpressionControls({container,onSelect:(...args)=>calls.push(args),...options});
  const panel=container.children[0],target=panel.children[0].children[1],buttons=panel.children[1].children;
  return {controls,panel,target,buttons,calls};
}
test('local chat controls default to him, preserve separate choices, and never submit text',()=>{
  const f=fixture();f.buttons[2].click();assert.deepEqual(f.calls,[['ISHIEE','surprised']]);
  assert.equal(f.buttons[2].attributes['data-timed'],'true');
  assert.ok(f.buttons.every(b=>b.type==='button'));
  f.controls.setTarget('MOSHIEE');f.buttons[1].click();
  assert.deepEqual(f.calls[1],['MOSHIEE','happy']);
  f.controls.setTarget('ISHIEE');assert.equal(f.buttons[2].attributes['data-timed'],'true');
  f.controls.setMode(true);assert.equal(f.panel.hidden,true);
});
test('online controls target the signed-in character and reflect snapshots',()=>{
  const f=fixture({isOnline:true,user:'MOSHIEE'});assert.equal(f.target.hidden,true);
  f.buttons[3].click();assert.deepEqual(f.calls,[['MOSHIEE','sad']]);
  f.controls.sync({MOSHIEE:'surprised'});assert.equal(f.buttons[2].attributes['data-timed'],'true');
  f.controls.setConnected(false);f.buttons[1].click();assert.equal(f.calls.length,1);
  f.controls.setConnected(true);f.buttons[0].click();assert.deepEqual(f.calls[1],['MOSHIEE','normal']);
});
test('a rejected selection leaves the active expression unchanged',()=>{
  const f=fixture({onSelect:()=>false});f.buttons[1].click();
  assert.equal(f.buttons[0].attributes['data-timed'],'false');assert.equal(f.buttons[1].attributes['data-timed'],'false');
});
test('expressions expire, repeated selections restart, and normal has no timer',()=>{
  let time=1000;const f=fixture({now:()=>time});
  assert.equal(f.buttons.length,4);
  f.buttons[1].click();time=3500;f.controls.update();assert.equal(f.buttons[1].attributes['data-timed'],'true');
  f.buttons[1].click();time=7000;f.controls.update();assert.equal(f.buttons[1].attributes['data-timed'],'true');
  time=7501;f.controls.update();assert.equal(f.buttons[0].attributes['data-timed'],'false');
  assert.equal(f.buttons[0].attributes['data-timed'],'false');
  f.controls.sync({ISHIEE:'sad'},{ISHIEE:7000});assert.equal(f.buttons[0].attributes['data-timed'],'false');
});
test('local message preview follows the selected character and is absent online',()=>{
  const calls=[],f=fixture({onPreviewMessage:user=>calls.push(user)});
  const button=f.panel.children.find(c=>c.className==='preview-message');
  assert.equal(button.type,'button');button.click();assert.deepEqual(calls,['ISHIEE']);
  f.controls.setTarget('MOSHIEE');button.click();assert.deepEqual(calls,['ISHIEE','MOSHIEE']);
  const online=fixture({isOnline:true,onPreviewMessage(){throw Error('must not be callable');}});
  assert.equal(online.panel.children.some(c=>c.className==='preview-message'),false);
});

test('minimal actions have no selected state and hide the character picker',()=>{
  const f=fixture();assert.equal(f.panel.children[0].hidden,true);
  f.buttons[1].click();assert.ok(f.buttons.every(b=>b.attributes['aria-pressed']===undefined));
});
