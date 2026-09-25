import * as THREE from 'three';
// Shared by the HUD, collection flights and the bundles on the island.
export function cashBundleGeometry(){
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
