import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildPictionary} from '../pictionary.js';
test('local P starts without a socket and can switch to guessing',()=>{
 const elements=new Map();
 const element=()=>({hidden:false,textContent:'',value:'',listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},prepend(child){this.child=child;},focus(){},blur(){},querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);}});
 const prior=globalThis.document;globalThis.document={createElement:element,body:{append(){}}};
 try{
   let drawing=false,cleared=0;
   const game=buildPictionary({gaze:{startDrawing(){drawing=true;},stopDrawing(){drawing=false;},setGame(){},clearInk(){cleared++;}},available:()=>true,user:'MOSHIEE',local:true,online:()=>false,send(){assert.fail('local must not send network events');},clearQueuedInk(){},toast(){assert.fail('local must not require invites');}});
   assert.equal(game.keyDown({code:'KeyP',preventDefault(){}}),true);
   assert.equal(drawing,true);assert.equal(cleared,1);
   const answer=elements.get('.sky-game-word').textContent.slice(6);
   const preview=elements.get('.sky-game-actions').child;preview.listeners.click();
   const input=elements.get('input');assert.equal(input.hidden,false);input.value=answer;
   input.listeners.keydown({code:'Enter',stopPropagation(){},preventDefault(){}});
   assert.equal(elements.get('.sky-game-word').textContent,`You got it! ${answer}`);
   game.keyDown({code:'Escape',preventDefault(){}});assert.equal(drawing,false);
 }finally{globalThis.document=prior;}
});
