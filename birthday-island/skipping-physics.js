export const SHORE={x:47,z:26};
export function throwPower(seconds){return (1-Math.cos(Math.max(0,seconds)*Math.PI/1.35))*.5;}
export function throwPlan(power){
  const p=Math.max(0,Math.min(1,power)),quality=Math.exp(-(((p-.55)/.25)**2));
  return {speed:14+p*20,quality};
}
export function waterHeight(x,z,t){
  return Math.sin((x*.860+z*.510)*.082+t*.58)*.34
    +Math.sin((x*-.319+z*.948)*.129-t*.46)*.21
    +Math.sin((x*.621+z*-.784)*.055+t*.33)*.44;
}
export const GRAVITY=9.81;
export function createThrow(start,direction,power){
  const plan=throwPlan(power),length=Math.hypot(direction.x,direction.y,direction.z)||1;
  return {...plan,start:{...start},position:{...start},velocity:{x:direction.x/length*plan.speed,y:direction.y/length*plan.speed,z:direction.z/length*plan.speed},age:0,skips:0,contacts:0,done:false};
}
export function ballisticPoint(start,direction,speed,time){return {x:start.x+direction.x*speed*time,y:start.y+direction.y*speed*time-.5*GRAVITY*time*time,z:start.z+direction.z*speed*time};}
// Small fixed upper timestep avoids stepping through the sea/shore. Each real
// contact creates one event; steep impacts settle instead of forced bounces.
export function advanceThrow(f,dt,time,terrainHeight){
  const events=[],steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;
  for(let j=0;j<steps&&!f.done;j++){
    const p=f.position,v=f.velocity,old={...p};f.age+=h;
    p.x+=v.x*h;p.z+=v.z*h;p.y+=v.y*h-.5*GRAVITY*h*h;v.y-=GRAVITY*h;
    const t=time-dt+(j+1)*h,sea=waterHeight(p.x,p.z,t),land=terrainHeight(p.x,p.z),surface=Math.max(sea,land)+.08;
    if(p.y<=surface){
      const oldSurface=Math.max(waterHeight(old.x,old.z,t-h),terrainHeight(old.x,old.z))+.08;
      const from=Math.max(0,old.y-oldSurface),to=surface-p.y,alpha=from/(from+to||1);
      p.x=old.x+(p.x-old.x)*alpha;p.z=old.z+(p.z-old.z)*alpha;
      const water=waterHeight(p.x,p.z,t),ground=terrainHeight(p.x,p.z);p.y=Math.max(water,ground)+.08;
      if(ground>=water){f.done=true;f.landed=true;f.finish='land';break;}
      events.push({x:p.x,z:p.z,index:f.contacts++});
      const horizontal=Math.hypot(v.x,v.z),shallow=-v.y/Math.max(horizontal,.001)<.68;
      if(shallow&&horizontal>2.8&&f.skips<12){
        f.skips++;const retention=.72+f.quality*.20;v.x*=retention;v.z*=retention;
        v.y=Math.min(1.45,Math.max(.85,-v.y*.20))*(.90+f.quality*.10);p.y+=.015;
      }else {f.done=true;f.finish='water';}
    }
    if(f.age>12&&!f.done){f.done=true;f.finish='timeout';}
  }
  return events;
}
