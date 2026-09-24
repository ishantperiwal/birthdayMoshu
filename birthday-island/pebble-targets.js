import {createThrow,advanceThrow} from './skipping-physics.js?v=targets-8';

export const TARGET_RADIUS=3.2;
export function predictFinish(origin,direction,power,time,terrainHeight){
  const flight=createThrow(origin,direction,power);
  for(let i=0;i<241&&!flight.done;i++)advanceThrow(flight,.05,time+(i+1)*.05,terrainHeight);
  return flight;
}

// Pick destinations from real throws, so each hoop has a reachable solution.
export function generateTarget(origin,round,time,terrainHeight,random=Math.random){
  for(let i=0;i<48;i++){
    const angle=(random()-.5)*.8;
    const direction={x:Math.cos(angle),y:.02+random()*.08,z:Math.sin(angle)};
    const power=.10+(round-1)*.10+random()*.10;
    const flight=predictFinish(origin,direction,power,time,terrainHeight);
    const {x,z}=flight.position;
    if(flight.finish!=='water'||Math.hypot(x-origin.x,z-origin.z)<8)continue;
    let clear=terrainHeight(x,z)<-1.2;
    for(let j=0;j<16&&clear;j++){
      const a=j/16*Math.PI*2;
      clear=terrainHeight(x+Math.cos(a)*TARGET_RADIUS,z+Math.sin(a)*TARGET_RADIUS)<-1.2;
    }
    if(clear)return {x,z,radius:TARGET_RADIUS};
  }
  return null;
}

export function finishesInside(flight,target){
  return !!target&&flight.done&&flight.finish==='water'&&
    Math.hypot(flight.position.x-target.x,flight.position.z-target.z)<=target.radius;
}

export function createTargetGame(){
  let wins=0,attempts=0,target=null,won=false;
  return {
    get wins(){return wins;},get attempts(){return attempts;},get target(){return target;},
    get won(){return won;},get complete(){return wins===3;},
    get round(){return Math.min(3,wins+(won?0:1));},
    reset(){wins=0;attempts=0;target=null;won=false;},
    prepare(origin,time,terrainHeight,random){
      if(wins===3)this.reset();
      if(!target||won){
        const next=generateTarget(origin,wins+1,time,terrainHeight,random);
        if(!next)return false;
        target=next;won=false;
      }
      return true;
    },
    finish(flight){
      if(!flight.done||!target||won)return false;
      attempts++;
      if(!finishesInside(flight,target))return false;
      wins++;won=true;return true;
    }
  };
}
