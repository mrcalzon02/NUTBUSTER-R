'use strict';
// Bounded planning evaluation on SAME live-engine boards as the greedy
// diagnostics. Does not train on or edit published levels. Entirely optional.
const E=require('../web/engine.js');
const {play,chooseStrategic}=require('./greedy-playtest.js');
const {search}=require('./planning-policy.js');
const LEVELS=Object.freeze([210,300,400,500,600,700,720,800,860,900,980,1000]);
const SEEDS=2,MAX_NODES_PER_DECISION=40;
function runOne(level,trial,policy,hammer=false){
 let decisions=0,expanded=0,maxExpanded=0,searchWinHints=0,setupChoices=0,setupCandidatesExamined=0;
 const wrapped=policy==='objective'?chooseStrategic:g=>{
  const r=search(g,policy==='one-ply'?{depth:1,beam:1,actions:4,maxNodes:4}:
   {depth:3,beam:3,actions:4,maxNodes:MAX_NODES_PER_DECISION,
    allowSetups:policy==='three-ply'});
  decisions++;expanded+=r.expanded;maxExpanded=Math.max(maxExpanded,r.expanded);
  searchWinHints+=Number(r.wonInSearch);
  setupChoices+=Number(r.setupSelected);
  setupCandidatesExamined+=r.setupCandidatesExamined;
  return r.move;
 };
 const result=play(level,trial,hammer,wrapped);
 return {won:result.won,dailyAllotment:result.dailyAllotment,
  remainingMoves:result.remainingMoves,hammerUsed:result.hammerUsed,
  debitedMoves:result.debitedMoves,earnedRefunds:result.earnedRefunds,
  hazardExpirations:result.hazards,policyFallbacks:result.policyFallbacks,
  decisions,simulatedSwaps:expanded,maxSimulatedSwapsPerDecision:maxExpanded,
  predictedWins:searchWinHints,setupChoices,setupCandidatesExamined,
  failure:result.failure};
}
function run(){
 const probes=[];
 for(const level of LEVELS)for(let trial=0;trial<SEEDS;trial++){
  const objective=runOne(level,trial,'objective');
  const matchOnly=runOne(level,trial,'match-only');
  const planned=runOne(level,trial,'three-ply');
  const probe={level,trial,seed:level*16321+trial*7093+11,
   dailyAllotment:objective.dailyAllotment,objective,matchOnly,planned};
  if(trial===0){
   probe.exactOnePly=runOne(level,trial,'one-ply');
   probe.plannedHammer=runOne(level,trial,'three-ply',true);
  }
  probes.push(probe);
 }
 return {schema:1,kind:'ENGINE_FORK_THREE_PLY_PLANNING_NO_BALANCE_CHANGES',
  description:'Matched exact-engine three-ply strategies with and without legal nonmatching setup swaps, original objective-aware bot and a one-Hammer control. No altered authored goals, moves or booster inventory. Neither success nor failure predicts human skill.',
  strategyComparison:'MATCH_ONLY_VS_SETUP_AWARE',
  stages:[...LEVELS],seedsPerStage:SEEDS,attempts:probes.length,
  budget:{depth:3,beam:3,actions:4,maxNodes:MAX_NODES_PER_DECISION},
  dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
  probes};
}
if(require.main===module)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
module.exports={run,runOne,LEVELS,SEEDS,MAX_NODES_PER_DECISION};
