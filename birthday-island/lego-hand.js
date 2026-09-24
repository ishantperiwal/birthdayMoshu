import * as THREE from 'three';

// A partial torus has open ends by default. Close the finger tips with
// separate flat normals, retaining the faceted LEGO cross-section.
export function legoHandGeometry(){
  const radius=.087,tube=.037,sides=6,arc=Math.PI*1.6;
  const geo=new THREE.TorusGeometry(radius,tube,sides,14,arc);
  const positions=Array.from(geo.attributes.position.array);
  const normals=Array.from(geo.attributes.normal.array);
  const uv=Array.from(geo.attributes.uv.array),indices=Array.from(geo.index.array);
  for(const [angle,sign] of [[0,-1],[arc,1]]){
    const c=Math.cos(angle),s=Math.sin(angle),base=positions.length/3;
    const normal=[-s*sign,c*sign,0];
    positions.push(radius*c,radius*s,0);normals.push(...normal);uv.push(.5,.5);
    for(let i=0;i<sides;i++){
      const v=i/sides*Math.PI*2,radial=radius+tube*Math.cos(v);
      positions.push(radial*c,radial*s,tube*Math.sin(v));
      normals.push(...normal);uv.push(.5+.5*Math.cos(v),.5+.5*Math.sin(v));
    }
    for(let i=0;i<sides;i++){
      const a=base+1+i,b=base+1+(i+1)%sides;
      // Radial-to-Z winding points opposite the torus tangent.
      indices.push(base,...(sign<0?[a,b]:[b,a]));
    }
  }
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);
  return geo;
}
