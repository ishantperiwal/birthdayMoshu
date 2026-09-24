import {dressDateSuit} from './date-suit.js?v=5';
import {dressBirthday,BIRTHDAY_ROSE} from './birthday-dress.js?v=5';
import { legoHairMesh } from './assets/lego-hair.js?v=1';
import { roundedSleeve } from './rounded-sleeve.js';
import { roundedToyBox } from './rounded-toy-box.js';
import {birthdayBodice} from './dress-bodice.js';
import {softHeadGeometry,softFaceGeometry} from './soft-head.js?v=2';
import { buildHandPose } from './hand-pose.js?v=9';
import { hairMesh } from './assets/reference-hair.js?v=1';
import * as THREE from 'three';

export function buildCharacter(parent,options={}){
  const birthday=!options.shortHair&&!options.suit;
  const topColor=options.top??(birthday?BIRTHDAY_ROSE:0xeb94ad);
  const root=new THREE.Group();root.scale.setScalar(.78);parent.add(root);
  const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.30,metalness:0,emissive:color,emissiveIntensity:.11});
  const skin=mat(0xf6cc77),hair=mat(0x704630),pink=mat(topColor),cream=mat(options.trousers??(birthday?0xffecd6:0xf1dfbf)),shoe=mat(options.shoes??(birthday?0xbe8792:0x806477));
  if(birthday){skin.roughness=.5;skin.emissiveIntensity=.08;}
  const add=(geo,m,x,y,z,p=root)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;};
  const box=(w,h,d,m,x,y,z,p)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
  const legs=[];for(const x of [-.145,.145]){
    const leg=new THREE.Group();leg.position.set(x,.65,0);root.add(leg);legs.push(leg);
    const shoeHeight=options.shortHair?.10:birthday?.11:.18,legHeight=.65-shoeHeight;
    add(roundedToyBox(.25,legHeight,.26,.018),cream,0,-legHeight/2,0,leg);
    add(roundedToyBox(.26,shoeHeight,.36,.018),shoe,0,-.65+shoeHeight/2,-.045,leg);
  }
  if(!birthday)add(roundedToyBox(.57,.12,.32,.018),options.waistMatchesTrousers?cream:pink,0,.68,0);
  if(birthday)add(birthdayBodice(),pink,0,0,0);
  else add(roundedToyBox(.57,.49,.32,.035,.48),pink,0,.96,0);
  if(options.suit){pink.roughness=.62;cream.roughness=.66;shoe.roughness=.24;shoe.emissiveIntensity=.025;}
  // Preserve the original jumper collar for the other outfit.
  if(!options.suit&&!birthday)for(const x of [-.09,.09]){const collar=box(.16,.07,.025,cream,x,1.16,-.19);collar.rotation.z=x<0?-.25:.25;}
  const arms=[];for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.36,1.14,0);arm.rotation.z=side*.12;root.add(arm);arms.push(arm);
    // Extend the suit arm from the shoulder, preserving the cuff-to-hand fit.
    add(roundedSleeve(.105,.095,options.suit?.40:.35),pink,0,options.suit?-.175:-.15,0,arm);
    const hand=add(new THREE.TorusGeometry(.087,.037,6,14,Math.PI*1.6),skin,0,options.suit?-.49:-.39,0,arm);hand.rotation.z=-Math.PI*.3;
  }
  if(options.suit)dressDateSuit(root,arms);
  if(birthday)dressBirthday(root,arms,legs,pink);
  const neck=add(new THREE.CylinderGeometry(.11,.11,.1,32),skin,0,1.25,0);
  if(birthday){
    // Separate cloth ring around the neck, with a small seam above the bodice.
    const ring=[[.111,-.032],[.118,-.032],[.121,-.028],[.121,.010],[.118,.014],[.111,.014],[.111,-.032]];
    add(new THREE.LatheGeometry(ring.map(([r,y])=>new THREE.Vector2(r,y)),48),pink,0,0,0,neck);
  }
  const headStart=root.children.length;
  const profile=[new THREE.Vector2(0,-.195)];
  for(let i=0;i<=6;i++){const a=-Math.PI/2+i/6*Math.PI/2;profile.push(new THREE.Vector2(.205+.045*Math.cos(a),-.15+.045*Math.sin(a)));}
  for(let i=0;i<=6;i++){const a=i/6*Math.PI/2;profile.push(new THREE.Vector2(.205+.045*Math.cos(a),.15+.045*Math.sin(a)));}
  profile.push(new THREE.Vector2(0,.195));
  add(options.shortHair?new THREE.LatheGeometry(profile,32):softHeadGeometry(),skin,0,1.49,0);
  if(options.shortHair){
    // Small molded ears overlap the head so their roots read as part of it.
    for(const side of [-1,1]){
      const ear=add(new THREE.SphereGeometry(1,20,14),skin,side*.25,1.48,-.02);
      ear.scale.set(.06,.067,.04);
    }
    const guyHair=mat(0x25201e);guyHair.roughness=.66;guyHair.emissiveIntensity=.025;
    guyHair.side=THREE.DoubleSide;
    const shape=new THREE.BufferGeometry();
    shape.setAttribute('position',new THREE.Float32BufferAttribute(legoHairMesh.positions,3));
    shape.setAttribute('normal',new THREE.Float32BufferAttribute(legoHairMesh.normals,3));
    shape.setIndex(legoHairMesh.indices);
    add(shape,guyHair,0,-.075,0);
  }else{
  // Sculpted in Blender, fused and simplified into one static mesh.
  const hairShape=new THREE.BufferGeometry();
  hairShape.setAttribute('position',new THREE.Float32BufferAttribute(hairMesh.positions,3));
  hairShape.setAttribute('normal',new THREE.Float32BufferAttribute(hairMesh.normals,3));
  hairShape.setIndex(hairMesh.indices);
  // Slightly lengthen the hair around the head center, then lower its fit.
  hairShape.translate(0,-1.49,0);hairShape.scale(1,1.05,1);hairShape.translate(0,1.455,0);
  hair.color.setHex(0x302117);hair.emissive.setHex(0x302117);
  hair.emissiveIntensity=.025;hair.roughness=.48;
  add(hairShape,hair,0,0,0);
  }
  // Keep his simple printed smile; her supplied decal follows the rounded head.
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=192;
  const c=canvas.getContext('2d');
  c.fillStyle='#342b2b';for(const x of [83,173]){c.beginPath();c.ellipse(x,79,10,14,0,0,Math.PI*2);c.fill();c.fillStyle='#fff2d5';c.beginPath();c.arc(x-3,74,3,0,Math.PI*2);c.fill();c.fillStyle='#342b2b';}
  c.strokeStyle='#71493c';c.lineWidth=5;c.lineCap='round';c.beginPath();c.arc(128,101,23,.15,Math.PI-.15);c.stroke();
  c.fillStyle='rgba(227,124,121,.48)';for(const x of [57,199]){c.beginPath();c.ellipse(x,110,16,8,0,0,Math.PI*2);c.fill();}
  const texture=options.shortHair?new THREE.CanvasTexture(canvas):new THREE.TextureLoader().load(new URL('./manualAssets/faceDecal.png',import.meta.url).href);
  texture.colorSpace=THREE.SRGBColorSpace;
  const face=new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:.4});
  add(options.shortHair?new THREE.CylinderGeometry(.252,.252,.34,24,1,true,Math.PI-.86,1.72):softFaceGeometry(),face,0,1.49,0);
  const head=new THREE.Group();head.position.y=1.28;
  for(const part of root.children.slice(headStart)){root.remove(part);part.position.y-=1.28;head.add(part);}root.add(head);
  if(!options.shortHair)head.scale.setScalar(.9);
  const down=new THREE.Vector3(0,-1,0),pointDirection=new THREE.Vector3(),pointRotation=new THREE.Quaternion();
  let stride=0,blend=0,pointBlend=0,waveBlend=0,previousHandAmount=0,releasingHand=false;
  const heldArm=options.shortHair?0:1;
  const handPose=buildHandPose(root,{color:topColor,shoulder:[heldArm? .36:-.36,1.14,0],side:heldArm?1:-1,sleeveLength:options.shortHair?.38:null});
  const throwStone=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),mat(0xd1dbe5));throwStone.scale.set(.075,.035,.055);throwStone.position.set(.025,options.suit?-.49:-.39,-.02);throwStone.visible=false;arms[1].add(throwStone);
  return {root,get pointingAmount(){return pointBlend;},setFirstPerson(value){head.visible=!value;},
    poseThrow(age){
      throwStone.visible=age>=0&&age<.42;
      if(age<0)return;
      const wind=Math.min(age/.26,1),snap=THREE.MathUtils.smoothstep(age,.26,.49),recover=THREE.MathUtils.smoothstep(age,.55,.95);
      arms[1].rotation.set(THREE.MathUtils.lerp(-1.05*wind+2.65*snap,0,recover),0,.22*(1-recover)+.12*recover);
    },
    throwOrigin(target){return throwStone.getWorldPosition(target);},
    poseHand(target,amount,rotation){
    handPose.update(target,amount,rotation);
    if(amount<previousHandAmount-.000001)releasingHand=true;
    else if(amount>previousHandAmount+.000001)releasingHand=false;
    previousHandAmount=amount;
    // On release restore the familiar hand after only 15% of the return,
    // then keep lowering that original arm for the rest of the gesture.
    const useHoldingModel=amount>=(releasingHand?.85:.55);
    handPose.root.visible=useHoldingModel;
    arms[heldArm].visible=!useHoldingModel;
    if(amount>.001&&!useHoldingModel)arms[heldArm].quaternion.setFromUnitVectors(down,handPose.aim);
  },wearHat(hat){head.add(hat);hat.position.set(0,(options.shortHair?1.82:1.88)-1.28,0);hat.rotation.set(0,0,-.08);hat.scale.setScalar(1.65);},update(dt,moving,running,cheer=0,attention=null){blend=THREE.MathUtils.lerp(blend,moving?1:0,1-Math.exp(-dt*12));stride+=dt*(running?13:9);legs.forEach((leg,i)=>leg.rotation.x=Math.sin(stride+i*Math.PI)*(birthday?.30:.55)*blend);arms.forEach((arm,i)=>{arm.rotation.x=-Math.sin(stride+i*Math.PI)*.45*blend-cheer*1.7;arm.rotation.z=(i===0?-1:1)*(.12+cheer*.65);});root.position.y=Math.abs(Math.sin(stride))*.035*blend;
    waveBlend+=((attention?.wave?1:0)-waveBlend)*(1-Math.exp(-dt*7));
    if(waveBlend>.001){
      arms[1].rotation.x=THREE.MathUtils.lerp(arms[1].rotation.x,-.35,waveBlend);
      arms[1].rotation.z=THREE.MathUtils.lerp(arms[1].rotation.z,2.35+Math.sin(stride*1.3)*.30,waveBlend);
    }
    const ease=1-Math.exp(-dt*5);
    head.rotation.y+=((attention?.yaw??0)-head.rotation.y)*ease;
    head.rotation.x+=((attention?.pitch??0)-head.rotation.x)*ease;
    head.rotation.z+=((attention?.tilt??0)-head.rotation.z)*ease;
    pointBlend+=((attention?.point&&cheer<.1&&(!moving||attention?.manualPoint)?1:0)-pointBlend)*(1-Math.exp(-dt*6));
    if(attention?.direction&&pointBlend>.001){pointDirection.copy(attention.direction).normalize();pointRotation.setFromUnitVectors(down,pointDirection);arms[1].quaternion.slerp(pointRotation,pointBlend*.94);}
    if(!moving&&!cheer){arms.forEach((arm,i)=>arm.rotation.z+=(i?1:-1)*Math.sin(stride*.18)*.015*(1-pointBlend));}
}};
}
