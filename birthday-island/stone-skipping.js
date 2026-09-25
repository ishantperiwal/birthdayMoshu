import * as THREE from 'three';
import {legoHandGeometry} from './lego-hand.js';
import {cashBundleGeometry} from './cash-bundle.js';
import {SHORE,SKIP_LANE,throwPower,throwPlan,createThrow,advanceThrow,ballisticPoint,waterHeight} from './skipping-physics.js?v=targets-8';
import {createTargetGame,predictFinish} from './pebble-targets.js';

export function buildStoneSkipping({scene,terrainHeight,interactive,toast,camera,getCompanion,canAutoplay=()=>true,onThrow=()=>{},onWin=()=>{},onNearMiss=()=>{}}){
  const {x,z}=SHORE,root=new THREE.Group();root.position.set(x,terrainHeight(x,z),z);scene.add(root);
  const pebbleGeo=new THREE.SphereGeometry(1,16,10);
  const palette=[0xe5ded0,0xc1ddd8,0xd1dbe5,0xe9c9b0];
  const stoneMats=palette.map(color=>new THREE.MeshStandardMaterial({color,roughness:.34,metalness:.04,emissive:color,emissiveIntensity:.08}));
  const wood=new THREE.MeshStandardMaterial({color:0xb58c65,roughness:.72});
  const bowlStand=new THREE.Group();bowlStand.position.y=.85;root.add(bowlStand);
  for(const angle of [0,Math.PI*2/3,Math.PI*4/3]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,.85,10),wood);leg.position.set(Math.cos(angle)*.29,.425,Math.sin(angle)*.29);leg.castShadow=true;root.add(leg);
  }
  const support=new THREE.Mesh(new THREE.CylinderGeometry(.48,.45,.08,24),wood);support.position.y=.83;root.add(support);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.49,.37,.13,24),wood);bowl.position.y=.075;bowlStand.add(bowl);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.46,.035,8,32),wood);rim.rotation.x=Math.PI/2;rim.position.y=.15;bowlStand.add(rim);
  // The solid tray must fill the shadow between the scattered pebbles.
  for(const part of [support,bowl,rim])part.castShadow=true;
  for(let i=0;i<11;i++){const p=new THREE.Mesh(pebbleGeo,stoneMats[i%4]),r=.085+(i%3)*.016;p.scale.set(r*1.3,r*.5,r);p.rotation.y=i*2.4;p.position.set(Math.sin(i*2.4)*.29,.19+(i%3)*.03,Math.cos(i*2.4)*.27);p.castShadow=true;bowlStand.add(p);}
  const style=document.createElement('style');style.textContent=`
    .skip-card{position:fixed;left:28px;bottom:96px;width:290px;padding:22px 24px;background:linear-gradient(135deg,#203a40ed,#16272de8);border:1px solid #e6d4ab40;border-radius:4px 24px 4px 24px;color:#f7e8ca;box-shadow:0 8px 35px #0002;pointer-events:none;z-index:20;font:14px Georgia,serif}
    .skip-card[hidden],.skip-distance[hidden]{display:none}.skip-kicker{font:9px sans-serif;letter-spacing:3px;color:#bdd2c8;margin-bottom:9px}.skip-title{font-style:italic;font-size:23px;margin-bottom:13px}.skip-status{min-height:32px;font-size:13px;line-height:1.5;color:#dfdfca}.skip-meter{height:8px;background:#ffffff13;border-radius:8px;position:relative;margin:17px 0 8px}.skip-fill{height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,#83aca7,#edd396)}.skip-needle{position:absolute;top:-4px;height:16px;width:3px;background:#fff2cb;left:0;border-radius:3px;box-shadow:0 0 8px #ffe1a766}.skip-scale{display:flex;justify-content:space-between;font:10px sans-serif;color:#b8c7bb}.skip-records{display:flex;justify-content:space-between;margin-top:18px;padding-top:12px;border-top:1px solid #ffffff20;font-size:12px}.skip-help{margin-top:13px;color:#b9c9c5;font:10px sans-serif;line-height:1.7}.skip-distance{position:fixed;left:0;top:0;pointer-events:none;z-index:21;padding:6px 10px;border:1px solid #f1dfb24d;border-radius:12px;background:#20343ad9;color:#fff0cb;font:12px Georgia;white-space:nowrap}
    @media(max-width:600px){.skip-card{left:12px;bottom:100px;width:240px;padding:14px}.skip-title{font-size:20px}}
    .skip-card{left:50%;bottom:112px;transform:translateX(-50%);width:240px;padding:10px 14px;border:0;border-radius:12px;background:#182b32aa;box-shadow:none;text-align:center}
    .skip-kicker,.skip-title,.skip-scale,.skip-help,.skip-sweet{display:none}.skip-status{min-height:0;font:11px Georgia;line-height:1.4}.skip-meter{margin:9px 0;height:5px}.skip-records{font-size:10px;margin-top:7px;padding-top:6px}.skip-needle{height:13px;z-index:1}
    .skip-meter{height:14px;margin:12px 0 6px}.skip-needle{height:22px}
    .skip-scale{display:flex}.skip-records{border:0;margin-top:8px;padding:0}
    .skip-card{box-sizing:border-box;width:min(420px,calc(100vw - 32px));padding:15px 20px}
    .skip-status{font:15px/1.45 system-ui}.skip-scale,.skip-records{font:13px/1.4 system-ui}
    .skip-meter{height:16px}.skip-needle{height:24px}
    .skip-success{position:fixed;left:50%;top:43%;transform:translate(-50%,-50%);z-index:90;pointer-events:none;text-align:center;color:#fff0c5;text-shadow:0 3px 14px #172e37;opacity:0;width:min(440px,90vw)}
    .skip-success strong{display:block;font:600 clamp(26px,2.4vw,38px)/1.2 Georgia,serif}
    .skip-success span{display:block;margin-top:8px;font:15px/1.4 system-ui}
  `;document.head.append(style);
  const hud=document.createElement('div');hud.className='skip-card';hud.hidden=true;
  const success=document.createElement('div');success.className='skip-success';success.setAttribute('role','status');document.body.append(success);
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');let successAnimation=null;
  function celebrateWin(complete,nearMiss=false){
    success.style.color=nearMiss?'#efaaa7':'#fff0c5';
    success.innerHTML=nearMiss?'<strong>Near miss, nice try</strong>':complete?'<strong>All three hoops!</strong><span>You did it!</span>':'<strong>Inside the hoop!</strong><span>Beautiful throw!</span>';
    successAnimation?.cancel();
    const rest='translate(-50%,-50%)';
    successAnimation=success.animate([{opacity:0,transform:rest+(reducedMotion.matches?'':' scale(.92)')},{opacity:1,transform:rest,offset:.12},{opacity:1,transform:rest,offset:.78},{opacity:0,transform:rest}],{duration:2400,easing:'ease-out'});
  }
  hud.innerHTML='<div class="skip-kicker">THE QUIET SHORE</div><div class="skip-title">A little further, together</div><div class="skip-status"></div><div class="skip-meter"><div class="skip-fill"></div><div class="skip-sweet"></div><div class="skip-needle"></div></div><div class="skip-scale"><span>gentle</span><span class="skip-range"></span><span>far</span></div><div class="skip-records"><span class="skip-you"></span><span class="skip-him"></span></div><div class="skip-help">Hold SPACE · release when it feels right<br>Q to leave · best throws this visit</div>';document.body.append(hud);
  const status=hud.querySelector('.skip-status'),fill=hud.querySelector('.skip-fill'),needle=hud.querySelector('.skip-needle'),range=hud.querySelector('.skip-range'),you=hud.querySelector('.skip-you'),him=hud.querySelector('.skip-him');
  hud.querySelector('.skip-scale span:last-child').textContent='strong';
  const meter=hud.querySelector('.skip-meter');
  const held=new THREE.Group();camera.add(held);held.position.set(.27,-.28,-.55);held.rotation.z=-.22;held.visible=false;
  const skin=new THREE.MeshStandardMaterial({color:0xf3c94e,roughness:.34,emissive:0xdba835,emissiveIntensity:.12});
  const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.073,.09,.42,16),new THREE.MeshStandardMaterial({color:0xd778a3,roughness:.4}));sleeve.position.set(0,-.22,.10);sleeve.rotation.x=-.6;held.add(sleeve);sleeve.visible=false;
  const hand=new THREE.Mesh(legoHandGeometry(),skin);hand.rotation.z=-Math.PI*.3;held.add(hand);hand.visible=false;
  const heldStone=new THREE.Mesh(pebbleGeo,stoneMats[1]);heldStone.scale.set(.061,.029,.052);heldStone.position.set(.027,0,-.025);heldStone.rotation.z=.18;held.add(heldStone);
  const aimDir=new THREE.Vector3(),eye=new THREE.Vector3(),pickupDirection=new THREE.Vector3(),pickupWorld=new THREE.Vector3();
  const label=document.createElement('div');label.className='skip-distance';label.hidden=true;document.body.append(label);
  const pebble=new THREE.Mesh(pebbleGeo,stoneMats[0]);pebble.scale.set(.18,.07,.13);pebble.visible=false;scene.add(pebble);
  // A short fading stroke uses one reusable line, shared by both players.
  const trailCount=18,trailPositions=new Float32Array(trailCount*3),trailOpacity=new Float32Array(trailCount);
  const trailGeometry=new THREE.BufferGeometry();trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));trailGeometry.setAttribute('aOpacity',new THREE.BufferAttribute(trailOpacity,1));
  const trailMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{uColor:{value:new THREE.Color(0xe5e9d5)}},
    vertexShader:'attribute float aOpacity; varying float vOpacity; void main(){vOpacity=aOpacity;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 uColor; varying float vOpacity; void main(){gl_FragColor=vec4(uColor,vOpacity); \n #include <tonemapping_fragment> \n #include <colorspace_fragment> \n}'
  });
  const trail=new THREE.Line(trailGeometry,trailMaterial);trail.frustumCulled=false;trail.visible=false;scene.add(trail);
  const trailSamples=Array.from({length:trailCount},()=>({x:0,y:0,z:0,age:1}));
  function updateTrail(dt,point){
    for(const sample of trailSamples)sample.age+=dt;
    if(point){const recycled=trailSamples.pop();Object.assign(recycled,{x:point.x,y:point.y,z:point.z,age:0});trailSamples.unshift(recycled);}
    let count=0;
    for(const sample of trailSamples){if(sample.age>.20)break;trailPositions.set([sample.x,sample.y,sample.z],count*3);trailOpacity[count]=.42*Math.pow(1-sample.age/.20,1.5);count++;}
    trailGeometry.setDrawRange(0,count);trail.visible=count>1;trailGeometry.attributes.position.needsUpdate=true;trailGeometry.attributes.aOpacity.needsUpdate=true;
  }
  const rippleGeometry=new THREE.RingGeometry(.88,1,40);rippleGeometry.rotateX(-Math.PI/2);
  const ripples=Array.from({length:12},()=>{const geometry=rippleGeometry.clone();const material=new THREE.MeshBasicMaterial({color:0xe4f4de,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geometry,material);mesh.visible=false;mesh.frustumCulled=false;scene.add(mesh);return {mesh,age:9,x:0,z:0};});
  const ringBase=rippleGeometry.attributes.position.array;let rippleCursor=0;
  const dots=new THREE.InstancedMesh(new THREE.SphereGeometry(.045,8,5),new THREE.MeshBasicMaterial({color:0xf2ddac,transparent:true,opacity:.46,depthWrite:false}),12);dots.frustumCulled=false;dots.visible=false;scene.add(dots);
  const dummy=new THREE.Object3D(),screen=new THREE.Vector3();
  const splashGeo=new THREE.BufferGeometry(),splashPositions=new Float32Array(36*3);splashGeo.setAttribute('position',new THREE.BufferAttribute(splashPositions,3));
  const splashCanvas=document.createElement('canvas');splashCanvas.width=splashCanvas.height=32;const sc=splashCanvas.getContext('2d'),grad=sc.createRadialGradient(16,16,0,16,16,16);grad.addColorStop(0,'#ffffff');grad.addColorStop(.5,'#ffffffbb');grad.addColorStop(1,'#ffffff00');sc.fillStyle=grad;sc.fillRect(0,0,32,32);
  const splash=new THREE.Points(splashGeo,new THREE.PointsMaterial({color:0xe7f6e8,size:.10,map:new THREE.CanvasTexture(splashCanvas),transparent:true,depthWrite:false}));splash.frustumCulled=false;scene.add(splash);
  const droplets=Array.from({length:36},()=>({age:9,x:0,y:0,z:0,vx:0,vy:0,vz:0}));let dropCursor=0;
  const remoteStones=Array.from({length:4},()=>{const mesh=new THREE.Mesh(pebbleGeo,stoneMats[0]);mesh.scale.set(.18,.07,.13);mesh.visible=false;scene.add(mesh);return {mesh,flight:null};});
  let remoteCursor=0;
  let opponentPending=false;
  const game=createTargetGame();
  const prizeCanvas=document.createElement('canvas');prizeCanvas.width=256;prizeCanvas.height=128;
  const prizeCtx=prizeCanvas.getContext('2d');prizeCtx.fillStyle='#fff0c4';prizeCtx.font='bold 64px Georgia';prizeCtx.textAlign='center';prizeCtx.fillText('+€50',128,85);
  const prize=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(prizeCanvas),transparent:true,depthWrite:false}));prize.scale.set(2.4,1.2,1);prize.visible=false;scene.add(prize);
  const prizeCash=new THREE.Mesh(cashBundleGeometry(),new THREE.MeshBasicMaterial({vertexColors:true}));prizeCash.visible=false;scene.add(prizeCash);
  const targetGeometry=new THREE.RingGeometry(.92,1,64);targetGeometry.rotateX(-Math.PI/2);
  const targetBase=targetGeometry.attributes.position.array.slice();
  const targetRing=new THREE.Mesh(targetGeometry,new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,1.7,.9),toneMapped:false,transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide}));
  targetRing.frustumCulled=false;targetRing.visible=false;targetRing.renderOrder=3;scene.add(targetRing);
  // Two lines of floating markers define a straight offshore throwing lane.
  const lane=new THREE.InstancedMesh(new THREE.SphereGeometry(.10,8,5),new THREE.MeshBasicMaterial({color:new THREE.Color(1.4,1.8,1.6),toneMapped:false}),18);
  lane.frustumCulled=false;scene.add(lane);
  const sparkPositions=new Float32Array(24*3),sparkGeometry=new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position',new THREE.BufferAttribute(sparkPositions,3));
  const targetSparks=new THREE.Points(sparkGeometry,new THREE.PointsMaterial({map:splash.material.map,color:new THREE.Color(1.3,1.1,.7),toneMapped:false,size:.075,opacity:.65,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  targetSparks.frustumCulled=false;targetSparks.visible=false;targetSparks.renderOrder=3;scene.add(targetSparks);
  const landingDot=new THREE.Mesh(new THREE.RingGeometry(.12,.28,24),new THREE.MeshBasicMaterial({color:0xffefd0,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));
  landingDot.rotation.x=-Math.PI/2;landingDot.visible=false;scene.add(landingDot);
  let prediction=null,predictionAt=-Infinity;
  function updateTarget(){
    for(let i=0;i<18;i++){
      const along=5+Math.floor(i/2)*4,side=(i%2?1:-1)*SKIP_LANE.halfWidth;
      const px=x+along*SKIP_LANE.x-side*SKIP_LANE.z,pz=z+along*SKIP_LANE.z+side*SKIP_LANE.x;
      dummy.position.set(px,waterHeight(px,pz,time)+.45,pz);dummy.scale.setScalar(1);dummy.updateMatrix();lane.setMatrixAt(i,dummy.matrix);
    }
    lane.instanceMatrix.needsUpdate=true;
    const target=game.target;targetRing.visible=active&&!!target;
    targetSparks.visible=targetRing.visible;
    prize.visible=targetRing.visible&&game.round===3&&!game.complete;
    if(prize.visible)prize.position.set(target.x,waterHeight(target.x,target.z,time)+2.4+Math.sin(time*1.5)*.08,target.z);
    prizeCash.visible=prize.visible;if(prize.visible){prizeCash.position.copy(prize.position);prizeCash.position.y+=.9;prizeCash.rotation.y=time*.6;}
    if(!targetRing.visible)return;
    const p=targetGeometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const px=target.x+targetBase[i*3]*target.radius,pz=target.z+targetBase[i*3+2]*target.radius;
      p.setXYZ(i,px,waterHeight(px,pz,time)+.24,pz);
    }
    p.needsUpdate=true;targetRing.material.color.setRGB(...(game.won?[1.5,2.4,1.2]:[2.2,1.7,.9]));
    for(let i=0;i<24;i++){
      const angle=i*2.39996,age=(time*.38+i/24)%1;
      const px=target.x+Math.cos(angle)*target.radius,pz=target.z+Math.sin(angle)*target.radius;
      sparkPositions.set([px,waterHeight(px,pz,time)+.25+age*.4,pz],i*3);
    }
    sparkGeometry.attributes.position.needsUpdate=true;
    targetRing.material.opacity=game.won?.86+.10*Math.sin(time*4):.76;
  }
  let active=false,equipped=false,charge=-1,chargeSource=null,flight=null,turn='you',wait=0,time=0,best=[0,0],result='',lastPower=.5,labelUntil=0,labelPoint=null;
  function startCharge(source){if(equipped&&!flight&&wait<=0&&!opponentPending&&charge<0){charge=time;chargeSource=source;}}
  function releaseCharge(source){if(charge>=0&&chargeSource===source){held.updateWorldMatrix(true,true);launch(throwPower(time-charge),'you');chargeSource=null;}}
  function aim(){camera.getWorldDirection(aimDir);camera.getWorldPosition(eye);}
  function launch(power,who,origin=null,aimOverride=null){
    aim();turn=who;lastPower=power;const start=new THREE.Vector3();
    if(origin)start.copy(origin);else heldStone.getWorldPosition(start);
    const direction=aimOverride||aimDir;
    flight=createThrow({x:start.x,y:start.y,z:start.z},direction,power);
    onThrow({type:"stone",power,origin:start.toArray(),direction:direction.toArray()});
    pebble.position.copy(start);dots.visible=false;
    for(const sample of trailSamples)sample.age=1;
    equipped=false;held.visible=false;charge=-1;pebble.visible=true;result='';
  }
  function leave(){successAnimation?.cancel();success.textContent='';opponentPending=false;active=false;equipped=false;held.visible=false;charge=-1;chargeSource=null;wait=0;hud.hidden=true;dots.visible=false;label.hidden=true;targetRing.visible=false;targetSparks.visible=false;landingDot.visible=false;game.reset();}
  function impact(point){const i=point.index,r=ripples[rippleCursor++%ripples.length];r.age=0;r.x=point.x;r.z=point.z;
    if(i<12)for(let j=0;j<6;j++){const d=droplets[dropCursor++%droplets.length],angle=j*Math.PI*2/6+i*.8,speed=.45+(j%3)*.17;Object.assign(d,{age:0,x:point.x,y:waterHeight(point.x,point.z,time)+.13,z:point.z,vx:Math.cos(angle)*speed,vz:Math.sin(angle)*speed,vy:1.25+(j%4)*.2});}
  }
  function updateEffects(dt){
    for(const r of ripples){r.age+=dt;r.mesh.visible=r.age<2.4;if(!r.mesh.visible)continue;const scale=.20+r.age*.8,p=r.mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){const px=r.x+ringBase[i*3]*scale,pz=r.z+ringBase[i*3+2]*scale;p.setXYZ(i,px,waterHeight(px,pz,time)+.09,pz);}p.needsUpdate=true;r.mesh.material.opacity=(1-r.age/2.4)*.65;
    }
    let visible=false;for(let i=0;i<droplets.length;i++){const d=droplets[i];d.age+=dt;if(d.age<.75){visible=true;const t=d.age;splashPositions.set([d.x+d.vx*t,d.y+d.vy*t-2.9*t*t,d.z+d.vz*t],i*3);}else splashPositions.set([0,-100,0],i*3);}splash.visible=visible;splashGeo.attributes.position.needsUpdate=true;
  }
  const pickup={type:'skipping',object:root,reach:4.5,prompt:'pick up a pebble',
    available:()=>{if(equipped||flight||wait>0||opponentPending)return false;camera.getWorldDirection(aimDir);camera.getWorldPosition(eye);bowl.getWorldPosition(pickupWorld);pickupDirection.copy(pickupWorld).sub(eye).normalize();return aimDir.dot(pickupDirection)>.91;},
    action:()=>{if(equipped||flight||wait>0||opponentPending)return;
      held.updateWorldMatrix(true,true);const origin=new THREE.Vector3();heldStone.getWorldPosition(origin);
      if(!game.prepare(origin,time,terrainHeight)){toast('TRY FROM THE SEAWARD SIDE OF THE BOWL');return;}
      active=true;equipped=true;held.visible=true;predictionAt=-Infinity;result='';hud.hidden=false;
      toast(`ROUND ${game.round} OF 3 · FINISH INSIDE THE HOOP`);}};
  interactive.push(pickup);
  return {
    receiveThrow(e){const stone=remoteStones[remoteCursor++%remoteStones.length];stone.flight=createThrow({x:e.origin[0],y:e.origin[1],z:e.origin[2]},new THREE.Vector3(...e.direction),e.power);stone.mesh.visible=true;},
    get active(){return active&&(equipped||!!flight||wait>0||opponentPending);},
    pointerDown(e,player){
      if(e.button!==0)return false;
      if(active&&equipped){e.preventDefault();startCharge('mouse');return true;}
      if(root.position.distanceTo(player)<pickup.reach&&pickup.available()){
        e.preventDefault();pickup.action();return true; // Pickup release must never launch.
      }
      return false;
    },
    pointerUp(e){if(e.button===0&&chargeSource==='mouse'){e.preventDefault();releaseCharge('mouse');return true;}return false;},
    keyDown(e){if(!active)return false;if(e.code==='KeyQ'||e.code==='Escape'){leave();return true;}if(e.code!=='Space')return false;e.preventDefault();if(!e.repeat)startCharge('keyboard');return true;},
    keyUp(e){if(active&&e.code==='Space'){e.preventDefault();releaseCharge('keyboard');return true;}return false;},
    cancelCharge(){charge=-1;chargeSource=null;},
    update(dt,player,elapsed){time=elapsed;if(active&&Math.hypot(player.x-x,player.z-z)>7)leave();
      const partner=getCompanion();
      const nearby=()=>canAutoplay()&&partner.anchor.position.distanceTo(player)<6&&Math.hypot(partner.anchor.position.x-x,partner.anchor.position.z-z)<9&&!partner.holding;
      let trailPoint=null;
      if(flight){const f=flight;for(const event of advanceThrow(f,dt,time,terrainHeight))impact(event);
        const p=f.position;trailPoint=p;pebble.position.set(p.x,p.y,p.z);pebble.rotation.set(f.age*8,f.age*5,f.age*2);
        labelPoint={...p};labelUntil=0;
        if(f.done){
          const won=turn==='you'&&active&&game.finish(f);
          if(won){
            result=game.complete?`All three hoops! · ${game.attempts} throws`:`Round ${game.round} won!`;
            labelUntil=0;celebrateWin(game.complete);onWin(game.complete);
          }else{
            result=turn==='you'?'Try again':'His turn finished';
            const target=game.target;
            if(turn==='you'&&active&&f.finish==='water'&&target){
              const outside=Math.hypot(f.position.x-target.x,f.position.z-target.z)-target.radius;
              if(outside>0&&outside<=.85){result='Near miss, nice try';celebrateWin(false,true);onNearMiss();}
            }
          }
          flight=null;
          if(f.finish==='land'){
            const restingAge=f.age;
            setTimeout(()=>{if(!flight&&pebble.rotation.x===restingAge*8)pebble.visible=false;},1800);
          }else pebble.visible=false;
          if(turn==='you'&&active&&!game.complete)wait=.8;
        }
      }else if(wait>0){wait-=dt;if(wait<=0&&active){
        const origin=new THREE.Vector3();held.updateWorldMatrix(true,true);heldStone.getWorldPosition(origin);
        if(game.prepare(origin,time,terrainHeight)){equipped=true;held.visible=true;predictionAt=-Infinity;}
      }}
      for(const stone of remoteStones){if(!stone.flight)continue;
        for(const event of advanceThrow(stone.flight,dt,time,terrainHeight))impact(event);
        const p=stone.flight.position;stone.mesh.position.set(p.x,p.y,p.z);stone.mesh.rotation.set(stone.flight.age*8,stone.flight.age*5,0);
        if(stone.flight.done){stone.flight=null;stone.mesh.visible=false;}
      }
      updateTrail(dt,trailPoint);
      updateEffects(dt);
      updateTarget();
      const ready=active&&equipped&&!flight&&wait<=0&&!opponentPending,power=charge>=0?throwPower(time-charge):0;
      aim();dots.visible=ready;held.visible=ready;landingDot.visible=false;
      if(ready){held.position.set(.27,-.28,-.55);held.rotation.z=-.22;held.position.y=-.28+(charge>=0?Math.sin((time-charge)*2)*.009:0);
        const origin=new THREE.Vector3();heldStone.getWorldPosition(origin);
        const previewPower=charge>=0?power:.20;
        const speed=throwPlan(previewPower).speed;
        if(time-predictionAt>=.10){prediction=predictFinish(origin,aimDir,previewPower,time,terrainHeight);predictionAt=time;}
        if(prediction?.finish==='water'){
          const p=prediction.position;landingDot.position.set(p.x,waterHeight(p.x,p.z,time)+.12,p.z);landingDot.visible=true;
          const inside=game.target&&Math.hypot(p.x-game.target.x,p.z-game.target.z)<=game.target.radius;
          landingDot.material.color.setHex(inside?0xc8f5b1:0xffefd0);
        }
        for(let i=0;i<12;i++){
          const t=(i+1)/12,p=ballisticPoint(origin,aimDir,speed,t*.20);
          dummy.position.set(p.x,p.y,p.z);dummy.scale.setScalar(.20+t*.35);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);
        }dots.instanceMatrix.needsUpdate=true;
      }
      if(active){hud.hidden=false;meter.hidden=false;
        status.textContent=opponentPending?'His turn…':flight?'Watch your stone…':wait>0?result:equipped?(charge>=0?'Release to throw':'Aim · hold click for power'):game.complete?'Click bowl to replay':game.won?'Click bowl for next hoop':'Click bowl to retry';
        fill.style.width=needle.style.left=`${power*100}%`;range.textContent='';you.textContent=game.complete?'3 / 3 complete':`Round ${game.round} / 3`;him.textContent='Esc · leave';
      }
      label.hidden=true;if(active&&labelPoint&&time<labelUntil){screen.set(labelPoint.x,labelPoint.y+.40,labelPoint.z).project(camera);if(screen.z>-1&&screen.z<1&&Math.abs(screen.x)<.98&&Math.abs(screen.y)<.95){label.hidden=false;label.style.transform=`translate(${(screen.x*.5+.5)*innerWidth}px,${(-screen.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;}}
    }
  };
}
