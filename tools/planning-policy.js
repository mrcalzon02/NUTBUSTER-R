'use strict';
// Search-only planning policy. Evaluates actual NutEngine swaps on fully forked
// boards with independently cloned random states. No production code modified.
const E=require('../web/engine.js');
const {evaluate,pendingObjectives}=require('./strategic-policy.js');
const UNIT=4294967296;
const DEFAULT={depth:3,beam:3,actions:4,maxNodes:40};
function forward(x){x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;}
function undoLeft(y,k){let x=y>>>0;for(let s=k;s<32;s*=2)x^=x<<s;return x>>>0;}
function undoRight(y,k){let x=y>>>0;for(let s=k;s<32;s*=2)x^=x>>>s;return x>>>0;}
function reverse(y){return undoLeft(undoRight(undoLeft(y,5),17),13);}
function fromState(original){
 let state=original>>>0;
 const f=()=>{state=forward(state);return state/UNIT;};
 f.getState=()=>state;
 return f;
}
function adoptRandom(g){
 if(typeof g.rand.getState==='function')return g;
 // A single original draw reveals the full unsigned xorshift state. Inverting
 // all three xorshift steps restores the PRE-DRAW state without changing the
 // next random draw or touching source-engine implementation.
 const observed=g.rand(),next=Math.floor(observed*UNIT)>>>0;
 const prior=reverse(next);
 g.rand=fromState(prior);
 if(forward(prior)!==next)throw Error('Cannot reconstruct original RNG state');
 return g;
}
function fork(g){
 adoptRandom(g);
 const {rand,...plain}=g;
 const copy=structuredClone(plain);
 copy.rand=fromState(rand.getState());
 return copy;
}
function rankedMoves(g,limit){
 const goal=pendingObjectives(g),w=g.cfg.width,all=[];
 for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+w]){
  const score=evaluate(g,a,b,goal);
  if(score!==null)all.push({a,b,score});
 }
 all.sort((u,v)=>v.score-u.score||u.a-v.a||u.b-v.b);
 return all.slice(0,limit);
}
function score(g,wallet,cap){
 const goals=E.objectiveState(g);
 if(g.won)return 1000000+wallet*2;
 let progress=0,done=0;
 for(const o of goals){
  const fraction=o.target>0?Math.min(1,Math.max(0,o.value/o.target)):1;
  progress+=fraction;
  if(o.done)done++;
 }
 progress/=goals.length;
 const fusePressure=g.cells.reduce((s,c)=>s+(c?.fuse>0&&c.fuse<=2?1:0),0);
 const specials=g.cells.reduce((s,c)=>s+(c?.special?1:0),0);
 // Goal completion dominates raw point farming. Wallet and looming hazards
 // matter, but do not replace accomplishing the actual authored targets.
 return progress*3200+done*180+wallet*5-fusePressure*6+Math.min(8,specials)*5;
}
function advance(node,action,cap){
 const game=fork(node.game),previous=game.elementalRefunds||0;
 game.moves=node.wallet;
 const turn=E.swap(game,action.a,action.b);
 if(!turn.valid)throw Error('Planner tried an invalid real-engine swap');
 const debit=Math.min(node.wallet,1+2*(turn.hazards?.expired?.length||0));
 const earned=Math.max(0,(game.elementalRefunds||0)-previous);
 const wallet=node.wallet-debit+earned;
 game.moves=wallet;
 if(earned&&wallet)game.lost=false;
 if(!game.won&&!wallet)game.lost=true;
 if(wallet<0)throw Error('Planner wallet went negative');
 return {game,wallet,first:node.first||[action.a,action.b],
  depth:node.depth+1,hazards:node.hazards+(turn.hazards?.expired?.length||0),
  simulations:node.simulations+1,
  value:score(game,wallet,cap)};
}
function search(g,opts={}){
 adoptRandom(g);
 const depth=opts.depth??DEFAULT.depth,beamSize=opts.beam??DEFAULT.beam,
  actions=opts.actions??DEFAULT.actions,maxNodes=opts.maxNodes??DEFAULT.maxNodes;
 if(!Number.isInteger(depth)||depth<1||depth>4||
  !Number.isInteger(beamSize)||beamSize<1||beamSize>8||
  !Number.isInteger(actions)||actions<1||actions>12||
  !Number.isInteger(maxNodes)||maxNodes<1||maxNodes>256)
  throw Error('Planning budget exceeds explicitly bounded search');
 const cap=g.cfg.moves,root={game:g,wallet:g.moves,first:null,
  depth:0,hazards:0,simulations:0,value:score(g,g.moves,cap)};
 let frontier=[root],best=null,expanded=0,layers=0;
 for(let d=0;d<depth;d++){
  const next=[];
  for(const node of frontier){
   if(node.game.won||node.game.lost||node.wallet<=0)continue;
   for(const move of rankedMoves(node.game,actions)){
    if(expanded>=maxNodes)break;
    const child=advance(node,move,cap);
    expanded++;
    next.push(child);
   }
   if(expanded>=maxNodes)break;
  }
  if(!next.length)break;
  next.sort((a,b)=>b.value-a.value||a.first[0]-b.first[0]||a.first[1]-b.first[1]);
  const winning=next.find(n=>n.game.won);
  layers++;
  if(winning){best=winning;break;}
  frontier=next.slice(0,beamSize);
  best=frontier[0];
 }
 return {move:best?.first||null,expanded,layers,score:best?.value??null,
  wonInSearch:!!best?.game.won};
}
function choosePlanning(g){return search(g).move;}
module.exports={forward,reverse,fromState,adoptRandom,fork,rankedMoves,score,advance,search,choosePlanning};
