import { shortHairGeometry } from './short-hair.js';
import { roundedSleeve } from './rounded-sleeve.js';
import { roundedToyBox } from './rounded-toy-box.js';
import { buildHandPose } from './hand-pose.js?v=9';
import { hairMesh } from './assets/sculpted-hair.js?v=10';
import * as THREE from 'three';

export function buildCharacter(parent,options={}){
  const root=new THREE.Group();root.scale.setScalar(.78);parent.add(root);
  const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.30,metalness:0,emissive:color,emissiveIntensity:.11});
  const skin=mat(0xf6cc77),hair=mat(0x704630),pink=mat(options.top??0xeb94ad),cream=mat(options.trousers??0xf1dfbf),shoe=mat(options.shoes??0x806477);
  const add=(geo,m,x,y,z,p=root)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;};
  const box=(w,h,d,m,x,y,z,p)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
  const legs=[];for(const x of [-.145,.145]){
    const leg=new THREE.Group();leg.position.set(x,.65,0);root.add(leg);legs.push(leg);
    const shoeHeight=options.shortHair?.10:.18,legHeight=.65-shoeHeight;
    add(roundedToyBox(.25,legHeight,.26,.018),cream,0,-legHeight/2,0,leg);
    add(roundedToyBox(.26,shoeHeight,.36,.018),shoe,0,-.65+shoeHeight/2,-.045,leg);
  }
  add(roundedToyBox(.57,.12,.32,.018),pink,0,.68,0);
  add(roundedToyBox(.57,.49,.32,.035,.48),pink,0,.96,0);
  // A small cream collar and heart printed on the jumper.
  for(const x of [-.09,.09]){const collar=box(.16,.07,.025,cream,x,1.16,-.19);collar.rotation.z=x<0?-.25:.25;}
  const arms=[];for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.36,1.14,0);arm.rotation.z=side*.12;root.add(arm);arms.push(arm);
    add(roundedSleeve(.105,.095,.35),pink,0,-.15,0,arm);
    const hand=add(new THREE.TorusGeometry(.087,.037,6,14,Math.PI*1.6),skin,0,-.39,0,arm);hand.rotation.z=-Math.PI*.3;
  }
  add(new THREE.CylinderGeometry(.11,.11,.1,16),skin,0,1.25,0);
  const headStart=root.children.length;
  const profile=[new THREE.Vector2(0,-.195)];
  for(let i=0;i<=6;i++){const a=-Math.PI/2+i/6*Math.PI/2;profile.push(new THREE.Vector2(.205+.045*Math.cos(a),-.15+.045*Math.sin(a)));}
  for(let i=0;i<=6;i++){const a=i/6*Math.PI/2;profile.push(new THREE.Vector2(.205+.045*Math.cos(a),.15+.045*Math.sin(a)));}
  profile.push(new THREE.Vector2(0,.195));
  add(new THREE.LatheGeometry(profile,32),skin,0,1.49,0);
  if(!options.shortHair)add(new THREE.CylinderGeometry(.105,.105,.075,16),skin,0,1.72,0);
  if(options.shortHair){
    const shortHair=mat(0x25201e);shortHair.roughness=.34;shortHair.emissiveIntensity=.035;
    add(shortHairGeometry(),shortHair,0,0,0);
  }else{
  // Sculpted in Blender, fused and simplified into one static mesh.
  const hairShape=new THREE.BufferGeometry();
  hairShape.setAttribute('position',new THREE.Float32BufferAttribute(hairMesh.positions,3));
  hairShape.setAttribute('normal',new THREE.Float32BufferAttribute(hairMesh.normals,3));
  hairShape.setIndex(hairMesh.indices);
  hair.color.setHex(0x60351f);hair.emissive.setHex(0x60351f);
  hair.emissiveIntensity=.055;hair.roughness=.30;
  add(hairShape,hair,0,0,0);
  }
  // Transparent printed face follows the cylindrical head, with soft blush.
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=192;
  const c=canvas.getContext('2d');
  c.fillStyle='#342b2b';for(const x of [83,173]){c.beginPath();c.ellipse(x,79,10,14,0,0,Math.PI*2);c.fill();c.fillStyle='#fff2d5';c.beginPath();c.arc(x-3,74,3,0,Math.PI*2);c.fill();c.fillStyle='#342b2b';}
  c.strokeStyle='#71493c';c.lineWidth=5;c.lineCap='round';c.beginPath();c.arc(128,101,23,.15,Math.PI-.15);c.stroke();
  c.fillStyle='rgba(227,124,121,.48)';for(const x of [57,199]){c.beginPath();c.ellipse(x,110,16,8,0,0,Math.PI*2);c.fill();}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const face=new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:.4});
  add(new THREE.CylinderGeometry(.252,.252,.34,24,1,true,Math.PI-.86,1.72),face,0,1.49,0);
  const head=new THREE.Group();head.position.y=1.28;
  for(const part of root.children.slice(headStart)){root.remove(part);part.position.y-=1.28;head.add(part);}root.add(head);
  const down=new THREE.Vector3(0,-1,0),pointDirection=new THREE.Vector3(),pointRotation=new THREE.Quaternion();
  let stride=0,blend=0,pointBlend=0,waveBlend=0,previousHandAmount=0,releasingHand=false;
  const heldArm=options.shortHair?0:1;
  const handPose=buildHandPose(root,{color:options.top??0xeb94ad,shoulder:[heldArm? .36:-.36,1.14,0],side:heldArm?1:-1,sleeveLength:options.shortHair?.38:null});
  const throwStone=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),mat(0xd1dbe5));throwStone.scale.set(.075,.035,.055);throwStone.position.set(.025,-.39,-.02);throwStone.visible=false;arms[1].add(throwStone);
  return {root,
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
  },wearHat(hat){head.add(hat);hat.position.set(0,(options.shortHair?1.82:1.88)-1.28,0);hat.rotation.set(0,0,-.08);hat.scale.setScalar(1.65);},update(dt,moving,running,cheer=0,attention=null){blend=THREE.MathUtils.lerp(blend,moving?1:0,1-Math.exp(-dt*12));stride+=dt*(running?13:9);legs.forEach((leg,i)=>leg.rotation.x=Math.sin(stride+i*Math.PI)*.55*blend);arms.forEach((arm,i)=>{arm.rotation.x=-Math.sin(stride+i*Math.PI)*.45*blend-cheer*1.7;arm.rotation.z=(i===0?-1:1)*(.12+cheer*.65);});root.position.y=Math.abs(Math.sin(stride))*.035*blend;
    waveBlend+=((attention?.wave?1:0)-waveBlend)*(1-Math.exp(-dt*7));
    if(waveBlend>.001){
      arms[1].rotation.x=THREE.MathUtils.lerp(arms[1].rotation.x,-.35,waveBlend);
      arms[1].rotation.z=THREE.MathUtils.lerp(arms[1].rotation.z,2.35+Math.sin(stride*1.3)*.30,waveBlend);
    }
    const ease=1-Math.exp(-dt*5);
    head.rotation.y+=((attention?.yaw??0)-head.rotation.y)*ease;
    head.rotation.x+=((attention?.pitch??0)-head.rotation.x)*ease;
    head.rotation.z+=((attention?.tilt??0)-head.rotation.z)*ease;
    pointBlend+=((attention?.point&&cheer<.1&&!moving?1:0)-pointBlend)*(1-Math.exp(-dt*6));
    if(attention?.direction&&pointBlend>.001){pointDirection.copy(attention.direction).normalize();pointRotation.setFromUnitVectors(down,pointDirection);arms[1].quaternion.slerp(pointRotation,pointBlend*.94);}
    if(!moving&&!cheer){arms.forEach((arm,i)=>arm.rotation.z+=(i?1:-1)*Math.sin(stride*.18)*.015*(1-pointBlend));}
}};
}
