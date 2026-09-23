import * as THREE from 'three';
const money=value=>'₹'+Math.round(value).toLocaleString('en-IN');
export function buildCashRewards(totalPackages){
  const card=document.querySelector('.treasure-card'),value=document.querySelector('#gift-value'),count=document.querySelector('#gift-count');
  const progress=document.querySelector('#cash-progress'),gain=document.querySelector('#cash-gain'),icon=card.querySelector('.cash-icon');
  const layer=document.createElement('div');layer.className='cash-flight-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);
  const status=document.createElement('div');status.className='cash-sr-only';status.setAttribute('role','status');document.body.append(status);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  // One prebuilt geometry, one draw call, no lights, textures, shadows, or per-collection GPU allocations.
  const positions=[],colors=[];
  function part(w,h,d,x,y,z,color){
    const g=new THREE.BoxGeometry(w,h,d).toNonIndexed(),p=g.attributes.position,n=g.attributes.normal,base=new THREE.Color(color);
    for(let i=0;i<p.count;i++){
      positions.push(p.getX(i)+x,p.getY(i)+y,p.getZ(i)+z);
      const shade=.72+.22*Math.max(0,n.getY(i))+.26*Math.max(0,n.getZ(i))-.12*Math.max(0,n.getX(i));
      colors.push(base.r*shade,base.g*shade,base.b*shade);
    }g.dispose();
  }
  for(let i=0;i<4;i++)part(1,.49,.033,(i%2)*.016,0,(i-1.5)*.043,i%2?0x98b681:0x668961);
  for(const side of [-1,1]){part(.87,.38,.008,0,0,.086*side,0xc0d2a4);part(.77,.29,.009,0,0,.092*side,0x799d70);}
  part(.19,.515,.194,0,0,0,0xf2dfad);for(const side of [-1,1])part(.115,.17,.006,0,0,.101*side,0xc1a369);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const material=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,innerWidth,0,innerHeight,-1000,1000);camera.position.z=100;
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(1);renderer.setClearColor(0,0);layer.append(renderer.domElement);
  const batch=new THREE.InstancedMesh(geometry,material,7);batch.frustumCulled=false;batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(batch);
  const dummy=new THREE.Object3D();let target={x:0,y:0},displayed=0,active=null,queue=Promise.resolve();
  const refreshTarget=()=>{const r=icon.getBoundingClientRect();target={x:r.left+r.width/2,y:r.top+r.height/2};};
  const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.right=innerWidth;camera.bottom=innerHeight;camera.updateProjectionMatrix();refreshTarget();};
  resize();window.addEventListener('resize',resize);new ResizeObserver(refreshTarget).observe(card);
  const update=(amount,packages)=>{displayed=amount;value.textContent=money(amount);count.textContent=`${packages} / ${totalPackages}`;progress.style.width=`${packages/totalPackages*100}%`;};
  const announce=reward=>{status.textContent=`${money(reward.amount)} collected. Total ${money(reward.total)}. ${reward.packages} of ${totalPackages} packages.`;};
  function place(i,x,y,size,rx,ry,rz){dummy.position.set(x,y,0);dummy.rotation.set(rx,ry,rz);dummy.scale.setScalar(size);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);}
  function draw(now){
    place(0,target.x,target.y,34,-.38,reduced.matches?.35:now*.00065,-.12);
    for(let i=1;i<7;i++)place(i,0,0,0,0,0,0);
    if(active){
      const age=now-active.born;let arrived=0;
      for(let i=0;i<6;i++){
        const t=THREE.MathUtils.clamp((age-i*65)/1050,0,1);if(t>=1){arrived++;continue;}if(t<=0)continue;
        const fly=THREE.MathUtils.smoothstep(t,.28,1),rise=Math.sin(Math.min(1,t/.4)*Math.PI/2);
        const spread=(i-2.5)*19;
        const x=THREE.MathUtils.lerp(active.x+spread*rise,target.x,fly);
        const y=THREE.MathUtils.lerp(active.y-85*rise,target.y,fly)-Math.sin(fly*Math.PI)*65;
        const size=(42+5*(i%2))*Math.min(1,t*8)*(1-fly*.65);
        place(i+1,x,y,size,-.38+.2*Math.sin(t*4+i),t*3+i*.7,(i-2.5)*.1*(1-fly));
      }
      const credit=THREE.MathUtils.smoothstep(age,650,1375);
      const amount=Math.round(THREE.MathUtils.lerp(active.start,active.total,credit));
      if(amount!==Math.round(displayed))update(amount,credit===1?active.packages:active.packages-1);
      if(arrived===6){const done=active;active=null;update(done.total,done.packages);announce(done);done.resolve();}
    }
    batch.instanceMatrix.needsUpdate=true;renderer.render(scene,camera);
  }
  // Warm the tiny overlay shader during loading, before any interaction.
  draw(0);
  return {
    update(){if(document.body.classList.contains('playing'))draw(performance.now());},
    restore(amount,packages){if(active){active.resolve();active=null;}update(amount,packages);gain.textContent='';},
    collect(reward){
      const run=()=>new Promise(resolve=>{
        gain.textContent='+'+money(reward.amount);refreshTarget();
        if(reduced.matches){update(reward.total,reward.packages);announce(reward);resolve();return;}
        active={...reward,x:Math.max(45,Math.min(innerWidth-45,reward.x)),y:Math.max(140,Math.min(innerHeight-60,reward.y)),start:displayed,born:performance.now(),resolve};
      });
      queue=queue.then(run,run);return queue;
    }
  };
}
