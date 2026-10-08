const assert=require('node:assert/strict'),C=require('../core.js');
const task={id:'a',title:'Bolsa do bebê',date:'2026-10-05',time:'09:00',category:'filhos',priority:false,days:[1,3,5],doneDates:['2026-10-05']};
assert.ok(C.task(task));assert.ok(C.occurs(task,'2026-10-07'));assert.ok(!C.occurs(task,'2026-10-08'));assert.ok(!C.occurs(task,'2026-10-02'));assert.ok(C.done(task,'2026-10-05'));assert.ok(!C.done(task,'2026-10-07'));
assert.ok(!C.validDate('2026-02-30'));assert.ok(C.validDate('2024-02-29'));assert.ok(!C.validTime('25:10'));assert.ok(C.validTime('00:00'));
assert.deepEqual(C.week('2026-10-08'),['2026-10-02','2026-10-03','2026-10-04','2026-10-05','2026-10-06','2026-10-07','2026-10-08']);
const migrated=C.migrate({tasks:[{id:1,name:'Água',time:'10:30',date:'2026-10-05',recurring:true,done:true}],notes:[{id:2,content:'Primeira palavra',isPearl:true}],water:{date:'2026-10-08',count:3}},'2026-10-08');
assert.ok(C.valid(migrated));assert.equal(migrated.tasks[0].days.length,7);assert.equal(migrated.tasks[0].doneDates[0],'2026-10-05');assert.equal(migrated.water['2026-10-08'],3);assert.ok(migrated.notes[0].memory);
assert.ok(!C.valid({...migrated,tasks:[task,task]}));assert.ok(!C.valid({...migrated,water:{'2026-10-08':-1}}));
console.log('Datas, recorrência, conclusões por dia, migração e backup: OK');
