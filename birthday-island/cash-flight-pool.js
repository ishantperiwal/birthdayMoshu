// Fixed CPU/GPU capacity; overflow waits rather than interrupting a flight.
export function createCashFlightPool(capacity=16,duration=700){
  const slots=Array.from({length:capacity},()=>({active:false,reward:null,born:0,resolve:null}));
  const pending=[];
  function begin(slot,item,now){Object.assign(slot,item,{active:true,born:now});}
  return {
    capacity,
    add(reward,now,resolve){
      const slot=slots.find(slot=>!slot.active),item={reward,resolve};
      if(slot)begin(slot,item,now);else pending.push(item);
    },
    step(now,visit){
      slots.forEach((slot,index)=>{
        if(slot.active&&now-slot.born>=duration){
          const resolve=slot.resolve;
          slot.active=false;slot.reward=null;slot.resolve=null;resolve?.();
        }
        if(!slot.active&&pending.length)begin(slot,pending.shift(),now);
        if(slot.active)visit(index,slot.reward,Math.max(0,(now-slot.born)/duration));
      });
    },
    clear(){
      for(const slot of slots){
        const resolve=slot.resolve;slot.active=false;slot.reward=null;slot.resolve=null;resolve?.();
      }
      for(const item of pending)item.resolve?.();
      pending.length=0;
    }
  };
}
