import {moveAroundRocks} from './rock-collision.js';

// Local role-switch testing: she approaches him, then waits nearby.
export function createPreviewFollower(){
  let following=false;
  return {
    reset(){following=false;},
    step(dt,position,target,obstacles,onIsland,walkSpeed=5){
      const dx=target.x-position.x,dz=target.z-position.z,distance=Math.hypot(dx,dz);
      const stopDistance=1.9;
      if(distance>2.35)following=true;
      if(distance<=stopDistance+.02)following=false;
      const running=following&&distance>6;
      const travel=following?Math.min(Math.max(0,distance-stopDistance),Math.min(walkSpeed*(running?1.5:.85),(distance-stopDistance)*3)*Math.max(0,Math.min(dt,.1))):0;
      const next=travel>0?moveAroundRocks(position.x,position.z,dx/distance*travel,dz/distance*travel,
        [...obstacles,{x:target.x,z:target.z,radius:.32}],onIsland,.30):{x:position.x,z:position.z};
      const moved=Math.hypot(next.x-position.x,next.z-position.z);
      return {...next,moving:moved>.0001,running:running&&moved>.0001,yaw:distance>.001?Math.atan2(-dx,-dz):null};
    }
  };
}
