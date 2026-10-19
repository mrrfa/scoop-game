import {S} from './game/state.js';
import {build,step,pos} from './game/engine.js';
import {initRenderer,bake,draw} from './game/renderer.js';
import {initInput,setInputMode} from './game/input.js';
import {audio,snd} from './game/audio.js';
import {LV} from './game/levels.js';
import {api,setCsrf} from './api.js';
import {$,show,onShow,ov,closeOv,esc} from './ui/screens.js';
import {renderLevels} from './ui/menus.js';
import {initBoard,load as loadBoard} from './ui/leaderboard.js';
import {loadProfile} from './ui/profile.js';

// ---- progress: local (guest) + server (account) ----
let prog={unlocked:1,stars:{}},user=null;
try{prog=JSON.parse(localStorage.getItem('scoop'))||prog}catch{}
const save=()=>{try{localStorage.setItem('scoop',JSON.stringify(prog))}catch{}};
const toServer=()=>Object.fromEntries(Object.entries(prog.stars).filter(([,v])=>v>0).map(([k,v])=>[+k+1,v]));
const fromServer=p=>{const st={};for(const[k,v]of Object.entries(p.stars))st[k-1]=v;prog={unlocked:Math.max(1,p.unlocked),stars:st};save()};

// ---- game loop ----
let raf=0,last=null,acc=0;
const cv=$('#cv');initRenderer(cv);
function loop(ts){raf=requestAnimationFrame(loop);if(last===null)last=ts;const dt=Math.min(.1,(ts-last)/1000);last=ts;
 if(S.g&&S.g.state=='play'&&!S.stat){acc+=dt;while(acc>=1/60){step(1/60);acc-=1/60}}if(S.g)draw()}
function start(i){closeOv();S.stat=null;S.g=build(i);bake();setInputMode(S.mode);last=null;acc=0;show('game');cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function leaveGame(id){cancelAnimationFrame(raf);S.g=null;S.stat=null;show(id)}
function pause(on){const g=S.g;if(!g||g.state!='play')return;
 if(on){S.stat='pause';S.held=[[],[]];ov(`<h2>Paused</h2><button class="mt" id="pR">Resume</button><button id="pX">Restart</button><button id="pL">Level select</button><button id="pH">Home</button>`);
  $('#pR').onclick=()=>pause(false);$('#pX').onclick=()=>start(g.i);$('#pL').onclick=()=>leaveGame('levels');$('#pH').onclick=()=>leaveGame('menu')}
 else{S.stat=null;closeOv();last=null}}
initInput({active:()=>$('#game').classList.contains('on'),onPause:()=>S.g&&S.g.state=='play'&&pause(!S.stat)});
document.addEventListener('visibilitychange',()=>{last=null;if(document.hidden&&S.g&&S.g.state=='play'&&!S.stat)pause(true)});

// ---- end of level ----
S.onEnd=async r=>{
 if(!r.win){snd(110,.5,'sawtooth',.1);ov(`<h2>Oh no, melted!</h2><p>Out of lives. Try placing ice between you and the grumps.</p><button class="mt" id="oR">Try again</button><button id="oL">Level select</button><button id="oH">Home</button>`);
  $('#oR').onclick=()=>start(r.i);$('#oL').onclick=()=>leaveGame('levels');$('#oH').onclick=()=>leaveGame('menu');return}
 [523,659,784,1046].forEach((f,k)=>setTimeout(()=>snd(f,.2),k*120));
 prog.stars[r.i]=Math.max(prog.stars[r.i]||0,r.stars);prog.unlocked=Math.max(prog.unlocked,Math.min(LV.length,r.i+2));save();
 let score=r.score,note='Guest run: saved on this device only.';
 if(user){try{const d=await api.postScore({levelId:r.i+1,time:r.time,lives:r.lives,fruit:r.total,mode:S.mode});score=d.score.score;fromServer(d.progress);note='Score saved to your account.'}
  catch(e){note='Could not save to the server: '+esc(e.message)}}
 ov(`<h2>★ Level complete! ★</h2><p>${'★'.repeat(r.stars)}${'☆'.repeat(3-r.stars)}</p><p>Time ${r.time.toFixed(1)}s · Fruit ${r.total}/${r.total} · Score ${score}</p><p class="note">${note}</p>
  ${r.i<LV.length-1?'<button class="mt" id="oN">Next level</button>':'<p>You finished every level!</p>'}<button id="oR">Replay</button><button id="oL">Level select</button><button id="oH">Home</button>`);
 const n=$('#oN');if(n)n.onclick=()=>start(r.i+1);$('#oR').onclick=()=>start(r.i);$('#oL').onclick=()=>leaveGame('levels');$('#oH').onclick=()=>leaveGame('menu')};

// ---- screens ----
onShow('levels',()=>renderLevels(S.mode,prog,start));
onShow('board',loadBoard);onShow('profile',loadProfile);
onShow('account',()=>{$('#aErr').textContent='';if(user)show('profile')});
initBoard();
$('#bSolo').onclick=()=>{S.mode=1;show('levels')};$('#bCoop').onclick=()=>{S.mode=2;show('levels')};
for(const[b,s]of[['bHow','how'],['hBack','menu'],['lBack','menu'],['bLb','board'],['lbBack','menu'],['aBack','menu'],['pBack','menu']])$('#'+b).onclick=()=>show(s);
$('#bAcc').onclick=()=>show(user?'profile':'account');
$('#bSnd').onclick=e=>{audio.mute=!audio.mute;e.target.textContent='Sound: '+(audio.mute?'off':'on');if(!audio.mute)snd(660,.1)};
$('#bReset').onclick=()=>{if(confirm('Erase all saved progress on this device?')){prog={unlocked:1,stars:{}};save()}};
$('#bPause').onclick=()=>pause(true);

// ---- auth ----
async function authed(d){user=d.user;setCsrf(d.csrfToken);$('#bAcc').textContent='Profile';
 const hasLocal=Object.values(prog.stars).some(v=>v>0);
 if(hasLocal&&confirm('Merge the progress saved on this device into your account? (Existing account stars are never lowered.)')){try{fromServer((await api.sync(toServer())).progress)}catch{fromServer(d.progress)}}
 else fromServer(d.progress);show('profile')}
async function doAuth(kind){const err=$('#aErr');err.textContent='';
 try{const email=$('#aEmail').value,password=$('#aPass').value;
  authed(kind=='reg'?await api.register({email,password,displayName:$('#aName').value}):await api.login({email,password}));$('#aPass').value=''}
 catch(e){err.textContent=e.message+(e.fields?' ('+Object.values(e.fields).join('; ')+')':'')}}
$('#fAuth').onsubmit=e=>{e.preventDefault();doAuth('login')};$('#bReg').onclick=()=>doAuth('reg');
$('#bLogout').onclick=async()=>{try{await api.logout()}catch{}user=null;setCsrf(null);$('#bAcc').textContent='Account';try{prog=JSON.parse(localStorage.getItem('scoop'))||{unlocked:1,stars:{}}}catch{};show('menu')};
api.me().then(d=>{user=d.user;setCsrf(d.csrfToken);$('#bAcc').textContent='Profile';fromServer(d.progress)}).catch(()=>{});
