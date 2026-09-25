import * as THREE from 'three';

// Glowing handwriting left in the sky by the birthday finale shell. Its sparks
// fly from the burst into letter shapes, written left to right, glow for a
// while, and sparkle away as the love plane passes each letter.
const FONT='700 170px "Dancing Script", "Segoe Script", "Brush Script MT", cursive';
const CANVAS_W=1600,CANVAS_H=560,ROWS=[172,398],WIDTH=80,MAX_POINTS=3400;
const FLY=1.5,FADE=1.9,MAX_HOLD=45;

export function buildSkyMessage(scene,glowTexture,lines=['Happy Birthday','Moshie Pie!!']){
  // Start the script font download early; the letters are sampled on first use.
  let shapes=null;
  document.fonts?.load(FONT).then(()=>{shapes=null;}).catch(()=>{});

  function sampleLetters(){
    const canvas=document.createElement('canvas');canvas.width=CANVAS_W;canvas.height=CANVAS_H;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=FONT;
    lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,CANVAS_W/2,ROWS[i]));
    const pixels=ctx.getImageData(0,0,CANVAS_W,CANVAS_H).data,found=[];
    let minX=CANVAS_W,maxX=0;
    for(let y=0;y<CANVAS_H;y+=3)for(let x=0;x<CANVAS_W;x+=3)if(pixels[(y*CANVAS_W+x)*4+3]>140){found.push([x,y]);minX=Math.min(minX,x);maxX=Math.max(maxX,x);}
    // Even random thinning keeps strokes smooth without clumping.
    for(let i=found.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[found[i],found[j]]=[found[j],found[i]];}
    const scale=WIDTH/Math.max(1,maxX-minX),picked=found.slice(0,MAX_POINTS);
    const lineBounds=[0,1].map(l=>{const xs=picked.filter(p=>(p[1]<CANVAS_H/2?0:1)===l).map(p=>p[0]);return xs.length?[Math.min(...xs),Math.max(...xs)]:[0,1];});
    return picked.map(([px,py])=>{
      const line=py<CANVAS_H/2?0:1,[a,b]=lineBounds[line];
      return {x:(px-CANVAS_W/2)*scale,y:(CANVAS_H/2-py)*scale,write:(px-a)/Math.max(1,b-a),line};
    });
  }

  const palette=[[1,.6,.74],[1,.6,.74],[1,.72,.8],[1,.84,.55],[1,.95,.9]];
  const geometry=new THREE.BufferGeometry();
  const material=new THREE.PointsMaterial({vertexColors:true,size:.86,map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
  const points=new THREE.Points(geometry,material);points.frustumCulled=false;points.visible=false;scene.add(points);
  const center=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),normal=new THREE.Vector3(),probe=new THREE.Vector3();
  let data=null,age=0,active=false;

  function show(origin,eye){
    shapes??=sampleLetters();
    const n=shapes.length;
    center.copy(origin);
    normal.subVectors(eye,center).normalize();
    right.crossVectors(new THREE.Vector3(0,1,0),normal).normalize();
    up.crossVectors(normal,right).normalize();
    data={
      start:new Float32Array(n*3),target:new Float32Array(n*3),drift:new Float32Array(n*3),base:new Float32Array(n*3),
      delay:new Float32Array(n),phase:new Float32Array(n),lateral:new Float32Array(n),fadeAt:new Float32Array(n).fill(-1)
    };
    shapes.forEach((s,i)=>{
      const k=i*3,depth=(Math.random()-.5)*.8;
      probe.copy(center).addScaledVector(right,s.x).addScaledVector(up,s.y).addScaledVector(normal,depth);
      data.target.set([probe.x,probe.y,probe.z],k);
      probe.copy(center).add(new THREE.Vector3().randomDirection().multiplyScalar(Math.random()*.8));
      data.start.set([probe.x,probe.y,probe.z],k);
      probe.randomDirection().multiplyScalar(.6+Math.random()*1.2);data.drift.set([probe.x,probe.y,probe.z],k);
      data.base.set(palette[Math.random()*palette.length|0],k);
      // Written left to right, the second line following the first.
      data.delay[i]=s.write*1.25+s.line*.75+Math.random()*.12;
      data.phase[i]=Math.random()*Math.PI*2;data.lateral[i]=s.x;
    });
    geometry.setAttribute('position',new THREE.BufferAttribute(data.start.slice(),3));
    geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(n*3),3));
    age=0;active=true;points.visible=true;
  }

  // sweep: the passing plane's world position, or null when it is elsewhere.
  function update(dt,sweep){
    if(!active)return;
    age+=dt;
    let edge=sweep?probe.subVectors(sweep,center).dot(right):-Infinity;
    // If the plane never arrives, let the words drift away on their own.
    if(age>MAX_HOLD)edge=Math.max(edge,-WIDTH/2+(age-MAX_HOLD)*18);
    const p=geometry.attributes.position,c=geometry.attributes.color,{start,target,drift,base,delay,phase,lateral,fadeAt}=data;
    let alive=0;
    for(let i=0;i<delay.length;i++){
      const k=i*3,t=age-delay[i];
      if(t<0){c.setXYZ(i,0,0,0);alive++;continue;}
      const f=Math.min(1,t/FLY),e=1-Math.pow(1-f,3),lift=Math.sin(f*Math.PI)*1.1;
      const breathe=f===1?Math.sin(age*.7+phase[i])*.07:0;
      let x=start[k]+(target[k]-start[k])*e+up.x*(lift+breathe);
      let y=start[k+1]+(target[k+1]-start[k+1])*e+up.y*(lift+breathe);
      let z=start[k+2]+(target[k+2]-start[k+2])*e+up.z*(lift+breathe);
      const twinkle=.86+.14*Math.sin(age*3.1+phase[i])+Math.pow(Math.max(0,Math.sin(age*1.7+phase[i]*3)),24)*1.4;
      let brightness=(4.1+2.8*(1-e))*(f===1?twinkle:1);
      if(fadeAt[i]<0&&f===1&&lateral[i]<edge-1.5)fadeAt[i]=age;
      if(fadeAt[i]>=0){
        const q=(age-fadeAt[i])/FADE;
        if(q>=1){c.setXYZ(i,0,0,0);continue;}
        // A brief flare, then each spark drifts down and dims.
        brightness*=Math.pow(1-q,1.5)*(1+.9*Math.exp(-q*9));
        x+=drift[k]*q*q*2.2;y+=drift[k+1]*q*q*2.2-q*q*2.6;z+=drift[k+2]*q*q*2.2;
      }
      alive++;
      p.setXYZ(i,x,y,z);c.setXYZ(i,base[k]*brightness,base[k+1]*brightness,base[k+2]*brightness);
    }
    p.needsUpdate=true;c.needsUpdate=true;
    if(!alive){active=false;points.visible=false;}
  }

  return {show,update,get active(){return active;}};
}
