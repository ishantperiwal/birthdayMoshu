import * as THREE from 'three';
import {buildLovePlane} from './love-plane.js?v=landing-pass-1';

export function buildWelcomePlane(){
  const welcome=document.querySelector('#welcome');
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setClearColor(0,0);
  const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1';
  welcome.prepend(canvas);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,1,1000);
  camera.position.set(0,0,220);camera.lookAt(0,0,0);

  const plane=buildLovePlane(scene,{showBanner:false});
  // Retain the original materials so the flypast's opacity fades still apply.
  plane.root.traverse(object=>{
    const material=object.material;
    if(!material?.isMeshStandardMaterial)return;
    material.color.setHex(0x000000);
    material.emissive.setHex(0x10162e);material.emissiveIntensity=1;
    material.metalness=0;material.roughness=1;material.toneMapped=false;
  });
  const smokeCanvas=document.createElement('canvas');smokeCanvas.width=smokeCanvas.height=64;
  const smokeContext=smokeCanvas.getContext('2d'),gradient=smokeContext.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(175,181,209,.65)');gradient.addColorStop(.45,'rgba(175,181,209,.3)');gradient.addColorStop(1,'rgba(175,181,209,0)');
  smokeContext.fillStyle=gradient;smokeContext.fillRect(0,0,64,64);
  const smokeMap=new THREE.CanvasTexture(smokeCanvas);
  const smoke=Array.from({length:40},()=>{const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeMap,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));sprite.visible=false;scene.add(sprite);return {sprite,born:-100,y:0};});
  let nextPuff=0,lastPuff=-100,direction=1;
  function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  resize();window.addEventListener('resize',resize);
  // Compile while loading, before the first quiet flypast.
  renderer.compile(scene,camera);
  const started=performance.now();let last=-1,cycle=-1,stopped=false;
  const timer=setInterval(()=>{
    if(stopped||document.hidden)return;
    const t=(performance.now()-started)/1000,pass=Math.floor((t-8)/90),phase=(t-8)%90;
    if(t<8||phase>30){if(last!==-1){renderer.clear();last=-1;}return;}
    if(pass!==cycle){cycle=pass;direction=pass%2===0?1:-1;plane.update(t,1);
      const halfHeight=220*Math.tan(19*Math.PI/180),half=halfHeight*camera.aspect;
      const moon=welcome.querySelector('.welcome-moon').getBoundingClientRect(),bounds=canvas.getBoundingClientRect();
      const moonY=(1-2*((moon.top+moon.height*.5-bounds.top)/bounds.height))*halfHeight;
      plane.flyPast(new THREE.Vector3(0,moonY,0),camera.position,{below:0,from:-half-15,to:half+15,speed:(half*2+30)/24});
      smoke.forEach(p=>{p.born=-100;p.sprite.visible=false;});lastPuff=t;
    }
    plane.update(t,1);
    if(plane.root.visible){
      plane.root.position.x*=direction;
      if(direction<0)plane.root.rotation.y=Math.PI-plane.root.rotation.y;
      if(t-lastPuff>.15&&phase<24){const puff=smoke[nextPuff++%smoke.length];puff.born=t;puff.sprite.position.copy(plane.root.position);puff.sprite.position.x-=direction*4;puff.y=puff.sprite.position.y;lastPuff=t;}
    }
    for(const puff of smoke){const age=t-puff.born;puff.sprite.visible=age<5;if(!puff.sprite.visible)continue;
      puff.sprite.position.y=puff.y+age*.25+Math.sin(age*1.3+puff.born)*.18;
      puff.sprite.scale.setScalar(1.2+age*.9);
      puff.sprite.material.opacity=.20*Math.min(1,age/.3)*Math.pow(1-age/5,1.5);
    }
    renderer.render(scene,camera);last=t;
  },1000/24);
  return ()=>{stopped=true;clearInterval(timer);window.removeEventListener('resize',resize);canvas.remove();scene.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});renderer.dispose();};
}
