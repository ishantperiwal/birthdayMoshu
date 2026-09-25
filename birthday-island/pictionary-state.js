const WORDS=['birthday cake','moon','airplane','love letter','crown','rainbow','umbrella','butterfly','ice cream','sunflower','castle','mermaid','penguin','hot air balloon','campfire','teddy bear','shooting star','bicycle','pizza','sailboat','snowman','guitar','camera','dolphin','lighthouse','suitcase','wedding ring','coffee','palm tree','fireworks','cat','dog','elephant','heart','book','rocket','sandcastle','waterfall','picnic','headphones'];
const USERS=['MOSHIEE','ISHIEE'];
const normalize=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
export function gameView(game,user){
  if(!game)return null;
  return {round:game.round,drawer:game.drawer,solved:game.solved,guess:game.guess,endsAt:game.endsAt,serverTime:Date.now(),
    word:user===game.drawer||game.solved?game.word:null};
}
export function changeGame(game,event,user,random=Math.random,now=Date.now()){
  if(!USERS.includes(user))return undefined;
  if(event.action==='start'&&game)return undefined;
  if(event.action!=='start'&&(!game||event.round!==game.round))return undefined;
  if(event.action==='end')return null;
  if(['start','skip','swap','next'].includes(event.action)){
    if(event.action==='skip'&&user!==game.drawer)return undefined;
    if(event.action==='next'&&!game.solved)return undefined;
    const used=game?.used?.length<WORDS.length?game.used:[];
    const available=WORDS.filter(w=>!used.includes(w));
    const word=available[Math.min(available.length-1,Math.floor(random()*available.length))];
    const drawer=!game?'ISHIEE':['swap','next'].includes(event.action)?USERS.find(u=>u!==game.drawer):game.drawer;
    return {round:(game?.round||0)+1,drawer,word,used:[...used,word],guess:'',solved:false,endsAt:event.action==='skip'?game.endsAt:now+60000};
  }
  if(!['type','guess'].includes(event.action)||user===game.drawer||game.solved||typeof event.text!=='string')return undefined;
  const guess=event.text.replace(/[\x00-\x1f]/g,'').slice(0,60);
  const solved=event.action==='guess'&&normalize(guess)===normalize(game.word);
  return {...game,guess,solved,endsAt:solved?now+3000:game.endsAt};
}
export function advanceGame(game,now=Date.now()){
  if(!game||!game.endsAt||now<game.endsAt)return game;
  return changeGame(game,{action:'swap',round:game.round},game.drawer,Math.random,now);
}
