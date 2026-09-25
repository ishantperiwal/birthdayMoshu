import * as THREE from 'three';

export function buildLetterPaper(camera){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=1024;
  const ctx=canvas.getContext('2d'),map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
  const paper=new THREE.Mesh(new THREE.PlaneGeometry(.28,.37,1,1),material);paper.renderOrder=1000;paper.visible=false;camera.add(paper);
  let frame=0;
  function stop(){cancelAnimationFrame(frame);paper.visible=false;}
  return {stop,play(text){
    stop();ctx.fillStyle='#dfcdae';ctx.fillRect(0,0,768,1024);ctx.fillStyle='#f4e9d4';ctx.fillRect(15,15,738,994);
    ctx.fillStyle='#a0576d';ctx.font='italic 36px Georgia';ctx.fillText('With all my love',55,90);
    ctx.fillStyle='#655044';ctx.font='25px Georgia';let line='',y=150;
    for(const word of text.split(/\s+/)){if(ctx.measureText(line+word).width>650){ctx.fillText(line,55,y);y+=37;line='';}line+=word+' ';}ctx.fillText(line,55,y);
    map.needsUpdate=true;paper.visible=true;const start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    function tick(now){const t=(now-start)/1000,away=THREE.MathUtils.smoothstep(t,.65,1.5);
      paper.position.set(.18+away*.09,-.18-away*.40,-.58);paper.rotation.set(-.15-away*.25,-.18,.10+away*.16);
      material.opacity=1-THREE.MathUtils.smoothstep(t,1.1,1.5);
      if(t>=1.5){paper.visible=false;return;}if(reduced){paper.rotation.set(0,0,0);paper.position.set(.18,-.18,-.58);}frame=requestAnimationFrame(tick);
    }frame=requestAnimationFrame(tick);
  }};
}
