import * as THREE from 'three';

// A quiet stone hearth and a silent radio, ready for a local track later.
export function buildFireside({scene,terrainHeight,x,z,musicUrl=''}) {
  const root=new THREE.Group();root.position.set(x,terrainHeight(x,z),z);scene.add(root);
  const material=color=>new THREE.MeshStandardMaterial({color,roughness:.95});
  const wood=material(0x604637),cream=material(0xdbc49a),dark=material(0x383b37);
  const mesh=(geometry,mat,px,py,pz)=>{const m=new THREE.Mesh(geometry,mat);m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;};
  const box=(w,h,d,mat,px,py,pz)=>mesh(new THREE.BoxGeometry(w,h,d),mat,px,py,pz);
  const hearthStones=[0x827d70,0x908779,0x77796f].map(color=>
    new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));
  for(let i=0;i<11;i++){
    const a=i*Math.PI*2/11,r=.86+.035*Math.sin(i*7);
    const m=mesh(new THREE.DodecahedronGeometry(.26,0),hearthStones[i%3],Math.cos(a)*r,.17,Math.sin(a)*r);
    m.scale.set(1.08+.09*Math.sin(i*3),.76+.08*Math.cos(i*2),.88);m.rotation.set(.1*i,a,.1);
  }
  mesh(new THREE.CylinderGeometry(.72,.72,.035,24),dark,0,.02,0);
  for(let i=0;i<3;i++){
    const log=mesh(new THREE.CylinderGeometry(.11,.14,1.12,9),wood,0,.19+i*.055,0);
    log.rotation.set(Math.PI/2,0,i*2.1);
  }
  const fireMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{time:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float time;void main(){
      float h=vUv.y;float sway=sin(h*7.-time*2.8)*.075*h+sin(h*13.-time*3.7)*.025*h;
      float width=mix(.39,.015,pow(h,.72));
      float edge=abs(vUv.x-.5-sway)/width;
      float alpha=(1.-smoothstep(.45,1.,edge))*smoothstep(0.,.12,h)*(1.-smoothstep(.73,1.,h));
      vec3 col=mix(vec3(1.,.77,.30),vec3(1.,.22,.045),smoothstep(.05,.85,h));
      gl_FragColor=vec4(col*1.5,alpha*.85);
    }`});
  for(let i=0;i<3;i++){
    const flame=mesh(new THREE.PlaneGeometry(.72,1.1),fireMat,Math.sin(i*2.1)*.15,.69,Math.cos(i*2.1)*.15);
    flame.rotation.y=i*Math.PI/3;flame.castShadow=false;
  }
  const light=new THREE.PointLight(0xffb660,3.8,8.5,2);light.position.set(0,1.0,0);root.add(light);
  // Two open, inward-facing plank benches leave the radio side approachable.
  const seatWood=material(0x84634a);
  for(const [bx,bz,angle] of [[-.15,2.6,-.07],[-2.6,-.2,-Math.PI/2-.09]]){
    const bench=new THREE.Group();bench.position.set(bx,terrainHeight(x+bx,z+bz)-root.position.y,bz);
    bench.rotation.y=angle;root.add(bench);
    const part=(w,h,d,mat,px,py,pz)=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
      m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;bench.add(m);
    };
    for(const pz of [-.17,0,.17])part(1.8,.10,.15,seatWood,0,.48,pz);
    for(const px of [-.66,.66]){
      part(.13,.46,.40,wood,px,.23,0);
      part(.11,.75,.10,wood,px,.57,.22);
    }
    part(1.8,.18,.08,seatWood,0,.84,.24);
    part(1.4,.08,.08,wood,0,.22,0);
  }
  // A sawn stump set back from the hearth, with bark furrows and end-grain rings.
  const stumpX=2.25,stumpZ=.95,stumpHeight=.60;
  const stumpY=terrainHeight(x+stumpX,z+stumpZ)-root.position.y;
  const barkCanvas=document.createElement('canvas');barkCanvas.width=barkCanvas.height=512;
  const barkCtx=barkCanvas.getContext('2d');barkCtx.fillStyle='#725039';barkCtx.fillRect(0,0,512,512);
  for(let i=0;i<38;i++){
    const sx=i*512/38;barkCtx.beginPath();
    for(let j=0;j<=16;j++){
      const yy=j*32,xx=sx+3*Math.sin(j*.55+i*1.7)+2*Math.sin(j*.91+i);
      if(j===0)barkCtx.moveTo(xx,yy);else barkCtx.lineTo(xx,yy);
    }
    barkCtx.strokeStyle=i%3===0?'#493325':'#926749';barkCtx.lineWidth=i%3===0?4:7;barkCtx.stroke();
  }
  const cutCanvas=document.createElement('canvas');cutCanvas.width=cutCanvas.height=512;
  const cutCtx=cutCanvas.getContext('2d');cutCtx.fillStyle='#765037';cutCtx.fillRect(0,0,512,512);
  cutCtx.beginPath();cutCtx.arc(256,256,238,0,Math.PI*2);cutCtx.fillStyle='#c89c66';cutCtx.fill();
  for(let i=1;i<=8;i++){
    cutCtx.beginPath();
    for(let j=0;j<=100;j++){
      const a=j/100*Math.PI*2,r=i*26+3*Math.sin(a*3+i*.6)+2*Math.sin(a*7);
      const xx=245+Math.cos(a)*r,yy=261+Math.sin(a)*r*.96;
      if(j===0)cutCtx.moveTo(xx,yy);else cutCtx.lineTo(xx,yy);
    }
    cutCtx.strokeStyle=i%2?'#ac7f50':'#b58a57';cutCtx.lineWidth=i%2?2.5:4;cutCtx.stroke();
  }
  for(const a of [.3,2.7,4.5]){
    cutCtx.beginPath();cutCtx.moveTo(256+Math.cos(a)*237,256+Math.sin(a)*237);
    cutCtx.lineTo(256+Math.cos(a+.03)*198,256+Math.sin(a+.03)*198);
    cutCtx.lineTo(256+Math.cos(a-.02)*179,256+Math.sin(a-.02)*179);
    cutCtx.strokeStyle='#795438';cutCtx.lineWidth=2.5;cutCtx.stroke();
  }
  const woodTexture=canvas=>{const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;};
  const barkMat=new THREE.MeshStandardMaterial({map:woodTexture(barkCanvas),roughness:1,flatShading:true});
  const cutMat=new THREE.MeshStandardMaterial({map:woodTexture(cutCanvas),roughness:.95});
  // One continuous bark surface: low root flares grow out of the trunk's base.
  // Keeping the cylinder UVs makes the same grain run from trunk into each root.
  const stumpGeometry=new THREE.CylinderGeometry(.54,.61,stumpHeight+.04,96,16);
  const vertices=stumpGeometry.attributes.position;
  const rootAngles=[.2,1.25,2.35,3.5,4.65,5.55];
  for(let i=0;i<vertices.count;i++){
    const px=vertices.getX(i),py=vertices.getY(i),pz=vertices.getZ(i),radius=Math.hypot(px,pz);
    const a=Math.atan2(px,pz),t=(py+(stumpHeight+.04)/2)/(stumpHeight+.04);
    const ripple=1+.035*Math.sin(a*5)+.025*Math.sin(a*9+.4);
    let flare=0;
    for(let j=0;j<rootAngles.length;j++){
      const delta=Math.atan2(Math.sin(a-rootAngles[j]),Math.cos(a-rootAngles[j]));
      flare+=(.34+.06*Math.sin(j*2.7))*Math.exp(-delta*delta/.025);
    }
    const expanded=radius*ripple+flare*Math.pow(1-t,4);
    const nx=radius>.001?px/radius*expanded:0,nz=radius>.001?pz/radius*expanded:0;
    const ground=terrainHeight(x+stumpX+nx,z+stumpZ+nz)-root.position.y;
    vertices.setXYZ(i,nx,py+(ground-stumpY)*Math.pow(1-t,3)-.045*Math.pow(1-t,2),nz);
  }
  stumpGeometry.computeVertexNormals();
  mesh(stumpGeometry,[barkMat,cutMat,barkMat],stumpX,stumpY+stumpHeight/2-.045,stumpZ);
  // Small, uneven tufts break up the root/sand seam without hiding the roots.
  const bladePositions=[],bladeColors=[];
  const greens=[0x526443,0x65764b,0x758451].map(c=>new THREE.Color(c));
  let grassSeed=7319;
  const grassRandom=()=>{grassSeed=(Math.imul(grassSeed,1664525)+1013904223)>>>0;return grassSeed/4294967296;};
  const tuftSites=[[.48,.79],[1.62,.83],[2.93,.80],[4.10,.85],[5.55,.78]];
  for(const [index,[angle,radius]] of tuftSites.entries()){
    const tx=stumpX+Math.sin(angle)*radius,tz=stumpZ+Math.cos(angle)*radius;
    const bladeCount=7+Math.floor(grassRandom()*5),leanDirection=grassRandom()*Math.PI*2;
    const bx=tx,bz=tz,by=terrainHeight(x+bx,z+bz)-root.position.y-.018;
    for(let j=0;j<bladeCount;j++){
      // Every blade shares a planted origin, with an irregular, gently leaning crown.
      const a=leanDirection+(grassRandom()-.5)*2.7;
      const height=.085+grassRandom()*.115,width=.004+grassRandom()*.003;
      const dx=Math.cos(a),dz=Math.sin(a),lean=.012+grassRandom()*.046;
      const color=greens[Math.floor(grassRandom()*greens.length)];
      const edge=(t,side)=>[bx+dx*lean*t*t-dz*width*(1-t)*side,by+height*t,bz+dz*lean*t*t+dx*width*(1-t)*side];
      for(let segment=0;segment<4;segment++){
        const t=segment/4,n=(segment+1)/4;
        const points=[edge(t,-1),edge(t,1),edge(n,-1),edge(t,1),edge(n,1),edge(n,-1)];
        for(const point of points){bladePositions.push(...point);bladeColors.push(color.r,color.g,color.b);}
      }
    }
  }
  const blades=new THREE.BufferGeometry();blades.setAttribute('position',new THREE.Float32BufferAttribute(bladePositions,3));
  blades.setAttribute('color',new THREE.Float32BufferAttribute(bladeColors,3));blades.computeVertexNormals();
  mesh(blades,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}),0,0,0);
  const petalMat=material(0xe4d7af),pollenMat=material(0xc8a45a),stemMat=material(0x536543);
  for(const [i,a] of [1.65,4.12,4.35].entries()){
    const radius=.84+(i===2?.10:0),fx=stumpX+Math.sin(a)*radius,fz=stumpZ+Math.cos(a)*radius;
    const ground=terrainHeight(x+fx,z+fz)-root.position.y,height=.14+i*.025;
    mesh(new THREE.CylinderGeometry(.004,.005,height,5),stemMat,fx,ground+height/2,fz);
    for(let j=0;j<5;j++){
      const angle=j*Math.PI*2/5;
      const petal=mesh(new THREE.SphereGeometry(.019,6,4),petalMat,fx+Math.sin(angle)*.022,ground+height,fz+Math.cos(angle)*.022);
      petal.scale.set(1,.35,1);
    }
    mesh(new THREE.SphereGeometry(.012,6,4),pollenMat,fx,ground+height+.004,fz);
  }
  const radio=new THREE.Group();radio.position.set(stumpX,stumpY+stumpHeight,stumpZ);
  radio.rotation.y=Math.atan2(-1.375-stumpX,1.2-stumpZ);root.add(radio);
  const radioPart=(w,h,d,mat,px,py,pz)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;radio.add(m);return m;};
  for(const px of [-.24,.24])for(const pz of [-.085,.085])radioPart(.05,.025,.05,dark,px,-.0125,pz);
  radioPart(.64,.40,.25,wood,0,.2,0);
  radioPart(.58,.32,.018,cream,0,.2,.132);
  for(let i=0;i<7;i++)radioPart(.25,.012,.008,dark,-.12,.09+i*.033,.147);
  radioPart(.16,.055,.009,dark,.17,.29,.148);
  const dial=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.023,16),cream);dial.rotation.x=Math.PI/2;dial.position.set(.17,.14,.16);radio.add(dial);
  for(const px of [-.2,.2])radioPart(.025,.12,.025,dark,px,.45,0);
  radioPart(.425,.025,.025,dark,0,.51,0);
  // A small swivel mount and stepped telescopic aerial behind the handle.
  const antennaMetal=new THREE.MeshStandardMaterial({color:0xb9c4c7,metalness:.65,roughness:.3});
  const antenna=new THREE.Group();antenna.position.set(.26,.41,-.085);
  antenna.rotation.z=-.23;antenna.rotation.x=-.09;radio.add(antenna);
  const aerialPart=(geometry,mat,y)=>{
    const part=new THREE.Mesh(geometry,mat);part.position.y=y;
    part.castShadow=true;antenna.add(part);return part;
  };
  aerialPart(new THREE.SphereGeometry(.028,12,8),dark,0);
  aerialPart(new THREE.CylinderGeometry(.012,.015,.20,10),antennaMetal,.105);
  aerialPart(new THREE.CylinderGeometry(.008,.011,.23,10),antennaMetal,.315);
  aerialPart(new THREE.CylinderGeometry(.005,.007,.20,10),antennaMetal,.525);
  for(const y of [.205,.425])aerialPart(new THREE.CylinderGeometry(.014,.014,.018,10),antennaMetal,y);
  aerialPart(new THREE.SphereGeometry(.011,10,6),antennaMetal,.628);

  // Six softly feathered puffs, reused forever, with a faint windward drift.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,31);
  gradient.addColorStop(0,'rgba(255,255,255,.65)');gradient.addColorStop(.45,'rgba(255,255,255,.30)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const smokeTexture=new THREE.CanvasTexture(canvas),smoke=[];
  for(let i=0;i<6;i++){
    const mat=new THREE.SpriteMaterial({map:smokeTexture,color:0xaaa69f,transparent:true,depthWrite:false,opacity:0});
    const puff=new THREE.Sprite(mat);root.add(puff);smoke.push(puff);
  }
  const audio=musicUrl?new Audio(musicUrl):null;if(audio)audio.loop=true;
  return {root,radio,audio,stumpBase:new THREE.Vector3(x+stumpX,root.position.y+stumpY,z+stumpZ),update(time,night){fireMat.uniforms.time.value=time;light.intensity=(1.6+night*2.7)*(1+.06*Math.sin(time*5)+.035*Math.sin(time*8.3));
    smoke.forEach((puff,i)=>{
      const age=(time+i*1.15)%6.9,t=age/6.9;
      puff.position.set(.10+age*.09+Math.sin(age*1.1+i)*.06,1.0+age*.35,-age*.035+Math.cos(age*.8+i)*.055);
      puff.scale.setScalar(.38+age*.16);
      puff.material.opacity=.095*Math.sin(t*Math.PI)**2;
      puff.material.rotation=i*1.7+age*.06;
    });}};
}
