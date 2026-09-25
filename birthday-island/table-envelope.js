import * as THREE from 'three';

// Folded stationery with a raised wax heart seal.
export const ENDING_NOTE='I love you';
export function addTableEnvelope(table){
  const envelope=new THREE.Group();envelope.name='Ending letter';
  envelope.scale.x=1.45;
  envelope.userData.note=ENDING_NOTE;
  envelope.position.set(-.99,.676,.20);envelope.rotation.y=1.25;
  const paper=new THREE.MeshStandardMaterial({color:0xf8fafc,roughness:.95});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.43,.018,.29),paper);
  body.castShadow=true;body.receiveShadow=true;envelope.add(body);
  const edge=new THREE.Mesh(new THREE.BoxGeometry(.424,.003,.284),new THREE.MeshStandardMaterial({color:0xdce1e7,roughness:1}));
  edge.position.y=-.003;envelope.add(edge);
  function panel(vertices,color){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.95,side:THREE.DoubleSide}));mesh.receiveShadow=true;envelope.add(mesh);
  }
  panel([-.212,.010,-.141,-.212,.010,.141,.025,.012,.02],0xe2e7ed);
  panel([.212,.010,.141,.212,.010,-.141,-.025,.012,.02],0xf5f7fa);
  panel([-.212,.012,.141,.212,.012,.141,0,.014,-.022],0xebeff4);
  // A narrow shadow beneath the closing flap makes its lifted edge readable.
  panel([-.211,.014,-.14,.211,.014,-.14,0,.016,.063],0xc7ced8);
  const fold=new THREE.BufferGeometry();
  fold.setAttribute('position',new THREE.Float32BufferAttribute([-.215,.017,-.145,.215,.017,-.145,0,.019,.055],3));
  fold.computeVertexNormals();
  envelope.add(new THREE.Mesh(fold,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,side:THREE.DoubleSide})));
  // Compress just the paper layers; keep the wax relief solid.
  for(const layer of envelope.children){layer.scale.y*=.33;layer.position.y*=.33;}
  const wax=new THREE.MeshStandardMaterial({color:0x9c3e55,roughness:.48});
  const seal=new THREE.Mesh(new THREE.CylinderGeometry(.036,.041,.012,32),wax);
  seal.position.set(0,.013,.020);seal.castShadow=true;envelope.add(seal);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.030,.0025,6,32),new THREE.MeshStandardMaterial({color:0xc7737e,roughness:.5}));
  rim.rotation.x=-Math.PI/2;rim.position.set(0,.020,.020);envelope.add(rim);
  const heart=new THREE.Shape();heart.moveTo(0,-.019);
  heart.bezierCurveTo(-.007,-.012,-.023,-.002,-.019,.009);
  heart.bezierCurveTo(-.016,.020,-.004,.020,0,.010);
  heart.bezierCurveTo(.004,.020,.016,.020,.019,.009);
  heart.bezierCurveTo(.023,-.002,.007,-.012,0,-.019);
  const emblem=new THREE.Mesh(new THREE.ExtrudeGeometry(heart,{depth:.003,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.0015,bevelThickness:.0015,curveSegments:10}),new THREE.MeshStandardMaterial({color:0xe2a0a0,roughness:.45}));
  emblem.rotation.x=-Math.PI/2;emblem.position.set(0,.021,.020);emblem.castShadow=true;envelope.add(emblem);
  // Keep the seal circular despite the wider envelope proportions.
  for(const part of [seal,rim,emblem])part.scale.x=1/envelope.scale.x;
  // A real note tucked inside, ready for the later opening experience.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f8fafc';ctx.fillRect(0,0,512,320);
  ctx.fillStyle='#70453f';ctx.font='italic 48px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ENDING_NOTE,256,160);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const note=new THREE.Mesh(new THREE.PlaneGeometry(.39,.25),new THREE.MeshStandardMaterial({map:texture,side:THREE.DoubleSide,roughness:1}));
  note.name='Letter inside envelope';note.rotation.x=-Math.PI/2;note.position.y=.001;envelope.add(note);
  table.add(envelope);return envelope;
}
