import {companionMode,ISHIEE_CONTROL_MODE,canControlWorld} from '../control-mode.js';
import {DurableObject} from 'cloudflare:workers';
import {USERS,GRACE_MS,cleanPose,cleanLook,initialWorld,reduceWorld} from './protocol.js';

async function matches(a,b){
  if(!a||!b)return false;
  const enc=new TextEncoder();
  const [x,y]=await Promise.all([a,b].map(v=>crypto.subtle.digest('SHA-256',enc.encode(v))));
  return crypto.subtle.timingSafeEqual(x,y);
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/connect'){
      if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
      if(request.headers.get('Origin')!==url.origin)return new Response('Origin denied',{status:403});
      const user=url.searchParams.get('user');
      const protocols=(request.headers.get('Sec-WebSocket-Protocol')||'').split(',').map(x=>x.trim());
      if(!USERS.includes(user)||protocols[0]!=='island'||!await matches(protocols[1],env[`${user}_TOKEN`]))return new Response('Use your private island invite',{status:403});
      return env.ISLAND.getByName('our-private-island-v1').fetch(request);
    }
    if(url.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
    return env.ASSETS.fetch(request);
  }
};

export class IslandRoom extends DurableObject {
  constructor(ctx,env){
    super(ctx,env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
    this.data=JSON.parse(ctx.storage.sql.exec('SELECT data FROM room WHERE id=1').toArray()[0]?.data||'null')||{world:initialWorld(),poses:{},away:{},saved:0,startedAt:Date.now()};
    this.data.startedAt??=Date.now();
    this.sockets=new Map(ctx.getWebSockets().map(ws=>[ws,ws.deserializeAttachment()]).filter(([,a])=>a&&USERS.includes(a.user)));
    for(const a of this.sockets.values()){if(a.pose&&(!companionMode||a.user==='MOSHIEE'))this.data.poses[a.user]=a.pose;}
    if(this.npc())for(const a of this.sockets.values())if(a.npc)this.data.poses.ISHIEE=a.npc;
  }
  save(){this.data.saved=Date.now();this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room VALUES (1, ?)',JSON.stringify(this.data));}
  live(user){return [...this.sockets.values()].some(a=>a.user===user&&Date.now()-a.lastSeen<15000);}
  npc(){if(companionMode)return true;return ![...this.sockets.values()].some(a=>a.user==='ISHIEE')&&Date.now()-(this.data.away.ISHIEE||0)>=GRACE_MS;}
  snapshot(){return {type:'snapshot',controlMode:ISHIEE_CONTROL_MODE,look:companionMode&&this.live('ISHIEE')?[...this.sockets.values()].find(a=>a.user==='ISHIEE')?.look||null:null,startedAt:this.data.startedAt||Date.now(),serverTime:Date.now(),world:this.data.world,poses:this.data.poses,online:Object.fromEntries(USERS.map(u=>[u,this.live(u)])),npc:this.npc()};}
  send(ws,msg){try{ws.send(JSON.stringify(msg));}catch{/* Close handler performs cleanup. */}}
  broadcast(msg,except){for(const ws of this.sockets.keys())if(ws!==except)this.send(ws,msg);}
  async fetch(request){
    const user=new URL(request.url).searchParams.get('user');
    const [client,server]=Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    if(this.live(user)){this.send(server,{type:'error',message:`${user} is already on the island in another tab. Close that tab and retry.`});server.close(4009,'Character occupied');return new Response(null,{status:101,webSocket:client,headers:{'Sec-WebSocket-Protocol':'island'}});}
    for(const [ws,a] of this.sockets)if(a.user===user){this.sockets.delete(ws);ws.close(4000,'Reconnected');}
    const attachment={user,lastSeen:Date.now(),lastPose:0,lastEvent:0,pose:this.data.poses[user]||null};
    server.serializeAttachment(attachment);this.sockets.set(server,attachment);
    delete this.data.away[user];
    if(!companionMode&&user==='ISHIEE')for(const [ws,a] of this.sockets){delete a.npc;ws.serializeAttachment(a);}
    if(!companionMode){this.data.world.holding=false;this.data.world.handRequest=null;}
    this.save();this.send(server,{...this.snapshot(),self:user,welcome:true});this.broadcast(this.snapshot(),server);
    await this.ctx.storage.setAlarm(Date.now()+15000);
    return new Response(null,{status:101,webSocket:client,headers:{'Sec-WebSocket-Protocol':'island'}});
  }
  async webSocketMessage(ws,raw){
    const a=this.sockets.get(ws);if(!a)return;
    if(typeof raw!=='string'||raw.length>8192){ws.close(1009,'Message too large');return;}
    let m;try{m=JSON.parse(raw);}catch{return;}
    if(!m||typeof m!=="object")return;
    const now=Date.now();a.lastSeen=now;
    if(m.type==='ping'){this.send(ws,{type:'pong'});}
    else if(companionMode&&m.type==='look'&&a.user==='ISHIEE'&&now-a.lastPose>=40){
      const look=cleanLook(m.look);if(!look)return;
      a.lastPose=now;a.look=look;this.broadcast({type:'look',look},ws);
    }
    else if(m.type==='pose'&&now-a.lastPose>=40){
      if(!canControlWorld(a.user))return;
      const pose=cleanPose(m.pose);if(!pose)return;
      a.lastPose=now;a.pose=pose;this.data.poses[a.user]=pose;
      if(a.user==='MOSHIEE'&&this.npc()){const npc=cleanPose(m.npc);if(npc){a.npc=npc;this.data.poses.ISHIEE=npc;if(companionMode)this.broadcast({type:'pose',user:'ISHIEE',pose:npc},ws);}}
      else delete a.npc;
      if(this.data.world.holding){const other=this.data.poses[USERS.find(u=>u!==a.user)];if(pose.lying||!other||Math.hypot(pose.position[0]-other.position[0],pose.position[2]-other.position[2])>4){this.data.world.holding=false;this.data.world.handRequest=null;this.save();this.broadcast(this.snapshot());}}
      this.broadcast({type:'pose',user:a.user,pose},ws);
      if(now-this.data.saved>10000)this.save();
    }else if(m.type==='event'&&m.event){
      if(now-(a.eventWindow||0)>1000){a.eventWindow=now;a.eventCount=0;}
      if((a.eventCount=(a.eventCount||0)+1)>30)return;
      const e=m.event;
      if(!canControlWorld(a.user)){
        if(e.type==='cheer'&&this.live('MOSHIEE')&&now-(a.lastCheer||0)>=2000){a.lastCheer=now;this.broadcast({type:'event',actor:a.user,event:{type:'cheer'}});}
        ws.serializeAttachment(a);return;
      }
      if(e.type==='hand'){
        const other=USERS.find(u=>u!==a.user),p=this.data.poses[a.user],q=this.data.poses[other];
        if(!this.live(other)||!p||!q||p.lying||q.lying||Math.hypot(p.position[0]-q.position[0],p.position[2]-q.position[2])>3.7)return;
      }
      const next=reduceWorld(this.data.world,e,a.user);
      if(next){this.data.world=next;this.save();this.broadcast({...this.snapshot(),event:e,actor:a.user});}
      else if(e.type==='fireworks'){this.data.world.mood='night';this.save();this.broadcast(this.snapshot());this.broadcast({type:'event',actor:a.user,event:{type:'fireworks',pose:a.pose,amount:Math.max(1,Math.min(12,Number(e.amount)||6))}});}
      else if(e.type==='ink'&&Array.isArray(e.points)&&e.points.length===6&&e.points.every(v=>Number.isFinite(v)&&Math.abs(v)<500))this.broadcast({type:'event',actor:a.user,event:{type:'ink',points:e.points}},ws);
      else if(e.type==='stone'&&Number.isFinite(e.power)&&e.power>=0&&e.power<=1&&Array.isArray(e.origin)&&Array.isArray(e.direction)&&e.origin.length===3&&e.direction.length===3&&[...e.origin,...e.direction].every(v=>Number.isFinite(v)&&Math.abs(v)<200))this.broadcast({type:'event',actor:a.user,event:{type:'stone',power:e.power,origin:e.origin,direction:e.direction}},ws);
    }
    ws.serializeAttachment(a);
  }
  async disconnect(ws){
    const a=this.sockets.get(ws);if(!a)return;this.sockets.delete(ws);
    delete a.npc;
    this.data.away[a.user]=Date.now();this.data.world.holding=false;this.data.world.handRequest=null;
    this.save();this.broadcast(this.snapshot());await this.ctx.storage.setAlarm(Date.now()+GRACE_MS);
  }
  async webSocketClose(ws){await this.disconnect(ws);}
  async webSocketError(ws){await this.disconnect(ws);}
  async alarm(){
    const now=Date.now();
    for(const [ws,a] of [...this.sockets])if(now-a.lastSeen>=15000){ws.close(4000,'Connection timed out');await this.disconnect(ws);}
    this.broadcast(this.snapshot());
    if(this.sockets.size)await this.ctx.storage.setAlarm(Date.now()+5000);
  }
}
