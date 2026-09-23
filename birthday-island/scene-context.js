import * as THREE from 'three';

// An opt-in annotation layer; cloud IDs follow their seeded generation order.
export function buildSceneContext({camera,clouds,snapshot}){
  const root=document.createElement('div');root.hidden=true;root.id='scene-context';
  const style=document.createElement('style');style.textContent=`
    #scene-context{position:fixed;inset:0;z-index:1000;pointer-events:auto}
    #scene-context[hidden]{display:none}
    #scene-context button,#scene-context textarea{font:13px system-ui;color:#fff;background:#172435;border:1px solid #a7b4c980;border-radius:8px;padding:8px;pointer-events:auto}
    #scene-context .cloud-label{position:absolute;transform:translate(-50%,-50%);cursor:pointer}
    #scene-context .cloud-label[aria-pressed=true]{background:#665336;border-color:#ffe2a1}
    #scene-context section{position:absolute;bottom:20px;left:20px;width:min(380px,calc(100vw - 40px));box-sizing:border-box;padding:16px;background:#101b2bf2;border-radius:14px;color:#eee;font:14px/1.5 system-ui;pointer-events:auto}
    #scene-context p{margin:0 0 10px}#scene-context textarea{box-sizing:border-box;width:100%;height:115px;margin-bottom:8px;resize:vertical}
  `;document.head.appendChild(style);
  root.innerHTML='<div class="labels"></div><section><p><strong>Island context</strong><br>Click a cloud label, or copy just this viewpoint. Paste the note into our conversation.</p><textarea aria-label="Island context note" readonly></textarea><button class="copy">Copy context</button> <button class="close">Close · Esc</button><p class="status" role="status"></p></section>';
  document.body.appendChild(root);
  for(const event of ['mousedown','mousemove'])root.addEventListener(event,e=>e.stopPropagation());
  const labels=root.querySelector('.labels'),note=root.querySelector('textarea'),status=root.querySelector('.status');
  const buttons=new Map(),point=new THREE.Vector3();let selected=null;
  function refresh(){
    const cloud=clouds.contextTargets().find(c=>c.id===selected);
    note.value=JSON.stringify({islandContext:1,cloudLayout:'seed3918-count22-github-ca8024b',...snapshot(),cloud:cloud?{id:cloud.id,position:cloud.position.toArray()}:null},null,2);
  }
  function close(){root.hidden=true;document.body.classList.remove('is-scene-context');}
  root.querySelector('.close').onclick=close;
  root.querySelector('.copy').onclick=async()=>{
    refresh();try{await navigator.clipboard.writeText(note.value);status.textContent='Copied—paste this with your request.';}
    catch{note.focus();note.select();status.textContent='Press Ctrl+C or ⌘C to copy the selected note.';}
  };
  return {
    get active(){return !root.hidden;},
    open(){selected=null;status.textContent='';root.hidden=false;document.body.classList.add('is-scene-context');refresh();if(document.pointerLockElement)document.exitPointerLock();this.update();},
    close,
    update(){
      if(root.hidden)return;
      camera.updateWorldMatrix(true,false);
      for(const cloud of clouds.contextTargets()){
        let button=buttons.get(cloud.id);
        if(!button){button=document.createElement('button');button.className='cloud-label';button.textContent=cloud.id;
          button.onclick=()=>{selected=cloud.id;refresh();};labels.appendChild(button);buttons.set(cloud.id,button);}
        point.copy(cloud.position).project(camera);
        button.hidden=cloud.visibility<.08||point.z<-1||point.z>1||Math.abs(point.x)>1||Math.abs(point.y)>1;
        button.style.left=`${(point.x*.5+.5)*innerWidth}px`;button.style.top=`${(-point.y*.5+.5)*innerHeight}px`;
        button.setAttribute('aria-pressed',String(selected===cloud.id));
      }
    }
  };
}
