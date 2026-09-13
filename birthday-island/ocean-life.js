import { buildShipSteam } from './ship-steam.js?v=2';
import { CRUISE_START, cruisePose, cruiseResetAllowed } from './cruise-route.js?v=sideways-2';
import * as THREE from 'three';

export function buildOceanLife(scene){
  const root=new THREE.Group();scene.add(root);
  const mat=(color,roughness=.72)=>new THREE.MeshStandardMaterial({color,roughness});
  const navy=mat(0x465e69),cream=mat(0xe5d5b7),wood=mat(0x92745a),red=mat(0xae6f60),dark=mat(0x3d4242);
  const brass=mat(0xc5a372,.48);
  const windowMat=new THREE.MeshStandardMaterial({color:0xb8c9bd,emissive:0xffd6a0,emissiveIntensity:.28,roughness:.35});
  function add(g,geo,m,x,y,z){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;}
  const box=(g,w,h,d,m,x,y,z)=>add(g,new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const cyl=(g,rt,rb,h,m,x,y,z)=>add(g,new THREE.CylinderGeometry(rt,rb,h,16),m,x,y,z);
  const buoys=[];
  for(const [x,z,color] of [[-80,32,red],[-98,64,cream],[-83,86,red]]){
    const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
    cyl(g,.65,.52,.38,color,0,.10,0);cyl(g,.17,.40,.9,color,0,.7,0);
    cyl(g,.18,.18,.15,cream,0,.65,0);cyl(g,.045,.045,.8,dark,0,1.5,0);
    const cap=add(g,new THREE.OctahedronGeometry(.16),brass,0,1.95,0);cap.scale.y=1.3;
    buoys.push(g);
  }
  const boatScale=1.18;
  const boat=new THREE.Group();boat.scale.setScalar(boatScale);root.add(boat);
  // A compact coastal cruise: long hull, stepped decks and a clear bridge.
  const outline=[[-10,-2.35],[-8.8,-2.8],[6.4,-2.8],[9.5,-1.8],[11.5,0],[9.5,1.8],[6.4,2.8],[-8.8,2.8],[-10,2.35]];
  const vertices=[],indices=[];
  for(const [scale,y] of [[.76,-1.1],[1,.20],[1.01,1.22]])for(const [x,z] of outline)vertices.push(x*scale,y,z*scale);
  const n=outline.length;
  for(let ring=0;ring<2;ring++)for(let i=0;i<n;i++){const a=ring*n+i,b=ring*n+(i+1)%n;indices.push(a,a+n,b,b,a+n,b+n);}
  for(let i=1;i<n-1;i++)indices.push(2*n,2*n+i,2*n+i+1);
  const hull=new THREE.BufferGeometry();hull.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));hull.setIndex(indices);hull.computeVertexNormals();
  const hullMat=navy.clone();hullMat.side=THREE.DoubleSide;add(boat,hull,hullMat,0,0,0);
  const ivory=mat(0xf0e7d5);
  box(boat,18.6,.20,5.1,wood,-.8,1.30,0);
  box(boat,15.6,1.32,4.5,cream,-.9,2.04,0);
  box(boat,16.1,.15,4.85,ivory,-.9,2.78,0);
  box(boat,11.3,1.04,3.65,ivory,.05,3.37,0);
  box(boat,11.8,.16,4.0,cream,.05,3.98,0);
  box(boat,3.25,.88,3.5,ivory,3.6,4.49,0);
  box(boat,3.65,.13,3.85,navy,3.6,5.0,0);
  // Repeating cabin windows share one instanced draw.
  const windowTransforms=[];
  for(const [count,y,z,start,step] of [[13,2.17,2.258,-7.3,1.05],[10,3.43,1.833,-4.95,1.08]])
    for(const side of [-1,1])for(let i=0;i<count;i++)windowTransforms.push([start+i*step,y,side*z,.60,.43,.035]);
  for(const side of [-1,1])for(let i=0;i<3;i++)windowTransforms.push([2.55+i*.95,4.53,side*1.758,.74,.46,.035]);
  windowTransforms.push([5.232,4.53,0,.035,.46,2.65]);
  const windows=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),windowMat,windowTransforms.length),matrix=new THREE.Matrix4();
  windowTransforms.forEach(([x,y,z,sx,sy,sz],i)=>{matrix.makeScale(sx,sy,sz);matrix.setPosition(x,y,z);windows.setMatrixAt(i,matrix);});boat.add(windows);
  // Two warm ochre lifeboats on each side establish the cruise silhouette.
  for(const side of [-1,1])for(const x of [-4,0]){
    const life=add(boat,new THREE.SphereGeometry(1,12,6),brass,x,2.84,side*2.49);life.scale.set(1.25,.30,.37);
  }
  cyl(boat,.52,.68,1.42,red,-3.5,4.55,0);cyl(boat,.64,.57,.22,dark,-3.5,5.36,0);
  cyl(boat,.055,.055,1.15,wood,3.5,5.62,0);
  const rails=[];
  for(const side of [-1,1]){
    rails.push(new THREE.Vector3(-8.8,1.85,side*2.5),new THREE.Vector3(7.0,1.85,side*2.5));
    for(let x=-8.8;x<7.1;x+=1.8)rails.push(new THREE.Vector3(x,1.4,side*2.5),new THREE.Vector3(x,1.85,side*2.5));
  }
  boat.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rails),new THREE.LineBasicMaterial({color:0xdfd7c6})));
  // Extra aerial perspective on the offshore props, preserving the ship silhouette.
  const shipMaterials=new Set();boat.traverse(o=>{if(o.material)shipMaterials.add(o.material);});
  for(const material of shipMaterials){
    material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`#include <fog_fragment>
      #ifdef USE_FOG
      gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,clamp((vFogDepth-55.0)*.0012,0.0,.20));
      #endif`);};
    material.customProgramCacheKey=()=> 'cruise-sea-haze-v1';
  }
  const steam=buildShipSteam(root),funnel=new THREE.Vector3();
  // A short, translucent wake sits on the swell, never a bright white stripe.
  const wakeMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vUv;void main(){float width=.12+.36*(1.0-vUv.y);float edge=abs(abs(vUv.x-.5)-width);float a=exp(-edge*edge*1500.0)*sin(vUv.y*3.14159)*.075;gl_FragColor=vec4(.70,.79,.78,a);}`});
  const wake=new THREE.Mesh(new THREE.PlaneGeometry(6,16),wakeMat);wake.rotation.x=-Math.PI/2;wake.scale.set(boatScale,boatScale,1);root.add(wake);
  const frustum=new THREE.Frustum(),viewProjection=new THREE.Matrix4();
  const shipBounds=new THREE.Sphere(new THREE.Vector3(),33);
  const spawnBounds=new THREE.Sphere(new THREE.Vector3(CRUISE_START.x,3,CRUISE_START.z),33);
  const p={x:0,z:0,yaw:0};
  let voyageStart=0,lastTime=0,hiddenSeconds=0;
  const swell=(x,z,t)=>Math.sin((x*.860+z*.510)*.082+t*.58)*.34+Math.sin((x*-.319+z*.948)*.129-t*.46)*.21+Math.sin((x*.621+z*-.784)*.055+t*.33)*.44;
  return {update(t,night,camera){
    for(let i=0;i<buoys.length;i++){const b=buoys[i];b.position.y=swell(b.position.x,b.position.z,t);b.rotation.z=Math.sin(t*.7+i)*.07;b.rotation.x=Math.cos(t*.55+i)*.05;}
    const dt=Math.max(0,Math.min(.1,t-lastTime));lastTime=t;
    let age=t-voyageStart;cruisePose(age,p);
    // Test both locations, including the full silhouette. Looking back at the
    // launch point cannot reveal a reset even if the departing ship is hidden.
    camera.updateWorldMatrix(true,false);
    viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(viewProjection);
    shipBounds.center.set(p.x,3,p.z);
    const currentVisible=frustum.intersectsSphere(shipBounds),startVisible=frustum.intersectsSphere(spawnBounds);
    hiddenSeconds=currentVisible||startVisible?0:hiddenSeconds+dt;
    if(cruiseResetAllowed(age,hiddenSeconds,currentVisible,startVisible)){
      voyageStart=t;age=0;hiddenSeconds=0;cruisePose(age,p);steam.clear();
    }
    boat.position.set(p.x,swell(p.x,p.z,t)*.45,p.z);boat.rotation.set(Math.sin(t*.6)*.009,p.yaw,Math.sin(t*.8)*.009);
    windowMat.emissiveIntensity=.12+night*.6;
    wake.position.set(p.x-Math.cos(p.yaw)*17*boatScale,swell(p.x,p.z,t)+.03,p.z+Math.sin(p.yaw)*17*boatScale);wake.rotation.z=Math.PI/2-p.yaw;
    boat.updateMatrixWorld(true);funnel.set(-3.5,5.5,0);boat.localToWorld(funnel);
    steam.update(dt,t,funnel,.25,1.15);
  }};
}
