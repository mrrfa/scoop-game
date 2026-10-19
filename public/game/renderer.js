import {T,W,H,COL,reduced,hsh} from './constants.js';
import {S} from './state.js';
import {hud} from '../ui/hud.js';
let ctx=null;export function initRenderer(cv){ctx=cv.getContext('2d')}
let bgc=null;
function rr(c,x,y,w,h,fill,seed,a=2.5){const pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 for(let pass=0;pass<2;pass++){c.beginPath();pts.forEach(([px,py],i)=>{const jx=hsh(px,py,seed+pass)*a*2,jy=hsh(py,px,seed+pass+3)*a*2;i?c.lineTo(px+jx,py+jy):c.moveTo(px+jx,py+jy)});c.closePath();
  if(!pass){c.fillStyle=fill;c.fill()}c.lineWidth=pass?1.2:2.4;c.strokeStyle=COL.ink;c.stroke()}}
export function bake(){bgc=document.createElement('canvas');bgc.width=W*T;bgc.height=H*T;const c=bgc.getContext('2d');
 c.fillStyle=COL.cream;c.fillRect(0,0,W*T,H*T);c.strokeStyle='rgba(169,216,236,.35)';c.lineWidth=1;
 for(let y=T;y<H*T;y+=T){c.beginPath();c.moveTo(0,y+hsh(y,1,1)*2);c.lineTo(W*T,y);c.stroke()}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=x+','+y;
  if(S.g.wall.has(k)){rr(c,x*T+2,y*T+2,T-4,T-4,COL.brown,x*7+y,2.5);c.strokeStyle='rgba(56,53,47,.35)';c.lineWidth=1;
   for(let i=0;i<4;i++){c.beginPath();c.moveTo(x*T+8+i*9,y*T+8);c.lineTo(x*T+4+i*9,y*T+T-8);c.stroke()}}
  else if(hsh(x,y,9)>.43){c.fillStyle='rgba(56,53,47,.25)';c.font='14px cursive';c.fillText('✦',x*T+14,y*T+30)}}}
function body(c,x,y,col,kind,face,bob){c.save();c.translate(x,y+bob);
 c.beginPath();c.moveTo(-10,2);c.lineTo(10,2);c.lineTo(0,21);c.closePath();c.fillStyle='#E8C88F';c.fill();c.lineWidth=2;c.strokeStyle=COL.ink;c.stroke();
 c.beginPath();c.arc(0,-6,15,0,7);c.fillStyle=col;c.fill();c.stroke();
 c.fillStyle=COL.ink;c.beginPath();c.arc(-5+face[0]*2,-7+face[1]*2,2,0,7);c.arc(5+face[0]*2,-7+face[1]*2,2,0,7);c.fill();
 c.beginPath();c.arc(face[0]*2,-2+face[1],3,.1,3.04);c.stroke();
 if(kind==0){c.fillStyle='#8FCB9B';c.beginPath();c.ellipse(4,-22,7,3.5,-.5,0,7);c.fill();c.stroke()}
 else{c.beginPath();c.arc(0,-13,5,3.4,6);c.stroke()}c.restore()}
function enemy(c,x,y,t,bob,tt){c.save();c.translate(x,y+bob);c.beginPath();
 if(t=='W'){c.ellipse(0,2,15,13,0,0,7);c.fillStyle=COL.lav}else{c.moveTo(-14,14);c.quadraticCurveTo(-16,-14,0,-16);c.quadraticCurveTo(16,-14,14,14);c.closePath();c.fillStyle='#E88C9C'}
 c.fill();c.lineWidth=2;c.strokeStyle=COL.ink;c.stroke();c.fillStyle=COL.ink;c.beginPath();c.arc(-5,0,2,0,7);c.arc(5,0,2,0,7);c.fill();
 c.beginPath();c.moveTo(-9,-6);c.lineTo(-2,-3);c.moveTo(9,-6);c.lineTo(2,-3);c.stroke();c.restore()}
function fruit(c,x,y,t,bob){c.save();c.translate(x,y+bob);c.lineWidth=2;c.strokeStyle=COL.ink;
 const fills=['#F08A9C','#C23B54','#F5D67C','#6F86C9','#F7B58E'];c.fillStyle=fills[t];c.beginPath();
 if(t==2)c.ellipse(0,0,13,9,.5,0,7);else c.arc(0,0,t==1?8:11,0,7);c.fill();c.stroke();
 if(t==1){c.beginPath();c.arc(-6,3,7,0,7);c.fill();c.stroke()}
 c.fillStyle='#8FCB9B';c.beginPath();c.ellipse(0,-11,5,2.5,.3,0,7);c.fill();c.stroke();
 c.fillStyle=COL.ink;c.beginPath();c.arc(-3,0,1.3,0,7);c.arc(3,0,1.3,0,7);c.fill();c.restore()}
export function draw(){const c=ctx;c.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);if(!bgc)return;c.drawImage(bgc,0,0);
 const open=S.g.fruit.every(f=>f.got),ex=S.g.exit,wob=reduced?0:1,tm=S.g.ex;
 rr(c,ex.x*T+5,ex.y*T+4,T-10,T-8,open?COL.yel:'#d9d2c3',77,2);c.fillStyle=COL.ink;c.font='15px "Patrick Hand",cursive';c.textAlign='center';c.fillText(open?'EXIT':'✕',ex.x*T+T/2,ex.y*T+T/2+5);
 for(const k of S.g.ice){const[x,y]=k.split(',').map(Number);rr(c,x*T+3,y*T+3,T-6,T-6,COL.ice,x*5+y*3,2);c.fillStyle='rgba(255,255,255,.8)';c.fillText('❄',x*T+T/2,y*T+T/2+6)}
 for(const f of S.g.fruit)if(!f.got)fruit(c,(f.x+.5)*T,(f.y+.5)*T,f.t,wob*Math.sin(tm*3+f.x)*2);
 for(const e of S.g.en){const[x,y]=pos(e);enemy(c,(x+.5)*T,(y+.5)*T,e.t,wob*Math.sin(tm*8+x*3)*2)}
 for(const p of S.g.pl){if(p.inv>0&&Math.floor(p.inv*10)%2)continue;const[x,y]=pos(p);body(c,(x+.5)*T,(y+.5)*T,p.k?COL.mint:COL.pink,p.k,p.face,p.m&&wob?Math.abs(Math.sin(tm*14))*-3:wob*Math.sin(tm*3)*1)}
 for(const q of S.g.parts){c.globalAlpha=Math.max(0,q.l*2);c.fillStyle=q.col;c.strokeStyle=COL.ink;c.lineWidth=1;c.beginPath();c.arc(q.x,q.y,3,0,7);c.fill();c.stroke()}c.globalAlpha=1;
 const got=S.g.total-S.g.fruit.filter(f=>!f.got).length;
 hud('hL',`Level ${S.g.i+1}: ${S.g.lv.n}`);hud('hF',`Fruit ${got}/${S.g.total}`);hud('hH',`Lives ${'♥'.repeat(Math.max(0,S.g.lives))}`);hud('hT',`${S.g.time.toFixed(0)}s`)}
