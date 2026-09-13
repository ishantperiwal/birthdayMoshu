import * as THREE from 'three';
export const MONEY_TIERS={
  small:{amount:500,scale:.48,color:0x378971,label:'SMALL GIFT'},
  medium:{amount:1500,scale:.66,color:0x385f99,label:'MEDIUM GIFT'},
  large:{amount:5000,scale:.87,color:0x954e79,label:'GRAND GIFT'}
};
// Deliberately not spawned or counted until their hiding places are chosen.
export const LEGENDARY_RESERVE={budget:4000,gifts:[{amount:2000,tier:'legendary',pos:null},{amount:2000,tier:'legendary',pos:null}]};
export const rupees=value=>'₹'+value.toLocaleString('en-IN');
export function decorateMoneyGift(group,data){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#F1DCAD';ctx.fillRect(0,0,512,256);
  ctx.strokeStyle='#AB844B';ctx.lineWidth=8;ctx.strokeRect(10,10,492,236);
  ctx.fillStyle='#665038';ctx.textAlign='center';ctx.font='bold 86px Georgia, serif';ctx.fillText(rupees(data.amount),256,139);
  ctx.font='22px sans-serif';ctx.fillText(data.tier==='large'?'A GRAND LITTLE WISH':'SOMETHING JUST FOR YOU',256,200);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshStandardMaterial({map,roughness:.58,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.1});
  for(const side of [-1,1]){
    const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.70,.35),mat);plaque.position.set(0,.48,side*.515);plaque.rotation.y=side<0?Math.PI:0;group.add(plaque);
  }
  const gold=new THREE.MeshStandardMaterial({color:0xe0bd75,metalness:.28,roughness:.4});
  // A coin seal on top distinguishes the money presents without loose bills.
  const coinCanvas=document.createElement('canvas');coinCanvas.width=coinCanvas.height=128;
  const coinCtx=coinCanvas.getContext('2d');coinCtx.fillStyle='#DFBD79';coinCtx.fillRect(0,0,128,128);
  coinCtx.strokeStyle='#A57A3C';coinCtx.lineWidth=3;coinCtx.beginPath();coinCtx.arc(64,64,54,0,Math.PI*2);coinCtx.stroke();
  coinCtx.fillStyle='#8D6634';coinCtx.font='bold 72px Georgia';coinCtx.textAlign='center';coinCtx.fillText('₹',64,89);
  const coinMap=new THREE.CanvasTexture(coinCanvas);coinMap.colorSpace=THREE.SRGBColorSpace;
  const coinFace=new THREE.MeshStandardMaterial({map:coinMap,metalness:.2,roughness:.44});
  const seal=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.034,24),[gold,coinFace,gold]);seal.position.y=1.08;group.add(seal);
  if(data.tier==='large'){
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.09),new THREE.MeshStandardMaterial({color:0xf5ce8c,metalness:.18,roughness:.25}));gem.position.y=1.16;group.add(gem);
  }
}
