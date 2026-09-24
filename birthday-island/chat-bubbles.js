import * as THREE from 'three';
export function buildChatBubbles({scene,camera,getAnchor,onSound}){
  const bubbles=new Map(),eye=new THREE.Vector3();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function show(user,text,{emoji=false,duration=5500}={}){
    const anchor=getAnchor(user);if(!anchor)return;
    let b=bubbles.get(user);
    if(!b){
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));
      sprite.name=`chat-${user}`;sprite.scale.set(2.6,1.3,1);scene.add(sprite);
      b={canvas,texture,sprite,width:canvas.width,height:canvas.height};bubbles.set(user,b);
    }
    Object.assign(b,{text:Array.from(text),born:performance.now(),last:-1,sounded:false,emoji,duration});
  }
  function upload(b,n){
    // Uploaded textures cannot change dimensions; emoji and text use different canvases.
    if(b.width!==b.canvas.width||b.height!==b.canvas.height){
      b.texture.dispose();b.texture=new THREE.CanvasTexture(b.canvas);
      b.texture.colorSpace=THREE.SRGBColorSpace;b.sprite.material.map=b.texture;
      b.width=b.canvas.width;b.height=b.canvas.height;
    }
    b.texture.needsUpdate=true;b.last=n;
  }
  function paint(b,n){
    if(b.emoji){
      b.canvas.width=192;b.canvas.height=208;const c=b.canvas.getContext('2d');
      c.fillStyle='#fff5df';c.beginPath();c.roundRect(12,8,168,164,34);c.fill();
      c.beginPath();c.moveTo(78,168);c.lineTo(96,198);c.lineTo(114,168);c.fill();
      c.font='100px "Segoe UI Emoji","Apple Color Emoji",system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(b.text.join(''),96,93);
      b.sprite.scale.set(.48,.52,1);upload(b,n);return;
    }
    if(b.canvas.width!==640)b.canvas.width=640;
    const c=b.canvas.getContext('2d');
    // Wrap the complete message first so revealing letters never shifts earlier words.
    let lines,fontSize=29;
    for(let size=29;size>=19;size-=2){
      fontSize=size;c.font=`500 ${size}px system-ui`;lines=[''];
      for(const word of b.text.join('').split(' ')){
        let line=lines.length-1;
        if(c.measureText(lines[line]+word).width>548&&lines[line]){lines.push('');line++;}
        for(const ch of Array.from(word+' ')){
          if(c.measureText(lines[line]+ch).width>548){lines.push('');line++;}
          lines[line]+=ch;
        }
      }
      if(lines.length<=5)break;
    }
    const height=85+Math.min(5,lines.length)*40;
    if(b.canvas.height!==height)b.canvas.height=height;
    c.clearRect(0,0,640,height);
    c.fillStyle='#fff5df';c.beginPath();c.roundRect(12,8,616,height-36,28);c.fill();
    c.beginPath();c.moveTo(298,height-30);c.lineTo(320,height-4);c.lineTo(342,height-30);c.fill();
    c.fillStyle='#ac6878';c.font='22px system-ui';c.fillText('♥',34,38);
    c.font=`500 ${fontSize}px system-ui`;c.fillStyle='#3d3840';
    b.sprite.scale.set(2,2*height/640,1);
    let left=n;lines.slice(0,5).forEach((line,i)=>{const chars=Array.from(line);c.fillText(chars.slice(0,Math.max(0,left)).join(''),42,74+i*40);left-=chars.length;});
    upload(b,n);
  }
  function update(){
    const now=performance.now();camera.getWorldPosition(eye);
    for(const [user,b] of bubbles){
      if(!b.text)continue;
      const anchor=getAnchor(user),age=now-b.born,typing=reduced.matches||b.emoji?0:b.text.length*28,end=typing+b.duration;
      if(!anchor||age>end+650){b.sprite.visible=false;continue;}
      const n=reduced.matches||b.emoji?b.text.length:Math.min(b.text.length,Math.floor(age/28));
      if(n!==b.last)paint(b,n);
      anchor.getWorldPosition(b.sprite.position);const distance=eye.distanceTo(b.sprite.position);
      b.sprite.position.y+=(Math.abs(anchor.rotation.x)>1?1.1:b.emoji?2.10:2.65)+b.sprite.scale.y/2;
      const proximity=1-THREE.MathUtils.smoothstep(distance,9,13);
      b.sprite.visible=proximity>0;
      b.sprite.material.opacity=proximity*THREE.MathUtils.smoothstep(age,0,180)*(1-THREE.MathUtils.smoothstep(age,end,end+650));
      if(b.sprite.visible&&!b.sounded){onSound();b.sounded=true;}
    }
  }
  return {show,update};
}
