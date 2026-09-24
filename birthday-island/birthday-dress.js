import * as THREE from 'three';
import {roundedToyBox} from './rounded-toy-box.js';
import {bodiceFront,refineClothGeometry} from './dress-bodice.js';

export const BIRTHDAY_ROSE=0xd991ac;

// Occasion details use the existing body rig, including the first-person pose.
export function dressBirthday(root,arms,legs,cloth){
  const make=(color,roughness=.65)=>new THREE.MeshStandardMaterial({color,roughness,emissive:color,emissiveIntensity:.045});
  const ivory=make(0xffecd6),ribbon=make(0xd58da6,.42),trim=make(0xeeb3c6,.42),gold=make(0xcba56c,.46);
  cloth.roughness=.68;cloth.emissiveIntensity=.065;
  function add(geometry,material,x,y,z,parent=root,name='birthday dress detail'){
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);
    mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function oval(material,x,y,z,sx,sy,sz,parent=root){
    const mesh=add(new THREE.SphereGeometry(1,16,10),material,x,y,z,parent);
    mesh.scale.set(sx,sy,sz);return mesh;
  }
  function skirtPoint(t,a,offset=0){
    const pleat=.008*t*t*Math.cos(12*a+.25);
    const s=Math.sin(a),c=Math.cos(a),roundness=1-.4*t;
    const flare=1-(1-t)**1.2;
    return new THREE.Vector3(Math.sign(s)*Math.abs(s)**roundness*(.219+.185*flare+pleat+offset),
      .80-.34*t+.004*t*t*Math.sin(3*a),
      -Math.sign(c)*Math.abs(c)**roundness*(.153+(c<0?.087:.137)*flare+pleat+offset));
  }
  function skirtSection(from,to,material,offset=0){
    const positions=[],indices=[],segments=80,rings=12;
    for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
      positions.push(...skirtPoint(THREE.MathUtils.lerp(from,to,j/rings),i/segments*Math.PI*2,offset).toArray());
    }
    for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
      const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    material.side=THREE.DoubleSide;
    return add(geometry,material,0,0,0,root,'softly pleated birthday skirt');
  }
  skirtSection(0,1,cloth);
  // Close the join between the fitted bodice and flared skirt.
  const waistPositions=[0,.8,0],waistIndices=[];
  for(let i=0;i<=80;i++)waistPositions.push(...skirtPoint(0,i/80*Math.PI*2).toArray());
  for(let i=0;i<80;i++)waistIndices.push(0,i+2,i+1);
  const waistJoin=new THREE.BufferGeometry();
  waistJoin.setAttribute('position',new THREE.Float32BufferAttribute(waistPositions,3));
  waistJoin.setIndex(waistIndices);waistJoin.computeVertexNormals();
  add(waistJoin,cloth,0,0,0,root,'continuous dress waist');
  skirtSection(.948,.98,ivory,.0015);
  // A continuous second skirt tier with the same drop all around the waist.
  const overlayPositions=[],overlayIndices=[],overlayColumns=96,overlayRows=14;
  const overlayHem=[];
  for(let j=0;j<=overlayRows;j++)for(let i=0;i<=overlayColumns;i++){
    const a=i/overlayColumns*Math.PI*2;
    const t=j/overlayRows*.64,p=skirtPoint(t,a,.005);
    p.y=.80-.34*t;overlayPositions.push(...p.toArray());
    if(j===overlayRows&&i<overlayColumns)overlayHem.push(p);
  }
  for(let j=0;j<overlayRows;j++)for(let i=0;i<overlayColumns;i++){
    const a=j*(overlayColumns+1)+i,b=a+overlayColumns+1;overlayIndices.push(a,a+1,b,a+1,b+1,b);
  }
  const overlayGeometry=new THREE.BufferGeometry();overlayGeometry.setAttribute('position',new THREE.Float32BufferAttribute(overlayPositions,3));
  overlayGeometry.setIndex(overlayIndices);overlayGeometry.computeVertexNormals();
  const overlayMaterial=make(0xe3a1b8,.72);overlayMaterial.side=THREE.DoubleSide;
  add(overlayGeometry,overlayMaterial,0,0,0,root,'continuous upper skirt tier');
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(overlayHem,true),128,.0018,6,true),trim,0,0,0,root,'continuous upper tier hem');
  // A plain, softly edged satin ribbon follows the oval waist.
  const beltPositions=[],beltIndices=[],around=96,cross=12;
  for(let i=0;i<=around;i++)for(let j=0;j<=cross;j++){
    const a=i/around*Math.PI*2,b=j/cross*Math.PI*2;
    beltPositions.push(Math.sin(a)*(.225+.003*Math.cos(b)),.802+.013*Math.sin(b),-Math.cos(a)*(.158+.003*Math.cos(b)));
  }
  for(let i=0;i<around;i++)for(let j=0;j<cross;j++){
    const a=i*(cross+1)+j,b=a+cross+1;beltIndices.push(a,a+1,b,a+1,b+1,b);
  }
  const beltGeometry=new THREE.BufferGeometry();beltGeometry.setAttribute('position',new THREE.Float32BufferAttribute(beltPositions,3));
  beltGeometry.setIndex(beltIndices);beltGeometry.computeVertexNormals();
  ribbon.side=THREE.DoubleSide;
  add(beltGeometry,ribbon,0,0,0,root,'simple oval waist ribbon');

  // Restore the compact bow silhouette, with filled folds that read from above.
  const bow=new THREE.Group();bow.position.set(-.095,.802,-.146);bow.rotation.y=.30;root.add(bow);
  const ribbonShape=(shape,depth=.008)=>refineClothGeometry(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.003,bevelThickness:.003,curveSegments:16}));
  for(const side of [-1,1]){
    const outline=new THREE.Shape();outline.moveTo(.006,.008);
    outline.bezierCurveTo(.031,.022,.078,.050,.091,.037);
    outline.bezierCurveTo(.105,.023,.102,-.030,.086,-.035);
    outline.bezierCurveTo(.069,-.040,.030,-.020,.006,-.009);outline.closePath();
    const geometry=ribbonShape(outline),positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const t=THREE.MathUtils.clamp(positions.getX(i)/.103,0,1);
      positions.setZ(i,positions.getZ(i)-.013*Math.sin(Math.PI*t));
    }
    geometry.computeVertexNormals();
    const loop=add(geometry,ribbon,0,0,-.012,bow,'soft filled bow loop');loop.scale.x=side;
    const tailShape=new THREE.Shape();tailShape.moveTo(.004,-.008);
    tailShape.bezierCurveTo(.012,-.034,.012,-.065,.020,-.095);
    tailShape.lineTo(.032,-.081);tailShape.lineTo(.045,-.091);
    tailShape.bezierCurveTo(.035,-.063,.032,-.030,.020,-.008);tailShape.closePath();
    const tailGeometry=ribbonShape(tailShape,.005),tailPositions=tailGeometry.attributes.position;
    for(let i=0;i<tailPositions.count;i++){
      const t=THREE.MathUtils.clamp(-tailPositions.getY(i)/.095,0,1);
      tailPositions.setZ(i,tailPositions.getZ(i)-.058*t-.005*Math.sin(t*Math.PI));
    }
    tailGeometry.computeVertexNormals();
    const tail=add(tailGeometry,ribbon,0,-.002,0,bow,'tapered ribbon tail');tail.scale.x=side;
  }
  oval(ribbon,0,0,-.018,.014,.018,.014,bow);

  // Two shaped Peter Pan collar leaves follow the chest instead of floating.
  for(const side of [-1,1]){
    const shape=new THREE.Shape();shape.moveTo(.006,1.193);
    shape.bezierCurveTo(.042,1.187,.078,1.197,.104,1.190);
    shape.bezierCurveTo(.122,1.182,.147,1.163,.140,1.146);
    shape.bezierCurveTo(.130,1.121,.095,1.120,.071,1.133);
    shape.bezierCurveTo(.038,1.148,.018,1.174,.006,1.193);
    const geometry=refineClothGeometry(new THREE.ExtrudeGeometry(shape,{depth:.005,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2,curveSegments:20}));
    const positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i)*side,y=positions.getY(i);
      positions.setXYZ(i,x,y,bodiceFront(x,y)-.006-positions.getZ(i));
    }
    geometry.computeVertexNormals();
    const collarMaterial=ivory.clone();collarMaterial.side=THREE.DoubleSide;
    add(geometry,collarMaterial,0,0,0,root,'curved ivory collar');
  }
  // Flat, rimmed four-hole buttons with tiny rose stitches.
  const buttonOutline=new THREE.Shape();buttonOutline.absarc(0,0,.0125,0,Math.PI*2,false);
  for(const x of [-.004,.004])for(const y of [-.004,.004]){
    const hole=new THREE.Path();hole.absarc(x,y,.0025,0,Math.PI*2,true);buttonOutline.holes.push(hole);
  }
  const buttonGeometry=new THREE.ExtrudeGeometry(buttonOutline,{depth:.003,bevelEnabled:true,bevelSize:.0006,bevelThickness:.0006,bevelSegments:2,steps:1,curveSegments:16});
  const buttonRim=new THREE.TorusGeometry(.0109,.00085,6,32);
  const stitchMaterial=make(0xaf607e,.85);
  for(const y of [1.088,1.026,.964]){
    const button=new THREE.Group();button.position.set(0,y,bodiceFront(0,y)-.008);root.add(button);
    button.name='sewn ivory four-hole button';
    add(buttonGeometry,ivory,0,0,0,button,'flat button face');
    add(buttonRim,ivory,0,0,-.001,button,'raised button rim');
    for(const row of [-.004,.004]){
      const stitch=new THREE.CatmullRomCurve3([new THREE.Vector3(-.004,row,.001),new THREE.Vector3(0,row,-.0018),new THREE.Vector3(.004,row,.001)]);
      add(new THREE.TubeGeometry(stitch,8,.0007,5,false),stitchMaterial,0,0,0,button,'rose button stitch');
    }
  }

  // Five tiny embroidered daisies follow the skirt surface above the hem.
  for(const a of [-.85,-.43,0,.43,.85]){
    const group=new THREE.Group();group.position.copy(skirtPoint(.84+.015*Math.cos(a*5),a,.005));
    group.rotation.y=-a;root.add(group);group.name='ivory daisy embroidery';
    for(let p=0;p<5;p++){
      const angle=p/5*Math.PI*2;
      const petal=oval(ivory,Math.sin(angle)*.012,Math.cos(angle)*.012,0,.006,.01,.003,group);
      petal.rotation.z=-angle;
    }
    oval(gold,0,0,-.004,.006,.006,.004,group);
  }
  for(const arm of arms){
    add(new THREE.CylinderGeometry(.099,.099,.02,24),ivory,0,-.154,0,arm,'ivory half-sleeve cuff');
  }
  for(const leg of legs){
    add(roundedToyBox(.23,.016,.042,.008),trim,0,-.54,-.075,leg,'ballet shoe strap');
    oval(gold,0,-.532,-.081,.011,.006,.012,leg);
  }
}
