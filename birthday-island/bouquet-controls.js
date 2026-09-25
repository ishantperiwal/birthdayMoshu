import * as THREE from 'three';
import {bouquetState} from './bouquet-motion.js';
import {clampWalkPitch} from './look-limits.js?v=down-46';

export function buildBouquetControls({scene,camera,playerRig,avatar,companion,terrainHeight,hisEyeHeight=1.70,isOnline,isMale,roleUI=false,getNetwork,isPlaying,isBusy,clearKeys,toast}){
  const roleAware=isOnline||roleUI;
  let state='hidden',preview=null,hisView=false,savedCamera=null,age=3,armView=false,hisPitch=-.27;
  const originalScale=avatar.root.scale.clone();
  const panel=document.createElement('div');panel.id='bouquet-controls';
  panel.style.cssText='position:fixed;left:24px;bottom:82px;z-index:25;display:none;gap:8px;flex-wrap:wrap;max-width:calc(100vw - 48px)';
  const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='border:1px solid #f4e4cd55;border-radius:18px;padding:9px 13px;background:#233e42dd;color:#fff0dc;font:12px system-ui;cursor:pointer';b.addEventListener('click',action);panel.append(b);return b;};
  const reveal=button('Reveal bouquet · B',()=>request(true));
  const pov=button('His POV · V',()=>switchView());
  const receive=button('Receive bouquet · R',()=>receiveFlowers());
  const putAway=button('Put away',()=>state==='received'?storeFlowers():request(false));
  const end=button('End preview',()=>endPreview());
  document.body.append(panel);
  if(roleAware){pov.hidden=true;end.hidden=true;}
  function apply(value,snap=false){
    const next=bouquetState(value);if(next!==state)age=0;
    state=next;if(snap)age=3;
    avatar.setBouquet(state,snap);companion.setBouquet(state,snap);
  }
  function nearPartner(){return playerRig.position.distanceTo(companion.anchor.position)<=3.7&&(!isOnline||getNetwork()?.remoteLive);}
  function receiveFlowers(){
    if(!isPlaying()||isBusy()||state!=='offered'||age<.85||!nearPartner()||(roleAware&&isMale))return;
    if(isOnline){getNetwork()?.event({type:'receive-bouquet'});return;}
    if(companion.holding)companion.toggleHolding();
    apply('received');
    if(!hisView)resumeWalking();
    toast('FLOWERS FOR YOU · CLICK THE WORLD TO WALK · PUT AWAY WHEN READY');
  }
  function storeFlowers(){
    if(!isPlaying()||isBusy()||state!=='received'||age<1.05||(roleAware&&isMale))return;
    if(isOnline){getNetwork()?.event({type:'put-away-bouquet'});return;}
    apply('stored');toast('FLOWERS SAFELY TUCKED AWAY');
  }
  function beginPreview(){
    if(preview||roleAware)return;
    if(companion.holding)companion.toggleHolding();
    preview={position:companion.anchor.position.clone(),rotation:companion.anchor.rotation.clone(),visible:armView?false:avatar.root.visible,scale:armView?originalScale.clone():avatar.root.scale.clone()};
    const front=new THREE.Vector3(0,0,-2.5).applyAxisAngle(new THREE.Vector3(0,1,0),playerRig.rotation.y);
    companion.anchor.position.copy(playerRig.position).add(front);
    companion.anchor.position.y=terrainHeight(companion.anchor.position.x,companion.anchor.position.z);
    companion.anchor.rotation.set(0,playerRig.rotation.y+Math.PI,0);
    clearKeys();
  }
  function request(value){
    if(!isPlaying()||isBusy())return;
    if(isOnline){
      const net=getNetwork();if(!isMale||!net?.connected||state==='received')return;
      net.event({type:'bouquet',shown:value});return;
    }
    if(roleUI&&(!isMale||state==='received'))return;
    if(roleUI){apply(value);return;}
    beginPreview();
    // Replay the surprise from either camera without needing to reload.
    if(value)apply(false,true);
    apply(value);toast(value?'A LITTLE SOMETHING FOR YOU':'FLOWERS TUCKED AWAY');
  }
  function switchView(){
    if(roleAware||!isPlaying()||isBusy())return;
    beginPreview();hisView=!hisView;
    if(hisView){
      savedCamera={parent:camera.parent,position:camera.position.clone(),quaternion:camera.quaternion.clone()};
      scene.attach(camera);avatar.root.visible=true;avatar.root.scale.setScalar(companion.bodyScale);
      companion.setBouquetView(true);
    }else resumeWalking();
    clearKeys();pov.textContent=hisView?'Her POV · V':'His POV · V';
  }
  function restoreCamera(){
    if(savedCamera){savedCamera.parent.add(camera);camera.position.copy(savedCamera.position);camera.quaternion.copy(savedCamera.quaternion);savedCamera=null;}
    companion.setBouquetView(false);avatar.setBouquetView(false);armView=false;
    if(preview){avatar.root.visible=preview.visible;avatar.root.scale.copy(preview.scale);}
  }
  function resumeWalking(){
    // End only the staged camera preview. Keep her flowers, and let the
    // companion continue following from his current position without a reset.
    restoreCamera();preview=null;hisView=false;
    pov.textContent='His POV · V';clearKeys();
  }
  function endPreview(){
    if(!preview)return;
    if(state==='received'||state==='stored'){resumeWalking();return;}
    restoreCamera();companion.resumeAutopilot();
    apply(false,true);preview=null;hisView=false;pov.textContent='His POV · V';clearKeys();
  }
  return {
    look(dx,dy){if(hisView){companion.anchor.rotation.y-=dx*.0022;hisPitch=clampWalkPitch(hisPitch-dy*.0018);}},
    get previewing(){return !!preview;},get hisView(){return hisView;},get shown(){return isMale?state==='offered':state==='received';},
    get received(){return state==='received';},
    sync(value,snap=false){apply(value,snap);},
    keyDown(e){
      if(e.repeat)return false;
      if(e.code==='KeyB'&&(!roleAware||isMale)){e.preventDefault();request(roleAware?state!=='offered':true);return true;}
      if(e.code==='KeyR'&&(!roleAware||!isMale)&&state==='offered'){e.preventDefault();receiveFlowers();return true;}
      if(e.code==='KeyV'&&!roleAware){e.preventDefault();switchView();return true;}
      if(e.code==='Escape'&&preview){
        if(state==='received'||state==='stored')resumeWalking();else endPreview();
        return true;
      }
      return false;
    },
    update(dt){
      age+=dt;
      const busy=isBusy(),connected=!isOnline||getNetwork()?.connected;
      panel.style.display=isPlaying()&&(!roleAware||isMale||state==='offered'||state==='received')?'flex':'none';
      reveal.disabled=pov.disabled=putAway.disabled=busy;
      reveal.hidden=roleAware&&!isMale;
      reveal.disabled=busy||!connected||(roleAware&&state==='received');
      reveal.textContent=roleAware&&state==='offered'?'Put away · B':!roleAware&&state!=='hidden'?'Replay bouquet · B':'Reveal bouquet · B';
      receive.hidden=state!=='offered'||(roleAware&&isMale);
      receive.disabled=busy||!connected||age<.85||!nearPartner();
      receive.textContent=nearPartner()?'Receive bouquet · R':'Move closer to receive';
      putAway.hidden=!(state==='received'&&(!roleAware||!isMale)||state==='offered'&&!roleAware);
      putAway.disabled=busy||!connected||(state==='received'&&age<1.05);
      end.hidden=roleAware||!preview;
      // Only the holding arm is visible in first person, never a floating body.
      const active=avatar.bouquetActive&&!busy&&!hisView;
      if(active){avatar.root.scale.setScalar(companion.bodyScale);avatar.setBouquetView(true);avatar.root.visible=true;armView=true;}
      else if(armView){avatar.setBouquetView(false);avatar.root.visible=hisView;avatar.root.scale.copy(preview?.scale||originalScale);armView=false;}
      avatar.updateBouquet(dt,busy);companion.updateBouquet(dt,busy);
      if(hisView){
        avatar.setBouquetView(false);avatar.root.visible=true;avatar.root.scale.setScalar(companion.bodyScale);
        companion.setBouquetView(true);
        companion.anchor.updateWorldMatrix(true,false);
        camera.position.set(0,hisEyeHeight,-.08);companion.anchor.localToWorld(camera.position);
        camera.rotation.set(hisPitch,companion.anchor.rotation.y,0,'YXZ');
      }
    }
  };
}
