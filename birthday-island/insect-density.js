// Stable per-insect thinning. Fade selected insects out rather than dimming
// the entire population or picking a different random subset every frame.
export function insectVisibility(distance,rank,near,far,retained=.18){
  const t=Math.max(0,Math.min(1,(distance-near)/(far-near)));
  const density=1-(1-retained)*t*t*(3-2*t);
  const fade=Math.max(0,Math.min(1,(density-rank*.92)/.08));
  return fade*fade*(3-2*fade);
}
export function insectRank(index){return ((index+.5)*.61803398875)%1;}
