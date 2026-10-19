export class Router{constructor(){this.routes=[]}
 add(method,path,fn){const keys=[];const re=new RegExp('^'+path.replace(/:(\w+)/g,(_,k)=>{keys.push(k);return '([^/]+)'})+'/?$');this.routes.push({method,re,keys,fn})}
 match(method,url){let pathMatched=false;for(const r of this.routes){const m=r.re.exec(url);if(!m)continue;pathMatched=true;if(r.method!==method)continue;
  const params={};r.keys.forEach((k,i)=>params[k]=decodeURIComponent(m[i+1]));return {fn:r.fn,params}}
  return pathMatched?{status:405}:null}}
