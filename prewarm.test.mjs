import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('./birthday-island/prewarm.js',import.meta.url),'utf8')).replace("import * as THREE from 'three';",'const THREE={WebGLRenderTarget:class {dispose(){this.disposed=true;}}};');
const {prewarmScene}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
for(const fail of [false,true])test('warmup restores visibility, culling and target '+(fail?'after failure':'after success'),async()=>{
 const texture={isTexture:true},object={visible:false,frustumCulled:true,material:{map:texture,uniforms:{map:{value:texture}}}};
 const scene={traverse:fn=>fn(object)},camera={layers:{mask:1,enableAll(){this.mask=255;}}};
 let target='original',uploads=0,renders=0;
 const renderer={getRenderTarget:()=>target,setRenderTarget:t=>target=t,initTexture:()=>uploads++,compileAsync:async()=>{assert.equal(object.visible,true);if(fail)throw Error('compile');},render(){renders++;assert.equal(object.frustumCulled,false);},getContext:()=>({SYNC_GPU_COMMANDS_COMPLETE:1,fenceSync:()=>null})};
 if(fail)await assert.rejects(prewarmScene(renderer,scene,camera),/compile/);else await prewarmScene(renderer,scene,camera);
 assert.equal(uploads,1);assert.equal(renders,fail?0:1);assert.equal(object.visible,false);assert.equal(object.frustumCulled,true);assert.equal(camera.layers.mask,1);assert.equal(target,'original');
});
