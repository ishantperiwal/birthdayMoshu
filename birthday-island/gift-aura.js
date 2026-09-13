import * as THREE from 'three';

// Shared soft annulus: a feathered pool of light, with no extra real lights.
const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(128,128);
for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const r=Math.hypot((x-63.5)/63.5,(y-63.5)/63.5),d=r-.62;
  const alpha=.65*Math.exp(-d*d/.0018)+.26*Math.exp(-d*d/.017);
  const i=(y*128+x)*4;
  pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;
  pixels.data[i+3]=Math.round(alpha*255);
}
ctx.putImageData(pixels,0,0);
const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
const geometry=new THREE.PlaneGeometry(3.5,3.5);
export function addGiftAura(group,color){
  const material=new THREE.MeshBasicMaterial({map:texture,
    color:new THREE.Color(color).lerp(new THREE.Color(0xffdda0),.68),
    transparent:true,opacity:.55,blending:THREE.AdditiveBlending,
    depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const ring=new THREE.Mesh(geometry,material);
  ring.rotation.x=-Math.PI/2;ring.position.y=.18;group.add(ring);
  return material;
}
