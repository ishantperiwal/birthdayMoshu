// Synthesised music and firework sounds. Like the rest of the island, nothing
// here loads an audio file: every note and boom is built from
// oscillators and one shared noise buffer, then placed in a generated reverb.

const midi=n=>440*2**((n-69)/12);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Happy Birthday in 3/4 as [beat, midi note, beats]. The loop ends with a long
// held note and a few quiet bars so it breathes instead of nagging.
const BIRTHDAY_BEAT=.8,BIRTHDAY_LOOP=33;
const BIRTHDAY_MELODY=[
  [2,67,.7],[2.7,67,.3],
  [3,69,1],[4,67,1],[5,72,1],
  [6,71,2],[8,67,.7],[8.7,67,.3],
  [9,69,1],[10,67,1],[11,74,1],
  [12,72,2],[14,67,.7],[14.7,67,.3],
  [15,79,1],[16,76,1],[17,72,1],
  [18,71,1],[19,69,1.1],[20.1,77,.65],[20.75,77,.25],
  [21,76,1],[22,72,1],[23,74,1.2],
  [24.2,72,3.5]
];
// Chords as [root, upper, upper]. A plucked waltz (root, then two soft chord
// taps) carries the harmony; nothing sustains between notes.
const C=[48,60,64],G7=[43,53,59],F=[41,57,60],C7=[48,58,64];
const BIRTHDAY_CHORDS=[[3,C,3],[6,G7,6],[12,C,3],[15,C7,3],[18,F,3],[21,C,2],[23,G7,1.2],[24.2,C,0]];
const BIRTHDAY_ACCOMPANIMENT=BIRTHDAY_CHORDS.flatMap(([start,notes,len])=>len===0
  ? [[start,notes,'roll']]
  : Array.from({length:Math.ceil(len)},(_,k)=>[start+k,notes,k%3===0?'root':'tap']));

// After the wish: a very quiet, slow romantic drift kept in the low-middle
// register (nothing above A4), with long silences between phrases.
const CALM_BEAT=1.1,CALM_BEATS=8;
const CALM_CHORDS=[
  {bass:41,roll:[53,57,60,64]}, // Fmaj7
  {bass:40,roll:[52,55,59,62]}, // Em7
  {bass:38,roll:[53,57,60,64]}, // Dm9
  {bass:43,roll:[52,55,60,64]}  // C/G
];
const CALM_SCALE=[55,57,60,62,64,67,69];
const SPARKLE=[84,88,91,93,96,98];

export function createSoundscape(ctx,out,{musicLevel=1}={}){
  const noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
  {const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}

  // Open-air reverb: a decaying stereo noise tail, softened like sound over water.
  const tail=Math.floor(ctx.sampleRate*3.8),ir=ctx.createBuffer(2,tail,ctx.sampleRate),fadeIn=ctx.sampleRate*.015;
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<tail;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/tail,3)*Math.min(1,i/fadeIn);}
  const reverb=ctx.createConvolver();reverb.buffer=ir;
  const warm=ctx.createBiquadFilter();warm.type='lowpass';warm.frequency.value=3400;
  const wet=ctx.createGain();wet.gain.value=.6;reverb.connect(warm).connect(wet).connect(out);

  const musicOut=ctx.createGain();musicOut.gain.value=1;musicOut.connect(out);
  const fx=ctx.createGain();fx.gain.value=1;fx.connect(out);

  function env(g,t,peak,attack,decay){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+attack+decay);}
  function osc(type,freq,t,stop,dest){const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,t);o.connect(dest);o.start(t);o.stop(stop);return o;}
  function gain(dest){const g=ctx.createGain();g.connect(dest);return g;}
  function noiseSource(t,duration,dest){const s=ctx.createBufferSource();s.buffer=noise;s.loop=true;s.connect(dest);s.start(t,Math.random()*1.8);s.stop(t+duration);return s;}
  function panner(pan,dest){if(!ctx.createStereoPanner)return dest;const p=ctx.createStereoPanner();p.pan.value=clamp(pan,-1,1);p.connect(dest);return p;}

  /* Instruments ------------------------------------------------------------ */

  // Music box: a pure fundamental, a quick octave and a brief inharmonic tine.
  function musicBox(bus,note,t,vel=1,decay=2.6){
    const f=midi(note);
    const body=gain(bus);env(body,t,.05*vel,.012,decay);osc('sine',f,t,t+decay+.1,body);
    const octave=gain(bus);env(octave,t,.011*vel,.006,decay*.35);osc('sine',f*2,t,t+decay*.4,octave);
    const tine=gain(bus);env(tine,t,.0035*vel,.003,.16);osc('sine',f*5.4,t,t+.22,tine);
  }
  // Rounder celesta-like bell for the second verse and the calm song.
  function bell(bus,note,t,vel=1,decay=3.2){
    const f=midi(note),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(5200,f*4);lp.connect(bus);
    const body=gain(lp);env(body,t,.042*vel,.014,decay);osc('triangle',f,t,t+decay+.1,body);
    const shine=gain(bus);env(shine,t,.007*vel,.006,decay*.3);osc('sine',f*3,t,t+decay*.35,shine);
  }
  // Soft harp-like pluck: a triangle whose brightness closes as it rings out.
  function pluck(bus,note,t,vel=1,decay=1.8){
    const f=midi(note),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=.4;
    lp.frequency.setValueAtTime(Math.min(6000,f*7),t);lp.frequency.exponentialRampToValueAtTime(Math.max(180,f*1.4),t+decay*.5);lp.connect(bus);
    const body=gain(lp);env(body,t,.04*vel,.006,decay);osc('triangle',f,t,t+decay+.1,body);
  }

  // Warm, rounded tone with no bright overtones for the after-wish song.
  function warmTone(bus,note,t,vel=1,decay=3.6){
    const f=midi(note),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=.3;lp.frequency.value=Math.min(1200,f*2.2);lp.connect(bus);
    const body=gain(lp);env(body,t,.04*vel,.05,decay);osc('triangle',f,t,t+decay+.2,body);
  }

  /* Music scheduling ------------------------------------------------------- */

  const levels={birthday:.8,calm:.75};
  const songs={
    birthday(){
      const beats=[...new Set([...BIRTHDAY_MELODY.map(e=>e[0]),...BIRTHDAY_ACCOMPANIMENT.map(e=>e[0])])].sort((a,b)=>a-b);
      let index=0,loop=0;
      return t=>{
        const beat=beats[index],human=()=>(Math.random()-.5)*.014;
        // Odd verses switch to the softer bell so repeats never feel mechanical.
        const voice=loop%2?bell:musicBox;
        for(const [at,note,len] of BIRTHDAY_MELODY)if(at===beat)voice(this.bus,note,t+human(),(Number.isInteger(at)&&at%3===0?1:.82)*(.9+Math.random()*.12),Math.max(2.2,len*BIRTHDAY_BEAT*1.6));
        for(const [at,[root,...upper],kind] of BIRTHDAY_ACCOMPANIMENT)if(at===beat){
          if(kind==='root')pluck(this.bus,root,t,.95,2);
          else if(kind==='tap')upper.forEach(n=>pluck(this.bus,n,t+human(),.42,1.1));
          else [root,...upper].forEach((n,i)=>pluck(this.bus,n,t+i*.16,.7,3.2));
        }
        index++;let next=beats[index];
        if(index>=beats.length){index=0;loop++;next=beats[0]+BIRTHDAY_LOOP;}
        return (next-beat)*BIRTHDAY_BEAT;
      };
    },
    calm(){
      let bar=0,step=3;
      return t=>{
        const chord=CALM_CHORDS[bar%CALM_CHORDS.length],length=CALM_BEATS*CALM_BEAT;
        // One low note and a slow, soft roll per chord; no sustained layer.
        warmTone(this.bus,chord.bass,t,.8,3.4);
        chord.roll.forEach((n,i)=>warmTone(this.bus,n,t+.4+i*.42,.42,3.6));
        // A short melody only every other bar, and only a few notes.
        if(bar%2===1){
          const notes=2+(Math.random()*2|0);
          for(let i=0;i<notes;i++){
            step=clamp(step+[-1,-1,0,1,1][Math.random()*5|0],0,CALM_SCALE.length-1);
            warmTone(this.bus,CALM_SCALE[step],t+CALM_BEAT*(2+i*1.5)+(Math.random()-.5)*.05,.55+Math.random()*.2,3.8);
          }
        }
        bar++;return length;
      };
    }
  };

  let current=null;
  const LOOKAHEAD=2.2;
  setInterval(()=>{
    if(!current||ctx.state!=='running')return;
    const now=ctx.currentTime;
    // After a long background pause, rejoin gently instead of bursting all missed notes.
    if(current.cursor<now-.25)current.cursor=now+.3;
    while(current.cursor<now+LOOKAHEAD)current.cursor+=current.step(current.cursor);
  },220);

  function setMusic(name,{delay=.4,fade=2.8}={}){
    if(current?.name===name||!songs[name])return;
    const now=ctx.currentTime;
    if(current){
      const old=current.bus;old.gain.cancelScheduledValues(now);old.gain.setValueAtTime(old.gain.value,now);old.gain.linearRampToValueAtTime(0,now+fade);
      setTimeout(()=>old.disconnect(),(fade+LOOKAHEAD+8)*1000);
    }
    const bus=ctx.createGain(),send=ctx.createGain(),level=levels[name]*musicLevel;
    bus.gain.setValueAtTime(0,now);bus.gain.setValueAtTime(0,now+delay);bus.gain.linearRampToValueAtTime(level,now+delay+fade);
    send.gain.value=.5;bus.connect(musicOut);bus.connect(send).connect(reverb);
    current={name,bus,cursor:now+delay};
    current.step=songs[name].call(current);
  }

  // Lower the island music as you get closer to the fireside radio (0–1).
  let ducked=0;
  function duck(amount){amount=clamp(+amount||0,0,1);if(Math.abs(amount-ducked)<.02&&amount%1!==0)return;if(amount===ducked)return;ducked=amount;musicOut.gain.setTargetAtTime(1-amount*.9,ctx.currentTime,.4);}

  /* Fireworks -------------------------------------------------------------- */

  const loudness=distance=>clamp(95/Math.max(1,distance),.3,1);
  function fxOut(pan,wetAmount){
    const g=ctx.createGain();g.connect(panner(pan,fx));
    const send=ctx.createGain();send.gain.value=wetAmount;g.connect(send).connect(reverb);return g;
  }

  // A soft mortar tock, then a rising airy whoosh while the shell climbs.
  function launch({delay=0,pan=0,distance=120,life=1.55,whistle=false}={}){
    const t=ctx.currentTime+delay,a=loudness(distance),o=fxOut(pan,.35);
    const tock=gain(o);env(tock,t,.06*a,.004,.2);osc('sine',190,t,t+.3,tock).frequency.exponentialRampToValueAtTime(80,t+.2);
    const band=ctx.createBiquadFilter();band.type='bandpass';band.Q.value=2.4;band.frequency.setValueAtTime(360,t);band.frequency.exponentialRampToValueAtTime(2300,t+life);band.connect(o);
    const air=gain(band);air.gain.setValueAtTime(.0001,t);air.gain.exponentialRampToValueAtTime(.12*a,t+.14);air.gain.exponentialRampToValueAtTime(.035*a,t+life*.75);air.gain.exponentialRampToValueAtTime(.0001,t+life+.08);
    noiseSource(t,life+.2,air);
    if(whistle){
      const w=gain(o);w.gain.setValueAtTime(.0001,t+.1);w.gain.exponentialRampToValueAtTime(.007*a,t+.35);w.gain.exponentialRampToValueAtTime(.0001,t+life);
      const tone=osc('sine',880,t+.1,t+life+.05,w);tone.frequency.exponentialRampToValueAtTime(2050,t+life);
    }
  }

  // Thump, rolling boom, far-shore echo and a tuned shimmer.
  function burst({delay=0,pan=0,distance=130,variant=0}={}){
    const t=ctx.currentTime+delay,a=loudness(distance),o=fxOut(pan,.85);
    const thump=gain(o);env(thump,t,.3*a,.006,1.1);osc('sine',115,t,t+1.3,thump).frequency.exponentialRampToValueAtTime(36,t+.5);
    const roll=ctx.createBiquadFilter();roll.type='lowpass';roll.Q.value=.6;roll.frequency.setValueAtTime(1900,t);roll.frequency.exponentialRampToValueAtTime(130,t+1.5);roll.connect(o);
    const body=gain(roll);env(body,t,.3*a,.004,1.9);noiseSource(t,2.1,body);
    const echoOut=fxOut(-pan*.5,.9),echoLp=ctx.createBiquadFilter();echoLp.type='lowpass';echoLp.frequency.value=420;echoLp.connect(echoOut);
    const echo=gain(echoLp);env(echo,t+.62,.07*a,.03,1.6);noiseSource(t+.62,1.8,echo);
    const shimmer=fxOut(pan,1.4),first=Math.random()*3|0;
    for(let i=0;i<3;i++){const g=gain(shimmer),at=t+.12+i*.07;env(g,at,.011*a,.008,1.6);osc('sine',midi(SPARKLE[first+i]),at,at+1.7,g);}
  }

  return {setMusic,duck,launch,burst,get music(){return current?.name||null;}};
}
