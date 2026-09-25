import {companionMode} from './control-mode.js?v=companion-1';
import {resolveSession} from './session-mode.js';
// Tokens stay in the fragment (never sent in an HTTP URL or Referer).
const session=resolveSession(location);
export const islandUser=session.user,roleUI=session.roleUI,localRolePreview=session.localRolePreview;
export const isIshiee=islandUser==='ISHIEE';
export const isPassenger=isIshiee&&companionMode&&session.online;
export const multiplayerRequested=session.online;
export function connectIsland({onSnapshot,onEvent,onPose,onStatus,onLook=()=>{}}){
  const other=isIshiee?'MOSHIEE':'ISHIEE';
  const fragment=new URLSearchParams(location.hash.slice(1));
  const token=fragment.get('invite');
  let socket,retry,timer,connected=false,stopped=false,attempt=0,lastPong=0;
  let snapshot={online:{},poses:{},world:{},npc:false};
  const status=document.createElement('div');status.id='island-connection';status.setAttribute('role','status');document.body.append(status);
  function report(text){status.textContent=text;onStatus(connected,text);}
  function send(message){if(connected&&socket?.readyState===WebSocket.OPEN&&socket.bufferedAmount<32768)socket.send(JSON.stringify(message));}
  function describe(){return snapshot.online[other]?`${islandUser} · ${isPassenger?'following MOSHIEE':'together on the island'}`:isIshiee?'ISHIEE · waiting for MOSHIEE':snapshot.npc?'MOSHIEE · ISHIEE is on autopilot':'MOSHIEE · waiting for ISHIEE to reconnect';}
  function open(){
    if(stopped)return;
    if(!['ISHIEE','MOSHIEE'].includes(islandUser)||!token||!/^[a-zA-Z0-9_-]{32,128}$/.test(token)){stopped=true;report('Open your private ISHIEE or MOSHIEE invite link.');return;}
    report(attempt?'Reconnecting to our island…':'Joining our island…');
    const url=new URL('/api/connect',location.href);url.protocol=location.protocol==='https:'?'wss:':'ws:';url.searchParams.set('user',islandUser);
    socket=new WebSocket(url,['island',token]);
    socket.onmessage=({data})=>{
      let m;try{m=JSON.parse(data);}catch{return;}
      lastPong=Date.now();
      if(m.type==='error'){stopped=true;connected=false;report(m.message);return;}
      if(m.type==='snapshot'){
        snapshot=m;connected=true;attempt=0;
        onSnapshot(m);report(describe());
      }else if(m.type==='pose'){snapshot.poses[m.user]=m.pose;onPose(m.user,m.pose);}
      else if(m.type==='look')onLook(m.look);
      else if(m.type==='event')onEvent(m);
    };
    socket.onclose=()=>{connected=false;onStatus(false,status.textContent);if(!stopped){report('Connection interrupted · reconnecting…');retry=setTimeout(open,Math.min(10000,1000*2**attempt++));}};
    socket.onerror=()=>{if(!connected)report('Could not join. Checking your invite and reconnecting…');};
  }
  timer=setInterval(()=>{if(connected){if(Date.now()-lastPong>18000)socket.close();else send({type:'ping'});}},5000);
  window.addEventListener('pagehide',()=>{stopped=true;clearTimeout(retry);clearInterval(timer);socket?.close(1000,'Leaving island');});
  window.addEventListener('online',()=>{if(!connected&&!stopped){clearTimeout(retry);open();}});
  open();
  return {get connected(){return connected;},get snapshot(){return snapshot;},get remoteLive(){return !!snapshot.online[other];},get autopilot(){return !isIshiee&&connected&&snapshot.npc;},sendLook(look){send({type:'look',look});},sendPose(pose,npc){send({type:'pose',pose,npc});},event(event){send({type:'event',event});}};
}
