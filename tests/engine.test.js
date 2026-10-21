const assert=require('node:assert/strict');const E=require('../web/engine.js');
for(let lvl=1;lvl<=30;lvl++)for(let seed=1;seed<=20;seed++){
 const g=E.create(lvl,seed*9973+lvl);assert.equal(g.cfg.mask.length,72);assert.equal(g.cells.filter(Boolean).length,g.cfg.mask.filter(Boolean).length);assert.equal(E.matches(g).hit.size,0,'Initial matches '+lvl+':'+seed);assert.equal(E.hasMove(g),true,'No move '+lvl+':'+seed);
 let legal=null;for(let i=0;i<g.cells.length&&!legal;i++)for(const j of [i+1,i+g.cfg.width])if(E.adjacent(g,i,j)){
  const a=g.cells[i].type;g.cells[i].type=g.cells[j].type;g.cells[j].type=a;const okay=E.matches(g).hit.size>0;g.cells[j].type=g.cells[i].type;g.cells[i].type=a;if(okay){legal=[i,j];break;}}
 assert.ok(legal);const before=g.moves;const result=E.swap(g,...legal);assert.equal(result.valid,true);assert.equal(g.moves,before-1);assert.ok(g.score>0);assert.ok(g.history.length>0);
 if (!g.won) {assert.equal(E.booster(g,'extra').valid,true);assert.equal(g.moves,before+4);}
}
const a=E.create(3,123),b=E.create(3,123);assert.deepEqual(E.snapshot(a),E.snapshot(b),'seed determinism');
const invalid=E.swap(a,0,71);assert.equal(invalid.valid,false);
assert.equal(E.booster(a,'unlimited',1).valid,false);
console.log('PASS: 30 levels × 20 seeds; no opening matches, viable moves, deterministic initial state, legal swaps, boosters, masks.');
