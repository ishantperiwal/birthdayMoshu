import * as THREE from 'three';

// One small scenic flypast; no lights, shadows, particle systems or physics.
export function buildLovePlane(scene,{loop=false}={}){
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

  // A plain white banner: "I ♥ you" in the sky message's handwriting, with a
  // drawn heart for "love". Redrawn once the script font has loaded.
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d'),font='700 205px "Dancing Script", "Segoe Script", cursive';
  function drawBanner(){
    ctx.fillStyle='#fbfaf7';ctx.fillRect(0,0,1024,256);
    ctx.fillStyle='#a3344f';ctx.textBaseline='middle';ctx.textAlign='left';ctx.font=font;
    const heart=66,gap=36,widthI=ctx.measureText('I').width,widthYou=ctx.measureText('you').width;
    let cursor=512-(widthI+gap*2+heart*2.4+widthYou)/2;
    ctx.fillText('I',cursor,124);cursor+=widthI+gap+heart*1.2;
    ctx.fillStyle='#c93d5c';ctx.beginPath();ctx.moveTo(cursor,126+heart*.95);
    ctx.bezierCurveTo(cursor+heart*1.35,126+heart*.1,cursor+heart*.95,126-heart*1.1,cursor,126-heart*.42);
    ctx.bezierCurveTo(cursor-heart*.95,126-heart*1.1,cursor-heart*1.35,126+heart*.1,cursor,126+heart*.95);ctx.fill();
    ctx.fillStyle='#a3344f';ctx.fillText('you',cursor+heart*1.2+gap,118);
  }
  drawBanner();
  document.fonts?.load(font).then(()=>{drawBanner();texture.needsUpdate=true;}).catch(()=>{});
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,color:0xffffff});
  const geometry=new THREE.PlaneGeometry(25,6,32,4);
  const banner=new THREE.Mesh(geometry,material);banner.position.set(-23,-.4,0);root.add(banner);
  const original=geometry.attributes.position.array.slice();
  const ropeGeometry=new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-3.9,0,0),new THREE.Vector3(-10.5,2.6,0),
    new THREE.Vector3(-3.9,0,0),new THREE.Vector3(-10.5,-3.4,0)]);
  root.add(new THREE.LineSegments(ropeGeometry,new THREE.LineBasicMaterial({color:0xb7aaa0})));
  // The plane flies only once, for the birthday flypast: a single pass just
  // under the sky message, broadside to the viewer. The old regular loop is
  // kept for inspection views only.
  let special=null,lastTime=0,restingCycle=-1;
  const cycleOf=time=>Math.floor((time+86)/220);
  function flyPast(center,eye,{below=11,closer=10,speed=13,from=-135,to=150}={}){
    const toward=new THREE.Vector3(eye.x-center.x,0,eye.z-center.z).normalize();
    const along=new THREE.Vector3(toward.z,0,-toward.x);
    special={base:center.clone().addScaledVector(toward,closer).setY(center.y-below),along,start:lastTime,speed,from,to};
  }
  return {flyPast,get passing(){return special?root.position:null;},update(time,night){
    lastTime=time;
    if(special){
      const distance=special.from+(time-special.start)*special.speed;
      if(distance>special.to){special=null;restingCycle=cycleOf(time);}
      else{
        root.visible=true;
        root.position.copy(special.base).addScaledVector(special.along,distance);root.position.y+=Math.sin(time*.15)*.6;
        root.rotation.y=Math.atan2(-special.along.z,special.along.x);
      }
    }
    if(!special){
      // Cross the northern sea broadside, then stay beyond the camera's far plane
      // for a quiet interval before the next pass. Never reset in visible sky.
      const phase=(time+86)%220;
      root.visible=loop&&phase<180&&cycleOf(time)!==restingCycle;
      if(!root.visible)return;
      root.position.set(-800+phase*9,49+Math.sin(time*.15)*.6,-155);root.rotation.y=0;
    }
    root.rotation.x=Math.sin(time*.22)*.025;
    prop.rotation.x=time*30;
    material.color.setScalar(1-night*.08);
    const p=geometry.attributes.position;
    for(let i=0;i<p.count;i++){
      // A travelling ripple that grows toward the free end of the banner.
      const x=original[i*3],y=original[i*3+1],tail=(12.5-x)/25,amp=.15+tail*.85;
      p.setXYZ(i,x,y+Math.sin(tail*6.5-time*2.9)*.4*amp,
        Math.sin(tail*8-time*3.2)*1.05*amp+Math.sin(y*.8+tail*5-time*2.1)*.18*amp);
    }
    p.needsUpdate=true;
  }};
}
