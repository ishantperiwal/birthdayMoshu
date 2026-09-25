// A simple painted birthday note, using the board's existing texture.
export function paintKeepsakeSign(ctx){
  ctx.fillStyle='#eee1c9';ctx.fillRect(0,0,1024,600);
  ctx.fillStyle='#806749';ctx.globalAlpha=.035;
  for(let i=0;i<2400;i++)ctx.fillRect((i*137.31)%1024,(i*79.73)%600,2,1);
  ctx.globalAlpha=1;
  ctx.save();ctx.translate(512,300);ctx.rotate(-.025);ctx.textAlign='center';
  ctx.fillStyle='#87675c';ctx.font='500 74px "Caveat", "Segoe Print", cursive';
  ctx.fillText('Welcome to your',0,-130);
  ctx.fillStyle='#a45469';ctx.font='600 104px "Caveat", "Segoe Print", cursive';
  ctx.fillText('birthday party,',0,-28);
  ctx.font='600 112px "Caveat", "Segoe Print", cursive';ctx.fillText('my queen',-38,83);
  // A little hand-painted crown at the end of the greeting.
  ctx.save();ctx.translate(205,16);ctx.rotate(.10);
  ctx.fillStyle='#c99a45';ctx.strokeStyle='#a47c38';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,12);ctx.lineTo(23,29);ctx.lineTo(43,-7);ctx.lineTo(62,29);ctx.lineTo(86,12);ctx.lineTo(76,55);ctx.lineTo(10,55);ctx.closePath();ctx.fill();ctx.stroke();
  for(const [x,y] of [[0,12],[43,-7],[86,12]]){ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#a45469';ctx.beginPath();ctx.arc(43,39,5,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.strokeStyle='#bb7b87';ctx.lineWidth=4;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-205,111);ctx.quadraticCurveTo(-15,130,204,105);ctx.stroke();
  ctx.fillStyle='#87675c';ctx.font='500 40px "Caveat", "Segoe Print", cursive';
  ctx.fillText('I was too selfish to invite other people.',0,191);
  ctx.restore();
}
