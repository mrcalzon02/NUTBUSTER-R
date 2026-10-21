const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const M=require('../web/campaign-maps.js');const E=require('../web/engine.js');
assert.equal(M.CHAPTERS.length,5);
let ids=new Set();
for(const c of M.CHAPTERS){
 assert.equal(c.end-c.start+1,100);
 assert.equal(c.start,(c.id-1)*100+1);
 const positions=M.nodes(c.id);
 assert.equal(positions.length,100);
 assert.equal(c.path.length,[1,1,3,2,1][c.id-1],'Walkable road sections are explicit');
 // A route split is intentional where the artwork shows a waterfall/cliff.
 // No stages may be linearly interpolated through the unwalkable gap.
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
 for(let i=1;i<positions.length;i++){
  const prev=positions[i-1],next=positions[i];
  const distance=Math.hypot((prev.x-next.x)*M.WIDTH,(prev.y-next.y)*M.HEIGHT);
  if(prev.road!==next.road){
   assert.equal(next.road,prev.road+1,'Route skips a walkable section at '+next.level);
   assert.ok(distance>100,'Declared scenery gap is missing at '+next.level);
  }else{
   assert.ok(distance<40,'Unexpected on-road map jump '+next.level+': '+distance);
   assert.ok(distance>13,'Overcrowded neighboring nodes '+next.level+': '+distance);
  }
 }
}
assert.equal(ids.size,500);
// Independently pin critical road features so edits cannot silently drift away
// from the bridge, switchback, and castle entrance in the actual art.
const roadLandmarks={
 1:[[470,1640],[612,1050],[235,484],[559,125]],
 2:[[480,1640],[545,1038],[645,559],[566,165]],
 3:[[500,1635],[455,1260],[635,697],[726,94]],
 4:[[460,1638],[562,1053],[699,452],[676,120]],
 5:[[471,1640],[452,1057],[695,867],[625,226]]
};
for(const [chapterId,points] of Object.entries(roadLandmarks)){
 const route=M.nodes(Number(chapterId));
 for(const [x,y] of points){
  assert.ok(route.some(p=>Math.hypot(p.x*M.WIDTH-x,p.y*M.HEIGHT-y)<46),
   'Stage markers drifted off a painted road landmark in chapter '+chapterId+': '+x+','+y);
 }
}
const css=fs.readFileSync(path.join(__dirname,'../web/style.css'),'utf8');
assert.match(css,/\.map-node\{[^}]*width:27px;height:27px/,'Standard road markers must be legible');
assert.match(css,/\.map-node\.milestone\{width:35px;height:35px/,'Milestone markers must remain distinctive');
assert.match(css,/\.map-node:is\([^)]+\)::after\{[^}]*width:19px;height:19px/,'Reward icons must remain legible');
assert.ok(fs.existsSync(path.join(__dirname,'../web',M.OVERVIEW)));
for(let l=1;l<=500;l++){
 const g=E.create(l,l*991);
 assert.equal(g.level,l);
 assert.equal(E.matches(g).hit.size,0,'Opening accidental match on '+l);
 assert.ok(E.hasMove(g),'No legal opening move on '+l);
 assert.equal(g.cfg.mask.length,g.cells.length);
}
const early=E.makeLevel(1), middle=E.makeLevel(200), late=E.makeLevel(500);
assert.ok(early.moves>middle.moves&&middle.moves>late.moves);
assert.ok(late.goal>middle.goal);
console.log('PASS: five 100-node maps, 500 unique playable level IDs, smooth bounded paths, all map assets, progressive difficulty');
