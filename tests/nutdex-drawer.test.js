/* A Nutdex inspection never navigates off or replaces the active puzzle DOM. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../web/engine.js'),P=require('../web/progression.js');
const H=require('../web/homestead.js'),A=require('../web/avatar-art.js');
const M=require('../web/campaign-maps.js'),C=require('../web/nut-codex.js');
const source=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
let html='',modal=null,renders=0;const handlers={};
const classes={toggle(){},add(){},remove(){}};
const screen={
 classList:classes,addEventListener(type,fn){handlers[type]=fn},
 get innerHTML(){return html;},set innerHTML(markup){html=markup;renders++;},
 appendChild(element){modal=element;},
 querySelector(selector){
  if(selector==='.nutdex-drawer')return modal;
  if(selector==='.nutdex-content')return modal?.content||null;
  return null;
 },querySelectorAll(){return [];}
};
const document={
 getElementById(id){return ({screen,toast:{textContent:'',classList:classes},app:{classList:classes},wallet:{},gems:{}})[id]||null;},
 querySelectorAll(){return [];},querySelector(){return null;},
 createElement(tag){return {
  tagName:tag,attrs:{},content:{innerHTML:''},
  setAttribute(key,value){this.attrs[key]=value;},
  querySelector(selector){return selector==='.nutdex-content'?this.content:selector.includes('nutdex-close')?{focus(){}}:null;},
  remove(){modal=null;}
 };}
};
const window={NutDailyMoves:require('../web/daily-moves.js'),NutElementalChallenges:require('../web/elemental-challenges.js'),NutElementalRewards:require('../web/elemental-rewards.js'),NutEngine:E,NutProgress:P,NutHomestead:H,NutAvatarArt:A,NutCampaignMaps:M,NutCodex:C,innerWidth:360,addEventListener(){}};
vm.runInNewContext(source,{window,document,localStorage:{getItem(){return null;},setItem(){}},setTimeout(){return 0;},clearTimeout(){},console});
const app=window.NutbusterApp;app.start(49);
const game=app.getState().game;
const frozen=JSON.stringify(E.snapshot(game)),draws=renders;
const click=data=>handlers.click({target:{closest(){return {dataset:data};}}});
assert.match(html,/class="nutdex-tab"/,'The right-edge handle must be in the game screen');
click({action:'nutdex-open'});
assert.ok(modal,'NUTDEX must be mounted over the level');
assert.equal(modal.attrs['aria-modal'],'true');
assert.ok(modal.innerHTML.includes('NUTDEX'),'Index content is visible');
assert.equal(renders,draws,'Opening must never rebuild the board');
assert.equal(app.getState().game,game,'Opening must preserve the game identity');
assert.equal(JSON.stringify(E.snapshot(game)),frozen,'Opening consumes no turn');
click({action:'codex-tab',group:'hazards'});
assert.equal(app.getState().codexTab,'hazards');
assert.ok(modal.content.innerHTML.includes('Sticky Peanut Butter'));
assert.equal(renders,draws,'Switching categories must not repaint the puzzle');
click({action:'nutdex-close'});
assert.equal(modal,null,'Close removes the overlay');
assert.equal(app.getState().nutdexOpen,false);
handlers.pointerdown({target:{closest(selector){return selector==='[data-cell]'?{dataset:{cell:'0'}}:null;}},clientX:0,clientY:30});
handlers.pointerup({clientX:170,clientY:31});
assert.ok(modal,'A long right swipe must open the drawer');
assert.equal(renders,draws,'Right swipe must not replace the board');
assert.equal(JSON.stringify(E.snapshot(game)),frozen,'Right swipe may not swap nuts or consume moves');
console.log('PASS: Nutdex open/category/close/right-swipe preserve board DOM, state and move count');
