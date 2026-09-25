// Play remote snapshots a little behind real time, so movement follows a
// continuous timeline instead of repeatedly chasing the newest packet.
export function createRemoteMotion({delay=140,teleportDistance=8}={}){
  let frames=[],offset=null,fallback=null,fastest=[],catching=false;
  const copy=p=>({...p,position:[...p.position]});
  function reset(p=null){frames=[];offset=null;fastest=[];catching=false;fallback=p?copy(p):null;}
  function push(p,receivedAt){
    const source=Number.isFinite(p.time)?p.time:receivedAt;
    const last=frames.at(-1);
    if(last&&(source<last.source||receivedAt-last.receivedAt>1000||p.lying!==last.pose.lying||Math.hypot(...p.position.map((v,i)=>v-last.pose.position[i]))>teleportDistance))reset(p);
    const seen=receivedAt-source;
    if(offset===null)offset=seen;
    // The first packet can arrive late (for example while the page is still
    // loading); never let that delay stick. Ordinary jitter is left alone, but
    // once playback lags the fastest recent packet by >120 ms it eases back
    // until it is within 40 ms again.
    fastest.push(seen);if(fastest.length>30)fastest.shift();
    const best=Math.min(...fastest);
    if(offset-best>120)catching=true;
    if(catching){const catchUp=Math.min(25,offset-best-40);if(catchUp<=0)catching=false;else{offset-=catchUp;for(const f of frames)f.at-=catchUp;}}
    if(frames.at(-1)?.source===source)return;
    frames.push({source,at:source+offset,receivedAt,pose:copy(p)});
    if(frames.length>32)frames.shift();
    fallback=copy(p);
  }
  function sample(now){
    if(!frames.length)return fallback;
    const target=now-delay;
    while(frames.length>2&&frames[1].at<=target)frames.shift();
    const a=frames[0],b=frames[1];
    if(target<=a.at)return {...a.pose,moving:false};
    if(!b||target>=b.at){const last=b||a;return {...last.pose,moving:now-last.receivedAt<delay+100&&last.pose.moving};}
    const t=Math.max(0,Math.min(1,(target-a.at)/(b.at-a.at)));
    const turn=Math.atan2(Math.sin(b.pose.yaw-a.pose.yaw),Math.cos(b.pose.yaw-a.pose.yaw));
    const distance=Math.hypot(b.pose.position[0]-a.pose.position[0],b.pose.position[2]-a.pose.position[2]);
    return {...a.pose,position:a.pose.position.map((v,i)=>v+(b.pose.position[i]-v)*t),
      yaw:a.pose.yaw+turn*t,pitch:a.pose.pitch+(b.pose.pitch-a.pose.pitch)*t,
      moving:!a.pose.lying&&distance>.001,running:t<.5?a.pose.running:b.pose.running};
  }
  return {reset,push,sample};
}
