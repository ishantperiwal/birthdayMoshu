import * as THREE from 'three';
import {cashBundleGeometry} from './cash-bundle.js?v=coin-1';
import {createCashFlightPool} from './cash-flight-pool.js';
import {formatCash as money} from './cash-dash-state.js?v=coin-1';
export function buildCashRewards({onTick=()=>{}}={}){
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

  // The shown total waits for each bundle to land, then counts up to it step
  // by step (by 1 for small amounts), with a pop and a few sparks per step.
  let shown=0,landed=0,credited=0,round=0,count=null;
  const sparks=Array.from({length:64},()=>{const el=document.createElement('i');el.className='cash-spark';el.setAttribute('aria-hidden','true');card.append(el);return el;});
  let nextSpark=0;
  const sparkColors=['#ffe7a3','#f7cf6f','#bfe3a0','#fff6dc'];
  function burst(amount,big){
    if(reduced.matches)return;
    const x=value.offsetLeft+value.offsetWidth*.62,y=value.offsetTop+value.offsetHeight*.5;
    for(let i=0;i<amount;i++){
      const el=sparks[nextSpark++%sparks.length],angle=Math.random()*Math.PI*2,reach=(big?34:22)+Math.random()*(big?26:16),size=(big?9:7)+Math.random()*3;
      const color=sparkColors[Math.random()*sparkColors.length|0];
      el.style.cssText=`left:${x}px;top:${y}px;width:${size}px;height:${size}px;color:${color};background:radial-gradient(circle,#fff 0 22%,${color} 48%,transparent 72%)`;
      el.getAnimations().forEach(a=>a.cancel());
      el.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(angle)*reach}px),calc(-50% + ${Math.sin(angle)*reach-6}px)) scale(.2)`,opacity:0}],
        {duration:(big?680:460)+Math.random()*180,easing:'cubic-bezier(.15,.7,.3,1)'});
    }
  }
  function pop(big){
    if(reduced.matches)return;
    value.getAnimations().forEach(a=>a.cancel());
    value.animate([{transform:'scale(1)'},{transform:`scale(${big?1.3:1.14})`,offset:.35},{transform:'scale(1)'}],{duration:big?340:200,easing:'cubic-bezier(.2,.8,.3,1)'});
  }
  function arrive(amount,forRound){
    if(forRound!==round)return;
    landed=Math.min(credited,landed+amount);
    const from=shown,diff=landed-from;if(diff<=0)return;
    const steps=Math.min(Math.round(diff),28);
    count={from,to:landed,start:performance.now(),duration:Math.min(1100,160+steps*70),steps,done:0};
  }
  function advanceCount(now){
    if(!count)return;
    const k=Math.min(count.steps,Math.floor(Math.min(1,(now-count.start)/count.duration)*count.steps)+1);
    if(k<=count.done)return;
    count.done=k;shown=Math.round(count.from+(count.to-count.from)*k/count.steps);
    const last=k===count.steps;value.textContent=money(shown);pop(last);burst(last?16:6,last);onTick(k,count.steps);
    if(last){status.textContent=money(shown);count=null;}
  }
  const portraitTurn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
  function place(i,x,y,size,rx,ry,rz){dummy.position.set(x,y,0);dummy.rotation.set(rx,ry,rz);dummy.quaternion.multiply(portraitTurn);dummy.scale.setScalar(size);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);}
  function draw(now){
    advanceCount(now);
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
    // The credited total is authoritative at once; the shown number follows
    // as each bundle lands. A restore starts a new round and drops old flights.
    credited=Math.max(credited,reward.total);refreshTarget();
    if(reduced.matches){shown=landed=credited;update(credited);resolve?.();return;}
    const forRound=round;
    flights.add({...reward,x:Math.max(45,Math.min(innerWidth-45,reward.x)),y:Math.max(140,Math.min(innerHeight-60,reward.y))},performance.now(),()=>{arrive(reward.amount,forRound);resolve?.();});
  }
  return {
    collectInstant:reward=>collect(reward),
    update(){if(document.body.classList.contains('playing'))draw(performance.now());},
    restore(amount){round++;flights.clear();count=null;shown=landed=credited=amount;update(amount);},
    collect:reward=>new Promise(resolve=>collect(reward,resolve))
  };
}
