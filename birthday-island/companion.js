import {DATE_OUTFIT} from './date-suit.js?v=1';
import * as THREE from 'three';
import { buildCharacter } from './character.js?v=slow-follow-1';

// His original following speed, and a leg rhythm that matches the actual
// ground speed so strides never look rushed or skate.
const FOLLOW_SPEED=8.8;
export const legPace=(speed,running)=>running?Math.max(.6,Math.min(1.1,speed/8.5)):Math.max(.4,Math.min(1.1,speed/5));
export function buildCompanion(scene,{terrainHeight,onIsland,stageHeight,stageRadius,female=false,resolveMove=(x,z,dx,dz)=>({x:x+dx,z:z+dz})}){
  const anchor=new THREE.Group();scene.add(anchor);anchor.position.set(-5.9,0,-10.1);
  const character=buildCharacter(anchor,female?{}:DATE_OUTFIT);
  character.root.scale.setScalar(1.06);
  let stoneThrow=null,expressiveAge=Infinity,networkMoving=false;
  let holding=false,holdReady=false,hasCelebrated=false,waveUntil=0,waveArmed=true;
  const previousPlayer=new THREE.Vector3();
  let hasPreviousPlayer=false;
  let networkSpeed=0,state='waiting',cheerAge=0,speed=0,time=0,nextGlance=3,glanceUntil=0,glanceYaw=0,fireworkUntil=0;
  const fireworkTarget=new THREE.Vector3(),look=new THREE.Vector3(),giftPosition=new THREE.Vector3();
  const attention={yaw:0,pitch:0,tilt:0,point:false,wave:false,direction:new THREE.Vector3()};
  function ground(x,z){return terrainHeight(x,z)+stageHeight*(1-THREE.MathUtils.smoothstep(Math.hypot(x+8,z+10),stageRadius-.06,stageRadius+.12));}
  const inverseBody=new THREE.Quaternion();
  function applyManualLook(dt,view,moving,turnBody=true){
    attention.manualPoint=!!view?.pointing;
    if(!view)return;
    if(turnBody&&!moving&&!holding&&!stoneThrow){
      const delta=Math.atan2(Math.sin(view.yaw-anchor.rotation.y),Math.cos(view.yaw-anchor.rotation.y));
      anchor.rotation.y+=delta*(1-Math.exp(-dt*5));
    }
    attention.direction.set(-Math.sin(view.yaw)*Math.cos(view.pitch),Math.sin(view.pitch),-Math.cos(view.yaw)*Math.cos(view.pitch));
    inverseBody.copy(anchor.quaternion).invert();attention.direction.applyQuaternion(inverseBody);
    attention.yaw=THREE.MathUtils.clamp(Math.atan2(-attention.direction.x,-attention.direction.z),-1.15,1.15);
    attention.pitch=THREE.MathUtils.clamp(Math.atan2(attention.direction.y,Math.hypot(attention.direction.x,attention.direction.z)),-.7,.9);
    attention.tilt=0;attention.wave=false;attention.point=!!view.pointing;
  }
  anchor.position.y=ground(anchor.position.x,anchor.position.z);anchor.rotation.y=Math.PI;
  return {anchor,
    setExpression:(value,duration)=>character.setExpression(value,duration),
    setBouquet:(value,snap=false)=>character.setBouquet(value,snap),
    updateBouquet:(dt,suppressed=false)=>character.updateBouquet(dt,suppressed),
    updateCloth:dt=>character.updateCloth(dt),
    triggerGesture:value=>character.triggerGesture(value),
    updateGesture:(dt,suppressed)=>character.updateGesture(dt,suppressed),
    setBouquetView:value=>character.setBouquetView(value),
    get motion(){return {moving:networkMoving,running:speed>5.2,pitch:attention.pitch,holding,holdReady};},
    get gesture(){return {pointBlend:character.pointingAmount,pointing:!!attention.manualPoint,jumping:expressiveAge<1.8,headYaw:attention.yaw,headPitch:attention.pitch};},
    triggerCheer(){if(stoneThrow||expressiveAge<1.8||Math.abs(anchor.rotation.x)>1)return false;expressiveAge=0;return true;},
    updateRestingLook(dt,view){if(!view){attention.point=false;attention.wave=false;attention.yaw=0;attention.pitch=0;}applyManualLook(dt,view,false,false);character.update(dt,false,false,0,attention);},
    setNetworkPose(p,dt=0,snap=false){
      if(!p)return;
      // Buffered network samples already interpolate on the render timeline.
      const alpha=snap?1:1-Math.exp(-dt*14);
      const before=anchor.position.clone();
      anchor.position.lerp(new THREE.Vector3(...p.position),alpha);
      // Poses only say moving/running, so pace the legs by the ground speed seen here.
      if(dt>0)networkSpeed+=(Math.hypot(anchor.position.x-before.x,anchor.position.z-before.z)/dt-networkSpeed)*(1-Math.exp(-dt*6));
      anchor.rotation.x=p.lying?Math.PI/2:0;
      anchor.rotation.y+=Math.atan2(Math.sin(p.yaw-anchor.rotation.y),Math.cos(p.yaw-anchor.rotation.y))*alpha;
      // Lying down, her look arrives as a stargazing yaw/pitch (1.22 is straight up).
      const headYaw=p.lying?p.headYaw||0:0,headPitch=p.lying?p.pitch-1.22:p.pitch;
      character.update(dt,p.moving&&!p.lying,p.running,0,{yaw:headYaw,pitch:headPitch,tilt:0,point:false,wave:false,direction:new THREE.Vector3(0,0,-1)},legPace(networkSpeed,p.running));
    },
    resumeAutopilot(){if(hasCelebrated)state="following";anchor.rotation.x=0;holding=false;holdReady=false;stoneThrow=null;speed=0;hasPreviousPlayer=false;},
    get bodyScale(){return character.root.scale.x;},setFirstPerson:value=>character.setFirstPerson(value),
    get throwing(){return !!stoneThrow;},
    get bouquetActive(){return character.bouquetActive;},
    startThrow(direction,onRelease){
      if(stoneThrow||holding||state!=='following')return false;
      stoneThrow={age:0,direction:direction.clone(),onRelease,released:false};speed=0;return true;
    },
    get holding(){return holding;},get holdReady(){return holdReady;},
    toggleHolding(){if(state==='celebrating')return false;holding=!holding;holdReady=false;speed=0;if(!holding)state='following';return holding;},
    poseHand:(target,amount,rotation)=>character.poseHand(target,amount,rotation),watchFirework(target){fireworkTarget.copy(target);fireworkUntil=time+3.2;},wearHat:hat=>character.wearHat(hat),celebrate(){holding=false;holdReady=false;if(!hasCelebrated){hasCelebrated=true;state='celebrating';cheerAge=0;}},update(dt,player,gifts=[],heading=0,manualLook=null){
    time+=dt;expressiveAge+=dt;attention.manualPoint=false;
    let dx=player.x-anchor.position.x,dz=player.z-anchor.position.z,distance=Math.hypot(dx,dz),moving=false,hop=0,cheer=0;
    if(state==='celebrating'){
      cheerAge+=dt;
      hop=Math.abs(Math.sin(Math.min(cheerAge/1.8,1)*Math.PI*2))*.40;
      cheer=THREE.MathUtils.smoothstep(cheerAge,0,.22)*(1-THREE.MathUtils.smoothstep(cheerAge,1.8,2.1));
      if(cheerAge>=2.1)state='following';
    }
    if((state==='following'||holding)&&!stoneThrow){
      // Held hands shorten the following leash, never attach him to camera yaw.
      const spacing=holding?1.65:3.1;
      const radialPace=holding&&hasPreviousPlayer&&distance>.001
        ?Math.max(0,((player.x-previousPlayer.x)*dx+(player.z-previousPlayer.z)*dz)/(distance*Math.max(dt,.001))):0;
      const desired=holding?Math.min(10,Math.max(0,radialPace+(distance-spacing)*4))
        :(distance>3.3501?Math.min(FOLLOW_SPEED,(distance-spacing)*2.2):0);
      // Once inside the arrival radius, residual easing must not keep tiny
      // steps (and a full walking cycle) alive after he has reached her.
      speed=holding||desired===0?desired:speed+(desired-speed)*(1-Math.exp(-dt*5));
      if(distance>spacing&&speed>.03){
        const step=Math.min(speed*dt,Math.max(0,distance-(holding?spacing:3.35)));
        let nx=anchor.position.x+dx/distance*step,nz=anchor.position.z+dz/distance*step;
        const tx=nx+8,tz=nz+10,r=Math.hypot(tx,tz);
        if(r<1.6){
          let angle=Math.atan2(anchor.position.z+10,anchor.position.x+8);
          const target=Math.atan2(player.z+10,player.x+8);
          const turn=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));
          angle+=Math.sign(turn||1)*step/1.6;
          nx=-8+Math.cos(angle)*1.6;nz=-10+Math.sin(angle)*1.6;
        }
        if(step>0){
          const next=resolveMove(anchor.position.x,anchor.position.z,nx-anchor.position.x,nz-anchor.position.z,player);
          if(onIsland(next.x,next.z)){
            moving=Math.hypot(next.x-anchor.position.x,next.z-anchor.position.z)>.0001;
            anchor.position.x=next.x;anchor.position.z=next.z;
          }
        }
      }
      holdReady=holding&&Math.hypot(player.x-anchor.position.x,player.z-anchor.position.z)<2.05;
    }
    hasPreviousPlayer=true;
    previousPlayer.copy(player);
    if(distance>18)waveArmed=true;
    if(state==='waiting'&&!holding&&waveArmed&&distance<14&&distance>3.7){waveUntil=time+3.2;waveArmed=false;}
    attention.wave=time<waveUntil&&!holding&&state==='waiting';
    look.set(player.x,player.y+1.55,player.z);attention.point=false;
    let interest='player',nearGift=null,best=36;
    if(state!=='celebrating'&&!holding&&!attention.wave){
      for(const gift of gifts){if(gift.found||!gift.object.visible)continue;gift.object.getWorldPosition(giftPosition);
        const d=(giftPosition.x-player.x)**2+(giftPosition.z-player.z)**2;
        if(d<best&&Math.hypot(giftPosition.x-anchor.position.x,giftPosition.z-anchor.position.z)<8){best=d;nearGift=gift;}}
      if(nearGift&&time%7.8<4.8){
        const phase=time%7.8;
        if(phase<1.8||(phase>3.1&&phase<4.8)){nearGift.object.getWorldPosition(look);look.y+=.3;interest='gift';attention.point=phase<1.6;}
      }
      if(time<fireworkUntil){look.copy(fireworkTarget);interest='firework';attention.point=false;}
      if(time>=nextGlance){glanceYaw=(Math.random()<.5?-1:1)*(.25+Math.random()*.35);glanceUntil=time+1.2+Math.random()*.8;nextGlance=time+5+Math.random()*5;}
    }
    const lx=look.x-anchor.position.x,lz=look.z-anchor.position.z;
    const lookHeading=Math.atan2(-lx,-lz);
    if((distance<14||state!=='waiting'||holding)&&!(manualLook&&!moving&&!holding)){
      const target=moving?Math.atan2(-dx,-dz):lookHeading;
      const delta=Math.atan2(Math.sin(target-anchor.rotation.y),Math.cos(target-anchor.rotation.y));
      anchor.rotation.y+=delta*(1-Math.exp(-dt*(moving?5:1.5)));
    }
    attention.yaw=THREE.MathUtils.clamp(Math.atan2(Math.sin(lookHeading-anchor.rotation.y),Math.cos(lookHeading-anchor.rotation.y)),-.9,.9);
    attention.pitch=THREE.MathUtils.clamp(Math.atan2(look.y-(anchor.position.y+1.65),Math.hypot(lx,lz)),-.38,.72);
    attention.tilt=interest==='player'?Math.sin(time*.65)*.025:0;
    if(interest==='player'&&time<glanceUntil&&state!=='celebrating'&&!attention.wave&&!holding){attention.yaw+=glanceYaw;attention.pitch*=.5;}
    const c=Math.cos(anchor.rotation.y),s=Math.sin(anchor.rotation.y);
    attention.direction.set(c*lx-s*lz,look.y-(anchor.position.y+1.2),s*lx+c*lz);
    if(stoneThrow){attention.point=false;attention.wave=false;attention.yaw=0;attention.pitch=.08;
      const heading=Math.atan2(-stoneThrow.direction.x,-stoneThrow.direction.z);
      const delta=Math.atan2(Math.sin(heading-anchor.rotation.y),Math.cos(heading-anchor.rotation.y));anchor.rotation.y+=delta*(1-Math.exp(-dt*14));
    }
    if(manualLook&&!stoneThrow)applyManualLook(dt,manualLook,moving);
    if(expressiveAge<1.8){hop+=Math.abs(Math.sin(expressiveAge/1.8*Math.PI*2))*.35;cheer=Math.max(cheer,THREE.MathUtils.smoothstep(expressiveAge,0,.20)*(1-THREE.MathUtils.smoothstep(expressiveAge,1.5,1.8)));}
    networkMoving=moving;
    const running=speed>5.2;
    character.update(dt,moving,running,cheer,attention,legPace(speed,running));
    if(stoneThrow){
      stoneThrow.age+=dt;character.poseThrow(stoneThrow.age);
      if(stoneThrow.age>=.42&&!stoneThrow.released){stoneThrow.released=true;anchor.updateMatrixWorld(true);const origin=character.throwOrigin(new THREE.Vector3());stoneThrow.onRelease(origin,stoneThrow.direction);}
      if(stoneThrow.age>=.95){stoneThrow=null;character.poseThrow(-1);}
    }
    anchor.position.y=ground(anchor.position.x,anchor.position.z)+hop;
  }};
}
