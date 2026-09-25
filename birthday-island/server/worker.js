import {companionMode,ISHIEE_CONTROL_MODE,canControlWorld} from '../control-mode.js';
import {DurableObject} from 'cloudflare:workers';
import {USERS,GRACE_MS,cleanChat,cleanPose,cleanLook,initialWorld,reduceWorld} from './protocol.js';
import {CASH_SITES} from '../cash-dash-state.js';

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

// Once both players have been gone this long, the next visit starts over.
const EMPTY_RESET_MS=60000;
const freshRoom=()=>({world:initialWorld(),poses:{},away:{},saved:0,startedAt:Date.now()});
export class IslandRoom extends DurableObject {
  constructor(ctx,env){
    super(ctx,env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
    this.data=JSON.parse(ctx.storage.sql.exec('SELECT data FROM room WHERE id=1').toArray()[0]?.data||'null')||freshRoom();
    this.data.startedAt??=Date.now();
    this.sockets=new Map(ctx.getWebSockets().map(ws=>[ws,ws.deserializeAttachment()]).filter(([,a])=>a&&USERS.includes(a.user)));
    for(const a of this.sockets.values()){if(a.pose&&(!companionMode||a.user==='MOSHIEE'))this.data.poses[a.user]=a.pose;}
    if(this.npc())for(const a of this.sockets.values())if(a.npc)this.data.poses.ISHIEE=a.npc;
  }
  // Every session starts over: a fresh world, no saved positions, a new clock.
  resetRoom(){this.data=freshRoom();for(const [ws,a] of this.sockets){a.pose=null;delete a.npc;ws.serializeAttachment(a);}this.save();}
  emptySince(){return Math.max(this.data.saved||0,...Object.values(this.data.away||{}));}
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
    // Joining an island both players left a while ago begins a fresh session.
    if(!this.sockets.size&&Date.now()-this.emptySince()>=EMPTY_RESET_MS)this.resetRoom();
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
      // Short gestures are transient events and always belong to the authenticated sender.
      if(e.type==='gesture'){
        if(['wave','cheer'].includes(e.value)&&now-(a.lastGesture||0)>=1000){
          a.lastGesture=now;this.broadcast({type:'event',actor:a.user,event:{type:'gesture',value:e.value}});
        }
        ws.serializeAttachment(a);return;
      }
      // Each authenticated player controls only their own face, including his
      // companion-mode session. Snapshot deadlines prevent stale expressions on reconnect.
      if(e.type==='expression'){
        if(now-(a.lastExpression||0)>=180){
          const next=reduceWorld(this.data.world,e,a.user,now);
          if(next){a.lastExpression=now;this.data.world=next;this.save();this.broadcast({...this.snapshot(),event:{type:'expression',value:next.expressions[a.user]},actor:a.user});}
        }
        ws.serializeAttachment(a);return;
      }
      // His flowers are an expressive action, available in companion mode.
      if(e.type==='bouquet'){
        if(a.user==='ISHIEE'&&now-(a.lastBouquet||0)>=2000){
          const next=reduceWorld(this.data.world,e,a.user);
          if(next){a.lastBouquet=now;if(next.bouquet===true)next.bouquetOfferedAt=now;this.data.world=next;this.save();this.broadcast({...this.snapshot(),event:{type:'bouquet',shown:next.bouquet},actor:a.user});}
        }
        ws.serializeAttachment(a);return;
      }
      if(e.type==='receive-bouquet'||e.type==='put-away-bouquet'){
        if(a.user!=='MOSHIEE')return;
        if(e.type==='receive-bouquet'){
          const p=this.data.poses.MOSHIEE,q=this.data.poses.ISHIEE;
          if(!this.live('ISHIEE')||!p||!q||p.lying||q.lying||
            Math.hypot(...p.position.map((v,i)=>v-q.position[i]))>3.7||
            now-(this.data.world.bouquetOfferedAt||0)<850)return;
        }else if(now-(this.data.world.bouquetReceivedAt||0)<1050)return;
        const next=reduceWorld(this.data.world,e,a.user);
        if(next){
          if(e.type==='receive-bouquet')next.bouquetReceivedAt=now;
          this.data.world=next;this.save();this.broadcast({...this.snapshot(),event:e,actor:a.user});
        }
        ws.serializeAttachment(a);return;
      }
      // Either player's radio, including his companion view, may advance the song.
      if(e.type==='radio'){
        if(now-(a.lastRadio||0)>=1500){
          const next=reduceWorld(this.data.world,e,a.user);
          if(next){a.lastRadio=now;this.data.world=next;this.save();this.broadcast({...this.snapshot(),event:{type:'radio',index:next.radio},actor:a.user});}
        }
        ws.serializeAttachment(a);return;
      }
      // ISHIEE may wipe the room back to the very beginning while setting up.
      if(e.type==='reset'){
        if(a.user==='ISHIEE'){this.resetRoom();this.broadcast({type:'event',actor:a.user,event:{type:'reset'}});}
        ws.serializeAttachment(a);return;
      }
      if(e.type==='chat'){
        const text=cleanChat(e.text);
        if(text&&now-(a.lastChat||0)>=1200){a.lastChat=now;this.broadcast({type:'event',actor:a.user,event:{type:'chat',text}});}
        ws.serializeAttachment(a);return;
      }
      // Ishi controls the start even in companion mode; only Moshi collects.
      if(e.type==='cash-start'||e.type==='cash-pickup'){
        if(e.type==='cash-start'&&!this.live('MOSHIEE'))return;
        if(e.type==='cash-pickup'){
          const site=CASH_SITES[e.index],pose=this.data.poses.MOSHIEE;
          if(!site||!pose||pose.lying||now-a.lastPose>1500||Math.hypot(pose.position[0]-site.x,pose.position[2]-site.z)>5)return;
        }
        const next=reduceWorld(this.data.world,e,a.user,now);
        if(next){this.data.world=next;this.save();this.broadcast({...this.snapshot(),event:{type:e.type,...(e.type==='cash-pickup'?{index:e.index}:{})},actor:a.user});}
        ws.serializeAttachment(a);return;
      }
      // Host orchestration remains available while Ishi follows Moshi.
      if(!canControlWorld(a.user)&&!(a.user==='ISHIEE'&&['mood','fireworks'].includes(e.type))){
        if(e.type==='cheer'&&this.live('MOSHIEE')&&now-(a.lastCheer||0)>=2000){a.lastCheer=now;this.broadcast({type:'event',actor:a.user,event:{type:'cheer'}});}
        ws.serializeAttachment(a);return;
      }
      if(e.type==='hand'){
        const other=USERS.find(u=>u!==a.user),p=this.data.poses[a.user],q=this.data.poses[other];
        if(!this.live(other)||!p||!q||p.lying||q.lying||Math.hypot(p.position[0]-q.position[0],p.position[2]-q.position[2])>3.7)return;
      }
      const next=reduceWorld(this.data.world,e,a.user);
      if(next){this.data.world=next;this.save();this.broadcast({...this.snapshot(),event:e,actor:a.user});}
      else if(e.type==='fireworks'){const pose=this.data.poses[a.user]||a.pose;if(!pose)return;this.data.world.mood='night';this.save();this.broadcast(this.snapshot());this.broadcast({type:'event',actor:a.user,event:{type:'fireworks',pose,amount:Math.max(1,Math.min(12,Number(e.amount)||6))}});}
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
    else{
      // Nobody is left: start over once the grace period has passed.
      const due=this.emptySince()+EMPTY_RESET_MS;
      if(now>=due)this.resetRoom();else await this.ctx.storage.setAlarm(due);
    }
  }
}
