import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {join,resolve,extname,sep,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Storage} from './server/storage.mjs';
import {buildApi} from './server/api.mjs';
import {getSession} from './server/auth.mjs';
import {ApiError} from './server/validation.mjs';
import {sameOrigin,SEC_HEADERS} from './server/security.mjs';

const ROOT=dirname(fileURLToPath(import.meta.url)),PUB=resolve(ROOT,'public');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const MAX_BODY=16*1024;

function readBody(req){return new Promise((ok,no)=>{let n=0;const c=[];req.on('data',d=>{n+=d.length;if(n>MAX_BODY){if(n-d.length<=MAX_BODY)no(new ApiError(413,'PAYLOAD_TOO_LARGE','Request body too large'))}else c.push(d)});
 req.on('end',()=>{if(!c.length)return ok({});try{ok(JSON.parse(Buffer.concat(c).toString()))}catch{no(new ApiError(400,'BAD_JSON','Invalid JSON'))}});req.on('error',no)})}
const send=(res,status,body,headers={})=>{const s=body===undefined?'':JSON.stringify(body);res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...SEC_HEADERS,...headers});res.end(s)};

export function createServer({dataDir=process.env.DATA_DIR||join(ROOT,'data'),prod=process.env.NODE_ENV==='production'}={}){
 const db=new Storage(dataDir),api=buildApi(db,{prod});
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://x');const rid=Math.random().toString(36).slice(2,10);
  try{
   if(url.pathname.startsWith('/api/')){
    const m=api.match(req.method,url.pathname);
    if(!m)throw new ApiError(404,'NOT_FOUND','No such endpoint');
    if(m.status)throw new ApiError(405,'METHOD_NOT_ALLOWED','Method not allowed');
    const mutating=!['GET','HEAD','OPTIONS'].includes(req.method);
    if(mutating&&!sameOrigin(req))throw new ApiError(403,'BAD_ORIGIN','Cross-origin request blocked');
    const session=getSession(db,req);
    if(mutating&&session&&!url.pathname.endsWith('/auth/login')&&!url.pathname.endsWith('/auth/register')&&req.headers['x-csrf-token']!==session.csrf)throw new ApiError(403,'BAD_CSRF','Missing or invalid CSRF token');
    const body=mutating?await readBody(req):{};
    const out=await m.fn({body,query:url.searchParams,params:m.params,session,ip:req.socket.remoteAddress||'?'});
    return send(res,out.status||200,out.body,out.cookies?{'Set-Cookie':out.cookies}:{});
   }
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end()}
   let p;try{p=decodeURIComponent(url.pathname)}catch{res.writeHead(400);return res.end()}
   if(p.includes('\0')){res.writeHead(400);return res.end()}
   if(p==='/')p='/index.html';
   const file=resolve(PUB,'.'+p);
   if(!(file===PUB||file.startsWith(PUB+sep))||file.slice(PUB.length).split(sep).some(x=>x.startsWith('.'))){res.writeHead(403);return res.end('Forbidden')}
   const st=await stat(file).catch(()=>null);
   if(!st||!st.isFile()){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found')}
   res.writeHead(200,{'Content-Type':MIME[extname(file)]||'application/octet-stream',...SEC_HEADERS,'Cache-Control':'no-cache'});
   req.method==='HEAD'?res.end():res.end(await readFile(file));
  }catch(e){
   if(e instanceof ApiError)return send(res,e.status,{error:{code:e.code,message:e.message,fields:e.fields,requestId:rid}});
   console.error(`[${rid}]`,e);send(res,500,{error:{code:'INTERNAL',message:'Something went wrong',requestId:rid}})}});
 server.db=db;return server}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const port=Number(process.env.PORT)||3000,host=process.env.HOST||'127.0.0.1';
 createServer().listen(port,host,()=>console.log(`SCOOP! running at http://${host}:${port}`))}
