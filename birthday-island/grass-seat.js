import * as THREE from 'three';
// A reversible local experiment, never enabled on hosted or multiplayer pages.
export function buildGrassSeat({enabled,scene,player,cameraPivot,avatar,companion,ground,keys,available}){
  let active=false,saved=null,blanket=null,hisView=false;
  const spot={x:12.5222,z:1.2621};
  if(enabled){
    const cloth=new THREE.PlaneGeometry(2.6,3.5,32,40);cloth.rotateX(-Math.PI/2);
    const p=cloth.attributes.position;
    for(let i=0;i<p.count;i++){
      const across=p.getX(i),along=1.4+p.getZ(i),x=spot.x+across,z=spot.z+along;
      // Raised over both laps, draped down the outer edges and between feet.
      const side=1-THREE.MathUtils.smoothstep(Math.abs(across),.65,1.3);
      const nearLap=Math.exp(-Math.pow((along-.28)/.73,4));
      const farLap=Math.exp(-Math.pow((along-2.52)/.73,4));
      const folds=(Math.sin(across*15+along*2)*.015+Math.sin(along*10-across*3)*.009)*side;
      p.setXYZ(i,x,ground(x,z)+.045+side*(.13+.29*Math.max(nearLap,farLap))+folds,z);
    }
    cloth.computeVertexNormals();
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#aaa0be';ctx.fillRect(0,0,64,64);
    ctx.strokeStyle='#c7bdd5';ctx.lineWidth=1;
    for(let n=0;n<64;n+=4){ctx.beginPath();ctx.moveTo(n,0);ctx.lineTo(n,64);ctx.stroke();ctx.beginPath();ctx.moveTo(0,n);ctx.lineTo(64,n);ctx.stroke();}
    const weave=new THREE.CanvasTexture(canvas);weave.colorSpace=THREE.SRGBColorSpace;weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(8,10);
    blanket=new THREE.Mesh(cloth,new THREE.MeshStandardMaterial({map:weave,color:0xb1a2c5,roughness:1,side:THREE.DoubleSide}));
    blanket.name='Shared lap blanket';blanket.receiveShadow=true;blanket.castShadow=true;blanket.visible=false;scene.add(blanket);
  }
  const button=document.createElement('button');button.className='grass-seat-test';button.hidden=true;
  button.textContent='Sit together · test';document.body.append(button);
  const pov=document.createElement('button');pov.className='grass-seat-test grass-seat-pov';pov.hidden=true;document.body.append(pov);
  function switchView(){
    if(!active)return;hisView=!hisView;
    (hisView?companion.anchor:player).add(cameraPivot);
    cameraPivot.position.set(0,1.05,0);cameraPivot.rotation.set(-.06,0,0,'YXZ');
    avatar.setSeatedHeadVisible(hisView);companion.setSeatedHeadVisible(!hisView);
  }
  pov.addEventListener('click',switchView);
  function stand(){
    if(!active)return;active=false;
    player.add(cameraPivot);cameraPivot.position.copy(saved.pivotPosition);hisView=false;pov.hidden=true;document.body.classList.remove('grass-seated');
    avatar.setSeatedHeadVisible(true);companion.setSeatedHeadVisible(true);
    if(blanket)blanket.visible=false;
    avatar.poseSitting(false);avatar.setFirstPerson(false);avatar.root.visible=saved.visible;
    avatar.root.scale.copy(saved.scale);
    companion.poseSitting(false);player.position.copy(saved.player);companion.anchor.position.copy(saved.partner);
    companion.anchor.rotation.copy(saved.rotation);player.rotation.copy(saved.playerRotation);cameraPivot.position.y=saved.eye;cameraPivot.rotation.copy(saved.cameraRotation);avatar.root.rotation.copy(saved.avatarRotation);
    Object.keys(keys).forEach(k=>keys[k]=false);
  }
  button.addEventListener('click',()=>{
    if(active){stand();return;}
    if(!enabled||!available())return;
    saved={player:player.position.clone(),playerRotation:player.rotation.clone(),partner:companion.anchor.position.clone(),rotation:companion.anchor.rotation.clone(),eye:cameraPivot.position.y,pivotPosition:cameraPivot.position.clone(),cameraRotation:cameraPivot.rotation.clone(),avatarRotation:avatar.root.rotation.clone(),visible:avatar.root.visible,scale:avatar.root.scale.clone()};
    if(companion.holding)companion.toggleHolding();
    active=true;Object.keys(keys).forEach(k=>keys[k]=false);
    player.position.set(spot.x,ground(spot.x,spot.z)+.08,spot.z);
    player.rotation.y=-Math.PI;
    companion.anchor.position.set(spot.x,ground(spot.x,spot.z+2.8)+.08,spot.z+2.8);
    companion.anchor.rotation.set(0,0,0);avatar.root.rotation.set(0,0,0);cameraPivot.rotation.set(-.06,0,0,'YXZ');
    avatar.root.scale.setScalar(companion.bodyScale);avatar.root.visible=true;avatar.setFirstPerson(true);
    avatar.poseSitting(true);companion.poseSitting(true);cameraPivot.position.y=1.05;
    document.body.classList.add('grass-seated');
    if(blanket)blanket.visible=true;
  });
  return {get active(){return active;},stand,switchView,look(dx,dy){
    // Turn only the camera: the rig also owns her body, so rotating it moves her legs.
    cameraPivot.rotation.y=THREE.MathUtils.clamp(cameraPivot.rotation.y-dx*.0017,-.65,.65);
    cameraPivot.rotation.x=THREE.MathUtils.clamp(cameraPivot.rotation.x-dy*.0015,-.35,.22);
  },update(){
    button.hidden=!enabled||(!active&&(!available()||Math.hypot(player.position.x-spot.x,player.position.z-spot.z)>5));
    button.textContent=active?'Stand up · Esc':'Sit together · test';
    pov.hidden=!active;pov.textContent=hisView?'Her seated POV · V':'His seated POV · V';
    if(active){avatar.poseSitting(true);companion.poseSitting(true);avatar.setSeatedHeadVisible(hisView);companion.setSeatedHeadVisible(!hisView);}
  }};
}
