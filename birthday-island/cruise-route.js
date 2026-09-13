// Fixed heading: the ship crosses the southwest view while receding from land.
export const CRUISE_START={x:-150,z:65};
export function cruisePose(age,out){
  const travel=Math.max(0,age);
  out.x=CRUISE_START.x+travel*.25;
  out.z=CRUISE_START.z+travel*1.15;
  out.yaw=Math.atan2(-1.15,.25);
  return out;
}
export function cruiseResetAllowed(age,hiddenSeconds,currentVisible,startVisible){
  return age>150&&hiddenSeconds>5&&!currentVisible&&!startVisible;
}
