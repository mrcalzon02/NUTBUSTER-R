'use strict';
// Bounded planning evaluation on SAME live-engine boards as the greedy
// diagnostics. Does not train on or edit published levels. Entirely optional.
const E=require('../web/engine.js');
const {play,chooseStrategic}=require('./greedy-playtest.js');
const {search}=require('./planning-policy.js');
const LEVELS=Object.freeze([210,300,400,500,600,700,720,800,860,900,980,1000]);
const SEEDS=2,MAX_NODES_PER_DECISION=40;
function runOne(level,trial,policy,hammer=false){
 let decisions=0,expanded=0,maxExpanded=0,searchWinHints=0;
 const wrapped=policy==='objective'?chooseStrategic:g=>{
  const r=search(g,policy==='one-ply'?{depth:1,beam:1,actions:4,maxNodes:4}:
   {depth:3,beam:3,actions:4,maxNodes:MAX_NODES_PER_DECISION});
  decisions++;expanded+=r.expanded;maxExpanded=Math.max(maxExpanded,r.expanded);
  searchWinHints+=Number(r.wonInSearch);
  return r.move;
 };
 const result=play(level,trial,hammer,wrapped);
 return {won:result.won,dailyAllotment:result.dailyAllotment,
  remainingMoves:result.remainingMoves,hammerUsed:result.hammerUsed,
  debitedMoves:result.debitedMoves,earnedRefunds:result.earnedRefunds,
  hazardExpirations:result.hazards,policyFallbacks:result.policyFallbacks,
  decisions,simulatedSwaps:expanded,maxSimulatedSwapsPerDecision:maxExpanded,
  predictedWins:searchWinHints,failure:result.failure};
}
function run(){
 const probes=[];
 for(const level of LEVELS)for(let trial=0;trial<SEEDS;trial++){
  const objective=runOne(level,trial,'objective');
  const planned=runOne(level,trial,'three-ply');
  const probe={level,trial,seed:level*16321+trial*7093+11,
   dailyAllotment:objective.dailyAllotment,objective,planned};
  if(trial===0){
   probe.exactOnePly=runOne(level,trial,'one-ply');
   probe.plannedHammer=runOne(level,trial,'three-ply',true);
  }
  probes.push(probe);
 }
 return {schema:1,kind:'ENGINE_FORK_THREE_PLY_PLANNING_NO_BALANCE_CHANGES',
  description:'Original authored boards; exact seeded NutEngine cascades and hazard/wallet costs; bounded beam depth 3, width 3, top 4 actions, maximum 40 simulated swaps per decision. Outcome is not proof of solvability or human completion rates.',
  stages:[...LEVELS],seedsPerStage:SEEDS,attempts:probes.length,
  budget:{depth:3,beam:3,actions:4,maxNodes:MAX_NODES_PER_DECISION},
  dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
  probes};
}
if(require.main===module)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
module.exports={run,runOne,LEVELS,SEEDS,MAX_NODES_PER_DECISION};
