import * as THREE from 'three';

// A reusable sky ribbon and soft head glint. Only one meteor is active;
// all geometry and materials are created up front.
export function buildShootingStars(scene){
  const uniforms={uHead:{value:new THREE.Vector3(0,80,-280)},uTail:{value:new THREE.Vector3(0,80,-280)},uFade:{value:0},uSize:{value:1}};
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
    uniforms,
    vertexShader:`uniform float uSize;uniform vec3 uHead,uTail;varying vec2 vUv;
      void main(){
        vUv=uv;
        vec3 head=(viewMatrix*vec4(cameraPosition+uHead,1.0)).xyz;
        vec3 tail=(viewMatrix*vec4(cameraPosition+uTail,1.0)).xyz;
        vec2 axis=normalize(head.xy-tail.xy+vec2(.00001));
        vec3 p=mix(tail,head,uv.x);
        p.xy+=vec2(-axis.y,axis.x)*(uv.y-.5)*1.15*uSize;
        gl_Position=projectionMatrix*vec4(p,1.0);
      }`,
    fragmentShader:`uniform float uFade;varying vec2 vUv;
      void main(){
        float y=(vUv.y-.5)*2.0;
        float core=exp(-y*y*90.0),halo=exp(-y*y*7.0);
        // MSAA can evaluate edge fragments just outside the ribbon's UV range.
        // Clamp before fractional powers: negative tail UVs otherwise produce NaNs.
        float along=clamp(vUv.x,0.0,1.0);
        float trail=smoothstep(0.0,.18,along)*pow(along,1.1);
        // GLSL pow is undefined for a negative base, even with exponent 2.
        float headDistance=(vUv.x-.985)*45.0;
        float head=exp(-headDistance*headDistance);
        float alpha=(trail*(core*.60+halo*.16)+head*core*.30)*uFade;
        vec3 colour=mix(vec3(.48,.67,1.0),vec3(1.0,.94,.78),smoothstep(.50,1.0,vUv.x));
        gl_FragColor=vec4(colour*1.6,alpha);
      }`
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
  mesh.frustumCulled=false;mesh.renderOrder=-15;scene.add(mesh);
  const glintMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms,
    vertexShader:`uniform float uSize;uniform vec3 uHead;varying vec2 vUv;
      void main(){vUv=uv;vec4 p=viewMatrix*vec4(cameraPosition+uHead,1.0);
      p.xy+=position.xy*3.6*uSize;gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform float uFade;varying vec2 vUv;
      void main(){vec2 p=vUv*2.0-1.0;float r=length(p);
      float core=exp(-r*r*42.0),halo=.10*exp(-r*r*5.0);
      float rays=.18*(exp(-p.x*p.x*100.0-p.y*p.y*6.0)+exp(-p.y*p.y*100.0-p.x*p.x*6.0));
      gl_FragColor=vec4(vec3(1.8,1.65,1.35),(core+halo+rays)*(1.0-smoothstep(.7,1.0,r))*uFade);}`
  });
  const glint=new THREE.Mesh(new THREE.PlaneGeometry(1,1),glintMaterial);
  glint.frustumCulled=false;glint.renderOrder=-14;scene.add(glint);
  const start=new THREE.Vector3(),velocity=new THREE.Vector3(),forward=new THREE.Vector3();
  let next=12+Math.random()*12,born=-100,duration=1.2;
  let wasGazing=false;
  const schedule=(time,gazing)=>time+(gazing?14:26)+Math.random()*(gazing?12:22);
  return {update(time,night,camera,gazing=false){
    uniforms.uSize.value=gazing?1.15:1;
    if(gazing&&!wasGazing)next=Math.min(next,time+3);
    wasGazing=gazing;
    if(night<.6){uniforms.uFade.value=0;born=-100;next=Math.max(next,time+10);return;}
    if(time>=next){
      camera.getWorldDirection(forward);
      const az=Math.atan2(forward.x,forward.z)+(Math.random()-.5)*1.5;
      const elev=gazing?1.0+Math.random()*.35:.36+Math.random()*.34;
      start.set(Math.sin(az)*Math.cos(elev),Math.sin(elev),Math.cos(az)*Math.cos(elev)).multiplyScalar(280);
      const side=Math.random()<.5?-1:1;
      velocity.set(Math.cos(az)*side,-.38-Math.random()*.25,-Math.sin(az)*side).normalize().multiplyScalar(38+Math.random()*12);
      born=time;duration=2.2+Math.random()*.6;next=schedule(time,gazing);
    }
    const age=time-born;
    if(age<0||age>=duration){uniforms.uFade.value=0;return;}
    uniforms.uHead.value.copy(start).addScaledVector(velocity,age);
    uniforms.uTail.value.copy(start).addScaledVector(velocity,Math.max(0,age-(gazing?1.02:.85)));
    const fadeIn=THREE.MathUtils.smoothstep(age,0,.30);
    const fadeOut=1-THREE.MathUtils.smoothstep(age,duration*.60,duration);
    uniforms.uFade.value=fadeIn*fadeOut*night*.85;
  }};
}
