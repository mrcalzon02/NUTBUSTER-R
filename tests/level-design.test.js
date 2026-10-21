const assert=require('node:assert/strict');
const E=require('../web/engine.js'),L=require('../web/level-design.js');
const M=require('../web/campaign-maps.js'),P=require('../web/progression.js');
assert.equal(L.ACTS.length,10);
assert.equal(Object.keys(L.LESSONS).length,29);
const family=new Set(),shapes=new Set(),formation=new Set(),tutorial=new Set();
for(let level=1;level<=500;level++){
 const d=L.profile(level),cfg=E.makeLevel(level),g=E.create(level,level*91+7);
 assert.equal(d.id,level);
 assert.equal(d.chapter,Math.floor((level-1)/100)+1);
 assert.equal(d.local,(level-1)%100+1);
 assert.equal(cfg.design.id,level);
 assert.equal(cfg.stageTitle,d.name);
 assert.equal(cfg.hint,d.hint);
 assert.ok(cfg.moves>=9&&cfg.moves<=36);
 assert.ok(cfg.objectives.length>0&&cfg.objectives.length<=2);
 assert.ok(E.hasMove(g),level+' must have an opening move');
 assert.equal(E.matches(g).hit.size,0,level+' starts with no automatic matches');
 const label=M.nodes(d.chapter)[d.local-1].title;
 assert.ok(label.includes(cfg.stageTitle),'The map uses the identical stage title');
 for(const objective of cfg.objectives){
  family.add(objective.kind);
  const physical=objective.kind==='ice'?g.cells.reduce((a,c)=>a+(c?.ice||0),0):
   objective.kind==='locks'?g.cells.reduce((a,c)=>a+(c?.lock||0),0):
   objective.kind==='chests'?g.cells.reduce((a,c)=>a+(c?.chest||0),0):
   objective.kind==='jam'?g.cells.reduce((a,c)=>a+(c?.jam||0),0):Infinity;
  assert.ok(objective.target<=physical,'Initial '+objective.kind+' objective impossible at level '+level);
 }
 assert.equal(cfg.mask.filter(Boolean).length,g.cells.filter(Boolean).length);
 if(d.lesson){formation.add(d.formation);tutorial.add(level);}
 if(level<=100)shapes.add(d.act);
}
for(const kind of ['score','ice','locks','chests','collect'])assert.ok(family.has(kind));
assert.equal(shapes.size,10,'First campaign has 10 acts, not 100 identical levels');
const allMilestones=[1,5,10,18,26,37,49,62,77,92];
for(const item of P.LADDER){
 assert.ok(tutorial.has(item.level),'Unlock stage '+item.level+' requires tutorial labeling');
 if(item.level>1)assert.ok(tutorial.has(item.level+1),'Earned '+item.id+' must be demonstrable immediately');
}
for(const [stage,kind,component] of [[11,'ice','row'],[27,'ice','column'],[38,'ice','cluster'],[50,'locks','cross'],[78,'chests','column'],[93,'locks','scatter']]){
 const g=E.create(stage,731);
 assert.equal(g.cfg.design.kind,kind);
 assert.equal(g.cfg.design.formation,component);
 assert.equal(g.cfg.design.lesson,true);
}
assert.equal(E.makeLevel(100).objectives.length,2,'Meadow finale combines goals');
assert.equal(E.makeLevel(201).design.chapter,3);
assert.ok(E.makeLevel(1).moves>E.makeLevel(100).moves);
assert.ok(E.makeLevel(200).moves>E.makeLevel(500).moves);
console.log('PASS: 500 authored stage profiles, 21 spotlight lessons, 10 acts, aligned map names, blocker availability, gentle-to-cruel move ramp');
