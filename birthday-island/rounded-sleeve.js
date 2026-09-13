import * as THREE from 'three';

// Small rolled edges on otherwise straight, flat-ended toy sleeves.
export function roundedSleeve(top,bottom,height,r=.012,edgeHeight=r){
  const half=height/2,profile=[new THREE.Vector2(0,-half)];
  for(let i=0;i<=4;i++){
    const a=-Math.PI/2+i*Math.PI/8;
    profile.push(new THREE.Vector2(bottom-r+r*Math.cos(a),-half+edgeHeight+edgeHeight*Math.sin(a)));
  }
  for(let i=0;i<=4;i++){
    const a=i*Math.PI/8;
    profile.push(new THREE.Vector2(top-r+r*Math.cos(a),half-edgeHeight+edgeHeight*Math.sin(a)));
  }
  profile.push(new THREE.Vector2(0,half));
  return new THREE.LatheGeometry(profile,20);
}
