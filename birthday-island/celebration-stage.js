import * as THREE from 'three';
export const STAGE_HEIGHT=.12;
export const STAGE_RADIUS=3.02;

export function buildCelebrationStage(scene,groundY){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const ctx=canvas.getContext('2d');
  // Quiet, staggered oak boards. Geometry stays one rounded disc.
  const tones=['#B79772','#B2926D','#BA9A74','#B49571'];
  for(let row=0;row<14;row++){
    const y=row*76;ctx.fillStyle=tones[row%4];ctx.fillRect(0,y,1024,76);
    ctx.fillStyle='rgba(69,49,34,.22)';ctx.fillRect(0,y,1024,2);
    const joint=170+(row*173)%650;ctx.fillRect(joint,y,2,76);
    ctx.strokeStyle='rgba(102,72,45,.095)';ctx.lineWidth=1;
    for(let line=0;line<7;line++){
      ctx.beginPath();
      for(let x=0;x<=1024;x+=12){
        const yy=y+9+line*9+Math.sin(x*.015+row+line)*1.8;
        if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);
      }ctx.stroke();
    }
  }
  // A narrow circular border visually finishes the deck without a raised rail.
  ctx.strokeStyle='#A38360';ctx.lineWidth=14;ctx.beginPath();ctx.arc(512,512,501,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='rgba(239,211,170,.40)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(512,512,491,0,Math.PI*2);ctx.stroke();
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const top=new THREE.MeshStandardMaterial({map,roughness:.78});
  const edge=new THREE.MeshStandardMaterial({color:0x957553,roughness:.82});
  // Beveled outer lip: almost flush with the clearing, comfortably walkable.
  const profile=[new THREE.Vector2(0,.005),new THREE.Vector2(STAGE_RADIUS-.025,.005),
    new THREE.Vector2(STAGE_RADIUS,.028),new THREE.Vector2(STAGE_RADIUS,STAGE_HEIGHT-.025),
    new THREE.Vector2(STAGE_RADIUS-.025,STAGE_HEIGHT),new THREE.Vector2(0,STAGE_HEIGHT)];
  const rim=new THREE.Mesh(new THREE.LatheGeometry(profile,128),edge);rim.position.set(-8,groundY,-10);
  rim.castShadow=true;rim.receiveShadow=true;scene.add(rim);
  const face=new THREE.Mesh(new THREE.CircleGeometry(STAGE_RADIUS-.025,128),top);
  face.rotation.x=-Math.PI/2;face.rotation.z=.12;face.position.set(-8,groundY+STAGE_HEIGHT+.001,-10);
  face.receiveShadow=true;scene.add(face);
}
