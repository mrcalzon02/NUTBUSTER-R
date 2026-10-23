'use strict';
/* Visual routing contract: named products and mine controls use shipped owner artwork. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../web');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const game=read('game.js'),html=read('index.html'),mine=read('nutvale-mines-ui.js');
const block=game.match(/const shopSprites=Object\.freeze\(\[([\s\S]*?)\]\);/);
assert.ok(block,'Shop must declare the six dedicated package sprites');
const shopSprites=[...block[1].matchAll(/'([^']+\.png)'/g)].map(m=>m[1]);
assert.equal(shopSprites.length,6,'Each of six premium products has an illustration');
assert.equal(new Set(shopSprites).size,6,'Premium packages must not share product artwork');
for(const src of shopSprites)assert.ok(fs.existsSync(path.join(ROOT,src)),src+' missing');
assert.match(game,/class="shop-offer-icon"/,'Shop cards must display their unique sprites');

const rewards=game.slice(game.indexOf('function rewards()'),game.indexOf('function homestead()'));
const rewardSprites=[...rewards.matchAll(/class="reward-feature-icon" src="([^"]+)" /g)].map(m=>m[1]);
assert.equal(rewardSprites.length,7,'Each of seven reward features must have an illustration');
const featureSprites=[...shopSprites,...rewardSprites];
assert.equal(new Set(featureSprites).size,featureSprites.length,'Distinct shop and reward features must not share art');
for(const src of rewardSprites)assert.ok(fs.existsSync(path.join(ROOT,src)),src+' missing');

assert.match(game,/class="checkout-offer-icon"/,'Checkout must show the SAME ordered product sprite');
assert.ok(!game.includes("art('economy',shopSprites[i]"),'No legacy duplicate shop icon loop');
assert.match(game,/art\/additions\/economy\/premium-ticket\.png/,'Use Nutvale premium coupon art');
assert.doesNotMatch(game.slice(game.indexOf('function promoSection('),game.indexOf('async function redeemPromoFromUI')),/🎟/,'No generic promo ticket emoji');
assert.doesNotMatch(html,/art\/additions\/ui\/store\.png/,'Contaminated store sprite must not be displayed');
const icons=[
 'art/nutvale/mining-tools/pickaxes/deepsea-orb.png',
 'art/nutvale/mining-tools/pickaxes/brass-anthem.png',
 'art/nutvale/mining-tools/gloves/harvest-petal.png',
 'art/nutvale/mining-tools/pickaxes/moonlit-silver.png',
 'art/nutvale/mining-tools/gloves/jackolantern.png'];
for(const src of icons)assert.ok(fs.existsSync(path.join(ROOT,src)),src+' missing');
assert.doesNotMatch(mine,/⛏️|🧤/,'Mine controls cannot contain a generic pickaxe/glove emoji');
const gear=require('../web/nutvale-mining-gear.js'); // Must register before the mines module imports its global API.
const mines=require('../web/nutvale-mines.js');
const economy=require('../web/nutvale-economy-art.js');
const context={window:{NutvaleMines:mines,NutMiningGear:gear,NutvaleEconomyArt:economy},module:{exports:{}}};
vm.runInNewContext(mine,context);
const U=context.module.exports;
const save={unlocked:501,stars:{500:3},nutravaganza:{dollars:0}};
context.window.NutvaleMines.ensure(save);
for(const tab of ['dig','equipment','refinery','writs']){
 const rendered=U.render(save,{mineTab:tab,mineMode:'dig'});
 assert.match(rendered,/class="mine-ui-icon"/,tab+' missing image-based mine navigation');
 assert.doesNotMatch(rendered,/⛏️|🧤/,tab+' must not show pickaxe/glove emoji');
 for(const [,src] of rendered.matchAll(/src="(art\/[^"]+)"/g))
  assert.ok(fs.existsSync(path.join(ROOT,src)),tab+' icon path missing: '+src);
}
console.log('PASS: six distinct shop items, illustrated coupons, mine actions and all asset paths');
