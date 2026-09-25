import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRadio} from '../radio-player.js';
import {createSoundscape} from '../soundscape.js';

test('radio bed stays quiet at a distance, preserves close volume and hides distant UI',async()=>{
  const players=[],classes=new Map(),screens=[0,1].map(()=>({firstElementChild:{},classList:{toggle(){}}}));
  const card={classList:{toggle:(name,value)=>classes.set(name,value)},setAttribute(){},querySelectorAll:()=>screens,querySelector:()=>({})};
  const previous={window:globalThis.window,document:globalThis.document,location:globalThis.location};
  globalThis.window={YT:{Player:class{
    constructor(_,options){players.push(this);queueMicrotask(options.events.onReady);}
    setVolume(value){this.volume=value;}loadVideoById(id){this.id=id;}pauseVideo(){}getDuration(){return 120;}getCurrentTime(){return 0;}
  }}};
  globalThis.document={createElement:()=>card,body:{appendChild(){}}};
  globalThis.location={origin:'http://localhost:4173'};
  try{
    const radio=createRadio();radio.play(0);await radio.start();
    radio.update(4,0);assert.equal(players[0].volume,0,'no distant music during birthday');
    radio.update(1,0,.025);assert.equal(players[0].volume,2,'very quiet distant bed');
    assert.equal(classes.get('near'),false,'background music does not show the radio card');
    radio.update(1,.5,.025);assert.ok(players[0].volume>2&&players[0].volume<80);
    radio.update(1,1,.025);assert.equal(players[0].volume,80);assert.equal(classes.get('near'),true);
    radio.update(1,0,0);assert.equal(players[0].volume,0,'mute silences the bed too');
    radio.play(1);radio.update(4,0,.025);
    assert.equal(players[0].volume,0);assert.equal(players[1].volume,2,'song changes keep the same quiet level');
  }finally{Object.assign(globalThis,previous);}
});

test('radio handoff fades the birthday bus and stops scheduling synthetic music',()=>{
  const originalInterval=globalThis.setInterval,originalTimeout=globalThis.setTimeout;
  let tick,notes=0;const ramps=[];
  globalThis.setInterval=fn=>{tick=fn;return 0;};globalThis.setTimeout=()=>0;
  const param=()=>({value:1,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){},linearRampToValueAtTime:(value,time)=>ramps.push([value,time])});
  const node=()=>({gain:param(),frequency:param(),Q:param(),connect(){return this;},disconnect(){},start(){},stop(){}});
  const ctx={sampleRate:32,currentTime:0,state:'running',createBuffer:(_,length)=>({getChannelData:()=>new Float32Array(length)}),createConvolver:node,createBiquadFilter:node,createGain:node,createOscillator:()=>{notes++;return node();}};
  try{
    const sound=createSoundscape(ctx,node());sound.setMusic('birthday',{delay:0});tick();
    assert.ok(notes>0);const before=notes;
    sound.setMusic('radio',{fade:5});assert.equal(sound.music,null);
    assert.ok(ramps.some(([value,time])=>value===0&&time===5));
    ctx.currentTime=60;tick();assert.equal(notes,before,'birthday does not restart and calm music is not layered');
  }finally{globalThis.setInterval=originalInterval;globalThis.setTimeout=originalTimeout;}
});
