'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {review,markdown}=require('../tools/balance-risk-report.js');
const chapters=[],levels=[],structural=[];
for(let chapter=1;chapter<=10;chapter++){
 let wins=0,none=0,hazards=0,transports=0;
 for(let j=1;j<=100;j++){
  const level=(chapter-1)*100+j,attemptWins=chapter===1?2:chapter===2?1:0;
  const x={level,trials:2,wins:attemptWins,avgSpentMoves:13,transports:chapter>1?2:0,hazardDetonations:chapter>2?1:0};
  levels.push(x);
  wins+=attemptWins;none+=attemptWins===0;hazards+=x.hazardDetonations;transports+=x.transports;
 }
 structural.push({chapter,levels:100,averageMoves:chapter===1?28:15,averageOpenings:chapter===1?3:1.5,minOpenings:1});
 chapters.push({chapter,attempts:200,greedyBotWinCount:wins,zeroWinStages:none,totalHazardDetonations:hazards,totalTransports:transports});
}
const a={campaignLevels:1000,chapters:structural};
const probes=Array.from({length:200},(_,i)=>{
 const level=(i+1)*5,chapter=Math.floor((level-1)/100)+1;
 return {level,trial:0,baselineWon:chapter===1,assistedWon:chapter<=2,
  hammerUsed:chapter===2?1:0,dailyAllotment:36,
  baselineRemainingMoves:23,assistedRemainingMoves:23,
  baselineEarnedRefunds:0,assistedEarnedRefunds:0,
  baselineSpentMoves:13,assistedSpentMoves:13};
});
const boosterChapters=Array.from({length:10},(_,i)=>{
 const block=probes.slice(i*20,(i+1)*20);
 return {chapter:i+1,attempts:20,hammerUsed:block.reduce((n,p)=>n+p.hammerUsed,0),
  baselineWins:block.filter(p=>p.baselineWon).length,
  assistedWins:block.filter(p=>p.assistedWon).length};
});
const boosterComparison={kind:'SPARSE_EMERGENCY_HAMMER_PROBE_NOT_INVENTORY',
 dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
 attempts:200,frequencyLevels:5,trial:0,maxPerProbe:1,
 hammerUsed:20,baselineWins:20,assistedWins:40,
 chapters:boosterChapters,probes};
const strategyProbes=probes.map(p=>({
 level:p.level,trial:0,dailyAllotment:p.dailyAllotment,greedyWon:p.baselineWon,
 strategicWon:p.level<=200,strategicHammerWon:p.level<=300,
 hammerUsed:p.level>100?1:0,fallbackSwaps:0,
 noBoosterRemainingMoves:20,minimalHammerRemainingMoves:18
}));
const strategyChapters=Array.from({length:10},(_,i)=>{
 const slice=strategyProbes.slice(i*20,(i+1)*20);
 return {chapter:i+1,attempts:20,greedyWins:slice.filter(p=>p.greedyWon).length,
  strategicWins:slice.filter(p=>p.strategicWon).length,
  strategicHammerWins:slice.filter(p=>p.strategicHammerWon).length,
  hammerUsed:slice.reduce((n,p)=>n+p.hammerUsed,0),fallbackSwaps:0};
});
const strategicComparison={
 kind:'MATCHED_SEED_OBJECTIVE_HAZARD_POLICY_NOT_HUMAN_WIN_RATE',
 description:'Synthetic single-turn goal-aware policy; not human success.',
 dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
 attempts:200,levelsPerProbe:5,trial:0,greedyWins:20,
 strategicWins:40,strategicHammerWins:60,hammerUsed:180,fallbackSwaps:0,
 chapters:strategyChapters,probes:strategyProbes
};
const failureProbes=Array.from({length:300},(_,i)=>{
 const level=(Math.floor(i/3)+1)*10,trial=i%3;
 const matching=strategyProbes.find(p=>p.level===level);
 const attempt=(won,hammerUsed)=>{
  const spent=won?12:36,swaps=won?10:30,remainingMoves=36-spent;
  const value=won?100:50;
  return {won,reason:won?'won':'daily-moves-exhausted',
   remainingMoves,hammerUsed,debitedMoves:spent,earnedRefunds:0,
   swaps,hazardPenaltyMoves:spent-swaps,expiredFuses:won?1:3,noProgressSwaps:won?0:20,
   startedCompleted:0,
   objectives:[{kind:'score',color:null,target:100,value,remaining:100-value,
    completion:value/100,startingValue:0}]};
 };
 return {level,trial,dailyAllotment:36,
  noBooster:attempt(trial===0?matching.strategicWon:false,0),
  minimalHammer:attempt(trial===0?matching.strategicHammerWon:false,trial===0?matching.hammerUsed:1)};
});
const failureAnalysis={kind:'DETAILED_FAILURE_CAUSE_SAMPLED_NOT_SOLVABILITY_PROOF',
 description:'Three seeded boards on each 10th stage, no purchased boosters.',
 sampledLevels:100,seedsPerLevel:3,attempts:300,chapterSize:100,
 dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',probes:failureProbes};
const b={campaignLevels:1000,botTrials:2,levels,chapters,boosterComparison,strategicComparison,failureAnalysis,
 dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
 dailyAllowanceRule:'Each attempt begins with NutDailyMoves.ensure and a full level-specific daily allowance.'};
const result=review(a,b);
assert.equal(result.stages,1000);
assert.equal(result.dailyAllowanceModel,'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET');
assert.equal(result.attempts,2000);
assert.equal(result.botWins,300);
assert.equal(result.zeroWinStages,800);
assert.equal(result.botWinPercent,15);
assert.equal(result.firstZeroWinStage,201);
assert.equal(result.lastBotWinStage,200);
assert.deepEqual(result.topZeroWinStreaks[0],{start:201,end:1000,count:800,hazards:800});
assert.equal(result.chapters[0].reviewFlag,'BASELINE');
assert.equal(result.chapters[1].reviewFlag,'ELEVATED_BOT_DIFFICULTY');
assert.equal(result.chapters[9].reviewFlag,'EXTREME_BOT_DIFFICULTY');
assert.equal(result.chapters[9].hazardDetonations,100);
assert.equal(result.lowOpeningChapters.length,9);
assert.equal(result.minimalBoosterComparison.attempts,200);
assert.equal(result.minimalBoosterComparison.hammerUsed,20);
assert.equal(result.minimalBoosterComparison.baselineWins,20);
assert.equal(result.minimalBoosterComparison.assistedWins,40);
assert.equal(result.objectiveAwareComparison.attempts,200);
assert.equal(result.objectiveAwareComparison.greedyWins,20);
assert.equal(result.objectiveAwareComparison.objectiveAwareWins,40);
assert.equal(result.objectiveAwareComparison.objectiveAwareHammerWins,60);
assert.equal(result.objectiveAwareComparison.actualHammerUses,180);
assert.equal(result.objectiveAwareComparison.policyFallbackSwaps,0);
assert.equal(result.failureCauses.attemptsPerMode,300);
assert.equal(result.failureCauses.sampledLevels,100);
assert.equal(result.failureCauses.seedsPerLevel,3);
assert.equal(result.failureCauses.chapters.length,10);
assert.equal(result.failureCauses.noBooster.wins,40);
assert.equal(result.failureCauses.minimalHammer.wins,60);
assert.equal(result.failureCauses.noBooster.dailyExhaustion,260);
assert.equal(result.failureCauses.noBooster.hazardPenaltyMoves,40*2+260*6);
const summary=markdown(result);
assert.match(summary,/heuristic bot, not player win rate/);
assert.match(summary,/300 \/ 2000 greedy-bot wins/);
assert.match(summary,/report-only/);
assert.match(summary,/201–1000/);
assert.match(summary,/Sparse booster comparison/);
assert.match(summary,/Objective-aware paired simulation/);
assert.match(summary,/Why the sampled objective-aware player loses/);
assert.match(summary,/Exhausted daily moves \(no booster\)/);
assert.match(summary,/objective-aware 40/);
assert.match(summary,/Each simulated level starts with its own full/);
assert.match(summary,/No-booster matched-seed wins: 20; emergency-Hammer wins: 40/);
assert.throws(()=>review({...a,campaignLevels:500},b),/full 1,000-level structural/);
assert.throws(()=>review(a,{...b,levels:levels.slice(0,999)}),/full two-trial 1,000-level/);
const edited=levels.slice();
edited[100]={...edited[100],wins:3};
assert.throws(()=>review(a,{...b,levels:edited}),/invalid gameplay sample/);
const badChapters=chapters.map(x=>({...x}));
badChapters[9].greedyBotWinCount=20;
assert.throws(()=>review(a,{...b,chapters:badChapters}),/bot chapter aggregation mismatch/);
assert.throws(()=>review(a,{...b,dailyAllowanceModel:'REUSED_BALANCE'}),/full daily-wallet allotment/);
assert.throws(()=>review(a,{...b,failureAnalysis:undefined}),/requires 100 levels with three seeds/);
const badCauses=failureProbes.slice();
badCauses[0]={...badCauses[0],noBooster:{...badCauses[0].noBooster,hazardPenaltyMoves:99}};
assert.throws(()=>review(a,{...b,failureAnalysis:{...failureAnalysis,probes:badCauses}}),/wallet or hazard accounting mismatch/);
const badStrategy=strategyProbes.slice();
badStrategy[0]={...badStrategy[0],hammerUsed:2};
assert.throws(()=>review(a,{...b,strategicComparison:{...strategicComparison,probes:badStrategy}}),/invalid objective-aware matched-seed/);
assert.throws(()=>review(a,{...b,strategicComparison:undefined}),/requires 200 matched-seed objective-aware/);
const corruptedProbes=probes.slice();
corruptedProbes[0]={...probes[0],hammerUsed:2};
assert.throws(()=>review(a,{...b,boosterComparison:{...boosterComparison,probes:corruptedProbes}}),/invalid scarce-booster probe/);
assert.throws(()=>review(a,{...b,boosterComparison:undefined}),/requires 200 matched-seed/);
const flow=fs.readFileSync(path.join(__dirname,'../.github/workflows/build-and-release.yml'),'utf8');
assert.match(flow,/node tools\/balance-risk-report\.js/);
assert.match(flow,/nutbuster-balance-risk\.json/);
const diag=fs.readFileSync(path.join(__dirname,'diagnostic-suites.txt'),'utf8');
assert.match(diag,/^balance-risk-report\.test\.js$/m);
console.log('PASS: 1,000-stage, 2,000-attempt nonblocking balance-risk report contract and evidence validation');
