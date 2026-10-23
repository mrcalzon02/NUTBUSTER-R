const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const E=require('../web/engine.js'),P=require('../web/progression.js'),
 H=require('../web/homestead.js'),A=require('../web/avatar-art.js'),
 M=require('../web/campaign-maps.js'),C=require('../web/nut-codex.js'),
 Ads=require('../web/fake-ads.js');
const source=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../web/style.css'),'utf8');
assert.ok(html.includes('<script src="fake-ads.js"></script><script src="purchase-disclosures.js"></script><script src="promo-keys.js"></script><script src="promo-codes.js"></script><script src="game.js"></script>'));
assert.ok(css.includes('.fake-ad-poster img')&&css.includes('@keyframes fake-ad-wobble'));
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
assert.ok(css.includes('#app.fake-ad-active .bottom'),'Support old Android WebViews without :has');
const data={};
function harness(){
 let page='',next=1,time=0,hidden=false,draws=0;
 const intervals=new Map(),listeners={};
 const flags={toggle(){},add(){},remove(){}};
 const screen={classList:flags,addEventListener(key,fn){listeners[key]=fn;},
 get innerHTML(){return page;},set innerHTML(v){page=v;draws++;},
 querySelector(){return null;},querySelectorAll(){return [];}};
 const window={NutDailyMoves:require('../web/daily-moves.js'),NutElementalChallenges:require('../web/elemental-challenges.js'),NutElementalRewards:require('../web/elemental-rewards.js'),NutEngine:E,NutBenefits:require('../web/benefits.js'),NutPurchases:require('../web/purchase-disclosures.js'),NutProgress:P,NutHomestead:H,NutAvatarArt:A,
  NutCampaignMaps:M,NutCodex:C,NutFakeAds:Ads,innerWidth:360,addEventListener(){}};
 const document={get hidden(){return hidden;},addEventListener(){},
 getElementById(id){return ({screen,toast:{classList:flags,textContent:''},
  app:{classList:flags},wallet:{},gems:{}})[id]||null;},
 querySelector(){return null;},querySelectorAll(){return [];}};
 const localStorage={getItem(k){return data[k]||null;},setItem(k,v){data[k]=v;}};
 const setInterval=fn=>{const id=next++;intervals.set(id,fn);return id;};
 const clearInterval=id=>intervals.delete(id);
 vm.runInNewContext(source,{window,document,localStorage,performance:{now:()=>time},
 setInterval,clearInterval,setTimeout(){return 0;},clearTimeout(){},console});
 return {app:window.NutbusterApp,
  click:d=>listeners.click({target:{closest(){return {dataset:d};}}}),
  advance:(seconds,foreground=true)=>{hidden=!foreground;for(let i=0;i<seconds;i++){time+=1000;for(const fn of [...intervals.values()])fn();}},
  hide:()=>{hidden=true;time+=600000;for(const fn of [...intervals.values()])fn();},
  page:()=>page,intervals:()=>intervals.size,draws:()=>draws,clock:()=>time
 };
}
const t=harness(),saved=t.app.getSave(),before=saved.coins,stock=P.count(saved,'hammer');
t.click({action:'ad-daily'});
assert.equal(t.app.getState().page,'fake-ad');
assert.match(t.page(),/art\/ads\/.+\.webp/);
assert.match(t.page(),/SKIP · NO REWARD/);
assert.match(t.page(),/2:00/);
t.click({action:'ad-claim'});
assert.equal(saved.coins,before,'A click before two minutes earns nothing');
t.click({action:'ad-close'});
assert.equal(t.app.getState().page,'home','Skip returns to originating screen');
assert.equal(t.intervals(),0,'Skip cancels timer');
assert.equal(saved.coins,before,'Skip does not pay');
t.click({action:'ad-daily'});
t.hide();
assert.equal(t.app.getState().adSession.elapsed,0,'Background must not progress');
t.advance(119);
assert.equal(t.app.getState().adSession.ready,false);
t.advance(1);
assert.equal(t.app.getState().adSession.ready,true);
t.click({action:'ad-claim'});
assert.equal(saved.coins,before+750);
assert.equal(P.count(saved,'hammer'),stock+1);
assert.equal(t.app.getState().page,'home');
assert.equal(t.intervals(),0);
t.click({action:'ad-daily'});
assert.notEqual(t.app.getState().page,'fake-ad','One completed daily ad only');
assert.equal(saved.coins,before+750,'No repeat payout');
const second=harness();
second.click({action:'ad-daily'});
assert.notEqual(second.app.getState().page,'fake-ad','Daily completion persists across app reload');
t.app.nav('shop');t.click({action:'claim',item:'0'});
assert.equal(t.app.getState().page,'checkout');
assert.match(t.page(),/ad-discount/);
t.click({action:'ad-discount'});assert.equal(t.app.getState().page,'fake-ad');
t.click({action:'ad-close'});
assert.equal(t.app.getState().page,'checkout');
assert.equal(t.app.getState().discountOffer,null,'A cancelled discount is not granted');
t.click({action:'ad-discount'});t.advance(120);t.click({action:'ad-claim'});
assert.equal(t.app.getState().page,'checkout');
assert.equal(t.app.getState().discountOffer,0);
assert.match(t.page(),/\$2\.50/,'Fictional $4.99 becomes $2.50 after half-price rounding');
t.click({action:'checkout-review'});
assert.match(t.page(),/TOTAL DUE/);assert.match(t.page(),/\$0\.00/);
t.click({action:'checkout-complete'});
assert.equal(t.app.getState().discountOffer,null,'Discount not carried into another order');
assert.equal(t.intervals(),0);
console.log('PASS: original ad images; daily bonus/abort/reload protection; background pause; same-offer discount; free checkout; no leaked timers');
