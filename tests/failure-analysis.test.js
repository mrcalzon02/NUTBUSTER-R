'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const {play,chooseStrategic}=require('../tools/greedy-playtest.js');
const {checkResult,summary}=require('../tools/failure-analysis.js');
const cases=[10,100,210,400,700,900,1000];
for(const level of cases){
 const run=play(level,2,false,chooseStrategic);
 const retry=play(level,2,false,chooseStrategic);
 assert.deepEqual(run,retry,'Identical level, seed and policy replay must be deterministic');
 const f=run.failure;
 assert.equal(f.won,undefined,'Diagnosis describes objective evidence without duplicating caller fields');
 assert.ok(['won','daily-moves-exhausted','engine-ended-with-wallet-remaining'].includes(f.reason));
 const x={...f,won:run.won,remainingMoves:run.remainingMoves,
  hammerUsed:run.hammerUsed,debitedMoves:run.debitedMoves,earnedRefunds:run.earnedRefunds};
 checkResult(x,E.makeLevel(level).moves,'live simulated stage '+level);
 assert.equal(f.hazardPenaltyMoves,run.debitedMoves-f.swaps);
 assert.equal(f.expiredFuses,run.hazards);
 assert.ok(f.noProgressSwaps<=f.swaps);
 assert.ok(f.objectives.length>=1,'Actual objectives are captured');
 const first=E.objectiveState(E.create(level,level*16321+2*7093+11));
 for(let i=0;i<first.length;i++){
  assert.equal(f.objectives[i].target,first[i].target);
  assert.equal(f.objectives[i].startingValue,first[i].value);
 }
}
const lost=(level,trial,withPenalty)=>{
 const objective={kind:'locks',color:null,target:10,value:2,remaining:8,completion:.2,startingValue:0};
 return {level,trial,won:false,reason:'daily-moves-exhausted',remainingMoves:0,
  hammerUsed:0,debitedMoves:12,earnedRefunds:0,swaps:withPenalty?8:12,
  hazardPenaltyMoves:withPenalty?4:0,expiredFuses:withPenalty?2:0,
  noProgressSwaps:8,startedCompleted:0,objectives:[objective]};
};
const losses=[{level:510,trial:0,noBooster:lost(510,0,true),minimalHammer:lost(510,0,false)}];
const r=summary(losses,'noBooster');
assert.equal(r.attempts,1);
assert.equal(r.wins,0);
assert.equal(r.dailyExhaustion,1);
assert.equal(r.hazardPenaltyMoves,4);
assert.equal(r.expiredFuses,2);
assert.equal(r.lostObjectiveProgressPct,20);
assert.equal(r.stalledLosses,1);
assert.deepEqual(r.unresolvedObjectiveIncidence,[{kind:'locks',count:1}]);
const invalid={...losses[0].noBooster,hazardPenaltyMoves:3};
assert.throws(()=>checkResult(invalid,12,'bad hazard charge'),/wallet or hazard accounting mismatch/);
const impossible={...losses[0].noBooster,won:true,reason:'won'};
assert.throws(()=>checkResult(impossible,12,'false victory'),/win\/objective mismatch/);
console.log('PASS: live seeded failure profiles, objective deficits, expired fuses, exact wallet debit and deterministic replay');
