'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const F=require('../web/fishing.js'),P=require('../web/progression.js'),U=require('../web/fishing-ui.js');
const day=Date.UTC(2031,4,16,12),dayKey=F.localDay(day),ids=F.BAITS.map(x=>x.id);
assert.equal(ids.length,10,'All ten bait varieties are playable');
assert.equal(new Set(ids).size,10,'Bait IDs unique');
assert.deepEqual(ids.slice(0,4),['worm','glitter','pond-mash','royal']);
assert.equal(F.BAIT_RECIPES.glitter.dollars,35);
assert.equal(F.BAIT_RECIPES.royal.dollars,100);
const wallet={coins:15000,gems:80,stars:{1:3},boosterInventory:{hammer:0},
 nutravaganza:{day:dayKey,dollars:30000,baits:{worm:20}}};
P.migrate(wallet);const n=F.ensure(wallet,day),oldDollars=n.dollars,oldGems=wallet.gems;
let bought=P.buyBooster(wallet,'hammer');assert.equal(bought.valid,true);
assert.equal(wallet.coins,15000-P.BOOSTER_PRICES.hammer);
assert.equal(wallet.gems,oldGems);assert.equal(P.count(wallet,'hammer'),1);
const trade=F.trade(wallet,'hammer',P,day);assert.equal(trade.valid,true);
assert.equal(trade.amount,F.BOOSTER_BAIT.hammer);
assert.equal(P.count(wallet,'hammer'),0);
assert.equal(wallet.coins,15000-P.BOOSTER_PRICES.hammer);
assert.equal(n.dollars,oldDollars);
assert.equal(F.buyBait(wallet,'leviathan-lure',1,day).reason,'locked');
assert.equal(F.upgrade(wallet,'no-such-upgrade',day).reason,'unknown');
assert.equal(F.buyBait(wallet,'worm',0,day).reason,'quantity');
assert.equal(F.buyBait(wallet,'worm',6,day).reason,'quantity');
for(let tier=0;tier<=5;tier++){
 assert.equal(n.baitTier,tier);
 for(const spec of F.BAITS){
  const unlocked=spec.level<=tier;
  const old=n.baits[spec.id];
  const purchase=F.buyBait(wallet,spec.id,1,day);
  assert.equal(purchase.valid,unlocked,spec.id+' tier '+tier);
  assert.equal(n.baits[spec.id],old+(unlocked?1:0));
 }
 const rendered=U.baitCatalog(wallet,{fishBait:'worm'});
 assert.equal((rendered.match(/class="fish-bait-offer /g)||[]).length,10);
 assert.equal((rendered.match(/data-action="fish-bait-buy"/g)||[]).length,20);
 assert.ok(rendered.includes('BAIT SHOP '+tier+'/5'));
 if(tier<5){const cost=F.nextCost('bait',n);assert.equal(F.upgrade(wallet,'bait',day).cost,cost);}
}
assert.equal(F.upgrade(wallet,'bait',day).reason,'max');
assert.equal(F.nextCost('bait',n),null);
assert.equal(F.BAITS.filter(x=>x.level===5).length,2);
assert.equal(F.buyBait(wallet,'leviathan-lure',5,day).quantity,5);
assert.equal(F.buyBait(wallet,'leviathan-lure',6,day).reason,'quantity');
const species='leviathan';
const off=F.rodOdds('woodland',0),boost=F.rodOdds('woodland',9,'deep');
assert.ok(boost.find(x=>x.id===species).probability>off.find(x=>x.id===species).probability,'Premium bait must shift trophy odds');
const arcane='eel';
assert.ok(F.rodOdds('woodland',5,'arcane').find(x=>x.id===arcane).probability>
 F.rodOdds('woodland',5).find(x=>x.id===arcane).probability,'Habitat specificity must affect actual odds');
n.equippedRod='woodland';n.rodStock.woodland=999;
const before=n.baits['storm-lure'];
const cast=F.cast(wallet,'storm-lure',301,day);assert.equal(cast.valid,true);
assert.equal(n.baits['storm-lure'],before-1);
n.fight=null;
assert.equal(F.buyBait(wallet,'storm-lure',1,day).valid,true);
assert.equal(wallet.gems,80,'Bait cannot consume Gems');
for(let tier=0;tier<5;tier++){
 assert.equal(n.wharfTier,tier);
 assert.equal(F.dailyBait(n),6+tier);
 assert.equal(F.saleBonus(n,1000),50*tier);
 const cost=F.nextCost('wharf',n);
 assert.equal(F.upgrade(wallet,'wharf',day).cost,cost);
}
assert.equal(n.wharfTier,5);
assert.equal(F.nextCost('wharf',n),null);
assert.equal(F.dailyBait(n),11);
assert.equal(F.saleBonus(n,1000),250);
n.pending={id:'minnow',size:25,value:1000};
const cash=n.dollars;
const sold=F.resolve(wallet,'sell',day);
assert.equal(sold.valid,true);
assert.equal(n.dollars,cash+1250,'Sale must include the wharf tier premium');
assert.equal(wallet.gems,80);
const html=U.baitShop(wallet,{fishBait:'glitter'},{
 BOOSTERS:Object.keys(F.BOOSTER_BAIT),BOOSTER_META:Object.fromEntries(Object.keys(F.BOOSTER_BAIT).map(id=>[id,{label:id}]))
},{count:()=>0,unlocked:()=>false,LEVEL_BY_TOOL:{}});
assert.match(html,/data-kind="wharf"/);
assert.match(html,/data-kind="bait"/);
assert.match(html,/data-action="fish-trade"/);
const game=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
assert.match(game,/data-action="booster-buy"/);
assert.match(game,/P.buyBooster\(saved,button.dataset.booster\)/);
const saved=JSON.parse(JSON.stringify(wallet));
assert.equal(F.ensure(saved,day).baitTier,5);
assert.equal(F.ensure(saved,day).wharfTier,5);
assert.equal(saved.nutravaganza.baits['leviathan-lure'],n.baits['leviathan-lure']);
console.log('PASS: ten bait SKUs, 6 shop tiers, 6 wharf tiers, purchasing, actual catch odds, fish sale returns and primary wallets');
