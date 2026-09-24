import * as THREE from 'three';

let embroidery,weave,bodice;
export function dressTextures(){
  if(embroidery)return {embroidery,weave,bodice};
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const c=canvas.getContext('2d');c.fillStyle='#e3a1b8';c.fillRect(0,0,1024,1024);
  c.lineCap='round';c.lineJoin='round';
  // Ivory stitches remain legible against pink at normal viewing distance.
  const repeats=12,step=1024/repeats;
  c.strokeStyle='#fff0df';c.lineWidth=3.2;c.setLineDash([4,2]);
  c.beginPath();
  for(let x=0;x<=1024;x+=2){const y=857+16*Math.cos(x/step*Math.PI*2);if(x===0)c.moveTo(x,y);else c.lineTo(x,y);}
  c.stroke();c.setLineDash([]);
  function leaf(x,y,angle){
    c.save();c.translate(x,y);c.rotate(angle);
    c.fillStyle='#f5ded5';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-8,-9,0,-21);c.quadraticCurveTo(8,-9,0,0);c.fill();
    c.strokeStyle='#f5dcd5';c.lineWidth=1;c.beginPath();c.moveTo(0,-2);c.lineTo(0,-17);c.stroke();c.restore();
  }
  for(let i=0;i<repeats;i++){
    const x=(i+.5)*step,y=815;
    c.strokeStyle='#fff0df';c.lineWidth=2.8;c.beginPath();c.moveTo(x,843);c.quadraticCurveTo(x-4,833,x,y+7);c.stroke();
    leaf(x-1,837,-.85);leaf(x+1,834,.85);
    for(let p=0;p<5;p++){
      const a=p/5*Math.PI*2;
      c.save();c.translate(x+Math.sin(a)*6,y+Math.cos(a)*10);c.rotate(-a);
      c.fillStyle='#fff2df';c.beginPath();c.ellipse(0,0,4.5,9.5,0,0,Math.PI*2);c.fill();
      c.strokeStyle='#dfacb5';c.lineWidth=.7;c.stroke();c.restore();
    }
    c.fillStyle='#d4aa78';c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill();
    // A sparse tone-on-tone sprig above the main embroidery.
    if(i%2===0){leaf(x,637,-.35);leaf(x,642,.6);}
  }
  c.strokeStyle='#f8e2d9';c.lineWidth=2.2;c.setLineDash([4,4]);
  for(const y of [956,967]){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();}
  embroidery=new THREE.CanvasTexture(canvas);embroidery.colorSpace=THREE.SRGBColorSpace;
  embroidery.wrapS=THREE.RepeatWrapping;embroidery.anisotropy=4;
  const fabric=document.createElement('canvas');fabric.width=fabric.height=64;
  const f=fabric.getContext('2d');f.fillStyle='#808080';f.fillRect(0,0,64,64);
  for(let i=0;i<64;i+=4){
    f.fillStyle='#888888';f.fillRect(i,0,1,64);
    f.fillStyle='#787878';f.fillRect(0,i,64,1);
  }
  weave=new THREE.CanvasTexture(fabric);weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(12,12);weave.anisotropy=4;
  const front=document.createElement('canvas');front.width=1024;front.height=512;
  const b=front.getContext('2d');b.fillStyle='#d991ac';b.fillRect(0,0,1024,512);
  b.lineCap='round';b.lineJoin='round';b.strokeStyle='#fff0df';b.lineWidth=4;
  // One restrained climbing floral motif, printed only on the front.
  b.beginPath();b.moveTo(478,432);b.bezierCurveTo(574,385,456,326,524,253);b.bezierCurveTo(576,207,543,169,513,187);b.stroke();
  function petal(x,y,angle,length=19){
    b.save();b.translate(x,y);b.rotate(angle);b.fillStyle='#f8e0d7';b.beginPath();b.moveTo(0,0);b.quadraticCurveTo(-12,-length*.5,0,-length);b.quadraticCurveTo(12,-length*.5,0,0);b.fill();b.restore();
  }
  for(const [x,y,a] of [[500,413,-.8],[515,391,.9],[514,342,-.95],[501,316,.75],[531,244,.9],[548,212,-.8]])petal(x,y,a);
  const roseX=503,roseY=351;
  for(let p=0;p<7;p++)petal(roseX+Math.sin(p/7*Math.PI*2)*10,roseY+Math.cos(p/7*Math.PI*2)*10,-p/7*Math.PI*2,23);
  b.strokeStyle='#fff0df';b.lineWidth=2;b.beginPath();
  for(let i=0;i<=70;i++){const a=i/70*Math.PI*4,r=1+i/70*11;const x=roseX+Math.cos(a)*r,y=roseY+Math.sin(a)*r;if(i===0)b.moveTo(x,y);else b.lineTo(x,y);}b.stroke();
  for(const [x,y] of [[462,286],[575,320],[474,229],[562,409]]){b.fillStyle='#eed0c8';b.beginPath();b.arc(x,y,2.2,0,Math.PI*2);b.fill();}
  bodice=new THREE.CanvasTexture(front);bodice.colorSpace=THREE.SRGBColorSpace;bodice.anisotropy=4;
  return {embroidery,weave,bodice};
}
