import * as THREE from 'three';

// One small scenic flypast; no lights, shadows, particle systems or physics.
export function buildLovePlane(scene){
  const root=new THREE.Group();scene.add(root);
  const red=new THREE.MeshStandardMaterial({color:0xb74743,roughness:.38,emissive:0x702921,emissiveIntensity:.22});
  const cream=new THREE.MeshStandardMaterial({color:0xffe4ac,roughness:.5,emissive:0x8b7246,emissiveIntensity:.2});
  const dark=new THREE.MeshStandardMaterial({color:0x293d49,roughness:.3});
  function mesh(geometry,material,x,y,z){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);root.add(m);return m;}
  mesh(new THREE.SphereGeometry(1,16,10),red,0,0,0).scale.set(4.1,.8,.85);
  mesh(new THREE.BoxGeometry(2,.17,10.5),cream,-.15,.05,0);
  mesh(new THREE.BoxGeometry(1.7,.14,4.2),cream,-3.1,.28,0);
  const fin=mesh(new THREE.SphereGeometry(1,10,6),red,-3.1,.95,0);fin.scale.set(.9,1.25,.12);
  mesh(new THREE.SphereGeometry(1,12,8),dark,.65,.68,0).scale.set(1.05,.48,.62);
  const prop=new THREE.Group();prop.position.x=4.05;root.add(prop);
  const hub=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),cream);prop.add(hub);
  const blade=new THREE.Mesh(new THREE.BoxGeometry(.12,3,.18),dark);prop.add(blade);

  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff0cc';ctx.fillRect(0,0,1024,256);
  ctx.strokeStyle='#b75b62';ctx.lineWidth=8;ctx.strokeRect(18,18,988,220);
  ctx.fillStyle='#983e51';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='italic bold 130px Georgia';ctx.fillText('I love you',512,132);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,color:0xffffff});
  const geometry=new THREE.PlaneGeometry(25,6,32,4);
  const banner=new THREE.Mesh(geometry,material);banner.position.set(-23,-.4,0);root.add(banner);
  const original=geometry.attributes.position.array.slice();
  const ropeGeometry=new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-3.9,0,0),new THREE.Vector3(-10.5,2.6,0),
    new THREE.Vector3(-3.9,0,0),new THREE.Vector3(-10.5,-3.4,0)]);
  root.add(new THREE.LineSegments(ropeGeometry,new THREE.LineBasicMaterial({color:0xb7aaa0})));
  return {update(time,night){
    // Cross the northern sea broadside, then stay beyond the camera's far plane
    // for a quiet interval before the next pass. Never reset in visible sky.
    const phase=(time+86)%220;
    root.visible=phase<180;
    if(!root.visible)return;
    root.position.set(-800+phase*9,49+Math.sin(time*.15)*.6,-155);
    root.rotation.x=Math.sin(time*.22)*.025;
    prop.rotation.x=time*30;
    material.color.setScalar(1-night*.18);
    const p=geometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=original[i*3],y=original[i*3+1],tail=(12.5-x)/25;
      p.setXYZ(i,x,y+Math.sin(tail*7+time*2.2)*.24*tail,
        Math.sin(tail*9+time*2.5)*.65*tail+Math.sin(y*.7+tail*5+time*1.7)*.12*tail);
    }
    p.needsUpdate=true;
  }};
}
