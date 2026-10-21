const assert=require('node:assert/strict'),E=require('../web/engine.js');
const LEVELS=Array.from({length:500},(_,i)=>i+1);
let minOpening=Infinity,starter=0,failed=0;
for(const n of LEVELS){
 const g=E.create(n,n*127+17);
 assert.equal(E.matches(g).hit.size,0,'No initial free match at '+n);
 assert.ok(E.hasMove(g),'A playable opening must exist '+n);
 const physical={
  ice:g.cells.reduce((s,c)=>s+(c?.ice||0),0),
  locks:g.cells.reduce((s,c)=>s+(c?.lock||0),0),
  chests:g.cells.reduce((s,c)=>s+(c?.chest||0),0),
  jam:g.cells.reduce((s,c)=>s+(c?.jam||0),0)
 };
 for(const spec of g.cfg.objectives){
  if(spec.kind in physical)assert.ok(spec.target<=physical[spec.kind],'Target exceeds blocker stock '+n+' '+spec.kind);
 }
}
for(const level of [70,72,98]){
 const moves=E.makeLevel(level).moves;
 assert.ok(moves>=E.makeLevel(level-1).moves+2,'Teaching grace for chapter-one difficulty spike at '+level);
}
const target101=E.makeLevel(101),target150=E.makeLevel(150),target200=E.makeLevel(200);
assert.ok(target101.goal<target150.goal&&target150.goal<target200.goal,'Factory score difficulty should steadily grow');
assert.ok(target150.goal>700+18*150,'Factory score objectives exceed base-rate after midpoint');
assert.ok(target200.goal>6500,'Late Factory reaches fair high-difficulty target');
assert.ok(target101.moves>target200.moves);
assert.ok(E.makeLevel(200).moves>E.makeLevel(300).moves);
console.log('PASS: all 500 legal board starts, objective layer feasibility, three beginner-grace adjustments, Factory rising goals through level 200');
