import * as THREE from 'three';

let sleeveGeometry,laceGeometry,laceMaterial;
function geometries(){
  if(sleeveGeometry)return;
  const profile=new THREE.CatmullRomCurve3([
    [0,-.164],[.068,-.164],[.078,-.149],[.096,-.110],
    [.106,-.060],[.102,-.010],[.088,.025],[.055,.044],[0,.046]
  ].map(([r,y])=>new THREE.Vector3(r,y,0)));
  sleeveGeometry=new THREE.LatheGeometry(profile.getPoints(40).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),32);
  const pieces=[];
  const point=(a,y,r=.075)=>new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);
  // Filled petal scallops keep the eyelet outline, slightly smaller and
  // tipped away from the arm. Merge the trim into one shared mesh.
  const scallopCount=18;
  for(let i=0;i<scallopCount;i++){
    const centre=i*Math.PI*2/scallopCount,outline=new THREE.Shape();
    outline.absellipse(0,0,.015,.011,0,Math.PI*2,false);
    const petal=new THREE.ExtrudeGeometry(outline,{depth:.0015,bevelEnabled:true,bevelSize:.0005,bevelThickness:.0005,bevelSegments:1,steps:1,curveSegments:12});
    const vertices=petal.attributes.position;
    for(let j=0;j<vertices.count;j++){
      const x=vertices.getX(j),y=vertices.getY(j),thickness=vertices.getZ(j);
      const a=centre+x/.077,r=.076+(.011-y)*.38+thickness;
      vertices.setXYZ(j,Math.sin(a)*r,-.161+y,Math.cos(a)*r);
    }
    petal.computeVertexNormals();pieces.push(petal);
  }
  const seam=Array.from({length:48},(_,i)=>point(i/48*Math.PI*2,-.150));
  pieces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam,true),48,.0014,4,true));
  const positions=[],normals=[];
  for(const piece of pieces){
    const flat=piece.index?piece.toNonIndexed():piece;
    positions.push(...flat.attributes.position.array);normals.push(...flat.attributes.normal.array);
    if(flat!==piece)flat.dispose();piece.dispose();
  }
  laceGeometry=new THREE.BufferGeometry();
  laceGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  laceGeometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  laceMaterial=new THREE.MeshStandardMaterial({color:0xffecd6,roughness:.8,emissive:0xffecd6,emissiveIntensity:.04});
}

export function addPuffSleeve(parent,cloth){
  geometries();
  const group=new THREE.Group();group.name='puffed sleeve with scalloped lace';
  const sleeve=new THREE.Mesh(sleeveGeometry,cloth),lace=new THREE.Mesh(laceGeometry,laceMaterial);
  sleeve.castShadow=true;sleeve.receiveShadow=true;lace.receiveShadow=true;
  group.add(sleeve,lace);parent.add(group);return group;
}
