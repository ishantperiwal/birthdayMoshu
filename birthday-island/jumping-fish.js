import * as THREE from 'three';
import {SHORE,waterHeight} from './skipping-physics.js?v=more-skips-7';

export const FISH_AREAS=[
  {x:SHORE.x+17,z:SHORE.z+3,rx:10,rz:9},
  {x:-62,z:-3,rx:10,rz:16}
];
export function sampleNearbyFish(view,ground,random=Math.random){
  if(!view||Math.hypot(view.dx,view.dz)<.2)return null;
  let shore=false;
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6;
    if(ground(view.x+Math.cos(angle)*9,view.z+Math.sin(angle)*9)<-1.1){shore=true;break;}
  }
  if(!shore)return null;
  const heading=Math.atan2(view.dz,view.dx);
  for(let i=0;i<8;i++){
    const angle=heading+(random()-.5)*.9,distance=10+random()*12;
    const jump=sampleFishJump({x:view.x+Math.cos(angle)*distance,z:view.z+Math.sin(angle)*distance,rx:2,rz:2},ground,random);
    if(jump)return jump;
  }
  return null;
}
// Validate the full arc's footprint so near-shore jumps never cross dry land.
export function sampleFishJump(area,ground,random=Math.random){
  for(let attempt=0;attempt<30;attempt++){
    const a=random()*Math.PI*2,r=Math.sqrt(random()),angle=random()*Math.PI*2;
    const size=.50+Math.pow(random(),1.7)*.95,speed=1.8+size*.9;
    const f={x:area.x+Math.cos(a)*r*area.rx,z:area.z+Math.sin(a)*r*area.rz,
      vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,size,speed,
      height:(.65+random()*.55)*Math.sqrt(size),duration:1.05+random()*.40};
    if([0,.25,.5,.75,1].every(t=>ground(f.x+f.vx*f.duration*t,f.z+f.vz*f.duration*t)<-1.1))return f;
  }
  return null;
}
export function buildJumpingFish(scene,{areas=FISH_AREAS,terrainHeight=()=>-10,onSplash=()=>{}}={}){
  const palettes=[[0xc9e3db,0x447e86],[0xffc69c,0xf07827],[0xffe898,0xe5b82e],[0xd4d5ed,0x747fa9]]
    .map(([belly,top])=>[new THREE.MeshStandardMaterial({color:belly,roughness:.32,metalness:.18}),new THREE.MeshStandardMaterial({color:top,roughness:.42,metalness:.08,side:THREE.DoubleSide})]);
  const [silver,back]=palettes[0];
  const eyeMat=new THREE.MeshStandardMaterial({color:0x142c31,roughness:.3});
  const sphere=new THREE.SphereGeometry(1,14,10);
  function add(root,material,position,scale){const m=new THREE.Mesh(sphere,material);m.position.fromArray(position);m.scale.fromArray(scale);root.add(m);return m;}
  const template=new THREE.Group();
  add(template,silver,[0,0,0],[.115,.17,.38]);
  add(template,back,[0,.075,-.025],[.102,.11,.33]);
  for(const side of [-1,1])add(template,eyeMat,[side*.091,.047,.235],[.018,.020,.021]);
  const tailGeo=new THREE.BufferGeometry();
  tailGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,.22,-.30,0,0,-.21,0,0,0,0,0,-.21,0,-.22,-.30],3));tailGeo.computeVertexNormals();
  const tail=new THREE.Mesh(tailGeo,back);tail.position.z=-.32;template.add(tail);
  const finGeo=new THREE.BufferGeometry();finGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,.11,.12,0,.30,-.10,0,.10,-.24],3));finGeo.computeVertexNormals();template.add(new THREE.Mesh(finGeo,back));
  const fish=Array.from({length:4},()=>{const root=template.clone(true);root.visible=false;scene.add(root);return {root,tail:root.children[4],start:-100,duration:1.35};});
  const splashes=Array.from({length:8},()=>({start:-100,x:0,z:0,size:1}));
  const drops=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),new THREE.MeshBasicMaterial({color:0xc1e3e3,transparent:true,opacity:.55,depthWrite:false}),32);
  drops.frustumCulled=false;drops.visible=false;scene.add(drops);
  const dummy=new THREE.Object3D();let fishCursor=0,splashCursor=0;
  const nextJumps=areas.map((_,i)=>3+i*8);
  let nextNearby=0;
  function splash(x,z,time,size){const s=splashes[splashCursor++%splashes.length];Object.assign(s,{x,z,start:time,size});onSplash(x,z,time,size);}
  function launch(jump,time){
    const f=fish.find(f=>time-f.start>f.duration);if(!f)return false;
    const palette=palettes[Math.floor(Math.random()*palettes.length)];
    Object.assign(f,jump,{start:time,landed:false});f.root.scale.setScalar(f.size);
    f.root.children[0].material=palette[0];for(const j of [1,4,5])f.root.children[j].material=palette[1];
    splash(f.x,f.z,time,f.size*.55);return true;
  }
  return {update(time,view=null){
    areas.forEach((area,i)=>{
      if(time<nextJumps[i])return;
      nextJumps[i]=time+12+Math.random()*14;
      const jump=sampleFishJump(area,terrainHeight);if(!jump)return;
      launch(jump,time);
    });
    if(!view)nextNearby=time+4;
    else if(time>=nextNearby){
      nextNearby=time+3;
      const jump=sampleNearbyFish(view,terrainHeight);
      // Existing spots already supply regular sightings; avoid doubling them.
      if(jump&&!fish.some(f=>time-f.start<f.duration)&&launch(jump,time))nextNearby=time+15+Math.random()*10;
    }
    for(const f of fish){
      const age=time-f.start,u=age/f.duration;
      if(f.start>=0&&u>=.94&&!f.landed){
        const landingAge=f.duration*.94;splash(f.x+f.vx*landingAge,f.z+f.vz*landingAge,time,f.size);f.landed=true;
      }
      f.root.visible=u>=0&&u<=1;
      if(!f.root.visible)continue;
      const x=f.x+f.vx*age,z=f.z+f.vz*age,lift=4*f.height*u*(1-u)-.22*f.size;
      f.root.position.set(x,waterHeight(x,z,time)+lift,z);
      const slope=4*f.height*(1-2*u)/f.duration;
      f.root.rotation.set(-Math.atan2(slope,f.speed),Math.atan2(f.vx,f.vz),Math.sin(age*12)*.05,'YXZ');
      f.tail.rotation.y=Math.sin(age*26)*.35;
    }
    let n=0;
    for(const s of splashes){
      const age=time-s.start;if(age<0||age>.65)continue;
      for(let j=0;j<8&&n<32;j++){
        const a=j*Math.PI/4+s.x,spread=age*(.55+(j%3)*.18)*s.size,h=((1.5+(j%2)*.35)*age-2.8*age*age)*s.size;
        dummy.position.set(s.x+Math.cos(a)*spread,waterHeight(s.x,s.z,time)+.04+Math.max(0,h),s.z+Math.sin(a)*spread);
        dummy.scale.setScalar(.027*s.size*(1-age/.65));dummy.updateMatrix();drops.setMatrixAt(n++,dummy.matrix);
      }
    }
    drops.count=n;drops.visible=n>0;if(n)drops.instanceMatrix.needsUpdate=true;
  }};
}
