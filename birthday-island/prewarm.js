import * as THREE from 'three';

const yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,16));

// Run with the game loop paused, beneath the welcome screen. Never simulate
// interactions: only upload and draw resources, then restore all scene state.
export async function prewarmScene(renderer,scene,camera,{onProgress=()=>{}}={}){
  const textures=new Set(),saved=[];
  const upload=value=>{if(value?.isTexture)textures.add(value);};
  scene.traverse(object=>{
    saved.push([object,object.visible,object.frustumCulled]);
    for(const material of [object.material].flat()){
      if(!material)continue;
      for(const value of Object.values(material))upload(value);
      for(const uniform of Object.values(material.uniforms||{}))upload(uniform?.value);
    }
  });
  const target=renderer.getRenderTarget(),layers=camera.layers.mask;
  const scratch=new THREE.WebGLRenderTarget(64,64);
  try{
    const list=[...textures];
    for(let i=0;i<list.length;i++){
      renderer.initTexture(list[i]);
      onProgress(.5*(i+1)/Math.max(1,list.length));
      if(i%4===3)await yieldFrame();
    }
    for(const [object] of saved){object.visible=true;object.frustumCulled=false;}
    camera.layers.enableAll();
    await renderer.compileAsync(scene,camera);
    onProgress(.8);await yieldFrame();
    renderer.setRenderTarget(scratch);
    renderer.render(scene,camera);
    // Give queued GPU uploads/draws time to complete without blocking the CPU.
    const gl=renderer.getContext();
    const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);
    if(fence){
      gl.flush();
      try{
        const deadline=performance.now()+15000;
        while(!gl.isContextLost()&&performance.now()<deadline){
          const result=gl.clientWaitSync(fence,0,0);
          if(result!==gl.TIMEOUT_EXPIRED)break;
          await yieldFrame();
        }
      }finally{gl.deleteSync(fence);}
    }
    onProgress(1);
  }finally{
    for(const [object,visible,culled] of saved){object.visible=visible;object.frustumCulled=culled;}
    camera.layers.mask=layers;renderer.setRenderTarget(target);scratch.dispose();
  }
}
