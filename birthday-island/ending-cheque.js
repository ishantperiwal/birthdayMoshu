import {buildLetterPaper} from './letter-paper.js';

export function buildEndingCheque({camera,envelope,interactive,canPick,canTurn=()=>true,getAmount,onOpen,onClose}){
  let amount=null,page=0,angle=0,flipAnimation=null,drag=null;
  const paper=buildLetterPaper(camera),pages=["<h2>To the owner of my heart,</h2><p>God, what I wouldn’t do to throw a birthday party for the girl of my dreams.</p><p>I miss you so, so much moshu 🥺</p><p>While building this little island, it felt like I was decorating for my favorite birthday party. I know I am a cliché doing stuff on digital screens, but I just wish I could see you in person and be around you on your birthday.</p><p>I’ll thank God every day for sending you into my life. It must have been hard for him to let you go, because you’re the best one he’s got. And somehow, I was the lucky one to witness your beauty inside out.</p><p>Mujhe sach mein lag raha hai ki mere sare achhe karam khatam ho gayee. Tu hi hai mere saare achhe karam 😭😭😭</p><p>Tu boli thi na? Mujhe kuch mat do, bas paise de do.<br>Ye le firrrr!!!</p><p>Jaise hi tu ye letter neeche rkhega, you will get 60 seconds to collect as much money as you can.</p><p>This island will be filled with it, and it’s all yourssss.<br>So stay ready.</p>","<h2>My Moshuu,</h2><p>I know I can’t be there to go shopping with you, to surprise you with things you like, or to have dinner with you.</p><p>I wish I could be there to see that smile in person. Until then, this little world, and all the love I’ve put into it, is yours.</p><p>I love you so much.</p><p class=\"letter-signoff\">Your Ishieee</p>"];
  const modal=document.createElement('div');modal.className='note-modal letter-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','A birthday letter from Ishi');
  modal.innerHTML=`<div class="letter-scene"><div class="letter-sheet">${pages.map((content,i)=>`<section class="birthday-cheque letter-face ${i?'letter-back':''}"><div class="birthday-letter">${content}</div>${i?'<div class="cheque-pay"><span>Total Winnings</span><b class="cheque-amount"></b></div>':''}</section>`).join('')}</div></div><nav class="letter-pages" aria-label="Letter controls"><button class="letter-flip"><kbd>T</kbd> Turn over</button><span class="page-count" aria-live="polite"></span><button class="letter-away"><kbd>Esc</kbd> Put away</button></nav>`;
  const style=document.createElement('style');style.textContent=`
  .letter-modal{display:flex;flex-direction:column;justify-content:center;gap:12px;box-sizing:border-box;padding:12px 16px}
  .letter-scene{perspective:1600px;width:min(760px,94vw);height:min(810px,calc(100dvh - 92px));flex:none}
  .letter-sheet{position:relative;width:100%;height:100%;transform-style:preserve-3d;touch-action:pan-y;cursor:grab}
  .letter-sheet:active{cursor:grabbing}
  .letter-face{position:absolute;inset:0;box-sizing:border-box;padding:24px 36px;overflow-y:auto;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#f4e9d4 repeating-linear-gradient(0deg,#80674904 0 1px,transparent 1px 4px);color:#655044;border:10px solid #dfcdae;box-shadow:0 22px 80px #0006;font:18px/1.65 Georgia,serif;user-select:none;overscroll-behavior:contain}
  .letter-back{transform:rotateY(180deg)}
  .letter-face h2{font:400 clamp(28px,5vw,44px) 'Caveat',Georgia,serif;margin:0 0 16px;color:#a0576d}
  .birthday-letter{font-size:var(--letter-size,19px);line-height:1.48}.birthday-letter p{margin:0 0 12px}.birthday-letter p:last-child{margin-bottom:0}.letter-signoff{font:400 34px 'Caveat',Georgia,serif;color:#a0576d}
  .cheque-pay{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid #ad9478;padding-top:18px}.cheque-amount{font:400 clamp(30px,7vw,48px) Georgia,serif;color:#874c5d}.cheque-signature{text-align:right;margin-top:14px;font:28px 'Caveat',Georgia,serif}
  .letter-pages{display:flex;align-items:center;justify-content:center;gap:16px;flex:none;color:#fff0d2;font:13px system-ui}.letter-pages button{display:flex;align-items:center;gap:10px;border:1px solid #ffffff20;border-radius:999px;padding:12px 20px;background:#162231e8;color:#fff0d2;font:500 14px system-ui;cursor:pointer}.letter-pages button:hover{background:#304354}.letter-pages kbd{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 5px;box-sizing:border-box;border-radius:5px;background:#fff0d2;color:#293744;font:600 12px system-ui}.letter-pages button:focus-visible{outline:2px solid #fff0d2;outline-offset:4px}
  .letter-pages button:disabled{opacity:.55;cursor:default}.cheque-pay{position:relative;flex-direction:column;gap:8px;margin:28px auto 8px;padding:24px 18px;border-top:1px solid #ad9478;border-bottom:1px solid #ad9478;text-align:center}.cheque-pay::before,.cheque-pay::after{content:"";position:absolute;left:50%;width:7px;height:7px;background:#ad9478;transform:translateX(-50%) rotate(45deg)}.cheque-pay::before{top:-4px}.cheque-pay::after{bottom:-4px}.cheque-pay>span{font:italic 20px Georgia,serif}.cheque-amount{font-size:52px}
  @media(max-width:520px){.letter-face{padding:18px 20px;border-width:6px}.letter-pages{gap:8px}.letter-pages button{padding:10px 12px}}
  `;document.head.append(style);document.body.append(modal);
  const sheet=modal.querySelector('.letter-sheet'),faces=[...modal.querySelectorAll('.letter-face')];
  function fitLetter(){
    // Use the available height first, then tighten type only when necessary.
    for(const face of faces){
      let size=19;face.style.setProperty('--letter-size',size+'px');
      while(face.scrollHeight>face.clientHeight+1&&size>14){size-=.25;face.style.setProperty('--letter-size',size+'px');}
    }
  }
  window.addEventListener('resize',()=>{if(modal.classList.contains('open'))fitLetter();});
  document.fonts?.ready.then(()=>{if(modal.classList.contains('open'))fitLetter();});
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function renderState(){const locked=!canTurn(),button=modal.querySelector('.letter-flip');button.disabled=locked;button.innerHTML=locked?'<svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" aria-hidden="true"><rect x="2" y="8" width="12" height="9" rx="2"/><path d="M5 8V5a3 3 0 0 1 6 0v3"/></svg> Turn over':'<kbd>T</kbd> Turn over';button.title=locked?'Unlocks after the money dash':'Turn over';faces.forEach((face,i)=>{face.inert=i!==page;face.setAttribute('aria-hidden',String(i!==page));});modal.querySelector('.page-count').textContent=`${page+1} / 2`;}
  function settle(target){
    flipAnimation?.cancel();
    const from=angle;angle=target;page=Math.abs(Math.round(target/180))%2;
    sheet.style.transform=`rotateY(${target}deg)`;
    if(!reduced()){
      flipAnimation=sheet.animate([{transform:`rotateY(${from}deg)`},{transform:`rotateY(${target}deg)`}],{duration:Math.max(180,Math.abs(target-from)*3.2),easing:'cubic-bezier(.22,.7,.2,1)'});
      flipAnimation.onfinish=()=>{flipAnimation=null;};
    }
    renderState();
  }
  function turn(){if(!canTurn()||drag||flipAnimation)return;settle(angle+180);}
  function close(){
    if(!modal.classList.contains('open'))return;
    flipAnimation?.cancel();flipAnimation=null;drag=null;
    modal.classList.remove('open');paper.play(faces[page].textContent);onClose();
  }
  sheet.addEventListener('pointerdown',e=>{
    if(!canTurn()||e.button!==0||flipAnimation)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,base:angle,active:false};
  });
  sheet.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.active){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}if(Math.abs(dx)<8)return;drag.active=true;sheet.setPointerCapture(e.pointerId);}
    angle=drag.base+Math.max(-180,Math.min(180,dx/sheet.clientWidth*230));
    sheet.style.transform=`rotateY(${angle}deg)`;
  });
  function release(e,cancel=false){
    if(!drag||drag.id!==e.pointerId)return;
    const {base,active}=drag,delta=angle-base;drag=null;
    if(sheet.hasPointerCapture(e.pointerId))sheet.releasePointerCapture(e.pointerId);
    if(active)settle(!cancel&&Math.abs(delta)>35?base+Math.sign(delta)*180:base);
  }
  sheet.addEventListener('pointerup',e=>release(e));sheet.addEventListener('pointercancel',e=>release(e,true));
  modal.querySelector('.letter-away').onclick=close;modal.querySelector('.letter-flip').onclick=turn;
  function open(){
    if(!canPick())return;
    amount=getAmount();envelope.visible=true;
    modal.querySelector('.cheque-amount').textContent=new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(amount);
    paper.stop();flipAnimation?.cancel();flipAnimation=null;drag=null;page=0;angle=0;sheet.style.transform='rotateY(0deg)';faces.forEach(face=>face.scrollTop=0);renderState();onOpen();modal.classList.add('open');fitLetter();modal.querySelector(canTurn()?'.letter-flip':'.letter-away').focus();
  }
  modal.addEventListener('click',e=>e.stopPropagation());
  window.addEventListener('keydown',e=>{
    if(!modal.classList.contains('open'))return;
    if(e.code==='Escape'){e.preventDefault();close();}
    else if(e.code==='KeyT'&&!e.repeat){e.preventDefault();turn();}
    else if(e.code==='Tab'){const buttons=[...modal.querySelectorAll('button')].filter(b=>!b.disabled),i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}
    e.stopImmediatePropagation();
  },true);
  interactive.push({object:envelope,reach:3,prompt:'read your letter',available:()=>canPick(),action:open});
}
