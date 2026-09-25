import * as THREE from 'three';
export function buildBenchSeat({bench,player,cameraPivot,avatar,companion,keys,isMale,send,canSit}){
  let active=false,saved=null;
  const button=document.createElement('button');button.textContent='Stand up · Esc';button.hidden=true;button.style.cssText='position:fixed;z-index:40;bottom:90px;left:50%;transform:translateX(-50%);padding:12px 22px;border:0;border-radius:24px;background:#192b39;color:#fff0d2;font:14px system-ui';document.body.append(button);
  function clearKeys(){Object.keys(keys).forEach(k=>keys[k]=false);}
  function apply(on){
    if(on===active)return;
    if(on){
      saved={p:player.position.clone(),r:player.rotation.clone(),c:cameraPivot.position.clone(),cr:cameraPivot.rotation.clone(),a:avatar.root.rotation.clone(),visible:avatar.root.visible,partner:companion.anchor.position.clone(),pr:companion.anchor.rotation.clone()};
      if(companion.holding)companion.toggleHolding();
      active=true;clearKeys();
    }else{
      active=false;avatar.poseBench(false);companion.poseBench(false);
      player.position.copy(saved.p);player.rotation.copy(saved.r);cameraPivot.position.copy(saved.c);cameraPivot.rotation.copy(saved.cr);avatar.root.rotation.copy(saved.a);avatar.root.visible=saved.visible;
      companion.anchor.position.copy(saved.partner);companion.anchor.rotation.copy(saved.pr);clearKeys();
    }
    button.hidden=!active;
    if(active){cameraPivot.position.set(0,1.55,0);cameraPivot.rotation.set(-.06,0,0,'YXZ');update();}
  }
  function request(on){if(on&&!canSit())return;if(!send(on))apply(on);}
  button.onclick=()=>request(false);
  function update(){
    if(!active)return;
    bench.updateWorldMatrix(true,false);
    const own=bench.localToWorld(new THREE.Vector3(isMale?.62:-.62,0,-.06));
    const other=bench.localToWorld(new THREE.Vector3(isMale?-.62:.62,0,-.06));
    player.position.copy(own);player.rotation.set(0,bench.rotation.y,0);avatar.root.rotation.set(0,0,0);avatar.root.visible=false;
    companion.anchor.position.copy(other);companion.anchor.rotation.set(0,bench.rotation.y,0);
    avatar.poseBench(true);companion.poseBench(true);
  }
  return {get active(){return active;},sit:()=>request(true),stand:()=>request(false),sync:apply,update,look(dx,dy){cameraPivot.rotation.y=THREE.MathUtils.clamp(cameraPivot.rotation.y-dx*.0017,-1.35,1.35);cameraPivot.rotation.x=THREE.MathUtils.clamp(cameraPivot.rotation.x-dy*.0015,-.65,.75);}};
}
