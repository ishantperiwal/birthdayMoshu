import * as THREE from 'three';

// Geometry and seeded noise ported from src/index.html §1 and §8.
// Keep the reference's scalloped clumps and swept branches; scale at placement.
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x,a,b)=> x<a?a:(x>b?b:x);
const lerp  = (a,b,t)=> a+(b-a)*t;
const smoothstep = (e0,e1,x)=>{ const t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); };
const smootherstep = (e0,e1,x)=>{ const t=clamp((x-e0)/(e1-e0),0,1); return t*t*t*(t*(t*6-15)+10); };

// deterministic PRNG (mulberry32)
function rng(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296; }; }

// classic 2D gradient noise with a permutation table
const PERM = new Uint8Array(512), GX = new Float32Array(256), GY = new Float32Array(256);
(function(){ const r = rng(20240715); const p = new Uint8Array(256);
  for(let i=0;i<256;i++) p[i]=i;
  for(let i=255;i>0;i--){ const j=(r()*(i+1))|0; const t=p[i]; p[i]=p[j]; p[j]=t; }
  for(let i=0;i<512;i++) PERM[i]=p[i&255];
  for(let i=0;i<256;i++){ const a=r()*TAU; GX[i]=Math.cos(a); GY[i]=Math.sin(a); }
})();

function noise2(x,y){
  const xi=Math.floor(x), yi=Math.floor(y);
  const xf=x-xi, yf=y-yi;
  const u=xf*xf*xf*(xf*(xf*6-15)+10), v=yf*yf*yf*(yf*(yf*6-15)+10);
  const X=xi&255, Y=yi&255;
  const a=PERM[X+PERM[Y]], b=PERM[X+1+PERM[Y]];
  const c=PERM[X+PERM[Y+1]], d=PERM[X+1+PERM[Y+1]];
  const n00=GX[a]*xf     + GY[a]*yf;
  const n10=GX[b]*(xf-1) + GY[b]*yf;
  const n01=GX[c]*xf     + GY[c]*(yf-1);
  const n11=GX[d]*(xf-1) + GY[d]*(yf-1);
  return lerp(lerp(n00,n10,u), lerp(n01,n11,u), v) * 1.4;
}
const MeshBuf = () => ({ pos:[], nrm:[], clm:[], flx:[], hue:[], idx:[], n:0 });
function pushVert(M, x,y,z, nx,ny,nz, cx,cy,cz, flex, hue){
  M.pos.push(x,y,z); M.nrm.push(nx,ny,nz); M.clm.push(cx,cy,cz);
  M.flx.push(flex); M.hue.push(hue); return M.n++;
}
function finishMesh(M){
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(M.pos),3));
  g.setAttribute('normal',      new THREE.BufferAttribute(new Float32Array(M.nrm),3));
  g.setAttribute('clm',      new THREE.BufferAttribute(new Float32Array(M.clm),3));
  g.setAttribute('flx',      new THREE.BufferAttribute(new Float32Array(M.flx),1));
  g.setAttribute('hue',      new THREE.BufferAttribute(new Float32Array(M.hue),1));
  g.setIndex(M.idx);
  return g;
}

// swept tapered tube along a polyline
function addTube(M, pts, radii, seg, hueV){
  const rings=[];
  for(let i=0;i<pts.length;i++){
    const p=pts[i];
    let t;
    if(i===0) t=[pts[1][0]-p[0], pts[1][1]-p[1], pts[1][2]-p[2]];
    else if(i===pts.length-1) t=[p[0]-pts[i-1][0], p[1]-pts[i-1][1], p[2]-pts[i-1][2]];
    else t=[pts[i+1][0]-pts[i-1][0], pts[i+1][1]-pts[i-1][1], pts[i+1][2]-pts[i-1][2]];
    const L=Math.hypot(t[0],t[1],t[2])||1; t=[t[0]/L,t[1]/L,t[2]/L];
    let up=[0,1,0]; if(Math.abs(t[1])>0.94) up=[1,0,0];
    let s=[t[1]*up[2]-t[2]*up[1], t[2]*up[0]-t[0]*up[2], t[0]*up[1]-t[1]*up[0]];
    const sl=Math.hypot(s[0],s[1],s[2])||1; s=[s[0]/sl,s[1]/sl,s[2]/sl];
    const u=[t[1]*s[2]-t[2]*s[1], t[2]*s[0]-t[0]*s[2], t[0]*s[1]-t[1]*s[0]];
    const ring=[];
    const flex = Math.pow(clamp(i/(pts.length-1),0,1), 1.6)*0.55;
    for(let j=0;j<seg;j++){
      const a=j/seg*TAU;
      const ca=Math.cos(a), sa=Math.sin(a);
      const wob = 1 + Math.sin(a*3+i)*0.09 + Math.cos(a*5-i*0.7)*0.05;
      const r=radii[i]*wob;
      const nx=s[0]*ca+u[0]*sa, ny=s[1]*ca+u[1]*sa, nz=s[2]*ca+u[2]*sa;
      ring.push(pushVert(M, p[0]+nx*r, p[1]+ny*r, p[2]+nz*r, nx,ny,nz, p[0],p[1],p[2], flex, hueV));
    }
    rings.push(ring);
  }
  for(let i=0;i<rings.length-1;i++) for(let j=0;j<seg;j++){
    const a=rings[i][j], b=rings[i][(j+1)%seg], c=rings[i+1][j], d=rings[i+1][(j+1)%seg];
    M.idx.push(a,c,b, b,c,d);
  }
}

// a scalloped canopy clump: an icosphere pushed around by noise
const ICO = (()=>{
  const t=(1+Math.sqrt(5))/2;
  let v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],
         [t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>{const l=Math.hypot(...p);return [p[0]/l,p[1]/l,p[2]/l];});
  let f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
         [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const sub=(v,f)=>{ const nf=[], cache={};
    const mid=(a,b)=>{ const k=a<b?a+'_'+b:b+'_'+a; if(cache[k]!==undefined)return cache[k];
      const p=[(v[a][0]+v[b][0])/2,(v[a][1]+v[b][1])/2,(v[a][2]+v[b][2])/2];
      const l=Math.hypot(...p); v.push([p[0]/l,p[1]/l,p[2]/l]); return cache[k]=v.length-1; };
    for(const t of f){ const a=mid(t[0],t[1]),b=mid(t[1],t[2]),c=mid(t[2],t[0]);
      nf.push([t[0],a,c],[t[1],b,a],[t[2],c,b],[a,b,c]); }
    return nf; };
  const L1 = { v:v.map(a=>a.slice()), f:f.map(a=>a.slice()) };
  L1.f = sub(L1.v, L1.f);
  const L2 = { v:L1.v.map(a=>a.slice()), f:L1.f.map(a=>a.slice()) };
  L2.f = sub(L2.v, L2.f);
  return { L0:{v,f}, L1, L2 };
})();

function addClump(M, cx,cy,cz, rx,ry,rz, seed, hueV, detail){
  const src = detail>=2 ? ICO.L2 : (detail>=1 ? ICO.L1 : ICO.L0);
  const base = M.n;
  const r = rng(seed*7919|0);
  const ph = [r()*10, r()*10, r()*10];
  for(const p of src.v){
    // scalloped displacement: cauliflower lobes, not a smooth ball
    const d = 1
      + 0.20*Math.sin(p[0]*4.1+ph[0])*Math.sin(p[1]*3.7+ph[1])
      + 0.14*Math.sin(p[2]*6.3+ph[2])*Math.cos(p[0]*5.1+ph[1])
      + 0.09*noise2(p[0]*3.4+ph[0], p[2]*3.4+ph[2]);
    const x=cx+p[0]*rx*d, y=cy+p[1]*ry*d, z=cz+p[2]*rz*d;
    pushVert(M, x,y,z, p[0],p[1],p[2], cx,cy,cz, 1.0, hueV);
  }
  for(const f of src.f) M.idx.push(base+f[0], base+f[1], base+f[2]);
}

function makeTree(kind, detail, seed){
  const M = MeshBuf(); const r = rng(seed);
  const H = kind==='poplar' ? 13+r()*5 : kind==='pine' ? 12+r()*6 :
            kind==='willow' ? 8+r()*3 : 10+r()*4;
  const trunkSeg = detail>=2 ? 8 : (detail>=1 ? 6 : 4);

  if(kind==='pine'){
    const pts=[], rad=[];
    for(let i=0;i<=6;i++){ const u=i/6; pts.push([Math.sin(u*2.1)*0.35*u*H*0.06, u*H, Math.cos(u*1.7)*0.3*u*H*0.06]);
      rad.push(lerp(H*0.035, H*0.006, u)); }
    addTube(M, pts, rad, trunkSeg, 0.0);
    const tiers = detail>=1 ? 6 : 4;
    for(let i=0;i<tiers;i++){
      const u = 0.30 + 0.68*(i/(tiers-1));
      const rr = (1-u)*H*0.30 + H*0.05;
      addClump(M, 0, u*H + H*0.04, 0, rr, rr*0.36, rr, seed+i*13, 0.15+r()*0.7, Math.max(0,detail-1));
    }
  } else if(kind==='poplar'){
    const pts=[], rad=[];
    for(let i=0;i<=7;i++){ const u=i/7; pts.push([Math.sin(u*3.0)*0.5, u*H, Math.cos(u*2.2)*0.45]);
      rad.push(lerp(H*0.028, H*0.005, u)); }
    addTube(M, pts, rad, trunkSeg, 0.0);
    const n = detail>=1 ? 9 : 5;
    for(let i=0;i<n;i++){
      const u = 0.20 + 0.78*(i/(n-1));
      const rr = H*(0.17 - 0.08*Math.abs(u-0.55)*1.4);
      addClump(M, Math.sin(u*7)*0.5, u*H, Math.cos(u*6)*0.45, rr*0.9, rr*1.35, rr*0.9,
               seed+i*29, 0.2+r()*0.7, Math.max(0,detail-1));
    }
  } else if(kind==='willow'){
    const pts=[], rad=[];
    for(let i=0;i<=5;i++){ const u=i/5; pts.push([u*u*1.7, u*H*0.72, Math.sin(u*2)*0.6]);
      rad.push(lerp(H*0.05, H*0.012, u)); }
    addTube(M, pts, rad, trunkSeg, 0.0);
    const n = detail>=1 ? 12 : 6;
    for(let i=0;i<n;i++){
      const a=r()*TAU, rr0=Math.sqrt(r())*H*0.42;
      const cx=Math.cos(a)*rr0+1.5, cz=Math.sin(a)*rr0;
      const cy=H*0.62 + (r()-0.3)*H*0.22;
      const rr=H*(0.13+r()*0.09);
      addClump(M, cx, cy, cz, rr*1.15, rr*0.8, rr*1.15, seed+i*37, 0.5+r()*0.5, Math.max(0,detail-1));
      // trailing curtain
      if(detail>=1) addClump(M, cx*1.05, cy-rr*1.5, cz*1.05, rr*0.55, rr*1.5, rr*0.55,
                             seed+i*41, 0.6+r()*0.4, Math.max(0,detail-1));
    }
  } else { // broadleaf: the camphor / oak silhouette
    const pts=[], rad=[];
    const lean=(r()-0.5)*0.5;
    for(let i=0;i<=6;i++){ const u=i/6;
      pts.push([lean*u*u*H*0.14 + Math.sin(u*3.4)*0.35, u*H*0.52, Math.cos(u*2.6)*0.35]);
      rad.push(lerp(H*0.062, H*0.026, u)); }
    addTube(M, pts, rad, trunkSeg, 0.0);
    const nb = detail>=2 ? 5 : (detail>=1 ? 4 : 0);
    for(let i=0;i<nb;i++){
      const a=i/nb*TAU + r()*0.9;
      const bl=H*(0.26+r()*0.16);
      const bp=[], br=[];
      for(let j=0;j<=3;j++){ const u=j/3;
        bp.push([Math.cos(a)*bl*u*0.9, H*0.50 + u*bl*0.72 - u*u*bl*0.12, Math.sin(a)*bl*u*0.9]);
        br.push(lerp(H*0.020, H*0.006, u)); }
      addTube(M, bp, br, Math.max(3,trunkSeg-2), 0.0);
    }
    const n = detail>=2 ? 22 : (detail>=1 ? 12 : 7);
    const CR = H*0.40;
    for(let i=0;i<n;i++){
      let cx,cy,cz,rr;
      if(i===0){ cx=0; cy=H*0.78; cz=0; rr=CR*0.72; }
      else{ const a=r()*TAU, dd=Math.pow(r(),0.55)*CR*1.02;
        cx=Math.cos(a)*dd; cz=Math.sin(a)*dd*0.92;
        cy=H*0.74 + (r()-0.44)*CR*0.95 - dd*0.20;
        rr=CR*(0.26+r()*0.26); }
      addClump(M, cx,cy,cz, rr*1.12, rr*0.86, rr*1.12, seed+i*53, r(), Math.max(0,detail-1));
    }
  }
  return M;
}



export function referenceTreeGeometry(kind, seed) { return finishMesh(makeTree(kind, 2, seed)); }
