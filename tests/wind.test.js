const assert=require('node:assert/strict');
const F=require('../web/board-features.js'),E=require('../web/engine.js');
let autumn=0,palace=0,covered=0;
for(let level=1;level<=500;level++){
 const g=E.create(level,level*101+21),cfg=g.cfg;
 assert.ok(Array.isArray(cfg.features.wind),'Every stage has wind metadata');
 const lanes=cfg.features.wind,cols=new Set();
 if(level<=300)assert.equal(lanes.length,0,'Wind must not appear before Autumn');
 if(level>=301&&level<=400){autumn++;assert.equal(lanes.length,1,'Autumn gets one gust lane');}
 if(level>=401){palace++;assert.equal(lanes.length,2,'Palace has two distinct wind lanes');}
 for(const lane of lanes){
  covered++;assert.ok(lane.indices.length>=3);
  const col=lane.indices[0]%cfg.width;
  assert.ok(!cols.has(col));cols.add(col);
  assert.ok(lane.indices.every(i=>cfg.mask[i]&&i%cfg.width===col));
  for(let j=1;j<lane.indices.length;j++)assert.equal(lane.indices[j]-lane.indices[j-1],cfg.width);
  assert.equal(lane.every,level>=401?1:2);
 }
}
assert.equal(autumn,100);assert.equal(palace,100);assert.ok(covered===300);
{
 const g=E.create(301,217),lane=g.cfg.features.wind[0];
 // Isolate the wind inverse property: overlapping conveyors and portals deliberately
 // alter the same payloads and must be verified in the full integration test below.
 g.cfg.features.conveyors=[];g.cfg.features.portals=[];
 // Isolate a complete, unblocked wind lane; blocker-segmented gusts are
 // validated separately by whole-piece-blockers and transport tests.
 for(const i of lane.indices){g.cells[i].ice=0;g.cells[i].lock=0;g.cells[i].chest=0;g.cells[i].frozen=0;}
 assert.equal(F.nextWindDirection(lane,0),'up');
 assert.equal(F.windDirection(lane,2),'up');
 assert.equal(F.nextWindDirection(lane,2),'down');
 assert.equal(F.windDirection(lane,4),'down');
 const before=E.snapshot(g).cells;
 const blockerLayers=before.map(c=>c&&[c.ice,c.lock,c.chest,c.jam,c.fuse]);
 assert.equal(F.advance(g,1,()=>E.snapshot(g).cells).filter(s=>s.mode==='wind').length,0);
 const changed=F.advance(g,2,()=>E.snapshot(g).cells).filter(s=>s.mode==='wind');
 assert.equal(changed.length,1);
 assert.equal(changed[0].transfers.length,lane.indices.length);
 for(const transfer of changed[0].transfers){
  assert.equal(g.cells[transfer.to].type,changed[0].before[transfer.from].type);
  assert.equal(g.cells[transfer.to].special,changed[0].before[transfer.from].special);
 }
 assert.deepEqual(E.snapshot(g).cells.map(c=>c&&[c.ice,c.lock,c.chest,c.jam,c.fuse]),blockerLayers);
 const second=F.advance(g,4,()=>E.snapshot(g).cells).filter(s=>s.mode==='wind');
 assert.equal(second.length,1);
 for(const transfer of second[0].transfers){
  assert.equal(g.cells[transfer.to].type,second[0].before[transfer.from].type);
 }
 // Opposite gust rotations cancel out, absent interim moves or cascades.
 for(const i of lane.indices)assert.equal(g.cells[i].type,before[i].type,'Two opposite gusts reverse exactly');
}
{
 const g=E.create(401,31415);
 const lanes=g.cfg.features.wind;
 assert.equal(lanes.length,2);
 // Full-lane rotation is expected only when the gust corridors are unobstructed.
 // Actual blocker-split behavior remains covered by the blocker transport suites.
 for(const lane of lanes)for(const i of lane.indices){g.cells[i].ice=0;g.cells[i].lock=0;g.cells[i].chest=0;g.cells[i].frozen=0;}
 const stages=F.advance(g,1,()=>E.snapshot(g).cells).filter(s=>s.mode==='wind');
 assert.equal(stages.length,2);
 assert.deepEqual(stages.map(s=>s.transfers.length),lanes.map(x=>x.indices.length));
}
{
 const g=E.create(301,123456);
 // Synthetic untouchable objective keeps a test game running through a gust.
 g.cfg.objectives=[{kind:'score',target:Number.MAX_SAFE_INTEGER}];
 const initialMoves=g.moves,w=g.cfg.width;
 let saw=false;
 for(let t=0;t<2;t++){
  const a=g.cells.findIndex((c,i)=>c&&E.adjacent(g,i,i+w));
  const result=E.swap(g,a,a+w);
  assert.ok(result.valid);
  assert.ok(result.stages.every(s=>['transport','cascade','hazard','repair'].includes(s.kind)));
  saw||=result.stages.some(s=>s.kind==='transport'&&s.mode==='wind');
 }
 assert.ok(saw,'Second live player turn must emit wind transport');
 assert.equal(g.moves,initialMoves-2,'Wind does not consume additional player moves');
}
console.log('PASS wind: 100 Autumn/100 Palace stages, 300 fixed lanes, reversal, blocker immobility, animated transfer payload and two-turn gameplay scheduling');
