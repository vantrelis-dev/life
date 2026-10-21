// Synthetic examples only. Never distributed in the production dist application.
(async()=>{
  const M=window.PlannerModel,today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota'}).format(new Date()),s=M.seed(today);
  const examples=[
    ['Acordar próximos pasos con el equipo','VIU','09:00',1],
    ['Revisar propuesta comercial','RET','10:00',1],
    ['Preparar la sesión de creadores','VIU','11:30',2],
    ['Confirmar disponibilidad de conductores','MOO','14:00',3],
    ['Revisar cotización','KOO','15:30',2],
    ['Leer 20 minutos','PER','',2],
    ['Organizar notas de la semana','PER','',2]
  ];
  s.tasks=examples.map(([title,company,time,quadrant],i)=>({id:'qa-'+i,title,company,date:today,time,duration:30,quadrant,priority:i===0,notes:i===0?'Datos sintéticos para probar la tarjeta y la navegación.':'',done:i===6,executor:i===3?'human':'self',assignee:i===3?'Equipo':'',decision:i===1}));
  for(let i=1;i<7;i++)s.tasks.push({id:'qa-next-'+i,title:'Revisar avance del proyecto',company:['VIU','MOO','KOO','RET','PER','PEP'][i-1],date:M.addDays(M.monday(today),i),time:'09:30',duration:30,quadrant:2,done:false,notes:''});
  s.habits=[{id:'qa-habit',title:'Planear mi día',group:'morning',days:[0,1,2,3,4,5,6],company:'PER',time:'07:00'}];
  s.dayNotes['outcome-'+today]='Dejar acordados los próximos pasos de la semana';
  window.PlannerSession={cacheKey:'life-design-qa',read:()=>JSON.parse(JSON.stringify(s)),save:()=>{document.querySelector('#save-status').textContent='Prueba de diseño · No se guarda en tu cuenta';},openAccount:()=>{}};
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='app.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});
  document.documentElement.classList.remove('life-locked');
  document.querySelector('.demo-label').textContent='Prueba de diseño';
  document.querySelector('footer>span').textContent='Datos de prueba · Sin conexión a tu cuenta';
  document.querySelector('#save-status').textContent='No se guarda en tu cuenta';
})();
