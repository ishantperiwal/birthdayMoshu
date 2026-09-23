import * as THREE from 'three';
import { roundedToyBox } from './rounded-toy-box.js';

// One baked reflection shared by all presents; no live reflection capture or lights.
export function buildGiftFinish(renderer){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#273444';ctx.fillRect(0,0,256,128);
  for(const [x,y,r,color] of [[58,30,46,'#e8d8b8'],[181,45,33,'#94b7cb'],[120,10,29,'#b8c5c7']]){
    const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,color);gradient.addColorStop(1,'rgba(39,52,68,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,256,128);
  }
  const source=new THREE.CanvasTexture(canvas);source.colorSpace=THREE.SRGBColorSpace;source.mapping=THREE.EquirectangularReflectionMapping;
  const baker=new THREE.PMREMGenerator(renderer),reflection=baker.fromEquirectangular(source);
  source.dispose();baker.dispose();
  return color=>new THREE.MeshPhysicalMaterial({color,roughness:.28,metalness:.10,
    clearcoat:.40,clearcoatRoughness:.30,envMap:reflection.texture,envMapIntensity:1.25,
    emissive:color,emissiveIntensity:.12});
}

export function giftBox(w,h,d,material,fillet=0){
  if(fillet>0){
    const mesh=new THREE.Mesh(roundedToyBox(w,h,d,fillet),material);
    mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  const bevel=.045,shape=new THREE.Shape(),x=w/2-bevel,y=h/2-bevel;
  shape.moveTo(-x,-y);shape.lineTo(x,-y);shape.lineTo(x,y);shape.lineTo(-x,y);shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:d-2*bevel,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:1});
  geometry.translate(0,0,-d/2+bevel);
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}

// Folded satin strips give the bow an actual silhouette from every viewpoint.
export const GIFT_RIBBON_COLORS={small:0xffa18d,medium:0xffdc83,large:0xb6f3cf};
export function addGiftDetails(group,index,tier='medium'){
  // A shallow, paper-colored inset defines the lid without a black border.
  const boxMaterial=group.children.find(child=>child.isMesh)?.material;
  const seamColor=boxMaterial?.color?.clone()??new THREE.Color(0x385f99);
  seamColor.multiplyScalar(.46);
  const seamMaterial=new THREE.MeshStandardMaterial({color:seamColor,roughness:.65,emissive:seamColor,emissiveIntensity:.06});
  const seam=new THREE.Mesh(new THREE.BoxGeometry(1.172,.018,1.042),seamMaterial);
  seam.name='subtle lid seam';seam.position.y=.945;seam.receiveShadow=true;group.add(seam);

  const ribbonColor=GIFT_RIBBON_COLORS[tier]??0xffdc83;
  const satin=new THREE.MeshPhysicalMaterial({color:ribbonColor,roughness:.38,metalness:0,emissive:ribbonColor,emissiveIntensity:.18,side:THREE.DoubleSide});
  // Closed, solid ribbon bands follow the box and the wider lid with a small clearance.
  function wrappedBand(halfBody,halfLid,lift=0){
    const profile=[[-halfBody,.04],[halfBody,.04],[halfBody,.95],[halfLid,.95],
      [halfLid,1.20+lift],[-halfLid,1.20+lift],[-halfLid,.95],[-halfBody,.95]];
    function offset(distance){return profile.map((p,i)=>{
      const prev=profile[(i+profile.length-1)%profile.length],next=profile[(i+1)%profile.length];
      const a=new THREE.Vector2(p[0]-prev[0],p[1]-prev[1]).normalize();
      const b=new THREE.Vector2(next[0]-p[0],next[1]-p[1]).normalize();
      const n0=new THREE.Vector2(a.y,-a.x),n1=new THREE.Vector2(b.y,-b.x);
      return new THREE.Vector2(...p).add(n0.clone().add(n1).multiplyScalar(distance/(1+n0.dot(n1))));
    });}
    const shape=new THREE.Shape(offset(.023)),hole=new THREE.Path(offset(.009).reverse());
    shape.holes.push(hole);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.17,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2,steps:1});
    geometry.translate(0,0,-.085);
    const band=new THREE.Mesh(geometry,satin);band.name='solid wrapping ribbon';band.castShadow=true;band.receiveShadow=true;group.add(band);return band;
  }
  wrappedBand(.575,.635);
  wrappedBand(.51,.565,.017).rotation.y=Math.PI/2;
  const bow=new THREE.Group();bow.position.y=.14;group.add(bow);
  function ribbon(curve,width,twist=0,notched=false){
    const positions=[],uvs=[],indices=[],steps=40;
    for(let i=0;i<=steps;i++){
      const t=i/steps,p=curve(t),angle=twist*Math.sin(t*Math.PI*2);
      for(let j=0;j<=2;j++){
        const side=j-1;
        const q=p.clone();
        q.x+=Math.sin(angle)*width*side/2;q.z+=Math.cos(angle)*width*side/2;
        q.y+=.012*(1-side*side)*Math.sin(Math.PI*t);
        // A small V cut at the free end, rather than a square ribbon tip.
        if(notched&&i===steps&&j===1)q.copy(curve(.94));
        positions.push(q.x,q.y,q.z);uvs.push(t,j/2);
        if(i<steps&&j<2){const n=i*3+j;indices.push(n,n+3,n+1,n+1,n+3,n+4);}
      }
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,satin);mesh.name=notched?'loose ribbon tail':'bow loop';mesh.castShadow=true;mesh.receiveShadow=true;bow.add(mesh);
  }
  for(const side of [-1,1]){
    ribbon(t=>{const a=t*Math.PI*2;return new THREE.Vector3(side*.24*(1-Math.cos(a)),1.15+.065*Math.sin(a)+.075*(1-Math.cos(a)),0);},.14,side*.45);
    const top=new THREE.CubicBezierCurve3(new THREE.Vector3(side*.025,1.19,0),new THREE.Vector3(side*.23,1.16,side*.20),new THREE.Vector3(side*.50,1.115,side*.32),new THREE.Vector3(side*.67,1.11,side*.34));
    const drop=new THREE.CubicBezierCurve3(new THREE.Vector3(side*.67,1.11,side*.34),new THREE.Vector3(side*.74,1.10,side*.35),new THREE.Vector3(side*.73,.89,side*.37),new THREE.Vector3(side*.70,.76,side*.38));
    ribbon(t=>t<.62?top.getPoint(t/.62):drop.getPoint((t-.62)/.38),.12,side*.2,true);
  }
  const knot=giftBox(.17,.115,.18,satin);knot.position.y=1.155;knot.rotation.z=.12;bow.add(knot);
}
