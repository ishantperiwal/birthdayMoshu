import * as THREE from 'three';

// A fine silver chain follows the neck's own transform and proportions.
export function addBirthdayChoker(neck){
  const group=new THREE.Group();group.name='fine silver pearl necklace';group.position.y=-.004;neck.add(group);
  const silver=new THREE.MeshStandardMaterial({color:0xe5eaf2,metalness:.65,roughness:.22,emissive:0xcbd9f0,emissiveIntensity:.12});
  const pearl=new THREE.MeshStandardMaterial({color:0xfff0e4,roughness:.22,metalness:.12,emissive:0xffe8df,emissiveIntensity:.12});
  const chainPoints=Array.from({length:48},(_,i)=>{
    const a=i/48*Math.PI*2,front=(1-Math.cos(a))/2,r=.114+.003*front;
    return new THREE.Vector3(Math.sin(a)*r,.010-.014*front,Math.cos(a)*r);
  });
  const chain=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chainPoints,true),64,.002,6,true),silver);
  group.add(chain);
  const setting=new THREE.Mesh(new THREE.TorusGeometry(.010,.0018,6,20),silver);
  setting.position.set(0,-.010,-.118);setting.scale.y=1.15;group.add(setting);
  const stone=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),pearl);
  stone.scale.set(.008,.0095,.005);stone.position.set(0,-.010,-.121);group.add(stone);
  return group;
}
