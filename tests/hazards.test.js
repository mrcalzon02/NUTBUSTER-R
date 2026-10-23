const assert=require('node:assert/strict'),E=require('../web/engine.js');
const L=require('../web/level-design.js');
for(const n of [1,50,100,109]){
 const g=E.create(n,n*811);
 assert.equal(g.cfg.jam,0,'Sticky butter cannot appear before factory introduction');
 assert.equal(g.cfg.bombs,0,'Timed acorns cannot appear before Highlands');
}
const factory=E.create(110,8008),copy=E.create(110,8008);
assert.deepEqual(E.snapshot(factory),E.snapshot(copy),'Hazard starts use seeded RNG');
assert.equal(factory.cfg.design.kind,'jam');
assert.equal(factory.cfg.objectives[0].kind,'jam');
assert.ok(factory.cells.filter(c=>c&&c.jam).length>=3);
// Isolate butter spreading: independent fire auras may consume the initial jam.
for(const c of factory.cells)if(c){c.aura=null;c.auraTurns=0;c.poison=0;}
const initialJam=factory.cells.filter(c=>c&&c.jam).length;
for(let n=0;n<3;n++){
 const r=E.advanceHazards(factory,{valid:true,won:false,lost:false,stages:[]});
 assert.equal(r.valid,true);
}
assert.equal(factory.turns,3);
assert.ok(factory.cells.filter(c=>c&&c.jam).length>initialJam,
 'Sticky butter must actually spread after third player move');
assert.ok(factory.cells.every((c,i)=>!!c===!!factory.cfg.mask[i]),
 'Hazard spread must never create cells in holes');
{
 const g=E.create(111,400),before=g.progress.jam,target=g.cells.findIndex(c=>c&&c.jam);
 const r=E.booster(g,'hammer',target);
 assert.equal(r.valid,true);
 assert.ok(g.progress.jam>before,'Hammer can clear sticky butter');
}
const early=E.create(200,9933);
assert.equal(early.cfg.bombs,0,'Chapter 2 introduces no ticking acorns');
const bombs=E.create(210,210123),bombsCopy=E.create(210,210123);
assert.deepEqual(E.snapshot(bombs),E.snapshot(bombsCopy));
assert.ok(bombs.cfg.bombs>=2);
assert.ok(bombs.cells.filter(c=>c&&c.fuse>0).length>=2);
const bombCount=bombs.cells.filter(c=>c&&c.fuse).length,turns=bombs.cfg.fuseTurns;
const startingMoves=bombs.moves;
let detonations=0;
for(let n=0;n<turns;n++){
 const result=E.advanceHazards(bombs,{valid:true,won:false,lost:false,stages:[]});
 detonations+=result.hazards?.expired?.length||0;
 assert.ok(result.stages.some(st=>st.kind==='hazard'),'Countdown changes must be visible');
}
assert.equal(detonations,bombCount,'Each timed acorn must detonate exactly once');
assert.equal(bombs.moves,startingMoves-2*bombCount,'Acorn penalty applies once per explosion');
assert.ok(bombs.cells.every(c=>!c||c.fuse===0));
assert.equal(bombs.turns,turns);
{
 const g=E.create(211,600),i=g.cells.findIndex(c=>c&&c.fuse);
 const outcome=E.booster(g,'hammer',i);
 assert.equal(outcome.valid,true);
 assert.ok(g.progress.bombs>0,'Direct tool defuses the timed hazard');
 assert.equal(g.cells[i].fuse,0,'Defused acorn cannot detonate after removal');
}
{
 const g=E.create(145,777),locked=g.cells.findIndex(c=>c&&c.lock>0);
 assert.ok(locked>=0);
 g.cells[locked].jam=1;
 const keys=E.booster(g,'unlock',-1);
 assert.equal(keys.valid,true);
 assert.equal(g.cells[locked].lock,0,'Master Key bypasses outer butter');
}
const higher=E.makeLevel(500);
assert.ok(higher.bombs>=E.makeLevel(210).bombs);
assert.ok(higher.fuseTurns<E.makeLevel(210).fuseTurns);
assert.equal(L.profile(110).name,'Sticky Situation');
assert.equal(L.profile(210).name,'Ticking Acorns');
console.log('PASS: seeded jam spread, layer clearing, bomb countdown, one-time move penalties, defusal and irregular-board preservation');
