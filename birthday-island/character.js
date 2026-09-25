import {dressDateSuit} from './date-suit.js?v=8';
import {buildSeatedCards} from './seated-cards.js';
import {dressBirthday,BIRTHDAY_ROSE,BIRTHDAY_SKIN,BIRTHDAY_EXTRA_HEIGHT} from './birthday-dress.js?v=taller-1';
import { legoHairMesh } from './assets/lego-hair.js?v=1';
import { roundedSleeve } from './rounded-sleeve.js';
import { roundedToyBox } from './rounded-toy-box.js';
import {birthdayBodice,birthdayNecklineSkin} from './dress-bodice.js?v=sweetheart-2';
import {dressTextures} from './dress-textures.js';
import {softHeadGeometry,softFaceGeometry} from './soft-head.js?v=straight-1';
import { buildHandPose } from './hand-pose.js?v=arms-1';
import {addPuffSleeve} from './puff-sleeve.js?v=closer-lace-3';
import {buildBouquetGesture} from './bouquet.js?v=holder-spread-7';
import { hairMesh } from './assets/reference-hair-relaxed.js?v=1';
import * as THREE from 'three';
import {legoHandGeometry} from './lego-hand.js';
import {addFaceBlink} from './face-blink.js?v=generated-decals-1';
import {addBirthdayTiara} from './birthday-tiara.js?v=set-back-1';
import {addBirthdayChoker} from './birthday-choker.js?v=chain-2';
import {createSkirtMotion} from './skirt-motion.js?v=visible-follow-2';

// Her head's width and depth relative to its height (1 is the original cylinder).
// Her arms: extra length and a thickness factor, shared with the holding-hands arm.
export const HER_ARM_EXTRA=.04,HER_ARM_THICKNESS=.9;
const HEAD_SLIM=.92;
export function buildCharacter(parent,options={}){
  const birthday=!options.shortHair&&!options.suit;
  const stargazingFit=birthday&&!!options.stargazingFit;
  const legExtra=options.shortHair?.065:birthday&&!stargazingFit?.085+BIRTHDAY_EXTRA_HEIGHT:0,torsoExtra=options.shortHair?.025:0;
  const upperLift=legExtra+torsoExtra;
  const topColor=options.top??(birthday?BIRTHDAY_ROSE:0xeb94ad);
  const root=new THREE.Group();root.scale.setScalar(.78);parent.add(root);
  const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.30,metalness:0,emissive:color,emissiveIntensity:.11});
  const skinColor=birthday?BIRTHDAY_SKIN:0xf6cc77;
  const skin=mat(skinColor),hair=mat(0x704630),pink=mat(topColor),cream=mat(options.trousers??(birthday?0xffecd6:0xf1dfbf)),shoe=mat(options.shoes??(birthday?0xbe8792:0x806477));
  if(birthday){skin.roughness=.5;skin.emissiveIntensity=.08;}
  const add=(geo,m,x,y,z,p=root)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;};
  const box=(w,h,d,m,x,y,z,p)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
  const legs=[];for(const x of [-.145,.145]){
    const leg=new THREE.Group();leg.position.set(x,.65+legExtra,0);root.add(leg);legs.push(leg);
    // The floor-length walking gown conceals legs, shoes and shoe decorations.
    leg.visible=!birthday||stargazingFit;
    const shoeHeight=options.shortHair?.10:birthday?.11:.18,legHeight=.65+legExtra-shoeHeight;
    const legBlock=add(roundedToyBox(birthday&&!stargazingFit?.22:.25,legHeight,birthday&&!stargazingFit?.23:.26,.018),cream,0,-legHeight/2,0,leg);
    legBlock.visible=!birthday||stargazingFit;
    add(roundedToyBox(.26,shoeHeight,.36,.018),shoe,0,-.65-legExtra+shoeHeight/2,-.045,leg);
  }
  if(!birthday)add(roundedToyBox(.57,.12,.32,.018),options.waistMatchesTrousers?cream:pink,0,.68,0);
  if(birthday){
    const bodiceMaterial=stargazingFit?pink:pink.clone();
    if(!stargazingFit){bodiceMaterial.color.setHex(0xffffff);bodiceMaterial.map=dressTextures().bodice;bodiceMaterial.bumpMap=dressTextures().weave;bodiceMaterial.bumpScale=.0007;}
    add(birthdayBodice(stargazingFit),bodiceMaterial,0,0,0);
    if(!stargazingFit)add(birthdayNecklineSkin(),skin,0,0,0);
  }
  else add(roundedToyBox(.57,.49,.32,.035,.48),pink,0,.96,0);
  if(options.suit){pink.roughness=.62;cream.roughness=.66;shoe.roughness=.24;shoe.emissiveIntensity=.025;}
  // Preserve the original jumper collar for the other outfit.
  if(!options.suit&&!birthday)for(const x of [-.09,.09]){const collar=box(.16,.07,.025,cream,x,1.16,-.19);collar.rotation.z=x<0?-.25:.25;}
  const puffSleeves=birthday;
  const shoulderWidth=puffSleeves?.248:.36;
  const armRestTilt=puffSleeves?.26:.12;
  const arms=[];for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*shoulderWidth,1.14,0);arm.rotation.z=side*armRestTilt;root.add(arm);arms.push(arm);
    // Extend the suit arm from the shoulder, preserving the cuff-to-hand fit.
    if(puffSleeves){
      // Her bare arms: a little longer and slimmer than the original .067/.38.
      add(roundedSleeve(.067*HER_ARM_THICKNESS,.063*HER_ARM_THICKNESS,.38+HER_ARM_EXTRA,.018,.033),skin,0,-.15-HER_ARM_EXTRA/2,0,arm);
      addPuffSleeve(arm,pink);
    }
    else{
      add(roundedSleeve(.105,.095,options.suit?.40:birthday?.19:.35),pink,0,options.suit?-.175:birthday?-.07:-.15,0,arm);
      if(birthday)add(roundedSleeve(.079,.079,.19,.009),skin,0,-.245,0,arm);
    }
    const hand=add(legoHandGeometry(),skin,0,options.suit?-.49:puffSleeves?-.39-HER_ARM_EXTRA:-.39,0,arm);hand.rotation.z=-Math.PI*.3;
    if(birthday&&!stargazingFit)hand.scale.setScalar(.92);
  }
  if(options.suit)dressDateSuit(root,arms);
  let birthdayDress=null;
  if(birthday){
    birthdayDress=dressBirthday(root,arms,legs,pink,stargazingFit);
    // Shoe decorations follow the lowered shoe relative to the hip pivot.
    for(const leg of legs)for(const detail of leg.children.slice(2))detail.position.y-=legExtra;
  }
  const neckRadius=options.shortHair?.095:.11;
  // His neck reaches further up inside the head, so its top edge stays hidden
  // when he looks up. Only the top grows; the base and collar stay put.
  const neckReach=options.shortHair?.08:0;
  const neckShape=new THREE.CylinderGeometry(neckRadius,neckRadius,.1+neckReach,32);neckShape.translate(0,neckReach/2,0);
  const neck=add(neckShape,skin,0,1.25,0);
  if(birthday&&!stargazingFit)addBirthdayChoker(neck);
  if(stargazingFit||options.suit){
    // Separate cloth ring around the neck, slightly overlapping the bodice.
    const r=neckRadius;
    const ring=[[r+.001,-.032],[r+.008,-.032],[r+.011,-.028],[r+.011,.010],[r+.008,.014],[r+.001,.014],[r+.001,-.032]];
    const cloth=options.suit?root.getObjectByName('cream shirt').material:pink;
    const neckGeometry=new THREE.LatheGeometry(ring.map(([radius,y])=>new THREE.Vector2(radius,y)),48,
      options.suit?Math.PI+.06:0,options.suit?Math.PI*2-.12:Math.PI*2);
    if(options.suit){
      // The front (-z) opens wider at the top, giving both collar ends a
      // diagonal cut that narrows toward the shirt and tie below.
      const p=neckGeometry.attributes.position;
      for(let i=0;i<p.count;i++){
        let angle=Math.atan2(p.getX(i),p.getZ(i));if(angle<Math.PI+.059)angle+=Math.PI*2;
        const t=(angle-Math.PI-.06)/(Math.PI*2-.12);
        const gap=.06+.44*THREE.MathUtils.clamp((p.getY(i)+.032)/.046,0,1);
        const a=Math.PI+gap+t*(Math.PI*2-gap*2),radius=Math.hypot(p.getX(i),p.getZ(i));
        p.setX(i,Math.sin(a)*radius);p.setZ(i,Math.cos(a)*radius);
      }
      neckGeometry.computeVertexNormals();
    }
    const neckband=add(neckGeometry,cloth,0,-.014,0,neck);
    neckband.name=options.suit?'raised shirt neckline':'dress neckline';
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
  hairShape.translate(0,-1.49,0);hairShape.scale(1,1.05,1);hairShape.translate(0,1.440,0);
  hair.color.setHex(0x302117);hair.emissive.setHex(0x302117);
  hair.emissiveIntensity=.025;hair.roughness=.48;
  add(hairShape,hair,0,0,0);
  }
  // User-supplied transparent face prints for both characters.
  const decal=options.shortHair?'./manualAssets/faceDecalguy.png':'./manualAssets/faceDecal.png';
  const texture=new THREE.TextureLoader().load(new URL(decal,import.meta.url).href);
  texture.colorSpace=THREE.SRGBColorSpace;
  const face=new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:.4});
  const faceMesh=add(options.shortHair?new THREE.CylinderGeometry(.252,.252,.34,24,1,true,Math.PI-.86,1.72):softFaceGeometry(),face,0,1.49,0);
  const faceBlink=addFaceBlink(faceMesh,!!options.shortHair);
  if(birthday)addBirthdayTiara(root);
  const head=new THREE.Group();head.position.y=1.28;
  for(const part of root.children.slice(headStart)){root.remove(part);part.position.y-=1.28;head.add(part);}root.add(head);
  if(!options.shortHair){
    // Reduce the entire head/hair and neck assembly around the neck base.
    // The existing face-to-hair fit stays intact and the neckline stays seated.
    const proportion=stargazingFit?1:.9*.95,neckBase=1.20;
    head.scale.setScalar(.9*proportion);
    head.position.y=neckBase+(head.position.y-neckBase)*proportion;
    neck.scale.setScalar(proportion);
    neck.position.y=neckBase+(neck.position.y-neckBase)*proportion;
    // Slimmer head: narrow the face cylinder, hair, tiara and neck in width and
    // depth only, so the head keeps its height.
    head.scale.x*=HEAD_SLIM;head.scale.z*=HEAD_SLIM;
    neck.scale.x*=HEAD_SLIM;neck.scale.z*=HEAD_SLIM;
  }
  else head.position.y-=.012;
  if(birthday){
    // Lift the complete dress and upper body with the longer legs.
    for(const part of root.children)if(!legs.includes(part))part.position.y+=legExtra;
  }
  if(options.shortHair){
    // Add ~5% height through legs and jacket, preserving the size of the
    // head, neck, hands, shoes and arm-mounted props. Feet stay on the ground.
    const torso=new THREE.Group();torso.name='taller jacket';
    const waist=.71;
    for(const part of [...root.children]){
      if(legs.includes(part))continue;
      if(part===head||part===neck||arms.includes(part)){part.position.y+=upperLift;continue;}
      part.position.y-=waist;torso.add(part);
    }
    torso.position.y=waist+legExtra;torso.scale.y=1+torsoExtra/(1.205-waist);root.add(torso);
  }
  const down=new THREE.Vector3(0,-1,0),pointDirection=new THREE.Vector3(),pointRotation=new THREE.Quaternion();
  let stride=0,blend=0,pointBlend=0,waveBlend=0,previousHandAmount=0,releasingHand=false;
  const heldArm=options.shortHair?0:1;
  // A holding arm for each side (index = arms[] index: 0 left, 1 right); the
  // hand used is whichever side faces the partner, so arms never cross.
  const handPoses=[0,1].map(arm=>buildHandPose(root,{color:topColor,skinColor,shoulder:[arm?shoulderWidth:-shoulderWidth,1.14+upperLift,0],side:arm?1:-1,sleeveLength:options.shortHair?.38:null,shortSleeves:birthday,puffSleeves,armThickness:puffSleeves?HER_ARM_THICKNESS:1,handScale:birthday&&!stargazingFit?.92:1}));
  let handPose=handPoses[heldArm],activeArm=heldArm;
  const throwStone=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),mat(0xd1dbe5));throwStone.scale.set(.075,.035,.055);throwStone.position.set(.025,options.suit?-.49:puffSleeves?-.39-HER_ARM_EXTRA:-.39,-.02);throwStone.visible=false;arms[1].add(throwStone);
  const bouquet=buildBouquetGesture(arms[1],{receiver:!options.shortHair});
  let bouquetView=null;
  let restingModel=null,walkingVisibility=null;
  let manualGesture=null;
  let seatedTorso=null;
  const standingLegs=legs.map(leg=>({position:leg.position.clone(),scale:leg.scale.clone(),visible:leg.visible}));
  const seatedCards=buildSeatedCards();seatedCards.position.set(0,-.43,-.14);seatedCards.rotation.x=-1.15;arms[1].add(seatedCards);
  const skirtMotion=birthday&&!stargazingFit?createSkirtMotion():null;
  const clothPosition=new THREE.Vector3(),clothOffset=new THREE.Vector3(),clothRotation=new THREE.Quaternion(),clothScale=new THREE.Vector3();
  function setFirstPerson(value){
    if(!birthday||stargazingFit){head.visible=!value;return;}
    if(value){
      if(walkingVisibility)return;
      // Cache the original proportions once; only one body is rendered at a time.
      restingModel??=buildCharacter(root,{...options,stargazingFit:true});
      restingModel.root.scale.setScalar(1);restingModel.setFirstPerson(true);
      walkingVisibility=new Map(root.children.filter(part=>part!==restingModel.root).map(part=>[part,part.visible]));
      for(const part of walkingVisibility.keys())part.visible=false;
      restingModel.root.visible=true;
    }else if(walkingVisibility){
      for(const [part,visible] of walkingVisibility)part.visible=visible;
      walkingVisibility=null;restingModel.root.visible=false;
    }
  }
  let benchLegs=null,benchFabric=null;
  function poseBench(on){
    if(!on){this.resetRestingPose();if(benchLegs)benchLegs.visible=false;if(benchFabric){benchFabric.visible=true;benchFabric=null;}legs.forEach((leg,i)=>leg.visible=standingLegs[i].visible);root.position.y=0;return;}
    if(!benchLegs){
      benchLegs=new THREE.Group();root.add(benchLegs);
      for(const x of [-.145,.145]){
        box(.25,.23,.40,cream,x,.65,-.18,benchLegs);
        box(.23,.43,.24,cream,x,.36,-.36,benchLegs);
        box(.26,.10,.36,shoe,x,.12,-.42,benchLegs);
      }
      if(birthday){const cloth=add(new THREE.SphereGeometry(1,24,12),pink,0,.49,-.20,benchLegs);cloth.scale.set(.52,.27,.48);}
    }
    this.resetRestingPose();root.position.y=.62/root.scale.y-(.65+legExtra);
    legs.forEach(leg=>leg.visible=false);benchLegs.visible=true;
    if(birthday){benchFabric=root.getObjectByName('skirt fabric sway');if(benchFabric)benchFabric.visible=false;}
    arms.forEach((arm,i)=>arm.rotation.set(.65,0,i?.12:-.12));seatedCards.visible=false;
  }
  return {root,poseBench,setExpression:(value,duration)=>faceBlink.setExpression(value,duration),setBlinkPreview:value=>faceBlink.setPreview(value),get pointingAmount(){return pointBlend;},setFirstPerson,
    setSeatedHeadVisible(value){if(walkingVisibility&&restingModel)restingModel.setSeatedHeadVisible(value);else head.visible=value;},
    resetRestingPose(){
      if(walkingVisibility&&restingModel){restingModel.resetRestingPose();return;}
      blend=0;waveBlend=0;pointBlend=0;manualGesture=null;
      legs.forEach((leg,i)=>{leg.rotation.set(0,0,0);leg.position.copy(standingLegs[i].position);leg.scale.copy(standingLegs[i].scale);});
      if(seatedTorso)seatedTorso.rotation.set(0,0,0);
      arms.forEach((arm,i)=>arm.rotation.set(0,0,(i===0?-1:1)*armRestTilt));
      root.position.y=0;
    },
    poseSitting(on){
      if(walkingVisibility&&restingModel){restingModel.poseSitting(on);return;}
      this.resetRestingPose();
      if(!on){
        legs.forEach((leg,i)=>leg.visible=standingLegs[i].visible);seatedCards.visible=false;
        if(seatedTorso){for(const part of [...seatedTorso.children]){part.position.y+=seatedTorso.position.y;root.add(part);}root.remove(seatedTorso);seatedTorso=null;}
        return;
      }
      if(!seatedTorso){
        seatedTorso=new THREE.Group();seatedTorso.position.y=.65+legExtra;
        const upper=root.children.filter(part=>!legs.includes(part));root.add(seatedTorso);
        for(const part of upper){part.position.y-=seatedTorso.position.y;seatedTorso.add(part);}
      }
      seatedTorso.rotation.x=-.08;
      root.position.y=-.55;
      legs.forEach(leg=>leg.visible=false);
      arms.forEach((arm,i)=>arm.rotation.set(1.25,0,i?.12:-.12));
      seatedCards.visible=true;
    },
    triggerGesture(value){
      if(!['wave','cheer'].includes(value)||bouquet?.active||walkingVisibility)return false;
      manualGesture={value,age:0,rest:arms.map(arm=>arm.rotation.clone())};return true;
    },
    updateGesture(dt,suppressed=false){
      if(!manualGesture)return;
      const gesture=manualGesture;gesture.age+=dt;
      if(suppressed||bouquet?.active||gesture.age>=2.4){arms.forEach((arm,i)=>arm.rotation.copy(gesture.rest[i]));manualGesture=null;return;}
      const strength=THREE.MathUtils.smoothstep(gesture.age,0,.25)*(1-THREE.MathUtils.smoothstep(gesture.age,1.95,2.4));
      if(gesture.value==='wave'){
        arms[1].rotation.x=THREE.MathUtils.lerp(gesture.rest[1].x,.35,strength);
        arms[1].rotation.z=THREE.MathUtils.lerp(gesture.rest[1].z,2.35+Math.sin(gesture.age*11)*.22,strength);
      }else arms.forEach((arm,i)=>{arm.rotation.x=THREE.MathUtils.lerp(gesture.rest[i].x,2.45,strength);arm.rotation.z=THREE.MathUtils.lerp(gesture.rest[i].z,(i?1:-1)*(.38+Math.sin(gesture.age*8)*.035),strength);});
    },
    updateCloth(dt){
      if(!skirtMotion)return;
      root.getWorldPosition(clothPosition);
      const offset=skirtMotion.update(dt,clothPosition,!walkingVisibility);
      root.getWorldQuaternion(clothRotation);root.getWorldScale(clothScale);
      clothOffset.set(offset.x,0,offset.z).applyQuaternion(clothRotation.invert()).divide(clothScale);
      birthdayDress.updateMotion(clothOffset);
    },
    get bouquetActive(){return !!bouquet?.active;},
    setBouquet(value,snap=false){bouquet?.set(value,snap);},
    updateBouquet(dt,suppressed=false){bouquet?.update(dt,suppressed);if(bouquet?.active&&!suppressed&&!options.shortHair)for(const pose of handPoses)pose.root.visible=false;},
    setBouquetView(value){
      if(bouquet)bouquet.firstPerson=!!value;
        if(value){bouquetView??=new Map(root.children.map(o=>[o,o.visible]));for(const child of root.children)child.visible=child===arms[1]&&!!bouquet?.active;}
      else if(!value&&bouquetView){for(const [child,visible] of bouquetView)child.visible=visible;bouquetView=null;}
    },
    poseThrow(age){
      throwStone.visible=age>=0&&age<.42;
      if(age<0)return;
      const wind=Math.min(age/.26,1),snap=THREE.MathUtils.smoothstep(age,.26,.49),recover=THREE.MathUtils.smoothstep(age,.55,.95);
      arms[1].rotation.set(THREE.MathUtils.lerp(-1.05*wind+2.65*snap,0,recover),0,.22*(1-recover)+.12*recover);
    },
    throwOrigin(target){return throwStone.getWorldPosition(target);},
    poseHand(target,amount,rotation,arm=heldArm,freeReach=false){
    if(walkingVisibility){restingModel.poseHand(target,amount,rotation,arm,freeReach);return;}
    if(arm!==activeArm){handPose.update(target,0);handPose.root.visible=false;arms[activeArm].visible=true;activeArm=arm;handPose=handPoses[arm];}
    handPose.update(target,amount,rotation,null,freeReach);
    if(amount<previousHandAmount-.000001)releasingHand=true;
    else if(amount>previousHandAmount+.000001)releasingHand=false;
    previousHandAmount=amount;
    // On release restore the familiar hand after only 15% of the return,
    // then keep lowering that original arm for the rest of the gesture.
    const useHoldingModel=amount>=(releasingHand?.85:.55);
    handPose.root.visible=useHoldingModel;
    arms[activeArm].visible=!useHoldingModel;
    if(amount>.001&&!useHoldingModel)arms[activeArm].quaternion.setFromUnitVectors(down,handPose.aim);
  },wearHat(hat){head.add(hat);hat.position.set(0,(options.shortHair?1.805:1.82)-1.28,0);hat.rotation.set(0,0,-.08);const round=options.shortHair?1:HEAD_SLIM;hat.scale.set(1.04/round,1.04,1.04/round);},update(dt,moving,running,cheer=0,attention=null,pace=1){blend=THREE.MathUtils.lerp(blend,moving?1:0,1-Math.exp(-dt*12));stride+=dt*(running?13:9)*pace;legs.forEach((leg,i)=>leg.rotation.x=Math.sin(stride+i*Math.PI)*(birthday?.30:.55)*blend);arms.forEach((arm,i)=>{arm.rotation.x=-Math.sin(stride+i*Math.PI)*.45*blend*(1-cheer)+cheer*2.45;arm.rotation.y=0;arm.rotation.z=(i===0?-1:1)*THREE.MathUtils.lerp(armRestTilt,.37,cheer);});root.position.y=Math.abs(Math.sin(stride))*.035*blend;
    waveBlend+=((attention?.wave&&cheer<.1?1:0)-waveBlend)*(1-Math.exp(-dt*7));
    if(waveBlend>.001&&cheer<.1){
      arms[1].rotation.x=THREE.MathUtils.lerp(arms[1].rotation.x,-.35,waveBlend);
      arms[1].rotation.z=THREE.MathUtils.lerp(arms[1].rotation.z,2.35+Math.sin(stride*1.3)*.30,waveBlend);
    }
    const ease=1-Math.exp(-dt*5);
    head.rotation.y+=((attention?.yaw??0)-head.rotation.y)*ease;
    head.rotation.x+=((attention?.pitch??0)-head.rotation.x)*ease;
    head.rotation.z+=((attention?.tilt??0)-head.rotation.z)*ease;
    const pointing=!!(attention?.point&&cheer<.1&&(!moving||attention?.manualPoint));
    pointBlend+=((pointing?1:0)-pointBlend)*(1-Math.exp(-dt*(pointing?6:3.8)));
    // Preserve the last pointing direction during release; idle attention may
    // change immediately, but the arm must ease back from its actual pose.
    if(pointing&&attention?.direction){pointDirection.copy(attention.direction).normalize();pointRotation.setFromUnitVectors(down,pointDirection);}
    if(pointBlend>.001)arms[1].quaternion.slerp(pointRotation,pointBlend*.94);
    if(!moving&&!cheer){arms.forEach((arm,i)=>arm.rotation.z+=(i?1:-1)*Math.sin(stride*.18)*.015*(1-pointBlend));}
}};
}
