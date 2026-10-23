const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../web/nut-codex.js');
const base=path.join(__dirname,'../web/art/tile-overlays');
const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
const names=Object.keys(manifest.sprites);
assert.equal(names.length,16,'Exactly 16 specialist tile overlay icons were approved');
const live=['bomb','sticky-butter','frost','chain-lock','arcane','poison','radiance','nature-vines','shadow','fire','water','storm','lightning','magma','crystal','void-rock'];
assert.deepEqual(Object.keys(manifest.live_bindings).sort(),['bomb','sticky-butter'],'previous imported package bindings remain preserved');
for(const name of names){
 const item=manifest.sprites[name],file=path.join(base,item.path);
 assert.ok(fs.existsSync(file),'Missing imported tile overlay: '+name);
 const data=fs.readFileSync(file);
 assert.equal(data.subarray(1,4).toString(),'PNG','Only PNG assets are supported');
 assert.equal(data.readUInt32BE(16),192,'Tile overlay must be 192px wide: '+name);
 assert.equal(data.readUInt32BE(20),192,'Tile overlay must be 192px tall: '+name);
 assert.equal(data[25],6,'Tile overlay must have true RGBA transparency: '+name);
 assert.ok(data.length>1000,'Tile overlay unexpectedly empty: '+name);
 const e=C.entries.find(e=>e.id==='tile-'+name&&e.group==='tile-effects');
 assert.ok(e,'NUTDEX Tile FX entry missing for '+name);
 assert.equal(e.live,live.includes(name),'All enabled tile status mechanics must be LIVE: '+name);
 assert.equal(e.art,'art/primary/overlays/'+name+'.png');
 const csv=fs.readFileSync(path.join(__dirname,'../docs/contracts/nutbuster-primary-mechanics-and-asset-lock.csv'),'utf8');
 const gitBlob=crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
 assert.ok(csv.includes(gitBlob),'Canonical CSV must protect actual binary identity: '+name);
}
const game=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../web/style.css'),'utf8');
for(const name of ['bomb','sticky-butter'])assert.ok(game.includes('art/primary/overlays/'+name+'.png'),'Hazard art not rendered: '+name);
for(const name of ['frost','chain-lock'])assert.ok(game.includes("?'"+name+"'"),'Missing pinned sprite mapping '+name);
assert.ok(game.includes('class="status-count"'),'Countdown must stay readable over bomb art');
assert.ok(css.includes('.cell .hazard.tile-status .status-art'),'Tile art must occupy the square without replacing the nut');
assert.ok(game.includes('piece(c.type)'),'Ordinary nut remains visible beneath tile overlay');
assert.ok(!game.includes("c.ice||c.lock||c.chest?'':piece(c.type)"),'Pinned cells must not hide the underlying nut');
assert.equal(C.entries.filter(e=>e.group==='tile-effects'&&e.live).length,16);
console.log('PASS: 16 PNG tile overlays, SHA contract, Nutdex previews, live status families and whole-piece separation');

/* Render both legal stackings: a tile status around a free nut, and a tile
   status around an anchored replacement piece. The status never supplies its
   own walnut, and a timed bomb retains its numeric readout. */
const vm=require('node:vm');
const E=require('../web/engine.js'),P=require('../web/progression.js'),
 H=require('../web/homestead.js'),A=require('../web/avatar-art.js'),
 M=require('../web/campaign-maps.js'),F=require('../web/board-features.js');
let page='';
const cssFlags={toggle(){},add(){},remove(){}};
const screen={classList:cssFlags,addEventListener(){},
 get innerHTML(){return page;},set innerHTML(v){page=v;},
 querySelector(){return null;},querySelectorAll(){return []}};
const document={getElementById(id){return ({
 screen,app:{classList:cssFlags},wallet:{},gems:{},
 toast:{classList:cssFlags,textContent:''}})[id]||null;},
 querySelector(){return null;},querySelectorAll(){return []}};
const window={NutDailyMoves:require('../web/daily-moves.js'),NutElementalChallenges:require('../web/elemental-challenges.js'),NutElementalRewards:require('../web/elemental-rewards.js'),NutEngine:E,NutProgress:P,NutHomestead:H,NutAvatarArt:A,NutCampaignMaps:M,NutBoardFeatures:F,NutCodex:C,addEventListener(){}};
vm.runInNewContext(game,{window,document,localStorage:{getItem(){return null;},setItem(){}},setTimeout(){},clearTimeout(){},console});
const app=window.NutbusterApp;app.start(110);const board=app.getState().game;
const free=board.cells.findIndex(c=>c&&!c.ice&&!c.lock&&!c.chest&&c.type!==null);
const covered=board.cells.findIndex(c=>c&&(c.ice||c.lock||c.chest));
assert.ok(free>=0&&covered>=0);
board.cells[free].jam=1;board.cells[covered].jam=1;
app.nav('home');app.nav('game');
function tile(i){const at=page.indexOf('data-cell="'+i+'"');return at<0?'':page.slice(at,page.indexOf('</button>',at));}
const regular=tile(free),shielded=tile(covered);
assert.match(regular,/class="piece"/,'Free nut is visible under a sticky overlay');
assert.match(regular,/art\/primary\/overlays\/sticky-butter.png/);
assert.doesNotMatch(regular,/blocker-sprite/,'Status must not fabricate a whole-piece blocker');
assert.match(shielded,/class="piece"/,'A pinned nut must remain visible through its hollow status overlay');
assert.match(shielded,/blocker-sprite/,'Original immovable blocker image remains visible');
assert.match(shielded,/art\/primary\/overlays\/sticky-butter.png/,'Tile status can coexist with whole-piece blocker');
app.start(210);
assert.match(page,/art\/primary\/overlays\/bomb.png/);
assert.match(page,/class="status-count">[0-9]+<\/b>/,'The acorn fuse still exposes its remaining turns');
console.log('PASS: tile status leaves ordinary nuts visible under both free and anchored surfaces without changing their identity');
