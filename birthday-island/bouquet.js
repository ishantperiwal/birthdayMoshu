import * as THREE from 'three';
import {bouquetPose,receivedBouquetPose,bouquetState} from './bouquet-motion.js?v=relaxed-1';
import {makeBouquetDesign} from './bouquet-design.js?v=holder-spread-3';

const bouquetTemplates=new Map();
export function buildBouquet({compact=false}={}){
  if(!bouquetTemplates.has(compact))bouquetTemplates.set(compact,makeBouquetDesign({spread:compact?.90:1}));
  return bouquetTemplates.get(compact).clone(true);
}

export function buildBouquetGesture(arm,{receiver=false}={}){
  const bouquet=buildBouquet({compact:!receiver});arm.add(bouquet);bouquet.position.set(0,receiver?-.39:-.49,0);bouquet.scale.setScalar(.759);bouquet.visible=false;
  const poseAt=receiver?receivedBouquetPose:bouquetPose,tilt=new THREE.Quaternion(),axis=new THREE.Vector3(1,0,0),faceHolder=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
  let show=false,age=2,transferred=false,relaxed=true;
  return {get active(){return poseAt(age,show).active;},get shown(){return show;},
    // Only her own first-person arm uses the lifted pose; everyone else sees it relaxed.
    set firstPerson(value){relaxed=!value;},
    set(value,snap=false){
      const state=bouquetState(value),next=receiver?state==='received':state==='offered';
      transferred=!receiver&&(state==='received'||state==='stored');
      if(next===show&&!snap)return;show=next;age=snap?2:0;
    },
    update(dt,suppressed=false){
      age+=dt;const pose=poseAt(age,show,relaxed);
      bouquet.visible=pose.visible&&pose.active&&!suppressed&&!transferred;
      bouquet.scale.setScalar(.759*(pose.scale??1));
      if(!pose.active||suppressed)return;
      arm.visible=true;
      arm.rotation.set(pose.x,0,pose.z);
      // Keep blooms upright as the hand lifts forward.
      bouquet.quaternion.copy(arm.quaternion).invert();
      if(receiver){tilt.setFromAxisAngle(axis,pose.tilt);bouquet.quaternion.multiply(tilt).multiply(faceHolder);}
    }
  };
}
