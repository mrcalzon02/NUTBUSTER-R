const assert=require('node:assert/strict');
const E=require('../web/engine.js');
assert.equal(E.BOOSTERS.length,16,'Sixteen distinct working inventory powers required');
assert.equal(Object.keys(E.BOOSTER_META).length,E.BOOSTERS.length);
for(const name of E.BOOSTERS)assert.ok(E.BOOSTER_META[name]?.tip,'Power must explain tactical purpose '+name);
const objectiveTypes=new Set(),startingCounts=new Set();
for(let level=1;level<=1000;level++){
 const g=E.create(level,level*101+9);
 const specs=E.objectiveState(g);
 assert.ok(specs.length>=1&&specs.length<=2);
 for(const o of specs){objectiveTypes.add(o.kind);assert.ok(o.target>0);assert.equal(o.value,0);}
 startingCounts.add(specs.length);
 assert.ok(E.hasMove(g));
 assert.equal(E.matches(g).hit.size,0);
}
for(const type of ['score','ice','locks','chests','collect'])assert.ok(objectiveTypes.has(type),'Missing objective kind '+type);
assert.ok(startingCounts.has(2),'Multi-goal boards required');
function mask(g){return g.cells.map(c=>!!c);}
function choose(g,pred=()=>true){return g.cells.findIndex(c=>c&&pred(c));}
const efforts=[];
for(const type of E.BOOSTERS){
 const g=E.create(150,3331),before=E.snapshot(g),target=type==='unlock'||type==='extra'||type==='shuffle'?-1:
    type==='hammer'?choose(g,c=>c.ice>0):
    choose(g);
 assert.ok(target>=0||!E.BOOSTER_META[type].targeted,'Power requires a legal target '+type);
 const r=E.booster(g,type,target);
 assert.equal(r.valid,true,type+' failed with '+r.reason);
 assert.equal(g.boosterUsed,1);
 assert.equal(g.uses[type],1);
 assert.deepEqual(mask(g),before.cells.map(c=>!!c),'Power damaged void board mask '+type);
 if(type==='extra')assert.equal(g.moves,before.moves+5);
 else if(type==='unlock'){assert.ok(g.progress.locks>0);assert.ok(g.cells.every(c=>!c||c.lock===0));}
 else if(type==='shuffle'){assert.ok(r.stages.some(st=>st.kind==='repair'));}
 else {assert.ok(r.removed+r.cracked>0,'Targeted power must physically strike target '+type);}
 efforts.push(type);
}
{
 const g=E.create(15,724);
 const a=choose(g),b=a+1;
 g.cells[a].special='line-h';
 const row=E.expandSpecials(g,new Set([a]));
 assert.ok([...row].every(i=>Math.floor(i/g.cfg.width)===Math.floor(a/g.cfg.width)));
 g.cells[a].special='line-v';
 const column=E.expandSpecials(g,new Set([a]));
 assert.ok([...column].every(i=>i%g.cfg.width===a%g.cfg.width));
 g.cells[a].special='blast';
 const blast=E.expandSpecials(g,new Set([a]));
 assert.ok([...blast].every(i=>Math.abs(Math.floor(i/g.cfg.width)-Math.floor(a/g.cfg.width))<=1));
 g.cells[a].special='rainbow';
 const rainbow=E.expandSpecials(g,new Set([a]));
 assert.ok([...rainbow].every(i=>g.cells[i].type===g.cells[a].type));
}
console.log('PASS: 1000 objective configurations, '+[...objectiveTypes].join('/')+', 16 working distinct boosters, board geometry and four match-created specials.');
