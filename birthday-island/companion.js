import * as THREE from 'three';
import { buildCharacter } from './character.js?v=throw-1';

export function buildCompanion(scene,{terrainHeight,onIsland,stageHeight,stageRadius}){
  const anchor=new THREE.Group();scene.add(anchor);anchor.position.set(-5.9,0,-10.1);
  const character=buildCharacter(anchor,{shortHair:true,top:0x347f89,trousers:0x293d60,shoes:0x1c2b43});
  character.root.scale.setScalar(1.06);
  let stoneThrow=null;
  let holding=false,holdReady=false,hasCelebrated=false,waveUntil=0,waveArmed=true;
  const previousPlayer=new THREE.Vector3();
  let hasPreviousPlayer=false;
  let state='waiting',cheerAge=0,speed=0,time=0,nextGlance=3,glanceUntil=0,glanceYaw=0,fireworkUntil=0;
  const fireworkTarget=new THREE.Vector3(),look=new THREE.Vector3(),giftPosition=new THREE.Vector3();
  const attention={yaw:0,pitch:0,tilt:0,point:false,wave:false,direction:new THREE.Vector3()};
  function ground(x,z){return terrainHeight(x,z)+stageHeight*(1-THREE.MathUtils.smoothstep(Math.hypot(x+8,z+10),stageRadius-.06,stageRadius+.12));}
  anchor.position.y=ground(anchor.position.x,anchor.position.z);anchor.rotation.y=Math.PI;
  return {anchor,
    get throwing(){return !!stoneThrow;},
    startThrow(direction,onRelease){
      if(stoneThrow||holding||state!=='following')return false;
      stoneThrow={age:0,direction:direction.clone(),onRelease,released:false};speed=0;return true;
    },
    get holding(){return holding;},get holdReady(){return holdReady;},
    toggleHolding(){if(state==='celebrating')return false;holding=!holding;holdReady=false;speed=0;if(!holding)state='following';return holding;},
    poseHand:(target,amount,rotation)=>character.poseHand(target,amount,rotation),watchFirework(target){fireworkTarget.copy(target);fireworkUntil=time+3.2;},wearHat:hat=>character.wearHat(hat),celebrate(){holding=false;holdReady=false;if(!hasCelebrated){hasCelebrated=true;state='celebrating';cheerAge=0;}},update(dt,player,gifts=[],heading=0){
    time+=dt;
    let dx=player.x-anchor.position.x,dz=player.z-anchor.position.z,distance=Math.hypot(dx,dz),moving=false,hop=0,cheer=0;
    if(state==='celebrating'){
      cheerAge+=dt;
      hop=Math.abs(Math.sin(Math.min(cheerAge/1.8,1)*Math.PI*2))*.40;
      cheer=Math.sin(Math.min(cheerAge/2.1,1)*Math.PI)*.95;
      if(cheerAge>=2.1)state='following';
    }
    if((state==='following'||holding)&&!stoneThrow){
      // Held hands shorten the following leash, never attach him to camera yaw.
      const spacing=holding?1.65:3.1;
      const radialPace=holding&&hasPreviousPlayer&&distance>.001
        ?Math.max(0,((player.x-previousPlayer.x)*dx+(player.z-previousPlayer.z)*dz)/(distance*Math.max(dt,.001))):0;
      const desired=holding?Math.min(10,Math.max(0,radialPace+(distance-spacing)*4))
        :(distance>3.35?Math.min(8.8,(distance-spacing)*2.2):0);
      speed=holding?desired:speed+(desired-speed)*(1-Math.exp(-dt*5));
      if(distance>spacing&&speed>.03){
        const step=Math.min(speed*dt,distance-spacing);
        let nx=anchor.position.x+dx/distance*step,nz=anchor.position.z+dz/distance*step;
        const tx=nx+8,tz=nz+10,r=Math.hypot(tx,tz);
        if(r<1.6){
          let angle=Math.atan2(anchor.position.z+10,anchor.position.x+8);
          const target=Math.atan2(player.z+10,player.x+8);
          const turn=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));
          angle+=Math.sign(turn||1)*step/1.6;
          nx=-8+Math.cos(angle)*1.6;nz=-10+Math.sin(angle)*1.6;
        }
        if(onIsland(nx,nz)){anchor.position.x=nx;anchor.position.z=nz;moving=true;}
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
      for(const gift of gifts){if(gift.found)continue;gift.object.getWorldPosition(giftPosition);
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
    if(distance<14||state!=='waiting'||holding){
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
    character.update(dt,moving,speed>5.2,cheer,attention);
    if(stoneThrow){
      stoneThrow.age+=dt;character.poseThrow(stoneThrow.age);
      if(stoneThrow.age>=.42&&!stoneThrow.released){stoneThrow.released=true;anchor.updateMatrixWorld(true);const origin=character.throwOrigin(new THREE.Vector3());stoneThrow.onRelease(origin,stoneThrow.direction);}
      if(stoneThrow.age>=.95){stoneThrow=null;character.poseThrow(-1);}
    }
    anchor.position.y=ground(anchor.position.x,anchor.position.z)+hop;
  }};
}
