(function(root){'use strict';
const day=(date=new Date())=>{const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&day(new Date(s+'T12:00:00'))===s;
const validTime=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const occurs=(t,date)=>validDate(date)&&date>=t.date&&(t.days.length?t.days.includes(new Date(date+'T12:00:00').getDay()):date===t.date);
const done=(t,date)=>t.doneDates.includes(date);
const week=(today=day())=>Array.from({length:7},(_,i)=>{const d=new Date(today+'T12:00:00');d.setDate(d.getDate()-6+i);return day(d);});
const task=t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&t.title.trim().length>0&&t.title.length<=100&&validDate(t.date)&&validTime(t.time)&&['casa','filhos','eu'].includes(t.category)&&typeof t.priority==='boolean'&&Array.isArray(t.days)&&new Set(t.days).size===t.days.length&&t.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)&&Array.isArray(t.doneDates)&&new Set(t.doneDates).size===t.doneDates.length&&t.doneDates.every(validDate);
const note=n=>n&&typeof n.id==='string'&&typeof n.content==='string'&&n.content.trim().length>0&&n.content.length<=3000&&validDate(n.date)&&typeof n.memory==='boolean';
function valid(s){return s&&s.version===5&&typeof s.name==='string'&&s.name.length<=40&&Array.isArray(s.tasks)&&s.tasks.every(task)&&new Set(s.tasks.map(t=>t.id)).size===s.tasks.length&&Array.isArray(s.notes)&&s.notes.every(note)&&new Set(s.notes.map(n=>n.id)).size===s.notes.length&&s.water&&typeof s.water==='object'&&!Array.isArray(s.water)&&Object.entries(s.water).every(([d,c])=>validDate(d)&&Number.isInteger(c)&&c>=0&&c<=100);}
const empty=()=>({version:5,name:'',tasks:[],notes:[],water:{}});
function migrate(d,today=day()){if(!d||!Array.isArray(d.tasks)||!Array.isArray(d.notes))throw Error('Formato inválido');const s=empty();s.tasks=d.tasks.map((t,i)=>({id:'old-task-'+String(t.id??i),title:String(t.name||''),date:validDate(t.date)?t.date:today,time:t.time,category:['casa','filhos','eu'].includes(t.cat)?t.cat:'casa',priority:!!t.prio,days:t.recurring?[0,1,2,3,4,5,6]:(t.recurringDays||[]),doneDates:t.done&&validDate(t.date)?[t.date]:[]}));s.notes=d.notes.map((n,i)=>({id:'old-note-'+String(n.id??i),content:String(n.content||''),date:today,memory:!!n.isPearl}));if(d.water&&validDate(d.water.date)&&Number.isInteger(d.water.count))s.water[d.water.date]=d.water.count;if(!valid(s))throw Error('Dados inválidos');return s;}
const api={day,validDate,validTime,occurs,done,week,task,note,valid,empty,migrate};root.MomCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
