import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('bubbles fit text, retain its scale, and safely resize between messages and emojis',async()=>{
  const source=await readFile(new URL('../chat-bubbles.js',import.meta.url),'utf8');
  const sprites=[],drawn=[];
  class Vector3{distanceTo(){return 1;}}
  class CanvasTexture{constructor(canvas){this.image=canvas;}dispose(){this.disposed=true;}}
  class Sprite{constructor(material){this.material=material;this.position={y:0};this.scale={set(x,y){this.x=x;this.y=y;}};}}
  globalThis.__bubbleThree={Vector3,CanvasTexture,Sprite,SpriteMaterial:class{constructor(options){Object.assign(this,options);}},MathUtils:{smoothstep:()=>1}};
  globalThis.matchMedia=()=>({matches:true});
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({measureText:t=>({width:t.length*12}),fillText:t=>drawn.push(t)},{get:(o,k)=>o[k]||(()=>{})})})};
  const {buildChatBubbles}=await import('data:text/javascript;base64,'+Buffer.from(source.replace("import * as THREE from 'three';",'const THREE=globalThis.__bubbleThree;')).toString('base64'));
  const anchor={rotation:{x:0},getWorldPosition(p){p.y=0;}};
  const bubbles=buildChatBubbles({scene:{add:s=>sprites.push(s)},camera:{getWorldPosition(){}},getAnchor:()=>anchor,onSound(){}});
  bubbles.show('her','😄',{emoji:true});bubbles.update();
  const emojiTexture=sprites[0].material.map;
  assert.equal(emojiTexture.image.width,192);
  bubbles.show('her','Hello there');bubbles.update();
  assert.notEqual(sprites[0].material.map,emojiTexture);
  assert.equal(emojiTexture.disposed,true);
  const shortWidth=sprites[0].material.map.image.width;
  assert.ok(shortWidth<320,'short text uses less than half the old width');
  assert.equal(sprites[0].scale.x,shortWidth/320,'text pixel size stays consistent');
  const shortTexture=sprites[0].material.map;
  bubbles.show('her','A longer message that needs to wrap across several lines while still staying inside its bubble.');bubbles.update();
  assert.ok(sprites[0].material.map.image.width>shortWidth);
  assert.ok(sprites[0].material.map.image.width<=640);
  assert.ok(sprites[0].material.map.image.height>104);
  assert.equal(shortTexture.disposed,true);
  const textTexture=sprites[0].material.map;
  bubbles.show('her','😮',{emoji:true});bubbles.update();
  assert.equal(textTexture.disposed,true);
  assert.equal(sprites[0].scale.x,.48);
  assert.ok(!drawn.includes('♥'),'no decorative heart in the message');
  delete globalThis.__bubbleThree;
});
