import * as THREE from 'three';

// Small, solid toy flowers. Build once and batch all colored parts into one
// mesh; every character shares the finished geometry and materials.
export function makeBouquetDesign({spread=1}={}){
  const root=new THREE.Group();root.name='Tulips for her';
  const parts=new THREE.Group(),placeholder=new THREE.MeshBasicMaterial();
  const sphere=new THREE.SphereGeometry(1,12,8),up=new THREE.Vector3(0,1,0);
  function part(parent,geometry,color,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
    const m=new THREE.Mesh(geometry,placeholder);m.userData.color=color;
    m.position.fromArray(position);m.rotation.set(...rotation);m.scale.fromArray(scale);parent.add(m);return m;
  }
  function stem(parent,a,b,r,color){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const m=part(parent,new THREE.CylinderGeometry(r,r,delta.length(),7),color,start.clone().lerp(end,.5).toArray());
    m.quaternion.setFromUnitVectors(up,delta.normalize());
  }
  function roundedPetal(width,length,{depth=.008,bevel=.0025}={}){
    const s=new THREE.Shape();s.moveTo(0,0);
    s.bezierCurveTo(-width*.75,length*.08,-width,length*.42,-width,length*.70);
    s.bezierCurveTo(-width,length*1.10,width,length*1.10,width,length*.70);
    s.bezierCurveTo(width,length*.42,width*.75,length*.08,0,0);
    const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,steps:1,curveSegments:5});
    g.translate(0,0,-depth/2);return g;
  }
  function smoothSurface(g){
    // Extrusion duplicates vertices for its caps. Weld their normals after
    // bending so the glossy plastic does not show triangulation diagonals.
    g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,sums=new Map(),keys=[];
    for(let i=0;i<p.count;i++){
      const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');keys.push(key);
      if(!sums.has(key))sums.set(key,new THREE.Vector3());sums.get(key).add(new THREE.Vector3(n.getX(i),n.getY(i),n.getZ(i)));
    }
    for(const v of sums.values())v.normalize();
    for(let i=0;i<p.count;i++){const v=sums.get(keys[i]);n.setXYZ(i,v.x,v.y,v.z);}
  }
  const flowers=[
    {kind:'tulip',color:0xf42b8c,x:.080,y:.415,z:-.120,lean:-.15},
    {kind:'tulip',color:0xff8908,x:-.150,y:.520,z:.040,lean:.10},
    {kind:'sunflower',color:0xffc800,x:.095,y:.650,z:.050,r:.103,tilt:-.85,lean:.12},
    {kind:'daisy',color:0xfffcf1,x:.235,y:.505,z:-.035,r:.081,tilt:-1.08,lean:-.17},
    {kind:'daisy',color:0x8537ef,x:-.145,y:.425,z:-.105,r:.083,tilt:-.90,lean:.20},
    {kind:'daisy',color:0xff987e,x:-.045,y:.575,z:-.045,r:.062,tilt:-.98,lean:-.12}
  ].map(f=>({...f,x:f.x*.81*spread,z:f.z*.81*spread,y:.30+(f.y-.30)*.96}));
  for(const f of flowers){
    const group=new THREE.Group();group.position.set(f.x,f.y,f.z);
    group.scale.setScalar(.97);
    group.rotation.set(f.kind==='tulip'?-.22:f.tilt,0,f.lean??-.10);parts.add(group);
    stem(parts,[f.x*.09,-.06,f.z*.09],[f.x,f.y,f.z],.0075,0x21823c);
    if(f.kind==='tulip'){
      // One continuous cup avoids intersecting petal shells. Its six softly
      // scalloped tips suggest a tulip without raised seams or layered edges.
      const profile=[[0,0],[.014,.002],[.024,.010],[.035,.026],[.044,.050],[.047,.075],[.043,.102],[.035,.125],[.027,.139],[.023,.139],[.023,.126],[.020,.113],[.013,.106],[0,.104]];
      const petal=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),48),p=petal.attributes.position;
      for(let k=0;k<p.count;k++){
        const t=THREE.MathUtils.clamp((p.getY(k)-.100)/.039,0,1),angle=Math.atan2(p.getX(k),p.getZ(k));
        p.setY(k,p.getY(k)+.0045*Math.cos(angle*6)*t*t);
      }
      smoothSurface(petal);
      part(group,petal,f.color);
      part(group,sphere,0x247c39,[0,-.003,0],[0,0,0],[.027,.014,.027]);
    }else{
      const count=f.kind==='sunflower'?10:8,r=f.r;
      const petal=roundedPetal(r*(f.kind==='sunflower'?.195:.265),r*.75);
      // Gently cup the molded petals, retaining broad, rounded tips.
      const p=petal.attributes.position;
      for(let k=0;k<p.count;k++)p.setZ(k,p.getZ(k)+.006*Math.sin(Math.PI*p.getY(k)/(r*.75)));
      smoothSurface(petal);petal.rotateX(-Math.PI/2);
      for(let j=0;j<count;j++){
        const a=j*Math.PI*2/count;
        const m=part(group,petal,f.color,[-Math.sin(a)*r*.28,0,-Math.cos(a)*r*.28]);
        // A small upward pitch and sideways bank keep the broad petals lively
        // and separate their edges without shrinking them into narrow spokes.
        m.quaternion.setFromAxisAngle(up,a).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.10,0,.20+.025*Math.sin(j*2))));
      }
      const center=r*(f.kind==='sunflower'?.36:.30);
      part(group,new THREE.SphereGeometry(1,24,12),f.kind==='sunflower'?0x6b3420:0xffcf12,[0,.012,0],[0,0,0],[center,.013,center]);
      part(group,sphere,0x247c39,[0,-.013,0],[0,0,0],[center*.85,.011,center*.85]);
    }
  }
  // Thin, plain leaves attach to the stems and frame the flowers.
  const leaf=roundedPetal(.018,.108,{depth:.002,bevel:.0007});
  for(const [flowerIndex,y,angle,scale] of [[3,.300,.42,1],[4,.345,1.05,1],[2,.445,-.55,.88],[1,.405,-.70,.82],[4,.315,-.55,.60]]){
    const f=flowers[flowerIndex],t=(y+.06)/(f.y+.06);
    const g=new THREE.Group();g.position.set(f.x*(.09+.91*t),y,f.z*(.09+.91*t));g.rotation.set(-.30,0,angle);parts.add(g);
    part(g,leaf,0x238346,[0,0,0],[0,0,0],[scale,scale,scale]);
  }
  parts.updateMatrixWorld(true);
  const positions=[],normals=[],colors=[],indices=[],used=new Set();
  parts.traverse(o=>{
    if(!o.isMesh)return;used.add(o.geometry);
    const g=o.geometry.clone().applyMatrix4(o.matrixWorld),p=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(o.userData.color),base=positions.length/3;
    for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));colors.push(c.r,c.g,c.b);}
    for(let i=0;i<(g.index?.count??p.count);i++)indices.push(base+(g.index?g.index.getX(i):i));g.dispose();
  });
  for(const g of used)g.dispose();placeholder.dispose();
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
  const flowersMesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.43,metalness:0}));flowersMesh.name='Six mixed flowers and five thin leaves';flowersMesh.castShadow=true;root.add(flowersMesh);

  // Curved overlapping sheets with angular folded tips. The ivory lining is
  // intentionally visible above the coral paper, without a bow or dangling ties.
  function sheet(start,span,bottom,top,radius,color,lining=false){
    const p=[],idx=[],nu=16,nv=5;
    for(let v=0;v<=nv;v++)for(let u=0;u<=nu;u++){
      const s=u/nu,t=v/nv,a=start+s*span;
      const peak=1-Math.abs(s*2-1),edge=top+.065*peak;
      const r=.038+(radius*.81*spread-.038)*t+.009*Math.sin(s*Math.PI*4)*t*t;
      p.push(Math.sin(a)*r,bottom+(edge-bottom)*t,Math.cos(a)*r);
    }
    for(let v=0;v<nv;v++)for(let u=0;u<nu;u++){const a=v*(nu+1)+u,b=a+nu+1;idx.push(a,b,a+1,a+1,b,b+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:lining?.83:.66,side:THREE.DoubleSide}));m.castShadow=true;root.add(m);
  }
  sheet(-1.90,3.80,.018,.385,.235,0xffefd6,true);
  sheet(-2.1,4.20,-.014,.325,.248,0xe78491);
  sheet(.75,2.5,-.020,.275,.245,0xf3adad);
  sheet(3.0,2.5,-.021,.260,.250,0xea919d);
  const seal=new THREE.Mesh(new THREE.CylinderGeometry(.050,.042,.018,24),new THREE.MeshStandardMaterial({color:0xf8d6b8,roughness:.55}));seal.position.y=.043;root.add(seal);
  root.userData.flowerCount=flowers.length;
  return root;
}
