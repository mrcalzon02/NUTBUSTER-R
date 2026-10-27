'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const P=require('../web/progression.js');
const {choose,emergencyHammerTarget,allowSparseBoosterProbe,play}=require('../tools/greedy-playtest.js');
assert.equal(P.LEVEL_BY_TOOL.hammer,1);
assert.equal(allowSparseBoosterProbe(1,0),false);
assert.equal(allowSparseBoosterProbe(4,0),false);
assert.equal(allowSparseBoosterProbe(5,0),true);
assert.equal(allowSparseBoosterProbe(5,1),false);
assert.equal(allowSparseBoosterProbe(1000,0),true);
const g=E.create(37,37*16321+11);
const idx=g.cells.findIndex(c=>c&&c.type!==null);
assert.ok(idx>=0);
for(const c of g.cells)if(c){c.lock=0;c.ice=0;c.chest=0;c.jam=0;}
g.cfg.objectives=[{kind:'locks',target:1}];
g.progress.locks=0;
g.cells[idx].lock=2;
g.moves=3;
assert.equal(emergencyHammerTarget(g),-1,'Hammer must never fire before last two moves');
g.moves=2;
assert.equal(emergencyHammerTarget(g),idx,'Hammer must aim at an unfinished objective');
const boost=E.booster(g,'hammer',idx);
assert.equal(boost.valid,true,'Use actual game-engine Hammer logic');
assert.equal(g.uses.hammer,1);
assert.equal(g.boosterUsed,1);
assert.equal(g.progress.locks>=1,true);
assert.equal(emergencyHammerTarget(g),-1,'Finished game must not waste booster');
const clean=E.create(1,1049);
clean.moves=2;
clean.cfg.objectives=[{kind:'score',target:999999}];
assert.equal(emergencyHammerTarget(clean),-1,'No wasteful booster on score-only goals');
// Daily moves are NOT always 36: each attempt starts with the same level-
 // dependent full allowance the real gameplay UI applies to a fresh wallet.
const D=require('../web/daily-moves.js');
for(const n of [1,37,210,501,1000]){
 const cap=E.makeLevel(n).moves;
 const baseline=play(n,0,false),again=play(n,0,false),assisted=play(n,0,true);
 for(const run of [baseline,again,assisted]){
  assert.equal(run.dailyAllotment,cap,'Full daily allowance at stage '+n);
  assert.equal(run.spentMoves,cap-run.remainingMoves,'Daily wallet reconciled');
  assert.equal(run.debitedMoves-run.earnedRefunds,run.spentMoves,'Hazard charges and refunds reconcile');
  assert.ok(run.remainingMoves>=0,'No negative daily move balance');
 }
 assert.deepEqual(baseline,again,'A level attempt must not inherit any prior run\'s spent daily moves');
}
assert.notEqual(E.makeLevel(1).moves,E.makeLevel(1000).moves,'Daily allowance must remain level-dependent');
const scratch={unlocked:37};
const full=D.ensure(scratch,1700000000000,E.makeLevel(37).moves).remaining;
assert.equal(full,E.makeLevel(37).moves);
assert.equal(D.spend(scratch,1,1700000000000,full),true);
assert.equal(D.left(scratch,1700000000000,full),full-1);
assert.equal(play(37,0,false).dailyAllotment,full,'The simulator begins each independent attempt with a new allowance');

const original=play(37,0,false);
assert.equal(original.hammerUsed,0,'Baseline remains booster-free');
const emergency=play(37,0,true);
assert.ok(emergency.hammerUsed<=1,'No more than one emergency Hammer per probe');
assert.equal(typeof emergency.won,'boolean');
assert.ok(Array.isArray(choose(E.create(1,11))),'Greedy baseline retains legal move selector');
const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../tools/greedy-playtest.js'),'utf8');
assert.match(source,/PROBE_EVERY=5,PROBE_TRIAL=0,MAX_HAMMERS_PER_PROBE=1/);
assert.match(source,/boosterComparison:comparison/);
assert.match(source,/D\.ensure\(save,TEST_TIME,E\.makeLevel\(save\.unlocked\)\.moves\)/);
assert.match(source,/D\.spend\(save,used,TEST_TIME,initial\)/);
assert.doesNotMatch(source,/booster\(g,'extra'/,'Extra moves must not be granted for testing');
console.log('PASS: full fresh per-level daily allowance, hazard-wallet charges, earned refunds, isolated runs and sparse emergency Hammer');
