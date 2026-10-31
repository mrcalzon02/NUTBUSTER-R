const assert=require('node:assert/strict'),E=require('../web/engine.js'),P=require('../web/progression.js'),M=require('../web/campaign-maps.js'),H=require('../web/homestead.js');
const js=require('node:fs').readFileSync('web/game.js','utf8');
const classes=()=>{let names=new Set();return {add:x=>names.add(x),remove:x=>names.delete(x),contains:x=>names.has(x),toggle:(x,v)=>v?names.add(x):names.delete(x)};};
let html='',renders=0,clickHandler,boardCells=[];
const refs={wallet:{textContent:''},gems:{textContent:''},'play-wallet':{textContent:''},'play-gems':{textContent:''},toast:{textContent:'',classList:classes()},
 score:{textContent:''},moves:{textContent:''},progress:{style:{}}};
const board={getBoundingClientRect:()=>({top:0,left:0,width:450,height:450}),appendChild:()=>{},
 querySelector(s){const i=Number(s.match(/data-cell="(\d+)"/)?.[1]);const el=boardCells[i];return s.includes('nut-visual')?el?.visual:el||null;},
 querySelectorAll(s){const names=s.split(',').map(x=>x.trim().replace(/^\./,''));
  return boardCells.filter(x=>x&&names.some(name=>x.classList.contains(name)));}};
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
const transientSprites=[];
const document={getElementById:id=>id==='screen'?screen:refs[id],querySelectorAll:selector=>selector==='[data-nav]'?currencyLinks:[],createElement:()=>{const el={style:{},innerHTML:'',remove(){}};transientSprites.push(el);return el;}};
const window={NutDailyMoves:require('../web/daily-moves.js'),NutElementalChallenges:require('../web/elemental-challenges.js'),NutElementalRewards:require('../web/elemental-rewards.js'),NutEngine:E,NutBenefits:require('../web/benefits.js'),NutPurchases:require('../web/purchase-disclosures.js'),NutProgress:P,NutHomestead:H,NutAvatarArt:require('../web/avatar-art.js'),NutCampaignMaps:M,addEventListener:()=>{},matchMedia:()=>({matches:true})};
const saveStore={};const localStorage={getItem:k=>saveStore[k]??null,setItem:(k,v)=>{saveStore[k]=v;}};
require('node:vm').runInNewContext(js,{window,document,localStorage,setTimeout:fn=>{if(typeof fn==='function')Promise.resolve().then(fn);return 0;},clearTimeout:()=>{},requestAnimationFrame:f=>f(),console});
const app=window.NutbusterApp, state=app.getState;
const click=data=>clickHandler({target:{dataset:data,closest:()=>({dataset:data})}});
function attach(){const g=state().game;boardCells=g.cells.map((c,i)=>!c?null:{
 dataset:{nutKey:c.type+':'+(c.special||''),blockKey:c.ice+':'+c.lock+':'+c.chest},classList:classes(),style:{},
 visual:{outerHTML:'<span class="nut-visual"></span>',style:{},image:null,fallback:null,
  querySelector(s){return s==='.piece'?this.image:s==='.fallback'?this.fallback:null;}},querySelector(s){return s==='.nut-visual'?this.visual:null;},
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
 // Simulate an Android WebView cached sprite whose error callback was missed,
 // plus an inline visibility hide left by a previous interrupted animation.
 const staleIndex=g.cells.findIndex((c,i)=>c&&!swap.includes(i)),stale=boardCells[staleIndex].visual;
 stale.style.visibility='hidden';
 // A canceled nut-explode uses CSS animation-fill-mode:forwards and can keep
 // an otherwise loaded replacement nut completely transparent.
 boardCells[staleIndex].classList.add('nut-shaking');
 boardCells[staleIndex].classList.add('nut-exploding');
 stale.image={complete:true,naturalWidth:0,style:{},classList:classes(),getAttribute:()=> 'art/primary/nuts/'+E.TYPES[g.cells[staleIndex].type]+'.png'};
 stale.image.classList.add('loaded');
 stale.fallback={style:{visibility:'hidden'}};
 click({cell:String(swap[0])});assert.equal(renders,before);
 click({cell:String(swap[1])});await settle();assert.equal(g.moves,moves-1);assert.equal(renders,before);
 assert.equal(app.getSave().coins,startingCoins,'A move removing no nuts does not mint currency');
 assert.equal(stale.style.visibility,'','Interrupted animation hiding is cleared');
 assert.equal(boardCells[staleIndex].classList.contains('nut-exploding'),false,'Canceled explosion must not hide a replacement nut via CSS opacity');
 assert.equal(boardCells[staleIndex].classList.contains('nut-shaking'),false,'Interrupted shaking must not animate the next nut');
 assert.equal(stale.image.style.display,'none','Cached broken sprite is hidden even without onerror');
 assert.equal(stale.fallback.style.visibility,'visible','Broken image never leaves an empty playable tile');
 assert.equal(stale.image.classList.contains('loaded'),false,'Broken cached image must not retain the loaded class that hides its fallback');
 swap=findSwap(g,true);const score=g.score;click({cell:String(swap[0])});click({cell:String(swap[1])});
 await settle();assert.ok(g.score>score);assert.equal(renders,before);
 const removed=g.history.at(-1).removed;assert.ok(removed>0,'Matching move destroys nuts');
 const falling=transientSprites.filter(x=>x.className==='falling-nut');
 assert.ok(falling.length>0,'A scoring cascade generates falling nut sprites');
 assert.ok(falling.every(x=>x.innerHTML.includes('class="piece"')&&!x.innerHTML.includes('visibility: hidden')),
  'Falling sprites are rendered from nut data, not a previously hidden source element');
 assert.equal(app.getSave().coins,startingCoins,'Matches award score, not spendable Golden Nuts');
 // Level 12 contains a central column interrupted by a genuine interior hole.
 // Recover an image that loaded after WebView's earlier onerror hid it inline.
 app.start(12);attach();g=state().game;
 assert.ok(g.cfg.mask.some((active,i)=>!active&&i>=g.cfg.width&&i<g.cfg.mask.length-g.cfg.width),'Level 12 must exercise an interior interrupted column');
 assert.ok(g.cells.every((c,i)=>Boolean(c)===Boolean(g.cfg.mask[i])),'Only true void cells may be absent from the irregular board');
 g.cfg.objectives=[{kind:'score',target:Number.MAX_SAFE_INTEGER}];
 swap=findSwap(g,false);
 const survivorIndex=g.cells.findIndex((c,i)=>c&&!swap.includes(i)),survivor=boardCells[survivorIndex].visual;
 survivor.style.visibility='hidden';
 survivor.image={complete:true,naturalWidth:96,style:{display:'none'},classList:classes(),getAttribute:()=> 'art/primary/nuts/'+E.TYPES[g.cells[survivorIndex].type]+'.png'};
 survivor.fallback={style:{visibility:'visible'}};
 const irregularRenders=renders;
 click({cell:String(swap[0])});click({cell:String(swap[1])});await settle();
 assert.equal(renders,irregularRenders,'Irregular-board repair must not rebuild the entire board');
 assert.equal(survivor.style.visibility,'','Canceled animation must not hide a playable nut');
 assert.equal(survivor.image.style.display,'','Recovered image must clear stale inline display:none');
 assert.equal(survivor.image.classList.contains('loaded'),true,'Recovered image must regain loaded class');
 assert.equal(survivor.fallback.style.visibility,'','Loaded image must reset stale fallback state');
 assert.ok(boardCells.every((tile,i)=>g.cfg.mask[i]?tile&&tile.visual.style.visibility!=='hidden':tile===null),
  'All occupied irregular cells remain visible and all true voids remain void');
 // An image whose WebView request is still pending must not leave a playable
 // cell blank, even if an earlier error left display:none and loaded behind.
 // The fallback is temporary: the approved sprite replaces it on load.
 const css=require('node:fs').readFileSync('web/style.css','utf8');
 assert.ok(css.includes('.nut-visual .fallback{visibility:visible}'),
  'Pending playable sprites must have a visible fallback before image callbacks');
 swap=findSwap(g,false);
 const pendingIndex=g.cells.findIndex((c,i)=>c&&!swap.includes(i)),pending=boardCells[pendingIndex].visual;
 pending.style.visibility='hidden';
 pending.image={complete:false,naturalWidth:0,style:{display:'none'},classList:classes(),
  getAttribute:()=> 'art/primary/nuts/'+E.TYPES[g.cells[pendingIndex].type]+'.png'};
 pending.image.classList.add('loaded');
 pending.fallback={style:{visibility:'hidden'}};
 const pendingRenders=renders;
 click({cell:String(swap[0])});click({cell:String(swap[1])});await settle();
 assert.equal(renders,pendingRenders,'Pending image repair must not rerender the board');
 assert.equal(pending.style.visibility,'','Pending sprite must not retain animation hiding');
 assert.equal(pending.image.style.display,'','Retry pending approved image rather than retaining display:none');
 assert.equal(pending.image.classList.contains('loaded'),false,'Pending image must not suppress fallback');
 assert.equal(pending.fallback.style.visibility,'visible','Pending image must expose fallback until decoded');


 assert.equal(refs.wallet.textContent,startingCoins.toLocaleString(),'Main wallet stays unchanged during ordinary matching');
 assert.equal(refs['play-wallet'].textContent,startingCoins.toLocaleString(),'In-level wallet stays unchanged during ordinary matching');
 assert.equal(JSON.parse(saveStore['nutbuster.v1']).coins,startingCoins,'Match score does not create saved currency');
 app.start(1);attach();g=state().game;app.getSave().dailyMoves.remaining=1;g.moves=1;swap=findSwap(g,false);
 click({cell:String(swap[0])});click({cell:String(swap[1])});await settle();
 assert.equal(state().page,'outcome');assert.ok(html.includes('OUT OF MOVES!'));
 click({action:'continue-level'});assert.equal(state().page,'checkout');
 click({action:'checkout-review'});click({action:'checkout-complete'});
 assert.equal(state().page,'game');assert.equal(state().game.moves,5);
 app.start(1);attach();g=state().game;g.score=g.cfg.goal-1;swap=findSwap(g,true);
 click({cell:String(swap[0])});click({cell:String(swap[1])});await settle();
 assert.equal(state().page,'outcome');assert.ok(html.includes('LEVEL COMPLETE!'));
 assert.equal(app.getSave().coins,startingCoins+500,'Winning credits exactly the original 500 Golden Nuts, not per-nut match rewards');
 console.log('PASS UI: staged zero-dollar checkout and grant, no render-on-tap, move/cascade, loss +5 continuation, victory.');
}
run().catch(err=>{console.error(err);process.exitCode=1});
