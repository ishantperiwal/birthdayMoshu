import {EXPRESSIONS} from './expressions.js?v=kiss-4';

export const WHEEL_ACTIONS=Object.freeze([
  {id:'wave',label:'Say hi',emoji:'👋',kind:'gesture'},
  ...EXPRESSIONS.filter(item=>item.id!=='normal').map(item=>({...item,kind:'expression'})),
  {id:'cheer',label:'Celebrate',emoji:'🙌',kind:'gesture'},
  {...EXPRESSIONS[0],kind:'expression'}
]);
export function wheelSelection(x,y,count=WHEEL_ACTIONS.length){
  if(Math.hypot(x,y)<48)return -1;
  const angle=(Math.atan2(y,x)+Math.PI/2+Math.PI*2)%(Math.PI*2);
  return Math.floor((angle+Math.PI/count)%(Math.PI*2)/(Math.PI*2/count));
}
export function buildGestureWheel({surface,canOpen,onSelect,onOpen}){
  let active=false,x=0,y=0,selected=-1;
  const overlay=document.createElement('div');overlay.id='gesture-wheel';overlay.hidden=true;
  const wheel=document.createElement('div');wheel.className='gesture-wheel-disc';wheel.setAttribute('role','listbox');wheel.setAttribute('aria-label','Choose a gesture; release right mouse button to perform it');
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','-170 -170 340 340');svg.setAttribute('aria-hidden','true');
  const items=[],wedges=[];
  const p=(a,r)=>[Math.sin(a)*r,-Math.cos(a)*r];
  WHEEL_ACTIONS.forEach((action,index)=>{
    const angle=index*Math.PI*2/WHEEL_ACTIONS.length,half=Math.PI/WHEEL_ACTIONS.length-.025;
    const [a,b,c,d]=[p(angle-half,156),p(angle+half,156),p(angle+half,62),p(angle-half,62)];
    const path=document.createElementNS(ns,'path');path.setAttribute('d',`M ${a} A 156 156 0 0 1 ${b} L ${c} A 62 62 0 0 0 ${d} Z`);svg.append(path);wedges.push(path);
    const item=document.createElement('div');item.className='gesture-wheel-option';item.id=`gesture-wheel-${action.id}`;item.setAttribute('role','option');item.setAttribute('aria-selected','false');
    const [px,py]=p(angle,110);item.style.left=`calc(50% + ${px}px)`;item.style.top=`calc(50% + ${py}px)`;
    const emoji=document.createElement('span');emoji.textContent=action.emoji;
    const label=document.createElement('span');label.textContent=action.label;item.append(emoji,label);items.push(item);
  });
  wheel.append(svg,...items);
  const centre=document.createElement('div');centre.className='gesture-wheel-centre';centre.textContent='None';wheel.append(centre);
  const dot=document.createElement('div');dot.className='gesture-wheel-dot';wheel.append(dot);overlay.append(wheel);document.body.append(overlay);
  function paint(){
    selected=wheelSelection(x,y);
    items.forEach((item,index)=>{item.setAttribute('aria-selected',String(index===selected));wedges[index].classList.toggle('active',index===selected);});
    wheel.setAttribute('aria-activedescendant',selected<0?'':items[selected].id);
    dot.style.transform=`translate(${x}px,${y}px)`;
    centre.classList.toggle('active',selected<0);
  }
  function close(commit=false){
    if(!active)return;
    const action=selected>=0?WHEEL_ACTIONS[selected]:null;
    active=false;overlay.hidden=true;document.body.classList.remove('gesture-wheel-open');
    if(commit&&action)onSelect(action);
  }
  window.addEventListener('mousedown',event=>{
    if(active){event.preventDefault();event.stopImmediatePropagation();return;}
    if(event.button!==2||!canOpen()||(event.target!==surface&&document.pointerLockElement!==surface))return;
    event.preventDefault();event.stopImmediatePropagation();active=true;x=y=0;overlay.hidden=false;document.body.classList.add('gesture-wheel-open');onOpen();paint();
  },true);
  window.addEventListener('mousemove',event=>{
    if(!active)return;event.preventDefault();event.stopImmediatePropagation();
    x+=event.movementX;y+=event.movementY;
    const radius=Math.hypot(x,y);if(radius>145){x*=145/radius;y*=145/radius;}paint();
  },true);
  window.addEventListener('mouseup',event=>{
    if(!active)return;event.preventDefault();event.stopImmediatePropagation();if(event.button===2)close(true);
  },true);
  window.addEventListener('keydown',event=>{if(active){event.preventDefault();event.stopImmediatePropagation();if(event.code==='Escape')close();}},true);
  surface.addEventListener('contextmenu',event=>event.preventDefault());
  window.addEventListener('blur',()=>close());window.addEventListener('pointercancel',()=>close());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});
  document.addEventListener('pointerlockchange',()=>{if(active&&document.pointerLockElement!==surface)close();});
  return {get active(){return active;},cancel:()=>close()};
}
