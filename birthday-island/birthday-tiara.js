import * as THREE from 'three';

// Two merged meshes keep the delicate metalwork inexpensive to render.
export function addBirthdayTiara(parent){
  const metal=[],stones=[];
  const point=(a,rise=0)=>new THREE.Vector3(.29*Math.sin(a),1.79-.055*Math.sin(a)**2+rise,-.275*Math.cos(a));
  function wire(points,radius=.0045){
    metal.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,radius,5,false));
  }
  wire(Array.from({length:25},(_,i)=>point(-1.32+i/24*2.64)),.006);
  wire(Array.from({length:25},(_,i)=>point(-1.28+i/24*2.56,.018)),.0035);
  for(let i=-2;i<=2;i++){
    const a=i*.43,height=.145-Math.abs(i)*.026;
    // Five pointed petal arches, tallest at the centre.
    wire([point(a-.21,.012),point(a-.13,height*.57),point(a,height),point(a+.13,height*.57),point(a+.21,.012)]);
    wire([point(a,.018),point(a,height*.28),point(a,height*.46)],.0025);
    const gem=new THREE.OctahedronGeometry(1,0);
    gem.scale(i===0?.018:.013,i===0?.031:.024,.012);
    gem.rotateY(-a);const centre=point(a,height*.59);gem.translate(centre.x,centre.y,centre.z-.004);stones.push(gem);
    const bead=new THREE.SphereGeometry(.007,8,6),tip=point(a,height);bead.translate(tip.x,tip.y,tip.z);metal.push(bead);
  }
  for(let i=-4;i<=4;i++){
    const gem=new THREE.OctahedronGeometry(.0065,0),p=point(i*.27,.009);
    gem.translate(p.x,p.y,p.z-.005);stones.push(gem);
  }
  function combine(parts,material,name){
    const positions=[],normals=[];
    for(const source of parts){
      const geometry=source.index?source.toNonIndexed():source;
      positions.push(...geometry.attributes.position.array);normals.push(...geometry.attributes.normal.array);
      if(geometry!==source)geometry.dispose();source.dispose();
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.castShadow=true;tiara.add(mesh);
  }
  const tiara=new THREE.Group();tiara.name='birthday tiara';parent.add(tiara);
  // Shrink around the front band so its fit on the hair stays seated.
  tiara.scale.setScalar(.85);tiara.position.set(0,1.79*.15,-.275*.15);
  combine(metal,new THREE.MeshStandardMaterial({color:0xe5eaf2,metalness:.72,roughness:.16,emissive:0xcbd9f0,emissiveIntensity:.22}),'polished silver tiara');
  combine(stones,new THREE.MeshPhysicalMaterial({color:0xffeff8,metalness:.15,roughness:.08,clearcoat:1,clearcoatRoughness:.04,emissive:0xffe5f2,emissiveIntensity:.48,flatShading:true}),'faceted blush crystals');
  return tiara;
}
