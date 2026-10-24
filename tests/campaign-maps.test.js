const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const M=require('../web/campaign-maps.js');const E=require('../web/engine.js');
assert.equal(M.CHAPTERS.length,10);
let ids=new Set();
for(const c of M.CHAPTERS){
 assert.equal(c.end-c.start+1,100);
 assert.equal(c.start,(c.id-1)*100+1);
 const positions=M.nodes(c.id);
 assert.equal(positions.length,100);
 assert.equal(c.path.length,[1,1,3,2,1,1,1,1,1,1][c.id-1],'Walkable road sections are explicit');
 assert.equal(new Set(positions.map(p=>p.road)).size,c.path.length);
 assert.equal(positions.filter(p=>p.kind==='finale').length,1);
 assert.ok(positions.some(p=>p.kind==='challenge'));
 assert.ok(positions.some(p=>p.kind==='treasure'));
 assert.ok(positions.some(p=>p.kind==='booster'));
 assert.equal(positions[0].level,c.start);
 assert.equal(positions[99].level,c.end);
 const bg=path.join(__dirname,'../web',c.image);
 assert.ok(fs.existsSync(bg)&&fs.statSync(bg).size>300000,c.image);
 for(const p of positions){
  assert.ok(!ids.has(p.level),'Duplicate map node '+p.level);ids.add(p.level);
  assert.ok(p.x>0.05&&p.x<.95&&p.y>.03&&p.y<.99,'Map coordinate out of bounds '+p.level);
  assert.ok(Number.isInteger(p.road)&&p.road>=0&&p.road<c.path.length,'Invalid walkable road section '+p.level);
  assert.equal(M.chapterOf(p.level).id,c.id);
  assert.equal(E.makeLevel(p.level).chapter,c.id);
 }
}
assert.equal(ids.size,1000);
assert.ok(fs.existsSync(path.join(__dirname,'../web',M.OVERVIEW)));
assert.ok(fs.existsSync(path.join(__dirname,'../web',M.OVERVIEW2)));
assert.equal(M.chapterOf(501).id,6);
assert.equal(M.chapterOf(1000).id,10);
for(let l=1;l<=1000;l++){
 const g=E.create(l,l*991);
 assert.equal(g.level,l);
 assert.equal(E.matches(g).hit.size,0,'Opening accidental match on '+l);
 assert.ok(E.hasMove(g),'No legal opening move on '+l);
 assert.equal(g.cfg.mask.length,g.cells.length);
}
const early=E.makeLevel(1), middle=E.makeLevel(200), late=E.makeLevel(500);
assert.ok(early.moves>middle.moves&&middle.moves>late.moves);
assert.ok(late.goal>middle.goal);
console.log('PASS: ten chapter routes, 1000 unique playable stages, resource availability and difficulty');
