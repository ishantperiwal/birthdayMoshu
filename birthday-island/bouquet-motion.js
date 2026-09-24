const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Briefly lower the hand, then lift forward while the flowers grow into view.
export function bouquetPose(age,show){
  const t=show?Math.min(age,.85):Math.max(0,.85-age);
  const lower=smooth(t/.18),offer=smooth((t-.14)/.71),scale=smooth((t-.12)/.55);
  return {x:1.28*offer,z:.12*(1-lower)-.16*offer,scale,
    visible:scale>.001,active:show||age<.85};
}

export function bouquetState(value){
  return value===true||value==='offered'?'offered':value==='received'||value==='stored'?value:'hidden';
}

// Receive with an outstretched hand, then lift the open flowers toward her.
// Putting away lowers the attached bouquet below the view before hiding it.
export function receivedBouquetPose(age,show){
  const t=smooth(age/(show?1.05:1.15));
  return {x:show?1.35+.35*t:1.7*(1-t),z:show?-.12-.36*t:-.48*(1-t),
    tilt:show?-.65+.25*t:-.4-.35*t,
    visible:show||age<.95,active:show||age<1.15};
}
