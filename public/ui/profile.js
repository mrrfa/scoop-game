import {api} from '../api.js';
import {$,esc} from './screens.js';
export async function loadProfile(){const b=$('#pBody');b.textContent='Loading…';
 try{const d=await api.profile();$('#pName').textContent=d.user.displayName;const s=d.stats;
  b.innerHTML=`<p>${esc(d.user.email)}</p><table><tr><td>Levels completed</td><td>${s.levelsCompleted}/6</td></tr><tr><td>Total best score</td><td>${s.totalScore}</td></tr><tr><td>Completed runs</td><td>${s.plays}</td></tr><tr><td>Fruit collected</td><td>${s.fruit}</td></tr><tr><td>Play time (finished runs)</td><td>${s.playTime}s</td></tr></table>`}
 catch(e){b.textContent=e.message}}
