import * as THREE from 'three';

// One continuous hairstyle: sculpted procedural crown and a fitted long nape.
export function guyHairCapGeometry(){
  const segments=192,rings=56,positions=[],indices=[];
  // Repeatable irregular clumps, swept in a shared direction with small changes
  // in width, length and curl. They deform the cap itself, leaving no stacked rim.
  let seed=731;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const tufts=Array.from({length:18},(_,i)=>{
    const a=i*2.399963+.3*(random()-.5),r=.205*Math.sqrt((i+.5)/18);
    return {x:Math.cos(a)*r,z:Math.sin(a)*r,angle:-.5+(random()-.5)*.8,
      length:.14+random()*.10,width:.065+random()*.045,height:.018+random()*.022,curl:(random()-.5)*.055};
  });
  for(let j=0;j<=rings;j++){
    const t=j/rings,theta=Math.min(t/.55,1)*Math.PI/2;
    const radius=.257*Math.sin(theta);
    for(let i=0;i<=segments;i++){
      const angle=i/segments*Math.PI*2,front=(Math.cos(angle)+1)/2;
      // Uneven, swept clumps break up the regular ribbing. Integer angular
      // frequencies keep the organic relief continuous at the wrapped seam.
      const sweep=angle+.16*Math.sin(3*angle)+.055*Math.sin(7*angle)
        +.24*t+.08*Math.sin(5*angle+9*t);
      const locks=Math.pow(.5+.5*Math.cos(19*sweep),3);
      const variation=.55+.45*Math.sin(5*angle-7*t)**2;
      const clumps=.5+.5*Math.sin(11*angle+5*t+1.8*Math.sin(4*angle-6*t));
      const fine=.5+.5*Math.sin(53*angle+13*t+2*Math.sin(9*angle-11*t));
      const relief=(.0055*locks*variation+.0035*clumps+.0015*fine)*Math.pow(Math.sin(theta),3);
      // Stay almost level across the temple and imagined ear, then turn
      // steeply downward behind the ear into the longer, continuous nape.
      const behindEar=THREE.MathUtils.smoothstep(-Math.cos(angle),.12,.48);
      const rearCurve=Math.max(0,-Math.cos(angle))**2;
      const hem=1.642-.07*(1-front)-.17*behindEar-.055*rearCurve
        +.003*(Math.sin(17*angle)+.45*Math.sin(31*angle));
      // The head has straight sides up to its rounded shoulder. Keep the
      // shell outside those sides; a hemisphere alone cuts through the scalp.
      let y=t<=.55?1.685+.085*Math.cos(theta):THREE.MathUtils.lerp(1.685,hem,(t-.55)/.45);
      const x=Math.sin(angle)*radius,z=-Math.cos(angle)*radius;
      let crown=0;
      for(const tuft of tufts){
        const dx=x-tuft.x,dz=z-tuft.z,c=Math.cos(tuft.angle),s=Math.sin(tuft.angle);
        const along=(dz*c+dx*s)/tuft.length+.5;
        if(along<=0||along>=1)continue;
        const width=tuft.width*Math.sin(Math.PI*along)**.65;
        const across=(dx*c-dz*s-tuft.curl*Math.sin(Math.PI*along))/width;
        if(Math.abs(across)>=1)continue;
        const ridge=(1-across*across)**2;
        crown+=tuft.height*ridge*Math.sin(Math.PI*along)**1.3;
      }
      crown*=1-THREE.MathUtils.smoothstep(t,.35,.75);
      y+=crown*(.3+.7*Math.cos(theta));
      // Shallow swept ridges give the exposed shell the same strand direction
      // as the sculpted top, without pushing its troughs inside the scalp.
      const shapedRadius=radius+relief+crown*.35*Math.sin(theta);
      positions.push(Math.sin(angle)*shapedRadius,y,-Math.cos(angle)*shapedRadius);
    }
  }
  // Tuck the thin lower edge just inside the head; no projecting rolled rim.
  for(let i=0;i<=segments;i++){
    const offset=(rings*(segments+1)+i)*3;
    positions.push(positions[offset]*.96,positions[offset+1]+.008,positions[offset+2]*.96);
  }
  for(let j=0;j<=rings;j++)for(let i=0;i<segments;i++){
    const a=j*(segments+1)+i,b=a+segments+1;
    indices.push(a,a+1,b,a+1,b+1,b);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const normals=geometry.attributes.normal,normal=new THREE.Vector3(),other=new THREE.Vector3();
  for(let j=0;j<=rings+1;j++){
    const a=j*(segments+1),b=a+segments;
    normal.fromBufferAttribute(normals,a);other.fromBufferAttribute(normals,b);normal.add(other).normalize();
    normals.setXYZ(a,normal.x,normal.y,normal.z);normals.setXYZ(b,normal.x,normal.y,normal.z);
  }
  normal.set(0,0,0);
  for(let i=0;i<=segments;i++){other.fromBufferAttribute(normals,i);normal.add(other);}
  normal.normalize();
  for(let i=0;i<=segments;i++)normals.setXYZ(i,normal.x,normal.y,normal.z);
  return geometry;
}
