'use strict';
const assert=require('node:assert/strict');
const {LEVELS,SEEDS,MAX_NODES_PER_DECISION}=require('../tools/planning-integration.js');
const {review,markdown}=require('../tools/planning-report.js');
function result(cap,won,planning=false,hammer=false){
 const swaps=won?8:cap,debitedMoves=swaps;
 return {won,dailyAllotment:cap,remainingMoves:cap-debitedMoves,
  hammerUsed:Number(hammer),debitedMoves,earnedRefunds:0,
  hazardExpirations:0,policyFallbacks:0,
  decisions:planning?swaps:0,simulatedSwaps:planning?swaps*3:0,
  maxSimulatedSwapsPerDecision:planning?3:0,predictedWins:0,
  setupChoices:0,setupCandidatesExamined:0,
  failure:{reason:won?'won':'daily-moves-exhausted',swaps,
   hazardPenaltyMoves:0,expiredFuses:0,noProgressSwaps:0,
   objectives:[{kind:'score',target:10,value:won?10:5,
    remaining:won?0:5}],startedCompleted:0}};
}
const originals=[],probes=[];
for(const level of LEVELS)for(let trial=0;trial<SEEDS;trial++){
 const goal=level===210&&trial===0;
 const x={level,trial,seed:level*16321+trial*7093+11,dailyAllotment:16,
  objective:result(16,goal),matchOnly:result(16,goal,true),planned:result(16,goal,true)};
 if(trial===0){
  x.exactOnePly=result(16,goal,true);
  x.plannedHammer=result(16,goal,true,true);
  originals.push({level,trial,strategicWon:goal,noBoosterRemainingMoves:x.objective.remainingMoves,dailyAllotment:16});
 }
 probes.push(x);
}
const source={schema:1,kind:'ENGINE_FORK_THREE_PLY_PLANNING_NO_BALANCE_CHANGES',
 strategyComparison:'MATCH_ONLY_VS_SETUP_AWARE',
 dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
 seedsPerStage:SEEDS,stages:[...LEVELS],attempts:LEVELS.length*SEEDS,
 budget:{depth:3,beam:3,actions:4,maxNodes:MAX_NODES_PER_DECISION},probes};
const original={strategicComparison:{kind:'MATCHED_SEED_OBJECTIVE_HAZARD_POLICY_NOT_HUMAN_WIN_RATE',probes:originals}};
const report=review(source,original);
assert.equal(report.overall.attempts,LEVELS.length*SEEDS);
assert.equal(report.overall.objectiveWins,1);
assert.equal(report.overall.plannedWins,1);
assert.equal(report.overall.matchOnlyWins,1);
assert.equal(report.overall.setupChoices,0);
assert.equal(report.overall.setupCandidatesExamined,0);
assert.equal(report.overall.plannedHammerWins,1);
assert.equal(report.overall.plannedSimulatedSwaps,probes.reduce((n,p)=>n+p.planned.simulatedSwaps,0));
assert.equal(report.chapters.length,10);
assert.match(markdown(report),/3-ply engine-fork/);
assert.match(markdown(report),/match-only 3-ply/);
assert.match(markdown(report),/Setup swaps selected/);
assert.match(markdown(report),/report-only/);
const edit=(index,mutate)=>{
 const changed=probes.slice();changed[index]={...probes[index]};
 mutate(changed[index]);
 return {...source,probes:changed};
};
assert.throws(()=>review({...source,budget:{...source.budget,maxNodes:1000}},original),/requires exact planned/);
assert.throws(()=>review(edit(0,x=>x.seed++),original),/original seed differs/);
assert.throws(()=>review(edit(0,x=>{x.planned={...x.planned,simulatedSwaps:x.planned.decisions*41}}),original),/incorrect real-engine wallet/);
assert.throws(()=>review(edit(0,x=>{x.matchOnly={...x.matchOnly,setupChoices:1,setupCandidatesExamined:1}}),original),/control policies illegally considered/);
assert.throws(()=>review(edit(0,x=>{x.planned={...x.planned,setupChoices:4,setupCandidatesExamined:1}}),original),/incorrect real-engine wallet/);
assert.throws(()=>review({...source,strategyComparison:'MATCH_ONLY_ONLY'},original),/requires exact planned/);
assert.throws(()=>review(edit(0,x=>{x.objective={...x.objective,won:false}}),original),/incorrect real-engine wallet/);
assert.throws(()=>review(edit(0,x=>{x.objective={...x.objective,remainingMoves:1}}),original),/incorrect real-engine wallet/);
// Alter a real losing control sample while keeping its wallet internally valid.
// The independent 1,000-level baseline must still catch the mismatch.
assert.throws(()=>review(edit(2,x=>{x.objective={...x.objective,debitedMoves:15,remainingMoves:1,failure:{...x.objective.failure,reason:'engine-ended-with-wallet-remaining',swaps:15}}}),original),/baseline policy diverged/);
console.log('PASS: fixed late-game samples, strict bounded search, exact wallet evidence, paired seed and original-bot consistency');
