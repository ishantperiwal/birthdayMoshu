// Reversible product setting. Change to 'manual' to restore the original
// two-player movement controls; both frontend and server import this setting.
export const ISHIEE_CONTROL_MODE='companion';
export const companionMode=ISHIEE_CONTROL_MODE==='companion';
export function canControlWorld(user){return !companionMode||user==='MOSHIEE';}
