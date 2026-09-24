import * as THREE from 'three';

// A narrow waist opens gently toward a generously rounded shoulder rim.
const BODICE_RADIUS=.203;
export const BIRTHDAY_WAIST_RADIUS=.164;
export const BIRTHDAY_WAIST_Y=.85;
const BODICE_TOP=1.212,TOP_ROUND=.055;
function walkingRadius(y){
  const shoulder=BODICE_TOP-TOP_ROUND;
  if(y<=shoulder){
    const t=THREE.MathUtils.clamp((y-BIRTHDAY_WAIST_Y)/(shoulder-BIRTHDAY_WAIST_Y),0,1);
    return THREE.MathUtils.lerp(BIRTHDAY_WAIST_RADIUS,BODICE_RADIUS,t*t*(3-2*t));
  }
  const rise=THREE.MathUtils.clamp(y-shoulder,0,TOP_ROUND);
  return BODICE_RADIUS-TOP_ROUND+Math.sqrt(Math.max(0,TOP_ROUND*TOP_ROUND-rise*rise));
}
function frontFullness(x,y){
  // Soft shaping in the cloth, fading out above the bust and into the waist.
  const rise=Math.exp(-Math.pow((y-1.095)/.065,2));
  return .026*rise*(.72+.28*(1-Math.exp(-Math.pow(x/.06,2))));
}
function surfacePoint(a,y,offset=0){
  const r=walkingRadius(y)+offset,x=Math.sin(a)*r,front=Math.max(0,-Math.cos(a));
  return new THREE.Vector3(x,y,Math.cos(a)*r-frontFullness(x,y)*front*front);
}
export function necklinePoint(a){
  const front=Math.max(0,-Math.cos(a));
  // Two gentle rises meet in a shallow sweetheart dip at the centre front.
  const y=BODICE_TOP-.055+.014*front**2-.042*front**4*Math.exp(-Math.pow(Math.sin(a)/.26,2));
  return surfacePoint(a,y,.001);
}
function necklineSurface(skin=false){
  const positions=[],uvs=[],indices=[],sides=96,rings=32;
  const bottom=BIRTHDAY_WAIST_Y-.058;
  for(let j=0;j<=rings;j++)for(let i=0;i<=sides;i++){
    const a=i/sides*Math.PI*2,edge=necklinePoint(a).y;
    const y=THREE.MathUtils.lerp(skin?edge:bottom,skin?BODICE_TOP:edge,j/rings),p=surfacePoint(a,y);
    positions.push(p.x,y,p.z);uvs.push(i/sides,(y-bottom)/(BODICE_TOP-bottom));
  }
  for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,a+1,b,a+1,b+1,b);}
  if(skin){
    const centre=positions.length/3;positions.push(0,BODICE_TOP,0);uvs.push(.5,1);
    for(let i=0;i<sides;i++)indices.push(centre,rings*(sides+1)+i,rings*(sides+1)+i+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
export function birthdayNecklineSkin(){return necklineSurface(true);}
const originalProfile=new THREE.CatmullRomCurve3([
  [.213,.742,.146],[.218,.800,.151],[.224,.890,.160],[.249,1,.180],
  [.260,1.090,.181],[.248,1.163,.163],[.221,1.198,.140],[.111,1.212,.111]
].map(p=>new THREE.Vector3(...p)),false,'centripetal');
export function birthdayBodice(stargazing=false){
  if(stargazing){
    const positions=[],indices=[],rings=64,sides=64;
    for(let j=0;j<=rings;j++){const p=originalProfile.getPoint(j/rings);for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;positions.push(Math.sin(a)*p.x,p.y,-Math.cos(a)*p.z);}}
    for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,b,a+1,a+1,b,b+1);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }
  return necklineSurface(false);
}

export function bodiceFront(x,y,stargazing=false){
  if(stargazing){let low=0,high=1;for(let i=0;i<24;i++){const middle=(low+high)/2;if(originalProfile.getPoint(middle).y<y)low=middle;else high=middle;}const p=originalProfile.getPoint((low+high)/2);return -p.z*Math.sqrt(Math.max(0,1-(x/p.x)**2));}
  const radius=walkingRadius(y);
  const front=Math.sqrt(Math.max(0,1-(x/radius)**2));
  return -radius*front-frontFullness(x,y)*front*front;
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
