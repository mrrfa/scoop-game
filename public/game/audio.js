// Original procedural audio (Web Audio only). No files, no network. Every entry point is a safe no-op if audio is unavailable.
const KEY='scoop.audio';
export const audio={music:true,sfx:true};
try{Object.assign(audio,JSON.parse(globalThis.localStorage?.getItem(KEY))||{})}catch{}
const savePrefs=()=>{try{globalThis.localStorage?.setItem(KEY,JSON.stringify({music:audio.music,sfx:audio.sfx}))}catch{}};
let crk=null,AC=null,master,musicG,sfxG,noiseBuf,timer=null,nextT=0,stepN=0,unlocked=false,fadeTm=0;
function ctx(){if(AC)return AC;const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return null;
 try{AC=new C();master=AC.createGain();master.gain.value=.85;master.connect(AC.destination);
  musicG=AC.createGain();musicG.gain.value=0;musicG.connect(master);sfxG=AC.createGain();sfxG.gain.value=.7;sfxG.connect(master);
  noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}catch{AC=null}
 return AC}
const live=()=>{const a=ctx();return a&&a.state!=='closed'?a:null};
// Rate limiting so repeated collision events can't stack sounds.
const last={};export const gate=(k,ms,now=Date.now())=>{if(now-(last[k]||0)<ms)return false;last[k]=now;return true};
const mtof=m=>440*Math.pow(2,(m-69)/12);
function tone(out,f,t,dur,{type='sine',vol=.05,att=.01,lp=0,f2=0}={}){const a=AC,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+dur);let n=o;
 if(lp){const l=a.createBiquadFilter();l.type='lowpass';l.frequency.value=lp;o.connect(l);n=l}n.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05)}
function noise(out,t,dur,{type='bandpass',f=3000,q=1,vol=.05,strokes=1}={}){const a=AC,s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf;s.playbackRate.value=.8+Math.random()*.4;
 fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.setValueAtTime(.0001,t);const st=dur/strokes;
 for(let i=0;i<strokes;i++){g.gain.linearRampToValueAtTime(vol*(i%2?.6:1),t+st*(i+.35));g.gain.linearRampToValueAtTime(.0001,t+st*(i+1))}
 s.connect(fl);fl.connect(g);g.connect(out);s.start(t,Math.random()*.5);s.stop(t+dur+.02)}
const sfxOK=()=>audio.sfx&&unlocked&&live()&&AC.state!=='suspended';
const play=(name,ms,fn)=>{try{if(sfxOK()&&gate(name,ms))fn(AC.currentTime)}catch{}};
export const sfx={
 scribble:()=>play('scribble',70,t=>noise(sfxG,t,.16,{f:2600+Math.random()*900,q:1.4,vol:.06,strokes:4})),
 iceMake:()=>play('iceMake',90,t=>{noise(sfxG,t,.14,{f:3200,q:1.2,vol:.06,strokes:3});tone(sfxG,700,t+.1,.1,{vol:.025,lp:2500})}),
 iceFail:()=>play('iceFail',120,t=>noise(sfxG,t,.08,{f:1500,q:.8,vol:.03,strokes:2})),
 iceBreak:()=>play('iceBreak',100,t=>{noise(sfxG,t,.15,{f:2200,q:1,vol:.06,strokes:3});[.17,.22,.27,.34].forEach((d,i)=>tone(sfxG,1500+i*260+Math.random()*120,t+d,.04,{type:'triangle',vol:.03}))}),
 pop:(k=0)=>play('pop',50,t=>tone(sfxG,480+(k%6)*60,t,.1,{vol:.07,f2:900+(k%6)*60,att:.005})),
 victory:()=>play('victory',500,t=>{[60,64,67,72,76].forEach((m,i)=>{tone(sfxG,mtof(m+12),t+i*.13,.9,{type:'triangle',vol:.05,lp:2600,att:.02});if(i<3)tone(sfxG,mtof(m),t+i*.13,1.2,{vol:.03})})}),
 boop:()=>play('boop',250,t=>tone(sfxG,340,t,.14,{vol:.07,f2:210,att:.005})),
 hurt:()=>play('hurt',200,t=>tone(sfxG,150,t,.3,{type:'triangle',vol:.07,f2:80,lp:900})),
 lose:()=>play('lose',500,t=>[67,64,60].forEach((m,i)=>tone(sfxG,mtof(m),t+i*.2,.6,{type:'triangle',vol:.045,lp:1400}))),
 click:()=>play('click',40,t=>tone(sfxG,620,t,.05,{vol:.03,type:'triangle'}))};
// Back-compat for older callers: snd(freq,dur,type,vol)
export function snd(f,d=.1,type='triangle',v=.1){play('snd'+f,60,t=>tone(sfxG,f,t,d,{type,vol:Math.min(v,.08)}))}

// ---- Lo-fi music: Am7 - Fmaj7 - Cmaj7 - G6, 70 bpm, scheduled slightly ahead of time ----
const CH=[[57,60,64,67],[53,57,60,64],[60,64,67,71],[55,59,62,64]],SIXT=60/70/4;
function playStep(n,t){const bar=Math.floor(n/16)%4,s=n%16,ch=CH[bar],h=(Math.random()-.5)*.012;t+=h;
 if(s==0)ch.forEach(m=>tone(musicG,mtof(m),t,SIXT*15,{type:'triangle',vol:.03,att:.5,lp:900}));
 if(s==0||s==10)tone(musicG,mtof(ch[0]-12),t,SIXT*5,{vol:.07,att:.02,lp:400});
 if(s==0||s==8)tone(musicG,120,t,.16,{vol:.09,f2:45,att:.003});
 if(s==4||s==12)noise(musicG,t,.07,{type:'highpass',f:4500,vol:.025});
 if(s%4==2)noise(musicG,t,.03,{type:'highpass',f:7000,vol:.012});
 if(s==14&&Math.random()<.35){const sc=[0,3,5,7,10];tone(musicG,mtof(ch[1]+12+sc[Math.floor(Math.random()*5)]),t,.5,{type:'triangle',vol:.03,lp:2200});if(Math.random()<.5)tone(musicG,mtof(ch[2]+12),t+SIXT,.5,{type:'triangle',vol:.025,lp:2200})}
 if(Math.random()<.3)noise(musicG,t+Math.random()*SIXT,.004,{type:'highpass',f:3000,vol:.035}); // vinyl pops
}
function schedule(){if(!AC||AC.state==='suspended')return;while(nextT<AC.currentTime+.3){playStep(stepN++,nextT);nextT+=SIXT}}
export function startMusic(){const a=live();if(!a||!unlocked||!audio.music||document?.hidden)return;
 try{a.resume?.().catch?.(()=>{})}catch{}clearTimeout(fadeTm);
 if(!timer){nextT=a.currentTime+.15;timer=setInterval(schedule,100);
  // continuous, very quiet record crackle bed
  const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf;s.loop=true;f.type='highpass';f.frequency.value=5000;g.gain.value=.006;s.connect(f);f.connect(g);g.connect(musicG);s.start();crk=s}
 musicG.gain.cancelScheduledValues(a.currentTime);musicG.gain.setTargetAtTime(.55,a.currentTime,1.1)} // ~3s smooth fade-in
export function stopMusic(){const a=AC;if(!a||!timer)return;musicG.gain.cancelScheduledValues(a.currentTime);musicG.gain.setTargetAtTime(0,a.currentTime,.35);
 const tm=timer;fadeTm=setTimeout(()=>{if(timer===tm&&(!audio.music||document?.hidden)){clearInterval(tm);try{crk?.stop()}catch{}crk=null;timer=null}},1800)}
// Call from a user gesture. Browsers keep the context suspended until then, so nothing plays before it.
export function unlockAudio(){unlocked=true;const a=live();if(!a)return;try{a.resume?.().catch?.(()=>{})}catch{}if(audio.music)startMusic()}
export function setMusic(on){audio.music=!!on;savePrefs();on?startMusic():stopMusic()}
export function setSfx(on){audio.sfx=!!on;savePrefs()}
if(typeof document!=='undefined')document.addEventListener?.('visibilitychange',()=>{document.hidden?stopMusic():(audio.music&&startMusic())});
