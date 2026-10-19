import {DK} from './constants.js';
import {S} from './state.js';
const SOLO={KeyW:[0,'u'],KeyS:[0,'d'],KeyA:[0,'l'],KeyD:[0,'r'],ArrowUp:[0,'u'],ArrowDown:[0,'d'],ArrowLeft:[0,'l'],ArrowRight:[0,'r'],KeyF:[0,'ice'],KeyG:[0,'brk'],Slash:[0,'ice'],Period:[0,'brk']};
const COOP={KeyW:[0,'u'],KeyS:[0,'d'],KeyA:[0,'l'],KeyD:[0,'r'],KeyF:[0,'ice'],KeyG:[0,'brk'],ArrowUp:[1,'u'],ArrowDown:[1,'d'],ArrowLeft:[1,'l'],ArrowRight:[1,'r'],Slash:[1,'ice'],Period:[1,'brk']};
let map=SOLO,ready=false;
export const setInputMode=m=>{map=m==2?COOP:SOLO;S.held=[[],[]];S.acts=[[],[]]};
export function initInput({active,onPause}){if(ready)return;ready=true; // listeners attached exactly once
 addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||!active())return;
  if(e.code=='KeyP'||e.code=='Escape'){e.preventDefault();if(!e.repeat)onPause();return}
  const a=map[e.code];if(!a||!S.g||S.g.state!='play'||S.stat)return;e.preventDefault();if(e.repeat)return;
  const[p,k]=a;if(DK[k]){S.held[p]=S.held[p].filter(x=>x!=k);S.held[p].push(k)}else S.acts[p].push(k)});
 addEventListener('keyup',e=>{const a=map[e.code];if(a&&DK[a[1]])S.held[a[0]]=S.held[a[0]].filter(x=>x!=a[1])});
 addEventListener('blur',()=>{S.held=[[],[]]})}
