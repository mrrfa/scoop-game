import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
// Single JSON-file store. Synchronous atomic writes (tmp + rename). Swap for PostgreSQL later.
export class Storage{
  constructor(dir){this.file=join(dir,'db.json');mkdirSync(dirname(this.file),{recursive:true});
    this.data={users:{},sessions:{},scores:[]};
    if(existsSync(this.file)){try{this.data={...this.data,...JSON.parse(readFileSync(this.file,'utf8'))}}catch(e){throw new Error('Corrupt db.json: '+e.message)}}}
  save(){const t=this.file+'.tmp';writeFileSync(t,JSON.stringify(this.data),{mode:0o600});renameSync(t,this.file)}
  userByEmail(email){return Object.values(this.data.users).find(u=>u.email===email)}
}
