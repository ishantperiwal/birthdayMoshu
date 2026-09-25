import * as THREE from 'three';
import {cashBundleGeometry} from './cash-bundle.js?v=gold-wrap-3';
import {CASH_SITES,CASH_VALUE,formatCash,dashPhase,reduceCashDash} from './cash-dash-state.js';

export function buildCashDash({scene,camera,ground,resolveSite,rewards,online,male,roleUI=false,getNetwork,isPlaying,candlesBlown,getCollector,onPickup,onStart}){
  const sites=CASH_SITES.map(site=>({...site,...resolveSite(site.x,site.z)}));
  const mesh=new THREE.InstancedMesh(cashBundleGeometry(),new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}),sites.length);
  mesh.name='cash dash bundles';mesh.frustumCulled=false;mesh.visible=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);
  // Shared pale back-face shells bloom without per-bundle lights or draws.
  const glow=new THREE.InstancedMesh(new THREE.BoxGeometry(1.045,.535,.265),new THREE.MeshBasicMaterial({color:new THREE.Color(1.15,1.15,1.15),side:THREE.BackSide,depthWrite:false,toneMapped:false}),sites.length);
  glow.name='cash bundle white glow';glow.instanceMatrix=mesh.instanceMatrix;glow.frustumCulled=false;glow.visible=false;scene.add(glow);
  const transform=new THREE.Object3D(),portrait=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2),projected=new THREE.Vector3();
  const heights=sites.map(s=>ground(s.x,s.z)+1.0),pending=new Map();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const card=document.querySelector('.treasure-card');
  const timer=document.createElement('div');timer.className='cash-dash-timer';timer.hidden=true;
  const label=document.createElement('span'),clock=document.createElement('b');timer.append(label,clock);document.body.append(timer);
  const announcement=document.createElement('div');announcement.className='cash-sr-only';announcement.setAttribute('role','status');document.body.append(announcement);
  const button=document.createElement('button');button.className='cash-dash-start';button.textContent='Start cash dash';button.hidden=true;card.append(button);
  let dash=null,autoAt=null,serverAnchor=0,localAnchor=0,previousPhase='idle',lastCount=0,feedback=null,lastFeedback=-Infinity;
  const now=()=>online&&serverAnchor?serverAnchor+performance.now()-localAnchor:Date.now();
  function accept(next,{silent=false}={}){
    const old=dash;dash=next||null;
    if(!dash)return;
    if(!old||old.startAt!==dash.startAt){pending.clear();lastCount=0;feedback=null;lastFeedback=-Infinity;rewards.restore(0,0);onStart();}
    const count=dash.collected.length;
    if(count>lastCount){
      const index=dash.collected[count-1];
      if(silent){feedback=null;rewards.restore(count*CASH_VALUE,count);}
      else{
        feedback={index,count,amount:(feedback?.amount||0)+(count-lastCount)*CASH_VALUE};
      }
      lastCount=count;
    }
    for(const index of dash.collected)pending.delete(index);
  }
  function flushFeedback(time,force=false){
    if(!feedback||!force&&time-lastFeedback<100)return;
    const {index,count,amount}=feedback,site=sites[index];
    projected.set(site.x,heights[index],site.z).project(camera);
    const visible=Math.abs(projected.x)<=1&&Math.abs(projected.y)<=1&&Math.abs(projected.z)<=1;
    rewards.collectInstant({amount,total:count*CASH_VALUE,packages:count,x:visible?(projected.x*.5+.5)*innerWidth:innerWidth*.5,y:visible?(-projected.y*.5+.5)*innerHeight:innerHeight*.55});
    onPickup();feedback=null;lastFeedback=time;
  }
  function start(){
    if(!isPlaying()||!candlesBlown())return;
    if(online){if(male&&getNetwork()?.connected&&getNetwork()?.remoteLive)getNetwork().event({type:'cash-start'});return;}
    if(dash&&dashPhase(dash,now())!=='finished')return;
    accept(reduceCashDash({candles:true},{type:'cash-start'},'ISHIEE',now()).cashDash);
    previousPhase='idle';
  }
  button.addEventListener('click',start);
  rewards.restore(0,0);
  return {
    start,
    // True once a dash has run to its end (time up or every bundle found).
    get finished(){return dashPhase(dash,now())==='finished';},
    sync(snapshot){serverAnchor=snapshot.serverTime;localAnchor=performance.now();accept(snapshot.world.cashDash,{silent:!!snapshot.welcome});},
    update(){
      if(!isPlaying()){mesh.visible=glow.visible=false;button.hidden=true;return;}
      const time=now();
      if(!online&&!(roleUI&&male)&&candlesBlown()&&!dash){autoAt??=time+5000;if(time>=autoAt)start();}
      const phase=dashPhase(dash,time),collected=new Set(dash?.collected||[]);
      button.hidden=roleUI?!male||!!dash:online?!(male&&candlesBlown()&&!dash):phase!=='finished';
      button.disabled=!candlesBlown()||online&&(!getNetwork()?.connected||!getNetwork()?.remoteLive);
      button.title=!candlesBlown()?'Available after the candles are blown out':online&&!getNetwork()?.remoteLive?'Waiting for Moshi to join':'';
      if(roleUI)document.body.classList.toggle('cash-revealed',!!dash);
      button.textContent=online||roleUI?'Start cash dash':'Try cash dash again';
      timer.hidden=phase!=='countdown'&&phase!=='running';
      timer.setAttribute('data-phase',phase);
      const remaining=dash?Math.max(0,dash.endAt-time):0;
      timer.setAttribute('data-urgent',String(phase==='running'&&remaining<=10000));
      // Derive the beat from the same deadline as the digits, including online.
      if(!timer.hidden){
        const deadline=phase==='countdown'?dash.startAt:dash.endAt;
        const beat=(1000-((deadline-time)%1000))/1000;
        const pulse=Math.sin(Math.PI*Math.min(1,beat/.8))**2;
        clock.style.transform=`scale(${reduced.matches?1:1+pulse*(phase==='countdown'?.18:.10)})`;
      }
      if(phase==='countdown'){label.textContent='Get ready';clock.textContent=String(Math.ceil((dash.startAt-time)/1000));}
      else if(phase==='running'){label.textContent='';clock.textContent=Math.ceil((dash.endAt-time)/1000)+'s';}
      if(phase!==previousPhase){
        announcement.textContent=phase==='countdown'?'Cash dash starts in three seconds.':phase==='running'?'Go! Walk into cash bundles. Sixty seconds.':phase==='finished'?`Cash dash complete. ${formatCash(collected.size*CASH_VALUE)} collected.`:'';
        previousPhase=phase;
      }
      mesh.visible=glow.visible=phase==='countdown'||phase==='running';
      if(!mesh.visible){flushFeedback(time,true);return;}
      const collector=phase==='running'?getCollector():null;
      for(const site of sites){
        const i=site.index,t=time/1000;
        if(pending.has(i)&&time-pending.get(i)>1000)pending.delete(i);
        transform.position.set(site.x,heights[i]+(reduced.matches?0:Math.sin(t*1.8+i)*.08),site.z);
        transform.rotation.set(0,reduced.matches?.4:t*.8+i,-.18,'ZYX');transform.quaternion.multiply(portrait);
        transform.scale.setScalar(collected.has(i)?0:.72);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
        if(collector&&!collected.has(i)&&!pending.has(i)&&Math.hypot(collector.x-site.x,collector.z-site.z)<1.65){
          if(online){if(getNetwork()?.connected){pending.set(i,time);getNetwork().event({type:'cash-pickup',index:i});}}
          else{const next=reduceCashDash({cashDash:dash},{type:'cash-pickup',index:i},'MOSHIEE',time);if(next)accept(next.cashDash);}
        }
      }
      mesh.instanceMatrix.needsUpdate=true;
      flushFeedback(time);
    }
  };
}
