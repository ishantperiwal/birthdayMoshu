import {loadYouTube} from './radio-player.js';

export function buildWelcomeMusic(button){
  const mount=document.createElement('div');mount.style.cssText='position:fixed;width:220px;height:200px;left:-1000px;pointer-events:none';mount.setAttribute('aria-hidden','true');
  const host=document.createElement('div');mount.append(host);document.body.append(mount);
  let player,ready=false,wanted=false,leaving=false,volume=0,failed=false,deliberatelyPaused=false;
  function label(){button.textContent=failed?'♪ Retry music':wanted?'♪ Pause music':'♪ Play a little music';button.setAttribute('aria-pressed',String(wanted));}
  function play(){if(leaving)return;wanted=true;label();if(ready){player.unMute();player.playVideo();}}
  function firstClick(e){if(e.target.closest('#enter')||e.target.closest('#welcome-music')||wanted||leaving||deliberatelyPaused)return;play();}
  document.querySelector('#welcome').addEventListener('click',firstClick);
  button.onclick=()=>{if(leaving)return;if(wanted){wanted=false;deliberatelyPaused=true;player?.pauseVideo();}else{deliberatelyPaused=false;failed=false;play();}label();};
  loadYouTube().then(YT=>{if(leaving)return;player=new YT.Player(host,{width:220,height:200,videoId:'8XjYw8Wuv6Q',playerVars:{autoplay:0,controls:0,playsinline:1,loop:1,playlist:'8XjYw8Wuv6Q',origin:location.origin},events:{
    onReady:()=>{ready=true;player.setVolume(0);if(wanted)play();},
    onAutoplayBlocked:()=>{wanted=false;label();},
    onError:()=>{failed=true;wanted=false;label();}
  }});}).catch(()=>{failed=true;wanted=false;label();});
  const timer=setInterval(()=>{if(!ready)return;const target=wanted&&!leaving?35:0;volume+=(target-volume)*(leaving?.1:.04);player.setVolume(Math.round(volume));if(leaving&&volume<.5){clearInterval(timer);player.destroy();mount.remove();}},100);
  return {leave(){leaving=true;document.querySelector('#welcome').removeEventListener('click',firstClick);if(!ready){clearInterval(timer);player?.destroy();mount.remove();}}};
}
