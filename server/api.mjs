import {Router} from './router.mjs';
import {ApiError,str,num,levelId,EMAIL,NAME,stars as vStars} from './validation.mjs';
import {hashPassword,verifyPassword,createSession,getSession,destroySession,COOKIE,SESSION_MS} from './auth.mjs';
import {cookie,rateLimit,sameOrigin} from './security.mjs';
import {randomUUID} from 'node:crypto';
import {LV} from '../public/game/levels.js';
import {levelInfo,computeResult} from '../public/game/score.js';

const emptyProgress=()=>({stars:{},best:{}});
const unlocked=p=>{const done=Object.keys(p.stars).filter(k=>p.stars[k]>0).map(Number);return Math.min(6,done.length?Math.max(...done)+1:1)};
const view=p=>({stars:p.stars,best:p.best,unlocked:unlocked(p)});
const pub=u=>({id:u.id,email:u.email,displayName:u.name,createdAt:u.createdAt});
const mergeStars=(p,s)=>{for(const[k,v]of Object.entries(s))p.stars[k]=Math.max(p.stars[k]||0,v)};
function page(q,def=10){const page=Math.max(1,parseInt(q.get('page'))||1),size=Math.min(50,Math.max(1,parseInt(q.get('pageSize'))||def));return {page,size}}

export function buildApi(db,{prod=false}={}){
 const r=new Router(),A='/api/v1';
 const setSession=(res,s)=>res.cookies.push(cookie(COOKIE,s.token,{maxAge:SESSION_MS/1000,prod}));
 const need=ctx=>{if(!ctx.session)throw new ApiError(401,'UNAUTHENTICATED','Please log in');return ctx.session.user};

 r.add('GET',A+'/health',async()=>({body:{status:'ok',time:new Date().toISOString(),storage:(()=>{try{db.save();return 'ok'}catch{return 'error'}})()}}));

 r.add('POST',A+'/auth/register',async ctx=>{rateLimit('auth:'+ctx.ip,10);
  const email=str(ctx.body,'email',3,320,EMAIL).toLowerCase(),name=str(ctx.body,'displayName',2,20,NAME),pw=str(ctx.body,'password',8,200);
  if(db.userByEmail(email))throw new ApiError(409,'EMAIL_TAKEN','Could not register with these details');
  const u={id:randomUUID(),email,name,hash:await hashPassword(pw),createdAt:new Date().toISOString(),progress:emptyProgress(),stats:{plays:0,fruit:0,playTime:0}};
  db.data.users[u.id]=u;db.save();const s=createSession(db,u.id);const res={status:201,cookies:[],body:{user:pub(u),csrfToken:s.csrf,progress:view(u.progress)}};setSession(res,s);return res});

 r.add('POST',A+'/auth/login',async ctx=>{rateLimit('auth:'+ctx.ip,10);
  const email=str(ctx.body,'email',3,320).toLowerCase(),pw=str(ctx.body,'password',1,200);const u=db.userByEmail(email);
  const ok=u?await verifyPassword(pw,u.hash):(await hashPassword(pw),false);
  if(!ok)throw new ApiError(401,'BAD_CREDENTIALS','Email or password is incorrect');
  const s=createSession(db,u.id);const res={cookies:[],body:{user:pub(u),csrfToken:s.csrf,progress:view(u.progress)}};setSession(res,s);return res});

 r.add('POST',A+'/auth/logout',async ctx=>{if(ctx.session)destroySession(db,ctx.session.key);return {body:{ok:true},cookies:[cookie(COOKIE,'',{maxAge:0,prod})]}});
 r.add('GET',A+'/auth/me',async ctx=>{const u=need(ctx);return {body:{user:pub(u),csrfToken:ctx.session.csrf,progress:view(u.progress)}}});

 r.add('GET',A+'/profile',async ctx=>{const u=need(ctx);const done=Object.values(u.progress.stars).filter(v=>v>0).length;
  return {body:{user:pub(u),progress:view(u.progress),stats:{...u.stats,levelsCompleted:done,totalScore:Object.values(u.progress.best).reduce((a,b)=>a+b.score,0)}}}});
 r.add('PATCH',A+'/profile',async ctx=>{const u=need(ctx);const name=str(ctx.body,'displayName',2,20,NAME);u.name=name;db.save();return {body:{user:pub(u)}}});

 r.add('GET',A+'/progress',async ctx=>({body:{progress:view(need(ctx).progress)}}));
 // PUT/sync never lower stars (merge = per-level max). Both are idempotent. Stars here are client-claimed; see README.
 const mergeH=async ctx=>{const u=need(ctx);mergeStars(u.progress,vStars(ctx.body?.stars??{}));db.save();return {body:{progress:view(u.progress),merged:true}}};
 r.add('PUT',A+'/progress',mergeH);r.add('POST',A+'/progress/sync',mergeH);

 r.add('POST',A+'/scores',async ctx=>{const u=need(ctx);rateLimit('score:'+u.id,20);
  const id=levelId(ctx.body?.levelId),info=levelInfo(id-1),time=num(ctx.body,'time',0,3600),lives=num(ctx.body,'lives',1,5,true),fruit=num(ctx.body,'fruit',0,100,true);
  const mode=ctx.body?.mode===2?2:1;
  if(fruit!==info.total)throw new ApiError(422,'IMPLAUSIBLE_SCORE','Fruit count does not match level');
  if(time<info.total*0.8)throw new ApiError(422,'IMPLAUSIBLE_SCORE','Completion time is implausibly fast');
  if(lives>(mode===2?5:3))throw new ApiError(422,'IMPLAUSIBLE_SCORE','Lives out of range');
  const res=computeResult(id-1,time,lives);// score is recomputed server-side; client score is ignored
  const rec={id:randomUUID(),userId:u.id,levelId:id,score:res.score,time:Math.round(time*10)/10,stars:res.stars,mode,createdAt:new Date().toISOString()};
  db.data.scores.push(rec);if(db.data.scores.length>5000)db.data.scores.splice(0,db.data.scores.length-5000);
  const p=u.progress;p.stars[id]=Math.max(p.stars[id]||0,res.stars);const b=p.best[id];
  if(!b||res.score>b.score||(res.score===b.score&&rec.time<b.time))p.best[id]={score:res.score,time:rec.time,stars:res.stars,at:rec.createdAt};
  u.stats.plays++;u.stats.fruit+=fruit;u.stats.playTime+=Math.round(time);db.save();
  return {status:201,body:{score:{levelId:id,score:rec.score,time:rec.time,stars:rec.stars},progress:view(p)}}});

 const ranked=(entries,cmp,q)=>{entries.sort(cmp);entries.forEach((e,i)=>e.rank=i+1);const {page:pg,size}=page(q);return {entries:entries.slice((pg-1)*size,pg*size).map(({t,at,...e})=>e),page:pg,pageSize:size,total:entries.length}};
 r.add('GET',A+'/leaderboards',async ctx=>{const users=Object.values(db.data.users).map(u=>{const b=Object.values(u.progress.best);return {displayName:u.name,totalScore:b.reduce((a,x)=>a+x.score,0),levelsCompleted:b.length,t:u.createdAt}}).filter(e=>e.levelsCompleted>0);
  return {body:ranked(users,(a,b)=>b.totalScore-a.totalScore||b.levelsCompleted-a.levelsCompleted||a.t.localeCompare(b.t),ctx.query)}});
 r.add('GET',A+'/leaderboards/levels/:levelId',async ctx=>{const id=levelId(ctx.params.levelId);
  const e=Object.values(db.data.users).filter(u=>u.progress.best[id]).map(u=>({displayName:u.name,...u.progress.best[id]}));
  return {body:{levelId:id,...ranked(e,(a,b)=>b.score-a.score||a.time-b.time||a.at.localeCompare(b.at),ctx.query)}}});

 const meta=(l,i)=>{const n=levelInfo(i);return {id:i+1,title:l.n,description:l.d,fruit:n.total,par:n.par,width:l.r[0].length,height:l.r.length}};
 r.add('GET',A+'/levels',async()=>({body:{levels:LV.map(meta)}}));
 r.add('GET',A+'/levels/:levelId',async ctx=>{const id=levelId(ctx.params.levelId);return {body:{level:{...meta(LV[id-1],id-1),rows:LV[id-1].r}}}});
 return r}
