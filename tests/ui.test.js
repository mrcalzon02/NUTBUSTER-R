const assert=require('node:assert/strict'),E=require('../web/engine.js'),P=require('../web/progression.js'),M=require('../web/campaign-maps.js'),H=require('../web/homestead.js');
const js=require('node:fs').readFileSync('web/game.js','utf8');
const classes=()=>{let names=new Set();return {add:x=>names.add(x),remove:x=>names.delete(x),contains:x=>names.has(x),toggle:(x,v)=>v?names.add(x):names.delete(x)};};
let html='',renders=0,clickHandler,boardCells=[];
const refs={wallet:{textContent:''},gems:{textContent:''},'play-wallet':{textContent:''},'play-gems':{textContent:''},toast:{textContent:'',classList:classes()},
 score:{textContent:''},moves:{textContent:''},progress:{style:{}}};
const board={getBoundingClientRect:()=>({top:0,left:0,width:450,height:450}),appendChild:()=>{},
 querySelector(s){const i=Number(s.match(/data-cell="(\d+)"/)?.[1]);const el=boardCells[i];return s.includes('nut-visual')?el?.visual:el||null;},
 querySelectorAll(s){return s==='.clearing'?boardCells.filter(x=>x?.classList.contains('clearing')):[];}};
const screen={classList:classes(),addEventListener:(k,f)=>{if(k==='click')clickHandler=f;},
 get innerHTML(){return html;},set innerHTML(v){html=v;renders++;},
 querySelector(s){if(s==='.board')return app.getState().page==='game'?board:null;
 if(s==='.cell.selected')return boardCells.find(x=>x?.classList.contains('selected'))||null;
 const m=s.match(/data-cell="(\d+)"/);if(m)return boardCells[Number(m[1])]||null;
 if(s.includes('data-stat="score"'))return refs.score;if(s.includes('data-stat="moves"'))return refs.moves;
 if(s.includes('data-progress'))return refs.progress;return null;},
 querySelectorAll:s=>s==='.nut-visual'?boardCells.filter(Boolean).map(x=>x.visual):[]
};
const currencyLinks=Array.from({length:2},()=>({dataset:{nav:'shop'},addEventListener(type,fn){if(type==='click')this.tap=fn;}}));
const document={getElementById:id=>id==='screen'?screen:refs[id],querySelectorAll:selector=>selector==='[data-nav]'?currencyLinks:[],createElement:()=>({style:{},innerHTML:'',remove(){}})};
const window={NutDailyMoves:require('../web/daily-moves.js'),NutElementalChallenges:require('../web/elemental-challenges.js'),NutElementalRewards:require('../web/elemental-rewards.js'),NutEngine:E,NutBenefits:require('../web/benefits.js'),NutPurchases:require('../web/purchase-disclosures.js'),NutProgress:P,NutHomestead:H,NutAvatarArt:require('../web/avatar-art.js'),NutCampaignMaps:M,addEventListener:()=>{},matchMedia:()=>({matches:true})};
const saveStore={};const localStorage={getItem:k=>saveStore[k]??null,setItem:(k,v)=>{saveStore[k]=v;}};
require('node:vm').runInNewContext(js,{window,document,localStorage,setTimeout:fn=>{if(typeof fn==='function')Promise.resolve().then(fn);return 0;},clearTimeout:()=>{},requestAnimationFrame:f=>f(),console});
const app=window.NutbusterApp, state=app.getState;
const click=data=>clickHandler({target:{dataset:data,closest:()=>({dataset:data})}});
function attach(){const g=state().game;boardCells=g.cells.map((c,i)=>!c?null:{
 dataset:{nutKey:c.type+':'+(c.special||''),blockKey:c.ice+':'+c.lock+':'+c.chest},classList:classes(),style:{},
 visual:{outerHTML:'<span class="nut-visual"></span>',style:{}},querySelector(s){return s==='.nut-visual'?this.visual:null;},
 querySelectorAll:()=>[],insertAdjacentHTML:()=>{},setAttribute:()=>{},
 getBoundingClientRect:()=>({left:(i%g.cfg.width)*51,top:Math.floor(i/g.cfg.width)*51,width:50,height:50})});}
function findSwap(g,wantMatch){for(let a=0;a<g.cells.length;a++)for(let b of [a+1,a+g.cfg.width]){
 if(!E.adjacent(g,a,b))continue;const x=g.cells[a].type,y=g.cells[b].type;
 g.cells[a].type=y;g.cells[b].type=x;const match=E.matches(g).hit.size>0;
 g.cells[a].type=x;g.cells[b].type=y;if(match===wantMatch)return [a,b];}throw Error('Swap unavailable');}
async function settle(){for(let i=0;i<125;i++)await Promise.resolve();}
async function run(){
 assert.ok(!html.includes('Everything is free'));
 const initialRenders=renders;currencyLinks[0].tap();
 assert.equal(state().page,'shop');assert.equal(renders,initialRenders+1,'First counter tap navigates to the shop');
 currencyLinks[1].tap();assert.equal(renders,initialRenders+1,'Other counter must not rerender the open shop');
 app.nav('shop');assert.equal(renders,initialRenders+1,'Same-page navigation must not rebuild DOM');
 assert.ok(html.includes('BUY PACKAGE'));assert.ok(!html.includes('TOTAL DUE'));
 click({action:'claim',item:'0'});assert.equal(state().page,'checkout');assert.ok(!html.includes('TOTAL DUE'));
 click({action:'checkout-review'});assert.ok(html.includes('TOTAL DUE'));assert.ok(html.includes('$0.00'));
 let coins=app.getSave().coins;click({action:'checkout-complete'});
 assert.equal(app.getSave().coins,coins+50000);assert.equal(state().page,'shop');
 app.start(1);attach();assert.ok(html.includes('--cols:4'));
 let g=state().game;g.cfg.objectives=[{kind:'score',target:Number.MAX_SAFE_INTEGER}];
 let swap=findSwap(g,false),before=renders,moves=g.moves,startingCoins=app.getSave().coins;
 click({cell:String(swap[0])});assert.equal(renders,before);
 click({cell:String(swap[1])});await settle();assert.equal(g.moves,moves-1);assert.equal(renders,before);
 assert.equal(app.getSave().coins,startingCoins,'A move removing no nuts does not mint currency');
 swap=findSwap(g,true);const score=g.score;click({cell:String(swap[0])});click({cell:String(swap[1])});
 await settle();assert.ok(g.score>score);assert.equal(renders,before);
 const removed=g.history.at(-1).removed;assert.ok(removed>0,'Matching move destroys nuts');
 assert.equal(app.getSave().coins,startingCoins+removed,'Destroyed nuts credit the spendable wallet');
 assert.equal(refs.wallet.textContent,(startingCoins+removed).toLocaleString(),'Main balance updates without rebuilding the board');
 assert.equal(refs['play-wallet'].textContent,(startingCoins+removed).toLocaleString(),'In-level balance updates during play');
 assert.equal(JSON.parse(saveStore['nutbuster.v1']).coins,startingCoins+removed,'Destroyed-nut currency persists on device');
 app.start(1);attach();g=state().game;app.getSave().dailyMoves.remaining=1;g.moves=1;swap=findSwap(g,false);
 click({cell:String(swap[0])});click({cell:String(swap[1])});await settle();
 assert.equal(state().page,'outcome');assert.ok(html.includes('OUT OF MOVES!'));
 click({action:'continue-level'});assert.equal(state().page,'checkout');
 click({action:'checkout-review'});click({action:'checkout-complete'});
 assert.equal(state().page,'game');assert.equal(state().game.moves,5);
 app.start(1);attach();g=state().game;g.score=g.cfg.goal-1;swap=findSwap(g,true);
 click({cell:String(swap[0])});click({cell:String(swap[1])});await settle();
 assert.equal(state().page,'outcome');assert.ok(html.includes('LEVEL COMPLETE!'));
 assert.equal(app.getSave().coins,startingCoins+removed+g.history.at(-1).removed+500,'Winning still credits the fixed 500 Golden Nut bonus on top of destroyed nuts');
 console.log('PASS UI: staged zero-dollar checkout and grant, no render-on-tap, move/cascade, loss +5 continuation, victory.');
}
run().catch(err=>{console.error(err);process.exitCode=1});
