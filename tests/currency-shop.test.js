/* Earned-currency shop: exact Nuts/Gems deductions, life/move caps, booster stock,
   real in-game purchase confirmation and save persistence. No cash checkout. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const E=require('../web/engine.js'),P=require('../web/progression.js'),D=require('../web/daily-moves.js');
const B=require('../web/benefits.js'),Purchases=require('../web/purchase-disclosures.js');
const root=path.join(__dirname,'../web');
const offers=P.SHOP_EXCHANGES;
assert.deepEqual(Object.keys(offers).sort(),['heart-gems','heart-nuts','move-gems','move-nuts']);
assert.equal(offers['heart-nuts'].amount,1);
assert.equal(offers['heart-gems'].amount,5);
assert.ok(offers['move-gems'].amount>offers['move-nuts'].amount*3);
for(const offer of Object.values(offers)){
 assert.ok(Number.isInteger(offer.cost)&&offer.cost>0);
}
for(const id of E.BOOSTERS){
 assert.ok(P.GEM_BOOSTER_PRICES[id]>0,'Gem price missing '+id);
 assert.ok(P.BOOSTER_PRICES[id]>P.GEM_BOOSTER_PRICES[id],'Booster Gems must be the premium-value alternative');
}
const at=1740000000000,cap=30;
function fresh(){const save={unlocked:500,stars:{},coins:10000,gems:200,hearts:0};P.migrate(save);D.ensure(save,at,cap);return save;}
{
 const s=fresh();
 const initial=s.coins;
 const a=P.buyCurrencyOffer(s,'heart-nuts',D,at,cap);
 assert.equal(a.valid,true);assert.equal(a.granted,1);assert.equal(s.hearts,1);assert.equal(s.coins,initial-offers['heart-nuts'].cost);
 const gem=P.buyCurrencyOffer(s,'heart-gems',D,at,cap);
 assert.equal(gem.valid,true);assert.equal(gem.granted,4);assert.equal(s.hearts,5);assert.equal(s.gems,200-offers['heart-gems'].cost);
 const snap=JSON.stringify(s);
 assert.equal(P.buyCurrencyOffer(s,'heart-gems',D,at,cap).reason,'full');
 assert.equal(P.buyCurrencyOffer(s,'heart-nuts',D,at,cap).reason,'full');
 assert.equal(JSON.stringify(s),snap,'Never charge players for already-full hearts');
 s.hearts=4;const nearly=P.buyCurrencyOffer(s,'heart-gems',D,at,cap);
 assert.equal(nearly.granted,1);assert.equal(s.hearts,5,'Partial refills cannot exceed the five-life maximum');
}
{
 const s=fresh();s.coins=0;s.gems=0;const snapshot=JSON.stringify(s);
 assert.equal(P.buyCurrencyOffer(s,'move-nuts',D,at,cap).reason,'funds');
 assert.equal(P.buyCurrencyOffer(s,'heart-gems',D,at,cap).reason,'funds');
 assert.equal(P.buyCurrencyOffer(s,'fake-offer',D,at,cap).reason,'unknown');
 assert.equal(P.buyGemBooster(s,'hammer').reason,'funds');
 assert.equal(JSON.stringify(s),snapshot,'Rejected offers cannot debit or grant rewards');
}
{
 const s=fresh();const initial=s.dailyMoves.remaining;
 const n=P.buyCurrencyOffer(s,'move-nuts',D,at,cap);
 assert.equal(n.valid,true);assert.equal(n.granted,2);assert.equal(s.dailyMoves.remaining,initial+2);
 assert.equal(s.coins,10000-offers['move-nuts'].cost);
 const g=P.buyCurrencyOffer(s,'move-gems',D,at,cap);
 assert.equal(g.valid,true);assert.equal(g.granted,12);assert.equal(s.dailyMoves.remaining,initial+14);
 assert.equal(s.dailyMoves.bonus,14,'Purchased moves are bonus credits, not a reset');
 assert.equal(s.dailyMoves.spent,0);
 assert.equal(D.spend(s,4,at,cap),true);
 assert.equal(D.left(s,at,cap),initial+10);
 const before=s.dailyMoves.remaining;
 const noWallet=P.buyCurrencyOffer(s,'move-gems',null,at,cap);
 assert.equal(noWallet.reason,'wallet');
 assert.equal(s.dailyMoves.remaining,before);
 const previousCoins=s.coins;s.coins=1200;s.dailyMoves.remaining=999998;
 assert.equal(P.buyCurrencyOffer(s,'move-nuts',D,at,cap).reason,'limit');
 assert.equal(s.coins,1200,'Wallet limit cannot debit money');
 s.coins=previousCoins;
 const next=D.ensure(s,at+D.DAY_MS+1,cap);
 assert.equal(next.remaining,cap,'The next 24-hour cycle resets bought move bonuses normally');
}
{
 const s=fresh();const old=P.count(s,'hammer'),price=P.GEM_BOOSTER_PRICES.hammer;
 const got=P.buyGemBooster(s,'hammer');
 assert.equal(got.valid,true);assert.equal(got.granted,4);
 assert.equal(P.count(s,'hammer'),old+4);assert.equal(s.gems,200-price);assert.equal(s.coins,10000);
 const nut=P.buyBooster(s,'hammer');
 assert.equal(nut.valid,true);assert.equal(P.count(s,'hammer'),old+5);
 assert.equal(s.coins,10000-P.BOOSTER_PRICES.hammer);
 const locked={unlocked:1,stars:{},coins:100000,gems:100000,hearts:5};P.migrate(locked);
 assert.equal(P.buyGemBooster(locked,'frostbreaker').reason,'locked');
 const largeWallet=fresh();largeWallet.coins=4300000;largeWallet.gems=3400000;
 assert.equal(P.buyBooster(largeWallet,'hammer').valid,true);
 assert.equal(largeWallet.coins,4300000-P.BOOSTER_PRICES.hammer,'Booster purchase must not truncate wallets above 999,999');
 assert.equal(P.buyHold(largeWallet,'butter_hold').valid,true);
 assert.equal(largeWallet.gems,3400000-P.HOLD_ITEMS.butter_hold.gems,'Hold purchases must not truncate large Gem balances');
 const capped=fresh();capped.boosterInventory.hammer=999997;
 const gemsBefore=capped.gems;assert.equal(P.buyGemBooster(capped,'hammer').reason,'limit');
 assert.equal(capped.gems,gemsBefore);assert.equal(P.count(capped,'hammer'),999997);
}
{
 const s=fresh(),meta=E.BOOSTER_META.hammer;
 const resource=Purchases.describe('shop-currency-buy',{offer:'heart-gems'},{save:s,P,E});
 assert.ok(resource.lines.some(line=>line.includes('12 Gems')));
 assert.ok(resource.lines.some(line=>line.includes('5 lives')));
 const gems=Purchases.describe('booster-gems-buy',{booster:'hammer'},{save:s,P,E});
 assert.equal(gems.name,'Gem Booster Pack · '+meta.label);
 assert.ok(gems.lines.some(line=>line.includes('4 '+meta.label)));
}
{
 const source=fs.readFileSync(path.join(root,'game.js'),'utf8');
 const shopCss=fs.readFileSync(path.join(root,'style.css'),'utf8');
 assert.match(shopCss,/\.currency-offer-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'Currency offers must use two columns even on mobile');
 assert.doesNotMatch(shopCss,/\.currency-offer-grid\{grid-template-columns:1fr\}/,'Do not regress to one card per row');
 let html='',store={},handlers={};
 const classes={add(){},remove(){},toggle(){}};
 const screen={classList:classes,addEventListener:(kind,fn)=>handlers[kind]=fn,
  get innerHTML(){return html},set innerHTML(next){html=next},
  querySelector(){return null},querySelectorAll(){return []}};
 const wallet={textContent:''},gemCounter={textContent:''},toast={textContent:'',classList:classes};
 const document={getElementById:id=>({screen,app:{classList:classes},toast,wallet,gems:gemCounter})[id]||null,
  querySelector(){return null},querySelectorAll(){return []}};
 const window={
  NutDailyMoves:D,NutBenefits:B,NutPurchases:Purchases,NutFishing:require('../web/fishing.js'),
  NutElementalChallenges:require('../web/elemental-challenges.js'),
  NutElementalRewards:require('../web/elemental-rewards.js'),NutEngine:E,NutProgress:P,
  NutHomestead:require('../web/homestead.js'),NutAvatarArt:require('../web/avatar-art.js'),
  NutCampaignMaps:require('../web/campaign-maps.js'),addEventListener(){}
 };
 vm.runInNewContext(source,{window,document,
  localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;}},
  setTimeout(){},clearTimeout(){},console});
 const app=window.NutbusterApp,s=app.getSave();
 s.hearts=1;s.coins=10000;s.gems=200;
 app.nav('shop');
 assert.match(html,/<section class="panel currency-store" aria-label="Lives and moves for in-game currency"><div class="currency-offer-grid">/);
 assert.doesNotMatch(html,/LIVES & MOVES · IN-GAME CURRENCY|Golden Nuts purchase small top-ups/,'Redundant currency explainer must stay removed');
 const noReceipt=()=>assert.doesNotMatch(html,/store-debit-receipt|LAST PURCHASE|BALANCE UPDATED|GOLDEN NUTS [\d,]+ → [\d,]+|GEMS [\d,]+ → [\d,]+/,'Purchase should update wallet, not display a running tally');
 assert.equal((html.match(/data-action="shop-currency-buy"/g)||[]).length,4,'Four real currency offers');
 assert.equal((html.match(/data-action="booster-gems-buy"/g)||[]).length,E.BOOSTERS.length,'Every booster has a Gems option');
 assert.equal((html.match(/data-action="booster-buy"/g)||[]).length,E.BOOSTERS.length,'Original Nuts purchases preserved');
 assert.match(html,/REFILL TO FIVE · 4 LIVES/);
 const click=dataset=>handlers.click({target:{closest:()=>({dataset})}});
 const beforeGems=s.gems;
 click({action:'shop-currency-buy',offer:'heart-gems'});
 assert.match(html,/Confirm purchase and exact contents/);
 assert.equal(s.gems,beforeGems,'Showing confirmation does not spend');
 assert.equal(gemCounter.textContent,'200','Preview does not change displayed Gems');
 click({action:'purchase-cancel'});
 assert.equal(s.hearts,1);
 click({action:'shop-currency-buy',offer:'heart-gems'});
 click({action:'purchase-confirm'});
 assert.equal(s.hearts,5);
 assert.equal(s.gems,beforeGems-12);
 assert.equal(gemCounter.textContent,'188','Confirm immediately updates visible Gem balance');
 assert.equal(toast.textContent,'PURCHASE COMPLETE','Brief confirmation must not repeat currency amounts');
 noReceipt();
 assert.equal(JSON.parse(store['nutbuster.v1']).hearts,5,'Lives persisted');
 const count=P.count(s,'hammer'),cost=P.GEM_BOOSTER_PRICES.hammer;
 click({action:'booster-gems-buy',booster:'hammer'});
 assert.equal(P.count(s,'hammer'),count,'Preview never awards stock');
 click({action:'purchase-confirm'});
 assert.equal(P.count(s,'hammer'),count+4);
 assert.equal(s.gems,beforeGems-12-cost);
 assert.equal(gemCounter.textContent,(beforeGems-12-cost).toLocaleString(),'Gem booster updates HUD');
 noReceipt();
 assert.equal(JSON.parse(store['nutbuster.v1']).boosterInventory.hammer,count+4,'Gem booster grant persisted');
 const coins=s.coins,bank=D.left(s);
 click({action:'shop-currency-buy',offer:'move-nuts'});
 click({action:'purchase-confirm'});
 assert.equal(s.coins,coins-1200);
 assert.equal(wallet.textContent,(coins-1200).toLocaleString(),'Nuts-to-moves purchase updates visible Golden Nut balance');
 noReceipt();
 assert.equal(D.left(s),bank+2);
 assert.equal(JSON.parse(store['nutbuster.v1']).dailyMoves.remaining,bank+2);
 assert.equal(B.ready(s,'moves'),true,'Free cooldown move redemption remains independent');
 const stock=P.count(s,'hammer'),coins2=s.coins;
 click({action:'booster-buy',booster:'hammer'});click({action:'purchase-confirm'});
 assert.equal(P.count(s,'hammer'),stock+1);
 assert.equal(s.coins,coins2-P.BOOSTER_PRICES.hammer);
 assert.equal(wallet.textContent,(coins2-P.BOOSTER_PRICES.hammer).toLocaleString(),'Nuts-to-booster purchase updates visible balance');
 noReceipt();
 const holdStart=s.gems;
 click({action:'hold-offer',holdId:'butter_hold'});
 click({action:'hold-buy',holdId:'butter_hold'});
 assert.equal(s.gems,holdStart-P.HOLD_ITEMS.butter_hold.gems,'Held-nut Gem purchase debits wallet');
 assert.equal(gemCounter.textContent,s.gems.toLocaleString(),'Held-nut purchase updates visible Gem balance');
 noReceipt();
}
console.log('PASS: four currency exchanges, Gems booster bundles, original Nuts boosters, heart/move limits, UI confirmation and saved deductions');
