import * as THREE from 'three';

export function addPebbleSign(scene,ground,x,z){
  const root=new THREE.Group();root.name='Pebble competition A-frame';
  root.position.set(x,ground(x,z),z);root.rotation.set(.018,-2.48,-.035);scene.add(root);
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=896;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  function paint(){
    ctx.fillStyle='#eee1c9';ctx.fillRect(0,0,768,896);
    ctx.fillStyle='#806749';ctx.globalAlpha=.035;
    for(let i=0;i<2600;i++)ctx.fillRect((i*137.31)%768,(i*79.73)%896,2,1);
    ctx.globalAlpha=1;ctx.save();ctx.translate(384,448);ctx.rotate(-.025);ctx.textAlign='center';
    ctx.fillStyle='#87675c';ctx.font='600 110px "Caveat", "Segoe Print", cursive';ctx.fillText('Defeat me',0,-180);ctx.fillText('and win',0,-65);
    ctx.fillStyle='#a45469';ctx.font='600 210px "Caveat", "Segoe Print", cursive';ctx.fillText('€50',0,145);
    ctx.strokeStyle='#bb7b87';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-155,181);ctx.quadraticCurveTo(0,208,160,175);ctx.stroke();ctx.restore();texture.needsUpdate=true;
  }
  paint();document.fonts?.load('600 110px Caveat').then(paint).catch(()=>{});
  const wood=new THREE.MeshStandardMaterial({color:0x66564e,roughness:.85});
  const faceMat=new THREE.MeshStandardMaterial({map:texture,roughness:1,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.22});
  // Two solid hinged leaves lean apart, with four feet and side stays.
  for(const side of [-1,1]){
    const leaf=new THREE.Group();leaf.position.set(0,.77,side*.15);leaf.rotation.x=-side*.25;root.add(leaf);
    const board=new THREE.Mesh(new THREE.BoxGeometry(.92,1.18,.055),wood);board.castShadow=true;board.receiveShadow=true;leaf.add(board);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(.82,1.07),faceMat);face.position.z=side*.03;if(side<0)face.rotation.y=Math.PI;leaf.add(face);
    for(const dx of [-.39,.39]){const foot=new THREE.Mesh(new THREE.BoxGeometry(.075,.34,.07),wood);foot.position.set(dx,-.70,0);foot.castShadow=true;leaf.add(foot);}
  }
  for(const dx of [-.40,.40]){const stay=new THREE.Mesh(new THREE.BoxGeometry(.035,.035,.47),wood);stay.position.set(dx,.47,0);root.add(stay);}
  const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.88,10),new THREE.MeshStandardMaterial({color:0xa99269,metalness:.45,roughness:.5}));hinge.rotation.z=Math.PI/2;hinge.position.y=1.35;root.add(hinge);
  return root;
}
