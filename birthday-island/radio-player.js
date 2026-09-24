// The campfire radio: a YouTube playlist heard only near the fireside.
// Two embedded players take turns so every song change can crossfade, and a
// small visible card shows what is playing while you are close enough to hear.

// Every entry was checked to play through the embedded player. Music labels
// refuse embeds on 127.0.0.1, so preview locally at http://localhost:4173/.
export const RADIO_PLAYLIST=[
  {id:'q7BmlOUk-II',title:'Steal The Show',artist:'Lauv'},
  {id:'2Vv-BfVoq4g',title:'Perfect',artist:'Ed Sheeran'},
  {id:'450p7goxZqg',title:'All of Me',artist:'John Legend'},
  {id:'rtOvBOTyX00',title:'A Thousand Years',artist:'Christina Perri'},
  {id:'vGJTaP6anOU',title:'Can’t Help Falling in Love',artist:'Elvis Presley'},
  {id:'lp-EO5I60KA',title:'Thinking Out Loud',artist:'Ed Sheeran'},
  {id:'kPa7bsKwL-c',title:'Die With A Smile',artist:'Lady Gaga & Bruno Mars'},
  {id:'0put0_a--Ng',title:'Make You Feel My Love',artist:'Adele'},
  {id:'-BjZmE2gtdo',title:'Lover',artist:'Taylor Swift'},
  {id:'0yW7w8F2TVA',title:'Say You Won’t Let Go',artist:'James Arthur'},
  {id:'nSDgHBxUbVQ',title:'Photograph',artist:'Ed Sheeran'},
  {id:'LjhCEhWiKXk',title:'Just The Way You Are',artist:'Bruno Mars'},
  {id:'yKNxeF4KMsY',title:'Yellow',artist:'Coldplay'}
];

const FADE_SECONDS=3.5,MAX_VOLUME=80,EARLY_CHANGE=5;

let apiPromise=null;
function loadYouTube(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  apiPromise??=new Promise((resolve,reject)=>{
    const previous=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{previous?.();resolve(window.YT);};
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';
    script.onerror=()=>{apiPromise=null;reject(new Error('YouTube unavailable'));};
    document.head.appendChild(script);
  });
  return apiPromise;
}

// requestNext(from,to) asks for a song change; the caller answers with play().
export function createRadio({playlist=RADIO_PLAYLIST,requestNext,onProblem=()=>{}}={}){
  const count=playlist.length;
  const card=document.createElement('aside');card.id='radio-card';card.setAttribute('aria-live','polite');
  card.innerHTML='<div class="radio-screens"><div class="radio-deck"><div></div></div><div class="radio-deck"><div></div></div></div><div class="radio-meta"><small>ON THE RADIO</small><b></b><span></span></div>';
  document.body.appendChild(card);
  const screens=[...card.querySelectorAll('.radio-deck')],title=card.querySelector('b'),artist=card.querySelector('.radio-meta span');
  const decks=screens.map(()=>({player:null,ready:false,index:-1,mix:0,target:0,volume:-1,paused:true,requested:false}));
  let active=0,index=null,proximity=0,started=false,starting=false,failures=0,checkClock=0;

  function show(){
    screens.forEach((s,i)=>s.classList.toggle('active',i===active));
    const song=playlist[index];if(song){title.textContent=song.title;artist.textContent=song.artist;}
  }
  function advance(from){requestNext?.(from,(from+1)%count);}

  function load(deck,i){
    deck.index=i;deck.requested=false;deck.paused=false;deck.volume=-1;
    deck.player.setVolume(0);deck.player.loadVideoById(playlist[i].id);
  }

  function play(i){
    if(!Number.isInteger(i)||!count)return;
    i=((i%count)+count)%count;
    if(i===index&&(!started||decks[active].index===i))return;
    index=i;if(!started)return;
    const current=decks[active];
    if(current.index<0){load(current,i);current.target=1;}
    else{
      // Fade the playing song out while the other player brings the new one in.
      const next=decks[1-active];load(next,i);next.mix=0;next.target=1;current.target=0;active=1-active;
    }
    show();
  }

  async function start(){
    if(started||starting)return;starting=true;
    let YT;try{YT=await loadYouTube();}catch{starting=false;onProblem('offline');return;}
    await Promise.all(decks.map((deck,d)=>new Promise(resolve=>{
      deck.player=new YT.Player(screens[d].firstElementChild,{
        width:220,height:124,host:'https://www.youtube.com',
        playerVars:{autoplay:0,controls:0,disablekb:1,fs:0,iv_load_policy:3,playsinline:1,rel:0,origin:location.origin},
        events:{
          onReady:()=>{deck.ready=true;deck.player.setVolume(0);resolve();},
          onStateChange:e=>{
            if(deck!==decks[active])return;
            if(e.data===1)failures=0;
            if(e.data===0&&!deck.requested){deck.requested=true;advance(deck.index);}
          },
          onError:e=>{
            if(deck!==decks[active]||deck.requested)return;
            if((e.data===101||e.data===150)&&location.hostname==='127.0.0.1')onProblem('local-origin');
            // Skip a song that will not play, but stop if the whole list fails.
            if(++failures<count){deck.requested=true;advance(deck.index);}
          }
        }
      });
    })));
    started=true;starting=false;
    if(index!==null){const pending=index;index=null;play(pending);}
  }

  // Browsers that held back playback get another try on the next click.
  function resume(){const deck=decks[active];if(started&&deck.index>=0&&deck.target>0)deck.player.playVideo?.();}

  function update(dt,near){
    proximity=near;card.classList.toggle('near',started&&index!==null&&near>.03);
    if(!started)return;
    for(const deck of decks){
      if(deck.index<0)continue;
      deck.mix+=Math.max(-dt/FADE_SECONDS,Math.min(dt/FADE_SECONDS,deck.target-deck.mix));
      if(deck.target===0&&deck.mix<=0&&!deck.paused){deck.paused=true;deck.player.pauseVideo();}
      const volume=Math.round(MAX_VOLUME*proximity*deck.mix);
      if(volume!==deck.volume){deck.volume=volume;deck.player.setVolume(volume);}
    }
    // Begin the next song a few seconds early so the change is a crossfade.
    if((checkClock+=dt)<.5)return;checkClock=0;
    const deck=decks[active];if(deck.requested||deck.index<0)return;
    const duration=deck.player.getDuration?.()||0,time=deck.player.getCurrentTime?.()||0;
    if(duration>30&&duration-time<EARLY_CHANGE){deck.requested=true;advance(deck.index);}
  }

  // Read-only snapshot for inspection and browser tests.
  const state=()=>({index,active,started,decks:decks.map(d=>({index:d.index,mix:+d.mix.toFixed(2),volume:d.volume,state:d.player?.getPlayerState?.()??null,time:+(d.player?.getCurrentTime?.()||0).toFixed(1)}))});
  return {start,play,resume,update,state,get index(){return index;},get count(){return count;}};
}
