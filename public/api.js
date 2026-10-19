// Centralized API client. Throws ApiClientError with a friendly message; never throws on network failure silently.
export class ApiClientError extends Error{constructor(status,code,message,fields){super(message);this.status=status;this.code=code;this.fields=fields}}
let csrf=null;export const setCsrf=t=>{csrf=t};
async function req(method,path,body){
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),8000);
 try{const res=await fetch('/api/v1'+path,{method,credentials:'same-origin',signal:ctl.signal,headers:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new ApiClientError(res.status,data.error?.code||'ERROR',data.error?.message||`Request failed (${res.status})`,data.error?.fields);
  return data}
 catch(e){if(e instanceof ApiClientError)throw e;throw new ApiClientError(0,'NETWORK','Can’t reach the server right now. Playing as a guest still works.')}
 finally{clearTimeout(to)}}
export const api={
 health:()=>req('GET','/health'),me:()=>req('GET','/auth/me'),
 register:b=>req('POST','/auth/register',b),login:b=>req('POST','/auth/login',b),logout:()=>req('POST','/auth/logout',{}),
 profile:()=>req('GET','/profile'),progress:()=>req('GET','/progress'),sync:stars=>req('POST','/progress/sync',{stars}),
 postScore:b=>req('POST','/scores',b),leaderboard:(page=1)=>req('GET',`/leaderboards?page=${page}&pageSize=8`),
 levelBoard:(id,page=1)=>req('GET',`/leaderboards/levels/${id}?page=${page}&pageSize=8`)};
