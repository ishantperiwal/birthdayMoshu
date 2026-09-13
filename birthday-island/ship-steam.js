import * as THREE from 'three';

// Like the reference train: baked billowy profiles, chuffs, cooling buoyancy,
// wind drift and expanding puffs. Deliberately shorter-lived and much smaller.
export function buildShipSteam(scene){
  const textures=[];
  for(let variant=0;variant<4;variant++){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
    const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(96,96);
    for(let y=0;y<96;y++)for(let x=0;x<96;x++){
      const u=x/95*2-1,v=y/95*2-1,r=Math.hypot(u,v);let density=0;
      for(let l=0;l<6;l++){
        const a=l*2.399+variant,rr=l===0?0:.28;
        const dx=u-Math.cos(a)*rr,dy=v-Math.sin(a)*rr;
        density=Math.max(density,Math.exp(-(dx*dx+dy*dy)*(4.5+l*.45)));
      }
      const wisps=.83+.10*Math.sin(u*12+Math.sin(v*8+variant))+.07*Math.sin(v*18-u*9+variant);
      const feather=1-THREE.MathUtils.smoothstep(r,.67,.98),i=(y*96+x)*4;
      const shade=204+(1-v)*15;
      pixels.data[i]=shade;pixels.data[i+1]=shade+2;pixels.data[i+2]=shade+3;
      pixels.data[i+3]=Math.round(density*wisps*feather*235);
    }
    ctx.putImageData(pixels,0,0);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;textures.push(map);
  }
  const puffs=[];
  for(let i=0;i<16;i++){
    const material=new THREE.SpriteMaterial({map:textures[i%4],color:0xffffff,transparent:true,opacity:0,depthWrite:false,fog:true});
    const sprite=new THREE.Sprite(material);scene.add(sprite);
    puffs.push({sprite,age:99,life:6,velocity:new THREE.Vector3(),seed:i*3.71,size:1});
  }
  let next=0,index=0;
  return {clear(){for(const p of puffs){p.age=99;p.sprite.material.opacity=0;}next=0;},update(dt,time,emitter,vx,vz){
    if(time>=next){
      const p=puffs[index++%puffs.length];p.age=0;p.life=5.8+Math.random()*1.6;p.seed=Math.random()*30;p.size=1.15+Math.random()*.45;
      p.sprite.position.copy(emitter);p.sprite.position.x+=(Math.random()-.5)*.35;p.sprite.position.z+=(Math.random()-.5)*.35;
      p.velocity.set(vx*.45+(Math.random()-.5)*.45,1.8+Math.random()*.6,vz*.45+(Math.random()-.5)*.45);
      next=time+.50+Math.random()*.28;
    }
    for(const p of puffs){
      p.age+=dt;
      if(p.age>=p.life){p.sprite.material.opacity=0;continue;}
      const u=p.age/p.life,mix=Math.min(1,dt*(.65+u));
      const windX=-.38+Math.sin(time*.35+p.seed)*.28,windZ=.28+Math.cos(time*.29+p.seed)*.22;
      p.velocity.x+=(windX-p.velocity.x)*mix;p.velocity.z+=(windZ-p.velocity.z)*mix;
      p.velocity.y+=(1.7*Math.exp(-p.age*.45)-p.velocity.y)*Math.min(1,dt*1.3);
      p.sprite.position.addScaledVector(p.velocity,dt);p.size+=dt*.78*(1-u*.3);
      p.sprite.scale.set(p.size,p.size*(.94+.10*Math.sin(p.seed+p.age*.4)),1);
      p.sprite.material.rotation=p.seed+p.age*.16;
      p.sprite.material.opacity=THREE.MathUtils.smoothstep(p.age,0,.18)*(1-THREE.MathUtils.smoothstep(u,.32,1))*.39;
    }
  }};
}
