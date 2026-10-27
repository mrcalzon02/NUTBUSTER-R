/* Automated difficulty probe, NOT a prediction of real player win rates.
   Preserve the two-seed no-booster baseline. On one seed at every fifth
   level, repeat the same board with AT MOST ONE emergency Hammer near
   defeat. This is a sparse hypothetical test budget, NOT an earned-inventory
   or human completion-rate model. Never give free boosters to game saves. */
const E=require('../web/engine.js');
const P=require('../web/progression.js');
const D=require('../web/daily-moves.js');
const {chooseStrategic}=require('./strategic-policy.js');
const TEST_TIME=1700000000000; // Fixed instant: tests never cross a real reset boundary.
const CAMPAIGN_LEVELS=1000,CHAPTER_LENGTH=100;
const trials=2,results=[],boosterProbes=[],strategicProbes=[],failureProbes=[];
const FAILURE_SAMPLE_STEP=10,FAILURE_TRIALS=3;
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
// Give EVERY attempt its own fresh, full, level-specific daily move wallet.
// In the live game the cap is E.makeLevel(saved.unlocked).moves, not a flat 36.
// A fixed timestamp prevents the simulator from ever granting mid-run refills.
function play(level,trial,permitHammer,strategy=choose){
 const g=E.create(level,level*16321+trial*7093+11);
 const save={unlocked:level};
 const initial=D.ensure(save,TEST_TIME,E.makeLevel(save.unlocked).moves).remaining;
 if(initial!==g.cfg.moves)throw Error('Level-specific daily allowance diverged at '+level);
 g.moves=initial;
 const startingObjectives=E.objectiveState(g);
 let usedHammer=0,totalTransport=0,totalHazards=0,debitedMoves=0,earnedRefunds=0,policyFallbacks=0;
 let swaps=0,hazardPenaltyMoves=0,noProgressSwaps=0;
 const startingDone=startingObjectives.filter(o=>o.done).length;
 function creditEarned(previous){
  const earned=Math.max(0,(g.elementalRefunds||0)-previous);
  if(earned)D.topUp(save,earned,TEST_TIME,initial);
  earnedRefunds+=earned;
  g.moves=D.left(save,TEST_TIME,initial);
  if(earned&&g.moves)g.lost=false;
 }
 while(!g.won&&!g.lost&&D.left(save,TEST_TIME,initial)>0){
  g.moves=D.left(save,TEST_TIME,initial);
  if(permitHammer&&usedHammer<MAX_HAMMERS_PER_PROBE){
   const target=emergencyHammerTarget(g);
   if(target>=0){
    const prior=g.elementalRefunds||0;
    const boost=E.booster(g,'hammer',target);
    if(!boost.valid)throw Error('Emergency Hammer rejected by real engine at level '+level);
    usedHammer++;
    creditEarned(prior);
    if(g.won)break;
   }
  }
  const ranked=strategy(g);
  const pair=ranked||choose(g);
  if(!ranked&&strategy!==choose)policyFallbacks++;
  const objectiveBefore=E.objectiveState(g);
  if(!pair)throw Error('No adjacent pair on playable level '+level);
  const prior=g.elementalRefunds||0;
  const turn=E.swap(g,...pair);
  if(!turn.valid)throw Error('Bot swap not legal at level '+level);
  // Mirror game.js doSwap: 1 move + 2 per expired hazard, capped by
  // the current wallet; elemental moves are credited AFTER the debit.
  const used=Math.min(D.left(save,TEST_TIME,initial),
   1+2*(turn.hazards?.expired?.length||0));
  swaps++;
  hazardPenaltyMoves+=used-1;
  if(!D.spend(save,used,TEST_TIME,initial))
   throw Error('Daily wallet rejected move debit at '+level);
  debitedMoves+=used;
  creditEarned(prior);
  const objectiveAfter=E.objectiveState(g);
  if(!objectiveAfter.some((o,i)=>o.value>objectiveBefore[i].value))noProgressSwaps++;
  if(!g.won&&!g.moves)g.lost=true;
  totalTransport+=turn.stages.filter(x=>x.kind==='transport').length;
  totalHazards+=(turn.hazards?.expired?.length||0);
 }
 return {won:g.won,spentMoves:initial-g.moves,transports:totalTransport,
  hazards:totalHazards,hammerUsed:usedHammer,dailyAllotment:initial,
  remainingMoves:D.left(save,TEST_TIME,initial),debitedMoves,earnedRefunds,policyFallbacks,
  failure:{
   reason:g.won?'won':D.left(save,TEST_TIME,initial)===0?'daily-moves-exhausted':g.lost?'engine-ended-with-wallet-remaining':'unexpected-stop',
   swaps,hazardPenaltyMoves,expiredFuses:totalHazards,noProgressSwaps,
   objectives:E.objectiveState(g).map((o,i)=>({
    kind:o.kind,color:g.cfg.objectives[i].color??null,target:o.target,
    value:o.value,remaining:Math.max(0,o.target-o.value),
    completion:o.target>0?Math.min(1,o.value/o.target):1,
    startingValue:startingObjectives[i].value
   })),
   startedCompleted:startingDone
  }
 };
}
function allowSparseBoosterProbe(level,trial){
 return trial===PROBE_TRIAL&&level%PROBE_EVERY===0&&level>P.LEVEL_BY_TOOL.hammer;
}

function runFullCampaign(){
for(let level=1;level<=CAMPAIGN_LEVELS;level++){
 if(level%FAILURE_SAMPLE_STEP===0){
  for(let trial=0;trial<FAILURE_TRIALS;trial++){
   const noBooster=play(level,trial,false,chooseStrategic);
   const minimalHammer=play(level,trial,true,chooseStrategic);
   failureProbes.push({level,trial,
    dailyAllotment:noBooster.dailyAllotment,
    noBooster:{won:noBooster.won,remainingMoves:noBooster.remainingMoves,
     hammerUsed:noBooster.hammerUsed,debitedMoves:noBooster.debitedMoves,
     earnedRefunds:noBooster.earnedRefunds,
     ...noBooster.failure},
    minimalHammer:{won:minimalHammer.won,remainingMoves:minimalHammer.remainingMoves,
     hammerUsed:minimalHammer.hammerUsed,debitedMoves:minimalHammer.debitedMoves,
     earnedRefunds:minimalHammer.earnedRefunds,
     ...minimalHammer.failure}});
  }
 }
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
     assistedSpentMoves:assisted.spentMoves,
     dailyAllotment:baseline.dailyAllotment,
     baselineRemainingMoves:baseline.remainingMoves,assistedRemainingMoves:assisted.remainingMoves,
     baselineEarnedRefunds:baseline.earnedRefunds,assistedEarnedRefunds:assisted.earnedRefunds});
   // Independent same-seed, full-daily-allotment objective-aware player.
   // Baseline, strategic and scarce-booster outcomes remain separate.
   const strategic=play(level,trial,false,chooseStrategic);
   const strategicHammer=play(level,trial,true,chooseStrategic);
   strategicProbes.push({level,trial,dailyAllotment:strategic.dailyAllotment,
     greedyWon:baseline.won,strategicWon:strategic.won,
     strategicHammerWon:strategicHammer.won,
     hammerUsed:strategicHammer.hammerUsed,
     fallbackSwaps:strategic.policyFallbacks+strategicHammer.policyFallbacks,
     noBoosterRemainingMoves:strategic.remainingMoves,
     minimalHammerRemainingMoves:strategicHammer.remainingMoves});
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
if(strategicProbes.length!==CAMPAIGN_LEVELS/PROBE_EVERY||
 strategicProbes.some((p,i)=>p.level!==(i+1)*PROBE_EVERY||p.trial!==0||
 p.hammerUsed<0||p.hammerUsed>1||p.fallbackSwaps<0))
 throw Error('Objective-aware matched-seed probe budget violated');
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
if(failureProbes.length!==CAMPAIGN_LEVELS/FAILURE_SAMPLE_STEP*FAILURE_TRIALS||
 failureProbes.some((p,i)=>p.level!==(Math.floor(i/FAILURE_TRIALS)+1)*FAILURE_SAMPLE_STEP||
  p.trial!==i%FAILURE_TRIALS||p.noBooster.hammerUsed!==0||p.minimalHammer.hammerUsed>1||
  p.noBooster.hazardPenaltyMoves<0||p.minimalHammer.hazardPenaltyMoves<0))
 throw Error('Expanded failure-cause probe budget or daily accounting violated');
const failureAnalysis={
 kind:'DETAILED_FAILURE_CAUSE_SAMPLED_NOT_SOLVABILITY_PROOF',
 description:'100 levels spaced every ten stages, three deterministic board seeds per level; objective-aware player with zero vs at most one hypothetical emergency Hammer. Fresh daily allowance per independent attempt. No purchased items or new game rules.',
 sampledLevels:CAMPAIGN_LEVELS/FAILURE_SAMPLE_STEP,
 seedsPerLevel:FAILURE_TRIALS,attempts:failureProbes.length,
 chapterSize:CHAPTER_LENGTH,
 dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
 probes:failureProbes
};
const strategicComparison={
 kind:'MATCHED_SEED_OBJECTIVE_HAZARD_POLICY_NOT_HUMAN_WIN_RATE',
 description:'One-turn match, objective, specials and imminent-fuse aware ranker; no exhaustive search or human completion-rate inference. 200 matched seeds, full isolated daily wallets and an optional maximum one emergency Hammer.',
 attempts:strategicProbes.length,
 levelsPerProbe:PROBE_EVERY,
 trial:PROBE_TRIAL,
 dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
 greedyWins:strategicProbes.filter(p=>p.greedyWon).length,
 strategicWins:strategicProbes.filter(p=>p.strategicWon).length,
 strategicHammerWins:strategicProbes.filter(p=>p.strategicHammerWon).length,
 hammerUsed:strategicProbes.reduce((n,p)=>n+p.hammerUsed,0),
 fallbackSwaps:strategicProbes.reduce((n,p)=>n+p.fallbackSwaps,0),
 chapters:Array.from({length:CAMPAIGN_LEVELS/CHAPTER_LENGTH},(_,i)=>{
  const subset=strategicProbes.slice(i*CHAPTER_LENGTH/PROBE_EVERY,(i+1)*CHAPTER_LENGTH/PROBE_EVERY);
  return {chapter:i+1,attempts:subset.length,greedyWins:subset.filter(p=>p.greedyWon).length,
   strategicWins:subset.filter(p=>p.strategicWon).length,
   strategicHammerWins:subset.filter(p=>p.strategicHammerWon).length,
   hammerUsed:subset.reduce((n,p)=>n+p.hammerUsed,0),
   fallbackSwaps:subset.reduce((n,p)=>n+p.fallbackSwaps,0)};
 }),
 probes:strategicProbes
};
const comparison={
 kind:'SPARSE_EMERGENCY_HAMMER_PROBE_NOT_INVENTORY',
 dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
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
 dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
 dailyAllowanceRule:'Each attempt begins with NutDailyMoves.ensure for the attempted level; spent moves, expired-fuse penalties and earned elemental refunds mirror game.js; no carryover or purchased moves.',
 chapters,bands,levels:results,boosterComparison:comparison,
 strategicComparison,failureAnalysis},null,2));
}
if(require.main===module)runFullCampaign();
module.exports={choose,chooseStrategic,emergencyHammerTarget,allowSparseBoosterProbe,play};
