/* Deterministic whole-nut elemental powers.
   Call only when a nut is actually destroyed; shielding damage cannot activate.
   Tile statuses are attached to squares and remain separate from moving nut art. */
(function(root){'use strict';
const ELEMENTS=Object.freeze(['fire','ice','water','earth','wind','lightning','nature','poison','radiance','shadow','crystal','magma','frost','storm','arcane']);
// Shared, player-facing ability ledger: the NUTDEX reads these exact live rules.
const ABILITIES=Object.freeze({
 fire:'Scorch all four adjacent squares for one hit; ignite the nearest surviving square for a delayed blast.',
 ice:'Freeze up to two unpinned adjacent nuts for two ticks; frozen nuts cannot be swapped.',
 water:'Wash sticky butter, poison and burning auras from the entire row.',
 earth:'Crush one surface layer on up to three nearest nuts in the same column.',
 wind:'Rotate the nearest three movable nut payloads in the same row without moving fixed blockers.',
 lightning:'Zap up to three nearest matching-color nuts, then charge a surviving square with delayed lightning.',
 nature:'Clean the closest buttered square, refund one move when washed, and plant a root-vine tile that later recolors a neighbor.',
 poison:'Poison two adjacent squares; each turns sticky after its countdown.',
 radiance:'Cleanse up to three nearest hazards, prioritizing butter, and plant a delayed purifying radiance aura.',
 shadow:'Shield the nearest movable square from the next strike; the shadow ward fades after two turns.',
 crystal:'Store a 200-point cascade charge (up to three); seed a crystal tile that later holds a nut for two gravity drops.',
 magma:'Queue a post-gravity column strike; ignite a surviving square with delayed magma.',
 frost:'Cover the nearest movable nut with a one-hit frost shell that must be broken before matching.',
 storm:'Fork to up to five nuts across distinct rows and columns; charge a delayed storm strike on a survivor.',
 arcane:'Transmute two adjacent unpinned nuts to the activated nut color; seed another delayed color shift.'
});
function activate(g,record,ops){
 const {at,kind,color}=record,w=g.cfg.width;
 const valid=i=>i>=0&&i<g.cells.length&&!!g.cells[i]&&g.cells[i].type!==null;
 const row=i=>Math.floor(i/w),col=i=>i%w;
 const distance=i=>Math.abs(row(i)-row(at))+Math.abs(col(i)-col(at));
 const around=[at-w,at-1,at+1,at+w].filter(i=>valid(i)&&distance(i)===1);
 const nearest=()=>g.cells.map((c,i)=>valid(i)&&i!==at?i:-1).filter(i=>i>=0).sort((a,b)=>distance(a)-distance(b)||a-b);
 const strike=ids=>ids.forEach(i=>{if(valid(i))ops.damage(g,i,ops.summary);});
 const wash=ids=>ids.forEach(i=>{const c=g.cells[i];if(!c)return;if(c.jam>0){g.progress.jam+=c.jam;ops.summary.cracked+=c.jam;c.jam=0;}c.poison=0;if(['fire','poison'].includes(c.aura)){c.aura=null;c.auraTurns=0;}});
 if(kind==='fire'){strike(around);const target=nearest().find(i=>!ops.pinned(g.cells[i]));if(target!==undefined)ops.markAura(g,target,'fire');}
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
 else if(kind==='lightning'){strike(nearest().filter(i=>g.cells[i].type===color).slice(0,3));const target=nearest().find(i=>!ops.pinned(g.cells[i]));if(target!==undefined)ops.markAura(g,target,'lightning');}
 else if(kind==='nature'){
  const target=nearest().find(i=>g.cells[i].jam>0);
  if(target!==undefined){wash([target]);g.moves++;g.elementalRefunds=(g.elementalRefunds||0)+1;}
  const seed=nearest().find(i=>!ops.pinned(g.cells[i]));if(seed!==undefined)ops.markAura(g,seed,'nature-vines');
 }
 else if(kind==='poison')around.slice(0,2).forEach(i=>{g.cells[i].poison=Math.max(g.cells[i].poison||0,2);});
 else if(kind==='radiance'){
  const targets=nearest().filter(i=>{const c=g.cells[i];return c.jam||c.ice||c.lock||c.fuse;})
   .sort((a,b)=>Number(!!g.cells[b].jam)-Number(!!g.cells[a].jam)||distance(a)-distance(b)||a-b).slice(0,3);
  for(const i of targets){const c=g.cells[i];if(c.jam||c.poison)wash([i]);else if(c.aura==='shadow'){c.aura=null;c.auraTurns=0;}else ops.damage(g,i,ops.summary);}
  const seed=nearest().find(i=>!ops.pinned(g.cells[i]));if(seed!==undefined)ops.markAura(g,seed,'radiance');
 }
 else if(kind==='shadow'){
  const target=nearest().find(i=>!ops.pinned(g.cells[i]));
  if(target!==undefined){g.cells[target].ward=Math.max(g.cells[target].ward||0,2);ops.markAura(g,target,'shadow');}
 }
 else if(kind==='crystal'){g.crystalCharge=Math.min(3,(g.crystalCharge||0)+1);const target=nearest().find(i=>!ops.pinned(g.cells[i]));if(target!==undefined)ops.markAura(g,target,'crystal');}
 else if(kind==='magma'){if(!Array.isArray(g.magmaQueue))g.magmaQueue=[];g.magmaQueue.push(col(at));const target=nearest().find(i=>!ops.pinned(g.cells[i]));if(target!==undefined)ops.markAura(g,target,'magma');}
 else if(kind==='frost'){
  const target=nearest().find(i=>!ops.pinned(g.cells[i]));
  if(target!==undefined)g.cells[target].ice=1;
 }
 else if(kind==='storm'){
  const picked=[],rows=new Set(),columns=new Set();
  for(const i of nearest())if(!rows.has(row(i))&&!columns.has(col(i))){picked.push(i);rows.add(row(i));columns.add(col(i));if(picked.length>=5)break;}
  for(const i of nearest())if(picked.length<5&&!picked.includes(i))picked.push(i);
  strike(picked);
  const target=nearest().find(i=>!ops.pinned(g.cells[i]));if(target!==undefined)ops.markAura(g,target,'storm');
 }
 else if(kind==='arcane'){around.filter(i=>!ops.pinned(g.cells[i])).slice(0,2).forEach(i=>{g.cells[i].type=color;});const target=nearest().find(i=>!ops.pinned(g.cells[i]));if(target!==undefined)ops.markAura(g,target,'arcane');}
 else throw Error('Unknown elemental nut power '+kind);
}
const api=Object.freeze({ELEMENTS,ABILITIES,activate});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutElementalPowers=api;
})(typeof window!=='undefined'?window:globalThis);
