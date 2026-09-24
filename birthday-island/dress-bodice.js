import * as THREE from 'three';

// A gently fitted, elliptical bodice, with soft shoulders and a defined waist.
const profile=new THREE.CatmullRomCurve3([
  new THREE.Vector3(.213,.742,.146),
  new THREE.Vector3(.218,.800,.151),
  new THREE.Vector3(.224,.890,.160),
  new THREE.Vector3(.249,1.000,.180),
  new THREE.Vector3(.260,1.090,.181),
  new THREE.Vector3(.248,1.163,.163),
  new THREE.Vector3(.221,1.198,.140),
  new THREE.Vector3(.111,1.212,.111),
],false,'centripetal');

export function birthdayBodice(){
  const positions=[],indices=[],rings=64,sides=64;
  for(let j=0;j<=rings;j++){
    const p=profile.getPoint(j/rings);
    for(let i=0;i<=sides;i++){
      const a=i/sides*Math.PI*2;
      positions.push(Math.sin(a)*p.x,p.y,-Math.cos(a)*p.z);
    }
  }
  for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){
    const a=j*(sides+1)+i,b=a+sides+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}

export function bodiceFront(x,y){
  // Sample the same curve so collar and buttons hug the rounded cloth.
  let low=0,high=1;
  for(let i=0;i<24;i++){
    const middle=(low+high)/2;
    if(profile.getPoint(middle).y<y)low=middle;else high=middle;
  }
  const nearest=profile.getPoint((low+high)/2);
  return -nearest.z*Math.sqrt(Math.max(0,1-(x/nearest.x)**2));
}

// Subdivide and share vertices before bending thin cloth shapes. This keeps
// broad collar/bow faces from shading as a handful of flat triangles.
export function refineClothGeometry(source){
  const raw=source.index?source.toNonIndexed():source;
  const values=raw.attributes.position.array;
  let triangles=[];
  for(let i=0;i<values.length;i+=9)triangles.push([
    Array.from(values.slice(i,i+3)),Array.from(values.slice(i+3,i+6)),Array.from(values.slice(i+6,i+9))
  ]);
  const mid=(a,b)=>a.map((v,i)=>(v+b[i])/2);
  for(let pass=0;pass<2;pass++){
    const next=[];
    for(const [a,b,c] of triangles){
      const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);
      next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);
    }
    triangles=next;
  }
  const positions=[],indices=[],vertices=new Map();
  for(const triangle of triangles)for(const point of triangle){
    const key=point.map(v=>Math.round(v*1e7)).join(',');
    if(!vertices.has(key)){vertices.set(key,positions.length/3);positions.push(...point);}
    indices.push(vertices.get(key));
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);
  if(raw!==source)raw.dispose();source.dispose();
  return geometry;
}
