// Ballistic vertical motion; horizontal movement keeps its existing collisions.
export function createPlayerJump(){
  let airborne=false,velocity=0;
  return {
    get active(){return airborne;},
    start(){if(airborne)return false;airborne=true;velocity=3.6;return true;},
    reset(){airborne=false;velocity=0;},
    update(y,ground,dt){
      if(!airborne)return y+(ground-y)*Math.min(1,dt*14);
      const next=y+velocity*dt-6*dt*dt;
      velocity-=12*dt;
      if(next<=ground&&velocity<=0){airborne=false;velocity=0;return ground;}
      return Math.max(ground,next);
    }
  };
}
