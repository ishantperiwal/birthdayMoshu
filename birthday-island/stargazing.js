import * as THREE from 'three';

export const STARGAZING_SPOTS=[{x:-12,z:12}];

export function buildStargazing({scene,camera,playerRig,avatar,companion,terrainHeight,interactive,setMood,keys,glowTexture,networkMode=false,male=false,canMovePartner=()=>true,onInk=()=>{}}){
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
  ui.setAttribute('aria-label','Stargazing: move mouse to look, hold left mouse to draw, Q to get up');
  document.body.append(ui);
  const max=12000,positions=new Float32Array(max*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setDrawRange(0,0);
  const ink=new THREE.Group();scene.add(ink);
  const inkBirth=new Float32Array(max);geo.setAttribute('inkBirth',new THREE.BufferAttribute(inkBirth,1));
  const sparkleTime={value:0};
  ink.add(new THREE.LineSegments(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:sparkleTime},vertexShader:`attribute float inkBirth;uniform float uTime;varying float vFade;
      void main(){vFade=1.0-smoothstep(.85,1.40,uTime-inkBirth);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying float vFade;void main(){gl_FragColor=vec4(1.0,.88,.67,.65*vFade);}`})));
  // Both the settled ink and fresh dust have four-point glints, not stretched halos.
  const glintFragment=`varying float vAlpha; varying vec3 vTint;
    void main(){vec2 p=gl_PointCoord*2.0-1.0;float r=length(p);
    float core=exp(-28.0*r*r),halo=.18*exp(-5.0*r*r);
    float rays=.55*(exp(-p.x*p.x*95.0-p.y*p.y*5.0)+exp(-p.y*p.y*95.0-p.x*p.x*5.0));
    gl_FragColor=vec4(vTint,(core+halo+rays)*(1.0-smoothstep(.75,1.0,r))*vAlpha);}`;
  const sparkMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:sparkleTime},
    vertexShader:`attribute float inkBirth;uniform float uTime; varying float vAlpha; varying vec3 vTint;
      void main(){float seed=position.x*8.0+position.z*11.0;
      vAlpha=.56+.14*sin(uTime*.85+seed);vAlpha*=smoothstep(0.0,.18,uTime-inkBirth);vAlpha*=1.0-smoothstep(.85,1.40,uTime-inkBirth);vTint=vec3(1.0,.87,.64);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=9.0+vAlpha*5.0;}`,
    fragmentShader:glintFragment});
  ink.add(new THREE.Points(geo,sparkMat));
  const dustMax=3000,dustPositions=new Float32Array(dustMax*3),births=new Float32Array(dustMax).fill(-100);
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));dustGeo.setAttribute('birth',new THREE.BufferAttribute(births,1));
  const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:sparkleTime},
    vertexShader:`attribute float birth;uniform float uTime;varying float vAlpha;varying vec3 vTint;
      void main(){float age=uTime-birth;float seed=position.x*19.0+position.z*3.0;
      vAlpha=smoothstep(0.0,.20,age)*(1.0-smoothstep(.45,1.4,age))*(.56+.12*sin(age*1.2+seed));
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
  let lastInkSent=0;
  let previousTime=0,yaw=0,pitch=1.22,hasGazeLock=false;
  const basePosition=new THREE.Vector3(),baseRotation=new THREE.Quaternion(),target=new THREE.Quaternion();
  const lookEuler=new THREE.Euler(0,0,0,'YXZ'),sway=new THREE.Quaternion(),swayEuler=new THREE.Euler();
  const pen={clientX:0,clientY:0};
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function remember(o){return {position:o.position.clone(),rotation:o.rotation.clone(),up:o.up.clone(),scale:o.scale.clone()};}
  function restore(o,s){o.position.copy(s.position);o.rotation.copy(s.rotation);o.up.copy(s.up);o.scale.copy(s.scale);}
  function lock(){ui.requestPointerLock?.()?.catch(()=>{});}
  function enter(site){
    if(active||companion.throwing)return;
    site??=sites.reduce((nearest,candidate)=>candidate.spot.position.distanceToSquared(playerRig.position)<nearest.spot.position.distanceToSquared(playerRig.position)?candidate:nearest);
    const {x,z,ground}=site;
    const side=male?-1:1;
    active=true;saved={player:remember(playerRig),partner:remember(companion.anchor),avatar:remember(avatar.root),visible:avatar.root.visible,camera:remember(camera),parent:camera.parent,partnerVisible:companion.anchor.visible};
    if(companion.holding)companion.toggleHolding();
    Object.keys(keys).forEach(k=>keys[k]=false);setMood('night');
    avatar.update(0,false,false);scene.attach(camera);
    avatar.root.scale.setScalar(companion.bodyScale);
    playerRig.position.set(x+side*.62,ground+.27,z-.65);playerRig.rotation.set(Math.PI/2,0,0);avatar.root.rotation.set(0,0,0);avatar.root.visible=true;
    if(canMovePartner()){companion.anchor.position.set(x-.62,ground+.27,z-.65);companion.anchor.rotation.set(Math.PI/2,0,0);}
    ui.hidden=false;document.body.classList.add('is-stargazing');
    if(canMovePartner())companion.anchor.visible=true;avatar.setFirstPerson(true);ink.visible=true;yaw=0;pitch=1.22;
    basePosition.set(x+side*.62,ground+.62,z+1.05);camera.position.copy(basePosition);
    lookEuler.set(pitch,yaw,0);baseRotation.setFromEuler(lookEuler);camera.quaternion.copy(baseRotation);camera.updateMatrixWorld(true);lock();
  }
  function leave(){if(!active)return;active=false;if(document.pointerLockElement===ui)document.exitPointerLock();drawing=false;last=null;ui.hidden=true;ink.visible=false;document.body.classList.remove('is-stargazing');
    avatar.setFirstPerson(false);restore(playerRig,saved.player);if(canMovePartner()){restore(companion.anchor,saved.partner);companion.anchor.visible=saved.partnerVisible;}restore(avatar.root,saved.avatar);avatar.root.visible=saved.visible;saved.parent.add(camera);restore(camera,saved.camera);Object.keys(keys).forEach(k=>keys[k]=false);
  }
  function point(e){return new THREE.Vector3(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2,.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(120).add(camera.position);}
  window.addEventListener('mousedown',e=>{
    if(!active||e.button!==0)return;e.preventDefault();
    if(document.pointerLockElement!==ui)lock();
    drawing=true;strokeStart=count;pen.clientX=document.pointerLockElement===ui?innerWidth/2:e.clientX;pen.clientY=document.pointerLockElement===ui?innerHeight/2:e.clientY;last=point(pen);lastBirth=sparkleTime.value;
  });
  window.addEventListener('mousemove',e=>{
    if(!active)return;
    if(drawing&&!(e.buttons&1))finish();
    if(!drawing){yaw=THREE.MathUtils.clamp(yaw-e.movementX*.0022,-1.3,1.3);pitch=THREE.MathUtils.clamp(pitch-e.movementY*.002,.12,1.40);return;}
    if(document.pointerLockElement===ui){
      pen.clientX=THREE.MathUtils.clamp(pen.clientX+e.movementX,0,innerWidth);
      pen.clientY=THREE.MathUtils.clamp(pen.clientY+e.movementY,0,innerHeight);
    }else{pen.clientX=e.clientX;pen.clientY=e.clientY;}
    const p=point(pen);if(p.distanceTo(last)<.3||count+2>max)return;
    if(performance.now()-lastInkSent>100){onInk([...last.toArray(),...p.toArray()]);lastInkSent=performance.now();}
    last.toArray(positions,count*3);p.toArray(positions,(count+1)*3);inkBirth[count]=lastBirth;inkBirth[count+1]=sparkleTime.value;geo.attributes.inkBirth.needsUpdate=true;count+=2;sprinkle(last,p);last=p;lastBirth=sparkleTime.value;
    geo.attributes.position.needsUpdate=true;geo.setDrawRange(0,count);geo.computeBoundingSphere();
  });
  function finish(){if(drawing&&count>strokeStart){
    strokes.push({start:strokeStart,end:count});
  }drawing=false;last=null;}
  window.addEventListener('mouseup',finish);window.addEventListener('pointercancel',finish);window.addEventListener('blur',finish);
  document.addEventListener('pointerlockchange',()=>{
    if(document.pointerLockElement===ui){hasGazeLock=true;return;}
    if(hasGazeLock){hasGazeLock=false;finish();if(active&&!document.body.classList.contains('is-scene-context'))leave();}
  });
  for(const site of sites)interactive.push({object:site.spot,reach:4.5,prompt:'lie down together · stargaze',action:()=>enter(site)});
  ink.visible=false;
  return {receiveInk(points){
    if(count+2>max)return;
    positions.set(points,count*3);inkBirth[count]=inkBirth[count+1]=sparkleTime.value;count+=2;
    geo.attributes.position.needsUpdate=true;geo.attributes.inkBirth.needsUpdate=true;geo.setDrawRange(0,count);geo.computeBoundingSphere();ink.visible=true;
  },get active(){return active;},enter,leave,update(time){
    sparkleTime.value=time;const dt=Math.min(.05,Math.max(0,time-previousTime));previousTime=time;
    // Each segment keeps its drawing time, even during a held stroke.
    // Reclaim only fully faded segments so long continuous drawing can keep going.
    let removed=0;
    while(removed+1<count&&time-inkBirth[removed+1]>=1.40)removed+=2;
    if(removed){
      positions.copyWithin(0,removed*3,count*3);inkBirth.copyWithin(0,removed,count);count-=removed;
      while(strokes.length&&strokes[0].end<=removed)strokes.shift();
      for(const stroke of strokes){stroke.start=Math.max(0,stroke.start-removed);stroke.end-=removed;}
      strokeStart=Math.max(0,strokeStart-removed);
      geo.attributes.position.needsUpdate=true;geo.attributes.inkBirth.needsUpdate=true;geo.setDrawRange(0,count);geo.computeBoundingSphere();
    }
    if(!active&&count===0)ink.visible=false;
    if(!active||drawing)return;
    lookEuler.set(pitch,yaw,0);target.setFromEuler(lookEuler);
    baseRotation.slerp(target,1-Math.exp(-dt*12));camera.position.copy(basePosition);camera.quaternion.copy(baseRotation);
    if(!reducedMotion.matches){
      swayEuler.set(Math.sin(time*1.10)*.011+Math.sin(time*2.13)*.0006,Math.sin(time*.78)*.009,Math.sin(time*.58)*.0035);
      sway.setFromEuler(swayEuler);camera.quaternion.multiply(sway);camera.position.y+=Math.sin(time*1.15)*.012;
    }
    camera.updateMatrixWorld(true);
  },keyDown(e){if(!active)return false;
    if(e.code==='KeyZ'&&(e.ctrlKey||e.metaKey)){e.preventDefault();finish();if(strokes.length){clearDust();count=strokes.pop().start;geo.setDrawRange(0,count);}}
    if(e.code==='KeyC'&&!e.repeat){finish();clearDust();count=0;strokes.length=0;geo.setDrawRange(0,0);}
    if(e.code==='KeyQ'||e.code==='Escape'){e.preventDefault();leave();}return true;
  }};
}
