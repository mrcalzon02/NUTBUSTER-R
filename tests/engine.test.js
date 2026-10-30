const assert=require('node:assert/strict');
const E=require('../web/engine.js');
function findSwap(g,wantMatch){
 for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+g.cfg.width]){
  if(!E.adjacent(g,a,b))continue;
  const left=g.cells[a].type,right=g.cells[b].type;
  g.cells[a].type=right;g.cells[b].type=left;
  const matched=E.matches(g).hit.size>0;
  g.cells[b].type=right;g.cells[a].type=left;
  if(matched===wantMatch)return [a,b];
 }
 return null;
}
function assertPlayableCellsFilled(g,context){
 for(let i=0;i<g.cfg.mask.length;i++){
  assert.equal(Boolean(g.cells[i]),Boolean(g.cfg.mask[i]),context+' mask '+i);
  if(g.cfg.mask[i])assert.ok(Number.isInteger(g.cells[i].type)&&E.TYPES[g.cells[i].type],context+' blank playable cell '+i);
 }
}
function isGravityBarrier(c){return !c||(c.type!==null&&(c.ice>0||c.lock>0||c.chest>0||c.rock>0||c.frozen>0||c.hold>0||(c.aura==='nature-vines'&&c.auraTurns>0)));}
// Donut hole splits a column into two independent reservoirs. New nuts in
// the lower island must never appear to descend through the missing tiles.
{
 const width=8,height=9,column=3;
 const cells=Array.from({length:width*height},()=>({type:0,ice:0,lock:0,chest:0,rock:0,frozen:0,hold:0,special:null,elemental:null}));
 for(let y=2;y<=6;y++)cells[y*width+column]=null;
 cells[7*width+column].type=null;cells[8*width+column].type=null;
 const g={cfg:{width,height,roster:[0,1,2],typeCount:3},cells,rand:()=>.1},falls=[];
 E.gravity(g,falls);
 const island=falls.filter(f=>f.to%width===column);
 assert.equal(island.length,2,'Lower disconnected island refills independently');
 assert.ok(island.every(f=>f.from===-1&&f.startRow===7),'Fresh nuts originate at their own segment top, not across the hole');
 assert.ok(cells.every(c=>!c||c.type!==null),'No blank playable cell after interrupted-column refill');
}
// Reproduce the two-gravity-pass magma defect on a seeded donut board.
// A post-refill magma strike must animate as a second cascade, not append
// duplicate fall destinations to the first pass (which paints ghost/blank nuts).
function magmaTraceBoard(){
 const g=E.create(628,23);
 assert.ok(g.cfg.mask.some(yes=>!yes),'Fixture must retain real donut voids');
 for(const c of g.cells)if(c){
  for(const key of ['ice','lock','chest','rock','frozen','hold','ward','jam','fuse'])c[key]=0;
  c.aura=null;c.auraTurns=0;
 }
 return g;
}
function assertMagmaCascadeTrace(g,result,context){
 assert.equal(result.valid,true,context);
 assert.ok(g.elementalActivations.includes('magma'),context+' must activate magma');
 const cascades=result.stages.filter(stage=>stage.kind==='cascade');
 assert.ok(cascades.length>=2,context+' needs separate pre-magma and post-magma gravity stages');
 for(const [wave,stage] of cascades.entries()){
  const destinations=new Set();
  for(const fall of stage.falls){
   assert.ok(!destinations.has(fall.to),context+' duplicate fall destination '+wave+':'+fall.to);
   destinations.add(fall.to);
   assert.equal(stage.cells[fall.to].type,fall.type,context+' final fall payload '+wave+':'+fall.to);
   if(fall.from>=0){
    assert.equal(stage.afterClear[fall.from].type,fall.type,context+' source payload '+wave+':'+fall.from);
    assert.equal(fall.from%g.cfg.width,fall.to%g.cfg.width,context+' same-column fall');
    for(let y=Math.floor(fall.from/g.cfg.width)+1;y<=Math.floor(fall.to/g.cfg.width);y++)
     assert.ok(!isGravityBarrier(stage.afterClear[y*g.cfg.width+fall.to%g.cfg.width]),context+' no fall across hole or pin');
   }else{
    let top=Math.floor(fall.to/g.cfg.width);
    while(top>0&&!isGravityBarrier(stage.afterClear[(top-1)*g.cfg.width+fall.to%g.cfg.width]))top--;
    if(top>0)assert.ok(fall.startRow>=top,context+' refill starts in local vertical island');
   }
  }
 }
 assertPlayableCellsFilled(g,context);
}
{
 const g=magmaTraceBoard(),at=3*g.cfg.width;
 g.cells[at].elemental='magma';
 assertMagmaCascadeTrace(g,E.booster(g,'hammer',at),'seeded donut magma booster');
}
{
 const g=magmaTraceBoard(),pair=findSwap(g,true);
 assert.ok(pair,'Seeded donut must have a scoring swap');
 const [a,b]=pair,left=g.cells[a].type,right=g.cells[b].type;
 g.cells[a].type=right;g.cells[b].type=left;
 const hit=[...E.matches(g).hit];
 g.cells[a].type=left;g.cells[b].type=right;
 const magmaIndex=hit.find(i=>i!==a&&i!==b);
 assert.ok(Number.isInteger(magmaIndex),'Seeded match needs an unaffected magma source');
 g.cells[magmaIndex].elemental='magma';
 assertMagmaCascadeTrace(g,E.swap(g,a,b),'seeded donut magma match');
}
const expected=[[1,4,5],[10,4,5],[11,5,6],[30,5,6],[31,6,7],[70,6,7],[71,7,8],[140,7,8],[141,8,9],[500,8,9],[1000,8,9]];
for(const [level,w,h] of expected){const c=E.makeLevel(level);assert.equal(c.width,w);assert.equal(c.height,h);assert.equal(c.mask.length,w*h);}
let matching=0,nonMatching=0,cascades=0,falls=0;
for(let lvl=1;lvl<=1000;lvl++)for(let seed=1;seed<=5;seed++){
 const g=E.create(lvl,seed*9973+lvl),h=E.create(lvl,seed*9973+lvl);
 assert.deepEqual(E.snapshot(g),E.snapshot(h),'Determinism level '+lvl+' seed '+seed);
 assert.equal(g.cells.length,g.cfg.width*g.cfg.height);
 assert.equal(g.cells.filter(Boolean).length,g.cfg.mask.filter(Boolean).length);
 assert.equal(E.matches(g).hit.size,0,'Initial matches '+lvl+':'+seed);
 assert.equal(E.hasMove(g),true,'No move '+lvl+':'+seed);
 const legal=findSwap(g,true);assert.ok(legal,'Missing scoring swap');
 const beforeMoves=g.moves,beforeRefunds=g.elementalRefunds||0,beforeScore=g.score,scoring=E.swap(g,...legal);
 assert.equal(scoring.valid,true);assertPlayableCellsFilled(g,'scoring '+lvl+':'+seed);
 const earnedRefunds=(g.elementalRefunds||0)-beforeRefunds;
 const expiredBombs=scoring.hazards?.expired?.length||0;
 assert.equal(g.moves,Math.max(0,beforeMoves-1+earnedRefunds-expiredBombs*2),'Scoring swap charges a turn, credits Nature refunds and deducts expired bombs');
 assert.ok(g.score>beforeScore);assert.ok(scoring.stages.length>0);
 assert.deepEqual(scoring.swap,legal);matching++;
 for(const st of scoring.stages){
  if(st.kind!=='cascade')continue;
  cascades++;assert.equal(st.before.length,g.cells.length);assert.equal(st.afterClear.length,g.cells.length);assert.equal(st.cells.length,g.cells.length);
  for(const f of st.falls){
   falls++;assert.ok(f.to>=0&&f.to<g.cells.length);assert.equal(st.cells[f.to].type,f.type);
   if(f.from>=0){
    assert.equal(st.afterClear[f.from].type,f.type,'A surviving nut must retain its type in gravity');
    assert.equal(f.from%g.cfg.width,f.to%g.cfg.width,'Falling nuts stay in column');
    assert.ok(f.to>f.from);
    for(let y=Math.floor(f.from/g.cfg.width)+1;y<=Math.floor(f.to/g.cfg.width);y++)
     assert.ok(!isGravityBarrier(st.afterClear[y*g.cfg.width+f.to%g.cfg.width]),'Fall must not cross a hole or pinned nut');
   }else{
    assert.ok(Number.isInteger(f.startRow));
    let top=Math.floor(f.to/g.cfg.width);
    while(top>0&&!isGravityBarrier(st.afterClear[(top-1)*g.cfg.width+f.to%g.cfg.width]))top--;
    if(top>0)assert.ok(f.startRow>=top,'Spawn must begin inside its own vertical segment');
   }
  }
 }
 if(!g.won){const moves=g.moves;assert.equal(E.booster(g,'extra').valid,true);assert.equal(g.moves,moves+5);}
 const independent=E.create(lvl,seed*7477+lvl);
 const harmless=findSwap(independent,false);assert.ok(harmless,'Missing legal non-matching swap');
 const left=independent.cells[harmless[0]].type,right=independent.cells[harmless[1]].type;
 const previousMoves=independent.moves,previousRefunds=independent.elementalRefunds||0,previousScore=independent.score;
 const result=E.swap(independent,...harmless);
 assert.equal(result.valid,true);assert.ok(result.loops>=0);assertPlayableCellsFilled(independent,'nonmatch '+lvl+':'+seed);
 assert.equal(independent.moves,Math.max(0,previousMoves-1+(independent.elementalRefunds||0)-previousRefunds-2*(result.hazards?.expired?.length||0)),'Non-matching swaps charge turns and account for elemental refunds and bomb expiry');
 if(!result.loops)assert.equal(independent.score,previousScore);
 assert.ok(result.stages.every(s=>['repair','hazard','transport','cascade'].includes(s.kind)),'Environmental transport may cause further cascades');
 if(!result.stages.some(s=>s.kind==='repair'||s.kind==='transport'||s.kind==='cascade')){assert.equal(independent.cells[harmless[0]].type,right);assert.equal(independent.cells[harmless[1]].type,left);}
 else {assert.equal(E.matches(independent).hit.size,0);assert.ok(E.hasMove(independent),'Deadlock repair restored a legal match');}
 nonMatching++;
}
const invalid=E.create(3,123);assert.equal(E.swap(invalid,0,999).valid,false);
assert.equal(E.booster(invalid,'unlimited',1).valid,false);
console.log('PASS: 1000 levels × 5 seeds, '+matching+' scoring swaps, '+nonMatching+' non-matching swaps, '+cascades+' cascades, '+falls+' fall moves, dynamic geometry and determinism.');
