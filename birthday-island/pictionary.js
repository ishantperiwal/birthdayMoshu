import {changeGame,gameView} from './pictionary-state.js';
// Online answers remain server-owned; local practice can preview either role.
export function buildPictionary({gaze,available,user,send,online,local=false,clearQueuedInk,toast}){
  let state=null,shown=false,typingTimer,practice=null,viewUser=user;
  const panel=document.createElement('section');panel.className='sky-pictionary';panel.hidden=true;
  panel.innerHTML='<div class="sky-game-label">Pictionary · just for us</div><div class="sky-game-word"></div><div class="sky-game-guess" aria-live="polite"></div><input aria-label="Your guess" maxlength="60" placeholder="Type your guess… Enter to send" autocomplete="off"><div class="sky-game-actions"><button data-action="skip">New word</button><button data-action="swap">Swap turns</button><button data-action="next">Next word</button><button data-action="end">End game</button><button data-action="close">Esc · look around</button></div>';
  document.body.append(panel);
  const input=panel.querySelector('input'),word=panel.querySelector('.sky-game-word'),guess=panel.querySelector('.sky-game-guess');
  const preview=document.createElement('button');preview.textContent='Try guessing';preview.hidden=!local;
  panel.querySelector('.sky-game-actions').prepend(preview);
  preview.addEventListener('click',()=>{viewUser=viewUser==='MOSHIEE'?'ISHIEE':'MOSHIEE';receive(gameView(practice,viewUser));});
  if(local)panel.querySelector('.sky-game-label').textContent='Pictionary · local practice';
  const action=(action,text)=>{
    const event={type:'pictionary',action,round:state?.round,text};
    if(!local){send(event);return;}
    const next=changeGame(practice,event,viewUser);
    if(next!==undefined){practice=next;receive(gameView(practice,viewUser));}
  };
  function render(){
    panel.hidden=!shown||!available()||!state;
    if(!state)return;
    const mine=state.drawer===viewUser;
    preview.textContent=mine?'Try guessing':'Back to drawing';
    word.textContent=state.solved?`You got it! ${state.word}`:mine?`Draw: ${state.word}`:'What are they drawing?';
    guess.textContent=state.guess?`“${state.guess}”${state.solved?' ♡':''}`:mine?'Their guess will appear here.':'No timer. Take your time.';
    input.hidden=mine||state.solved;
    panel.querySelector('[data-action="skip"]').hidden=!mine||state.solved;
    panel.querySelector('[data-action="next"]').hidden=!state.solved;
  }
  function close(){shown=false;input.blur();gaze.stopDrawing();render();}
  function open(){
    if(!local&&!online()){toast('Pictionary needs both private invite links connected.');return;}
    shown=true;
    if(!state)action('start');
    else{gaze.startDrawing();render();if(state.drawer!==viewUser&&!state.solved)input.focus();}
  }
  for(const name of ['mousedown','mousemove','mouseup','pointerdown','pointermove'])panel.addEventListener(name,e=>e.stopPropagation());
  panel.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.action==='close')close();else action(button.dataset.action);});
  input.addEventListener('input',()=>{clearTimeout(typingTimer);typingTimer=setTimeout(()=>action('type',input.value),180);});
  input.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();close();}else if(e.code==='Enter'){e.preventDefault();clearTimeout(typingTimer);action('guess',input.value);}});
  function receive(next){
      const changed=next?.round!==state?.round;
      clearTimeout(typingTimer);
      if(changed){clearQueuedInk();gaze.clearInk();input.value='';}
      state=next;gaze.setGame(!!state,!state||state.drawer===viewUser&&!state.solved);
      if(state&&changed&&available()){shown=true;gaze.startDrawing();}
      if(!state)shown=false;
      render();if(shown&&state?.drawer!==viewUser&&!state?.solved&&!panel.hidden)input.focus();
    }
  return {
    get round(){return state?.round;},receive,
    keyDown(e){if(!available())return false;if(e.code==='KeyP'&&!e.repeat){e.preventDefault();open();return true;}if(e.code==='Escape'&&shown){e.preventDefault();close();return true;}return false;},
    update(){render();}
  };
}
