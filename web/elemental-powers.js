/* Deterministic whole-nut elemental powers.
   Call only when a nut is actually destroyed; shielding damage cannot activate.
   Tile statuses are attached to squares and remain separate from moving nut art. */
(function(root){'use strict';
const ELEMENTS=Object.freeze(['fire','ice','water','earth','wind','lightning','nature','poison','radiance','shadow','crystal','magma','frost','storm','arcane']);
function activate(g,record,ops){
 const {at,kind,color}=record,w=g.cfg.width;
 const valid=i=>i>=0&&i<g.cells.length&&!!g.cells[i]&&g.cells[i].type!==null;
 const row=i=>Math.floor(i/w),col=i=>i%w;
 const distance=i=>Math.abs(row(i)-row(at))+Math.abs(col(i)-col(at));
 const around=[at-w,at-1,at+1,at+w].filter(i=>valid(i)&&distance(i)===1);
 const nearest=()=>g.cells.map((c,i)=>valid(i)&&i!==at?i:-1).filter(i=>i>=0).sort((a,b)=>distance(a)-distance(b)||a-b);
 const strike=ids=>ids.forEach(i=>{if(valid(i))ops.damage(g,i,ops.summary);});
 const wash=ids=>ids.forEach(i=>{const c=g.cells[i];if(c?.jam>0){g.progress.jam+=c.jam;ops.summary.cracked+=c.jam;c.jam=0;}});
 if(kind==='fire')strike(around);
 else if(kind==='ice')around.filter(i=>!ops.pinned(g.cells[i])).slice(0,2).forEach(i=>{g.cells[i].frozen=Math.max(g.cells[i].frozen||0,2);});
 else if(kind==='water')wash(g.cells.map((c,i)=>valid(i)&&row(i)===row(at)?i:-1).filter(i=>i>=0));
 else if(kind==='earth')strike(nearest().filter(i=>col(i)===col(at)).slice(0,3));
 else if(kind==='wind'){
  const movable=nearest().filter(i=>row(i)===row(at)&&!ops.pinned(g.cells[i])).slice(0,3);
  if(movable.length===3){
   const last=Object.fromEntries(['type','special','hold','elemental'].map(k=>[k,g.cells[movable[2]][k]]));
   for(let j=2;j>0;j--)for(const k of ['type','special','hold','elemental'])g.cells[movable[j]][k]=g.cells[movable[j-1]][k];
   for(const k of ['type','special','hold','elemental'])g.cells[movable[0]][k]=last[k];
  }
 }
 else if(kind==='lightning')strike(nearest().filter(i=>g.cells[i].type===color).slice(0,3));
 else if(kind==='nature'){
  const target=nearest().find(i=>g.cells[i].jam>0);
  if(target!==undefined){wash([target]);g.moves++;g.elementalRefunds=(g.elementalRefunds||0)+1;}
 }
 else if(kind==='poison')around.slice(0,2).forEach(i=>{g.cells[i].poison=Math.max(g.cells[i].poison||0,2);});
 else if(kind==='radiance'){
  const targets=nearest().filter(i=>{const c=g.cells[i];return c.jam||c.ice||c.lock||c.fuse;})
   .sort((a,b)=>Number(!!g.cells[b].jam)-Number(!!g.cells[a].jam)||distance(a)-distance(b)||a-b).slice(0,3);
  for(const i of targets){const c=g.cells[i];if(c.jam)wash([i]);else ops.damage(g,i,ops.summary);}
 }
 else if(kind==='shadow'){
  const target=nearest().find(i=>!ops.pinned(g.cells[i]));
  if(target!==undefined)g.cells[target].ward=Math.max(g.cells[target].ward||0,2);
 }
 else if(kind==='crystal')g.crystalCharge=Math.min(3,(g.crystalCharge||0)+1);
 else if(kind==='magma'){if(!Array.isArray(g.magmaQueue))g.magmaQueue=[];g.magmaQueue.push(col(at));}
 else if(kind==='frost'){
  const target=nearest().find(i=>!ops.pinned(g.cells[i]));
  if(target!==undefined)g.cells[target].ice=1;
 }
 else if(kind==='storm'){
  const picked=[],rows=new Set(),columns=new Set();
  for(const i of nearest())if(!rows.has(row(i))&&!columns.has(col(i))){picked.push(i);rows.add(row(i));columns.add(col(i));if(picked.length>=5)break;}
  for(const i of nearest())if(picked.length<5&&!picked.includes(i))picked.push(i);
  strike(picked);
 }
 else if(kind==='arcane')around.filter(i=>!ops.pinned(g.cells[i])).slice(0,2).forEach(i=>{g.cells[i].type=color;});
 else throw Error('Unknown elemental nut power '+kind);
}
const api=Object.freeze({ELEMENTS,activate});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutElementalPowers=api;
})(typeof window!=='undefined'?window:globalThis);
