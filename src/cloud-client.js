import {createClient} from '@supabase/supabase-js';
import {SyncEngine,readDraft,parseBackup,MAX_BYTES} from './sync.cjs';

const M=window.PlannerModel,byId=id=>document.getElementById(id);
const config=window.LIFE_CONFIG||{};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let client,engine,user,loaded=false,booting=false,pendingBackup=null,draftDownloaded=false;
const statusLabels={pending:'Guardando…',saved:'Guardado en tu cuenta',offline:'Pendiente de guardar · Reintentar',conflict:'Conflicto entre equipos · Revisa tu copia'};
const storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
function accessStatus(text){byId('access-status').textContent=text;}
function validDocument(body){
  try{
    if(!M.validState(body)||!body.companies.PER)return false;
    const company=id=>Object.hasOwn(body.companies,id),time=t=>t===''||t==null||M.timeMinutes(t)!==null;
    const date=d=>!d||/^\d{4}-\d{2}-\d{2}$/.test(d)&&M.dateKey(M.dateObject(d))===d;
    if(!Object.keys(body.companies).every(id=>/^[\w-]{1,100}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id)))return false;
    for(const items of [body.tasks,body.goals,body.projects,body.habits])if(new Set(items.map(x=>x.id)).size!==items.length)return false;
    if(!body.tasks.every(t=>time(t.time)&&date(t.date)&&(!t.time||!!t.date)&&(!t.notes||typeof t.notes==='string')))return false;
    if(!body.goals.every(g=>g.start&&g.end&&date(g.start)&&date(g.end)&&g.start<=g.end))return false;
    if(!body.projects.every(p=>typeof p.id==='string'&&typeof p.title==='string'&&company(p.company)))return false;
    if(!body.habits.every(h=>typeof h.id==='string'&&typeof h.title==='string'&&Array.isArray(h.days)&&h.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)&&time(h.time)))return false;
    if(!Object.values(body.dayNotes).every(v=>typeof v==='string'))return false;
    if(body.calendars&&(!Array.isArray(body.calendars)||!body.calendars.every(c=>typeof c.id==='string'&&typeof c.title==='string')))return false;
    if(body.completionEvents&&!Array.isArray(body.completionEvents))return false;
    if(body.recurrences&&(!Array.isArray(body.recurrences)||!body.recurrences.every(r=>typeof r.id==='string'&&r.template&&typeof r.template.title==='string'&&company(r.template.company))))return false;
    return true;
  }catch{return false;}
}
function download(body,name='life-copia'){
  const blob=new Blob([JSON.stringify({application:'Life',exportedAt:new Date().toISOString(),state:body},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function showSyncStatus(info){
  const text=(statusLabels[info.kind]||'Conectado')+(!info.cacheOK?' · Sin copia local':'');
  if(byId('save-status'))byId('save-status').textContent=text;
  if(byId('account-sync-status'))byId('account-sync-status').textContent=text;
}
function transport(id){return {
  async read(){
    const {data,error}=await client.from('planner_documents').select('body,revision').eq('user_id',id).maybeSingle();
    if(error)throw error;return data;
  },
  async write(body,revision){
    const row={user_id:id,body,revision:revision+1,updated_at:new Date().toISOString()};
    const query=revision===0?client.from('planner_documents').insert(row):client.from('planner_documents').update(row).eq('user_id',id).eq('revision',revision);
    const {data,error}=await query.select('revision').maybeSingle();
    if(error?.code==='23505')return null;if(error)throw error;return data;
  }
};}
function recovery(draft,remote,key){
  return new Promise(resolve=>{
    const box=byId('draft-recovery');box.hidden=false;
    byId('resume-draft').hidden=draft.revision!==(remote?.revision||0);
    byId('draft-message').textContent=draft.revision===(remote?.revision||0)?'Hay cambios de este equipo pendientes de guardar. Puedes recuperarlos.':'Hay cambios pendientes aquí y otra versión en el servidor. No sobrescribiremos ninguna automáticamente.';
    byId('download-draft').onclick=()=>{download(draft.body,'life-borrador');draftDownloaded=true;};
    byId('resume-draft').onclick=()=>{box.hidden=true;resolve(draft.body);};
    byId('use-server').onclick=()=>{
      try{storage.setItem(key+'.recovery',JSON.stringify(draft));}catch{if(!draftDownloaded){accessStatus('Descarga primero tu borrador para conservarlo.');return;}}
      box.hidden=true;resolve(null);
    };
  });
}
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
function canRestore(){return engine&&!engine.dirty()&&canonical(engine.body)===canonical(M.upgrade(M.seed(today())));}
async function loadPlanner(body,revision,key,api,resumed){
  engine=new SyncEngine({transport:api,storage,key,validate:validDocument,body,revision,onStatus:showSyncStatus});
  window.PlannerSession={
    cacheKey:key,read:()=>JSON.parse(JSON.stringify(body)),save:state=>engine.save(state),
    onRemote:null,canRefresh:null,exportState:null,
    openAccount:()=>byId('account-dialog').showModal()
  };
  const script=document.createElement('script');script.src='app.js';
  await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.append(script);});
  loaded=true;byId('access-form').hidden=true;document.documentElement.classList.remove('life-locked');
  document.querySelector('.demo-label').textContent='Privado';
  document.querySelector('footer > span').textContent='Agenda personal · America/Bogota';
  byId('account-email').textContent=user.email||'Cuenta privada';
  document.querySelector('.header-right').insertAdjacentHTML('beforeend','<button id="open-account" class="quiet-button" type="button">Cuenta</button>');
  byId('open-account').onclick=()=>byId('account-dialog').showModal();
  byId('reset-button').hidden=true;
  byId('info-dialog').querySelector('strong').textContent='Life · Agenda privada';
  const info=byId('info-dialog').querySelectorAll('p');
  info[0].textContent='Tus tareas, notas, metas y rutinas se guardan en tu cuenta. El estado inferior indica si quedan cambios pendientes.';
  info[1].textContent='Exporta una copia desde Cuenta. Una copia JSON anterior solo se puede restaurar en una agenda vacía, con confirmación.';
  info[2].textContent='Brain, correo, Calendar y agentes aún no están conectados. Asignar una tarea a IA no la ejecuta.';
  byId('connections-dialog').querySelector('p.origin').textContent='Google Calendar y las plataformas externas aún no están conectadas. Las tareas de Life sí se guardan en tu cuenta privada. Conectar una cuenta en el chat no la conecta automáticamente a Life.';
  if(resumed){engine.save(body);await engine.flush();}else showSyncStatus({kind:'saved',cacheOK:true});
  byId('restore-copy').disabled=!canRestore();
}
async function boot(){
  if(booting||loaded)return;booting=true;
  try{
    const {data:{session},error}=await client.auth.getSession();if(error)throw error;
    if(!session){byId('access-form').hidden=false;accessStatus('Entra con tu correo autorizado.');return;}
    const {data,error:userError}=await client.auth.getUser();if(userError)throw userError;
    user=data.user;
    if(!user||user.id!==config.ownerId){accessStatus('Esta cuenta no tiene acceso a Life.');byId('wrong-account-out').hidden=false;return;}
    const key='life.owner.'+user.id,api=transport(user.id),remote=await api.read();
    if(remote&&!validDocument(remote.body))throw Error('Invalid document');
    const draft=readDraft(storage,key,validDocument);
    let resumed=null;
    if(draft?.pending){accessStatus('Revisa los cambios pendientes de este equipo.');resumed=await recovery(draft,remote,key);}
    const body=M.upgrade(resumed||remote?.body||M.seed(today()));
    await loadPlanner(body,remote?.revision||0,key,api,!!resumed);
  }catch{accessStatus('No se pudo cargar tu agenda. Revisa la conexión y vuelve a intentar. No hemos reemplazado tus datos.');byId('access-retry').hidden=false;}
  finally{booting=false;}
}
async function refresh(){
  if(!loaded||!window.PlannerSession.canRefresh?.())return;
  try{const body=await engine.refresh();if(body)window.PlannerSession.onRemote?.(M.upgrade(body));}
  catch{showSyncStatus({kind:'offline',cacheOK:engine.cacheOK});}
}
byId('access-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=byId('access-submit');button.disabled=true;
  try{
    const {error}=await client.auth.signInWithOtp({email:byId('access-email').value.trim(),options:{shouldCreateUser:false,emailRedirectTo:location.origin+'/'}});
    if(error)throw error;accessStatus('Si el correo está autorizado, recibirás un enlace de acceso. Ábrelo en el dispositivo donde quieres entrar.');
  }catch{accessStatus('No se pudo enviar el enlace. Revisa el correo y vuelve a intentar en un minuto.');}
  finally{setTimeout(()=>{button.disabled=false;},60000);}
});
byId('access-retry').onclick=()=>{byId('access-retry').hidden=true;boot();};
byId('wrong-account-out').onclick=async()=>{await client.auth.signOut({scope:'local'});location.reload();};
byId('account-close').onclick=()=>byId('account-dialog').close();
byId('sync-now').onclick=async()=>{await engine.flush();byId('restore-copy').disabled=!canRestore();};
byId('refresh-agenda').onclick=async()=>{if(engine.dirty()){byId('account-sync-status').textContent='Guarda o descarga los cambios pendientes antes de cargar otra versión.';return;}byId('account-dialog').close();await refresh();};
byId('download-account-copy').onclick=()=>download(window.PlannerSession.exportState?.()||engine.body);
byId('restore-file').onchange=async event=>{
  pendingBackup=null;byId('restore-copy').disabled=true;
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>MAX_BYTES)throw Error('Máximo 4 MB por copia.');
    const body=M.upgrade(parseBackup(await file.text(),validDocument));pendingBackup=body;
    byId('restore-preview').textContent=body.tasks.length+' tareas · '+body.goals.length+' metas · '+body.habits.length+' rutinas. La copia original no se modifica.';
    byId('restore-copy').disabled=!canRestore();
    if(!canRestore())byId('restore-preview').textContent+=' Solo se restaura en una agenda vacía para no borrar datos existentes.';
  }catch(error){byId('restore-preview').textContent=error.message;}
};
byId('restore-copy').onclick=async()=>{
  if(!pendingBackup||!canRestore())return;
  const body=pendingBackup;pendingBackup=null;byId('restore-copy').disabled=true;
  try{storage.setItem(engine.key+'.before-import',JSON.stringify(engine.body));}catch{byId('restore-preview').textContent='No hay espacio para una copia previa; no se importó nada.';return;}
  engine.save(body);window.PlannerSession.onRemote?.(body);await engine.flush();
  byId('restore-preview').textContent=engine.dirty()?'Copia cargada en este equipo; todavía pendiente de guardar.':'Copia restaurada y guardada en tu cuenta.';
};
byId('sign-out-account').onclick=async()=>{
  await engine.flush();
  if(engine.dirty()){byId('account-sync-status').textContent='Quedan cambios sin guardar. Descarga una copia y resuelve el guardado antes de salir.';return;}
  engine.stop();for(const suffix of ['', '.before-import','.recovery']){try{localStorage.removeItem(engine.key+suffix);}catch{}}
  await client.auth.signOut({scope:'local'});location.reload();
};
window.addEventListener('focus',refresh);window.addEventListener('online',()=>engine?.flush());
window.addEventListener('beforeunload',event=>{if(engine?.dirty()){event.preventDefault();event.returnValue='';}});
if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.url||'')||!/^sb_publishable_/.test(config.publishableKey||'')||!/^[-\da-f]{36}$/i.test(config.ownerId||'')){
  accessStatus('Estamos preparando tu acceso privado. La agenda no está disponible hasta terminar la configuración.');
}else{
  client=createClient(config.url,config.publishableKey,{auth:{flowType:'implicit',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  client.auth.onAuthStateChange(event=>{
    if(event==='SIGNED_OUT'&&loaded){document.documentElement.classList.add('life-locked');engine?.stop();location.reload();}
    else if(event==='SIGNED_IN'&&!loaded)queueMicrotask(boot);
  });
  boot();
}
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
