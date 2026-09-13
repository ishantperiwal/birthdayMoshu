import * as THREE from 'three';
import { cakeMeshes } from './assets/birthday-cake.js?v=2';

export function addBirthdayCentrepiece(party,boardParent=party){
  const add=(geometry,material,x=0,y=0,z=0,parent=party)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  for(const data of cakeMeshes){
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(data.normals,3));
    geo.setIndex(data.indices);
    add(geo,new THREE.MeshStandardMaterial({color:data.color,roughness:data.roughness,side:THREE.DoubleSide}));
  }
  const cream=new THREE.MeshStandardMaterial({color:0xffe8c6,roughness:.63});
  const hats=[];
  // Just two hats, with a restrained printed pattern and a soft pom-pom.
  for(const [x,z,color] of [[-.99,.13,'#B88091'],[.96,-.30,'#809D9B']]){
    const hat=new THREE.Group();hat.position.set(x,.67,z);party.add(hat);hats.push(hat);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,256,256);
    ctx.fillStyle='#F7DFB3';
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){
      ctx.beginPath();ctx.arc(col*46+(row%2)*23,row*68+20,4,0,Math.PI*2);ctx.fill();
    }
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshStandardMaterial({map,roughness:.72});
    add(new THREE.ConeGeometry(.14,.36,32),material,0,.18,0,hat);
    const hem=add(new THREE.TorusGeometry(.14,.014,6,32),cream,0,.008,0,hat);hem.rotation.x=Math.PI/2;
    add(new THREE.SphereGeometry(.032,12,8),cream,0,.375,0,hat);
  }
  // A little freestanding keepsake board, facing the approach to the cake.
  const board=new THREE.Group();board.position.set(-4.25,0,5.0);board.rotation.y=1.08;boardParent.add(board);
  const wood=new THREE.MeshStandardMaterial({color:0x896a50,roughness:.70});
  add(new THREE.BoxGeometry(1.27,.79,.07),wood,0,1.10,0,board);
  for(const x of [-.45,.45]){
    add(new THREE.BoxGeometry(.055,1.30,.055),wood,x,.65,-.025,board);
    add(new THREE.BoxGeometry(.22,.045,.38),wood,x,.025,-.025,board);
  }
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=600;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#886347';ctx.fillRect(0,0,1024,600);
  ctx.strokeStyle='rgba(51,30,18,.13)';ctx.lineWidth=2;
  for(let y=12;y<600;y+=13){ctx.beginPath();for(let x=0;x<=1024;x+=16){const yy=y+Math.sin(x*.012+y)*2;if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();}
  ctx.strokeStyle='#C4A078';ctx.lineWidth=3;ctx.strokeRect(26,26,972,548);
  ctx.textAlign='center';ctx.fillStyle='#FFF0D0';
  ctx.font='italic 68px Georgia, serif';ctx.fillText('Happy Birthday,',512,230);
  ctx.font='bold 116px Georgia, serif';ctx.fillText('Moshiee!',512,356);
  ctx.fillStyle='#E6C38A';
  for(const [x,y,r] of [[512,106,15],[400,451,8],[624,451,8]]){
    ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.6,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.6,y);ctx.closePath();ctx.fill();
  }
  ctx.font='italic 28px Georgia, serif';ctx.fillStyle='#E8D0AA';ctx.fillText('make a little wish',512,460);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const lettering=new THREE.MeshStandardMaterial({map,roughness:.9,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.12});
  const face=add(new THREE.PlaneGeometry(1.19,.70),lettering,0,1.10,.037,board);face.castShadow=false;
  return {hats};
}
