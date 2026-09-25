export const EXPRESSIONS=Object.freeze([
  {id:'normal',label:'Normal',emoji:'🙂'},
  // Preserve the existing network ID for saved clients.
  {id:'happy',label:'Kiss',emoji:'😘'},
  {id:'surprised',label:'Amazed',emoji:'😮'},
  {id:'sad',label:'Sad',emoji:'😔'}
]);
export const EXPRESSION_MS=4000;
export function cleanExpression(value){return EXPRESSIONS.some(e=>e.id===value)?value:null;}
export function expressionIndex(value){return ({normal:0,happy:1,surprised:3,sad:4})[cleanExpression(value)]||0;}
export function expressionRemaining(until,now=Date.now()){return Math.max(0,Math.min(EXPRESSION_MS,(Number.isFinite(until)?until:0)-now));}
