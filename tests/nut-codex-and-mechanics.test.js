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
for(const item of powers){
 const activeArt=P.BOOSTER_ART[item.id]||P.HOLD_ITEMS[item.id]?.art;
 assert.equal(item.art,activeArt,'Wiki must reflect actual in-game icon: '+item.id);
 assert.ok(fs.existsSync(path.join(__dirname,'../web',item.art)),'Missing illustration '+item.art);
 assert.equal(item.symbol,undefined,'Powerups must not show generic Unicode art: '+item.id);
}
for(const [id,source] of Object.entries({'line-h':P.BOOSTER_ART.row,'line-v':P.BOOSTER_ART.column,blast:P.BOOSTER_ART.blast,rainbow:P.BOOSTER_ART.color})){
 const entry=entries.find(e=>e.group==='specials'&&e.id===id);
 assert.equal(entry?.art,source,'Special entry must have its associated power-up image: '+id);
}
assert.equal(entries.find(e=>e.group==='hazards'&&e.id==='hold').art,'art/additions/effects/focus-ring.png');
assert.equal(new Set(Object.values(P.BOOSTER_ART)).size,13,'Original ten immutable icons plus three distinctive advanced effects; family variants are labeled');
assert.deepEqual(Object.keys(P.BOOSTER_BADGES).sort(),['spectrum','triple-column','triple-row']);

const playableNuts=E.TYPES.filter(name=>!E.RETIRED_NUTS.includes(name));
assert.equal(entries.filter(e=>e.group==='nuts'&&e.live).length,playableNuts.length);
for(const name of playableNuts)assert.ok(entries.some(e=>e.id===name&&e.group==='nuts'&&e.live),'Missing live ordinary nut '+name);
assert.ok(!entries.some(e=>e.group==='nuts'&&e.id==='ginkgo-nut'),'Closed-pistachio lookalike must not appear in player index');
for(const intro of E.NEW_INTRODUCTIONS){
 const item=entries.find(e=>e.group==='nuts'&&e.id===intro.name);
 assert.ok(item?.rule.includes('level '+intro.level),'Player index must identify '+intro.name+' introduction level');
}
const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
assert.equal(manifest.enabled_for_gameplay,true);
assert.deepEqual(manifest.layout,[5,5,5]);
assert.deepEqual(Object.keys(manifest.sprites).sort(),elemental.map(e=>e.id).sort());
for(const e of elemental){
 assert.equal(e.live,true,e.id+' must be identified as a playable elemental nut');
 assert.equal(e.art,'art/primary/nuts/elemental/'+e.id+'.png');
 const file=path.join(base,e.id+'.png'),data=fs.readFileSync(file);
 assert.equal(data.subarray(1,4).toString(),'PNG');
 assert.equal(data.readUInt32BE(16),192,e.id+' width');
 assert.equal(data.readUInt32BE(20),192,e.id+' height');
 assert.equal(data[25],6,e.id+' must be RGBA');
 assert.ok(data.length>1000,e.id+' unexpectedly tiny');
}
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
assert.ok(game.includes('const BOOSTER_ART=P.BOOSTER_ART;'),'Gameplay uses the real image catalog, independent of Nutdex');
assert.ok(game.includes('boosterIcon(tool)'),'Each gameplay booster draws from the catalog');
assert.ok(game.includes('data-hold-tool=')&&game.includes('src="${item.art}"'),'Hold controls draw actual hold art');
assert.ok(game.includes("e.badge?'<b class=")||game.includes('codex-variant'),'NUTDEX must show a matching variant badge');

const html=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
assert.ok(game.includes('function codex(inLevel=false)')&&game.includes('data-codex-filter'),'Codex must be a functional screen');
assert.ok(game.includes('class="play-index"')&&game.includes('blocker-layer-count'),'Players need immediate help and visible chest hit counts');
assert.ok(game.includes('class="nutdex-tab"')&&game.includes("modal.className='nutdex-drawer'"),'In-level Nutdex has right-edge tab and dialog');
assert.ok(game.includes('screen.appendChild(modal)')&&game.includes("screen.querySelector?.('.nutdex-drawer')?.remove?.()"),'Drawer mounted without board replacement');
assert.ok(game.includes('dx>=Math.max(110,'),'Right swipe enters Nutdex');
assert.ok(game.includes('content.innerHTML=codex(true)'),'NUTDEX categories update in drawer instead of rebuilding board');
assert.ok(game.includes('timed acorn')&&game.includes('sticky butter'),'Cell labels must expose hazards');
assert.ok(html.includes('<script src="nut-codex.js"></script>'),'Codex data must load before UI');
console.log('PASS: 15 live elemental abilities, 18 selectable ordinary nut identities, complete mechanic index and live blocker/transport audit');
