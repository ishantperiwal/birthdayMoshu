export function buildChatLog(){
  const root=document.createElement('aside');root.id='chat-log';
  root.setAttribute('role','log');root.setAttribute('aria-live','polite');root.setAttribute('aria-label','Recent chat');
  root.style.cssText='position:fixed;left:24px;bottom:24px;z-index:30;width:min(360px,calc(100vw - 48px));display:flex;flex-direction:column;gap:5px;pointer-events:none;font:13px/1.45 system-ui;color:#fff3df;';
  document.body.append(root);
  const entries=[];let nextLayout=0;
  function show(user,text,now=performance.now()){
    const line=document.createElement('div'),name=document.createElement('strong'),message=document.createElement('span');
    line.style.cssText='padding:5px 9px;border-radius:5px;background:rgba(16,26,40,.78);width:fit-content;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere;white-space:pre-wrap;';
    name.textContent=user==='ISHIEE'?'Ishi: ':'Moshi: ';name.style.color=user==='ISHIEE'?'#bcdcff':'#ffc6dc';
    message.textContent=text;line.append(name,message);root.append(line);entries.push({line,born:now});
    if(entries.length>6)entries.shift().line.remove();
    nextLayout=0;
  }
  function update(now=performance.now()){
    for(let i=entries.length-1;i>=0;i--){
      const entry=entries[i],age=now-entry.born;
      if(age>=12000){entry.line.remove();entries.splice(i,1);}
      else entry.line.style.opacity=String(Math.min(1,Math.max(0,(12000-age)/2000)));
    }
    if(!entries.length||now<nextLayout)return;
    nextLayout=now+250;
    let bottom=24;const right=Math.min(innerWidth-24,384);
    for(const selector of ['#controls','#bouquet-controls','#host-controls']){
      const element=document.querySelector(selector);if(!element)continue;
      const rect=element.getBoundingClientRect();
      if(rect.width&&rect.height&&rect.left<right&&rect.right>24&&rect.top>innerHeight/2)bottom=Math.max(bottom,innerHeight-rect.top+12);
    }
    root.style.bottom=`${bottom}px`;
  }
  return {show,update};
}
