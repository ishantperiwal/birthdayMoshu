import * as THREE from 'three';
const seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};

export function buildStars(scene){
  const random=seeded(71419),positions=[],details=[],colors=[];
  for(let i=0;i<2200;i++){
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
    uniforms:{uTime:{value:0},uOpacity:{value:0},uPixelRatio:{value:1}},
    vertexShader:`attribute vec3 detail,color;uniform float uTime,uPixelRatio;varying vec3 vColor;varying float vGlow,vBright;
      void main(){vColor=color;vGlow=.78+.22*sin(uTime*detail.z+detail.y);vBright=step(4.0,detail.x);
      vec4 p=viewMatrix*vec4(position+cameraPosition,1.0);gl_Position=projectionMatrix*p;gl_PointSize=detail.x*uPixelRatio*2.0;}`,
    fragmentShader:`uniform float uOpacity;varying vec3 vColor;varying float vGlow,vBright;
      void main(){vec2 p=gl_PointCoord*2.0-1.0;float r=length(p);
      float core=exp(-r*r*24.0),halo=exp(-r*r*5.0)*.14;
      float rays=(exp(-abs(p.x)*40.0)*exp(-abs(p.y)*4.0)+exp(-abs(p.y)*40.0)*exp(-abs(p.x)*4.0))*.22*vBright;
      float a=(core+halo+rays)*(1.0-smoothstep(.65,1.0,r))*vGlow*uOpacity;
      gl_FragColor=vec4(vColor*1.8,a);}`});
  const points=new THREE.Points(geo,mat);points.frustumCulled=false;points.renderOrder=-20;scene.add(points);
  return {update(time,opacity,pixelRatio){mat.uniforms.uTime.value=time;mat.uniforms.uOpacity.value=opacity;mat.uniforms.uPixelRatio.value=pixelRatio;}};
}

// Each texture is a complete flat cloud painting. Broad elliptical density fields
// produce continuous feathered silhouettes without radial noise or puff normals.
function cloudPainting(random){
  const width=512,height=256,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d'),data=ctx.createImageData(width,height),lobes=[];
  const count=4+Math.floor(random()*4);
  lobes.push({x:0,y:.18,rx:.68,ry:.19,gain:.55});
  for(let i=0;i<count;i++)lobes.push({x:-.55+i/(count-1)*1.05+(random()-.5)*.13,y:.02-random()*.27,
    rx:.16+random()*.18,ry:.24+random()*.33,gain:.45+random()*.6});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/width*2-1,v=y/height*2-1;
    let density=0;
    for(const l of lobes){const d=((u-l.x)/l.rx)**2+((v-l.y)/l.ry)**2;density+=Math.exp(-d*2)*l.gain;}
    const edge=Math.max(0,density-.018);
    const alpha=(1-Math.exp(-edge*2.1))*Math.min(1,edge*12);
    const shade=Math.max(0,Math.min(1,.62-v*.28+.055*Math.sin(u*9+v*3)));
    const n=(y*width+x)*4;data.data[n]=shade*255;data.data[n+1]=shade*255;data.data[n+2]=shade*255;data.data[n+3]=alpha*235;
  }
  ctx.putImageData(data,0,0);return new THREE.CanvasTexture(canvas);
}
export function buildPaintedClouds(scene,uniforms,palette){
  const random=seeded(3918),clouds=[];
  const color=hex=>{const c=new THREE.Color(hex);return `vec3(${c.r},${c.g},${c.b})`;};
  for(let i=0;i<15;i++){
    const a=i/15*Math.PI*2+random()*.27,r=165+random()*40;
    const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
      uniforms:{uMap:{value:cloudPainting(random)},uAmbient:uniforms.uAmbient,uLightColor:uniforms.uLightColor,uFogColor:uniforms.uFogColor},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;vec4 centre=modelViewMatrix*vec4(0.,0.,0.,1.);
        centre.xy+=position.xy*vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));gl_Position=projectionMatrix*centre;}`,
      fragmentShader:`uniform sampler2D uMap;uniform float uAmbient;uniform vec3 uLightColor,uFogColor;varying vec2 vUv;
        void main(){vec4 p=texture2D(uMap,vUv);vec3 c=mix(${color(palette.cloudUnder)},${color(palette.cloudTop)},p.r);
        c*=mix(vec3(.36,.43,.59),uLightColor*.88+.12,smoothstep(.16,.92,uAmbient));
        c=mix(c,uFogColor,.30);gl_FragColor=vec4(c,p.a*.83);}`});
    const cloud=new THREE.Mesh(new THREE.PlaneGeometry(1,1),mat);cloud.position.set(Math.cos(a)*r,27+random()*45,Math.sin(a)*r);
    const w=43+random()*34;cloud.scale.set(w,w*(.43+random()*.22),1);cloud.renderOrder=-10;cloud.frustumCulled=false;
    scene.add(cloud);clouds.push({cloud,x:cloud.position.x,z:cloud.position.z,phase:random()*6});
  }
  return {update(time){for(const c of clouds){c.cloud.position.x=c.x+Math.sin(time*.002+c.phase)*8;c.cloud.position.z=c.z+Math.cos(time*.002+c.phase)*5;}}};
}
