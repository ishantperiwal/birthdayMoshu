import * as THREE from 'three';
import {SHORE,throwPower,throwPlan,createThrow,advanceThrow,ballisticPoint,waterHeight} from './skipping-physics.js?v=ballistic-3';

export function buildStoneSkipping({scene,terrainHeight,interactive,toast,camera,getCompanion}){
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
  for(let i=0;i<11;i++){const p=new THREE.Mesh(pebbleGeo,stoneMats[i%4]),r=.085+(i%3)*.016;p.scale.set(r*1.3,r*.5,r);p.rotation.y=i*2.4;p.position.set(Math.sin(i*2.4)*.29,.19+(i%3)*.03,Math.cos(i*2.4)*.27);p.castShadow=true;bowlStand.add(p);}
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#dec39a';ctx.fillRect(0,0,768,256);ctx.strokeStyle='#aa825a';ctx.lineWidth=5;ctx.strokeRect(14,14,740,228);
  ctx.fillStyle='#594737';ctx.textAlign='center';ctx.font='italic 55px Georgia';ctx.fillText('A little further, together',384,100);ctx.font='25px Georgia';ctx.fillText('S T O N E   S K I P P I N G',384,163);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.BoxGeometry(1.65,.55,.055),new THREE.MeshStandardMaterial({map:texture,roughness:1}));sign.position.set(-.25,.9,1.5);sign.rotation.y=-Math.PI/2;root.add(sign);
  const post=new THREE.Mesh(new THREE.BoxGeometry(.07,.85,.07),wood);post.position.set(-.25,.44,1.5);root.add(post);

  const style=document.createElement('style');style.textContent=`
    .skip-card{position:fixed;left:28px;bottom:96px;width:290px;padding:22px 24px;background:linear-gradient(135deg,#203a40ed,#16272de8);border:1px solid #e6d4ab40;border-radius:4px 24px 4px 24px;color:#f7e8ca;box-shadow:0 8px 35px #0002;pointer-events:none;z-index:20;font:14px Georgia,serif}
    .skip-card[hidden],.skip-distance[hidden]{display:none}.skip-kicker{font:9px sans-serif;letter-spacing:3px;color:#bdd2c8;margin-bottom:9px}.skip-title{font-style:italic;font-size:23px;margin-bottom:13px}.skip-status{min-height:32px;font-size:13px;line-height:1.5;color:#dfdfca}.skip-meter{height:8px;background:#ffffff13;border-radius:8px;position:relative;margin:17px 0 8px}.skip-fill{height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,#83aca7,#edd396)}.skip-needle{position:absolute;top:-4px;height:16px;width:3px;background:#fff2cb;left:0;border-radius:3px;box-shadow:0 0 8px #ffe1a766}.skip-scale{display:flex;justify-content:space-between;font:10px sans-serif;color:#b8c7bb}.skip-records{display:flex;justify-content:space-between;margin-top:18px;padding-top:12px;border-top:1px solid #ffffff20;font-size:12px}.skip-help{margin-top:13px;color:#b9c9c5;font:10px sans-serif;line-height:1.7}.skip-distance{position:fixed;left:0;top:0;pointer-events:none;z-index:21;padding:6px 10px;border:1px solid #f1dfb24d;border-radius:12px;background:#20343ad9;color:#fff0cb;font:12px Georgia;white-space:nowrap}
    @media(max-width:600px){.skip-card{left:12px;bottom:100px;width:240px;padding:14px}.skip-title{font-size:20px}}
    .skip-card{left:50%;bottom:112px;transform:translateX(-50%);width:240px;padding:10px 14px;border:0;border-radius:12px;background:#182b32aa;box-shadow:none;text-align:center}
    .skip-kicker,.skip-title,.skip-scale,.skip-help{display:none}.skip-status{min-height:0;font:11px Georgia;line-height:1.4}.skip-meter{margin:9px 0;height:5px}.skip-records{font-size:10px;margin-top:7px;padding-top:6px}.skip-sweet{position:absolute;left:59%;width:22%;height:11px;top:-3px;border-radius:3px;background:#c7e4b866;border:1px solid #d7ecc4aa}.skip-needle{height:13px;z-index:1}
  `;document.head.append(style);
  const hud=document.createElement('div');hud.className='skip-card';hud.hidden=true;
  hud.innerHTML='<div class="skip-kicker">THE QUIET SHORE</div><div class="skip-title">A little further, together</div><div class="skip-status"></div><div class="skip-meter"><div class="skip-fill"></div><div class="skip-sweet"></div><div class="skip-needle"></div></div><div class="skip-scale"><span>gentle</span><span class="skip-range"></span><span>far</span></div><div class="skip-records"><span class="skip-you"></span><span class="skip-him"></span></div><div class="skip-help">Hold SPACE · release when it feels right<br>Q to leave · best throws this visit</div>';document.body.append(hud);
  const status=hud.querySelector('.skip-status'),fill=hud.querySelector('.skip-fill'),needle=hud.querySelector('.skip-needle'),range=hud.querySelector('.skip-range'),you=hud.querySelector('.skip-you'),him=hud.querySelector('.skip-him');
  const meter=hud.querySelector('.skip-meter');
  const held=new THREE.Group();camera.add(held);held.position.set(.27,-.28,-.55);held.rotation.z=-.22;held.visible=false;
  const skin=new THREE.MeshStandardMaterial({color:0xf3c94e,roughness:.34,emissive:0xdba835,emissiveIntensity:.12});
  const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.073,.09,.42,16),new THREE.MeshStandardMaterial({color:0xd778a3,roughness:.4}));sleeve.position.set(0,-.22,.10);sleeve.rotation.x=-.6;held.add(sleeve);sleeve.visible=false;
  const hand=new THREE.Mesh(new THREE.TorusGeometry(.087,.037,6,14,Math.PI*1.6),skin);hand.rotation.z=-Math.PI*.3;held.add(hand);hand.visible=false;
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
  let releaseMotion=null,opponentPending=false;
  let active=false,equipped=false,charge=-1,flight=null,turn='you',wait=0,time=0,best=[0,0],result='',lastPower=.5,labelUntil=0,labelPoint=null;
  function distanceAt(p){const start=flight?.start||SHORE;return Math.hypot(p.x-start.x,p.z-start.z);}
  function aim(){camera.getWorldDirection(aimDir);camera.getWorldPosition(eye);}
  function launch(power,who,origin=null,aimOverride=null){
    aim();turn=who;lastPower=power;const start=new THREE.Vector3();
    if(origin)start.copy(origin);else heldStone.getWorldPosition(start);
    const direction=aimOverride||aimDir;
    flight=createThrow({x:start.x,y:start.y,z:start.z},direction,power);
    for(const sample of trailSamples)sample.age=1;
    equipped=false;held.visible=false;charge=-1;pebble.visible=true;result='';
  }
  function leave(){releaseMotion=null;opponentPending=false;active=false;equipped=false;held.visible=false;charge=-1;wait=0;hud.hidden=true;dots.visible=false;label.hidden=true;}
  function impact(point){const i=point.index,r=ripples[rippleCursor++%ripples.length];r.age=0;r.x=point.x;r.z=point.z;
    if(i<3)for(let j=0;j<10;j++){const d=droplets[dropCursor++%droplets.length],angle=j*Math.PI*2/10+i*.8,speed=.45+(j%3)*.17;Object.assign(d,{age:0,x:point.x,y:waterHeight(point.x,point.z,time)+.13,z:point.z,vx:Math.cos(angle)*speed,vz:Math.sin(angle)*speed,vy:1.25+(j%4)*.2});}
  }
  function updateEffects(dt){
    for(const r of ripples){r.age+=dt;r.mesh.visible=r.age<2.4;if(!r.mesh.visible)continue;const scale=.20+r.age*.8,p=r.mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){const px=r.x+ringBase[i*3]*scale,pz=r.z+ringBase[i*3+2]*scale;p.setXYZ(i,px,waterHeight(px,pz,time)+.09,pz);}p.needsUpdate=true;r.mesh.material.opacity=(1-r.age/2.4)*.65;
    }
    let visible=false;for(let i=0;i<droplets.length;i++){const d=droplets[i];d.age+=dt;if(d.age<.75){visible=true;const t=d.age;splashPositions.set([d.x+d.vx*t,d.y+d.vy*t-2.9*t*t,d.z+d.vz*t],i*3);}else splashPositions.set([0,-100,0],i*3);}splash.visible=visible;splashGeo.attributes.position.needsUpdate=true;
  }
  interactive.push({type:'skipping',object:root,reach:4.5,prompt:'pick up a pebble',
    available:()=>{if(equipped||flight||wait>0||opponentPending||releaseMotion)return false;camera.getWorldDirection(aimDir);camera.getWorldPosition(eye);bowl.getWorldPosition(pickupWorld);pickupDirection.copy(pickupWorld).sub(eye).normalize();return aimDir.dot(pickupDirection)>.91;},
    action:()=>{if(equipped||flight||wait>0||opponentPending||releaseMotion)return;active=true;equipped=true;held.visible=true;result='Hold SPACE · release in the pale band';hud.hidden=false;toast('PEBBLE READY · AIM OVER THE WATER');}});
  return {
    get active(){return active&&(equipped||!!flight||wait>0||opponentPending||!!releaseMotion);},
    keyDown(e){if(!active)return false;if(e.code==='KeyQ'||e.code==='Escape'){leave();return true;}if(e.code!=='Space')return false;e.preventDefault();if(!e.repeat&&equipped&&!flight&&!releaseMotion&&wait<=0)charge=time;return true;},
    keyUp(e){if(active&&e.code==='Space'){e.preventDefault();if(charge>=0){aim();releaseMotion={age:0,power:throwPower(time-charge),direction:aimDir.clone()};charge=-1;}return true;}return false;},
    cancelCharge(){charge=-1;},
    update(dt,player,elapsed){time=elapsed;if(active&&Math.hypot(player.x-x,player.z-z)>7)leave();
      const partner=getCompanion();
      const nearby=()=>partner.anchor.position.distanceTo(player)<6&&Math.hypot(partner.anchor.position.x-x,partner.anchor.position.z-z)<9&&!partner.holding;
      if(releaseMotion){releaseMotion.age+=dt;const t=Math.min(releaseMotion.age/.24,1);
        held.position.set(.27-.10*t,-.28+.08*Math.sin(t*Math.PI),-.55-.20*t);held.rotation.z=-.22+.30*t;
        if(t>=1){const motion=releaseMotion;releaseMotion=null;held.updateWorldMatrix(true,true);launch(motion.power,'you',null,motion.direction);}
      }
      let trailPoint=null;
      if(flight){const f=flight;for(const event of advanceThrow(f,dt,time,terrainHeight))impact(event);
        const p=f.position;trailPoint=p;pebble.position.set(p.x,p.y,p.z);pebble.rotation.set(f.age*8,f.age*5,f.age*2);
        labelPoint={...p};labelUntil=time+1.5;label.textContent=`${distanceAt(p).toFixed(1)} m`;
        if(f.done){const index=turn==='you'?0:1,distance=distanceAt(p);best[index]=Math.max(best[index],distance);result=`${turn==='you'?'Your stone':'His stone'} · ${distance.toFixed(1)} m · ${f.landed?'landed ashore':f.skips+' skips'}`;flight=null;pebble.visible=false;if(turn==='you'&&active&&nearby())wait=1.4;}
      }else if(wait>0){wait-=dt;if(wait<=0&&active&&nearby()){
        const direction=new THREE.Vector3(.98,.08,.20).normalize(),power=.45+Math.random()*.4;
        opponentPending=partner.startThrow(direction,(origin,aim)=>{
          opponentPending=false;if(active&&nearby())launch(power,'him',origin,aim);
        });
      }}
      updateTrail(dt,trailPoint);
      updateEffects(dt);
      const ready=active&&equipped&&!flight&&wait<=0&&!opponentPending,power=charge>=0?throwPower(time-charge):0;
      aim();dots.visible=ready&&!releaseMotion;held.visible=ready;
      if(ready&&!releaseMotion){held.position.set(.27,-.28,-.55);held.rotation.z=-.22;held.position.y=-.28+(charge>=0?Math.sin((time-charge)*2)*.009:0);
        const origin=new THREE.Vector3();heldStone.getWorldPosition(origin);
        const speed=throwPlan(charge>=0?power:.7).speed;
        for(let i=0;i<12;i++){
          const t=(i+1)/12,p=ballisticPoint(origin,aimDir,speed,t*.20);
          dummy.position.set(p.x,p.y,p.z);dummy.scale.setScalar(.20+t*.35);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);
        }dots.instanceMatrix.needsUpdate=true;
      }
      if(active){hud.hidden=false;meter.hidden=charge<0;
        status.textContent=opponentPending?'His turn…':releaseMotion?'':flight?(turn==='you'?'Your throw…':'His turn…'):wait>0?result:equipped?(charge>=0?'Release in the pale band':'Aim freely · hold SPACE to throw'):result+' · E at the bowl for another';
        fill.style.width=needle.style.left=`${power*100}%`;range.textContent='';you.textContent=`You · ${best[0].toFixed(1)} m`;him.textContent=`Him · ${best[1].toFixed(1)} m`;
      }
      label.hidden=true;if(active&&labelPoint&&time<labelUntil){screen.set(labelPoint.x,labelPoint.y+.40,labelPoint.z).project(camera);if(screen.z>-1&&screen.z<1&&Math.abs(screen.x)<.98&&Math.abs(screen.y)<.95){label.hidden=false;label.style.transform=`translate(${(screen.x*.5+.5)*innerWidth}px,${(-screen.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;}}
    }
  };
}
