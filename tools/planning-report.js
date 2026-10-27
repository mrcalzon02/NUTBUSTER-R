#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const {LEVELS,SEEDS,MAX_NODES_PER_DECISION}=require('./planning-integration.js');
function check(ok,msg){if(!ok)throw Error('Planning integration: '+msg);}
function validResult(r,cap,label,max){
 check(r&&typeof r.won==='boolean'&&r.dailyAllotment===cap&&
  Number.isInteger(r.remainingMoves)&&r.remainingMoves>=0&&
  Number.isInteger(r.debitedMoves)&&r.debitedMoves>=0&&
  Number.isInteger(r.earnedRefunds)&&r.earnedRefunds>=0&&
  cap+r.earnedRefunds-r.debitedMoves===r.remainingMoves&&
  Number.isInteger(r.hammerUsed)&&r.hammerUsed>=0&&r.hammerUsed<=max&&
  Number.isInteger(r.policyFallbacks)&&r.policyFallbacks>=0&&
  Number.isInteger(r.hazardExpirations)&&r.hazardExpirations>=0&&
  Number.isInteger(r.decisions)&&r.decisions>=0&&
  Number.isInteger(r.simulatedSwaps)&&r.simulatedSwaps>=0&&
  Number.isInteger(r.maxSimulatedSwapsPerDecision)&&r.maxSimulatedSwapsPerDecision>=0&&
  r.simulatedSwaps<=r.decisions*MAX_NODES_PER_DECISION&&
  r.maxSimulatedSwapsPerDecision<=MAX_NODES_PER_DECISION&&
  Number.isInteger(r.predictedWins)&&r.predictedWins>=0&&r.predictedWins<=r.decisions&&
  r.failure&&r.failure.reason===(r.won?'won':r.remainingMoves===0?'daily-moves-exhausted':'engine-ended-with-wallet-remaining')&&
  r.failure.hazardPenaltyMoves===r.debitedMoves-r.failure.swaps&&
  r.failure.expiredFuses===r.hazardExpirations&&
  r.failure.objectives.length>=1&&
  r.won===r.failure.objectives.every(o=>o.remaining===0),
  'incorrect real-engine wallet, evidence or search budget for '+label);
}
function review(raw,base){
 check(raw&&raw.schema===1&&raw.kind==='ENGINE_FORK_THREE_PLY_PLANNING_NO_BALANCE_CHANGES'&&
  raw.dailyAllowanceModel==='FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET'&&
  raw.seedsPerStage===SEEDS&&raw.attempts===LEVELS.length*SEEDS&&
  JSON.stringify(raw.stages)===JSON.stringify(LEVELS)&&
  raw.budget?.depth===3&&raw.budget?.beam===3&&raw.budget?.actions===4&&
  raw.budget?.maxNodes===MAX_NODES_PER_DECISION&&
  Array.isArray(raw.probes)&&raw.probes.length===raw.attempts,
  'requires exact planned live-engine matched-seed evidence');
 check(base&&base.strategicComparison?.kind==='MATCHED_SEED_OBJECTIVE_HAZARD_POLICY_NOT_HUMAN_WIN_RATE'&&
  Array.isArray(base.strategicComparison.probes),'original comparison must be retained for paired validation');
 const original=new Map(base.strategicComparison.probes.map(p=>[p.level,p]));
 for(let i=0;i<raw.probes.length;i++){
  const x=raw.probes[i],level=LEVELS[Math.floor(i/SEEDS)],trial=i%SEEDS;
  check(x.level===level&&x.trial===trial&&
   x.seed===level*16321+trial*7093+11&&
   Number.isInteger(x.dailyAllotment)&&x.dailyAllotment>=12&&x.dailyAllotment<=36,
   'sample stage or original seed differs at index '+i);
  validResult(x.objective,x.dailyAllotment,level+'/'+trial+' objective',0);
  validResult(x.planned,x.dailyAllotment,level+'/'+trial+' planned',0);
  check(x.objective.decisions===0&&x.objective.simulatedSwaps===0,
   'baseline used search without authorization');
  if(trial===0){
   validResult(x.exactOnePly,x.dailyAllotment,level+'/0 exact',0);
   validResult(x.plannedHammer,x.dailyAllotment,level+'/0 Hammer',1);
   const b=original.get(level);
   check(b&&b.strategicWon===x.objective.won&&
    b.noBoosterRemainingMoves===x.objective.remainingMoves&&
    b.dailyAllotment===x.dailyAllotment,
    'baseline policy diverged from existing campaign evidence at '+level);
  }else check(x.exactOnePly===undefined&&x.plannedHammer===undefined,
   'extra policy sample outside fixed budget at '+level);
 }
 const count=(a,k)=>a.filter(x=>x[k]?.won).length;
 const progress=(a,k)=>{
  const losses=a.filter(x=>!x[k].won);
  return losses.length?+(100*losses.reduce((s,p)=>s+p[k].failure.objectives.reduce((q,o)=>
   q+(o.target>0?Math.min(1,o.value/o.target):1),0)/p[k].failure.objectives.length,0)/losses.length).toFixed(1):null;
 };
 const aggregate=a=>({
  attempts:a.length,objectiveWins:count(a,'objective'),plannedWins:count(a,'planned'),
  exactOnePlyWins:count(a.filter(x=>x.trial===0),'exactOnePly'),
  plannedHammerWins:count(a.filter(x=>x.trial===0),'plannedHammer'),
  hammerUsed:a.filter(x=>x.trial===0).reduce((s,x)=>s+x.plannedHammer.hammerUsed,0),
  plannedSimulatedSwaps:a.reduce((s,x)=>s+x.planned.simulatedSwaps,0),
  plannedHazards:a.reduce((s,x)=>s+x.planned.failure.hazardPenaltyMoves,0),
  objectiveHazards:a.reduce((s,x)=>s+x.objective.failure.hazardPenaltyMoves,0),
  objectiveLossProgressPct:progress(a,'objective'),
  plannedLossProgressPct:progress(a,'planned'),
  plannedFallbacks:a.reduce((s,x)=>s+x.planned.policyFallbacks,0)
 });
 const chapters=Array.from({length:10},(_,n)=>{
  const a=raw.probes.filter(x=>Math.floor((x.level-1)/100)===n);
  return {chapter:n+1,levels:a.map(x=>x.level).filter((x,i,arr)=>arr.indexOf(x)===i),...aggregate(a)};
 });
 return {kind:raw.kind,limitations:'Bounded depth-three stochastic-engine search on published deterministic seeds; not a proof of impossibility, globally optimal play, trained AI, or human performance.',
  fixedLevels:raw.stages,seedsPerStage:SEEDS,budget:raw.budget,overall:aggregate(raw.probes),chapters};
}
function markdown(r){
 let t='\n### Bounded 3-ply engine-fork AI planning comparison (report-only)\n\n';
 t+='**Matched samples:** '+r.fixedLevels.join(', ')+'; '+r.seedsPerStage+' seeds per level. Exact live engine with cascade RNG, fuse debit, objective scoring, and fresh daily wallets.\n\n';
 const x=r.overall;
 t+='**Results:** objective-aware '+x.objectiveWins+'/'+x.attempts+
  ' wins; 3-ply planner '+x.plannedWins+'/'+x.attempts+
  '; exact one-ply '+x.exactOnePlyWins+'/'+r.fixedLevels.length+
  '; planner with one emergency Hammer '+x.plannedHammerWins+'/'+r.fixedLevels.length+
  ' ('+x.hammerUsed+' actual Hammers). '+x.plannedSimulatedSwaps+
  ' real-engine hypothetical swaps, strict per-decision search cap '+r.budget.maxNodes+'.\n\n';
 t+='| Chapter | Tested stages | One-ply objective wins | Three-ply wins | Goal progress on losses: objective vs planner | Fuse penalty moves: objective vs planner |\n|---|---|---:|---:|---|---|\n';
 for(const c of r.chapters){if(!c.attempts)continue;
  t+='| '+c.chapter+' | '+c.levels.join(', ')+' | '+c.objectiveWins+'/'+c.attempts+
   ' | '+c.plannedWins+'/'+c.attempts+' | '+c.objectiveLossProgressPct+'% vs '+
   c.plannedLossProgressPct+'% | '+c.objectiveHazards+' vs '+c.plannedHazards+' |\n';
 }
 t+='\nPlanner outcomes can be worse as well as better; a three-turn bounded search does **not** demonstrate level solvability or authorize balance reductions.\n';
 return t;
}
if(require.main===module){
 try{
  const [,,probePath,baselinePath,resultPath]=process.argv;
  check(probePath&&baselinePath&&resultPath,'usage: planning-report.js planning.json greedy.json summary.json');
  const result=review(JSON.parse(fs.readFileSync(probePath,'utf8')),JSON.parse(fs.readFileSync(baselinePath,'utf8')));
  fs.writeFileSync(resultPath,JSON.stringify(result,null,2)+'\n');
  const report=markdown(result);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
  process.stdout.write(report);
 }catch(err){console.error(err.message);process.exitCode=1;}
}
module.exports={review,markdown,validResult};
