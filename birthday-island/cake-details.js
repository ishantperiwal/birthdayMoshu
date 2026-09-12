import * as THREE from 'three';

// A quiet contour pattern for the tabletop, generated without image assets.
export function cakeTableMaterials(edgeMaterial) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(512,512);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const u=(x-256)/256,v=(y-256)/256;
    const field=Math.sqrt((u+.16*Math.sin(v*3.1))**2*.8+(v+.12*Math.sin(u*4.2))**2)
      +.055*Math.sin(u*6.0+v*2.2)+.035*Math.cos(v*7.0-u*1.9);
    const contour=Math.abs(Math.sin(field*39.0));
    const line=1-Math.min(1,contour/.15);
    const tooth=Math.sin(x*1.7+y*2.1)*.7;
    const i=(y*512+x)*4;
    pixels.data[i]=222-line*29+tooth;
    pixels.data[i+1]=202-line*30+tooth;
    pixels.data[i+2]=172-line*27+tooth;
    pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const top=new THREE.MeshStandardMaterial({map,roughness:.88});
  // Cylinder cap groups use their own UVs: the contour pattern stays on top.
  return [edgeMaterial,top,edgeMaterial];
}

export function decorateCake(party,icingMaterial){
  const berryMaterial=new THREE.MeshStandardMaterial({color:0xb85465,roughness:.75});
  const leafMaterial=new THREE.MeshStandardMaterial({color:0x7b985e,roughness:.92});
  const add=(geometry,material,x,y,z)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);
    mesh.castShadow=true;mesh.receiveShadow=true;party.add(mesh);return mesh;
  };
  const pearlGeometry=new THREE.SphereGeometry(.024,8,6);
  // Soft scalloped frosting, with slightly uneven drips along each tier.
  for(const [radius,top,depth,phase] of [[.566,1.077,.055,0],[.406,1.377,.045,.8]]){
    add(new THREE.CylinderGeometry(radius,radius,.018,64),icingMaterial,0,top,0);
    const positions=[],indices=[],steps=96;
    for(let i=0;i<=steps;i++){
      const a=i/steps*Math.PI*2;
      const drip=Math.pow(.5+.5*Math.sin(a*11+phase+.35*Math.sin(a*3)),3);
      const bottom=top-.022-depth*drip;
      positions.push(Math.cos(a)*radius,top,Math.sin(a)*radius,
        Math.cos(a)*(radius+.004),bottom,Math.sin(a)*(radius+.004));
      if(i<steps){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    // Both faces render so the scalloped lip reads correctly from above.
    geo.setIndex(indices);geo.computeVertexNormals();
    const frosting=icingMaterial.clone();frosting.side=THREE.DoubleSide;
    add(geo,frosting,0,0,0);
  }
  // A single piped border at the base and a light crown around the candles.
  for(const [radius,y,count] of [[.578,.70,32],[.379,1.40,24]]){
    for(let i=0;i<count;i++){
      const a=i/count*Math.PI*2;
      const pearl=add(pearlGeometry,icingMaterial,Math.cos(a)*radius,y,Math.sin(a)*radius);
      pearl.scale.y=.8;
    }
  }
  const berryGeometry=new THREE.SphereGeometry(.038,10,8);
  const leafGeometry=new THREE.SphereGeometry(1,8,6);
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2+.3;
    const x=Math.cos(a)*.489,z=Math.sin(a)*.489;
    const berry=add(berryGeometry,berryMaterial,x,1.12,z);berry.scale.set(1,1.24,.9);
    const leaf=add(leafGeometry,leafMaterial,x+.033,1.091,z+.014);
    leaf.scale.set(.038,.009,.014);leaf.rotation.y=-a;
  }
}
