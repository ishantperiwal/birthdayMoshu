// With the 58-degree vertical field of view, this leaves a hidden cone
// around the ground directly beneath the first-person character.
// 46° down leaves a 15° hidden cone at the bottom edge of the view.
export const MIN_WALK_PITCH=-46*Math.PI/180;
export const MAX_WALK_PITCH=Math.PI/2-.02;
// While holding hands the view looks down less, keeping the linked arms out of the bottom edge.
export const MIN_HOLD_PITCH=-24*Math.PI/180;
export function clampWalkPitch(pitch,holding=false){return Math.max(holding?MIN_HOLD_PITCH:MIN_WALK_PITCH,Math.min(MAX_WALK_PITCH,pitch));}
