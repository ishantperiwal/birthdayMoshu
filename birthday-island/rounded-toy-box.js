import * as THREE from 'three';

// Rounded rectangular solid with flat faces and smooth, shared edge normals.
// Built once, with three small subdivisions across each fillet.
export function roundedToyBox(width,height,depth,radius,topWidth=width){
  const geometry=new THREE.BoxGeometry(width,height,depth,8,8,8);
  const positions=geometry.attributes.position,normals=geometry.attributes.normal;
  const halves=[width/2,height/2,depth/2];
  const grids=halves.map(h=>[-h,-h+radius/3,-h+radius*2/3,-h+radius,0,h-radius,h-radius*2/3,h-radius/3,h]);
  const p=new THREE.Vector3(),core=new THREE.Vector3(),n=new THREE.Vector3();
  const slope=(topWidth/width-1)/height;
  for(let i=0;i<positions.count;i++){
    p.fromBufferAttribute(positions,i);
    for(let axis=0;axis<3;axis++){
      const h=halves[axis],index=Math.round((p.getComponent(axis)/h+1)*4);
      p.setComponent(axis,grids[axis][index]);
      core.setComponent(axis,THREE.MathUtils.clamp(p.getComponent(axis),-h+radius,h-radius));
    }
    n.subVectors(p,core).normalize();p.copy(core).addScaledVector(n,radius);
    const scale=1+slope*(p.y+height/2),originalX=p.x;
    p.x*=scale;
    n.set(n.x/scale,n.y-n.x*originalX*slope/scale,n.z).normalize();
    positions.setXYZ(i,p.x,p.y,p.z);normals.setXYZ(i,n.x,n.y,n.z);
  }
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}
