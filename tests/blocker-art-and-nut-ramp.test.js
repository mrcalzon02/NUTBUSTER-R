// Campaign nut roster and obstacle progression must remain playable.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../web/engine.js'),P=require('../web/progression.js'),H=require('../web/homestead.js');
const A=require('../web/avatar-art.js'),M=require('../web/campaign-maps.js'),F=require('../web/board-features.js');
const root=path.join(__dirname,'..');
for(let n=1;n<=500;n++){
 const expected=E.rosterForLevel(n),g=E.create(n,n*37+99);
 assert.equal(g.cfg.typeCount,expected.length,'active nut count at level '+n);
 assert.ok(g.cells.every(c=>!c||expected.includes(c.type)),'unavailable nut at '+n);
 assert.ok(g.cfg.objectives.every(o=>o.kind!=='collect'||expected.includes(o.color)),'locked collection target at '+n);
 assert.equal(E.matches(g).hit.size,0,'free starting match at '+n);
 assert.ok(E.hasMove(g),'unplayable start at '+n);
}
for(const [level,expected] of [[1,3],[14,3],[15,4],[34,4],[35,5],[40,5],[41,5],[79,5],[80,5],[100,5],[101,6],[200,6],[201,7],[300,7],[301,8],[400,8],[401,9],[500,9]]){
 const g=E.create(level,7777+level);
 assert.equal(g.cfg.typeCount,expected);
 const originalCount=Math.min(7,2+Math.ceil(level/100));
 assert.equal(g.cfg.newNut,level>1&&(level-1)%100===0?E.ORIGINAL[originalCount-1]:(E.NEW_INTRODUCTIONS.find(x=>x.level===level)?.name||null));
 let matched=false;
 for(let a=0;a<g.cells.length&&!matched;a++)for(const b of [a+1,a+g.cfg.width]){
  if(!E.adjacent(g,a,b))continue;
  const left=g.cells[a].type,right=g.cells[b].type;
  g.cells[a].type=right;g.cells[b].type=left;
  const ok=E.matches(g).hit.size>0;
  g.cells[a].type=left;g.cells[b].type=right;
  if(!ok)continue;
  E.swap(g,a,b);
  assert.ok(g.cells.every(c=>!c||g.cfg.roster.includes(c.type)),'refill or repair unlocked nuts prematurely at '+level);
  matched=true;break;
 }
 assert.ok(matched,'no scoring swap at '+level);
}
assert.equal(E.TYPES[6],'gold-acorn');
assert.ok(E.TYPES.includes('ginkgo-nut'),'Retired sprite identity stays stable in the protected catalog');
assert.deepEqual(E.RETIRED_NUTS,['ginkgo-nut']);
assert.equal(E.NEW_INTRODUCTIONS.length,11);
assert.deepEqual(E.NEW_INTRODUCTIONS.slice(0,2).map(x=>[x.level,x.name]),[[15,'coconut'],[35,'tiger-nut']]);
const seen=new Set();
for(let n=1;n<=500;n++){
 const roster=E.rosterForLevel(n);
 assert.ok(roster.length<=9,'Too many concurrent colors at stage '+n);
 assert.equal(new Set(roster).size,roster.length,'Duplicate active type at '+n);
 assert.ok(!roster.includes(E.TYPES.indexOf('ginkgo-nut')),'Closed pistachio appeared at stage '+n);
 assert.ok(!roster.some(i=>E.TYPES[i]==='rainbow-nut'),'Rainbow is special-only');
 const intro=E.NEW_INTRODUCTIONS.find(x=>x.level===n);
 if(intro){
  assert.ok(roster.includes(E.TYPES.indexOf(intro.name)),'New species must spawn on introduction stage '+n);
  assert.equal(E.makeLevel(n).newNut,intro.name);
  seen.add(intro.name);
 }
}
assert.equal(seen.size,11,'All approved non-duplicate standard varieties introduced');
assert.ok(E.rosterForLevel(35).includes(E.TYPES.indexOf('coconut')));
assert.ok(E.rosterForLevel(35).includes(E.TYPES.indexOf('tiger-nut')));
assert.equal(E.makeLevel(401).newNut,'gold-acorn','Chapter five introduces gold acorn');
console.log('PASS: playable nut roster, stage introductions and blocker-driven difficulty progression');
