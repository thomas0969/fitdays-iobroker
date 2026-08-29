import fs from 'node:fs';
import path from 'node:path';
import { FitDaysClient } from 'fitdays-api';
function env() {
  const f = path.resolve('.env');
  const o = {};
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const s=l.trim(); if(!s||s.startsWith('#')) continue; const i=s.indexOf('='); if(i>0)o[s.slice(0,i).trim()]=s.slice(i+1).trim();
  }
  return o;
}
const e=env();
const c=new FitDaysClient({region:e.FITDAYS_REGION||'eu',country:e.FITDAYS_COUNTRY||'DE',language:e.FITDAYS_LANGUAGE||'de'});
const session=await c.login(e.FITDAYS_EMAIL,e.FITDAYS_PASSWORD);
const now=Math.floor(Date.now()/1000);
const r=await c.syncFromServer({endTime:now-90*86400,startTime:now});
const groups=new Map();
for(const w of r?.data?.weight_list||[]){ if(Number(w.is_deleted||0)!==0)continue; const k=String(w.suid??''); const g=groups.get(k)||{suid:k,uid:String(w.uid??''),count:0,last:0}; g.count++; g.last=Math.max(g.last,Number(w.measured_time||0)); groups.set(k,g); }
console.log(`Account UID: ${session.uid}`);
console.log('Detected measurement profiles (use suid for persons.json):');
for(const g of [...groups.values()].sort((a,b)=>b.last-a.last)) console.log(`suid=${g.suid} uid=${g.uid} measurements=${g.count} last=${g.last?new Date(g.last*1000).toLocaleString():'-'}`);
