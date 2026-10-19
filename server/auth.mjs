import {scrypt,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {parseCookies} from './security.mjs';
const sc=promisify(scrypt),SESSION_MS=7*864e5,COOKIE='scoop_sid';
export {COOKIE,SESSION_MS};
export async function hashPassword(pw){const salt=randomBytes(16);const h=await sc(pw,salt,64);return salt.toString('hex')+':'+h.toString('hex')}
export async function verifyPassword(pw,stored){const[s,h]=stored.split(':');const d=await sc(pw,Buffer.from(s,'hex'),64);const b=Buffer.from(h,'hex');return b.length===d.length&&timingSafeEqual(b,d)}
const hashTok=t=>createHash('sha256').update(t).digest('hex');
export function createSession(db,uid){const token=randomBytes(32).toString('base64url'),csrf=randomBytes(24).toString('base64url');
 db.data.sessions[hashTok(token)]={uid,csrf,exp:Date.now()+SESSION_MS};db.save();return {token,csrf}}
export function getSession(db,req){const t=parseCookies(req.headers.cookie)[COOKIE];if(!t)return null;const k=hashTok(t),s=db.data.sessions[k];
 if(!s)return null;if(s.exp<Date.now()){delete db.data.sessions[k];db.save();return null}
 const user=db.data.users[s.uid];return user?{key:k,csrf:s.csrf,user}:null}
export function destroySession(db,key){delete db.data.sessions[key];db.save()}
