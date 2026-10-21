'use strict';
// Synthetic test data. This file is outside dist and is never deployed.
module.exports=function seedFixture(today){
  const M=require('./dist/model.js'),s=M.seed(today);
  for(const company of ['RET','VIU']){
    let parentId=null;
    M.levels.forEach(level=>{const [start,end]=M.periodBounds(level,today),id=company+'-'+level;s.goals.push({id,parentId,company,level,title:'Meta de prueba '+level,start,end,notes:'Prueba automatizada'});parentId=id;});
  }
  s.projects=[{id:'project-mind',company:'RET',title:'Proyecto A'},{id:'project-tecar',company:'RET',title:'Proyecto B'},{id:'project-serenia',company:'RET',title:'Proyecto C'},{id:'project-viu',company:'VIU',title:'Proyecto D'}];
  const ids=['ret-mind','viu-activate','ret-tecar','viu-manager','viu-team','ret-serenia','ret-report'];
  s.tasks=ids.map((id,i)=>({id,title:'Tarea de prueba '+i,company:id.startsWith('viu-')?'VIU':'RET',date:i<3?today:M.addDays(today,1),time:['09:00','11:00','14:00','10:00','15:00','11:00','16:00'][i],duration:30,priority:i<3,quadrant:i<2?1:2,goalId:(id.startsWith('viu-')?'VIU':'RET')+'-week',projectId:id.startsWith('viu-')?'project-viu':id==='ret-mind'?'project-mind':id==='ret-tecar'?'project-tecar':id==='ret-serenia'?'project-serenia':'',notes:'Nota de prueba',done:false}));
  return s;
};
