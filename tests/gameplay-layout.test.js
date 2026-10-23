// Compact gameplay must stay usable on small portrait devices without a
// scroll-only booster belt or a second navigation row.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path');
const read=(p)=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const E=require('../web/engine.js'),P=require('../web/progression.js');
const H=require('../web/homestead.js'),A=require('../web/avatar-art.js');
const M=require('../web/campaign-maps.js'),F=require('../web/board-features.js');
const index=read('web/index.html'),css=read('web/style.css');
const navbar=index.match(/<nav class="bottom"[\s\S]*?<\/nav>/)?.[0]||'';
assert.equal((navbar.match(/data-nav=/g)||[]).length,6,'Six reachable footer destinations');
assert.equal((navbar.match(/<img class="nav-icon(?: [^"]+)?"/g)||[]).length,6,'All six tabs use authored image art');
assert.match(css,/\.bottom\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/,'Six footer tabs must fit one row');
assert.match(css,/\.boosters\{display:grid!important;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/,
 'All ten tools should be visible in two grid rows');
assert.match(css,/#app\.playing \.game-active \.boosters\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/,'12 powers must remain two compact rows');
assert.match(css,/grid-template-rows:repeat\(var\(--rows\),minmax\(0,1fr\)\)/,'Board must honor actual stage height');
let html='',appPlaying=false;
const screen={classList:{toggle(){}},addEventListener(){},get innerHTML(){return html;},set innerHTML(value){html=value;},querySelector:()=>null,querySelectorAll:()=>[]};
const wallet={textContent:''},gems={textContent:''},toast={textContent:'',classList:{add(){},remove(){}}};
const document={
 getElementById:id=>({screen,wallet,gems,toast,app:{classList:{toggle(name,value){if(name==='playing')appPlaying=value;}}}}[id]||null),
 querySelectorAll:()=>[],querySelector:()=>null
};
const window={NutDailyMoves:require('../web/daily-moves.js'),NutElementalChallenges:require('../web/elemental-challenges.js'),NutElementalRewards:require('../web/elemental-rewards.js'),NutEngine:E,NutProgress:P,NutHomestead:H,NutAvatarArt:A,
 NutCampaignMaps:M,NutBoardFeatures:F,addEventListener(){}};
const localStorage={getItem:()=>null,setItem(){}};
vm.runInNewContext(read('web/game.js'),{window,document,localStorage,setTimeout(){},clearTimeout(){},console});
const app=window.NutbusterApp;
for(const level of [1,10,30,70,100,200,500]){
 // Independent layout fixture: reset the finite heart allowance between stages.
 app.getSave().hearts=5;app.start(level);const g=app.getState().game;
 assert.ok(appPlaying,'Play layout flag should be present');
 assert.match(html,new RegExp('aria-label="LEVEL '+level+':'));
 assert.equal((html.match(/data-tool=/g)||[]).length,16,'Ten primary and six advanced boosters present for level '+level);
 assert.equal((html.match(/data-hold-tool=/g)||[]).length,2,'Two gravity holds visible for level '+level);
 assert.equal((html.match(/class="booster-icon"/g)||[]).length,16,'Each power has a clear graphic');
 assert.equal((html.match(/data-cell=/g)||[]).length,g.cfg.mask.filter(Boolean).length);
 assert.ok(html.includes('--rows:'+g.cfg.height),'Board rows match stage dimensions');
 assert.ok(!html.includes('game-actions'),'Extra controls should be in compact overflow menu');
 for(const [vw,vh] of [[320,568],[360,640],[360,800],[412,915]]){
  // Same CSS height limits used by the play board at portrait viewports.
  const height=Math.min(vh-284,vw*g.cfg.height/g.cfg.width-14,545*g.cfg.height/g.cfg.width);
  const width=height*g.cfg.width/g.cfg.height;
  assert.ok(width<=vw-11,'Board overflows horizontally at '+vw+'x'+vh);
  const contentHeight=vh-36-43-3;
  const hudAndTools=31+28+17+106+4*3;
  assert.ok(height+hudAndTools<=contentHeight,'Board or powers clipped at '+vw+'x'+vh+' level '+level);
 }
}
// Regression for the photographed Android level-14 layout: the six-row,
// five-column board has 12 deliberate void cells. Alternating :nth-child
// tile artwork must NEVER repaint those empty grid slots.
const voidCSS=css.split('.board .cell.void{')[1]?.split('}')[0];
assert.ok(voidCSS,'Explicit board-void selector required to override alternating tile art');
assert.match(voidCSS,/background-image:none!important/,'void slots cannot inherit tile artwork');
assert.match(voidCSS,/background-color:transparent!important/,'void slots reveal the board surface');
assert.match(voidCSS,/pointer-events:none/,'void slots are never tappable');
app.start(14);
const masked=E.makeLevel(14).mask.filter(yes=>!yes).length;
assert.equal(masked,12,'level 14 has twelve masked-out tiles');
assert.equal((html.match(/class="cell void"/g)||[]).length,masked,'all void cells must use the transparent slot style');
assert.equal((html.match(/data-cell=/g)||[]).length,18,'only eighteen real tiles can receive input');
app.nav('home');assert.equal(appPlaying,false,'Leaving the play screen restores normal navigation');
console.log('PASS: compact full-height gameplay, ten visible power icons, six-column nav, responsive stage board geometry');
