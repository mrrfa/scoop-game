import {reduced} from '../game/constants.js';
export const $=s=>document.querySelector(s);
const hooks={};export const onShow=(id,fn)=>{hooks[id]=fn};
let cur=null,ftm=0;
// Notebook page-turn: a paper sheet flips away over the freshly swapped screen. Never blocks input (pointer-events:none).
export function flip(){if(reduced)return;const t=$('#turn');t.classList.remove('on');void t.offsetWidth;t.classList.add('on');clearTimeout(ftm);ftm=setTimeout(()=>t.classList.remove('on'),620)}
export function show(id){closeOv();document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==id));if(cur&&cur!==id)flip();cur=id;hooks[id]?.()}
export function ov(html){$('#ovc').innerHTML=html;$('#ov').classList.add('on');$('#ovc button')?.focus()}
export const closeOv=()=>$('#ov').classList.remove('on');
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
