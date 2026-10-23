const assert=require('node:assert/strict');
const E=require('../web/engine.js'),F=require('../web/board-features.js'),L=require('../web/level-design.js');
let beltLevels=0,portalLevels=0;
for(let n=1;n<=500;n++){
 const cfg=E.makeLevel(n),f=cfg.features,mask=cfg.mask;
 assert.ok(f&&Array.isArray(f.conveyors)&&Array.isArray(f.portals));
 const occupied=new Set();
 for(const belt of f.conveyors){
  beltLevels++;assert.ok(belt.indices.length>=3);
  for(const i of belt.indices){assert.ok(mask[i]);assert.ok(!occupied.has(i));occupied.add(i);}
  assert.ok(belt.indices.every(i=>Math.floor(i/cfg.width)===Math.floor(belt.indices[0]/cfg.width)));
  for(let i=1;i<belt.indices.length;i++)assert.equal(belt.indices[i],belt.indices[i-1]+1);
 }
 for(const portal of f.portals){
  portalLevels++;
  const [a,b]=portal.indices;assert.ok(mask[a]&&mask[b]);assert.notEqual(a,b);
  assert.ok(!occupied.has(a)&&!occupied.has(b));
  assert.notEqual(Math.floor(a/cfg.width),Math.floor(b/cfg.width));
 }
 if(n<125)assert.equal(f.conveyors.length,0);
 if(n<164)assert.equal(f.portals.length,0);
}
assert.ok(beltLevels>200&&portalLevels>150,'Transport covers a meaningful number of stages');
{
 const g=E.create(126,8983),belt=g.cfg.features.conveyors[0];
 assert.ok(belt);
 const old=E.snapshot(g).cells,layers=old.map(c=>c&&[c.ice,c.lock,c.chest,c.jam,c.fuse]);
 assert.equal(F.advance(g,1,()=>E.snapshot(g).cells).length,0);
 const stages=F.advance(g,2,()=>E.snapshot(g).cells);
 assert.ok(stages.length>=1,'Conveyor must transport at least one free segment');
 assert.ok(stages.every(stage=>stage.mode==='conveyor'),'Only conveyor can trigger at level 126');
 for(const stage of stages)for(const t of stage.transfers){
  assert.equal(g.cells[t.to].type,old[t.from].type);
  assert.equal(g.cells[t.to].special,old[t.from].special);
  for(const index of [t.from,t.to])assert.equal(
   !!(old[index].ice||old[index].lock||old[index].chest),false,'Anchored illustrated pieces may not be transported');
 }
 assert.deepEqual(E.snapshot(g).cells.map(c=>c&&[c.ice,c.lock,c.chest,c.jam,c.fuse]),layers);
}
{
 const g=E.create(164,782),portal=g.cfg.features.portals[0];
 assert.ok(portal);
 // Isolate the transport contract: a late-game rooted-vine aura or stone
 // seal must stop the portal in production, not invalidate this free-pair test.
 for(const i of portal.indices){const c=g.cells[i];c.ice=0;c.lock=0;c.chest=0;c.rock=0;c.frozen=0;if(c.aura==='nature-vines'){c.aura=null;c.auraTurns=0;}}
 const old=E.snapshot(g).cells;
 const stages=F.advance(g,3,()=>E.snapshot(g).cells);
 assert.equal(stages.length,1);assert.equal(stages[0].mode,'portal');
 const [a,b]=portal.indices;
 assert.equal(g.cells[a].type,old[b].type);
 assert.equal(g.cells[b].type,old[a].type);
}
{
 const g=E.create(126,2048),w=g.cfg.width;
 let saw=false;
 for(let turn=0;turn<4&&!g.won&&!g.lost;turn++){
  // Re-evaluate a legal adjacent swap after every fall/shift.
  let pair=null;
  for(let a=0;a<g.cells.length&&!pair;a++)for(const b of [a+1,a+w])if(E.adjacent(g,a,b)){pair=[a,b];break;}
  assert.ok(pair);
  const before=g.moves,move=E.swap(g,...pair);
  assert.ok(move.valid);
  saw ||=move.stages.some(s=>s.kind==='transport');
  assert.equal(g.moves,before-1);
 }
 assert.ok(saw,'Actual turn engine must emit visible conveyor stages');
}
assert.equal(L.profile(125).name,'Conveyor Initiation');
assert.equal(L.profile(164).name,'Portal Puzzles');
console.log('PASS: 500 fixed board plans, '+beltLevels+' conveyor stages, '+portalLevels+' portal stages, scheduled identity-preserving transport, real turn integration');
