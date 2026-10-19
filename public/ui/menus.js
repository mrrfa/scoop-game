import {LV} from '../game/levels.js';
import {$} from './screens.js';
export function renderLevels(mode,prog,onPlay){$('#lt').textContent=mode==2?'Co-op: pick a level':'Solo: pick a level';
 $('#lg').innerHTML=LV.map((l,i)=>{const ok=i<prog.unlocked,s=prog.stars[i]||0;
  return `<div class="lv"><b>${i+1}. ${l.n}</b><p>${l.d}</p><p>${ok?('★'.repeat(s)+'☆'.repeat(3-s)):'🔒 Locked'}</p><button ${ok?'':'disabled'} data-i="${i}">Play</button></div>`}).join('');
 $('#lg').querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>onPlay(+b.dataset.i))}
