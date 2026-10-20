// Margin doodles on a fixed canvas BEHIND the UI. Driven by the app's single rAF loop (no loop of its own).
import {hsh} from './constants.js';
import {fruit} from './renderer.js';
let cv=null,c=null,w=0,h=0,lastT=-1e9;const N=26;
const dark=()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-color-scheme: dark)').matches;
export function initBackdrop(canvas){cv=canvas;c=cv.getContext('2d');resize();addEventListener('resize',()=>{resize();lastT=-1e9})}
function resize(){w=cv.width=Math.max(1,innerWidth);h=cv.height=Math.max(1,innerHeight)}
export const doodle=i=>({kind:i%5,x:hsh(i,1,1)+.5,y:hsh(i,2,2)+.5,sp:6+(hsh(i,3,3)+.5)*10,ph:(hsh(i,4,4)+.5)*6.28,sz:.7+(hsh(i,5,5)+.5)*.7});
export function drawBackdrop(ts,reduced){if(!c||ts-lastT<(reduced?1e9:33))return;lastT=ts;c.clearRect(0,0,w,h);
 const ink=dark()?'rgba(255,248,233,.30)':'rgba(56,53,47,.26)',t=reduced?0:ts/1000,mid=w/2,half=390; // keep clear of the 760px content column
 for(let i=0;i<N;i++){const d=doodle(i);let x=d.x*w;if(Math.abs(x-mid)<half&&w>820)x=x<mid?x-half:x+half;if(w<=820&&i>8)continue;
  const y=((d.y*h-t*d.sp)%(h+60)+h+60)%(h+60)-30,wig=Math.sin(t*1.2+d.ph);
  c.save();c.translate(x+wig*5,y);c.rotate(wig*.15);c.scale(d.sz,d.sz);c.globalAlpha=1;c.strokeStyle=ink;c.fillStyle=ink;c.lineWidth=1.6;c.beginPath();
  if(d.kind==0){for(let k=0;k<5;k++){const a=k*1.2566-1.57;c.lineTo(Math.cos(a)*9,Math.sin(a)*9);c.lineTo(Math.cos(a+.628)*3.6,Math.sin(a+.628)*3.6)}c.closePath();c.stroke()}
  else if(d.kind==1){c.arc(0,0,2.5,0,7);c.fill()}
  else if(d.kind==2){c.moveTo(0,5);c.bezierCurveTo(-11,-3,-4,-10,0,-3);c.bezierCurveTo(4,-10,11,-3,0,5);c.stroke()}
  else if(d.kind==3){c.moveTo(-10,0);for(let k=1;k<=6;k++)c.lineTo(-10+k*3.4,k%2?-3:3);c.stroke()}
  else{c.globalAlpha=.55;c.scale(.7,.7);fruit(c,0,0,i%5,0)}
  c.restore()}}
