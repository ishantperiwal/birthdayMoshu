import * as THREE from 'three';

export const STARGAZING_SPOTS=[{x:-12,z:12}];
// Lying down, the gaze can nod a little around its resting 1.22 (toward the
// feet or back over the head) without ever losing the sky.
import {slideGaze,GAZE_PITCH_MIN,GAZE_PITCH_MAX} from './gaze-limits.js';
export {GAZE_PITCH_MIN,GAZE_PITCH_MAX};

export function buildStargazing({scene,camera,playerRig,avatar,companion,terrainHeight,interactive,setMood,keys,glowTexture,networkMode=false,male=false,canMovePartner=()=>true,canStart=()=>true,onBlocked=()=>{},onViewerStop=()=>{},onFocusDrawing=()=>{},getViewerLook=()=>({yaw:0,pitch:1.22}),onInk=()=>{},onLeave=()=>{}}){
  const sites=[];
  // Woven fabric follows the terrain; the surrounding meadow keeps its own colour.
  const fabric=document.createElement('canvas');fabric.width=fabric.height=512;
  const weave=fabric.getContext('2d');weave.fillStyle='#665776';weave.fillRect(0,0,512,512);
  for(let i=0;i<512;i+=3){weave.fillStyle=i%2?'#756681':'#5d506d';weave.fillRect(i,0,1,512);weave.fillStyle='#d7c2ac18';weave.fillRect(0,i,512,1);}
  weave.strokeStyle='#cbb89c';weave.lineWidth=9;weave.strokeRect(24,24,464,464);
  weave.strokeStyle='#a38e9d';weave.lineWidth=2;weave.strokeRect(38,38,436,436);
  weave.setLineDash([3,5]);weave.strokeStyle='#e2cdb2';weave.strokeRect(14,14,484,484);
  weave.setLineDash([]);weave.strokeStyle='#c5ac9970';weave.lineWidth=2;
  for(const [cx,cy] of [[256,256],[95,95],[417,95],[95,417],[417,417]]){
    const r=cx===256?45:12;weave.beginPath();weave.moveTo(cx,cy-r);weave.lineTo(cx+r,cy);weave.lineTo(cx,cy+r);weave.lineTo(cx-r,cy);weave.closePath();weave.stroke();
  }
  const texture=new THREE.CanvasTexture(fabric);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  for(const {x,z} of STARGAZING_SPOTS){
    const spot=new THREE.Group();scene.add(spot);
    let ground=terrainHeight(x,z);
    for(const dx of [-2,2])for(const dz of [-2,2])ground=Math.max(ground,terrainHeight(x+dx,z+dz));
    spot.position.set(x,ground+.025,z);
    sites.push({x,z,ground,spot});
    // Keep the sheet settled flat; only the outer hem has small, local wrinkles.
    function clothPoint(u,v){
      const edgeX=Math.pow(Math.min(1,Math.abs(u)/1.9),10),edgeZ=Math.pow(Math.min(1,Math.abs(v)/1.9),10);
      const px=u+.010*edgeX*Math.sin(v*3.7+.6),pz=v+.009*edgeZ*Math.sin(u*4.1-1.2);
      const sideWrinkle=.016*Math.exp(-Math.pow((u+1.78)/.20,2)-Math.pow((v-.55)/.45,2));
      const endWrinkle=.012*Math.exp(-Math.pow((v+1.77)/.19,2)-Math.pow((u-.85)/.38,2));
      const hem=.006*edgeZ*Math.pow(.5+.5*Math.sin(u*4.2+.7),2)+.005*edgeX*Math.pow(.5+.5*Math.cos(v*3.4),2);
      return new THREE.Vector3(px,terrainHeight(x+px,z+pz)-spot.position.y+.016+sideWrinkle+endWrinkle+hem,pz);
    }
    const rugGeo=new THREE.PlaneGeometry(3.8,3.8,64,64);rugGeo.rotateX(-Math.PI/2);
    const rugVertices=rugGeo.attributes.position;
    for(let i=0;i<rugVertices.count;i++){
      const p=clothPoint(rugVertices.getX(i),rugVertices.getZ(i));rugVertices.setXYZ(i,p.x,p.y,p.z);
    }
    rugGeo.computeVertexNormals();
    const rug=new THREE.Mesh(rugGeo,new THREE.MeshPhysicalMaterial({map:texture,bumpMap:texture,bumpScale:.004,roughness:1,sheen:.25,sheenColor:0x9b849f,sheenRoughness:1,side:THREE.DoubleSide}));rug.receiveShadow=true;spot.add(rug);
    const fringe=[];
    for(const side of [-1,1])for(let i=0;i<36;i++){
      const fx=-1.75+i*.1,base=clothPoint(fx,side*1.9);
      const length=.075+.035*(.5+.5*Math.sin(i*7.3+side));
      const tipX=base.x+.017*Math.sin(i*4.9),tipZ=base.z+side*length;
      const tip=new THREE.Vector3(tipX,terrainHeight(x+tipX,z+tipZ)-spot.position.y+.012,tipZ);
      const middle=base.clone().lerp(tip,.5);middle.y+=.006;
      fringe.push(...base.toArray(),...middle.toArray(),...middle.toArray(),...tip.toArray());
    }
    const fringeGeo=new THREE.BufferGeometry();fringeGeo.setAttribute('position',new THREE.Float32BufferAttribute(fringe,3));
    spot.add(new THREE.LineSegments(fringeGeo,new THREE.LineBasicMaterial({color:0xcbb89c})));
  }
  const ui=document.createElement('section');ui.id='stargazing';ui.hidden=true;
  ui.setAttribute('aria-label','Stargazing: click to enter drawing, drag to draw, Escape to look around, Q to get up');
  document.body.append(ui);
  const blackout=document.createElement('div');
  blackout.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:10000';
  blackout.setAttribute('aria-hidden','true');document.body.append(blackout);
  const max=12000,positions=new Float32Array(max*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setDrawRange(0,0);
  const ink=new THREE.Group();scene.add(ink);
  const inkBirth=new Float32Array(max);geo.setAttribute('inkBirth',new THREE.BufferAttribute(inkBirth,1));
  const sparkleTime={value:0},eraseTime={value:-100},eraseSpan={value:1},fadeLimit={value:1e9},inkMotion={value:1};
  const inkUniforms={uTime:sparkleTime,uErase:eraseTime,uEraseSpan:eraseSpan,uFadeLimit:fadeLimit,uMotion:inkMotion};
  const inkShader=`uniform float uErase;uniform float uEraseSpan;uniform float uFadeLimit;uniform float uMotion;
    float inkFade(float birth){return birth>uFadeLimit?1.0:1.0-smoothstep(birth,birth+uEraseSpan,uErase);}
    vec3 drift(vec3 p){float s=p.x*.15+p.z*.12;return p+uMotion*vec3(sin(uTime*.65+s)*.10,sin(uTime*.8+s*.7)*.13,cos(uTime*.55+s)*.08);}`;
  ink.add(new THREE.LineSegments(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:inkUniforms,vertexShader:`attribute float inkBirth;uniform float uTime;varying float vFade;${inkShader}
      void main(){vFade=inkFade(inkBirth);gl_Position=projectionMatrix*modelViewMatrix*vec4(drift(position),1.0);}`,
    fragmentShader:`varying float vFade;void main(){gl_FragColor=vec4(1.0,.88,.67,.55*vFade);}`})));
  // Both the settled ink and fresh dust have four-point glints, not stretched halos.
  const glintFragment=`varying float vAlpha; varying vec3 vTint;
    void main(){vec2 p=gl_PointCoord*2.0-1.0;float r=length(p);
    float core=exp(-28.0*r*r),halo=.18*exp(-5.0*r*r);
    float rays=.55*(exp(-p.x*p.x*95.0-p.y*p.y*5.0)+exp(-p.y*p.y*95.0-p.x*p.x*5.0));
    gl_FragColor=vec4(vTint,(core+halo+rays)*(1.0-smoothstep(.75,1.0,r))*vAlpha);}`;
  const sparkMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:inkUniforms,
    vertexShader:`attribute float inkBirth;uniform float uTime; varying float vAlpha; varying vec3 vTint;${inkShader}
      void main(){float seed=position.x*8.0+position.z*11.0;
      vAlpha=.52+.14*sin(uTime*.85+seed);vAlpha*=smoothstep(0.0,.18,uTime-inkBirth);vAlpha*=inkFade(inkBirth);vTint=vec3(1.0,.87,.64);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(drift(position),1.0);gl_PointSize=9.0+vAlpha*5.0;}`,
    fragmentShader:glintFragment});
  ink.add(new THREE.Points(geo,sparkMat));
  const dustMax=3000,dustPositions=new Float32Array(dustMax*3),births=new Float32Array(dustMax).fill(-100);
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));dustGeo.setAttribute('birth',new THREE.BufferAttribute(births,1));
  const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:sparkleTime},
    vertexShader:`attribute float birth;uniform float uTime;varying float vAlpha;varying vec3 vTint;
      void main(){float age=uTime-birth;float seed=position.x*19.0+position.z*3.0;
      vAlpha=smoothstep(0.0,.20,age)*(1.0-smoothstep(.45,1.4,age))*(.30+.08*sin(age*1.2+seed));
      vTint=mix(vec3(.72,.8,1.0),vec3(1.0,.86,.52),.5+.5*sin(seed));
      vec3 p=position+vec3(sin(seed+age)*age*.22,-age*.32,cos(seed)*age*.2);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);gl_PointSize=4.0+7.0*(.5+.5*sin(seed));}`,
    fragmentShader:glintFragment});
  const dust=new THREE.Points(dustGeo,dustMat);dust.frustumCulled=false;ink.add(dust);let dustIndex=0;
  function sprinkle(a,b){
    const steps=Math.min(40,Math.max(1,Math.ceil(a.distanceTo(b)/.47)));
    for(let i=0;i<steps;i++){
      const t=i/steps,j=dustIndex++%dustMax;
      dustPositions[j*3]=THREE.MathUtils.lerp(a.x,b.x,t)+(Math.random()-.5)*1.1;
      dustPositions[j*3+1]=THREE.MathUtils.lerp(a.y,b.y,t)+(Math.random()-.5)*1.1;
      dustPositions[j*3+2]=THREE.MathUtils.lerp(a.z,b.z,t)+(Math.random()-.5)*1.1;births[j]=sparkleTime.value;
    }
    dustGeo.attributes.position.needsUpdate=true;dustGeo.attributes.birth.needsUpdate=true;
  }
  function clearDust(){births.fill(-100);dustGeo.attributes.birth.needsUpdate=true;}
  let active=false,saved=null,count=0,drawing=false,last=null,lastBirth=0,strokeStart=0;const strokes=[];
  const seeDrawing=document.createElement('button');seeDrawing.className='stargaze-see-drawing';seeDrawing.textContent='See what they draw';seeDrawing.hidden=true;document.body.append(seeDrawing);
  let remoteSum=[0,0,0],remoteCount=0,remoteAt=-100,remotePending=false;
  seeDrawing.addEventListener('mousedown',e=>e.stopPropagation());
  seeDrawing.addEventListener('click',()=>{
    if(!canDraw()||!remoteCount)return;
    stopDrawing();camera.getWorldPosition(eye);
    const dx=remoteSum[0]/remoteCount-eye.x,dy=remoteSum[1]/remoteCount-eye.y,dz=remoteSum[2]/remoteCount-eye.z;
    const length=Math.hypot(dx,dy,dz)||1;
    yaw=Math.atan2(-dx,dy);pitch=Math.acos(Math.max(-1,Math.min(1,-dz/length)));
    if(viewer)onFocusDrawing(yaw,pitch);
    touchInk();remotePending=false;seeDrawing.hidden=true;
  });
  // Shown while drawing, for both of them: stop drawing and look around again.
  const drawHint=document.createElement('button');drawHint.type='button';drawHint.className='stargaze-draw-hint';drawHint.hidden=true;
  drawHint.innerHTML='Drawing <span aria-hidden="true">·</span> <b>Esc</b> to stop';document.body.append(drawHint);
  drawHint.addEventListener('mousedown',e=>e.stopPropagation());
  drawHint.addEventListener('click',()=>{if(drawMode)stopDrawing();else startDrawing();});
  const cursorTrail=Array.from({length:12},()=>{const dot=document.createElement('i');dot.className='stargaze-cursor-trail';document.body.append(dot);return dot;});
  let trailIndex=0,trailAt=0;
  // viewer: he lies beside her in his own view and may draw too, without the
  // carpet transition (his camera follows his pose).
  let drawMode=false,viewer=false,drawPan=null,gameActive=false,gameCanDraw=true;
  const canDraw=()=>(active&&!entering&&!leaving)||viewer;
  const cursorTarget=()=>viewer?document.body:ui;
  let entering=false,leaving=false,transitionId=0,fadeAnimation=null;
  let lastInkActivity=-100,fadeStart=null,fadeFirst=0,fadeRate=1,fadingCount=0;
  function touchInk(){lastInkActivity=sparkleTime.value;if(fadeStart===null)eraseTime.value=-100;else lastBirth=Math.max(lastBirth,fadeLimit.value+.001);}
  let previousTime=0,yaw=0,pitch=1.22,hasGazeLock=false;
  const basePosition=new THREE.Vector3(),baseRotation=new THREE.Quaternion(),target=new THREE.Quaternion();
  // Lying on her back, yaw rolls her head about the body's long axis (world Z)
  // toward him or away; pitch only nods within GAZE_PITCH so the sky never tips.
  const lookEuler=new THREE.Euler(0,0,0,'ZXY'),sway=new THREE.Quaternion(),swayEuler=new THREE.Euler();
  const pen={clientX:0,clientY:0};
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function remember(o){return {position:o.position.clone(),rotation:o.rotation.clone(),up:o.up.clone(),scale:o.scale.clone()};}
  function restore(o,s){o.position.copy(s.position);o.rotation.copy(s.rotation);o.up.copy(s.up);o.scale.copy(s.scale);}
  function lock(){ui.requestPointerLock?.()?.catch(()=>{});}
  async function enter(site){
    if(active||entering||leaving||companion.throwing)return;
    if(!canStart()){onBlocked();return;}
    entering=true;const id=++transitionId;
    Object.keys(keys).forEach(k=>keys[k]=false);
    ui.hidden=false;lock();
    fadeAnimation=blackout.animate([{opacity:0},{opacity:1}],{duration:350,fill:'forwards',easing:'ease-in-out'});
    try{await fadeAnimation.finished;}catch{return;}
    if(id!==transitionId)return;
    settle(site);
    fadeAnimation.cancel();
    fadeAnimation=blackout.animate([{opacity:1},{opacity:0}],{duration:550,fill:'forwards',easing:'ease-in-out'});
    try{await fadeAnimation.finished;}catch{return;}
    if(id===transitionId){entering=false;fadeAnimation.cancel();fadeAnimation=null;}
  }
  function settle(site){
    if(active||companion.throwing)return;
    site??=sites.reduce((nearest,candidate)=>candidate.spot.position.distanceToSquared(playerRig.position)<nearest.spot.position.distanceToSquared(playerRig.position)?candidate:nearest);
    const {x,z,ground}=site;
    const side=male?-1:1;
    active=true;saved={player:remember(playerRig),partner:remember(companion.anchor),avatar:remember(avatar.root),visible:avatar.root.visible,camera:remember(camera),parent:camera.parent,partnerVisible:companion.anchor.visible};
    if(companion.holding)companion.toggleHolding();
    Object.keys(keys).forEach(k=>keys[k]=false);setMood('night');
    avatar.resetRestingPose();avatar.update(0,false,false);scene.attach(camera);
    if(canMovePartner())companion.resetRestingPose();
    avatar.root.scale.setScalar(companion.bodyScale);
    playerRig.position.set(x+side*.62,ground+.27,z-.65);playerRig.rotation.set(Math.PI/2,0,0);avatar.root.rotation.set(0,0,0);avatar.root.visible=true;
    if(canMovePartner()){companion.anchor.position.set(x-.62,ground+.27,z-.65);companion.anchor.rotation.set(Math.PI/2,0,0);}
    ui.hidden=false;document.body.classList.add('is-stargazing');
    if(canMovePartner())companion.anchor.visible=true;avatar.setFirstPerson(true);avatar.resetRestingPose();ink.visible=true;yaw=0;pitch=1.22;
    basePosition.set(x+side*.62,ground+(male?.62:.56),z+1.05);camera.position.copy(basePosition);
    lookEuler.set(pitch,0,yaw);baseRotation.setFromEuler(lookEuler);camera.quaternion.copy(baseRotation);camera.updateMatrixWorld(true);
  }
  function restoreStanding(){const wasActive=active;active=false;entering=false;drawMode=false;ui.style.cursor='';drawing=false;last=null;ui.hidden=true;ink.visible=false;document.body.classList.remove('is-stargazing');
    if(!wasActive)return;
    avatar.setFirstPerson(false);restore(playerRig,saved.player);if(canMovePartner()){restore(companion.anchor,saved.partner);companion.anchor.visible=saved.partnerVisible;}restore(avatar.root,saved.avatar);avatar.root.visible=saved.visible;saved.parent.add(camera);restore(camera,saved.camera);Object.keys(keys).forEach(k=>keys[k]=false);
  }
  async function leave({immediate=false}={}){
    if(immediate){++transitionId;fadeAnimation?.cancel();fadeAnimation=null;restoreStanding();leaving=false;onLeave();return;}
    if(leaving||(!active&&!entering))return;
    leaving=true;entering=false;const id=++transitionId;
    const opacity=Number.parseFloat(getComputedStyle(blackout).opacity)||0;
    fadeAnimation?.cancel();finish();drawMode=false;
    Object.keys(keys).forEach(k=>keys[k]=false);
    fadeAnimation=blackout.animate([{opacity},{opacity:1}],{duration:350,fill:'forwards',easing:'ease-in-out'});
    try{await fadeAnimation.finished;}catch{return;}
    if(id!==transitionId)return;
    restoreStanding();fadeAnimation.cancel();
    fadeAnimation=blackout.animate([{opacity:1},{opacity:0}],{duration:550,fill:'forwards',easing:'ease-in-out'});
    try{await fadeAnimation.finished;}catch{return;}
    if(id===transitionId){leaving=false;fadeAnimation.cancel();fadeAnimation=null;onLeave();}
  }
  // World-space eye, so his camera (inside his rig) draws in the same sky as hers.
  const eye=new THREE.Vector3();
  // Both cameras draw onto the same bounded world-space canvas overhead.
  function point(e){
    camera.getWorldPosition(eye);
    const ray=new THREE.Vector3(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2,.5).unproject(camera).sub(eye).normalize();
    if(ray.y<=.05)return null;
    const distance=(100-eye.y)/ray.y,x=eye.x+ray.x*distance,z=eye.z+ray.z*distance;
    if(distance<=0||Math.abs(x)>75||Math.abs(z+35)>65)return null;
    return new THREE.Vector3(x,100,z);
  }
  function startDrawing(){
    if(!canDraw()||drawMode)return;
    const from=viewer?getViewerLook():{yaw,pitch};
    camera.getWorldPosition(eye);
    const dx=-eye.x,dy=100-eye.y,dz=-35-eye.z,length=Math.hypot(dx,dy,dz);
    yaw=Math.atan2(-dx,dy);pitch=Math.acos(Math.max(-1,Math.min(1,-dz/length)));
    drawPan={from,to:{yaw,pitch},age:0};
    if(reducedMotion.matches){
      if(viewer)onFocusDrawing(yaw,pitch);else{lookEuler.set(pitch,0,yaw);baseRotation.setFromEuler(lookEuler);camera.quaternion.copy(baseRotation);}
      drawPan=null;
    }else{yaw=from.yaw;pitch=from.pitch;}
      drawMode=true;cursorTarget().style.cursor=`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><radialGradient id="glow"><stop stop-color="#fff3d6" stop-opacity=".65"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></radialGradient></defs><circle cx="16" cy="16" r="9" fill="url(#glow)"/><circle cx="16" cy="16" r="2.5" fill="#fff8e8"/></svg>')}") 16 16, default`;
      camera.updateMatrixWorld(true);
      if(document.pointerLockElement)document.exitPointerLock();

  }
  function toggleDrawing(){if(!canDraw())return false;if(drawMode)stopDrawing();else startDrawing();return true;}
  window.addEventListener('contextmenu',e=>{if(canDraw()&&drawMode)e.preventDefault();});
  window.addEventListener('mousedown',e=>{
    if(canDraw()&&drawMode&&e.button===2){e.preventDefault();finish();return;}
    if(canDraw()&&!drawMode&&active&&e.button===0){lock();return;}
    if(!canDraw()||!gameCanDraw||!drawMode||drawPan||e.button!==0)return;e.preventDefault();
    if(document.pointerLockElement)return;
    drawing=true;strokeStart=count;pen.clientX=e.clientX;pen.clientY=e.clientY;last=point(pen);lastBirth=sparkleTime.value;
    touchInk();
  });
  window.addEventListener('mousemove',e=>{
    if((!active||leaving)&&!viewer)return;
    if(drawPan)return;
    if(drawing&&!(e.buttons&1))finish();
    if(!drawMode&&viewer)return;
    if(!drawMode&&document.pointerLockElement!==ui)return;
    if(!drawMode||(e.buttons&2)){
      const next=slideGaze(yaw-e.movementX*.0022,pitch-e.movementY*.002,pitch);yaw=next.yaw;pitch=next.pitch;
      if(drawMode){
        if(viewer)onFocusDrawing(yaw,pitch);
        else{lookEuler.set(pitch,0,yaw);baseRotation.setFromEuler(lookEuler);}
      }
      return;
    }
    if(!reducedMotion.matches&&sparkleTime.value-trailAt>.025){
      trailAt=sparkleTime.value;const dot=cursorTrail[trailIndex++%cursorTrail.length];
      dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px';
      dot.getAnimations?.().forEach(animation=>animation.cancel());
      dot.animate?.([{opacity:.65,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(.15)'}],{duration:320});
    }
    if(!drawing)return;
    pen.clientX=e.clientX;pen.clientY=e.clientY;
    const p=point(pen);
    if(!p){last=null;return;}
    if(!last){last=p;lastBirth=sparkleTime.value;return;}
    if(p.distanceTo(last)<.3||count+2>max)return;
    touchInk();ink.visible=true;
    // Send the same segments we render, rather than dropping most of them
    // between network sends and leaving gaps in the other player's drawing.
    onInk([...last.toArray(),...p.toArray()]);
    last.toArray(positions,count*3);p.toArray(positions,(count+1)*3);inkBirth[count]=lastBirth;inkBirth[count+1]=sparkleTime.value;geo.attributes.inkBirth.needsUpdate=true;count+=2;sprinkle(last,p);last=p;lastBirth=sparkleTime.value;
    geo.attributes.position.needsUpdate=true;geo.setDrawRange(0,count);geo.computeBoundingSphere();
  });
  function stopDrawing(){
    if(!drawMode)return false;finish();drawPan=null;drawMode=false;cursorTrail.forEach(dot=>dot.getAnimations?.().forEach(a=>a.cancel()));ui.style.cursor='';document.body.style.cursor='';
    // Reclaim the mouse for looking around after drawing.
    if(viewer)onViewerStop();else if(active)lock();
    return true;
  }
  function finish(){if(drawing&&count>strokeStart){
    strokes.push({start:strokeStart,end:count});
  }drawing=false;last=null;}
  window.addEventListener('mouseup',finish);window.addEventListener('pointercancel',finish);window.addEventListener('blur',finish);
  document.addEventListener('pointerlockchange',()=>{
    if(document.pointerLockElement===ui){hasGazeLock=true;return;}
    if(hasGazeLock){hasGazeLock=false;finish();if((active||entering)&&!drawMode&&!document.body.classList.contains('is-scene-context'))leave();}
  });
  for(const site of sites)interactive.push({object:site.spot,reach:4.5,available:()=>canStart(),prompt:'lie down together · stargaze',action:()=>enter(site)});
  ink.visible=false;
  return {receiveInk(points){
    // Points arrive as batches of segments (six numbers per segment).
    const n=points.length/3;
    if(!n||count+n>max)return;
    touchInk();
    positions.set(points,count*3);inkBirth.fill(sparkleTime.value,count,count+n);count+=n;
    geo.attributes.position.needsUpdate=true;geo.attributes.inkBirth.needsUpdate=true;geo.setDrawRange(0,count);geo.computeBoundingSphere();ink.visible=true;
  },
  setViewer(on){if(viewer===on)return;viewer=on;if(on)ink.visible=true;else{finish();drawMode=false;document.body.style.cursor='';}},
  // Esc from his drawing returns to looking around; true when it was handled.
  exitViewerDrawing(){return viewer&&stopDrawing();},
  toggleDrawing,startDrawing,stopDrawing,
  setGame(on,canDraw){gameActive=on;gameCanDraw=canDraw;if(!canDraw)finish();},
  clearInk(){finish();clearDust();count=0;fadingCount=0;fadeStart=null;eraseTime.value=-100;fadeLimit.value=1e9;strokes.length=0;geo.setDrawRange(0,0);},
  // Her look while lying down, sent with her pose so he sees her head move.
  get look(){return {yaw,pitch};},
  get drawMode(){return drawMode;},get active(){return active||entering||leaving;},enter,leave,update(time){
    sparkleTime.value=time;const dt=Math.min(.05,Math.max(0,time-previousTime));previousTime=time;
    if(drawPan){
      drawPan.age+=dt;const t=reducedMotion.matches?1:Math.min(1,drawPan.age/1.1),ease=t*t*(3-2*t);
      const delta=Math.atan2(Math.sin(drawPan.to.yaw-drawPan.from.yaw),Math.cos(drawPan.to.yaw-drawPan.from.yaw));
      yaw=drawPan.from.yaw+delta*ease;pitch=drawPan.from.pitch+(drawPan.to.pitch-drawPan.from.pitch)*ease;
      if(viewer)onFocusDrawing(yaw,pitch);else{lookEuler.set(pitch,0,yaw);baseRotation.setFromEuler(lookEuler);}
      if(t===1)drawPan=null;
    }
    inkMotion.value=reducedMotion.matches?0:1;
    // Keep the whole phrase through pauses between letters. After three quiet
    // seconds, replay its birth order as an erasing wave lasting 2–5 seconds.
    if(count&&!gameActive&&(fadeStart!==null||time-lastInkActivity>3)){
      if(fadeStart===null){
        fadeStart=lastInkActivity+3;fadeFirst=inkBirth[0];fadingCount=count;fadeLimit.value=inkBirth[count-1];
        const duration=Math.max(.01,inkBirth[count-1]-fadeFirst);
        fadeRate=duration/Math.min(4,Math.max(1,duration*.35));
        eraseSpan.value=fadeRate*1.2;
      }
      eraseTime.value=fadeFirst+(time-fadeStart)*fadeRate;
    }
    let removed=0;
    while(removed+1<fadingCount&&eraseTime.value>=inkBirth[removed+1]+eraseSpan.value)removed+=2;
    if(removed){
      positions.copyWithin(0,removed*3,count*3);inkBirth.copyWithin(0,removed,count);count-=removed;
      while(strokes.length&&strokes[0].end<=removed)strokes.shift();
      for(const stroke of strokes){stroke.start=Math.max(0,stroke.start-removed);stroke.end-=removed;}
      strokeStart=Math.max(0,strokeStart-removed);
      fadingCount-=removed;
      if(fadingCount===0){fadeStart=null;eraseTime.value=-100;fadeLimit.value=1e9;}
      geo.attributes.position.needsUpdate=true;geo.attributes.inkBirth.needsUpdate=true;geo.setDrawRange(0,count);geo.computeBoundingSphere();
    }
    seeDrawing.hidden=!canDraw()||!remotePending||count===0;
    // Leave time to notice the invitation before the shared writing fades.
    if(remotePending&&time-remoteAt<8&&count)touchInk();
    drawHint.hidden=!canDraw();
    drawHint.innerHTML=drawMode?(gameCanDraw?'Drag to draw · right-drag to look · <b>D</b> to stop · <b>P</b> Pictionary':'Guess in Pictionary · <b>P</b> open · <b>Esc</b> look around'):'Press <b>D</b> to draw · <b>P</b> Pictionary';
    // His view (viewer) keeps the sky ink visible even before anything is drawn.
    if(!active&&!viewer&&count===0)ink.visible=false;
    if(!active||leaving)return;
    lookEuler.set(pitch,0,yaw);target.setFromEuler(lookEuler);
    if(!drawMode)baseRotation.slerp(target,1-Math.exp(-dt*12));
    camera.position.copy(basePosition);camera.quaternion.copy(baseRotation);
    if(!reducedMotion.matches){
      swayEuler.set(Math.sin(time*1.10)*.011+Math.sin(time*2.13)*.0006,Math.sin(time*.78)*.009,Math.sin(time*.58)*.0035);
      sway.setFromEuler(swayEuler);camera.quaternion.multiply(sway);camera.position.y+=Math.sin(time*1.15)*.012;
    }
    camera.updateMatrixWorld(true);
  },keyDown(e){if(leaving){e.preventDefault();return true;}if(!active&&!entering)return false;
    if(entering){if(e.code==='Escape'||e.code==='KeyQ'){e.preventDefault();leave();}return true;}
    if(!gameActive&&e.code==='KeyZ'&&(e.ctrlKey||e.metaKey)){e.preventDefault();finish();if(strokes.length){clearDust();count=strokes.pop().start;geo.setDrawRange(0,count);}}
    if(!gameActive&&e.code==='KeyC'&&!e.repeat){finish();clearDust();count=0;strokes.length=0;geo.setDrawRange(0,0);}
    if(e.code==='KeyD'){e.preventDefault();if(!e.repeat)toggleDrawing();return true;}
    if(e.code==='Escape'&&drawMode){e.preventDefault();stopDrawing();return true;}
    if(e.code==='KeyQ'||e.code==='Escape'){e.preventDefault();leave();}return true;
  }};
}
