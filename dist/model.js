(function(root){
'use strict';
const companies={RET:{name:'Retornar',color:'#4d7f4c',bg:'#e5f0db',role:'Director Comercial'},VIU:{name:'VIUU',color:'#7d629e',bg:'#efe5f7',role:'CEO'},MOO:{name:'Moobi',color:'#507ba0',bg:'#e5eef7',role:'CEO'},KOO:{name:'Koova',color:'#a36a3a',bg:'#f9ebd8',role:'CEO'},PEP:{name:'Péptidos',color:'#8c7a33',bg:'#f2efd8',role:'Proyecto temprano'},PER:{name:'Personal',color:'#ad677f',bg:'#f7e5ec',role:'Personal'}};
const levels=['five','year','quarter','month','week'];
const levelNames={five:'5 años',year:'Año',quarter:'Trimestre',month:'Mes',week:'Semana'};
function dateObject(s){return new Date(s+'T12:00:00Z');}
function dateKey(d){return d.toISOString().slice(0,10);}
function addDays(s,n){const d=dateObject(s);d.setUTCDate(d.getUTCDate()+n);return dateKey(d);}
function monday(s){const d=dateObject(s);return addDays(s,-((d.getUTCDay()+6)%7));}
function daysOfMonth(s){const d=dateObject(s);return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();}
function shiftMonth(s,n){const d=dateObject(s),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n);const max=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,max));return dateKey(d);}
function periodBounds(level,date){const y=+date.slice(0,4),m=+date.slice(5,7);if(level==='five')return [`${y}-01-01`,`${y+4}-12-31`];if(level==='year')return [`${y}-01-01`,`${y}-12-31`];if(level==='quarter'){const start=Math.floor((m-1)/3)*3+1;return [`${y}-${String(start).padStart(2,'0')}-01`,addDays(`${start===10?y+1:y}-${String(start===10?1:start+3).padStart(2,'0')}-01`,-1)];}if(level==='month')return [`${date.slice(0,7)}-01`,`${date.slice(0,7)}-${daysOfMonth(date)}`];return [monday(date),addDays(monday(date),6)];}
function goalTrail(goals,id){const trail=[],seen=new Set();let goal=goals.find(g=>g.id===id);while(goal&&!seen.has(goal.id)){seen.add(goal.id);trail.unshift(goal);goal=goals.find(g=>g.id===goal.parentId);}return trail;}
function descendants(goals,id){const result=new Set([id]);let changed=true;while(changed){changed=false;for(const g of goals)if(g.parentId&&result.has(g.parentId)&&!result.has(g.id)){result.add(g.id);changed=true;}}return result;}
function progress(state,id){const ids=descendants(state.goals,id),tasks=state.tasks.filter(t=>!t.cancelledBySeries&&ids.has(t.goalId));return {done:tasks.filter(t=>t.done).length,total:tasks.length,percent:tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0};}
function containsPeriod(parent,child){return child.level==='week'?child.start<=parent.end&&child.end>=parent.start:child.start>=parent.start&&child.end<=parent.end;}
function parentError(goals,goal,companyMap=companies){if(!goal.title?.trim())return 'Escribe una meta.';if(!Object.hasOwn(companyMap,goal.company)||!levels.includes(goal.level))return 'Revisa el negocio y el período.';if(!/^\d{4}-\d{2}-\d{2}$/.test(goal.start)||!/^\d{4}-\d{2}-\d{2}$/.test(goal.end)||goal.end<goal.start)return 'Revisa las fechas de la meta.';if(goal.parentId){const p=goals.find(g=>g.id===goal.parentId);if(!p)return 'La meta superior no existe.';if(p.company!==goal.company)return 'La meta superior debe ser del mismo negocio.';if(levels.indexOf(p.level)>=levels.indexOf(goal.level))return 'El período superior debe ser más amplio.';if(!containsPeriod(p,goal))return 'Las fechas deben quedar dentro de la meta superior.';if(descendants(goals,goal.id).has(p.id))return 'Una meta no puede quedar dentro de sí misma.';}for(const child of goals.filter(g=>g.parentId===goal.id)){if(child.company!==goal.company||levels.indexOf(child.level)<=levels.indexOf(goal.level)||!containsPeriod(goal,child))return 'El cambio dejaría metas hijas fuera de su estructura. Ajusta primero esas metas.';}return '';}
function priorityError(tasks,task){if(task.priority&&!task.date)return 'Asigna una fecha a la prioridad.';if(task.priority&&tasks.filter(t=>t.id!==task.id&&t.date===task.date&&t.priority).length>=3)return 'Ya tienes tres prioridades ese día. Cambia una antes de añadir otra.';return '';}
function habitDue(habit,date){return habit.days.includes((dateObject(date).getUTCDay()+6)%7);}
function handle(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function mentionCatalog(state){const list=[];for(const [id,c] of Object.entries(state.companies)){list.push({kind:'company',id,company:id,title:c.name,handle:handle(c.name),aliases:[handle(c.name),handle(id),...(c.aliases||[]).map(handle)]});}for(const p of state.projects){list.push({kind:'project',id:p.id,company:p.company,title:p.title,handle:handle(p.handle||p.title),aliases:[handle(p.handle||p.title)],closed:p.status==='completed'||p.status==='paused'});}return list;}
function parseEntry(raw,state,fallback='PER'){
  const catalog=mentionCatalog(state),found=[],unknown=[],errors=[];
  let title=String(raw||'').replace(/(^|[\s(])@([\p{L}\p{N}_][\p{L}\p{N}_.-]*)/gu,(full,prefix,token)=>{
    const cleaned=token.replace(/[.]+$/,''),key=handle(cleaned),matches=catalog.filter(c=>c.aliases.includes(key));
    if(matches.length!==1){if(matches.length>1)errors.push(`@${cleaned} coincide con más de un nombre. Elige una etiqueta distinta.`);else unknown.push('@'+cleaned);return full;}
    if(matches[0].closed){errors.push(`El proyecto @${cleaned} no está activo. Reactívalo en Proyectos antes de añadirle trabajo.`);return full;}found.push(matches[0]);return prefix+(token.slice(cleaned.length));
  }).replace(/[ \t]{2,}/g,' ').trim();
  const executors=[];title=title.replace(/(^|\s)#(ia|humano|yo)(?=\s|[.,!?)]|$)/giu,(full,prefix,kind)=>{executors.push({ia:'ai',humano:'human',yo:'self'}[kind.toLowerCase()]);return prefix;}).replace(/[ \t]{2,}/g,' ').trim();
  const repeating=parseRepeat(title);title=repeating.title;
  const businesses=[...new Set(found.map(x=>x.company))],projects=[...new Set(found.filter(x=>x.kind==='project').map(x=>x.id))];
  if(businesses.length>1)errors.push('Usa un solo negocio por renglón. Puedes separar esto en dos tareas.');
  if(projects.length>1)errors.push('Usa un solo proyecto por renglón.');
  if(new Set(executors).size>1)errors.push('Elige un solo responsable: #yo, #humano o #ia.');
  return {title,repeat:repeating.rule,company:businesses[0]||fallback,projectId:projects[0]||null,executor:executors[0]||null,explicitCompany:businesses.length>0,explicitProject:projects.length>0,unknown,error:errors[0]||'',mentions:found};
}
function parseRepeat(raw){
  const text=String(raw||'').trim(),match=text.match(/\s+cada\s+(?:(\d{1,3})\s+)?(d[ií]as?|semanas?|mes(?:es)?|a[nñ]os?)\s*$/iu);
  if(!match)return {title:text,rule:null};
  const interval=Number(match[1]||1),unit=/^d/i.test(match[2])?'day':/^s/i.test(match[2])?'week':/^m/i.test(match[2])?'month':'year';
  if(interval<1||interval>365)return {title:text,rule:null};
  return {title:text.slice(0,match.index).trim(),rule:{unit,interval}};
}
function repeatLabel(rule){const names={day:['día','días'],week:['semana','semanas'],month:['mes','meses'],year:['año','años']};return 'Cada '+(rule.interval===1?'':rule.interval+' ')+names[rule.unit][rule.interval===1?0:1];}
function recurrenceDates(rule,from,to){
  if(!rule||!['day','week','month','year'].includes(rule.unit)||!Number.isInteger(rule.interval)||rule.interval<1||rule.interval>365||!/^\d{4}-\d{2}-\d{2}$/.test(rule.start||''))return [];
  const start=rule.start,lower=from>start?from:start,upper=[to,rule.end||to,rule.stoppedFrom?addDays(rule.stoppedFrom,-1):to].sort()[0];
  if(lower>upper)return [];
  const anchor=dateObject(start),dates=[];
  if(rule.unit==='day'||rule.unit==='week'){
    const stride=rule.interval*(rule.unit==='week'?7:1),distance=Math.round((dateObject(lower)-anchor)/86400000),first=Math.max(0,Math.ceil(distance/stride));
    for(let n=first;n<first+5000;n++){const d=addDays(start,n*stride);if(d>upper)break;dates.push(d);}
  }else{
    const stride=rule.interval*(rule.unit==='year'?12:1),low=dateObject(lower),months=(low.getUTCFullYear()-anchor.getUTCFullYear())*12+low.getUTCMonth()-anchor.getUTCMonth(),first=Math.max(0,Math.floor(months/stride)-1);
    for(let n=first;n<first+5000;n++){const d=shiftMonth(start,n*stride);if(d>upper)break;if(d>=lower)dates.push(d);}
  }
  return dates;
}
function addRecurrence(state,task,repeat,id){
  if(!task.date||task.seriesId||!repeat)return false;
  const template={...task};for(const key of ['id','done','actualResult','createdAt','updatedAt','seriesId','occurrenceDate'])delete template[key];
  template.priority=false;template.actualResult='';
  state.recurrences??=[];state.recurrences.push({id,start:task.date,unit:repeat.unit,interval:repeat.interval,template});
  task.seriesId=id;task.occurrenceDate=task.date;return true;
}
function materializeRecurrences(state,from,to){
  let added=0;const existing=new Set(state.tasks.filter(t=>t.seriesId).map(t=>t.seriesId+'|'+t.occurrenceDate));
  for(const rule of state.recurrences||[]){
    const project=state.projects.find(p=>p.id===rule.template.projectId);if(project&&['paused','completed'].includes(project.status))continue;
    for(const d of recurrenceDates(rule,from,to)){
      const key=rule.id+'|'+d;if(existing.has(key)||state.tasks.length>=20000)continue;
      const goal=state.goals.find(g=>g.id===rule.template.goalId),task={...rule.template,id:'repeat-'+rule.id+'-'+d,seriesId:rule.id,occurrenceDate:d,date:d,done:false,actualResult:'',priority:false,createdAt:new Date().toISOString()};
      if(goal&&(d<goal.start||d>goal.end))task.goalId=null;
      state.tasks.push(task);existing.add(key);added++;
    }
  }
  return added;
}
function stopRecurrence(state,id,from){
  const rule=(state.recurrences||[]).find(r=>r.id===id);if(!rule||rule.stoppedFrom)return false;
  rule.stoppedFrom=from;
  for(const task of state.tasks)if(task.seriesId===id&&task.occurrenceDate>=from&&!task.done)task.cancelledBySeries=true;
  return true;
}
function timeMinutes(time){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))return null;const [h,m]=time.split(':').map(Number);return h*60+m;}
function timeLabel(minutes){return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');}
function formatTime12(value){const minutes=timeMinutes(value);if(minutes===null)return '';const hour=Math.floor(minutes/60);return `${hour%12||12}:${String(minutes%60).padStart(2,'0')} ${hour<12?'AM':'PM'}`;}
function parseTime12(value){const text=String(value||'').trim();if(!text)return '';const match=text.match(/^(0?[1-9]|1[0-2])(?::([0-5]\d))?\s*(AM|PM)$/i);if(!match)return null;return timeLabel((Number(match[1])%12+(match[3].toUpperCase()==='PM'?12:0))*60+Number(match[2]||0));}
function canonicalTime(value){const text=String(value||'').trim();return timeMinutes(text)!==null?text:parseTime12(text);}
function slotTasks(tasks,minutes,step=30){return tasks.filter(t=>{const time=timeMinutes(t.time);return time!==null&&time>=minutes&&time<minutes+step;});}
function routineSuggestions(state){const latest=new Map();for(const e of state.completionEvents||[])latest.set(e.taskId+'|'+e.on,e);const groups=new Map();for(const e of latest.values()){if(!e.done)continue;const t=state.tasks.find(t=>t.id===e.taskId);if(!t||t.seriesId)continue;const title=e.title||t.title,company=e.company||t.company,key=company+'|'+handle(title);if(!groups.has(key))groups.set(key,{title,company,dates:new Set(),times:[]});const group=groups.get(key);group.dates.add(e.on);if(e.time||t.time)group.times.push(e.time||t.time);}return [...groups.values()].filter(g=>g.dates.size>=3&&!state.habits.some(h=>handle(h.title)===handle(g.title)&&(h.company||'PER')===g.company)).map(g=>{const counts=new Map();g.times.forEach(t=>counts.set(t,(counts.get(t)||0)+1));return {title:g.title,company:g.company,count:g.dates.size,days:[...new Set([...g.dates].map(d=>(dateObject(d).getUTCDay()+6)%7))].sort(),time:[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]||''};});}
function csvRows(text){if(String(text).length>1000000)throw Error('El archivo supera 1 MB.');const source=String(text).replace(/^\uFEFF/,''),head=source.split(/\r?\n/,1)[0],separator=(head.match(/;/g)||[]).length>(head.match(/,/g)||[]).length?';':',';const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<source.length;i++){const char=source[i];if(char==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(char===separator&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=char;}if(quoted)throw Error('Hay comillas sin cerrar en el CSV.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);if(rows.length>1001)throw Error('Importa como máximo 1.000 tareas por archivo.');return rows;}
function prepareImport(text,state){const table=csvRows(text);if(!table.length)throw Error('El archivo está vacío.');const headers=table.shift().map(handle),find=(row,names)=>{const index=headers.findIndex(h=>names.includes(h));return index<0?'':String(row[index]||'').trim();};if(!headers.some(h=>['tarea','titulo','title','task'].includes(h)))throw Error('Falta la columna tarea.');const existing=new Set(state.tasks.map(t=>[handle(t.title),t.company,t.date||'',t.time||'',t.projectId||''].join('|'))),rows=[],issues=[];let duplicates=0;table.forEach((row,index)=>{const raw=find(row,['tarea','titulo','title','task']),business=find(row,['negocio','empresa','company']),project=find(row,['proyecto','project']),date=find(row,['fecha','date']),rawTime=find(row,['hora','time']),time=canonicalTime(rawTime),notes=find(row,['notas','notes']);let error='';const parsed=parseEntry(raw+(business?' @'+handle(business):'')+(project?' @'+handle(project):''),state);if(parsed.error)error=parsed.error;if(parsed.repeat)error='Importa la tarea sin repetición y configura Repetir en su tarjeta.';if((business&&!mentionCatalog(state).some(x=>x.kind==='company'&&x.aliases.includes(handle(business))))||(project&&!mentionCatalog(state).some(x=>x.kind==='project'&&x.aliases.includes(handle(project)))))error='Negocio o proyecto sin reconocer. Créalo antes de importar.';if(!parsed.title)error='Falta la tarea.';if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(dateObject(date).getTime())||dateKey(dateObject(date))!==date))error='Fecha inválida; usa AAAA-MM-DD.';if(rawTime&&(time===null||!date))error='La hora requiere fecha. Usa 9:30 AM o 2:30 PM.';if(error){issues.push({row:index+2,error});return;}const task={title:parsed.title,company:parsed.company,projectId:parsed.projectId||'',date:date||null,time,notes,executor:parsed.executor||'self',assignee:'',goalId:null,priority:false,quadrant:2,done:false,decision:false,duration:30};const key=[handle(task.title),task.company,date,time,task.projectId].join('|');if(existing.has(key)){duplicates++;return;}existing.add(key);rows.push(task);});return {rows,issues,duplicates,total:table.length};}
function activity(state,start,end,company='all'){const latest=new Map();for(const e of state.completionEvents||[])latest.set(e.taskId,e);return [...latest.values()].filter(e=>e.done&&e.on>=start&&e.on<=end&&(company==='all'||e.company===company)).length;}
function upgrade(state){state.calendars??=[{id:'main',title:'Mi agenda',visible:true}];state.completionEvents??=[];state.recurrences??=[];state.tasks.forEach(t=>t.calendarId??='main');return state;}
// New accounts start empty. Demo and Brain-derived records are not public assets.
// Existing browser data is loaded independently in app.js and is never reset here.
function seed(today){return {version:2,companies:JSON.parse(JSON.stringify(companies)),projects:[],tasks:[],goals:[],habits:[],habitChecks:{},dayNotes:{}};}
function validState(s){return s?.version===2&&s.companies&&Object.keys(s.companies).length<100&&Object.values(s.companies).every(c=>typeof c.name==='string'&&/^#[0-9a-f]{6}$/i.test(c.color)&&/^#[0-9a-f]{6}$/i.test(c.bg))&&Array.isArray(s.projects)&&Array.isArray(s.tasks)&&Array.isArray(s.goals)&&Array.isArray(s.habits)&&s.tasks.length<=20000&&s.goals.length<1000&&s.tasks.every(t=>typeof t.id==='string'&&typeof t.title==='string'&&Object.hasOwn(s.companies,t.company))&&s.goals.every(g=>typeof g.id==='string'&&levels.includes(g.level)&&Object.hasOwn(s.companies,g.company))&&s.habitChecks&&typeof s.habitChecks==='object'&&s.dayNotes&&typeof s.dayNotes==='object';}
const API={companies,levels,levelNames,dateObject,dateKey,addDays,monday,daysOfMonth,shiftMonth,periodBounds,goalTrail,descendants,progress,parentError,priorityError,habitDue,seed,validState,activity,upgrade,handle,mentionCatalog,parseEntry,timeMinutes,timeLabel,formatTime12,parseTime12,canonicalTime,slotTasks,routineSuggestions,csvRows,prepareImport,parseRepeat,repeatLabel,recurrenceDates,addRecurrence,materializeRecurrences,stopRecurrence};if(typeof module==='object'&&module.exports)module.exports=API;else root.PlannerModel=API;
})(typeof window==='undefined'?{}:window);
