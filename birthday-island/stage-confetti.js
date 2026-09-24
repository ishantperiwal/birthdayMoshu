import * as THREE from 'three';

// A fixed pool of small foil pieces: one draw call, no lights or shadow pass.
export function buildStageConfetti(scene,groundY,stageRadius){
  const count=130,particles=[],dummy=new THREE.Object3D();
  const palette=[0xf45d91,0xffbc45,0x53bdd2,0xac7de5,0xf57b54,0x81c879,0xffefd0];
  let seed=2409;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  // A tiny orientation-based highlight suggests foil as each piece tumbles.
  // Evaluate it at the four vertices, keeping the existing unlit single draw.
  material.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float confettiRound;\nvarying float vConfettiRound;\nvarying vec2 vConfettiUv;\nvarying float vFoilGlint;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vConfettiRound=confettiRound;vConfettiUv=uv;
      vec3 foilNormal=normalize(mat3(modelViewMatrix)*mat3(instanceMatrix)*vec3(0.0,0.0,1.0));
      float foilFacing=abs(dot(foilNormal,normalize(vec3(0.35,0.65,1.0))));
      vFoilGlint=0.34*pow(foilFacing,24.0);`);
    shader.fragmentShader='varying float vConfettiRound;\nvarying vec2 vConfettiUv;\nvarying float vFoilGlint;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      if(vConfettiRound>0.5&&length(vConfettiUv-0.5)>0.5)discard;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,0.96,0.85),vFoilGlint);`);
  };
  material.customProgramCacheKey=()=> 'stage-confetti-round-foil-2';
  const geometry=new THREE.PlaneGeometry(1,1);
  // About a third are round cutouts, sharing the same geometry and draw call.
  const round=Float32Array.from({length:count},(_,i)=>i%3===0?1:0);
  geometry.setAttribute('confettiRound',new THREE.InstancedBufferAttribute(round,1));
  const mesh=new THREE.InstancedMesh(geometry,material,count);
  mesh.name='Two-sided stage confetti';mesh.visible=false;mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);
  for(let i=0;i<count;i++){
    const side=i%2?1:-1;
    particles.push({side,delay:random()*.18,vx:-side*(1.4+random()*2.3),vy:5.6+random()*3.2,
      vz:-.5+random()*2.2,size:.030+random()*.030,phase:random()*Math.PI*2,
      spin:3+random()*7,life:5.2+random()*1.3});
    mesh.setColorAt(i,new THREE.Color(palette[i%palette.length]));
  }
  let launchedAt=-Infinity;
  return {
    burst(time){launchedAt=time;mesh.visible=true;},
    update(time){
      if(!mesh.visible)return;
      const age=time-launchedAt;
      if(age>6.8){mesh.visible=false;return;}
      particles.forEach((p,i)=>{
        const t=Math.max(0,age-p.delay),drag=(1-Math.exp(-t*1.25))/1.25;
        const flutter=Math.min(t,1);
        const x=-8+p.side*(stageRadius+.22)+p.vx*drag+Math.sin(t*3+p.phase)*.15*flutter;
        const y=groundY+.18+p.vy*drag-1.45*t;
        const z=-9.8+p.vz*drag+Math.cos(t*2.4+p.phase)*.12*flutter;
        const fade=1-THREE.MathUtils.smoothstep(t,p.life-.8,p.life);
        const size=age<p.delay||y<groundY+.02?0:p.size*fade;
        dummy.position.set(x,y,z);dummy.rotation.set(p.phase+t*p.spin,t*p.spin*.7,t*2+p.phase);
        dummy.scale.set(size,size*(round[i]?1:1.30),size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
    }
  };
}
