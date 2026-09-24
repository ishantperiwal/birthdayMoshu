// Small, damped horizontal lag in world space. No particles or cloth solver.
export function createSkirtMotion(){
  let previous=null,x=0,z=0,vx=0,vz=0,phase=0;
  return {
    update(dt,position,enabled=true){
      const dx=previous?position.x-previous.x:0,dz=previous?position.z-previous.z:0;
      const first=!previous;previous={x:position.x,z:position.z};
      if(!enabled||first||dt<=0||dt>.15||Math.hypot(dx,dz)>Math.max(.6,dt*14)){
        x=z=vx=vz=phase=0;return {x,z};
      }
      const distance=Math.hypot(dx,dz),speed=distance/dt;
      phase=(phase+distance*1.8)%(Math.PI*2);
      // Backward lag alone disappears in a head-on view. A small step-driven
      // lateral motion makes the hem read as fabric when she approaches you.
      const sway=Math.sin(phase)*.045*Math.min(speed/4,1.25);
      let tx=-dx/dt*.022+(distance>0?-dz/distance*sway:0);
      let tz=-dz/dt*.022+(distance>0?dx/distance*sway:0);
      const length=Math.hypot(tx,tz),limit=.13;
      if(length>limit){tx*=limit/length;tz*=limit/length;}
      const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
      for(let i=0;i<steps;i++){
        vx+=((tx-x)*90-vx*15)*h;vz+=((tz-z)*90-vz*15)*h;
        x+=vx*h;z+=vz*h;
      }
      return {x,z};
    }
  };
}
