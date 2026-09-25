import {cleanExpression,EXPRESSION_MS} from '../expressions.js';
import {reduceCashDash} from '../cash-dash-state.js';
export const USERS=['ISHIEE','MOSHIEE'];
export const GRACE_MS=10000;
export function cleanPose(p){
  if(!p||!Array.isArray(p.position)||p.position.length!==3||!p.position.every(Number.isFinite))return null;
  if(Math.abs(p.position[0])>70||Math.abs(p.position[2])>60||p.position[1]<-10||p.position[1]>20)return null;
  if(!Number.isFinite(p.yaw)||!Number.isFinite(p.pitch))return null;
  return {...(Number.isFinite(p.time)&&p.time>=0?{time:p.time}:{}),...(Number.isFinite(p.headYaw)?{headYaw:Math.max(-1.4,Math.min(1.4,p.headYaw))}:{}),position:p.position,yaw:p.yaw%(Math.PI*2),pitch:Math.max(-1.5,Math.min(1.5,p.pitch)),moving:!!p.moving,running:!!p.running,lying:!!p.lying,holding:!!p.holding,holdReady:!!p.holdReady};
}
export function initialWorld(){return {mood:'night',gifts:[],candles:false,hats:false,holding:false,handRequest:null,bouquet:false,radio:0};}
export function reduceWorld(world,event,user,now=Date.now()){
  if(event.type==='cash-start'||event.type==='cash-pickup')return reduceCashDash(world,event,user,now);
  const next={...world};
  if(event.type==='expression'){
    const value=cleanExpression(event.value);
    if(!USERS.includes(user)||!value)return null;
    next.expressions={...world.expressions,[user]:value};
    next.expressionUntil={...world.expressionUntil,[user]:value==='normal'?0:now+EXPRESSION_MS};
  }
  else if(event.type==='mood'&&['day','sunset','night'].includes(event.value))next.mood=event.value;
  else if(event.type==='gift'&&Number.isInteger(event.index)&&event.index>=0&&event.index<10){if(world.gifts.includes(event.index))return null;next.gifts=[...world.gifts,event.index];}
  else if(event.type==='candles'&&!world.candles){next.candles=true;next.holding=false;next.handRequest=null;}
  else if(event.type==='hats'&&!world.hats)next.hats=true;
  // A song change counts only if it starts from the current song, so two
  // players finishing the same track together advance the radio once.
  else if(event.type==='radio'&&Number.isInteger(event.from)&&Number.isInteger(event.to)&&event.to>=0&&event.to<64&&
    event.to!==event.from&&event.from===(world.radio||0))next.radio=event.to;
  else if(event.type==='bouquet'&&user==='ISHIEE'&&typeof event.shown==='boolean'&&world.bouquet!=='received'&&
    ((event.shown&&world.bouquet!==true)||(!event.shown&&world.bouquet===true)))next.bouquet=event.shown;
  else if(event.type==='receive-bouquet'&&user==='MOSHIEE'&&world.bouquet===true){next.bouquet='received';next.holding=false;next.handRequest=null;}
  else if(event.type==='put-away-bouquet'&&user==='MOSHIEE'&&world.bouquet==='received')next.bouquet='stored';
  else if(event.type==='hand'){
    if(world.bouquet==='received')return null;
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

export function cleanChat(text){
  if(typeof text!=='string')return null;
  const clean=text.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
  return clean?Array.from(clean).slice(0,140).join(''):null;
}
