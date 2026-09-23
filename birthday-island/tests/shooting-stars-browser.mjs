import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire('/Users/ishant.p/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/meteor-test',route=>route.fulfill({contentType:'text/html',body:'<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"}}</script>'}));
  await page.goto('http://127.0.0.1:4173/meteor-test');
  const result=await page.evaluate(async()=>{
    const THREE=await import('three');
    const {buildShootingStars}=await import('/shooting-stars.js');
    const renderer=new THREE.WebGLRenderer();renderer.setSize(256,128);renderer.setClearColor(new THREE.Color(.08,.12,.20),1);
    const scene=new THREE.Scene();buildShootingStars(scene);
    const camera=new THREE.PerspectiveCamera(60,2,.1,1000);
    const target=new THREE.WebGLRenderTarget(256,128,{type:THREE.HalfFloatType,samples:2});
    renderer.setRenderTarget(target);
    const pixels=new Uint16Array(256*128*4);let samples=0,bright=0;
    for(const size of [1,1.15])for(const fade of [0,.01,.2,.85])for(const direction of [-1,1])for(const offset of [0,.13,.37,.61]){
      for(const mesh of scene.children){const u=mesh.material.uniforms;u.uHead.value.set(28*direction+offset,8,-100);u.uTail.value.set(-28*direction+offset,-8,-110);u.uSize.value=size;u.uFade.value=fade;}
      renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.readRenderTargetPixels(target,0,0,256,128,pixels);
      for(let i=0;i<pixels.length;i+=4)for(let c=0;c<3;c++){
        const v=THREE.DataUtils.fromHalfFloat(pixels[i+c]);if(!Number.isFinite(v))throw new Error('Non-finite shooting-star pixel');
        if(v<[.08,.12,.20][c]-.0001)throw new Error('Shooting star darkened the background');
        if(v>.3)bright++;samples++;
      }
    }
    target.dispose();renderer.dispose();return {samples,bright};
  });
  assert.equal(errors.length,0,errors.join('\n'));assert.ok(result.bright>0,'Glow must actually render');
  console.log(`PASS: ${result.samples} finite color samples; no dark pixels across fade levels, sizes, and directions.`);
  // Exercise the actual sky, multisample resolve, bloom, and film-print pass too.
  await page.route('**/main.js?*',async route=>{
    const response=await route.fetch();
    const probe=`
      window.__checkMeteorComposite=()=>{
        renderer.setAnimationLoop(null);
        const meteors=scene.children.filter(o=>o.material?.uniforms?.uHead);
        camera.updateMatrixWorld(true);const rotation=camera.getWorldQuaternion(new THREE.Quaternion());
        const capture=fade=>{
          for(const o of meteors){const u=o.material.uniforms;u.uHead.value.set(28.37,8,-100).applyQuaternion(rotation);u.uTail.value.set(-27.63,-8,-110).applyQuaternion(rotation);u.uFade.value=fade;u.uSize.value=1.15;}
          renderer.setRenderTarget(sceneTarget);renderer.clear();renderer.render(scene,camera);
          renderBloom();renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
          const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
          gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;
        };
        const baseline=capture(0);let darker=0,brighter=0;
        for(const fade of [.05,.3,.85]){
          const actual=capture(fade);
          for(let i=0;i<actual.length;i+=4){
            const delta=actual[i]+actual[i+1]+actual[i+2]-baseline[i]-baseline[i+1]-baseline[i+2];
            if(delta < -12)darker++;if(delta>12)brighter++;
          }
        }
        return {darker,brighter};
      };`;
    await route.fulfill({response,body:(await response.text())+probe});
  });
  await page.goto('http://127.0.0.1:4173/?inspect&view=zenith');
  await page.waitForFunction(()=>!document.querySelector('#enter').disabled);
  await page.click('#enter');await page.keyboard.press('Digit3');await page.waitForTimeout(2500);
  const composite=await page.evaluate(()=>window.__checkMeteorComposite());
  assert.equal(composite.darker,0,'Meteor must not leave dark spots after bloom and tonemapping');
  assert.ok(composite.brighter>0,'Composite meteor must be visible');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: full island rendering with bloom and tonemapping leaves no dark trail pixels.');
}finally{await browser.close();}
