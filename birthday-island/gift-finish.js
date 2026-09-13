import * as THREE from 'three';

// One baked reflection shared by all presents; no live reflection capture or lights.
export function buildGiftFinish(renderer){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#273444';ctx.fillRect(0,0,256,128);
  for(const [x,y,r,color] of [[58,30,46,'#e8d8b8'],[181,45,33,'#94b7cb'],[120,10,29,'#b8c5c7']]){
    const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,color);gradient.addColorStop(1,'rgba(39,52,68,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,256,128);
  }
  const source=new THREE.CanvasTexture(canvas);source.colorSpace=THREE.SRGBColorSpace;source.mapping=THREE.EquirectangularReflectionMapping;
  const baker=new THREE.PMREMGenerator(renderer),reflection=baker.fromEquirectangular(source);
  source.dispose();baker.dispose();
  return color=>new THREE.MeshPhysicalMaterial({color,roughness:.24,metalness:.24,
    clearcoat:.8,clearcoatRoughness:.24,envMap:reflection.texture,envMapIntensity:1.25,
    emissive:color,emissiveIntensity:.12});
}

export function giftBox(w,h,d,material){
  const bevel=.045,shape=new THREE.Shape(),x=w/2-bevel,y=h/2-bevel;
  shape.moveTo(-x,-y);shape.lineTo(x,-y);shape.lineTo(x,y);shape.lineTo(-x,y);shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:d-2*bevel,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:1});
  geometry.translate(0,0,-d/2+bevel);
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
