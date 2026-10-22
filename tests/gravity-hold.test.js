const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const E=require('../web/engine.js'),P=require('../web/progression.js'),F=require('../web/board-features.js');
assert.equal(E.HOLD_DROPS.butter_hold,1);assert.equal(E.HOLD_DROPS.jam_hold,2);
const save={gems:45,stars:{}};P.migrate(save);
assert.equal(P.holdCount(save,'jam_hold'),0);
assert.equal(P.buyHold(save,'jam_hold').valid,true);assert.equal(save.gems,15);
assert.equal(P.holdCount(save,'jam_hold'),1);
assert.equal(P.buyHold(save,'jam_hold').valid,false);assert.equal(save.gems,15);
assert.equal(P.buyHold(save,'butter_hold').valid,true);assert.equal(save.gems,0);
assert.equal(P.spendHold(save,'jam_hold'),true);assert.equal(P.spendHold(save,'jam_hold'),false);
assert.equal(P.holdCount(save,'jam_hold'),0);
const g=E.create(45,4242),at=g.cells.findIndex(c=>c&&!c.ice&&!c.lock&&!c.jam&&!c.chest);
assert.ok(at>=0);assert.equal(E.applyHold(g,'jam_hold',at).valid,true);
assert.equal(E.applyHold(g,'jam_hold',at).valid,false,'do not double-spend already-held nut');
E.gravity(g,[]);assert.equal(g.cells[at].hold,2,'no real drop: no expiry');
const other=g.cells.findIndex((c,i)=>i!==at&&c&&c.type!==null);
g.cells[other].type=null;const falls=[];E.gravity(g,falls);
assert.ok(falls.length>0);assert.equal(g.cells[at].hold,1);
const snap=E.snapshot(g).cells;assert.equal(snap[at].hold,1);
const other2=g.cells.findIndex((c,i)=>i!==at&&c&&c.type!==null);
g.cells[other2].type=null;E.gravity(g,[]);
assert.equal(g.cells[at].hold,0,'jam expires after exactly two refills');
assert.ok(g.cells.every(c=>!c||c.type!==null),'no playable cells left empty');
for(const [level,turn,key] of [[126,2,'conveyors'],[164,3,'portals'],[301,2,'wind']]){
 const state=E.create(level,1477),lane=state.cfg.features[key][0];
 if(!lane)continue;
 const target=lane.indices[0];assert.equal(E.applyHold(state,'jam_hold',target).valid,true);
 const stages=F.advance(state,turn,()=>E.snapshot(state).cells);
 assert.ok(stages.length>0);assert.equal(state.cells.filter(c=>c?.hold>0).length,1);
 assert.equal(state.cells.find(c=>c?.hold>0).hold,2,'transport may move, but cannot consume drops');
}
const board=E.create(12,8334),anchors=board.cells.map((c,i)=>c?i:-1).filter(i=>i>=0).slice(0,3);
assert.equal(E.applyHold(board,'jam_hold',anchors[0]).valid,true);
assert.equal(E.applyHold(board,'butter_hold',anchors[1]).valid,true);
const mask=board.cells.map(Boolean);
board.cells[anchors[2]].type=null;E.gravity(board,[]);
assert.deepEqual(board.cells.map(Boolean),mask,'hole mask preserved');
assert.ok(board.cells.every(c=>!c||c.type!==null));
function prepared(){
 const q=E.create(1,259),w=q.cfg.width;
 for(let i=0;i<q.cells.length;i++)if(q.cells[i]){
  q.cells[i].type=(Math.floor(i/w)+i%w)%2;
  q.cells[i].ice=2;q.cells[i].hold=0;
 }
 for(let i=0;i<3;i++)q.cells[i].type=0;
 return q;
}
const normal=prepared(),held=prepared();
assert.equal(E.applyHold(held,'jam_hold',0).valid,true);
const w=normal.cfg.width,from=normal.cells.length-w,to=from+1;
assert.ok(E.adjacent(normal,from,to));
const base=E.swap(normal,from,to),boosted=E.swap(held,from,to);
assert.equal(base.valid,true);assert.equal(boosted.valid,true);
assert.equal(held.score-normal.score,120*(1+2+3),'each held match adds only its own 2×60 bonus per cascade multiplier');
assert.equal(normal.cells[0].ice,0);assert.equal(held.cells[0].hold,0,'a matched/cleared held nut loses its hold');
// Held special-nut identity, duration and artwork state survive shuffling.
const sh=E.create(85,720),shAt=sh.cells.findIndex(c=>c&&!c.ice&&!c.lock);
sh.cells[shAt].special='line-h';
assert.equal(E.applyHold(sh,'jam_hold',shAt).valid,true);
assert.equal(E.shuffle(sh),true);
const survivor=sh.cells.filter(c=>c?.hold>0);
assert.equal(survivor.length,1,'shuffling must preserve exactly one held payload');
assert.equal(survivor[0].special,'line-h','special must travel with held nut');
assert.equal(survivor[0].hold,2,'shuffling is not a gravity event');
// Anchors in the interior split both sides of the same column. No gaps or
// phantom moves are allowed even when vacancies touch both ends of the anchor.
const anchored=E.create(1,903),aw=anchored.cfg.width,anchor=2*aw;
for(const c of anchored.cells)if(c){c.type=1;c.hold=0;}
anchored.cells[anchor].hold=2;
anchored.cells[anchor-aw].type=null;
anchored.cells[anchor+aw].type=null;
const anchorDrops=[];E.gravity(anchored,anchorDrops);
assert.equal(anchored.cells[anchor].type,1,'the held nut stays anchored through refill');
assert.equal(anchored.cells[anchor].hold,1,'only one gravity drop consumed');
assert.equal(anchorDrops.filter(f=>f.from===anchor).length,0,'anchor never fell');
assert.ok(anchored.cells.every(c=>!c||c.type!==null),'both sides refilled, no blank cells');
// A rejected hold target must not mutate board or consume stock.
const invalidHold=E.create(12,913),voidAt=invalidHold.cells.findIndex(c=>!c);
assert.ok(voidAt>=0);
const initial=JSON.stringify(E.snapshot(invalidHold));
assert.equal(E.applyHold(invalidHold,'jam_hold',voidAt).valid,false);
assert.equal(JSON.stringify(E.snapshot(invalidHold)),initial,'invalid target cannot alter state');
const index=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../web/style.css'),'utf8');
const game=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
assert.ok(css.includes('grid-template-columns:repeat(6,minmax(0,1fr))'),'twelve powers remain in two rows');
assert.match(game,/data-action="hold-buy"/);
assert.match(game,/data-action="hold-cancel"/);
assert.match(game,/data-hold-tool=/);
assert.match(game,/class="hold-marker"/);
assert.match(index,/src="game.js"/);
let html='',handlers={},store={};
const screen={classList:{toggle(){}},addEventListener:(type,handler)=>handlers[type]=handler,
 get innerHTML(){return html},set innerHTML(v){html=v},querySelector(){return null},querySelectorAll(){return []}};
const toast={textContent:'',classList:{add(){},remove(){}}};
const document={getElementById:id=>({screen,toast,app:{classList:{toggle(){}}},wallet:{},gems:{}}[id]||null),querySelectorAll(){return []},querySelector(){return null}};
const win={NutEngine:E,NutProgress:P,NutHomestead:require('../web/homestead.js'),NutAvatarArt:require('../web/avatar-art.js'),NutCampaignMaps:require('../web/campaign-maps.js'),NutBoardFeatures:F,addEventListener(){}};
vm.runInNewContext(game,{window:win,document,localStorage:{getItem:k=>store[k],setItem:(k,v)=>store[k]=v},clearTimeout(){},setTimeout(){},console});
const app=win.NutbusterApp;app.nav('shop');
assert.match(html,/data-action="hold-offer" data-hold-id="butter_hold"/);
assert.match(html,/data-action="hold-offer" data-hold-id="jam_hold"/);
function click(dataset){handlers.click({target:{closest:()=>({dataset})}})}
const before=app.getSave().gems;
click({action:'hold-offer',holdId:'butter_hold'});
assert.match(html,/data-action="hold-buy"/);
assert.equal(app.getSave().gems,before,'offer does not charge gems');
click({action:'hold-cancel'});assert.equal(app.getSave().gems,before);
click({action:'hold-offer',holdId:'butter_hold'});
click({action:'hold-buy',holdId:'butter_hold'});
assert.equal(app.getSave().gems,before-P.HOLD_ITEMS.butter_hold.gems);
assert.equal(P.holdCount(app.getSave(),'butter_hold'),1);
assert.ok(store['nutbuster.v1'],'purchase saved');
app.start(40);
assert.equal((html.match(/data-hold-tool=/g)||[]).length,2);
const i=app.getState().game.cells.findIndex(c=>c&&c.type!==null);
click({holdTool:'butter_hold'});click({cell:String(i)});
assert.equal(app.getState().game.cells[i].hold,1);
assert.equal(P.holdCount(app.getSave(),'butter_hold'),0);
console.log('PASS: gravity-held nuts, score multiplier, refill timing, transport, voids, gem confirmation and twelve illustrated power controls');
