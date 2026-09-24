import * as THREE from 'three';

// Analytic paths, reused trail vertices and one shadowless flash light.
export function buildFireworks(scene,glowTexture,onBurst,onLaunch){
  const active=[],queue=[];
  let time=0,serial=0,flash=0;
  const colors=[0xff91b3,0xffd785,0x91cfff,0xc4a1ff,0x9ce6c0];
  const flashLight=new THREE.PointLight(0xffd7b1,0,34,2);scene.add(flashLight);
  const flashPosition=new THREE.Vector3();
  function burst(origin,variant){
    const count=variant===1?140:190,trail=8,positions=new Float32Array(count*trail*3),rgb=new Float32Array(positions.length),velocities=[];
    const tint=new THREE.Color(colors[variant%colors.length]),gold=new THREE.Color(0xffdfaa);
    for(let i=0;i<count;i++){
      const angle=Math.random()*Math.PI*2,z=2*Math.random()-1,r=Math.sqrt(1-z*z);
      let v=new THREE.Vector3(Math.cos(angle)*r,z,Math.sin(angle)*r);
      if(variant%3===1){v.set(Math.cos(angle),Math.sin(angle),Math.sin(angle*2)*.18);v.applyAxisAngle(new THREE.Vector3(0,1,0),origin.x*.025);}
      const speed=variant%3===2?8+Math.random()*6:10+Math.random()*3;
      v.multiplyScalar(speed);velocities.push({v,life:2.8+Math.random()*1.2,phase:Math.random()*6.28,tint:i%7===0?gold:tint});
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(rgb,3));
    const mat=new THREE.PointsMaterial({vertexColors:true,size:.58,map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
    const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);
    active.push({origin,points,velocities,trail,age:0,variant});
    flash=1;flashLight.color.copy(tint).lerp(new THREE.Color(0xffe6c8),.55);flashLight.position.copy(flashPosition);onBurst(origin,variant);
  }
  function rocket(target,variant){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(36*3),3));geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(36*3),3));
    const mat=new THREE.PointsMaterial({vertexColors:true,size:.27,map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
    const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);
    active.push({rocket:true,points,target,variant,age:0,life:1.55});onLaunch?.(target,variant,1.55);
  }
  const dispose=b=>{scene.remove(b.points);b.points.geometry.dispose();b.points.material.dispose();};
  return {
    get flash(){return flash;},
    launch(player,heading,amount=7){
      if(queue.length+active.length>16)return;
      amount=THREE.MathUtils.clamp(Math.round(amount),6,7);
      const forward=new THREE.Vector3(-Math.sin(heading),0,-Math.cos(heading));
      const right=new THREE.Vector3(-forward.z,0,forward.x);
      flashPosition.copy(player).addScaledVector(forward,6);flashPosition.y+=5;
      // Offshore fan: every shell is remote, with slightly irregular timing.
      let delay=0;
      for(let i=0;i<amount;i++){
        const lateral=(i/(amount-1)-.5)*58+(Math.random()-.5)*12;
        const target=player.clone().addScaledVector(forward,100+Math.random()*18).addScaledVector(right,lateral);
        // Leave room below the burst for the longest falling embers to fade above the sea.
        target.y=72+Math.random()*19;queue.push({at:time+delay,target,variant:serial++%5});delay+=i===amount-2?.38:.64+Math.random()*.24;
      }
    },
    update(dt){
      time+=dt;flash*=Math.exp(-dt*5);flashLight.intensity=flash*70;
      for(let i=queue.length-1;i>=0;i--)if(queue[i].at<=time){rocket(queue[i].target,queue[i].variant);queue.splice(i,1);}
      for(let b=active.length-1;b>=0;b--){
        const s=active[b];s.age+=dt;const p=s.points.geometry.attributes.position,c=s.points.geometry.attributes.color;
        if(s.rocket){
          for(let i=0;i<p.count;i++){const t=Math.min(1,Math.max(0,s.age-i*.009)/s.life),height=s.target.y*t;
            p.setXYZ(i,s.target.x+Math.sin(t*3)*.4,height,s.target.z);
            const reveal=THREE.MathUtils.smoothstep(height,12,21),tail=Math.pow(1-i/p.count,1.4);
            const sparkle=s.variant%2===0&&i%5===0?1+Math.pow(Math.max(0,Math.sin(time*29+i*2.3)),12)*1.5:1;
            c.setXYZ(i,reveal*tail*sparkle*2.8,reveal*tail*sparkle*1.85,reveal*tail*sparkle*.85);
          }
          p.needsUpdate=true;c.needsUpdate=true;
          if(s.age>=s.life){burst(s.target,s.variant);dispose(s);active.splice(b,1);}continue;
        }
        for(let i=0;i<s.velocities.length;i++){
          const v=s.velocities[i];
          for(let j=0;j<s.trail;j++){
            const t=Math.max(0,s.age-j*.045),drag=(1-Math.exp(-t*.34))/.34,k=i*s.trail+j;
            p.setXYZ(k,s.origin.x+v.v.x*drag,s.origin.y+v.v.y*drag-t*t*(s.variant%3===2?2.3:1.7),s.origin.z+v.v.z*drag);
            const life=Math.max(0,1-s.age/v.life),fade=Math.pow(life,.65)*(1-j/s.trail);
            const late=THREE.MathUtils.smoothstep(s.age,.8,2.5);
            const pulse=Math.pow(Math.max(0,Math.sin(s.age*(21+i%7)+v.phase)),16);
            const glitter=late*pulse*(i%3===0?1.8:.45)*(j===0||j===s.trail-1?1:.12);
            const brightness=fade*(6.8+Math.exp(-s.age*7)*3.5)+glitter*Math.sqrt(life)*5;
            c.setXYZ(k,(v.tint.r+glitter*.20)*brightness,(v.tint.g+glitter*.20)*brightness,(v.tint.b+glitter*.17)*brightness);
          }
        }
        p.needsUpdate=true;c.needsUpdate=true;
        if(s.age>4.1){dispose(s);active.splice(b,1);}
      }
    }
  };
}
