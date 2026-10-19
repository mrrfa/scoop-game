export class ApiError extends Error{constructor(status,code,message,fields){super(message);this.status=status;this.code=code;this.fields=fields}}
const bad=(f,m)=>{throw new ApiError(400,'VALIDATION_ERROR',m,{[f]:m})};
export const str=(o,f,min,max,re)=>{const v=o?.[f];if(typeof v!=='string')bad(f,`${f} must be a string`);const t=v.trim();if(t.length<min||t.length>max)bad(f,`${f} must be ${min}-${max} characters`);if(re&&!re.test(t))bad(f,`${f} is invalid`);return t};
export const num=(o,f,min,max,int=false)=>{const v=o?.[f];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(int&&!Number.isInteger(v)))bad(f,`${f} must be ${int?'an integer':'a number'} between ${min} and ${max}`);return v};
export const levelId=(v,n=6)=>{const i=Number(v);if(!Number.isInteger(i)||i<1||i>n)throw new ApiError(404,'LEVEL_NOT_FOUND','Unknown level');return i};
export const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
export const NAME=/^[\p{L}\p{N} _.'-]+$/u;
export function stars(o){if(typeof o!=='object'||o===null||Array.isArray(o))bad('stars','stars must be an object');const out={};
 for(const[k,v]of Object.entries(o)){const id=Number(k);if(!Number.isInteger(id)||id<1||id>6)bad('stars','unknown level '+k);if(!Number.isInteger(v)||v<0||v>3)bad('stars','stars must be 0-3');out[id]=v}return out}
