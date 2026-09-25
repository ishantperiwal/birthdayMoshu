import * as THREE from 'three';

export const SUIT_COLOR=0x26364e;
export const DATE_OUTFIT={shortHair:true,waistMatchesTrousers:true,suit:true,top:SUIT_COLOR,trousers:0x222f43,shoes:0x171d29};

// Small tailored details follow the existing torso and arm rig. No replacement
// body, skeleton, or per-frame geometry is needed for the occasion outfit.
export function dressDateSuit(root,arms){
  const material=(color,roughness=.52)=>new THREE.MeshStandardMaterial({color,roughness,emissive:color,emissiveIntensity:.065,side:THREE.DoubleSide});
  const shirt=material(0xf4ebd9),lapel=material(0x3c506d,.42),tie=material(0x824759,.38),button=material(0x151e2c,.32),shirtButton=material(0xd8ccb6,.3),seam=material(0x18283c);
  // The torso's flat front is at z=-.16. Each panel spans z-.0015 to z+.0055,
  // so these depths stack the layers flush: jacket details and shirt on the
  // torso, lapels and tie on the shirt.
  function panel(name,points,mat,z=-.166){
    const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.004,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.0015,bevelThickness:.0015});
    const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;mesh.position.z=z;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
  panel('cream shirt',[[-.10,1.202],[.10,1.202],[.062,1.02],[0,.916],[-.062,1.02]],shirt);
  for(const side of [-1,1]){
    const mirror=points=>points.map(([x,y])=>[x*side,y]);
    panel('notched jacket lapel',mirror([[.10,1.202],[.18,1.185],[.212,1.092],[.16,1.067],[.199,1.047],[.02,.905],[.072,1.102]]),lapel,-.1735);
  }
  // A bow tie at the neckline: two gently pinched wings and a small centre knot.
  for(const side of [-1,1])panel('burgundy bow tie wing',[[side*.011,1.177],[side*.056,1.197],[side*.064,1.182],[side*.062,1.152],[side*.056,1.139],[side*.011,1.159]].map(([x,y])=>[x,y]),tie,-.1745);
  panel('burgundy bow tie knot',[[-.013,1.182],[.013,1.182],[.011,1.154],[-.011,1.154]],tie,-.1765);
  // Small pearl buttons down the shirt front.
  for(const y of [1.11,1.035,.96]){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.009,12,8),shirtButton);mesh.name='pearl shirt button';mesh.scale.z=.5;mesh.position.set(0,y,-.1690);root.add(mesh);
  }
  panel('jacket closing seam',[[-.004,.909],[.005,.909],[.005,.725],[-.004,.725]],seam,-.166);
  for(const side of [-1,1])panel('jacket pocket',[[side*.12,.819],[side*.231,.831],[side*.231,.814],[side*.12,.802]],lapel,-.166);
  for(const y of [.884,.794]){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.012,10,6),button);mesh.name='horn jacket button';mesh.scale.z=.45;mesh.position.set(.025,y,-.1645);root.add(mesh);
  }
  for(const arm of arms){
    const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.080,.080,.028,16),shirt);cuff.name='cream shirt cuff';cuff.position.y=-.377;cuff.castShadow=true;arm.add(cuff);
  }
}
