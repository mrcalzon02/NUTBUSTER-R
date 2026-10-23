'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const game=read('web/game.js'),adapter=read('web/play-platform.js');
const java=read('android/app/src/main/java/io/github/mrcalzon02/nutbuster/PlayBillingCoordinator.java');
const backend=read('services/play-verifier/core.js');
const start=game.indexOf('function checkout(){');
const end=game.indexOf('// One dedicated premium-package illustration',start);
assert.ok(start>0&&end>start,'Checkout implementation must remain inspectable');
const extract=game.slice(start,end);
const bridge={purchases:[],buy(i){this.purchases.push(i)}};
const window={NUTBUSTER_PLAY_BRIDGE:bridge};
vm.runInNewContext(adapter,{window});
window.NutbusterPlay.catalog({'0':'$9.99','4':'$2.99','8':'$9.99'});
const offers=Array.from({length:9},(_,i)=>['PACKAGE '+i,'',100,20,i===4?'$2.99':'$0.00']);
const run=new Function('window','state','offers','Purchases','E','purchaseList','escPurchase',
 'vipSupportPurchased','offerSprites','P','boosterSummary',extract+';return checkout();');
function checkout(index,step=0,paid=false,configured=true){
 const context=configured?window:{NutbusterPlay:{required:true,price:i=>i===4?'UNAVAILABLE':'FREE'}};
 return run(context,{checkout:index,checkoutStep:step,checkoutPack:{hammer:1},discountOffer:null},
  offers,{offer:()=>({lines:['Guaranteed fixed contents']})},{},
  lines=>lines.join(' · '),x=>x,()=>paid,Array(9).fill('vip.png'),{},()=> '');
}
for(const index of [0,1,2,3,5,6,7,8]){
 const before=checkout(index),after=checkout(index,1);
 assert.match(before,/FREE · \$0\.00/,'free package '+index);
 assert.match(after,/CLAIM FREE PACKAGE · \$0\.00/);
 assert.doesNotMatch(before,/data-action="ad-discount"/);
 assert.doesNotMatch(after,/SUPPORT VIA GOOGLE PLAY/);
 window.NutbusterPlay.buy(index);
}
assert.deepEqual(bridge.purchases,[],'No free package can start native billing');
window.NutbusterPlay.buy(4);
assert.deepEqual(bridge.purchases,[4],'VIP alone starts native billing');
const vip=checkout(4),review=checkout(4,1);
assert.match(vip,/THANK YOU FOR PLAYING MY GAME/);
assert.match(vip,/ENTIRELY OPTIONAL/);
assert.match(vip,/ONE-TIME GOOGLE PLAY PRICE/);
assert.match(review,/SUPPORT VIA GOOGLE PLAY · \$2\.99/);
assert.match(review,/NO THANKS · KEEP PLAYING FREE/);
assert.match(checkout(4,1,false,false),/data-action="checkout-complete" disabled/);
assert.match(checkout(4,0,true),/data-action="checkout-review" disabled/,
 'Already purchased VIP must not offer another payment');
assert.match(java,/null, null, null, null, "nutbuster_lifetime_vip", null, null, null, null/);
assert.doesNotMatch(java,/consumeAsync\(/);
assert.doesNotMatch(java,/nutbuster_gigantic_nuts|nutbuster_royal_manor|nutbuster_premium_gems/);
assert.match(backend,/PRODUCTS=Object\.freeze\(\{nutbuster_lifetime_vip:'durable'\}\)/);
console.log('PASS: eight free packages have no billing path; only optional, thanked VIP shows Play billing');
