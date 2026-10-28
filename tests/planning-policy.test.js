'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const D=require('../web/daily-moves.js');
const {play,chooseStrategic}=require('../tools/greedy-playtest.js');
const {forward,reverse,adoptRandom,fork,rankedMoves,rankedSetupMoves,followupPotential,advance,search}=require('../tools/planning-policy.js');
for(const state of [1,2,0x12345678,0xffffffff,0x9e3779b9,0x80000001])
 assert.equal(reverse(forward(state)),state>>>0,'Reversible xorshift state for '+state);
for(const level of [1,37,210,720,980]){
 const seed=level*16321+11,original=E.create(level,seed),instrumented=E.create(level,seed);
 adoptRandom(instrumented);
 assert.deepEqual(E.snapshot(instrumented),E.snapshot(original),'RNG reconstruction leaves game unchanged');
 for(let i=0;i<20;i++)assert.equal(instrumented.rand(),original.rand(),'No RNG sequence drift at '+level);
 const g=E.create(level,seed);
 adoptRandom(g);
 const before=JSON.stringify(E.snapshot(g));
 const priorState=g.rand.getState();
 const c=fork(g);
 assert.equal(c.rand.getState(),priorState);
 assert.equal(c.rand(),g.rand(),'Forks resume at identical random sequence');
 assert.equal(JSON.stringify(E.snapshot(g)),before,'Fork does not change real board');
 const originalState=JSON.stringify(E.snapshot(g));
 const f=fork(g);
 f.cfg.jam=999;f.progress.colors[0]=3000;
 const first=f.cells.find(x=>x);first.ice=999;
 assert.equal(JSON.stringify(E.snapshot(g)),originalState,'Deep-copy prevents branch leakage');
}
{
 const level=210,seed=level*16321+11;
 const game=E.create(level,seed),wallet=game.cfg.moves;
 const sampled=search(game,{depth:3,beam:3,actions:4,maxNodes:40});
 assert.ok(sampled.move&&E.adjacent(game,...sampled.move));
 assert.ok(sampled.expanded>0&&sampled.expanded<=40);
 assert.ok(sampled.layers<=3);
 const unchanged=JSON.stringify(E.snapshot(game));
 const repeated=search(game,{depth:3,beam:3,actions:4,maxNodes:40});
 assert.deepEqual(sampled,repeated,'Planner must be deterministic on same game and seed');
 assert.equal(JSON.stringify(E.snapshot(game)),unchanged,'Hypothetical engine swaps cannot alter the actual game');
 const ranked=rankedMoves(game,4);assert.ok(ranked.length>0&&ranked.length<=4);
 const trial=advance({game,wallet,first:null,depth:0,hazards:0,simulations:0},ranked[0],wallet);
 const actual=fork(game),bank={unlocked:level};
 assert.equal(D.ensure(bank,1700000000000,wallet).remaining,wallet);
 actual.moves=wallet;
 const result=E.swap(actual,ranked[0].a,ranked[0].b);
 assert.equal(result.valid,true);
 const debit=Math.min(wallet,1+2*(result.hazards?.expired?.length||0));
 assert.equal(D.spend(bank,debit,1700000000000,wallet),true);
 if(actual.elementalRefunds)D.topUp(bank,actual.elementalRefunds,1700000000000,wallet);
 actual.moves=D.left(bank,1700000000000,wallet);
 if(actual.elementalRefunds&&actual.moves)actual.lost=false;
 if(!actual.won&&!actual.moves)actual.lost=true;
 assert.equal(trial.wallet,actual.moves,'Hypothetical wallet matches real daily wallet');
 assert.deepEqual(E.snapshot(trial.game),E.snapshot(actual),'Hypothetical move matches real engine, not a heuristic fantasy');
 assert.equal(trial.game.rand(),actual.rand(),'RNG after cascade and gravity must be identical');
}
for(const n of [37,210]){
 const selector=g=>search(g,{depth:2,beam:2,actions:3,maxNodes:16}).move;
 const first=play(n,0,false,selector),second=play(n,0,false,selector);
 assert.deepEqual(first,second,'Full planned attempt must replay exactly');
 assert.equal(first.hammerUsed,0,'No free inventory injected by planner');
 assert.equal(first.debitedMoves-first.earnedRefunds,first.spentMoves);
 assert.equal(first.dailyAllotment,E.makeLevel(n).moves);
}
// A setup swap is a LEGAL engine move which intentionally makes no immediate
// match. Test next-turn potential and ensure the candidate screening never
// changes nut identities, the board, or future cascade randomness.
let setupChecks=0;
for(const level of [37,210,400]){
 for(const seed of [level*16321+11,level*16321+7104]){
  const g=E.create(level,seed),snapshot=JSON.stringify(E.snapshot(g));
  adoptRandom(g);
  const priorRandom=g.rand.getState();
  const first=followupPotential(g);
  const setups=rankedSetupMoves(g,2);
  assert.equal(JSON.stringify(E.snapshot(g)),snapshot,'Setup ranking cannot leave board swaps behind');
  assert.equal(g.rand.getState(),priorRandom,'Potential scanning cannot consume real RNG');
  assert.ok(first.best>=0&&setups.length<=2);
  for(const option of setups){
   assert.ok(option.setup&&option.followupMatchSize>=3);
   const trial=fork(g);
   const move=E.swap(trial,option.a,option.b);
   assert.equal(move.valid,true,'Setup must be a valid real engine move');
   assert.equal(move.loops,0,'Setup cannot secretly be an immediate scoring swap');
   assert.equal(move.removed,0,'Setup must not be counted as a scoring cascade');
   assert.deepEqual(option.setup,true);
   setupChecks++;
  }
  const a=search(g,{depth:3,beam:3,actions:4,maxNodes:40,allowSetups:true});
  const b=search(g,{depth:3,beam:3,actions:4,maxNodes:40,allowSetups:true});
  assert.deepEqual(a,b,'Seeded search including setup branches must replay');
  assert.ok(a.expanded<=40&&a.setupCandidatesExamined<=a.expanded);
  assert.equal(JSON.stringify(E.snapshot(g)),snapshot,'Searching setup branches must preserve live board');
 }
}
assert.ok(setupChecks>=1,'The chosen deterministic boards must exercise genuine nonmatching setup candidates');
assert.throws(()=>search(E.create(1,123),{depth:50}),/budget exceeds/);
assert.ok(chooseStrategic(E.create(37,42)),'Original strategy remains present');
console.log('PASS: deterministic forked RNG, branch isolation, exact engine cascades/wallet and replayable bounded planning');
