import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildChatLog} from '../chat-log.js';
class Element{
  constructor(){this.children=[];this.style={};}
  setAttribute(){}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
  remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
}
test('chat retains both senders, safely displays text, clears independently, and sits above shortcuts',()=>{
  const body=new Element();
  globalThis.document={body,createElement:()=>new Element(),querySelector:selector=>selector==='#bouquet-controls'?{getBoundingClientRect:()=>({left:24,right:310,top:620,width:286,height:40})}:null};
  globalThis.innerHeight=720;globalThis.innerWidth=1280;
  const log=buildChatLog(),root=body.children[0];
  log.show('ISHIEE','<b>Hello</b>',0);log.show('MOSHIEE','😘',1000);log.update(1000);
  assert.equal(root.children.length,2);
  assert.equal(root.children[0].children[0].textContent,'Ishi: ');
  assert.equal(root.children[1].children[0].textContent,'Moshi: ');
  assert.equal(root.children[0].children[1].textContent,'<b>Hello</b>');
  assert.equal(root.style.bottom,'112px');
  log.update(11000);assert.equal(root.children[0].style.opacity,'0.5');
  log.update(12000);assert.equal(root.children.length,1);
  log.update(13000);assert.equal(root.children.length,0);
  for(let i=0;i<8;i++)log.show('ISHIEE',String(i),14000);
  assert.equal(root.children.length,6);
  assert.equal(root.children[0].children[1].textContent,'2');
});
