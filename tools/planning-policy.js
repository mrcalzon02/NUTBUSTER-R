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
// Nonmatching set-up swaps consume a real daily move, but may construct a
// better follow-up match. Rank them separately so greedy match scoring never
// pretends they immediately earn points or bypass an actual engine swap.
const MOVABLE=['type','special','hold','elemental'];
function swapMovables(a,b){for(const k of MOVABLE){const v=a[k];a[k]=b[k];b[k]=v;}}
function nearbyPairs(g){
 const w=g.cfg.width;
 let pairs=0;
 for(let i=0;i<g.cells.length;i++){
  const a=g.cells[i];
  if(!a||a.type===null)continue;
  for(const j of [i+1,i+w]){
   if(!E.adjacent(g,i,j))continue;
   if(g.cells[j].type===a.type)pairs++;
  }
 }
 return pairs;
}
function followupPotential(g){
 let best=0,bestFour=0;
 const w=g.cfg.width;
 for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+w]){
  if(!E.adjacent(g,a,b))continue;
  const x=g.cells[a],y=g.cells[b];
  // Two-special swaps are immediately legal, not a setup candidate,
  // but they may be an especially useful next turn.
  if(x.special||y.special){best=Math.max(best,4);continue;}
  const left=x.type,right=y.type;
  x.type=right;y.type=left;
  const f=E.matches(g);
  x.type=left;y.type=right; // restore original types
  if(f.hit.size){
   best=Math.max(best,f.hit.size);
   if(f.groups.some(group=>group.length>=4))bestFour=1;
  }
 }
 return {best,bestFour};
}
function rankedSetupMoves(g,limit=2){
 if(limit<=0)return [];
 const basePairs=nearbyPairs(g),candidate=[],w=g.cfg.width;
 // Phase 1: cheap structural scoring over each legal swap, with no RNG or
 // game-state mutations after each candidate.
 for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+w]){
  if(!E.adjacent(g,a,b))continue;
  const x=g.cells[a],y=g.cells[b];
  if(x.special||y.special||x.type===y.type)continue;
  swapMovables(x,y);
  try{
   if(E.matches(g).hit.size)continue; // An immediate match is NOT a setup.
   const potential=nearbyPairs(g)-basePairs;
   if(potential>0)candidate.push({a,b,potential});
  }finally{swapMovables(x,y);}
 }
 candidate.sort((u,v)=>v.potential-u.potential||u.a-v.a||u.b-v.b);
 const ranked=[];
 // Phase 2: exact next-swap match potential on only a tiny shortlist.
 // This does not claim that the match will survive fuse/hazard resolution;
 // the beam's actual NutEngine.swap call tests that.
 for(const move of candidate.slice(0,Math.max(6,limit*4))){
  const x=g.cells[move.a],y=g.cells[move.b];
  swapMovables(x,y);
  try{
   const next=followupPotential(g);
   if(next.best>=3)ranked.push({...move,
    score:next.best*8+next.bestFour*32+move.potential*3,
    followupMatchSize:next.best,followupCreatesSpecial:!!next.bestFour,
    setup:true});
  }finally{swapMovables(x,y);}
 }
 ranked.sort((a,b)=>b.score-a.score||a.a-b.a||a.b-b.b);
 return ranked.slice(0,limit);
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
  firstSetup:node.first?node.firstSetup:!!action.setup,
  setupMoves:(node.setupMoves||0)+Number(!!action.setup),
  depth:node.depth+1,hazards:node.hazards+(turn.hazards?.expired?.length||0),
  simulations:node.simulations+1,
  value:score(game,wallet,cap)};
}
function search(g,opts={}){
 adoptRandom(g);
 const depth=opts.depth??DEFAULT.depth,beamSize=opts.beam??DEFAULT.beam,
  actions=opts.actions??DEFAULT.actions,maxNodes=opts.maxNodes??DEFAULT.maxNodes,
  allowSetups=opts.allowSetups??false;
 if(!Number.isInteger(depth)||depth<1||depth>4||
  !Number.isInteger(beamSize)||beamSize<1||beamSize>8||
  !Number.isInteger(actions)||actions<1||actions>12||
  !Number.isInteger(maxNodes)||maxNodes<1||maxNodes>256||typeof allowSetups!=='boolean')
  throw Error('Planning budget exceeds explicitly bounded search');
 const cap=g.cfg.moves,root={game:g,wallet:g.moves,first:null,
  depth:0,hazards:0,simulations:0,setupMoves:0,firstSetup:false,value:score(g,g.moves,cap)};
 let frontier=[root],best=null,expanded=0,layers=0,setupCandidatesExamined=0;
 for(let d=0;d<depth;d++){
  const next=[];
  for(const node of frontier){
   if(node.game.won||node.game.lost||node.wallet<=0)continue;
   const setups=allowSetups&&d<depth-1?rankedSetupMoves(node.game,Math.min(2,actions-1)):[];
   const immediate=rankedMoves(node.game,actions-setups.length);
   for(const move of [...immediate,...setups]){
    if(expanded>=maxNodes)break;
    const child=advance(node,move,cap);
    // A setup move cannot be rewarded as completed goal progress. Small
    // heuristic promise instead keeps it in the beam until a follow-up
    // engine simulation can verify whether it actually helped.
    if(move.setup)child.value+=Math.min(95,move.score);
    expanded++;
    if(move.setup)setupCandidatesExamined++;
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
  // Reserve one beam slot for a genuine nonmatching setup at the root.
  // Otherwise a cheap immediate match eliminates every setup before the
  // next turn can prove whether its construction was worthwhile.
  if(allowSetups&&d===0&&depth>1&&beamSize>1){
   const setup=next.find(n=>n.firstSetup);
   if(setup&&!frontier.includes(setup))frontier[frontier.length-1]=setup;
  }
  best=frontier[0];
 }
 return {move:best?.first||null,expanded,layers,score:best?.value??null,
  setupSelected:!!best?.firstSetup,setupMovesInPath:best?.setupMoves??0,
  setupCandidatesExamined,
  wonInSearch:!!best?.game.won};
}
function choosePlanning(g){return search(g,{allowSetups:true}).move;}
module.exports={forward,reverse,fromState,adoptRandom,fork,rankedMoves,rankedSetupMoves,followupPotential,nearbyPairs,score,advance,search,choosePlanning};
