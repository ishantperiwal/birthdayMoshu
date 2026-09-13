import * as THREE from 'three';

// A quiet stone hearth and a silent radio, ready for a local track later.
export function buildFireside({scene,terrainHeight,x,z,musicUrl=''}) {
  const root=new THREE.Group();root.position.set(x,terrainHeight(x,z),z);scene.add(root);
  const material=color=>new THREE.MeshStandardMaterial({color,roughness:.95});
  const stone=material(0x827d70),wood=material(0x604637),cream=material(0xdbc49a),dark=material(0x383b37);
  const mesh=(geometry,mat,px,py,pz)=>{const m=new THREE.Mesh(geometry,mat);m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;};
  const box=(w,h,d,mat,px,py,pz)=>mesh(new THREE.BoxGeometry(w,h,d),mat,px,py,pz);
  const hearthStones=[0x827d70,0x908779,0x77796f].map(color=>
    new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));
  for(let i=0;i<11;i++){
    const a=i*Math.PI*2/11,r=.86+.035*Math.sin(i*7);
    const m=mesh(new THREE.DodecahedronGeometry(.26,0),hearthStones[i%3],Math.cos(a)*r,.17,Math.sin(a)*r);
    m.scale.set(1.08+.09*Math.sin(i*3),.76+.08*Math.cos(i*2),.88);m.rotation.set(.1*i,a,.1);
  }
  mesh(new THREE.CylinderGeometry(.72,.72,.035,24),dark,0,.02,0);
  for(let i=0;i<3;i++){
    const log=mesh(new THREE.CylinderGeometry(.11,.14,1.12,9),wood,0,.19+i*.055,0);
    log.rotation.set(Math.PI/2,0,i*2.1);
  }
  const fireMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{time:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float time;void main(){
      float h=vUv.y;float sway=sin(h*7.-time*2.8)*.075*h+sin(h*13.-time*3.7)*.025*h;
      float width=mix(.39,.015,pow(h,.72));
      float edge=abs(vUv.x-.5-sway)/width;
      float alpha=(1.-smoothstep(.45,1.,edge))*smoothstep(0.,.12,h)*(1.-smoothstep(.73,1.,h));
      vec3 col=mix(vec3(1.,.77,.30),vec3(1.,.22,.045),smoothstep(.05,.85,h));
      gl_FragColor=vec4(col*1.5,alpha*.85);
    }`});
  for(let i=0;i<3;i++){
    const flame=mesh(new THREE.PlaneGeometry(.72,1.1),fireMat,Math.sin(i*2.1)*.15,.69,Math.cos(i*2.1)*.15);
    flame.rotation.y=i*Math.PI/3;flame.castShadow=false;
  }
  const light=new THREE.PointLight(0xffb660,3,7,2);light.position.set(0,1.0,0);root.add(light);
  // Two open, inward-facing plank benches leave the radio side approachable.
  const seatWood=material(0x84634a);
  for(const [bx,bz,angle] of [[-.15,2.2,-.07],[-2.2,-.2,-Math.PI/2-.09]]){
    const bench=new THREE.Group();bench.position.set(bx,terrainHeight(x+bx,z+bz)-root.position.y,bz);
    bench.rotation.y=angle;root.add(bench);
    const part=(w,h,d,mat,px,py,pz)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
      m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;bench.add(m);
    };
    for(const pz of [-.17,0,.17])part(1.8,.10,.15,seatWood,0,.48,pz);
    for(const px of [-.66,.66]){
      part(.13,.46,.40,wood,px,.23,0);
      part(.11,.75,.10,wood,px,.57,.22);
    }
    part(1.8,.18,.08,seatWood,0,.84,.24);
    part(1.4,.08,.08,wood,0,.22,0);
  }
  const stand=mesh(new THREE.DodecahedronGeometry(.46,1),stone,1.55,.25,.65);stand.scale.set(1,.65,.8);
  const radio=new THREE.Group();radio.position.set(1.55,.49,.65);radio.rotation.y=-.3;root.add(radio);
  const radioPart=(w,h,d,mat,px,py,pz)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(px,py,pz);radio.add(m);return m;};
  radioPart(.64,.40,.25,wood,0,.2,0);
  radioPart(.58,.32,.018,cream,0,.2,.132);
  for(let i=0;i<7;i++)radioPart(.25,.012,.008,dark,-.12,.09+i*.033,.147);
  radioPart(.16,.055,.009,dark,.17,.29,.148);
  const dial=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.023,16),cream);dial.rotation.x=Math.PI/2;dial.position.set(.17,.14,.16);radio.add(dial);
  for(const px of [-.2,.2])radioPart(.025,.12,.025,dark,px,.45,0);
  radioPart(.425,.025,.025,dark,0,.51,0);
  const audio=musicUrl?new Audio(musicUrl):null;if(audio)audio.loop=true;
  return {root,radio,audio,update(time,night){fireMat.uniforms.time.value=time;light.intensity=(1.3+night*2.0)*(1+.06*Math.sin(time*5)+.035*Math.sin(time*8.3));}};
}
