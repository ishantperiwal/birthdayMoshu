import * as THREE from 'three';
const seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};

export function buildStars(scene){
  const random=seeded(71419),positions=[],details=[],colors=[];
  for(let i=0;i<1800;i++){
    const a=random()*Math.PI*2;
    // Uniform hemisphere area, including the zenith. No capped elevation band.
    const y=.015+random()*.985,r=Math.sqrt(1-y*y);
    positions.push(Math.cos(a)*r*300,y*300,Math.sin(a)*r*300);
    const bright=random();details.push(bright>.97?4.8:1.1+bright*1.8,random()*6.28,.55+random()*.8);
    const tint=new THREE.Color([0xffe9bf,0xdde9ff,0xffffff,0xe9ddff][i%4]);colors.push(tint.r,tint.g,tint.b);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('detail',new THREE.Float32BufferAttribute(details,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uGazing:{value:0},uClear:{value:1},uFlip:{value:random()<.5?1:-1},
        uOpacity:{value:0},uPixelRatio:{value:1}},
    vertexShader:`attribute vec3 detail,color;uniform float uTime,uPixelRatio,uGazing;varying vec3 vColor;varying float vGlow,vBright;
      void main(){
      // Let existing stars bloom in their own time, rather than depending on
      // a bright pixel crossing the downsample grid as the camera moves.
      float pulse=smoothstep(.25,.95,sin(uTime*(.9+detail.z*.25)+detail.y*3.7));
      // Fewer simultaneous glows while walking; keep the fuller stargazing sky.
      float shimmer=pulse*mix(step(2.76,detail.x),step(2.7,detail.x),uGazing);
      vColor=color*(1.0+shimmer*1.65);
      vGlow=mix(.78,.74,uGazing)+mix(.22,.12,uGazing)*sin(uTime*detail.z+detail.y)+shimmer*.18;
      vBright=step(4.0,detail.x);
      vec4 p=viewMatrix*vec4(position+cameraPosition,1.0);gl_Position=projectionMatrix*p;gl_PointSize=mix(detail.x*1.5,6.2,vBright)*uPixelRatio;}`,
    fragmentShader:`uniform float uOpacity;varying vec3 vColor;varying float vGlow,vBright;
      void main(){vec2 p=gl_PointCoord*2.0-1.0;float r=length(p);
      float core=exp(-r*r*24.0),halo=exp(-r*r*5.0)*mix(.14,.12,vBright);
      // Round dots for small stars; wide, symmetric rays avoid subpixel slivers.
      vec2 q=abs(p);
      float rays=(exp(-q.x*q.x*100.0-q.y*q.y*7.0)+exp(-q.y*q.y*100.0-q.x*q.x*7.0))*.12*vBright;
      float a=(core+halo+rays)*(1.0-smoothstep(.65,1.0,r))*vGlow*uOpacity;
      gl_FragColor=vec4(vColor*1.8,a);}`});
  const points=new THREE.Points(geo,mat);points.frustumCulled=false;points.renderOrder=-20;scene.add(points);
  let previousTime=null,phase=0;
  return {update(time,opacity,pixelRatio,gazing=false){
    const dt=previousTime===null?0:Math.max(0,time-previousTime);previousTime=time;
    const u=mat.uniforms;u.uGazing.value+=((gazing?1:0)-u.uGazing.value)*(1-Math.exp(-dt*3));
    phase+=dt*THREE.MathUtils.lerp(1,.60,u.uGazing.value);
    u.uTime.value=phase;u.uOpacity.value=opacity;u.uPixelRatio.value=pixelRatio;
  }};
}

// Value noise and fbm on the CPU: the cloud paintings are baked into canvases
// once at load, so the silhouettes cost nothing per frame.
const nhash=(x,y,s)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n);};
function vnoise(x,y,s){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
  const a=nhash(ix,iy,s),b=nhash(ix+1,iy,s),c=nhash(ix,iy+1,s),d=nhash(ix+1,iy+1,s);
  return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;
}
function fbm(x,y,s,oct){let v=0,amp=.5,f=1;for(let i=0;i<oct;i++){v+=amp*vnoise(x*f,y*f,s+i*17.3);f*=2;amp*=.5;}return v;}

/* Connected cloud silhouettes baked once: an uneven low belly with overlapping
   shoulders and one off-centre crown. Broad lobes define the shape; quiet noise
   only softens their edges. Keep the user's baked normal/form lighting. */
function cloudPainting(random,variant=0){
  const W=256,H=128,lobes=[];
  const put=(x,y,rx,ry,gain=1)=>lobes.push({x,y,rx,ry,gain});
  const crownX=(random()-.5)*.55,low=variant%3===1;
  const belly=.16+random()*.035;
  put(-.03,.27,.70+random()*.055,belly,.85);
  put(-.49,.18,.25+random()*.05,.19+random()*.05,.85);
  put(.46,.19,.25+random()*.05,.17+random()*.06,.85);
  // Crowns share their lower half with the belly; no isolated upper caps.
  if(variant%3===2){
    put(-.29,-.03,.27,.37);put(.25,.015,.28,.30);
    put(-.01,.13,.30,.23,.9);
  }else{
    put(crownX,low?.10:-.06,.30+random()*.08,low?.22:.38+random()*.10);
    put(crownX-.29,.10,.25+random()*.06,low?.19:.26+random()*.08,.95);
    put(crownX+.28,.09,.24+random()*.06,low?.18:.27+random()*.10,.95);
  }
  put(-.68,.27,.18,.10+random()*.03,.65);
  put(.66,.26,.20,.10+random()*.03,.7);
  const seed=random()*100,dens=new Float32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const u=x/W*2-1,v=y/H*2-1;
    const warp=(fbm(u*3+11,v*3+7,seed,2)-.375)*.10;
    let d=0;
    for(const l of lobes){
      const dx=(u-l.x+warp)/l.rx,dy=(v-l.y+warp*.6)/l.ry;
      const q=Math.sqrt(dx*dx+dy*dy);
      // A soft union preserves the rounded outline without accumulating a
      // hard, overfilled centre or cutting little islands out of the crown.
      const value=Math.max(0,1-q)*l.gain;
      d=Math.max(d,value)+Math.min(d,value)*.18;
    }
    dens[y*W+x]=d;
  }
  const alpha=new Float32Array(W*H),form=new Float32Array(W*H);
  // Normalise against the field's own maximum rather than clamping: a clamped
  // thickness saturates across the whole interior, its gradient goes to zero,
  // and the cloud shades as one flat mass however good the silhouette is.
  let maxD=.001;for(let i=0;i<W*H;i++)if(dens[i]>maxD)maxD=dens[i];
  for(let i=0;i<W*H;i++){
    const edge=Math.max(0,Math.min(1,dens[i]/.28));
    alpha[i]=edge*edge*(3-2*edge);
    form[i]=Math.pow(Math.max(0,dens[i])/maxD,.70);
  }
  const at=(x,y)=>form[Math.max(0,Math.min(H-1,y))*W+Math.max(0,Math.min(W-1,x))];
  // Creases: density minus its own local average. Positive on a bulging puff,
  // negative in the valley between two. This is the term that reads as lobed
  // form no matter where the sun is, and painted clouds live on it.
  const R=7,blur=new Float32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    let sum=0,n=0;
    for(let k=-R;k<=R;k+=2){sum+=at(x+k,y);sum+=at(x,y+k);n+=2;}
    blur[y*W+x]=sum/n;
  }
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d'),data=ctx.createImageData(W,H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x;
    // Normal from the thickness gradient, sampled several texels out so the
    // noise that roughens the silhouette does not also shatter the lighting.
    const gx=(at(x-3,y)-at(x+3,y))*9.0;
    const gy=(at(x,y+3)-at(x,y-3))*9.0;   // canvas y runs down; flip to world up
    const len=Math.sqrt(gx*gx+gy*gy+1);
    const n=i*4;
    data.data[n]=(gx/len*.5+.5)*255;
    data.data[n+1]=(gy/len*.5+.5)*255;
    data.data[n+2]=Math.max(0,Math.min(1,.5+(form[i]-blur[i])*2.6))*255;
    data.data[n+3]=alpha[i]*255;
  }
  ctx.putImageData(data,0,0);
  const tex=new THREE.CanvasTexture(canvas);tex.anisotropy=4;return tex;
}
export function buildPaintedClouds(scene,uniforms,palette){
  const random=seeded(3918),clouds=[];
  const color=hex=>{const c=new THREE.Color(hex);return `vec3(${c.r},${c.g},${c.b})`;};
  // Six paintings shared across the sky, mirrored and re-proportioned per
  // billboard. Baking one per cloud costs load time and buys little: what reads
  // as repetition is a repeated silhouette, and a flip breaks that.
  const atlas=[];for(let i=0;i<6;i++)atlas.push(cloudPainting(random,i));
  const sunView={value:new THREE.Vector3(0,1,0)};
  // Spread across distance AND elevation. The old layout put every cloud in one
  // low ring at a single radius, which leaves the sky above empty — and a lone
  // object in an empty sky is exactly what draws the eye to it.
  const N=22;
  for(let i=0;i<N;i++){
    const a=(i/N+random()*.9/N)*Math.PI*2;
    const r=150+Math.pow(random(),.7)*310;
    const elev=.07+Math.pow(random(),1.15)*.52;
    const haze=.15+Math.min(.34,(r-150)/310*.36);
    const wispy=random()<.32;
    const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
      uniforms:{uMap:{value:atlas[Math.floor(random()*atlas.length)]},uSunView:sunView,
        uAmbient:uniforms.uAmbient,uLightColor:uniforms.uLightColor,uFogColor:uniforms.uFogColor,
        uClear:{value:1},uFlip:{value:random()<.5?1:-1},
        uOpacity:{value:wispy?.42+random()*.18:.78+random()*.20},uHaze:{value:haze}},
      vertexShader:`uniform float uFlip;varying vec2 vUv;void main(){vUv=vec2((uv.x-.5)*uFlip+.5,uv.y);vec4 centre=modelViewMatrix*vec4(0.,0.,0.,1.);
        centre.xy+=position.xy*vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));gl_Position=projectionMatrix*centre;}`,
      fragmentShader:`uniform sampler2D uMap;uniform float uAmbient,uOpacity,uHaze,uClear,uFlip;
        uniform vec3 uLightColor,uFogColor,uSunView;varying vec2 vUv;
        void main(){
          vec4 p=texture2D(uMap,vUv);
          if(p.a<.004)discard;
          // The billboard is screen-aligned, so the view-space sun direction is
          // already in the same frame as the baked normal. Clouds therefore take
          // their light from wherever the sun actually is, and turn as it sets.
          vec2 nxy=p.rg*2.0-1.0;nxy.x*=uFlip;
          vec3 n=vec3(nxy,sqrt(max(1.0-dot(nxy,nxy),0.0)));
          float lam=dot(n,normalize(uSunView))*.5+.5;
          // Wrapped rather than Lambert: cloud is translucent, so the unlit side
          // never goes black, but the terminator still has to be readable.
          float form=mix(lam,1.0,.22);
          float h=smoothstep(.28,.95,vUv.y);   // base to crown of the billboard
          vec3 c=mix(${color(palette.cloudUnder)},${color(palette.cloudTop)},
                     clamp(form*.58+h*.58-.10,0.0,1.0));
          c=mix(c,${color(palette.cloudBody)},(1.0-smoothstep(.15,.70,h))*.40);
          // Valleys between puffs sit in their neighbours' shade.
          c*=.74+.44*p.b;
          c=mix(c,${color(palette.cloudTerm)},(1.0-smoothstep(.12,.66,lam))*.62);
          float rim=pow(1.0-abs(n.z),2.4)*smoothstep(.30,.85,lam);
          c+=uLightColor*rim*.30*smoothstep(.20,.80,uAmbient);
          c*=mix(vec3(.36,.43,.59),uLightColor*.88+.12,smoothstep(.16,.92,uAmbient));
          c=mix(c,uFogColor,uHaze);   // the far ones belong to the haze, not the foreground
          gl_FragColor=vec4(c,p.a*uOpacity*uClear);
        }`});
    const cloud=new THREE.Mesh(new THREE.PlaneGeometry(1,1),mat);
    cloud.position.set(Math.cos(a)*r,r*Math.tan(elev),Math.sin(a)*r);
    // Size by the angle it should subtend, not by world width, so a distant
    // cloud is genuinely smaller on screen instead of merely further away.
    const w=r*((wispy?.20:.15)+random()*.15);
    cloud.scale.set(w,w*(wispy?.26+random()*.10:.46+random()*.18),1);
    cloud.renderOrder=-10;cloud.frustumCulled=false;
    const id=`cloud-${String(i+1).padStart(2,'0')}`,drift=.0006+random()*.00035;
    // Consume the whole seeded slot before removing it, preserving every other cloud.
    if(id==='cloud-01'){cloud.geometry.dispose();mat.dispose();continue;}
    scene.add(cloud);clouds.push({id,cloud,angle:a,radius:r,halfAngle:w/r*.55,drift});
  }
  const v=new THREE.Vector3(),eye=new THREE.Vector3();
  return {contextTargets(){return clouds.map(c=>({id:c.id,position:c.cloud.position,visibility:c.cloud.material.uniforms.uClear.value*c.cloud.material.uniforms.uOpacity.value}));},update(time,camera,sunDir){
    if(camera&&sunDir){
      camera.updateWorldMatrix(true,false);
      sunView.value.copy(sunDir).transformDirection(camera.matrixWorldInverse).normalize();
      camera.getWorldPosition(eye);
    }
    for(const c of clouds){
      // Continuous slow travel around the distant sky, without wraparound jumps.
      const angle=c.angle+time*c.drift;
      c.cloud.position.x=Math.cos(angle)*c.radius;
      c.cloud.position.z=Math.sin(angle)*c.radius;
      if(camera&&sunDir){
        v.copy(c.cloud.position).sub(eye).normalize();
        const separation=Math.acos(THREE.MathUtils.clamp(v.dot(sunDir),-1,1));
        // Fade the whole painting well before it reaches the moon/sun halo,
        // keeping that area open instead of punching a hole through a cloud.
        c.cloud.material.uniforms.uClear.value=THREE.MathUtils.smoothstep(separation,c.halfAngle+.13,c.halfAngle+.27);
      }
    }
  }};
}
