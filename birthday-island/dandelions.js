import * as THREE from 'three';

export function buildDandelions({scene,terrainHeight,meadowMask,random,interactive,onRelease}){
  const plants=[],seedCount=28,totalPlants=12;
  const stems=new THREE.Group();scene.add(stems);
  const stemMat=new THREE.MeshStandardMaterial({color:0x7d9161,roughness:.95});
  const coreMat=new THREE.MeshStandardMaterial({color:0xacaa81,roughness:1});
  const seedPositions=new Float32Array(totalPlants*seedCount*3),alpha=new Float32Array(totalPlants*seedCount);
  const offsets=[],positions=[];
  const fiberPositions=new Float32Array(totalPlants*seedCount*6),fiberAlpha=new Float32Array(totalPlants*seedCount*2);
  positions.push([-1.8,14]);
  for(let tries=0;positions.length<totalPlants&&tries<1500;tries++){
    const x=(random()-.5)*96,z=(random()-.5)*76;
    if(Math.hypot(x/67,z/54)>.78||terrainHeight(x,z)<.5||meadowMask(x,z)<.55)continue;
    if(positions.some(([px,pz])=>Math.hypot(x-px,z-pz)<6))continue;
    positions.push([x,z]);
  }
  let time=0,nextBreeze=14;
  function release(plant){
    if(time-plant.released<21)return false;
    plant.released=time;return true;
  }
  positions.forEach(([x,z],index)=>{
    const root=new THREE.Group();root.position.set(x,terrainHeight(x,z),z);stems.add(root);
    const h=.47+random()*.08,tip=new THREE.Vector3(.045,h,.02);
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(),new THREE.Vector3(-.035,h*.62,0),tip);
    const stem=new THREE.Mesh(new THREE.TubeGeometry(curve,8,.007,5,false),stemMat);root.add(stem);
    const core=new THREE.Mesh(new THREE.SphereGeometry(.019,8,6),coreMat);core.position.copy(tip);root.add(core);
    const plant={root,tip,phase:random()*6.28,released:-100,near:false,index};plants.push(plant);
    for(let j=0;j<seedCount;j++){
      const yy=1-2*(j+.5)/seedCount,a=j*2.39996,r=Math.sqrt(1-yy*yy);
      offsets.push(new THREE.Vector3(Math.cos(a)*r*.085,yy*.085,Math.sin(a)*r*.085));
    }
    interactive.push({type:'dandelion',object:root,reach:1.8,
      get prompt(){return time-plant.released<21?'the dandelion is growing back':'send a dandelion wish into the breeze';},
      action:()=>{if(release(plant))onRelease();}});
  });
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(seedPositions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('aAlpha',new THREE.BufferAttribute(alpha,1).setUsage(THREE.DynamicDrawUsage));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{uRatio:{value:1},uNight:{value:1}},
    vertexShader:`attribute float aAlpha;uniform float uRatio;varying float vAlpha,vDistance;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vDistance=length(p.xyz);vAlpha=aAlpha*(1.0-smoothstep(22.0,48.0,vDistance));
        gl_Position=projectionMatrix*p;gl_PointSize=clamp(24.0/max(1.0,vDistance),1.5,7.0)*uRatio;}`,
    fragmentShader:`uniform float uNight;varying float vAlpha,vDistance;
      void main(){vec2 p=gl_PointCoord*2.0-1.0;float r=length(p);
        float fluff=exp(-r*r*5.0)*.7;
        float spokes=(exp(-p.x*p.x*100.0)+exp(-pow(p.x*.5+p.y*.866,2.0)*100.0)+exp(-pow(p.x*.5-p.y*.866,2.0)*100.0))*.18;
        float a=(fluff+spokes)*(1.0-smoothstep(.65,1.0,r))*vAlpha;
        gl_FragColor=vec4(mix(vec3(.88,.85,.73),vec3(.56,.63,.66),uNight),a);}`});
  const seeds=new THREE.Points(geometry,material);seeds.frustumCulled=false;scene.add(seeds);
  const fiberGeometry=new THREE.BufferGeometry();
  fiberGeometry.setAttribute('position',new THREE.BufferAttribute(fiberPositions,3).setUsage(THREE.DynamicDrawUsage));
  fiberGeometry.setAttribute('aAlpha',new THREE.BufferAttribute(fiberAlpha,1).setUsage(THREE.DynamicDrawUsage));
  const fiberMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:material.uniforms,
    vertexShader:'attribute float aAlpha;varying float vAlpha;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vAlpha=aAlpha*(1.0-smoothstep(12.0,28.0,length(p.xyz)));gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying float vAlpha;void main(){gl_FragColor=vec4(.62,.65,.59,vAlpha*.40);}'});
  const fibers=new THREE.LineSegments(fiberGeometry,fiberMaterial);fibers.frustumCulled=false;scene.add(fibers);

  return {plants,update(t,player,night,pixelRatio){
    time=t;material.uniforms.uNight.value=night;material.uniforms.uRatio.value=pixelRatio;
    if(t>nextBreeze){release(plants[Math.floor(random()*plants.length)]);nextBreeze=t+14+random()*18;}
    for(const plant of plants){
      const close=Math.hypot(player.x-plant.root.position.x,player.z-plant.root.position.z)<1.05;
      if(close&&!plant.near)release(plant);plant.near=close;
      const age=t-plant.released,sway=Math.sin(t*1.15+plant.phase)*.028;
      plant.root.rotation.z=sway;
      const x=plant.root.position.x+plant.tip.x-sway*plant.tip.y,y=plant.root.position.y+plant.tip.y,z=plant.root.position.z+plant.tip.z;
      for(let j=0;j<seedCount;j++){
        const idx=plant.index*seedCount+j,k=idx*3,o=offsets[idx],delay=j/seedCount*.7,flight=age-delay;
        let px=x+o.x,py=y+o.y,pz=z+o.z,visibility=1;
        if(age<7){
          const f=Math.max(0,flight),drift=.48+(j%7)*.04;
          px+=f*drift+Math.sin(f*1.4+plant.phase+j)*.07*f;
          py+=f*.25+Math.sin(f*.8+j)*.10*f;
          pz+=f*.20+Math.cos(f+j)*.04*f;
          visibility=1-THREE.MathUtils.smoothstep(f,3.5,6.0);
        }else if(age<21){visibility=THREE.MathUtils.smoothstep(age,14+delay,20+delay);}
        seedPositions[k]=px;seedPositions[k+1]=py;seedPositions[k+2]=pz;alpha[idx]=visibility;
        const fk=idx*6,flying=age<7&&flight>0;
        fiberPositions[fk]=flying?px:x;fiberPositions[fk+1]=flying?py-.025:y;fiberPositions[fk+2]=flying?pz:z;
        fiberPositions[fk+3]=px;fiberPositions[fk+4]=py;fiberPositions[fk+5]=pz;
        fiberAlpha[idx*2]=visibility*.35;fiberAlpha[idx*2+1]=visibility;
      }
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.aAlpha.needsUpdate=true;
    fiberGeometry.attributes.position.needsUpdate=true;fiberGeometry.attributes.aAlpha.needsUpdate=true;
  }};
}
