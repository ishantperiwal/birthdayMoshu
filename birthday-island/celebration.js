import { buildCelebrationStage, STAGE_HEIGHT } from './celebration-stage.js';
import * as THREE from 'three';

// Small handmade decorations, generated locally like the rest of the island.
export function buildCelebration({scene, terrainHeight, lampSites, glowTexture}) {
  const wood=new THREE.MeshStandardMaterial({color:0x67513e,roughness:.70});
  const brass=new THREE.MeshStandardMaterial({color:0xb6945d,roughness:.36,metalness:.25});
  const paper=new THREE.MeshStandardMaterial({color:0xffe8b5,emissive:0xffbe66,emissiveIntensity:.6,roughness:.95});
  const lamps=[],decorRoots=[];
  const mesh=(geo,mat,x,y,z,parent)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);if(parent===scene)decorRoots.push(o);return o;};
  const cylinder=(rt,rb,h,mat,x,y,z,parent,n=10)=>mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat,x,y,z,parent);
  const box=(x,y,z,mat,px,py,pz,parent)=>mesh(new THREE.BoxGeometry(x,y,z),mat,px,py,pz,parent);
  const at=(x,z)=>{const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);scene.add(g);decorRoots.push(g);return g;};

  for(const [x,z,height] of lampSites){
    const g=at(x,z), y=height;
    cylinder(.20,.27,.12,wood,0,.06,0,g);
    cylinder(.048,.075,y-.18,wood,0,(y-.18)/2,0,g);
    const core=box(.32,.44,.32,paper,0,y,0,g);core.castShadow=false;
    for(const sx of [-1,1])for(const sz of [-1,1])box(.032,.51,.032,wood,sx*.18,y,sz*.18,g);
    box(.45,.055,.45,wood,0,y-.26,0,g);
    const roof=cylinder(.05,.36,.19,wood,0,y+.33,0,g,4);roof.rotation.y=Math.PI/4;
    cylinder(.04,.045,.07,brass,0,y+.46,0,g);
    const haloMat=new THREE.SpriteMaterial({map:glowTexture,color:0xffcc83,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
    const halo=new THREE.Sprite(haloMat);halo.position.y=y;halo.scale.set(1.7,1.7,1);g.add(halo);
    // Standard-material props receive real local light. Grass uses these same
    // fixture positions in its shared shader, avoiding hundreds of shadow maps.
    const light=new THREE.PointLight(0xffcf91,0,6.4,2);light.position.y=y;g.add(light);
    lamps.push({light,haloMat});
  }

  // Soft light from the fairy-light canopy keeps the cake readable. No standing
  // or hanging lanterns occupy the clearing itself.
  const centreLight=new THREE.PointLight(0xffd5a3,0,6,2);
  centreLight.position.set(-8,terrainHeight(-8,-10)+2.9,-10);scene.add(centreLight);

  const cakeFill=new THREE.PointLight(0xffe6c8,0,7,2);
  cakeFill.position.set(-6.5,terrainHeight(-8,-10)+2.5,-6.5);scene.add(cakeFill);

  buildCelebrationStage(scene,terrainHeight(-8,-10));
  // Just a few stepping stones at the entrance, leaving the clearing open.
  const stoneMat=new THREE.MeshStandardMaterial({color:0xb8b1a0,roughness:1});
  const stoneGeo=new THREE.CylinderGeometry(1,1,.055,7);
  const stones=[];
  for(let i=0;i<5;i++)stones.push([-5.1+Math.sin(i*.75)*.35,-3.0-i*.8,.32+(i%3)*.04]);
  for(let i=0;i<stones.length;i++){
    const [x,z,r]=stones[i];const o=mesh(stoneGeo,stoneMat,x,terrainHeight(x,z)+.045,z,scene);
    o.scale.set(r,1,r*.74);o.rotation.y=i*2.39;
  }

  // Batch the remaining stationary decorations by material.
  scene.updateMatrixWorld(true);
  const batches=new Map(),retired=new Set();
  for(const root of decorRoots)root.traverse(o=>{
    if(!o.isMesh || o.children.length)return;
    const key=o.material.uuid+':'+o.castShadow;
    if(!batches.has(key))batches.set(key,{material:o.material,cast:o.castShadow,meshes:[]});
    batches.get(key).meshes.push(o);
  });
  for(const {material,cast,meshes} of batches.values()){
    const positions=[],normals=[],uvs=[],indices=[];
    for(const o of meshes){
      const g=o.geometry.clone().applyMatrix4(o.matrixWorld),base=positions.length/3;
      for(const v of g.attributes.position.array)positions.push(v);
      for(const v of g.attributes.normal.array)normals.push(v);
      for(const v of g.attributes.uv.array)uvs.push(v);
      if(g.index)for(const i of g.index.array)indices.push(i+base);
      else for(let i=0;i<g.attributes.position.count;i++)indices.push(i+base);
      g.dispose();retired.add(o.geometry);o.removeFromParent();
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);
    const batch=new THREE.Mesh(g,material);batch.castShadow=cast;batch.receiveShadow=true;scene.add(batch);
  }
  for(const g of retired)g.dispose();

  return {update(time,night){
    paper.emissiveIntensity=.28+night*1.65;
    centreLight.intensity=.8+night*11;
    cakeFill.intensity=.3+night*5;
    lamps.forEach(({light,haloMat},i)=>{
      const breath=1+Math.sin(time*.85+i*1.9)*.025;
      light.intensity=(.15+night*6)*breath;haloMat.opacity=night*.14;
    });
  }};
}
