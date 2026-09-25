import * as THREE from 'three';

let faces,back,geometry;
function cardTexture(rank,index){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;
  const c=canvas.getContext('2d');c.fillStyle='#fff4df';c.fillRect(0,0,128,192);
  c.strokeStyle='#d3bea0';c.lineWidth=4;c.strokeRect(3,3,122,186);
  c.fillStyle=index%2?'#b64851':'#25343b';c.font='bold 25px Georgia';c.fillText(rank,12,30);
  c.save();c.translate(116,162);c.rotate(Math.PI);c.fillText(rank,0,0);c.restore();
  c.beginPath();c.moveTo(64,62);c.lineTo(86,96);c.lineTo(64,130);c.lineTo(42,96);c.closePath();c.fill();
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export function buildSeatedCards(){
  if(!faces){
    geometry=new THREE.PlaneGeometry(.145,.215);
    faces=['A','7','K','4','J'].map((rank,i)=>new THREE.MeshStandardMaterial({map:cardTexture(rank,i),roughness:.9}));
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;
    const c=canvas.getContext('2d');c.fillStyle='#fff0d6';c.fillRect(0,0,128,192);c.fillStyle='#65557e';c.fillRect(8,8,112,176);
    c.strokeStyle='#c6b6d6';c.lineWidth=2;
    for(let y=-128;y<192;y+=16){c.beginPath();c.moveTo(8,y);c.lineTo(120,y+112);c.stroke();}
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
    back=new THREE.MeshStandardMaterial({map:t,roughness:.9});
  }
  const fan=new THREE.Group();fan.name='Seated playing cards';
  for(let i=0;i<5;i++){
    const card=new THREE.Group();card.position.set((i-2)*.047,.025-Math.abs(i-2)*.008,i*.002);card.rotation.z=-(i-2)*.13;
    const face=new THREE.Mesh(geometry,faces[i]);face.castShadow=true;card.add(face);
    const reverse=new THREE.Mesh(geometry,back);reverse.rotation.y=Math.PI;reverse.position.z=-.001;card.add(reverse);fan.add(card);
  }
  fan.visible=false;return fan;
}
