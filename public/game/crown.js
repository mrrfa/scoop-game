// Fruit Crown: pure, deterministic helpers (no DOM, no canvas) so they are easy to test.
import {hsh} from './constants.js';
export const STAG=.13,FLY=.7,SETTLE=.9,MAX_TOPPINGS=12;
export const FRUIT_NAMES=['strawberry','cherry','lemon','blueberry','peach'];
// Arrangement depends only on WHICH fruit were collected (sorted), never on pickup order, so replays match.
// Coordinates are local to the scoop (centre (0,-6), radius 15); every slot sits on the upper surface, clear of the face and cone.
export function crownLayout(types){const t=[...types].sort((a,b)=>a-b).slice(0,MAX_TOPPINGS),n=t.length,r1=Math.min(n,6),out=[];
 for(let i=0;i<n;i++){const row=i<r1?1:2,cnt=row==1?r1:n-r1,idx=row==1?i:i-r1,[a0,a1,rad]=row==1?[-155,-25,15]:[-128,-52,8.5];
  const a=(cnt==1?-90:a0+(a1-a0)*idx/(cnt-1))*Math.PI/180;
  out.push({t:t[i],dx:Math.cos(a)*rad+hsh(i,n,5)*.8,dy:-6+Math.sin(a)*rad+hsh(i,n,6)*.8,s:.38+(hsh(i,n,7)+.5)*.08-(n>8?.03:0),rot:hsh(i,t[i]*7+n,3)*.9})}
 return out}
// Snapshot is a frozen copy so later resets/mutations of the live level can never alter it.
export function makeVictory(collected,reduced=false){const snap=Object.freeze([...collected]),layout=crownLayout(snap),n=layout.length,stag=reduced?0:STAG,fly=reduced?0:FLY;
 return {snap,layout,stag,fly,dur:reduced?.6:(n?(n-1)*stag+fly+SETTLE:1.4),t:0,done:false,cb:null}}
export const arrival=(v,k)=>k*v.stag+v.fly;
export const landedCount=v=>v.layout.filter((_,k)=>v.t>=arrival(v,k)).length;
export const easeOut=u=>1-Math.pow(1-u,3);
// Scoop scale and hop during the victory pose.
export const poseScale=(t,reduced)=>reduced?1.3:1+.3*easeOut(Math.min(1,t/.25));
export const poseHop=(t,reduced)=>reduced?0:-Math.abs(Math.sin(t*8))*6;
// Bump squash: quick damped wobble; 0 when reduced motion is on.
export const bumpSquash=(timer,total=.35,reduced=false)=>reduced||timer<=0?0:Math.sin((1-timer/total)*Math.PI*3)*.18*(timer/total);
