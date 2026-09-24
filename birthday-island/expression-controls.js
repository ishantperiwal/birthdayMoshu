import {EXPRESSIONS,cleanExpression,EXPRESSION_MS,expressionRemaining} from './expressions.js?v=timed-3';

export function buildExpressionControls({container,isOnline=false,user='ISHIEE',onSelect,onPreviewMessage,now=Date.now}){
  const panel=document.createElement('section');panel.id='expression-panel';panel.setAttribute('aria-label','Facial expressions');
  const top=document.createElement('div');top.className='expression-heading';top.hidden=true;
  const caption=document.createElement('span');caption.textContent=isOnline?'Your expression':'Expression';top.append(caption);
  const target=document.createElement('select');target.setAttribute('aria-label','Character to preview');
  for(const [id,label] of [['ISHIEE','Him'],['MOSHIEE','Her']]){const option=document.createElement('option');option.value=id;option.textContent=label;target.append(option);}
  target.value=isOnline?user:'ISHIEE';target.hidden=isOnline;top.append(target);panel.append(top);
  const row=document.createElement('div');row.className='expression-buttons';row.setAttribute('role','group');row.setAttribute('aria-label','Choose an expression');panel.append(row);
  const state={ISHIEE:'normal',MOSHIEE:'normal'},buttons=[];
  const until={ISHIEE:0,MOSHIEE:0};
  const status=document.createElement('p');status.className='expression-status';status.setAttribute('role','status');panel.append(status);
  let previewMessage=null;
  if(!isOnline&&onPreviewMessage){
    previewMessage=document.createElement('button');previewMessage.type='button';previewMessage.className='preview-message';
    previewMessage.addEventListener('click',()=>onPreviewMessage(target.value));panel.append(previewMessage);
  }
  function refresh(){
    const current=state[target.value];
    for(const [button,id] of buttons){button.setAttribute('data-timed',String(id===current&&id!=='normal'));}
    status.textContent=`${isOnline?'Your':target.value==='ISHIEE'?'His':'Her'} face · ${EXPRESSIONS.find(e=>e.id===current).label}`;
    if(previewMessage)previewMessage.textContent=target.value==='ISHIEE'?'Preview his message':'Preview her message';
  }
  for(const expression of EXPRESSIONS){
    const button=document.createElement('button');button.type='button';button.textContent=expression.emoji;
    button.title=expression.label;button.setAttribute('aria-label',expression.label);
    button.addEventListener('click',()=>{
      if(onSelect(target.value,expression.id)===false)return;
      state[target.value]=expression.id;until[target.value]=expression.id==='normal'?0:now()+EXPRESSION_MS;refresh();
    });row.append(button);buttons.push([button,expression.id]);
  }
  target.addEventListener('change',refresh);container.append(panel);refresh();
  return {
    setTarget(id){if(!isOnline&&id in state){target.value=id;refresh();}},
    setMode(commands){panel.hidden=commands;},
    sync(values={},deadlines={}){for(const id of ['ISHIEE','MOSHIEE']){state[id]=cleanExpression(values[id])||'normal';until[id]=deadlines[id]??(state[id]==='normal'?0:now()+EXPRESSION_MS);}this.update();refresh();},
    update(){
      const time=now();let changed=false;
      for(const id of ['ISHIEE','MOSHIEE'])if(state[id]!=='normal'&&!expressionRemaining(until[id],time)){state[id]='normal';changed=true;}
      if(changed)refresh();
      const remaining=expressionRemaining(until[target.value],time)/EXPRESSION_MS;
      for(const [button,id] of buttons)button.style.setProperty('--remaining',id===state[target.value]?remaining:0);
    },
    setConnected(connected){for(const [button] of buttons)button.disabled=isOnline&&!connected;status.textContent=isOnline&&!connected?'Reconnect to change your expression':status.textContent;}
  };
}
