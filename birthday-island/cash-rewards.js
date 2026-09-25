import * as THREE from 'three';
import {cashBundleGeometry} from './cash-bundle.js?v=gold-wrap-3';
import {createCashFlightPool} from './cash-flight-pool.js';
import {formatCash as money} from './cash-dash-state.js';
export function buildCashRewards(){
  const card=document.querySelector('.treasure-card'),value=document.querySelector('#gift-value'),icon=card.querySelector('.cash-icon');
  const layer=document.createElement('div');layer.className='cash-flight-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);
  const status=document.createElement('div');status.className='cash-sr-only';status.setAttribute('role','status');document.body.append(status);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const flights=createCashFlightPool();
  // One shared mesh/material with fixed capacity; pickups allocate no GPU resources.
  const geometry=cashBundleGeometry();
  const material=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,innerWidth,0,innerHeight,-1000,1000);camera.position.z=100;
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(1);renderer.setClearColor(0,0);layer.append(renderer.domElement);
  const batch=new THREE.InstancedMesh(geometry,material,flights.capacity+1);batch.frustumCulled=false;batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(batch);
  const dummy=new THREE.Object3D();let target={x:0,y:0};
  const refreshTarget=()=>{const r=icon.getBoundingClientRect();target={x:r.left+r.width/2,y:r.top+r.height/2};};
  const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.right=innerWidth;camera.bottom=innerHeight;camera.updateProjectionMatrix();refreshTarget();};
  resize();window.addEventListener('resize',resize);new ResizeObserver(refreshTarget).observe(card);
  const update=amount=>{value.textContent=money(amount);status.textContent=money(amount);};
  const portraitTurn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
  function place(i,x,y,size,rx,ry,rz){dummy.position.set(x,y,0);dummy.rotation.set(rx,ry,rz);dummy.quaternion.multiply(portraitTurn);dummy.scale.setScalar(size);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);}
  function draw(now){
    dummy.rotation.order='ZXY';
    place(0,target.x,target.y,48,.12,reduced.matches?.35:now*.00065,-.24);
    for(let i=1;i<=flights.capacity;i++)place(i,0,0,0,0,0,0);
    flights.step(now,(index,reward,t)=>{
      const fly=THREE.MathUtils.smoothstep(t,0,1);
      const x=THREE.MathUtils.lerp(reward.x,target.x,fly);
      const y=THREE.MathUtils.lerp(reward.y,target.y,fly)-Math.sin(fly*Math.PI)*40;
      // Start large, where the gift was, with a quick pop, then settle into the card icon.
      const pop=t<.12?.72+.28*Math.sin(t/.12*Math.PI/2):1;
      place(index+1,x,y,THREE.MathUtils.lerp(125,48,fly)*pop,.12,now*.00065+.6*(1-fly),-.24);
    });
    batch.instanceMatrix.needsUpdate=true;renderer.render(scene,camera);
  }
  // Compile the shader and upload the FULL instance buffer during loading.
  draw(0);
  function collect(reward,resolve){
    // Older flight arrivals never reset the authoritative, immediately credited total.
    update(reward.total);refreshTarget();
    if(reduced.matches){resolve?.();return;}
    flights.add({...reward,x:Math.max(45,Math.min(innerWidth-45,reward.x)),y:Math.max(140,Math.min(innerHeight-60,reward.y))},performance.now(),resolve);
  }
  return {
    collectInstant:reward=>collect(reward),
    update(){if(document.body.classList.contains('playing'))draw(performance.now());},
    restore(amount){flights.clear();update(amount);},
    collect:reward=>new Promise(resolve=>collect(reward,resolve))
  };
}
