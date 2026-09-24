import * as THREE from 'three';

const smoothstep=(a,b,v)=>THREE.MathUtils.smoothstep(v,a,b);
function wingRadius(a){
  const fore=.92*Math.exp(-(((a-.45)/.78)**2));
  const hind=.78*Math.exp(-(((a+.80)/.62)**2));
  const notch=.13*Math.exp(-(((a+.05)/.20)**2));
  return Math.max(fore+hind-notch,0);
}

export function makeWingGeometry(){
  const rings=[.07,.3,.55,.75,.88,.96,1],steps=34;
  const positions=[],colors=[],uvs=[],indices=[];
  for(let r=0;r<rings.length;r++)for(let s=0;s<=steps;s++){
    const a=1.55-(s/steps)*3.40,u=rings[r],radius=wingRadius(a)*u;
    positions.push(Math.cos(a)*radius,Math.sin(a)*radius,.07*u*u);
    // Polar UVs keep the fine veins radiating naturally from the hinge.
    uvs.push(u,s/steps);
    const edge=smoothstep(.78,1,u);
    let wash=(.26+1.00*smoothstep(0,.70,u))*(1-.62*edge)+.34*Math.exp(-(((u-.87)/.05)**2));
    wash+=.34*Math.exp(-(((u-.64)/.09)**2))*Math.exp(-(((a-.46)/.24)**2));
    colors.push(wash,wash*(.98-u*.07),wash*(.92-u*.17));
  }
  for(let r=0;r<rings.length-1;r++)for(let s=0;s<steps;s++){
    const i0=r*(steps+1)+s,i1=i0+1,i2=i0+steps+1,i3=i2+1;
    indices.push(i0,i2,i1,i1,i2,i3);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.rotateX(-Math.PI/2);geo.computeVertexNormals();
  return geo;
}

export function makeWingTexture(style=0){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,256,256);
  let seed=819+style*151;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // A neutral wash multiplies the existing pastel colour, without replacing it.
  c.lineCap='round';c.strokeStyle='rgba(70,55,65,.17)';c.lineWidth=1.4;
  for(let i=0;i<8;i++){
    const y=23+i*29+(random()-.5)*9;
    c.beginPath();c.moveTo(25,y);c.bezierCurveTo(90,y-3,153,y+3,235,y+(random()-.5)*11);c.stroke();
    c.strokeStyle='rgba(70,55,65,.09)';c.lineWidth=1;
    c.beginPath();c.moveTo(130,y);c.quadraticCurveTo(170,y+9,207,y+15);c.stroke();
    c.strokeStyle='rgba(70,55,65,.17)';c.lineWidth=1.4;
  }
  if(style!==0){
    for(let i=0;i<19;i++){
      const x=199+random()*25,y=15+random()*226;
      c.fillStyle='rgba(75,57,63,.16)';c.beginPath();c.ellipse(x,y,2+random()*2,1.5+random()*2,0,0,Math.PI*2);c.fill();
    }
  }
  if(style===2){
    for(const [x,y] of [[169,83],[176,176]]){
      c.strokeStyle='rgba(78,57,68,.24)';c.lineWidth=3;
      c.beginPath();c.ellipse(x,y,9,6,0,0,Math.PI*2);c.stroke();
      c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(x,y,4,2.5,0,0,Math.PI*2);c.fill();
    }
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.name=`Soft butterfly wing markings ${style+1}`;return texture;
}
