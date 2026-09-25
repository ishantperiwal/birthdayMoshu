import * as THREE from 'three';
export function buildPointMarker(scene){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff4cf';ctx.textAlign='center';ctx.font='500 38px system-ui';
  ctx.shadowColor='#172932';ctx.shadowBlur=8;ctx.fillText('Pointing here',256,47);
  ctx.beginPath();ctx.arc(256,94,7,0,Math.PI*2);ctx.fill();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,opacity:0});
  const marker=new THREE.Sprite(material);marker.scale.set(12,3,1);marker.visible=false;scene.add(marker);
  const origin=new THREE.Vector3();
  return {update(dt,source,direction,on){
    if(on){source.getWorldPosition(origin);origin.y+=1.55;marker.position.copy(origin).addScaledVector(direction,85);marker.position.y+=.72;}
    material.opacity+=((on?1:0)-material.opacity)*(1-Math.exp(-dt*(on?10:4)));
    marker.visible=material.opacity>.01;
  }};
}
