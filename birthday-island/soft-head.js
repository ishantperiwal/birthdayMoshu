import * as THREE from 'three';

// Subtle taper, retaining the toy cylinder with a softer lower rim.
const halfHeight=.195,bottomRim=.055,topRim=.035;
const lower=-halfHeight+bottomRim,upper=halfHeight-topRim;
// Twelve percent narrower than the original .224 lower-face radius.
const lowerRadius=.224*.88,upperRadius=.245;

function radiusAt(y){
  if(y<lower)return lowerRadius-bottomRim+Math.sqrt(Math.max(0,bottomRim**2-(y-lower)**2));
  if(y>upper)return upperRadius-topRim+Math.sqrt(Math.max(0,topRim**2-(y-upper)**2));
  return THREE.MathUtils.lerp(lowerRadius,upperRadius,(y-lower)/(upper-lower));
}

export function softHeadGeometry(){
  const points=[new THREE.Vector2(0,-halfHeight)];
  for(let i=0;i<=80;i++){
    const y=THREE.MathUtils.lerp(-halfHeight,halfHeight,i/80);
    points.push(new THREE.Vector2(radiusAt(y),y));
  }
  points.push(new THREE.Vector2(0,halfHeight));
  return new THREE.LatheGeometry(points,64);
}

export function softFaceGeometry(){
  const geometry=new THREE.CylinderGeometry(1,1,.34,48,32,true,Math.PI-.86,1.72);
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const radius=radiusAt(p.getY(i))+.0018;
    p.setXYZ(i,p.getX(i)*radius,p.getY(i),p.getZ(i)*radius);
  }
  geometry.computeVertexNormals();return geometry;
}
