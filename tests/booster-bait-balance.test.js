'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const F=require('../web/fishing.js'),U=require('../web/fishing-ui.js');
const P=require('../web/progression.js'),E=require('../web/engine.js');
const day=Date.UTC(2031,4,16,12);
const rates={hammer:2,extra:2,row:2,shuffle:2,column:3,blast:3,cross:3,color:3,drill:4,unlock:4};
assert.deepEqual(F.BOOSTER_BAIT,rates);
assert.equal(F.DAILY,6);
assert.equal(F.BAIT_RECIPES.glitter.dollars,35);
assert.equal(F.BAIT_RECIPES.royal.dollars,100);
const rateCsv=fs.readFileSync(path.join(__dirname,'../docs/economy/booster-to-bait-balance.csv'),'utf8');
assert.equal(rateCsv.trim().split(/\r?\n/).length,11,'Rate header + 10 rows');
for(const [id,amount] of Object.entries(rates)){
 const save={coins:12345,gems:678,stars:{1:3,[P.LEVEL_BY_TOOL[id]]:3},boosterInventory:{[id]:2},nutravaganza:{day:'2031-05-16',dollars:500,baits:{worm:7}}};
 P.migrate(save);
 const n=F.ensure(save,day),before=n.baits.worm;
 const quote=F.exchangeQuote(save,id,P,day);
 assert.equal(quote.valid,true,'Unlocked stocked quote '+id);
 assert.equal(quote.rate,amount);
 assert.equal(F.exchangeBalance(save,P,day).rates.length,10);
 assert.equal(F.trade(save,id,P,day).amount,amount);
 assert.equal(n.baits.worm,before+amount);
 assert.equal(P.count(save,id),1);
 assert.equal(n.dollars,500);
 assert.equal(save.coins,12345);
 assert.equal(save.gems,678);
 assert.equal(F.trade(save,id,P,day).valid,true,'Second trade '+id);
 assert.equal(P.count(save,id),0);
 assert.equal(F.trade(save,id,P,day).valid,false,'No overdraft '+id);
 const csvRow=rateCsv.split(/\r?\n/).find(row=>row.startsWith('"'+id+'",'));
 assert.ok(csvRow&&csvRow.includes(',"'+amount+'",'),'Balance CSV drift '+id);
}
{
 const save={stars:{1:3},boosterInventory:{unlock:2},nutravaganza:{day:'2031-05-16',baits:{worm:1}}};
 P.migrate(save);F.ensure(save,day);
 assert.equal(F.trade(save,'unlock',P,day).valid,false,'Locked booster cannot be sold');
 assert.equal(P.count(save,'unlock'),2);
 assert.equal(F.trade(save,'not-a-booster',P,day).valid,false);
}
{
 const save={stars:{1:3},boosterInventory:{hammer:1},nutravaganza:{day:'2031-05-16',baits:{worm:999999}}};
 P.migrate(save);
 assert.equal(F.trade(save,'hammer',P,day).reason,'limit');
 assert.equal(P.count(save,'hammer'),1);
 assert.equal(F.ensure(save,day).baits.worm,999999);
}
{
 const save={coins:111,gems:222,nutravaganza:{day:'2031-05-16',dollars:200,baitTier:0,baits:{worm:4}}};
 const n=F.ensure(save,day);
 assert.equal(F.craft(save,'glitter',day).valid,false,'Bait tier gate');
 n.baitTier=1;
 assert.equal(F.craft(save,'glitter',day).valid,true);
 assert.equal(n.dollars,165);assert.equal(n.baits.worm,3);
 n.baitTier=2;
 assert.equal(F.craft(save,'royal',day).valid,true);
 assert.equal(n.dollars,65);assert.equal(n.baits.worm,2);
 assert.equal(save.coins,111);assert.equal(save.gems,222);
}
{
 const save={stars:{1:3},boosterInventory:{hammer:2},nutravaganza:{day:'2031-05-16',dollars:300,baits:{worm:6}}};
 P.migrate(save);
 const shop=U.baitShop(save,{fishBait:'worm'},E,P);
 const sheet=U.exchangeSheet(save,E,P,false);
 assert.match(shop,/BOOSTER → BAIT BALANCE/);
 assert.match(shop,/<details class="fish-balance-sheet" open>/);
 assert.equal((sheet.match(/<tr class=/g)||[]).length,10);
 assert.equal((sheet.match(/data-action="fish-trade"/g)||[]).length,10);
 for(const n of [2,3,4])assert.ok(sheet.includes('1 → '+n+' 🪱'));
 assert.match(sheet,/TRADE \+2/);
 assert.match(sheet,/N\$35/);
 assert.match(sheet,/N\$100/);
 const main=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
 assert.ok(main.includes('NutFishingUI?.exchangeSheet?.(saved,E,P,false)'),'Emporium must show shared sheet');
 const css=fs.readFileSync(path.join(__dirname,'../web/fishing.css'),'utf8');
 assert.ok(css.includes('.fish-balance-table')&&css.includes('.fish-balance-scroll'),'Table scroll and compact styling');
}
console.log('PASS: ten rates, daily yield, locked/empty/cap safeguards, recipes, both shop surfaces, independent wallets');
