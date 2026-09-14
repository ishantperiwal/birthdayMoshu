import * as THREE from 'three';

// One continuous molded shape: a swept crown, soft side part and fitted nape.
export function shortHairGeometry(){
  const segments=72,rings=28,positions=[],indices=[];
  for(let j=0;j<=rings;j++){
    const t=j/rings,theta=t*Math.PI/2,s=Math.sin(theta),c=Math.cos(theta);
    for(let i=0;i<=segments;i++){
      const a=i/segments*Math.PI*2,front=Math.max(0,Math.cos(a));
      const angle=Math.atan2(Math.sin(a),Math.cos(a));
      const fringe=Math.exp(-(((angle+.38)/.48)**2));
      const hem=1.515+.155*front**3+.025*Math.abs(Math.sin(a))-.048*fringe;
      // Gentle broad waves converge into the crown, with a shallow side part.
      const sweep=.018*Math.sin(a-.4)*s*c;
      const part=.009*Math.exp(-(((angle-.55-t*.25)/.14)**2))*s*c;
      const radius=.277+.009*front*Math.sin(t*Math.PI)-part;
      positions.push(Math.sin(a)*radius*s-.027*c*c,
        hem+(1.825-hem)*c+sweep-part,
        -Math.cos(a)*radius*s+.008*c);
    }
  }
  // A narrow rolled lip tucks into the head rather than leaving a cut edge.
  for(let i=0;i<=segments;i++){
    const offset=(rings*(segments+1)+i)*3;
    positions.push(positions[offset]*.925,positions[offset+1]+.013,positions[offset+2]*.925);
  }
  for(let j=0;j<=rings;j++)for(let i=0;i<segments;i++){
    const a=j*(segments+1)+i,b=a+segments+1;
    indices.push(a,a+1,b,a+1,b+1,b);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
  // Match normals at the wrapped seam and crown for uninterrupted highlights.
  const n=g.attributes.normal,v=new THREE.Vector3(),w=new THREE.Vector3();
  for(let j=0;j<=rings+1;j++){
    const a=j*(segments+1),b=a+segments;
    v.fromBufferAttribute(n,a);w.fromBufferAttribute(n,b);v.add(w).normalize();
    n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);
  }
  for(let i=0;i<=segments;i++)n.setXYZ(i,0,1,0);
  return g;
}
