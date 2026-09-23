export const USERS=['ISHIEE','MOSHIEE'];
export const GRACE_MS=10000;
export function cleanPose(p){
  if(!p||!Array.isArray(p.position)||p.position.length!==3||!p.position.every(Number.isFinite))return null;
  if(Math.abs(p.position[0])>70||Math.abs(p.position[2])>60||p.position[1]<-10||p.position[1]>20)return null;
  if(!Number.isFinite(p.yaw)||!Number.isFinite(p.pitch))return null;
  return {...(Number.isFinite(p.time)&&p.time>=0?{time:p.time}:{}),position:p.position,yaw:p.yaw%(Math.PI*2),pitch:Math.max(-1.5,Math.min(1.5,p.pitch)),moving:!!p.moving,running:!!p.running,lying:!!p.lying,holding:!!p.holding,holdReady:!!p.holdReady};
}
export function initialWorld(){return {mood:'night',gifts:[],candles:false,hats:false,holding:false,handRequest:null};}
export function reduceWorld(world,event,user){
  const next={...world};
  if(event.type==='mood'&&['day','sunset','night'].includes(event.value))next.mood=event.value;
  else if(event.type==='gift'&&Number.isInteger(event.index)&&event.index>=0&&event.index<10){if(world.gifts.includes(event.index))return null;next.gifts=[...world.gifts,event.index];}
  else if(event.type==='candles'&&!world.candles){next.candles=true;next.holding=false;next.handRequest=null;}
  else if(event.type==='hats'&&!world.hats)next.hats=true;
  else if(event.type==='hand'){
    if(world.holding){next.holding=false;next.handRequest=null;}
    else if(world.handRequest&&world.handRequest!==user){next.holding=true;next.handRequest=null;}
    else next.handRequest=user;
  }else if(event.type==='release'){next.holding=false;next.handRequest=null;}
  else return null;
  return next;
}

export function cleanLook(p){
  if(!p||!Number.isFinite(p.yaw)||!Number.isFinite(p.pitch))return null;
  return {time:Number.isFinite(p.time)&&p.time>=0?p.time:0,yaw:p.yaw%(Math.PI*2),pitch:Math.max(-1.5,Math.min(1.5,p.pitch)),pointing:!!p.pointing};
}
