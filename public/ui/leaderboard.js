import {api} from '../api.js';
import {LV} from '../game/levels.js';
import {$,esc} from './screens.js';
let page=1,total=0,size=8;
export function initBoard(){const sel=$('#lbSel');sel.innerHTML='<option value="all">Overall</option>'+LV.map((l,i)=>`<option value="${i+1}">Level ${i+1}: ${esc(l.n)}</option>`).join('');
 sel.onchange=()=>{page=1;load()};$('#lbPrev').onclick=()=>{if(page>1){page--;load()}};$('#lbNext').onclick=()=>{if(page*size<total){page++;load()}}}
export async function load(){const b=$('#lbBody'),v=$('#lbSel').value;b.textContent='Loading…';
 try{const d=v=='all'?await api.leaderboard(page):await api.levelBoard(v,page);total=d.total;size=d.pageSize;
  if(!d.entries.length){b.textContent='No scores yet. Be the first to finish a level while logged in!';return}
  b.innerHTML=v=='all'?`<table><tr><th>#</th><th>Player</th><th>Total</th><th>Levels</th></tr>${d.entries.map(e=>`<tr><td>${e.rank}</td><td>${esc(e.displayName)}</td><td>${e.totalScore}</td><td>${e.levelsCompleted}</td></tr>`).join('')}</table>`
   :`<table><tr><th>#</th><th>Player</th><th>Score</th><th>Time</th><th>★</th></tr>${d.entries.map(e=>`<tr><td>${e.rank}</td><td>${esc(e.displayName)}</td><td>${e.score}</td><td>${e.time}s</td><td>${e.stars}</td></tr>`).join('')}</table>`}
 catch(e){b.textContent=e.message}}
