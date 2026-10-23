const assert=require('node:assert/strict');
const E=require('../web/engine.js'),L=require('../web/level-design.js');
const M=require('../web/campaign-maps.js'),P=require('../web/progression.js');
assert.equal(L.ACTS.length,10);
assert.equal(L.CHAPTER_ACTS.length,10);
assert.ok(L.CHAPTER_ACTS.every(acts=>acts.length===10),'Every chapter has ten named acts');
assert.equal(Object.keys(L.LESSONS).length,108);
const family=new Set(),shapes=new Set(),formation=new Set(),tutorial=new Set();
for(let level=1;level<=1000;level++){
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
for(const kind of ['score','ice','locks','chests','collect','jam'])assert.ok(family.has(kind));
assert.equal(shapes.size,10,'First campaign has 10 acts, not 100 identical levels');
for(const [stage,chapter,actName] of [[101,2,'Receiving Bay'],[201,3,'Foothill Cache'],[301,4,'Windmill Welcome'],[401,5,'The Royal Tempest']]){
 const d=L.profile(stage);
 assert.equal(d.chapter,chapter);
 if(!d.lesson)assert.ok(d.name.startsWith(actName),'Stage '+stage+' uses its chapter act book');
}
assert.ok(L.profile(112).name.startsWith('Roasting Floor'),'Factory generated stages use Factory act names');
assert.ok(L.profile(412).name.startsWith('Mooncourt'),'Palace generated stages use Palace act names');
assert.ok(!L.profile(112).name.includes('Meadows'),'Factory stage titles cannot leak Meadow naming');
assert.ok(!L.profile(412).name.includes('Meadows'),'Palace stage titles cannot leak Meadow naming');
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
for(const [stage,secondary] of [[200,'jam'],[300,'chests'],[400,'locks'],[500,'chests']]){
 const cfg=E.makeLevel(stage);
 assert.equal(cfg.design.lesson,true,'Chapter finale '+stage+' is explicitly authored');
 assert.deepEqual(cfg.objectives.map(o=>o.kind),['collect',secondary],'Finale '+stage+' uses its intended paired objective');
}
assert.ok(E.makeLevel(300).bombs>=5,'Highlands finale carries maximum timed-acorn pressure');
assert.ok(E.makeLevel(500).features.wind.length>=2,'Palace finale retains two wind lanes');
assert.equal(E.makeLevel(201).design.chapter,3);
assert.ok(E.makeLevel(1).moves>E.makeLevel(100).moves);
assert.ok(E.makeLevel(200).moves>E.makeLevel(500).moves);
// Content gate: every added spotlight is an actual level-book override, linked
// to its campaign map and physically playable across more than one opening seed.
const authoredSpots=[84,99,101,116,139,151,177,199,201,218,240,275,312,330,360,389,410,435,460,490];
const expectedKinds={84:'chests',99:'dual',101:'collect',116:'jam',139:'ice',151:'dual',177:'locks',199:'dual',201:'collect',218:'dual',240:'ice',275:'dual',312:'locks',330:'dual',360:'jam',389:'dual',410:'chests',435:'dual',460:'dual',490:'dual'};
for(const level of authoredSpots){
 const d=L.profile(level),cfg=E.makeLevel(level);
 assert.equal(d.lesson,true,'Authored spotlight '+level+' exists');
 assert.equal(cfg.objectives[0].kind,d.kind==='dual'?'collect':d.kind,'Spotlight '+level+' has actual objective');
 assert.equal(d.kind,expectedKinds[level],'Spotlight '+level+' uses intended pressure family');
 assert.equal(M.nodes(d.chapter)[d.local-1].title.includes(d.name),true,'Spotlight '+level+' appears on its map');
 for(const seed of [31,117,923]){
  const g=E.create(level,level*1009+seed);
  assert.ok(E.hasMove(g),'Spotlight '+level+' legal opening seed '+seed);
  assert.equal(E.matches(g).hit.size,0,'Spotlight '+level+' starts without free match');
  for(const objective of g.cfg.objectives){
   const quantity=objective.kind==='ice'?g.cells.reduce((a,c)=>a+(c?.ice||0),0):
    objective.kind==='locks'?g.cells.reduce((a,c)=>a+(c?.lock||0),0):
    objective.kind==='chests'?g.cells.reduce((a,c)=>a+(c?.chest||0),0):
    objective.kind==='jam'?g.cells.reduce((a,c)=>a+(c?.jam||0),0):Infinity;
   assert.ok(objective.target<=quantity,'Spotlight '+level+' objective is physically reachable, seed '+seed);
  }
 }
}
assert.ok(E.makeLevel(139).features.conveyors.length>0,'Factory conveyor spotlight needs a conveyor');
assert.ok(E.makeLevel(177).features.portals.length>0,'Portal-lock spotlight needs a portal');
assert.ok(E.makeLevel(330).features.wind.length>0,'Autumn crosswind spotlight needs wind');
assert.equal(E.makeLevel(490).features.wind.length,2,'Final palace vault needs two wind lanes');
for(const level of [501,520,540,560,580,600,601,620,640,660,680,700,701,720,740,760,780,800,801,820,840,860,880,900,901,920,940,960,980,1000]){
 const d=L.profile(level),g=E.create(level,level*19+23);
 assert.equal(d.lesson,true,'New themed lesson '+level);
 assert.equal(M.nodes(d.chapter)[d.local-1].title.includes(d.name),true);
 assert.equal(g.cfg.stageTitle,d.name);
 assert.ok(E.hasMove(g),'New spotlight must have a legal start '+level);
}
console.log('PASS: 1000 stage profiles, ten chapter act books, 108 spotlight lessons, objective feasibility and new chapter finales');
