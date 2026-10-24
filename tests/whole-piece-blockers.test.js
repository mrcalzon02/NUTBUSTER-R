// Pinned blocker nuts must stay immobile and preserve gameplay identity.
const assert=require('node:assert/strict');
const E=require('../web/engine.js'),F=require('../web/board-features.js');
const isPinned=c=>!!(c&&(c.ice>0||c.lock>0||c.chest>0));
let inspected=0,immobile=0;
for(let level=1;level<=500;level++)for(const seed of [level*17+3,level*31+11]){
 const g=E.create(level,seed),before=E.snapshot(g),blocks=g.cells.map((c,i)=>isPinned(c)?i:-1).filter(i=>i>=0);
 assert.equal(E.matches(g).hit.size,0,'Unsolved start at '+level);
 assert.equal(E.hasMove(g),true,'Board needs an actual playable swap at '+level);
 assert.ok(blocks.length<=Math.floor(g.cfg.mask.filter(Boolean).length*.38),'Blockers exceed safe occupancy');
 for(const i of blocks){
  if(g.cells[i].lock)assert.equal(g.cells[i].type,E.TYPES.indexOf('walnut'),'Illustrated chain always means walnut');
  for(const j of [i-1,i+1,i-g.cfg.width,i+g.cfg.width]){
   if(j<0||j>=g.cells.length||Math.abs(j-i)===1&&Math.floor(j/g.cfg.width)!==Math.floor(i/g.cfg.width))continue;
   if(g.cells[j])assert.equal(E.adjacent(g,i,j),false,'Anchored whole-nut replacements cannot be swapped');
  }
 }
 if(blocks.length&&level%25===0){
  const free=g.cells.findIndex(c=>c&&!isPinned(c));
  g.cells[free].type=null;
  const falls=[];E.gravity(g,falls);
  for(const i of blocks)assert.deepEqual(
   [g.cells[i].type,g.cells[i].ice,g.cells[i].lock,g.cells[i].chest],
   [before.cells[i].type,before.cells[i].ice,before.cells[i].lock,before.cells[i].chest],
   'An anchored nut never changes identity or falls through another nut at level '+level);
  for(const t of falls){
   assert.ok(!blocks.includes(t.to),'Gravity may never refill an anchored square');
   if(t.from>=0)assert.ok(!blocks.includes(t.from),'Gravity may never move an anchored source');
  }
  immobile++;
 }
 inspected++;
}
{
 const g=E.create(49,4990),i=g.cells.findIndex(c=>c?.lock>0),nut=g.cells[i].type;
 assert.equal(nut,E.TYPES.indexOf('walnut'));
 assert.equal(E.booster(g,'unlock',-1).valid,true);
 assert.equal(g.cells[i].lock,0,'Master Key unlocks the chained WALNUT');
 assert.equal(g.cells[i].type,nut,'Unlocking reveals walnut, it never changes color');
}
{
 const g=E.create(164,1042),[a,b]=g.cfg.features.portals[0].indices;
 g.cells[a].lock=1;g.cells[a].type=E.TYPES.indexOf('walnut');
 const before=E.snapshot(g),stages=F.advance(g,3,()=>E.snapshot(g).cells);
 assert.equal(stages.some(stage=>stage.mode==='portal'),false,'Portal cannot teleport a locked walnut');
 assert.equal(g.cells[a].type,before.cells[a].type);
 assert.equal(g.cells[b].type,before.cells[b].type);
}
for(const level of [126,301,401]){
 const g=E.create(level,level*47),stream=level===126?g.cfg.features.conveyors[0]:g.cfg.features.wind[0];
 assert.ok(stream,'Stage must contain a transport lane');
 const middle=stream.indices[Math.floor(stream.indices.length/2)];
 g.cells[middle].ice=2;
 const before=E.snapshot(g).cells;
 const turn=level===126?2:level===301?2:1;
 const stage=F.advance(g,turn,()=>E.snapshot(g).cells);
 for(const item of stage)for(const transfer of item.transfers){
  assert.notEqual(transfer.from,middle,'A frozen nut cannot be a transport source');
  assert.notEqual(transfer.to,middle,'A frozen nut cannot receive a transported nut');
  assert.equal(before[transfer.to].ice,0,'Transport never overwrites a blocker');
 }
 assert.equal(g.cells[middle].type,before[middle].type,'A frozen nut remains the SAME piece');
}
console.log('PASS: '+inspected+' whole-piece blocker starts; '+immobile+' gravity cases; key release; stopped portals and segregated conveyors/wind');
