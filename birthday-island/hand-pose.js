import { roundedSleeve } from './rounded-sleeve.js';
import * as THREE from 'three';

// Straight sleeve, short wrist and circular toy hand; no per-frame geometry.
export function buildHandPose(parent,{color=0xeb94ad,shoulder=[.28,1.36,-.06],side=1,floating=false,sleeveLength=null,shortSleeves=false}={}){
  const root=new THREE.Group();parent.add(root);root.visible=false;
  const cloth=new THREE.MeshStandardMaterial({color,roughness:.30,emissive:color,emissiveIntensity:.11});
  const skin=new THREE.MeshStandardMaterial({color:0xf6cc77,roughness:.30,emissive:0xf6cc77,emissiveIntensity:.11});
  const upper=new THREE.Mesh(roundedSleeve(.095,.105,1,.012,.035),cloth);
  const lower=new THREE.Mesh(new THREE.CylinderGeometry(shortSleeves?.079:.065,shortSleeves?.079:.075,1,16),skin);
  const elbow=new THREE.Mesh(new THREE.SphereGeometry(.078,12,8),cloth);
  const hand=new THREE.Mesh(new THREE.TorusGeometry(.087,.037,8,20),skin);
  root.add(upper,lower,elbow,hand);
  const start=new THREE.Vector3(...shoulder),end=new THREE.Vector3(),bend=new THREE.Vector3(),rest=new THREE.Vector3();
  const up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3(),wrist=new THREE.Vector3();
  const parentRotation=new THREE.Quaternion(),aim=new THREE.Vector3(0,-1,0);
  function segment(mesh,a,b){direction.subVectors(b,a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=direction.length();mesh.quaternion.setFromUnitVectors(up,direction.normalize());}
  return {root,aim,update(worldTarget,amount,worldRotation=null,worldAxis=null){
    root.visible=amount>.001;if(!root.visible)return;
    parent.updateWorldMatrix(true,false);
    end.copy(worldTarget);parent.worldToLocal(end);
    rest.set(start.x+side*.035,start.y-.40,start.z);end.lerp(rest,1-amount);
    if(sleeveLength!==null){
      // Blend the arm's direction, not its length. Linear hand travel cuts
      // across the reach arc and used to squash the sleeve during release.
      direction.subVectors(end,start).normalize();
      end.copy(start).addScaledVector(direction,sleeveLength+.112+.025);
    }
    if(floating){
      // Extend back to the player's body instead of ending in a floating cuff.
      // The clasp stays at his waist and remains independent of camera pitch.
      direction.set(end.x,0,end.z).normalize();
      if(worldAxis){
        parent.getWorldQuaternion(parentRotation);
        direction.copy(worldAxis).applyQuaternion(parentRotation.invert());
        start.copy(end).addScaledVector(direction,Math.max(.35,Math.hypot(end.x,end.z)-.12));
      }else start.set(direction.x*.12-direction.z*.14,1.10,direction.z*.12+direction.x*.14);
    }
    // Meet the outside of the ring, leaving its opening clear. The sleeve
    // carries the reach; only a short, fixed-length wrist is exposed.
    direction.subVectors(start,end).normalize();
    wrist.copy(end).addScaledVector(direction,.112);
    bend.copy(wrist).addScaledVector(direction,.025);
    if(shortSleeves)bend.copy(start).lerp(wrist,.52);
    segment(upper,start,bend);segment(lower,bend,wrist);elbow.visible=false;
    aim.subVectors(end,start).normalize();
    hand.position.copy(end);
    if(worldRotation){parent.getWorldQuaternion(parentRotation);hand.quaternion.copy(parentRotation).invert().multiply(worldRotation);}
    else hand.rotation.set(0,0,0);
  }};
}
