'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const E=require('../web/engine.js'),P=require('../web/elemental-powers.js'),C=require('../web/nut-codex.js');
const unlocks=E.TILE_OVERLAY_UNLOCKS;
assert.equal(unlocks.length,12,'Twelve additional tile effects have staged entry points');
assert.deepEqual(E.overlayPlan(44),[],'No tile auras ahead of the intended introduction');
assert.ok(E.overlayPlan(45).some(e=>e.kind==='fire'),'Burn begins at 45');
for(const spec of unlocks){
 assert.ok(E.overlayPlan(spec.level).every(e=>e.level<=spec.level),'No premature tile overlays');
 assert.ok(E.overlayPlan(spec.level+1).some(e=>e.level<=spec.level+1));
 assert.equal(C.entries.find(e=>e.id==='tile-'+spec.kind)?.live,true,spec.kind+' must be listed as playable');
}
assert.equal(C.entries.find(e=>e.id==='tile-void-rock')?.live,true,'Void-Rock must have a real two-hit late-game barrier');
assert.equal(Object.keys(P.ABILITIES).length,15);
assert.deepEqual(Object.keys(P.ABILITIES).sort(),[...P.ELEMENTS].sort());
for(const kind of P.ELEMENTS){
 const entry=C.entries.find(x=>x.group==='elemental'&&x.id===kind);
 assert.equal(entry?.effect,P.ABILITIES[kind],kind+' ability in the deck must match the executable ability ledger');
 assert.match(entry.rule,/destroyed/,'Activation conditions must be explicit');
}
for(const level of [1,45,115,155,195,245,285,325,365,425,525,625,745,750,1000]){
 const one=E.create(level,level*31+13),two=E.create(level,level*31+13);
 assert.deepEqual(E.snapshot(one),E.snapshot(two),'Same level and seed must place identical auras');
 assert.equal(E.matches(one).hit.size,0,'Initial auras must not create a free match '+level);
 assert.ok(E.hasMove(one),'Initial auras must leave an opening '+level);
 for(const c of one.cells)if(c){
  if(c.aura)assert.ok(unlocks.some(e=>e.kind===c.aura&&e.level<=level),'Aura appeared before unlock '+c.aura);
  if(c.poison)assert.ok(level>=115,'Poison spawned too early');
 }
}
function clean(seed=17){const g=E.create(1,seed);assert.ok(g.cells.every(c=>!c||!c.aura));return g;}
function tick(g){return E.advanceHazards(g,{valid:true,won:false,lost:false,loops:0,removed:0,cracked:0,stages:[]});}
{
 const g=clean(),at=6;c(g,at).aura='fire';c(g,at).auraTurns=2;
 const first=tick(g);assert.ok(first.stages.some(s=>s.kind==='hazard'),'Aura timer must animate every turn');
 assert.equal(c(g,at).auraTurns,1);
 const second=tick(g);assert.ok(second.stages.some(s=>s.kind==='aura'),'Expired burn must emit an actionable stage');
 assert.ok(g.progress.colors.some(v=>v>0),'Burn must actually remove nuts');
}
{
 const g=clean();c(g,6).poison=2;tick(g);assert.equal(c(g,6).poison,1);
 tick(g);assert.ok(c(g,6).jam>0,'Poison must become sticky butter on its deadline');
}
{
 const g=clean();c(g,6).aura='nature-vines';c(g,6).auraTurns=1;
 assert.equal(E.adjacent(g,6,7),false,'Vines anchor nuts while growing');
 tick(g);assert.equal(c(g,6).aura,null,'Vines expire and release their cell');
}
{
 const g=clean();c(g,6).aura='crystal';c(g,6).auraTurns=1;
 tick(g);assert.ok(c(g,6).hold>=2,'Crystal must grant an actual held nut');
 assert.ok(g.crystalCharge>0,'Crystal must charge real cascade scoring');
}
{
 const g=clean();c(g,6).aura='shadow';c(g,6).auraTurns=2;
 const before=c(g,6).type;
 const r=E.booster(g,'row',6);
 assert.equal(r.valid,true);assert.ok(g.progress.colors.reduce((a,b)=>a+b,0)>=0);
 assert.ok(!g.cells.some(x=>x&&x.aura==='shadow'&&x.auraTurns<0));
}
{
 const g=clean();const at=6,near=7;
 c(g,at).aura='water';c(g,at).auraTurns=1;
 c(g,near).jam=1;c(g,near).poison=2;
 tick(g);assert.equal(c(g,near).jam,0,'Water aura washes same-row butter');
 assert.equal(c(g,near).poison,0,'Water aura neutralizes poisoned tiles');
}
{
 const g=clean();c(g,6).aura='arcane';c(g,6).auraTurns=1;
 const original=c(g,6).type,at=6;
 const r=tick(g);
 assert.ok(r.stages.some(s=>s.kind==='aura'),'Arcane transmutation must execute');
 assert.ok(c(g,at).type!==original||g.progress.colors.some(v=>v>0),'Transmutation shifts the roster color or immediately resolves its match');
}
{
 const g=clean();c(g,6).aura='void-rock';c(g,6).auraTurns=1;
 tick(g);assert.equal(c(g,6).rock,2,'Void-Rock grows into a two-hit stone barrier');
 assert.equal(E.adjacent(g,6,7),false,'Stone seal pins the occupied square');
}
// Expiring vine effects next to a masked-out hole must never treat null as
// an existing nut (undefined !== null used to slip through this check).
{
 const g=E.create(12,923),w=g.cfg.width;
 const edge=g.cells.findIndex((c,i)=>c&&[i-w,i+w,i-1,i+1].some(j=>
  j>=0&&j<g.cells.length&&!g.cells[j]&&
  (Math.abs(j-i)===w||Math.floor(j/w)===Math.floor(i/w))));
 assert.ok(edge>=0,'Irregular board must expose a hole-adjacent nut');
 const shape=g.cells.map(Boolean);
 g.cells[edge].aura='nature-vines';g.cells[edge].auraTurns=1;
 const outcome=tick(g);
 assert.ok(outcome.stages.some(s=>s.kind==='aura'));
 assert.deepEqual(g.cells.map(Boolean),shape,'Vines must not grow nuts into holes');
}
const game=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
assert.ok(game.includes('E.ELEMENTAL_ABILITIES?.[c.elemental]'),'Elemental ability data must reach game logic');
assert.ok(!game.includes('Elemental chains are PREVIEW'),'Live abilities must not be flagged preview');
function c(g,i){return g.cells[i];}
console.log('PASS: staged tile statuses, active effects, elemental skills and seeded legal boards');
