import * as THREE from 'three';

// A single reusable sky ribbon. Only one meteor can be active; no particles,
// lights, geometry allocation, or shader compilation when one appears.
export function buildShootingStars(scene){
  const uniforms={uHead:{value:new THREE.Vector3(0,80,-280)},uTail:{value:new THREE.Vector3(0,80,-280)},uFade:{value:0}};
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
    uniforms,
    vertexShader:`uniform vec3 uHead,uTail;varying vec2 vUv;
      void main(){
        vUv=uv;
        vec3 head=(viewMatrix*vec4(cameraPosition+uHead,1.0)).xyz;
        vec3 tail=(viewMatrix*vec4(cameraPosition+uTail,1.0)).xyz;
        vec2 axis=normalize(head.xy-tail.xy+vec2(.00001));
        vec3 p=mix(tail,head,uv.x);
        p.xy+=vec2(-axis.y,axis.x)*(uv.y-.5)*.46;
        gl_Position=projectionMatrix*vec4(p,1.0);
      }`,
    fragmentShader:`uniform float uFade;varying vec2 vUv;
      void main(){
        float crosswise=exp(-pow((vUv.y-.5)*6.0,2.0));
        float trail=pow(vUv.x,1.8)*(1.0-smoothstep(.96,1.0,vUv.x));
        float head=exp(-pow((vUv.x-.95)*32.0,2.0));
        float alpha=(trail*.55+head*.45)*crosswise*uFade;
        gl_FragColor=vec4(mix(vec3(.55,.72,1.0),vec3(1.0,.95,.82),head),alpha);
      }`
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
  mesh.frustumCulled=false;mesh.renderOrder=-15;scene.add(mesh);
  const start=new THREE.Vector3(),velocity=new THREE.Vector3(),forward=new THREE.Vector3();
  let next=12+Math.random()*12,born=-100,duration=1.2;
  const schedule=time=>time+24+Math.random()*32;
  return {update(time,night,camera){
    if(night<.6){uniforms.uFade.value=0;born=-100;next=Math.max(next,time+10);return;}
    if(time>=next){
      camera.getWorldDirection(forward);
      const az=Math.atan2(forward.x,forward.z)+(Math.random()-.5)*1.5;
      const elev=.36+Math.random()*.34;
      start.set(Math.sin(az)*Math.cos(elev),Math.sin(elev),Math.cos(az)*Math.cos(elev)).multiplyScalar(280);
      const side=Math.random()<.5?-1:1;
      velocity.set(Math.cos(az)*side,-.38-Math.random()*.25,-Math.sin(az)*side).normalize().multiplyScalar(43+Math.random()*18);
      born=time;duration=1.0+Math.random()*.55;next=schedule(time);
    }
    const age=time-born;
    if(age<0||age>=duration){uniforms.uFade.value=0;return;}
    uniforms.uHead.value.copy(start).addScaledVector(velocity,age);
    uniforms.uTail.value.copy(start).addScaledVector(velocity,Math.max(0,age-.32));
    const fadeIn=THREE.MathUtils.smoothstep(age,0,.12);
    const fadeOut=1-THREE.MathUtils.smoothstep(age,duration*.55,duration);
    uniforms.uFade.value=fadeIn*fadeOut*night*.85;
  }};
}
