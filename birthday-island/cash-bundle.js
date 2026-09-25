import * as THREE from 'three';
import {COIN_MODE} from './coin-mode.js';
// Shared by the HUD, collection flights and the bundles on the island.
// The pickup and card model: a cash bundle, or a plain gold coin in coin mode.
export function cashBundleGeometry(){return COIN_MODE?coinGeometry():bundleGeometry();}

// A simple gold coin facing ±z like the bundle: rim, faces, a raised ring and centre.
function coinGeometry(){
  const positions=[],colors=[],light=new THREE.Vector3(.2,.55,.8).normalize();
  function part(geometry,color){
    const g=geometry.toNonIndexed(),p=g.attributes.position,n=g.attributes.normal,base=new THREE.Color(color),normal=new THREE.Vector3();
    for(let i=0;i<p.count;i++){
      positions.push(p.getX(i),p.getY(i),p.getZ(i));normal.fromBufferAttribute(n,i);
      const shade=.62+.5*Math.max(0,normal.dot(light));colors.push(base.r*shade,base.g*shade,base.b*shade);
    }g.dispose();geometry.dispose();
  }
  const faceUp=g=>g.rotateX(Math.PI/2);
  part(faceUp(new THREE.CylinderGeometry(.34,.34,.075,40)),0xe7b84e);
  for(const side of [-1,1]){
    part(new THREE.TorusGeometry(.265,.022,8,40).translate(0,0,.038*side),0xffd873);
    part(faceUp(new THREE.CylinderGeometry(.13,.13,.012,28)).translate(0,0,.041*side),0xffdf85);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  return geometry;
}

function bundleGeometry(){
  const positions=[],colors=[];
  function part(w,h,d,x,y,z,color){
    const g=new THREE.BoxGeometry(w,h,d).toNonIndexed(),p=g.attributes.position,n=g.attributes.normal,base=new THREE.Color(color);
    for(let i=0;i<p.count;i++){
      positions.push(p.getX(i)+x,p.getY(i)+y,p.getZ(i)+z);
      const shade=.72+.22*Math.max(0,n.getY(i))+.26*Math.max(0,n.getZ(i))-.12*Math.max(0,n.getX(i));
      colors.push(base.r*shade,base.g*shade,base.b*shade);
    }g.dispose();
  }
  for(let i=0;i<4;i++)part(1,.49,.033,(i%2)*.016,0,(i-1.5)*.043,i%2?0x98b681:0x668961);
  for(const side of [-1,1]){part(.87,.38,.008,0,0,.086*side,0xc0d2a4);part(.77,.29,.009,0,0,.092*side,0x799d70);}
  // Exterior gold wrap, with broad faces and connecting edges. The green
  // print ends at z=.0965; both ribbon faces sit well outside it.
  for(const side of [-1,1]){
    part(.25,.535,.024,0,0,.137*side,0xffd76b);
    part(.25,.025,.298,0,.255*side,0,0xeac15b);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  return geometry;
}
