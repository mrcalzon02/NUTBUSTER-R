/* Automated difficulty probe, NOT a prediction of real player win rates.
   Preserve the two-seed no-booster baseline. On one seed at every fifth
   level, repeat the same board with AT MOST ONE emergency Hammer near
   defeat. This is a sparse hypothetical test budget, NOT an earned-inventory
   or human completion-rate model. Never give free boosters to game saves. */
const E=require('../web/engine.js');
const P=require('../web/progression.js');
const CAMPAIGN_LEVELS=1000,CHAPTER_LENGTH=100;
const trials=2,results=[],boosterProbes=[];
const PROBE_EVERY=5,PROBE_TRIAL=0,MAX_HAMMERS_PER_PROBE=1;
function choose(g){
 const w=g.cfg.width,objective=g.cfg.objectives;
 let best=null,bestScore=-Infinity;
 for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+w]){
  if(!E.adjacent(g,a,b))continue;
  const ca=g.cells[a],cb=g.cells[b],left=ca.type,right=cb.type;
  ca.type=right;cb.type=left;
  const hit=E.matches(g).hit;
  let score=hit.size*10;
  if(ca.special||cb.special)score+=25;
  for(const i of hit){
   const c=g.cells[i];
   if(objective.some(o=>o.kind==='collect'&&o.color===c.type))score+=15;
   if(objective.some(o=>o.kind==='ice')&&c.ice)score+=25;
   if(objective.some(o=>o.kind==='locks')&&c.lock)score+=30;
   if(objective.some(o=>o.kind==='chests')&&c.chest)score+=30;
   if(objective.some(o=>o.kind==='jam')&&c.jam)score+=40;
   if(c.fuse)score+=20;
  }
  ca.type=left;cb.type=right;
  if(score>bestScore){bestScore=score;best=[a,b];}
 }
 return best;
}
// Only unlocked Hammer is considered. It damages one tile (all layers);
 // extra-move, mass-clear and purchased boosters are deliberately excluded.
function emergencyHammerTarget(g){
 if(g.moves>2||g.moves<1||g.won||g.lost)return -1;
 const pending=E.objectiveState(g).filter(o=>!o.done);
 if(!pending.length)return -1;
 let best=-1,bestWeight=0;
 const typeByKind={ice:'ice',locks:'lock',chests:'chest',jam:'jam'};
 for(let i=0;i<g.cells.length;i++){
  const c=g.cells[i];if(!c||c.type===null)continue;
  let score=0;
  for(const o of pending){
   if(typeByKind[o.kind]){
    const layers=c[typeByKind[o.kind]]||0;
    if(layers)score+=100+Math.min(layers,Math.max(0,o.target-o.value))*20;
   }else if(o.kind==='collect'&&g.cfg.objectives.some(spec=>spec.kind==='collect'&&spec.color===c.type)){
    // Only an unobstructed nut counts as direct collection progress.
    if(!c.ice&&!c.lock&&!c.chest&&!c.jam&&!c.rock&&!c.ward)score+=30;
   }
  }
  if(score>bestWeight){bestWeight=score;best=i;}
 }
 return best;
}
function play(level,trial,permitHammer){
 const g=E.create(level,level*16321+trial*7093+11),initial=g.moves;
 let usedHammer=0,totalTransport=0,totalHazards=0;
 while(!g.won&&!g.lost&&g.moves>0){
  if(permitHammer&&usedHammer<MAX_HAMMERS_PER_PROBE){
   const target=emergencyHammerTarget(g);
   if(target>=0){
    const boost=E.booster(g,'hammer',target);
    if(!boost.valid)throw Error('Emergency Hammer rejected by real engine at level '+level);
    usedHammer++;
    if(g.won)break;
   }
  }
  const pair=choose(g);
  if(!pair)throw Error('No adjacent pair on playable level '+level);
  const turn=E.swap(g,...pair);
  if(!turn.valid)throw Error('Bot swap not legal at level '+level);
  totalTransport+=turn.stages.filter(x=>x.kind==='transport').length;
  totalHazards+=(turn.hazards?.expired?.length||0);
 }
 return {won:g.won,spentMoves:initial-g.moves,transports:totalTransport,
  hazards:totalHazards,hammerUsed:usedHammer};
}
function allowSparseBoosterProbe(level,trial){
 return trial===PROBE_TRIAL&&level%PROBE_EVERY===0&&level>P.LEVEL_BY_TOOL.hammer;
}

function runFullCampaign(){
for(let level=1;level<=CAMPAIGN_LEVELS;level++){
 let wins=0,totalTurns=0,totalTransport=0,totalHazards=0;
 for(let trial=0;trial<trials;trial++){
  const baseline=play(level,trial,false);
  if(baseline.won)wins++;
  totalTransport+=baseline.transports;
  totalHazards+=baseline.hazards;
  totalTurns+=baseline.spentMoves;
  if(allowSparseBoosterProbe(level,trial)){
   const assisted=play(level,trial,true);
   boosterProbes.push({level,trial,baselineWon:baseline.won,assistedWon:assisted.won,
     hammerUsed:assisted.hammerUsed,baselineSpentMoves:baseline.spentMoves,
     assistedSpentMoves:assisted.spentMoves});
  }
 }
 results.push({level,wins,trials,avgSpentMoves:+(totalTurns/trials).toFixed(1),
  transports:totalTransport,hazardDetonations:totalHazards});
}
const bands=[];
for(let start=1;start<=CAMPAIGN_LEVELS;start+=20){
 const section=results.slice(start-1,start+19);
 bands.push({levels:start+'-'+(start+19),greedyBotWinCount:section.reduce((s,r)=>s+r.wins,0),
  attempts:section.length*trials,zeroWinStages:section.filter(r=>r.wins===0).length,
  meanSpentMoves:+(section.reduce((s,r)=>s+r.avgSpentMoves,0)/section.length).toFixed(1)});
}
if(boosterProbes.length!==CAMPAIGN_LEVELS/PROBE_EVERY||
 boosterProbes.some(p=>p.hammerUsed>MAX_HAMMERS_PER_PROBE||p.hammerUsed<0||
 p.trial!==PROBE_TRIAL||p.level%PROBE_EVERY!==0))
 throw Error('Sparse emergency-booster budget violated');
if(results.length!==CAMPAIGN_LEVELS||bands.reduce((n,b)=>n+b.attempts,0)!==CAMPAIGN_LEVELS*trials)
 throw Error('Greedy diagnostic skipped authored campaign stages');
const chapters=[];
for(let start=1;start<=CAMPAIGN_LEVELS;start+=CHAPTER_LENGTH){
 const section=results.slice(start-1,start+CHAPTER_LENGTH-1);
 chapters.push({chapter:Math.floor((start-1)/CHAPTER_LENGTH)+1,
  levels:start+'-'+(start+CHAPTER_LENGTH-1),
  greedyBotWinCount:section.reduce((s,r)=>s+r.wins,0),
  attempts:section.length*trials,
  zeroWinStages:section.filter(r=>r.wins===0).length,
  totalTransports:section.reduce((s,r)=>s+r.transports,0),
  totalHazardDetonations:section.reduce((s,r)=>s+r.hazardDetonations,0)});
}
const comparison={
 kind:'SPARSE_EMERGENCY_HAMMER_PROBE_NOT_INVENTORY',
 note:'At most 1 Hammer, near defeat and only for an unfinished objective, in trial 0 of every fifth level; same seeds as the unchanged no-booster baseline. Hypothetical stock, no shop, saves or earned-inventory claims.',
 frequencyLevels:PROBE_EVERY,trial:PROBE_TRIAL,maxPerProbe:MAX_HAMMERS_PER_PROBE,
 attempts:boosterProbes.length,hammerUsed:boosterProbes.reduce((n,p)=>n+p.hammerUsed,0),
 baselineWins:boosterProbes.filter(p=>p.baselineWon).length,
 assistedWins:boosterProbes.filter(p=>p.assistedWon).length,
 chapters:Array.from({length:CAMPAIGN_LEVELS/CHAPTER_LENGTH},(_,i)=>{
  const subset=boosterProbes.filter(p=>Math.floor((p.level-1)/CHAPTER_LENGTH)===i);
  return {chapter:i+1,attempts:subset.length,hammerUsed:subset.reduce((n,p)=>n+p.hammerUsed,0),
   baselineWins:subset.filter(p=>p.baselineWon).length,
   assistedWins:subset.filter(p=>p.assistedWon).length};
 }),
 probes:boosterProbes
};
console.log(JSON.stringify({description:'Greedy baseline plus sparse emergency Hammer probe; not real human completion rates',
 campaignLevels:CAMPAIGN_LEVELS,botTrials:trials,seed:'level*16321 + trial*7093 + 11',
 chapters,bands,levels:results,boosterComparison:comparison},null,2));
}
if(require.main===module)runFullCampaign();
module.exports={choose,emergencyHammerTarget,allowSparseBoosterProbe,play};
