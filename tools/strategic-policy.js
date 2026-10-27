'use strict';
// Deterministic one-swap objective/hazard-aware test policy.
// This is a lightweight player simulation, NOT search, human win-rate,
// or an optimal solver. It reads live engine semantics but never changes
// game source, RNG state, bonus inventory, or board state during ranking.
const E=require('../web/engine.js');
const PAYLOAD=['type','special','hold','elemental'];
function swapPayload(a,b){for(const key of PAYLOAD){const x=a[key];a[key]=b[key];b[key]=x;}}
function pendingObjectives(g){
 return E.objectiveState(g).map((o,i)=>({
  kind:o.kind,color:g.cfg.objectives[i].color??null,
  remaining:Math.max(0,o.target-o.value)
 })).filter(o=>o.remaining>0);
}
function effectiveHits(g,a,b){
 const ca=g.cells[a],cb=g.cells[b],found=E.matches(g);
 if(!ca.special&&!cb.special)return found;
 if(ca.special&&cb.special)return E.specialComboHits(g,a,b,found)||found;
 const source=ca.special?a:b,other=source===a?b:a;
 const overrides={};
 if(g.cells[source].special==='rainbow')overrides[source]=g.cells[other].type;
 return {hit:E.expandSpecials(g,new Set([...found.hit,source,other]),overrides),groups:found.groups};
}
function evaluate(g,a,b,goal){
 if(!E.adjacent(g,a,b))return null;
 const ca=g.cells[a],cb=g.cells[b];
 swapPayload(ca,cb);
 try{
  const f=effectiveHits(g,a,b);
  if(!f.hit.size)return null; // Non-matching ordinary swaps consume a day move.
  let score=f.hit.size*7;
  if(ca.special||cb.special)score+=30;
  if(f.combo)score+=70;
  if(f.groups?.some(x=>x.length>=4))score+=25;
  const pending=new Set(goal.map(o=>o.kind));
  for(const i of f.hit){
   const c=g.cells[i];if(!c||c.type===null)continue;
   if(c.ward>0||c.aura==='shadow'||c.rock>0){score+=2;continue;}
   let kind=null;
   if(c.jam>0)kind='jam';
   else if(c.ice>0)kind='ice';
   else if(c.lock>0)kind='locks';
   else if(c.chest>0)kind='chests';
   else if(c.fuse>0)kind='fuse';
   else kind='collect';
   if(kind==='fuse'){
    // Fuse expiry costs two EXTRA moves in the actual daily wallet.
    score+=c.fuse<=2?115:c.fuse<=3?70:22;
   }else if(kind==='collect'){
    if(goal.some(o=>o.kind==='collect'&&o.color===c.type))score+=33;
    if(pending.has('score'))score+=8;
   }else if(pending.has(kind)){
    score+=44;
    if(kind==='jam'&&g.turns%3===2)score+=12; // Next turn spreads butter.
   }else score+=5; // Clear an obstructing layer, but don't confuse it with the goal.
  }
  return score;
 }finally{swapPayload(ca,cb);}
}
function chooseStrategic(g){
 const goal=pendingObjectives(g),w=g.cfg.width;
 let best=null,bestScore=-Infinity;
 for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+w]){
  const score=evaluate(g,a,b,goal);
  if(score!==null&&score>bestScore){bestScore=score;best=[a,b];}
 }
 // Keep failure visible if the board has no scoring swap. The actual
 // engine normally repairs this automatically after a move.
 return best;
}
module.exports={chooseStrategic,evaluate,pendingObjectives};
