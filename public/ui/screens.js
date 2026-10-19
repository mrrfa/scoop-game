export const $=s=>document.querySelector(s);
const hooks={};export const onShow=(id,fn)=>{hooks[id]=fn};
export function show(id){closeOv();document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==id));hooks[id]?.()}
export function ov(html){$('#ovc').innerHTML=html;$('#ov').classList.add('on');$('#ovc button')?.focus()}
export const closeOv=()=>$('#ov').classList.remove('on');
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
