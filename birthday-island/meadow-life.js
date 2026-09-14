import * as THREE from 'three';

// Shared geometry per species: flower heads and short arched stems stay
// attached while a root-anchored wind bend moves the complete plant.
function combine(parts){
  const positions=[],normals=[],colors=[];
  for(const [source,color,matrix] of parts){
    const geo=(source.index?source.toNonIndexed():source.clone());
    if(matrix)geo.applyMatrix4(matrix);
    const tint=new THREE.Color(color);
    positions.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);
    for(let i=0;i<geo.attributes.position.count;i++)colors.push(tint.r,tint.g,tint.b);
    geo.dispose();source.dispose();
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return geo;
}
const transform=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(
  new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));
function flowerGeometry(variant){
  const parts=[],h=.30+variant*.020,tip=new THREE.Vector3(.065,h,.025);
  const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(),new THREE.Vector3(-.025,h*.67,0),tip);
  parts.push([new THREE.TubeGeometry(curve,7,.009,5,false),0x68885b]);
  const tint=[0xf7e9ce,0xe9b7bd,0xd3bfdc,0xf0cd90][variant],petals=variant===2?5:7;
  const head=transform(tip.x,tip.y,tip.z,.22,variant*.4,-.36);
  for(let i=0;i<petals;i++){
    const a=i/petals*Math.PI*2;
    const matrix=head.clone().multiply(transform(Math.cos(a)*.060,0,Math.sin(a)*.060,0,-a,0,.069,.018,.032));
    parts.push([new THREE.SphereGeometry(1,8,4),tint,matrix]);
  }
  parts.push([new THREE.SphereGeometry(.030,9,5),0xe5b55c,head.clone().multiply(transform(0,.021,0,0,0,0,1,.55,1))]);
  return combine(parts);
}
function mushroomGeometry(variant){
  const h=variant%2?.16:.21,r=variant%2?.11:.14;
  const capColor=[0xe87883,0xb29ade,0xe5b75d,0x79bcb0][variant];
  const stem=new THREE.QuadraticBezierCurve3(new THREE.Vector3(),new THREE.Vector3(-.018,h*.5,0),new THREE.Vector3(.018,h,0));
  const profile=[new THREE.Vector2(0,h+.073),new THREE.Vector2(r*.35,h+.070),new THREE.Vector2(r*.72,h+.045),new THREE.Vector2(r,h+.002),new THREE.Vector2(r*.92,h-.018),new THREE.Vector2(0,h-.015)];
  const parts=[[new THREE.TubeGeometry(stem,5,.022,6,false),0xf0dfc3],
    [new THREE.LatheGeometry(profile.reverse(),14),capColor,transform(.018,0,0)]];
  // A few flat cream flecks distinguish low caps from flower buds.
  for(const [x,z] of [[-.045,.025],[.032,.045],[.022,-.040]])parts.push([
    new THREE.SphereGeometry(1,6,3),0xffefd4,transform(x+.018,h+.061,z,0,0,0,.014,.003,.010)]);
  return combine(parts);
}
export function buildMeadowLife({scene,terrainHeight,meadowMask,random,timeUniform}){
  const flowerSpots=[],flowerPlacements=Array.from({length:4},()=>[]),mushroomPlacements=Array.from({length:4},()=>[]);
  const valid=(x,z)=>terrainHeight(x,z)>.5&&meadowMask(x,z)>.8;
  const sample=()=>{
    for(let tries=0;tries<1000;tries++){
      const x=(random()-.5)*112,z=(random()-.5)*88;
      if(valid(x,z))return [x,z];
    }
    return null;
  };
  // Restore the earlier scattered wildflower layout: many tiny drifts of
  // two to six flowers throughout the meadow, not a few concentrated patches.
  for(let i=0,left=0,drift=null,variant=0;i<260;i++){
    if(left===0){drift=sample();left=2+Math.floor(random()*5);variant=Math.floor(random()*4);}
    left--;if(!drift)continue;
    let x=drift[0]+(random()-.5)*2.6,z=drift[1]+(random()-.5)*2.6;
    if(!valid(x,z)){const pos=sample();if(!pos)continue;[x,z]=pos;}
    const scale=.8+random()*.4;
    flowerPlacements[variant].push({x,z,scale,turn:random()*Math.PI*2,tilt:(random()-.5)*.18});
    flowerSpots.push([x,terrainHeight(x,z)+(.30+variant*.020)*scale,z]);
  }
  for(let i=0;i<36;i++){
    const pos=sample();if(!pos)continue;
    mushroomPlacements[i%4].push({x:pos[0],z:pos[1],scale:.8+random()*.6,turn:random()*Math.PI*2,tilt:(random()-.5)*.12});
  }
  const windHeader=`uniform float uFlowerTime;
    vec3 flowerBend(){
      vec3 root=instanceMatrix[3].xyz;
      float gust=sin(root.x*.12+root.z*.09-uFlowerTime*1.65)+sin(root.x*.31-root.z*.24-uFlowerTime*2.2)*.24;
      float phase=root.x*.8+root.z*.5;
      float amount=.020+.035*gust+.012*sin(uFlowerTime*2.5+phase);
      vec3 direction=normalize(vec3(.82,0.,.42))*amount;
      return vec3(dot(direction,normalize(instanceMatrix[0].xyz)),0.,dot(direction,normalize(instanceMatrix[2].xyz)));
    }`;
  const deform=`#include <begin_vertex>
    float flowerHeight=max(position.y,0.0)/.6;
    transformed+=flowerBend()*flowerHeight*flowerHeight;`;
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.uniforms.uFlowerTime=timeUniform;
    shader.vertexShader=windHeader+'\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',deform);
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
      vec3 bend=flowerBend();
      objectNormal.y-=dot(objectNormal.xz,bend.xz)*2.0*max(position.y,0.0)/.36;`);
  };
  material.customProgramCacheKey=()=> 'arched-wildflower-v1';
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
  depth.onBeforeCompile=shader=>{shader.uniforms.uFlowerTime=timeUniform;shader.vertexShader=windHeader+'\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',deform);};
  depth.customProgramCacheKey=()=> 'arched-wildflower-depth-v1';
  const mushroomMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.66});
  const place=(geometry,placements,isFlower)=>{
    const mesh=new THREE.InstancedMesh(geometry,isFlower?material:mushroomMaterial,placements.length);
    placements.forEach((p,i)=>mesh.setMatrixAt(i,transform(p.x,terrainHeight(p.x,p.z),p.z,p.tilt,p.turn,p.tilt*.6,p.scale,p.scale,p.scale)));
    mesh.castShadow=true;mesh.receiveShadow=true;if(isFlower)mesh.customDepthMaterial=depth;
    mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.12;scene.add(mesh);
  };
  flowerPlacements.forEach((p,i)=>place(flowerGeometry(i),p,true));
  mushroomPlacements.forEach((p,i)=>place(mushroomGeometry(i),p,false));
  return {flowerSpots};
}
