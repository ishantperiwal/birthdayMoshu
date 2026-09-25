import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Exercise the real controller with a tiny DOM/transform host. Rendering is
// checked in the browser; these tests cover ownership across camera changes.
const url=new URL('../bouquet-controls.js',import.meta.url);
const source=(await readFile(url,'utf8'))
  .replace("import * as THREE from 'three';",`class Vector3 {
    constructor(x=0,y=0,z=0){this.set(x,y,z);} set(x,y,z){Object.assign(this,{x,y,z});return this;}
    clone(){return new Vector3(this.x,this.y,this.z);} copy(v){return this.set(v.x,v.y,v.z);}
    add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
    setScalar(v){return this.set(v,v,v);}
    applyAxisAngle(axis,a){const x=this.x,z=this.z;this.x=x*Math.cos(a)+z*Math.sin(a);this.z=z*Math.cos(a)-x*Math.sin(a);return this;}
    distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  } const THREE={Vector3}; export {Vector3};`)
  .replace("'./bouquet-motion.js'",JSON.stringify(new URL('../bouquet-motion.js',import.meta.url).href))
  .replace(/'\.\/look-limits\.js[^']*'/,JSON.stringify(new URL('../look-limits.js',import.meta.url).href));
const {buildBouquetControls,Vector3}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function fixture(options={}){
  const elements=[];
  globalThis.document={createElement(){const e={style:{},append(){},addEventListener(type,fn){this[type]=fn;}};elements.push(e);return e;},body:{append(){}}};
  const transform=()=>({position:new Vector3(),rotation:new Vector3(),quaternion:new Vector3(),scale:new Vector3(1,1,1),visible:false});
  const parent={add(o){o.parent=this;}},scene={attach(o){o.parent=this;}};
  const camera={...transform(),parent},playerRig=transform(),avatar={root:transform(),state:'hidden',
    get bouquetActive(){return this.state==='received';},setBouquet(v){this.state=v;},setBouquetView(v){this.armOnly=v;},updateBouquet(){}};
  const companion={anchor:transform(),bodyScale:1.06,holding:false,setBouquet(v){this.state=v;},updateBouquet(){},setBouquetView(){}};
  companion.anchor.position.z=-5;companion.anchor.updateWorldMatrix=()=>{};companion.anchor.localToWorld=v=>v.add(companion.anchor.position);
  const controls=buildBouquetControls({scene,camera,playerRig,avatar,companion,terrainHeight:()=>0,isOnline:false,isMale:false,
    getNetwork:()=>null,isPlaying:()=>true,isBusy:()=>false,clearKeys(){},toast(){},...options});
  const key=code=>controls.keyDown({code,repeat:false,preventDefault(){}});
  return {controls,avatar,companion,key,putAway:()=>elements.find(e=>e.textContent==='Put away').click(),endPreview:()=>elements.find(e=>e.textContent==='End preview').click()};
}
test('local role preview respects bouquet ownership without entering test POV mode',()=>{
  const him=fixture({roleUI:true,isMale:true});
  assert.equal(him.key('KeyV'),false);him.key('KeyB');
  assert.equal(him.controls.shown,true);assert.equal(him.controls.previewing,false);
  assert.equal(him.key('KeyR'),false);him.key('KeyB');assert.equal(him.controls.shown,false);
  const her=fixture({roleUI:true,isMale:false});
  assert.equal(her.key('KeyB'),false);assert.equal(her.key('KeyV'),false);
  her.companion.anchor.position.z=-2;her.controls.sync(true);her.controls.update(2);
  her.key('KeyR');assert.equal(her.controls.received,true);assert.equal(her.controls.previewing,false);
});

test('receiving releases the local movement gate without resetting flowers or teleporting him',()=>{
  const f=fixture();f.key('KeyB');assert.equal(f.controls.previewing,true);
  f.controls.update(2.1);f.key('KeyR');
  assert.equal(f.controls.previewing,false);assert.equal(f.controls.received,true);
  assert.equal(f.avatar.state,'received');assert.equal(f.companion.anchor.position.z,-2.5);
  f.controls.update(2);assert.equal(f.avatar.root.visible,true);
  f.putAway();f.controls.update(2);
  assert.equal(f.avatar.state,'stored');assert.equal(f.controls.previewing,false);assert.equal(f.avatar.root.visible,false);
});
test('his POV and Escape preserve a carried bouquet, without leaving her full body visible',()=>{
  const f=fixture();f.key('KeyB');f.controls.update(2.1);f.key('KeyR');f.controls.update(2);
  f.key('KeyV');f.controls.update(.1);assert.equal(f.controls.hisView,true);
  f.key('Escape');f.controls.update(.1);
  assert.equal(f.controls.previewing,false);assert.equal(f.controls.received,true);assert.equal(f.avatar.armOnly,true);
  f.putAway();f.controls.update(2);assert.equal(f.avatar.root.visible,false);
});
test('receiving from his preview unlocks walking when switching back to her view',()=>{
  const f=fixture();f.key('KeyB');f.key('KeyV');f.controls.update(2.1);f.key('KeyR');
  assert.equal(f.controls.hisView,true);assert.equal(f.controls.received,true);
  f.key('KeyV');assert.equal(f.controls.previewing,false);assert.equal(f.controls.received,true);
});

test('End preview keeps received flowers and resumes normal movement',()=>{
  const f=fixture();f.key('KeyB');f.key('KeyV');f.controls.update(2.1);f.key('KeyR');
  f.endPreview();assert.equal(f.controls.previewing,false);assert.equal(f.controls.received,true);
  assert.equal(f.key('Escape'),false);assert.equal(f.avatar.state,'received');
});
