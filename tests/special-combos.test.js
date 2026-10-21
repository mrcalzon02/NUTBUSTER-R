const assert=require('node:assert/strict');
const E=require('../web/engine.js');
// Chapter 2+ battlefields use a full 8x9 test board where special patterns
// produce measurable differences instead of all effects clearing a tiny board.
const n=145,w=8,a=3*w+3,b=a+1;
function start(left,right){
 const g=E.create(n,82331);
 assert.ok(g.cfg.mask.every(Boolean),'Special combo fixture must have no void');
 g.cells[a].special=left;g.cells[b].special=right;
 return g;
}
function combo(left,right){
 const g=start(left,right);
 const result=E.specialComboHits(g,a,b,{hit:new Set(),groups:[]});
 assert.ok(result);
 assert.ok(result.hit.has(a)&&result.hit.has(b));
 assert.equal(result.groups.length,0);
 assert.ok([...result.hit].every(i=>i>=0&&i<g.cells.length&&!!g.cells[i]),'Combo stays inside board');
 return {g,result};
}
{
 const {g,result}=combo('line-h','line-v');
 assert.equal(result.combo,'cross-rockets');
 assert.ok(result.hit.size>=w+g.cfg.height-1);
 assert.ok([...result.hit].every(i=>Math.floor(i/w)===Math.floor(a/w)||i%w===b%w));
}
{
 const {result}=combo('blast','blast');
 assert.equal(result.combo,'double-bomb');
 assert.ok(result.hit.size>=25,'Two bombs create an enlarged radius');
}
{
 const {result}=combo('line-h','blast');
 assert.equal(result.combo,'bomb-rockets');
 assert.ok(result.hit.size>25,'Bomb plus line hits three rows and three columns');
}
{
 const {result}=combo('rainbow','rainbow');
 assert.equal(result.combo,'double-rainbow');
 assert.equal(result.hit.size,w*9,'Two rainbow specials hit all playable cells');
}
{
 const {g,result}=combo('rainbow','line-v');
 assert.equal(result.combo,'rainbow-rockets');
 const wantedColor=g.cells[b].type;
 assert.ok(g.cells.some((c,i)=>c.type===wantedColor&&result.hit.has(i)));
 assert.ok(result.hit.size>g.cells.filter(c=>c.type===wantedColor).length,
   'Rainbow rockets propagate beyond target-colored nuts');
}
{
 const {g,result}=combo('rainbow','blast');
 assert.equal(result.combo,'rainbow-bombs');
 const wanted=g.cells[b].type;
 assert.ok(result.hit.size>g.cells.filter(c=>c.type===wanted).length);
}
for(const [left,right,name] of [
 ['line-h','line-v','cross-rockets'],['blast','blast','double-bomb'],
 ['line-h','blast','bomb-rockets'],['rainbow','line-v','rainbow-rockets'],
 ['rainbow','blast','rainbow-bombs'],['rainbow','rainbow','double-rainbow']]){
 const g=start(left,right),before=g.moves;
 const move=E.swap(g,a,b);
 assert.equal(move.valid,true);
 assert.equal(move.specialCombo,name);
 assert.equal(g.moves,before-1,'A dual-special detonation spends one turn');
 assert.ok(move.loops>0&&move.stages.length>0);
 assert.ok(move.removed+move.cracked>0);
 assert.equal(g.cells.filter(Boolean).length,w*9);
}
console.log('PASS: six distinct paired-special combinations, full-board and area patterns, deterministic activation and exactly one move cost');
