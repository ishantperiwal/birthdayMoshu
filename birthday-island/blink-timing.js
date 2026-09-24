// Independent, brief blinks, with an occasional double blink.
export function createBlinkTiming(random=Math.random){
  let next=null,start=-Infinity,duration=.16,double=false;
  return time=>{
    if(next===null)next=time+2.4+random()*4.4;
    if(time>=next){
      start=time;duration=.14+random()*.035;
      const repeat=!double&&random()<.12;double=repeat;
      next=time+duration+(repeat?.14:2.4+random()*4.4);
    }
    const age=time-start;
    if(age<0||age>=duration)return 0;
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    return smooth(age/.025)*(1-smooth((age-duration+.05)/.05));
  };
}
