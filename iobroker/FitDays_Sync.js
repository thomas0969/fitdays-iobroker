// FitDays -> ioBroker live sync. Paste into javascript.0.
// Recommended SQL mode: keep native SQL history DISABLED for these DPs.
// This script writes SQL history itself with the original FitDays measured_time.

const fs = require('fs');
const DATA_FILE = '/opt/iobroker/fitdays-sync/fitdays-data.json';
const PERSONS_FILE = '/opt/iobroker/fitdays-sync/persons.json';
const ROOT = '0_userdata.0.Fitdays';
const SQL = 'sql.0';

const METRICS = {
  Gewicht:{unit:'kg'}, BMI:{unit:''}, Koerperfett:{unit:'%'}, Unterhautfett:{unit:'%'},
  Viszeralfett:{unit:'Index'}, Skelettmuskel:{unit:'%'}, Muskelanteil:{unit:'%'},
  Grundumsatz:{unit:'kcal'}, Knochenmasse:{unit:'kg'}, Koerperwasser:{unit:'%'},
  Koerperalter:{unit:'Jahre'}, Protein:{unit:'%'}, Herzfrequenz:{unit:'bpm'}
};

function loadJson(file){ return JSON.parse(fs.readFileSync(file,'utf8')); }
function personFor(m, persons){
  return persons.find(p => p.active !== false && ((p.suid && String(p.suid)===String(m.suid)) || (!p.suid && p.uid && String(p.uid)===String(m.uid))));
}
async function ensureState(id, initial, common){ if(!existsState(id)) await createStateAsync(id, initial, false, common); }
async function ensurePerson(p){
  for(const [k,cfg] of Object.entries(METRICS)) await ensureState(`${ROOT}.${p.name}.Aktuell.${k}`,0,{name:k,type:'number',role:'value',unit:cfg.unit,read:true,write:false});
  await ensureState(`${ROOT}.${p.name}.Status.LetzteDataID`,'',{name:'Letzte Data-ID',type:'string',role:'text',read:true,write:false});
  await ensureState(`${ROOT}.${p.name}.Status.LetzteMessung`,'',{name:'Letzte Messung',type:'string',role:'text',read:true,write:false});
  await ensureState(`${ROOT}.${p.name}.Status.LetzteSynchronisation`,'',{name:'Letzte Synchronisation',type:'string',role:'text',read:true,write:false});
  await ensureState(`${ROOT}.${p.name}.Status.NeueMessungen`,0,{name:'Neue Messungen',type:'number',role:'value',read:true,write:false});
  await ensureState(`${ROOT}.${p.name}.Status.Fehler`,'',{name:'Fehler',type:'string',role:'text',read:true,write:false});
}
function storeSql(entries){
  return new Promise((resolve,reject)=>sendTo(SQL,'storeState',entries,res=>{
    if(res?.error || (Array.isArray(res?.errors)&&res.errors.length)) reject(new Error(JSON.stringify(res.error||res.errors))); else resolve(res);
  }));
}
async function processPerson(p, all){
  await ensurePerson(p);
  const rows=all.filter(m=>personFor(m,[p])).sort((a,b)=>a.measuredTime-b.measuredTime);
  const dpLast=`${ROOT}.${p.name}.Status.LetzteDataID`;
  const last=String((await getStateAsync(dpLast))?.val||'');
  if(!rows.length) return;
  if(!last){
    // First live start: initialize cursor/current values only; use Backfill script for history.
    const m=rows.at(-1);
    for(const [name,val] of Object.entries(m.values||{})) if(METRICS[name]) await setStateAsync(`${ROOT}.${p.name}.Aktuell.${name}`,val,true);
    await setStateAsync(dpLast,m.dataId,true);
    await setStateAsync(`${ROOT}.${p.name}.Status.LetzteMessung`,new Date(m.measuredTime*1000).toLocaleString('de-DE'),true);
    await setStateAsync(`${ROOT}.${p.name}.Status.LetzteSynchronisation`,new Date().toLocaleString('de-DE'),true);
    await setStateAsync(`${ROOT}.${p.name}.Status.NeueMessungen`,0,true);
    return;
  }
  const i=rows.findIndex(m=>m.dataId===last);
  let candidates=i>=0?rows.slice(i+1):[];
  if(i<0){
    log(`FitDays ${p.name}: cursor not in current fetch window; no automatic catch-up to avoid duplicates. Use Backfill if needed.`,'warn');
    candidates=[];
  }
  let n=0;
  for(const m of candidates){
    const sql=[];
    for(const [name,val] of Object.entries(m.values||{})) if(METRICS[name]) sql.push({id:`${ROOT}.${p.name}.Aktuell.${name}`,state:{ts:m.measuredTime*1000,val,ack:true,q:0,from:'javascript.0.fitdays'}});
    if(sql.length) await storeSql(sql);
    for(const [name,val] of Object.entries(m.values||{})) if(METRICS[name]) await setStateAsync(`${ROOT}.${p.name}.Aktuell.${name}`,val,true);
    await setStateAsync(dpLast,m.dataId,true);
    await setStateAsync(`${ROOT}.${p.name}.Status.LetzteMessung`,new Date(m.measuredTime*1000).toLocaleString('de-DE'),true);
    n++;
  }
  await setStateAsync(`${ROOT}.${p.name}.Status.NeueMessungen`,n,true);
  await setStateAsync(`${ROOT}.${p.name}.Status.LetzteSynchronisation`,new Date().toLocaleString('de-DE'),true);
  await setStateAsync(`${ROOT}.${p.name}.Status.Fehler`,'',true);
  log(`FitDays ${p.name}: ${n} new measurement(s)`,'info');
}
async function sync(){
  try{
    if(!fs.existsSync(DATA_FILE)) throw new Error(`Missing ${DATA_FILE}`);
    if(!fs.existsSync(PERSONS_FILE)) throw new Error(`Missing ${PERSONS_FILE}`);
    const data=loadJson(DATA_FILE), cfg=loadJson(PERSONS_FILE);
    if(data.schemaVersion!==1) throw new Error(`Unsupported schemaVersion ${data.schemaVersion}`);
    for(const p of (cfg.persons||[]).filter(x=>x.active!==false)) await processPerson(p,data.measurements||[]);
  }catch(e){ log(`FITDAYS SYNC ERROR: ${e.message||e}`,'error'); }
}
(async()=>{ await sync(); })();
schedule('2,17,32,47 * * * *',sync);
