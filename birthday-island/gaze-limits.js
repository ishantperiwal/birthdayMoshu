export const GAZE_PITCH_MIN=.18,GAZE_PITCH_MAX=1.6;
export function clampGaze(yaw,pitch){
  pitch=Math.max(GAZE_PITCH_MIN,Math.min(GAZE_PITCH_MAX,pitch));
  const t=Math.max(0,Math.min(1,(pitch-.45)/.65));
  const sideLimit=.22+1.03*t*t*(3-2*t);
  return {yaw:Math.max(-sideLimit,Math.min(sideLimit,yaw)),pitch};
}

// Downward input follows the narrowing boundary toward the dress. Only a
// sideways/upward gesture redirects overflow toward the wider sky view.
// Remember the previous pitch so diagonal downward input cannot push itself
// back upward and get stuck along that boundary. The limits stay unchanged.
export function slideGaze(yaw,pitch,previousPitch=pitch){
  // Feather the last part of the downward pan. Integrating the remaining
  // distance keeps the finish smooth even when mouse events arrive in batches.
  if(pitch<previousPitch){
    const edge=GAZE_PITCH_MIN+.16;
    if(pitch<edge){
      const start=Math.min(previousPitch,edge);
      pitch=GAZE_PITCH_MIN+Math.max(0,start-GAZE_PITCH_MIN)*Math.exp((pitch-start)/.16);
    }
  }
  const safe=clampGaze(yaw,pitch);
  if(pitch<previousPitch)return safe;
  const overflow=Math.abs(yaw-safe.yaw);
  return clampGaze(yaw,safe.pitch+overflow*1.5);
}
