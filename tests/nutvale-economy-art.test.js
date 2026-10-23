'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Art=require('../web/nutvale-economy-art.js');
const G=require('../web/nutvale-mining-gear.js');
const M=require('../web/nutvale-mines.js');
const UI=require('../web/nutvale-mines-ui.js');
const manifest=require('../web/art/nutvale/mining-economy/manifest.json');
assert.equal(manifest.schema,1);
assert.equal(manifest.items.length,36);
assert.equal(Art.CURRENCY.length,18);
assert.equal(Art.WRITS.length,13);
assert.equal(Art.GOODS.length,5);
assert.deepEqual(manifest.counts,{currency:18,writs:13,goods:5});
const names=new Set();
for(const item of manifest.items){
 assert.equal(item.size[0],192);
 assert.equal(item.size[1],192);
 assert.match(item.sha256,/^[a-f0-9]{64}$/);
 assert.ok(!names.has(item.path),'Unique image path');
 names.add(item.path);
 const bytes=fs.readFileSync(path.join(__dirname,'../',item.path));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256,'Committed art preserves sliced source hash');
}
for(const [category,ids] of [['currency',Art.CURRENCY],['writs',Art.WRITS],['goods',Art.GOODS]]){
 for(const id of ids)assert.ok(names.has('web/'+Art.path(category,id)),'Approved sprite exists '+id);
}
for(let t=0;t<=5;t++){
 const p=Art.goods(t);
 assert.ok(names.has('web/'+p));
 assert.equal(Art.goods(t),Art.goods(t),'Deterministic refinery art');
}
assert.match(Art.goods(0),/crate-bottles.png$/);
assert.match(Art.goods(5),/crate-golden-luxury.png$/);
assert.notEqual(Art.goods(0),Art.goods(2));
assert.match(Art.money(0),/copper-coins.png$/);
assert.match(Art.money(600),/gold-medallion.png$/);
assert.match(Art.money(999999999),/rainbow-medallion.png$/);
assert.notEqual(Art.writs(0),Art.writs(1));
assert.match(Art.writs(100),/acorn-violet-writ.png$/);
const initial={stars:{500:2},nutravaganza:{dollars:100000},nutravaganzaExpedition:{}};
const raw=JSON.stringify(initial);
let ui=UI.render(initial,{mineTab:'refinery'});
assert.match(ui,/crate-bottles.png/);
assert.match(ui,/MANUFACTURE GOODS/);
assert.match(ui,/SELL GOODS/);
assert.equal(initial.nutravaganza.dollars,100000,'Rendering never spends money');
initial.nutravaganzaExpedition.ore=20;
assert.equal(M.refine(initial,5).valid,true);
assert.equal(M.manufacture(initial,2).valid,true);
assert.equal(M.stats(initial).goods,2);
for(let tier=1;tier<=5;tier++){
 const next=M.upgrade(initial,'refineryTier');
 assert.equal(next.valid,true);
 ui=UI.render(initial,{mineTab:'refinery'});
 assert.ok(ui.includes(Art.goods(tier)));
 assert.equal(M.stats(initial).goods,2,'Refinery upgrades preserve already-produced goods');
}
assert.match(ui,/crate-golden-luxury.png/);
assert.equal(M.sell(initial,1).valid,true,'Finished crates are still sold using original rule');
ui=UI.render(initial,{mineTab:'writs'});
assert.match(ui,/red-writ.png/);
const priorDollars=initial.nutravaganza.dollars;
assert.equal(M.buyWrits(initial,1).valid,true);
assert.equal(initial.nutravaganza.dollars,priorDollars-180);
assert.ok(UI.render(initial,{mineTab:'writs'}).includes(Art.writs(1)));
assert.ok(UI.render(initial,{mineTab:'equipment'}).includes(Art.goods(5)),'Refinery node reflects crafted-goods visuals');
assert.doesNotMatch(ui,/art\/nutvale\/mining-tools\/[^\"<>]*goods/,'Goods never alias tool upgrades');
console.log('PASS: 36 approved sprites, exact hashes, goods refinery tier visuals, real produce/sell/Writ economy and assets');
