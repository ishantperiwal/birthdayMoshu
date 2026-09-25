export function buildHandTuner({values,onChange,onOpen,onClose,canOpen}){
  const panel=document.createElement('section');panel.hidden=true;
  panel.style.cssText='position:fixed;right:18px;top:18px;width:320px;max-height:85vh;overflow:auto;z-index:10000;padding:20px;background:#172332f2;color:#fff7e7;border:1px solid #ffffff40;border-radius:16px;font:15px/1.5 system-ui;box-shadow:0 12px 40px #0006';
  const title=document.createElement('strong');title.textContent='Hand positioning · P to close';panel.append(title);
  const hint=document.createElement('p');hint.textContent='Hold hands, then adjust. Changes appear live.';panel.append(hint);
  const controls=[];
  const defaults={...values};
  for(const [key,label,min,max,step,unit] of [
    ['originX','Her arm start · X (left/right)',-1.5,1.5,.01,'m'],
    ['originY','Her arm start · Y (down/up)',-1.5,1.5,.01,'m'],
    ['originZ','Her arm start · Z (front/back)',-1.5,1.5,.01,'m'],
    ['herX','Her ring only · X',-.5,.5,.005,'m'],
    ['herY','Her ring only · Y',-.5,.5,.005,'m'],
    ['herZ','Her ring only · Z',-.5,.5,.005,'m'],
    ['centerX','Meeting point · left / right',-.8,.8,.01,'m'],
    ['centerY','Meeting point · down / up',-.8,.8,.01,'m'],
    ['centerZ','Meeting point · forward / back',-.8,.8,.01,'m'],
    ['spacing','Grip spacing',0,.25,.005,'m'],
    ['roll','Her grip · alignment',-180,180,1,'°'],
    ['hook','Her hand · relative rotation',-180,180,1,'°'],
    ['rotationX','Her grip · X rotation',-180,180,1,'°'],
    ['rotationY','Her grip · Y rotation',-180,180,1,'°'],
    ['rotationZ','Her grip · Z rotation',-180,180,1,'°'],
    ['hisRotationX','His grip · X rotation',-180,180,1,'°'],
    ['hisRotationY','His grip · Y rotation',-180,180,1,'°'],
    ['hisRotationZ','His grip · Z rotation',-180,180,1,'°']]){
    const row=document.createElement('label');row.style.cssText='display:block;margin:16px 0';
    const caption=document.createElement('span'),output=document.createElement('output');caption.textContent=label;output.style.cssText='float:right;font-variant-numeric:tabular-nums';
    const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.style.cssText='display:block;width:100%;margin-top:10px;accent-color:#edc986';
    const sync=()=>{input.value=values[key];output.textContent=Number(values[key]).toFixed(unit==='m'?3:0)+unit;};sync();controls.push(sync);
    input.addEventListener('input',()=>{values[key]=Number(input.value);sync();onChange(values);});row.append(caption,output,input);panel.append(row);
  }
  const copy=document.createElement('button'),reset=document.createElement('button'),close=document.createElement('button');
  copy.textContent='Copy values';reset.textContent='Reset';close.textContent='Close';
  for(const button of [copy,reset,close]){button.type='button';button.style.cssText='padding:9px 12px;margin:4px;border-radius:8px;border:0;cursor:pointer';panel.append(button);}
  const text=document.createElement('textarea');text.readOnly=true;text.hidden=true;text.style.cssText='width:100%;height:150px;margin-top:10px';panel.append(text);
  copy.onclick=async()=>{text.hidden=false;text.value=JSON.stringify(values,null,2);text.select();try{await navigator.clipboard.writeText(text.value);copy.textContent='Copied';}catch{copy.textContent='Select and copy below';}};
  reset.onclick=()=>{Object.assign(values,defaults);controls.forEach(sync=>sync());onChange(values);};
  const hide=()=>{panel.hidden=true;onClose();};close.onclick=hide;
  document.body.append(panel);
  window.addEventListener('keydown',event=>{
    if(event.code==='KeyP'&&!event.repeat&&(!panel.hidden||canOpen())&&!event.ctrlKey&&!event.metaKey){
      if(panel.hidden&&/INPUT|TEXTAREA/.test(event.target.tagName))return;
      event.preventDefault();event.stopImmediatePropagation();
      if(panel.hidden){panel.hidden=false;onOpen();}else hide();return;
    }
    if(!panel.hidden){event.stopImmediatePropagation();if(event.code==='Escape'){event.preventDefault();hide();}}
  },true);
  for(const name of ['mousedown','click','mousemove','keyup'])panel.addEventListener(name,event=>event.stopPropagation());
  onChange(values);
  return {get active(){return !panel.hidden;}};
}
