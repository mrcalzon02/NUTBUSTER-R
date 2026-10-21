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
const expected=[[1,4,5],[10,4,5],[11,5,6],[30,5,6],[31,6,7],[70,6,7],[71,7,8],[140,7,8],[141,8,9],[500,8,9]];
for(const [level,w,h] of expected){const c=E.makeLevel(level);assert.equal(c.width,w);assert.equal(c.height,h);assert.equal(c.mask.length,w*h);}
let matching=0,nonMatching=0,cascades=0,falls=0;
for(let lvl=1;lvl<=500;lvl++)for(let seed=1;seed<=5;seed++){
 const g=E.create(lvl,seed*9973+lvl),h=E.create(lvl,seed*9973+lvl);
 assert.deepEqual(E.snapshot(g),E.snapshot(h),'Determinism level '+lvl+' seed '+seed);
 assert.equal(g.cells.length,g.cfg.width*g.cfg.height);
 assert.equal(g.cells.filter(Boolean).length,g.cfg.mask.filter(Boolean).length);
 assert.equal(E.matches(g).hit.size,0,'Initial matches '+lvl+':'+seed);
 assert.equal(E.hasMove(g),true,'No move '+lvl+':'+seed);
 const legal=findSwap(g,true);assert.ok(legal,'Missing scoring swap');
 const beforeMoves=g.moves,beforeScore=g.score,scoring=E.swap(g,...legal);
 assert.equal(scoring.valid,true);assert.equal(g.moves,beforeMoves-1);
 assert.ok(g.score>beforeScore);assert.ok(scoring.stages.length>0);
 assert.deepEqual(scoring.swap,legal);matching++;
 for(const st of scoring.stages){
  if(st.kind!=='cascade')continue;
  cascades++;assert.equal(st.before.length,g.cells.length);assert.equal(st.afterClear.length,g.cells.length);assert.equal(st.cells.length,g.cells.length);
  for(const f of st.falls){
   falls++;assert.ok(f.to>=0&&f.to<g.cells.length);assert.equal(st.cells[f.to].type,f.type);
   if(f.from>=0){assert.equal(st.afterClear[f.from].type,f.type,'A surviving nut must retain its type in gravity');assert.equal(f.from%g.cfg.width,f.to%g.cfg.width,'Falling nuts stay in column');assert.ok(f.to>f.from);}
   else assert.ok(Number.isInteger(f.startRow));
  }
 }
 if(!g.won){const moves=g.moves;assert.equal(E.booster(g,'extra').valid,true);assert.equal(g.moves,moves+5);}
 const independent=E.create(lvl,seed*7477+lvl);
 const harmless=findSwap(independent,false);assert.ok(harmless,'Missing legal non-matching swap');
 const left=independent.cells[harmless[0]].type,right=independent.cells[harmless[1]].type;
 const previousMoves=independent.moves,previousScore=independent.score;
 const result=E.swap(independent,...harmless);
 assert.equal(result.valid,true);assert.equal(result.loops,0);
 assert.equal(independent.moves,previousMoves-1);assert.equal(independent.score,previousScore);
 assert.equal(independent.cells[harmless[0]].type,right);assert.equal(independent.cells[harmless[1]].type,left);
 assert.equal(result.stages.length,0);nonMatching++;
}
const invalid=E.create(3,123);assert.equal(E.swap(invalid,0,999).valid,false);
assert.equal(E.booster(invalid,'unlimited',1).valid,false);
console.log('PASS: 500 levels × 5 seeds, '+matching+' scoring swaps, '+nonMatching+' non-matching swaps, '+cascades+' cascades, '+falls+' fall moves, dynamic geometry and determinism.');
