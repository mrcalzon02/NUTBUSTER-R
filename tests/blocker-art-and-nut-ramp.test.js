// Real sprites must be wired to board cells, and nut difficulty must grow by campaign.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../web/engine.js'),P=require('../web/progression.js'),H=require('../web/homestead.js');
const A=require('../web/avatar-art.js'),M=require('../web/campaign-maps.js'),F=require('../web/board-features.js');
const root=path.join(__dirname,'..');
for(const asset of ['nuts/gold-acorn.png','blockers/ice-1.png','blockers/ice-2.png','blockers/chain-1.png','blockers/chest.png'])
 assert.ok(fs.existsSync(path.join(root,'web/art/primary',asset)),asset+' must be shipped');
for(let n=1;n<=500;n++){
 const expected=Math.min(7,2+Math.ceil(n/100)),g=E.create(n,n*37+99);
 assert.equal(g.cfg.typeCount,expected,'active nut count at level '+n);
 assert.ok(g.cells.every(c=>!c||c.type>=0&&c.type<expected),'unavailable nut at '+n);
 assert.ok(g.cfg.objectives.every(o=>o.kind!=='collect'||o.color<expected),'locked collection target at '+n);
 assert.equal(E.matches(g).hit.size,0,'free starting match at '+n);
 assert.ok(E.hasMove(g),'unplayable start at '+n);
}
for(const [level,expected] of [[1,3],[100,3],[101,4],[200,4],[201,5],[300,5],[301,6],[400,6],[401,7],[500,7]]){
 const g=E.create(level,7777+level);
 assert.equal(g.cfg.typeCount,expected);
 assert.equal(g.cfg.newNut,level>1&&(level-1)%100===0?E.TYPES[expected-1]:null);
 let matched=false;
 for(let a=0;a<g.cells.length&&!matched;a++)for(const b of [a+1,a+g.cfg.width]){
  if(!E.adjacent(g,a,b))continue;
  const left=g.cells[a].type,right=g.cells[b].type;
  g.cells[a].type=right;g.cells[b].type=left;
  const ok=E.matches(g).hit.size>0;
  g.cells[a].type=left;g.cells[b].type=right;
  if(!ok)continue;
  E.swap(g,a,b);
  assert.ok(g.cells.every(c=>!c||c.type<expected),'refill or repair unlocked nuts prematurely at '+level);
  matched=true;break;
 }
 assert.ok(matched,'no scoring swap at '+level);
}
assert.equal(E.TYPES[6],'gold-acorn');
let html='';
const screen={classList:{toggle(){}},addEventListener(){},get innerHTML(){return html;},set innerHTML(value){html=value;},querySelector:()=>null,querySelectorAll:()=>[]};
const wallet={textContent:''},gems={textContent:''},toast={textContent:'',classList:{add(){},remove(){}}};
const document={getElementById:id=>({screen,wallet,gems,toast,app:{classList:{toggle(){}}}}[id]||null),querySelectorAll:()=>[],querySelector:()=>null};
const window={NutEngine:E,NutProgress:P,NutHomestead:H,NutAvatarArt:A,NutCampaignMaps:M,NutBoardFeatures:F,addEventListener(){}};
const localStorage={getItem:()=>null,setItem(){}};
vm.runInNewContext(fs.readFileSync(path.join(root,'web/game.js'),'utf8'),{window,document,localStorage,setTimeout(){},clearTimeout(){},console});
const app=window.NutbusterApp;
app.start(3);
assert.match(html,/art\/primary\/blockers\/ice-2\.png/);
assert.doesNotMatch(html,/class="overlay ice">❄/,'no gray frost emoji placeholder');
const icy=app.getState().game.cells.find(c=>c?.ice);
assert.ok(icy);icy.ice=1;app.nav('home');app.nav('game');
assert.match(html,/art\/primary\/blockers\/ice-1\.png/,'damaged ice has distinct art');
app.start(49);assert.match(html,/art\/primary\/blockers\/chain-1\.png/);
app.start(77);assert.match(html,/art\/primary\/blockers\/chest\.png/);
app.start(401);assert.match(html,/NEW NUT: GOLD ACORN!/);
assert.match(fs.readFileSync(path.join(root,'web/style.css'),'utf8'),/\.overlay\.blocker-art .blocker-sprite/);
console.log('PASS: blocker artwork and 3–7 matchable nut types across all 500 stages');
