// One-time/idempotent historical import from fitdays-data.json into sql.0.
// Run after fetching the desired range, e.g. --from 2026-08-01 --to 2026-08-31.
// Recommended: native sql.0 history for FitDays DPs is disabled to avoid duplicate sync-time rows.
const fs=require('fs');
const DATA_FILE='/opt/iobroker/fitdays-sync/fitdays-data.json';
const PERSONS_FILE='/opt/iobroker/fitdays-sync/persons.json';
const ROOT='0_userdata.0.Fitdays', SQL='sql.0';
const METRICS=['Gewicht','BMI','Koerperfett','Unterhautfett','Viszeralfett','Skelettmuskel','Muskelanteil','Grundumsatz','Knochenmasse','Koerperwasser','Koerperalter','Protein','Herzfrequenz'];
const J=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const personFor=(m,ps)=>ps.find(p=>p.active!==false&&((p.suid&&String(p.suid)===String(m.suid))||(!p.suid&&p.uid&&String(p.uid)===String(m.uid))));
function history(id,start,end){return new Promise((resolve,reject)=>sendTo(SQL,'getHistory',{id,options:{start,end,aggregate:'none',removeBorderValues:true,ignoreNull:false}},r=>r?.error?reject(new Error(JSON.stringify(r.error))):resolve(r?.result||[])));}
function store(entries){return new Promise((resolve,reject)=>sendTo(SQL,'storeState',entries,r=>r?.error?reject(new Error(JSON.stringify(r.error))):resolve(r)));}
(async()=>{
  const data=J(DATA_FILE), cfg=J(PERSONS_FILE); const rows=data.measurements||[]; if(!rows.length){log('FitDays Backfill: no measurements','warn');return;}
  for(const p of (cfg.persons||[]).filter(x=>x.active!==false)){
    const mine=rows.filter(m=>personFor(m,[p])).sort((a,b)=>a.measuredTime-b.measuredTime); if(!mine.length)continue;
    const start=mine[0].measuredTime*1000-1,end=mine.at(-1).measuredTime*1000+1;
    let added=0;
    for(const name of METRICS){
      const id=`${ROOT}.${p.name}.Aktuell.${name}`; const existing=new Set((await history(id,start,end)).map(x=>Number(x.ts)));
      const states=mine.filter(m=>m.values&&m.values[name]!==undefined&&!existing.has(m.measuredTime*1000)).map(m=>({ts:m.measuredTime*1000,val:m.values[name],ack:true,q:0,from:'javascript.0.fitdays-backfill'}));
      if(states.length){await store({id,state:states});added+=states.length;}
    }
    const last=mine.at(-1); for(const [name,val] of Object.entries(last.values||{})) if(METRICS.includes(name)&&existsState(`${ROOT}.${p.name}.Aktuell.${name}`)) await setStateAsync(`${ROOT}.${p.name}.Aktuell.${name}`,val,true);
    log(`FitDays Backfill ${p.name}: ${added} SQL values inserted (timestamp-deduplicated)`,'info');
  }
})().catch(e=>log(`FITDAYS BACKFILL ERROR: ${e.stack||e}`,'error'));
