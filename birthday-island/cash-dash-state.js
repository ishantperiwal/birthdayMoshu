import {COIN_MODE} from './coin-mode.js';
export const CASH_DASH_MS=60000, CASH_COUNTDOWN_MS=3000, CASH_VALUE=5;
// In coin mode the total reads as a plain coin count (one coin per bundle).
export const formatCash=value=>COIN_MODE?Math.round(value/CASH_VALUE).toLocaleString('en-IE'):'€'+Math.round(value).toLocaleString('en-IE');
// Several routes rather than one mandatory trail: garden, central paths,
// eastern meadow, and the safe landward side of the shoreline.
const ORIGINAL_CASH_SITES=[
  [-5,-4],[-3,0],[-1,4],[0,8],[1,12],[1,16],[0,20],[-2,24],[-3,28],[-5,33],
  [6,7],[12,8],[18,9],[24,10],[30,12],[36,15],[42,19],[43,25],[37,30],[30,35],
  [20,37],[10,39],[-2,40],[-14,38],[-24,33],[-33,27],[-41,20],[-46,11],[-48,1],[-46,-9],
  [-40,-18],[-32,-26],[-23,-32],[-13,-36],[-3,-38],[8,-35],[19,-31],[30,-25],[39,-17],[44,-6],
  // Open meadows between the paths and shoreline, instead of doubled-up
  // central pickups. Keep the same fifty bundles and total prize.
  [-16,-8],[-28,-7],[-35,6],[-22,14],[-13,25],
  [11,-11],[24,-12],[32,0],[21,23],[10,28]
];
// Ten compact groups along distinct routes. Stable IDs are shared by the Worker.
export const CASH_SITES=Object.freeze([2,6,12,16,20,25,30,35,43,46].flatMap((site,cluster)=>{
  const [x,z]=ORIGINAL_CASH_SITES[site];
  return Array.from({length:5},(_,slot)=>{
    const angle=(slot-1)*Math.PI/2+cluster*.43,radius=slot===0?0:1.05;
    return Object.freeze({x:x+Math.cos(angle)*radius,z:z+Math.sin(angle)*radius,index:cluster*5+slot});
  });
}));
export function dashPhase(dash,now){
  if(!dash)return 'idle';
  if(now<dash.startAt)return 'countdown';
  return now<dash.endAt&&dash.collected.length<CASH_SITES.length?'running':'finished';
}
export function reduceCashDash(world,event,user,now){
  if(event.type==='cash-start'){
    if(user!=='ISHIEE'||!world.candles||world.cashDash)return null;
    return {...world,holding:false,handRequest:null,cashDash:{startAt:now+CASH_COUNTDOWN_MS,endAt:now+CASH_COUNTDOWN_MS+CASH_DASH_MS,collected:[]}};
  }
  if(event.type==='cash-pickup'){
    const dash=world.cashDash;
    if(user!=='MOSHIEE'||dashPhase(dash,now)!=='running'||!Number.isInteger(event.index)||!CASH_SITES[event.index]||dash.collected.includes(event.index))return null;
    return {...world,cashDash:{...dash,collected:[...dash.collected,event.index]}};
  }
  return null;
}
