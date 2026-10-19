import {T,W,H,COL,DIRS,DK,reduced} from './constants.js';
import {LV,validate} from './levels.js';
import {S} from './state.js';
import {snd} from './audio.js';
import {computeResult} from './score.js';
export function build(i){const lv=LV[i],bad=validate(lv);if(bad.length)console.warn('Unreachable in level',i+1,bad);
 const s={i,lv,ice:new Set(),fruit:[],en:[],pl:[],parts:[],time:0,lives:S.mode==2?5:3,state:'play',exit:null,wall:new Set(),ex:0};
 let fi=0;lv.r.forEach((row,y)=>[...row].forEach((c,x)=>{
  if(c=='#')s.wall.add(x+','+y);
  if(c=='P'||(c=='Q'&&S.mode==2))s.pl.push({x,y,fx:x,fy:y,p:1,m:false,face:DIRS[2],inv:0,k:c=='P'?0:1,hit:0});
  if(c=='f')s.fruit.push({x,y,got:false,t:fi++%5});
  if(c=='W'||c=='C')s.en.push({x,y,fx:x,fy:y,p:1,m:false,t:c,d:null,sp:c=='C'?3.4:2.8});
  if(c=='E')s.exit={x,y}}));
 s.total=s.fruit.length;s.par=s.total*7+20;return s}
const isWall=(x,y)=>x<0||y<0||x>=W||y>=H||S.g.wall.has(x+','+y);
export const pos=e=>[e.fx+(e.x-e.fx)*e.p,e.fy+(e.y-e.fy)*e.p];
function bfs(sx,sy,tx,ty){const prev=new Map(),k=(x,y)=>y*W+x,q=[[sx,sy]];prev.set(k(sx,sy),null);let n=0;
 while(q.length&&n++<500){const[x,y]=q.shift();if(x==tx&&y==ty)break;for(const d of DIRS){const nx=x+d[0],ny=y+d[1];if(isWall(nx,ny)||S.g.ice.has(nx+','+ny)||prev.has(k(nx,ny)))continue;prev.set(k(nx,ny),[x,y,d]);q.push([nx,ny])}}
 let c=prev.get(k(tx,ty));if(!c)return null;let cx=tx,cy=ty,d=null;while(c){d=c[2];cx=c[0];cy=c[1];c=prev.get(k(cx,cy))}return d}
export function burst(x,y,col,n=8){if(reduced)n=3;for(let i=0;i<n;i++){const a=Math.random()*6.28;S.g.parts.push({x,y,vx:Math.cos(a)*70,vy:Math.sin(a)*70,l:.5,col})}}

function tryIce(p){const[dx,dy]=p.face,tx=p.x+dx,ty=p.y+dy,k=tx+','+ty;
 const blocked=isWall(tx,ty)||S.g.ice.has(k)||(S.g.exit.x==tx&&S.g.exit.y==ty)||S.g.fruit.some(f=>!f.got&&f.x==tx&&f.y==ty)||
  S.g.pl.some(o=>(o.x==tx&&o.y==ty)||(o.m&&o.fx==tx&&o.fy==ty))||S.g.en.some(e=>(e.x==tx&&e.y==ty)||(e.m&&e.fx==tx&&e.fy==ty));
 if(blocked){snd(160,.08,'square',.06);burst((tx+.5)*T,(ty+.5)*T,COL.brown,3);return}
 S.g.ice.add(k);snd(660,.12);burst((tx+.5)*T,(ty+.5)*T,COL.ice,8)}
function tryBreak(p){const tx=p.x+p.face[0],ty=p.y+p.face[1],k=tx+','+ty;
 if(S.g.ice.delete(k)){snd(260,.15,'sawtooth',.08);burst((tx+.5)*T,(ty+.5)*T,COL.ice,14)}}

export function step(dt){if(S.g.state!='play')return;S.g.time+=dt;S.g.ex+=dt;
 for(const p of S.g.pl){p.inv=Math.max(0,p.inv-dt);
  if(p.m){p.p+=dt*6.5;if(p.p>=1){p.p=1;p.m=false}}
  for(const a of S.acts[p.k].splice(0)){a=='ice'?tryIce(p):tryBreak(p)}
  if(!p.m){const h=S.held[p.k],d=h.length?DK[h[h.length-1]]:null;
   if(d){p.face=d;const nx=p.x+d[0],ny=p.y+d[1];
    if(!isWall(nx,ny)&&!S.g.ice.has(nx+','+ny)&&!S.g.pl.some(o=>o!==p&&o.x==nx&&o.y==ny)){p.fx=p.x;p.fy=p.y;p.x=nx;p.y=ny;p.p=0;p.m=true}}}
  if(p.p>=.5)for(const f of S.g.fruit)if(!f.got&&f.x==p.x&&f.y==p.y){f.got=true;snd(880,.12);snd(1170,.18);burst((f.x+.5)*T,(f.y+.5)*T,COL.yel,12)}}
 const open=S.g.fruit.every(f=>f.got);
 if(open&&S.g.pl.some(p=>p.p>=.5&&p.x==S.g.exit.x&&p.y==S.g.exit.y))return finish(true);
 for(const e of S.g.en){
  if(e.m){e.p+=dt*e.sp;if(e.p>=1){e.p=1;e.m=false}}
  if(!e.m){let d=null;
   if(e.t=='C'){let b=null,bd=1e9;for(const p of S.g.pl){const dd=Math.abs(p.x-e.x)+Math.abs(p.y-e.y);if(dd<bd){bd=dd;b=p}}if(b)d=bfs(e.x,e.y,b.x,b.y)}
   if(!d){const o=DIRS.filter(v=>{const nx=e.x+v[0],ny=e.y+v[1];return !isWall(nx,ny)&&!S.g.ice.has(nx+','+ny)&&!S.g.en.some(z=>z!==e&&z.x==nx&&z.y==ny)});
    if(o.length){const keep=e.d&&o.find(v=>v===e.d);d=keep&&Math.random()>.25?keep:o[Math.random()*o.length|0]}}
   if(d){e.d=d;e.fx=e.x;e.fy=e.y;e.x+=d[0];e.y+=d[1];e.p=0;e.m=true}}}
 for(const p of S.g.pl){if(p.inv>0)continue;const[px,py]=pos(p);
  for(const e of S.g.en){const[ex,ey]=pos(e);if(Math.hypot(px-ex,py-ey)<.6){p.inv=1.6;S.g.lives--;snd(130,.3,'sawtooth',.1);burst((px+.5)*T,(py+.5)*T,COL.pink,12);if(S.g.lives<=0)return finish(false);break}}}
 for(const q of S.g.parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt}S.g.parts=S.g.parts.filter(q=>q.l>0)}

export function finish(win){const g=S.g;g.state=win?'win':'over';
 const r=win?computeResult(g.i,g.time,g.lives):null;
 if(S.onEnd)S.onEnd({win,i:g.i,time:g.time,lives:g.lives,total:g.total,...r})}
