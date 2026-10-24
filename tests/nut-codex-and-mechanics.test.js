const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../web/engine.js'),F=require('../web/board-features.js'),C=require('../web/nut-codex.js');
const base=path.join(__dirname,'../web/art/primary/nuts/elemental');
const entries=C.entries,elemental=entries.filter(e=>e.group==='elemental');
assert.equal(elemental.length,15,'only approved 3×5 art is registered');
assert.equal(entries.filter(e=>e.group==='tile-effects').length,16,'All sixteen tile overlay sprites need a Nutdex entry');
assert.equal(entries.filter(e=>e.group==='tile-effects'&&e.live).length,16,'All sixteen approved overlays have live mechanics');
assert.ok(entries.some(e=>e.id==='tile-chain-lock'&&e.live),'Pinned chain overlays must be indexed as live');
assert.deepEqual(C.groups.map(g=>g[0]),['nuts','elemental','specials','blockers','tile-effects','hazards','board','boosters']);
const P=require('../web/progression.js');
const powers=entries.filter(e=>e.group==='boosters');
assert.deepEqual(powers.map(e=>e.id).sort(),[...E.BOOSTERS,...Object.keys(P.HOLD_ITEMS)].sort(),'Index all sixteen boosters and both hold tools');
const playableNuts=E.TYPES.filter(name=>!E.RETIRED_NUTS.includes(name));
assert.equal(entries.filter(e=>e.group==='nuts'&&e.live).length,playableNuts.length);
for(const name of playableNuts)assert.ok(entries.some(e=>e.id===name&&e.group==='nuts'&&e.live),'Missing live ordinary nut '+name);
assert.ok(!entries.some(e=>e.group==='nuts'&&e.id==='ginkgo-nut'),'Closed-pistachio lookalike must not appear in player index');
for(const intro of E.NEW_INTRODUCTIONS){
 const item=entries.find(e=>e.group==='nuts'&&e.id===intro.name);
 assert.ok(item?.rule.includes('level '+intro.level),'Player index must identify '+intro.name+' introduction level');
}
for(const item of elemental)assert.equal(item.live,true,'Elemental ability must be available in Nutdex: '+item.id);
const live=(id,group)=>entries.find(e=>e.id===id&&e.group===group&&e.live);
for(const id of ['ice','chain','chest','jam','fuse','hold','conveyor','portal','wind','line-h','line-v','blast','rainbow'])
 assert.ok(entries.some(e=>e.id===id&&e.live),'Absent current mechanic '+id);
for(const id of ['crate','rock'])assert.ok(entries.some(e=>e.id===id&&e.live===false),'Do not promise '+id+' mechanic');
{
 const g=E.create(3,3390),i=g.cells.findIndex(c=>c&&c.ice>=3);assert.ok(i>=0);
 // Force this fixture to two hits to test shield priority independently of
 // the new campaign difficulty schedule, which uses three-hit early ice.
 g.cells[i].ice=2;
 g.cells[i].jam=1;
 E.booster(g,'row',i);assert.equal(g.cells[i].jam,0);assert.equal(g.cells[i].ice,2,'butter must shield ice');
 E.booster(g,'row',i);assert.ok(g.cells[i].ice<=1,'second row strike and any earned cascades must crack ice');
 E.booster(g,'row',i);assert.equal(g.cells[i].ice,0,'second blow breaks ice');
}
{
 const g=E.create(49,4990),i=g.cells.findIndex(c=>c&&c.lock>0);assert.ok(i>=0);
 g.cells[i].jam=1;assert.equal(E.booster(g,'unlock',-1).valid,true);
 assert.ok(g.cells.every(c=>!c||c.lock===0),'Master Key must bypass butter');
}
{
 const g=E.create(84,8440),i=g.cells.findIndex(c=>c&&c.chest>0);assert.ok(i>=0);
 let before=g.progress.chests;E.booster(g,'hammer',i);assert.ok(g.progress.chests>=before+2,'Hammer removes both chest layers');
}
{
 const g=E.create(110,1100);
 for(const c of g.cells)if(c){c.aura=null;c.auraTurns=0;c.poison=0;}
 const before=g.cells.filter(c=>c?.jam).length;
 for(let n=0;n<3;n++)E.advanceHazards(g,{valid:true,won:false,lost:false,stages:[]});
 assert.ok(g.cells.filter(c=>c?.jam).length>before,'butter spreads on third turn');
}
{
 const g=E.create(210,2100),initial=g.moves,bombs=g.cells.filter(c=>c?.fuse).length;
 for(let n=0;n<g.cfg.fuseTurns;n++)E.advanceHazards(g,{valid:true,won:false,lost:false,stages:[]});
 assert.equal(g.moves,Math.max(0,initial-2*bombs),'timed acorns cost two moves each');
}
{
 const g=E.create(164,1640),pair=g.cfg.features.portals[0].indices,before=E.snapshot(g).cells;
 F.advance(g,3,()=>E.snapshot(g).cells);
 assert.equal(g.cells[pair[0]].type,before[pair[1]].type);
}
{
 const g=E.create(301,3010),before=E.snapshot(g).cells,stages=F.advance(g,2,()=>E.snapshot(g).cells);
 assert.ok(stages.some(s=>s.mode==='wind'),'wind tunnel must transport real nut payloads');
}
const game=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
assert.ok(game.includes('function codex(inLevel=false)')&&game.includes('data-codex-filter'),'Codex must be a functional screen');
assert.ok(game.includes('class="nutdex-tab"')&&game.includes("modal.className='nutdex-drawer'"),'In-level Nutdex has right-edge tab and dialog');
assert.ok(game.includes('screen.appendChild(modal)')&&game.includes("screen.querySelector?.('.nutdex-drawer')?.remove?.()"),'Drawer mounted without board replacement');
assert.ok(game.includes('dx>=Math.max(110,'),'Right swipe enters Nutdex');
assert.ok(game.includes('content.innerHTML=codex(true)'),'NUTDEX categories update in drawer instead of rebuilding board');
assert.ok(game.includes('timed acorn')&&game.includes('sticky butter'),'Cell labels must expose hazards');
assert.ok(html.includes('<script src="nut-codex.js"></script>'),'Codex data must load before UI');
console.log('PASS: 15 live elemental abilities, 18 selectable ordinary nut identities, complete mechanic index and live blocker/transport audit');
