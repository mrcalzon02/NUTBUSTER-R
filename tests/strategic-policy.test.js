'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const {choose,chooseStrategic,play}=require('../tools/greedy-playtest.js');
const {evaluate,pendingObjectives}=require('../tools/strategic-policy.js');
for(const level of [1,37,210,500,777,1000]){
 const seed=level*16321+11,g=E.create(level,seed);
 const before=JSON.stringify(E.snapshot(g));
 const pair=chooseStrategic(g);
 assert.ok(pair,'The new policy must find a viable swap at stage '+level);
 assert.ok(E.adjacent(g,...pair),'A strategic choice must be an adjacent legal pair');
 assert.ok(evaluate(g,...pair,pendingObjectives(g))>0,'Strategic selection needs an actual scoring opportunity');
 assert.equal(JSON.stringify(E.snapshot(g)),before,'Policy must not change the real game board');
 const n=play(level,0,false,chooseStrategic);
 const replay=play(level,0,false,chooseStrategic);
 const assisted=play(level,0,true,chooseStrategic);
 assert.deepEqual(n,replay,'Same seed/policy/day allowance must reproduce exactly');
 assert.equal(n.hammerUsed,0,'Never leak optional Hammer into strategic baseline');
 assert.ok(assisted.hammerUsed<=1,'Hammer is still tightly capped');
 assert.equal(n.dailyAllotment,E.makeLevel(level).moves);
 assert.equal(assisted.dailyAllotment,E.makeLevel(level).moves);
 assert.equal(n.debitedMoves-n.earnedRefunds,n.spentMoves);
 assert.equal(assisted.debitedMoves-assisted.earnedRefunds,assisted.spentMoves);
}
const test=E.create(1,16432);
const p=chooseStrategic(test);
assert.ok(p&&E.adjacent(test,...p));
const goals=pendingObjectives(test);
const base=evaluate(test,...p,goals);
const i=p[0],j=p[1],a=test.cells[i],b=test.cells[j];
for(const key of ['type','special','hold','elemental']){const temp=a[key];a[key]=b[key];b[key]=temp;}
const hit=[...E.matches(test).hit];
for(const key of ['type','special','hold','elemental']){const temp=a[key];a[key]=b[key];b[key]=temp;}
assert.ok(hit.length>=3,'Expect an ordinary scoring swap on first level');
test.cells[hit[0]].fuse=1;
assert.ok(evaluate(test,...p,goals)>base,'An imminently expiring fuse should increase priority');
const before=JSON.stringify(E.snapshot(test));
for(let i=0;i<8;i++)chooseStrategic(test);
assert.equal(JSON.stringify(E.snapshot(test)),before,'Candidate evaluation must restore all movable payload');
const greedy=choose(test);
assert.ok(greedy&&E.adjacent(test,...greedy));
console.log('PASS: deterministic objective-aware same-seed policy, no mutation, special/hazard scoring and sparse Hammer budget');
