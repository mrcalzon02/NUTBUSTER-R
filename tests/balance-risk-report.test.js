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
const b={campaignLevels:1000,botTrials:2,levels,chapters,boosterComparison,
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
const summary=markdown(result);
assert.match(summary,/heuristic bot, not player win rate/);
assert.match(summary,/300 \/ 2000 greedy-bot wins/);
assert.match(summary,/report-only/);
assert.match(summary,/201–1000/);
assert.match(summary,/Sparse booster comparison/);
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
