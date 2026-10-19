import {ApiError} from './validation.mjs';
const hits=new Map();
export function rateLimit(key,max,ms=60000){const now=Date.now();const a=(hits.get(key)||[]).filter(t=>now-t<ms);if(a.length>=max){hits.set(key,a);throw new ApiError(429,'RATE_LIMITED','Too many requests, slow down')}a.push(now);hits.set(key,a)}
export const clearLimits=()=>hits.clear();
export function parseCookies(h=''){const o={};for(const p of h.split(';')){const i=p.indexOf('=');if(i>0)o[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim())}return o}
export function cookie(name,val,{maxAge=0,prod=false}={}){return `${name}=${encodeURIComponent(val)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${prod?'; Secure':''}`}
export function sameOrigin(req){const o=req.headers.origin;if(!o)return true;try{return new URL(o).host===req.headers.host}catch{return false}}
export const SEC_HEADERS={'Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
