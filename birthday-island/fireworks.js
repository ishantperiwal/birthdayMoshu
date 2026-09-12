import * as THREE from 'three';

// Analytic spark paths leave tapered trails and remain independent of frame rate.
export function buildFireworks(scene,glowTexture,onBurst){
  const active=[],queue=[];
  let time=0,serial=0;
  const colors=[0xffb7c6,0xffdf99,0xb2dcff,0xd4bdff,0xbbe9ce];
  function burst(origin,variant){
    const count=variant===1?140:190,trail=8,positions=new Float32Array(count*trail*3),rgb=new Float32Array(positions.length),velocities=[];
    const tint=new THREE.Color(colors[variant%colors.length]),gold=new THREE.Color(0xffdc9b);
    for(let i=0;i<count;i++){
      const angle=Math.random()*Math.PI*2,z=2*Math.random()-1,r=Math.sqrt(1-z*z);
      let v=new THREE.Vector3(Math.cos(angle)*r,z,Math.sin(angle)*r);
      if(variant%3===1){v.set(Math.cos(angle),Math.sin(angle),Math.sin(angle*2)*.18);v.applyAxisAngle(new THREE.Vector3(0,1,0),origin.x*.025);}
      const speed=variant%3===2?8+Math.random()*6:10+Math.random()*3;
      v.multiplyScalar(speed);velocities.push({v,life:2.3+Math.random()*1.1,phase:Math.random()*6.28,tint:i%7===0?gold:tint});
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(rgb,3));
    const mat=new THREE.PointsMaterial({vertexColors:true,size:.44,map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);
    active.push({origin,points,velocities,trail,age:0,variant});onBurst();
  }
  function rocket(target,variant){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(36*3),3));
    const mat=new THREE.PointsMaterial({color:0xffdc9b,size:.20,map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);
    active.push({rocket:true,points,target,variant,age:0,life:1.25});
  }
  const dispose=b=>{scene.remove(b.points);b.points.geometry.dispose();b.points.material.dispose();};
  return {
    launch(player,heading,amount){
      const forward=new THREE.Vector3(-Math.sin(heading),0,-Math.cos(heading));
      const right=new THREE.Vector3(-forward.z,0,forward.x);
      // A fan of shells, with breathing room between blooms.
      for(let i=0;i<amount;i++){
        const target=player.clone().addScaledVector(forward,65+Math.random()*15).addScaledVector(right,(Math.random()-.5)*65);
        target.y=30+Math.random()*23;queue.push({at:time+i*.78,target,variant:serial++%5});
      }
    },
    update(dt){
      time+=dt;
      for(let i=queue.length-1;i>=0;i--)if(queue[i].at<=time){rocket(queue[i].target,queue[i].variant);queue.splice(i,1);}
      for(let b=active.length-1;b>=0;b--){
        const s=active[b];s.age+=dt;const p=s.points.geometry.attributes.position;
        if(s.rocket){
          for(let i=0;i<p.count;i++){const t=Math.max(0,s.age-i*.009)/s.life;
            p.setXYZ(i,s.target.x+Math.sin(t*3)*.4,s.target.y*Math.min(1,t),s.target.z);}
          p.needsUpdate=true;
          if(s.age>=s.life){burst(s.target,s.variant);dispose(s);active.splice(b,1);}continue;
        }
        const c=s.points.geometry.attributes.color;
        for(let i=0;i<s.velocities.length;i++){
          const v=s.velocities[i];
          for(let j=0;j<s.trail;j++){
            const t=Math.max(0,s.age-j*.035),drag=(1-Math.exp(-t*.34))/.34,k=i*s.trail+j;
            p.setXYZ(k,s.origin.x+v.v.x*drag,s.origin.y+v.v.y*drag-t*t*(s.variant%3===2?2.3:1.7),s.origin.z+v.v.z*drag);
            const fade=Math.pow(Math.max(0,1-s.age/v.life),.7)*(1-j/s.trail);
            const glitter=s.age>1.3?.65+.35*Math.sin(s.age*17+v.phase):1;
            c.setXYZ(k,v.tint.r*fade*glitter*4.5,v.tint.g*fade*glitter*4.5,v.tint.b*fade*glitter*4.5);
          }
        }
        p.needsUpdate=true;c.needsUpdate=true;
        if(s.age>3.5){dispose(s);active.splice(b,1);}
      }
    }
  };
}
