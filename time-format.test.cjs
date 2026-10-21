'use strict';
const assert=require('node:assert/strict');
const M=require('./dist/model.js');
let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
for(const [stored,visible] of [['00:00','12:00 AM'],['00:30','12:30 AM'],['09:30','9:30 AM'],['11:59','11:59 AM'],['12:00','12:00 PM'],['12:30','12:30 PM'],['14:00','2:00 PM'],['23:59','11:59 PM']]){eq(M.formatTime12(stored),visible);eq(M.parseTime12(visible),stored);}
for(let i=0;i<1440;i++)eq(M.parseTime12(M.formatTime12(M.timeLabel(i))),M.timeLabel(i));
eq(M.parseTime12(' 2:35 pm '),'14:35');eq(M.parseTime12('9AM'),'09:00');eq(M.parseTime12('09:30 AM'),'09:30');
for(const invalid of ['00:30 AM','13:00 PM','9:60 AM','14:00','9:30','12:99 PM'])eq(M.parseTime12(invalid),null);
eq(M.parseTime12(''),'');eq(M.formatTime12(''),'');eq(M.formatTime12('24:00'),'');
const state=M.upgrade(M.seed('2026-10-21')),snapshot=JSON.stringify(state);
state.tasks.forEach(t=>M.formatTime12(t.time));eq(JSON.stringify(state),snapshot);
const imported=M.prepareImport('tarea,fecha,hora\nPrueba,2026-10-21,2:30 PM\nPrueba,2026-10-21,14:30',state);
eq(imported.rows[0].time,'14:30');eq(imported.duplicates,1);eq(imported.issues.length,0);
console.log(`${checks} comprobaciones de formato AM/PM, límites y conservación de horas: OK`);
