'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path');
const E=require('../web/engine.js'),P=require('../web/progression.js');
const {privateKey,publicKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk={...publicKey.export({format:'jwk'}),key_ops:['verify'],ext:true};
const nonce='abcdef0123456789abcdef0123456789';
const payload={v:1,kid:'test-2026',nonce,nbf:0,exp:0,grant:{nuts:750,boosters:{hammer:2}}};
const signed='NBR1.'+Buffer.from(JSON.stringify(payload)).toString('base64url');
const code=signed+'.'+crypto.sign('sha256',Buffer.from(signed),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
const persisted={},listeners={},flags={toggle(){},add(){},remove(){}};
let html='',codeValue=code,formOpen=false,promoFocused=false,ariaExpanded='false';
const screen={classList:flags,addEventListener(type,fn){listeners[type]=fn;},
 set innerHTML(value){html=value;formOpen=false;},get innerHTML(){return html;},
 querySelector(selector){
  if(selector==='[data-promo-input]')return {value:codeValue};
  if(selector==='#shop-promo-form')return {
   get hidden(){return !formOpen;},set hidden(value){formOpen=!value;},
   querySelector(child){return child==='[data-promo-input]'?{focus(){promoFocused=true}}:null;}
  };
  return null;
 },querySelectorAll(){return [];}};
const document={getElementById(id){return ({screen,app:{classList:flags},toast:{textContent:'',classList:flags},wallet:{},gems:{}})[id]||null;},
 querySelector(){return null;},querySelectorAll(){return [];}};
const window={NutDailyMoves:require('../web/daily-moves.js'),NutBenefits:require('../web/benefits.js'),
 NutElementalChallenges:require('../web/elemental-challenges.js'),NutElementalRewards:require('../web/elemental-rewards.js'),
 NutEngine:E,NutProgress:P,NutHomestead:require('../web/homestead.js'),NutAvatarArt:require('../web/avatar-art.js'),
 NutCampaignMaps:require('../web/campaign-maps.js'),NutPurchases:require('../web/purchase-disclosures.js'),
 NutPromo:require('../web/promo-codes.js'),NutPromoKeys:{keys:{'test-2026':jwk}},
 crypto:crypto.webcrypto,addEventListener(){},innerWidth:360};
const storage={getItem(id){return persisted[id]||null;},setItem(id,v){persisted[id]=v;}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8'),{
 window,document,localStorage:storage,console,setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){}});
const app=window.NutbusterApp;
const click=dataset=>listeners.click({target:{closest(){return {dataset,
 setAttribute(name,value){if(name==='aria-expanded')ariaExpanded=value;}};}}});
async function waitFor(predicate,label){
 for(let n=0;n<100;n++){
  if(predicate())return;
  await new Promise(resolve=>setTimeout(resolve,10));
 }
 throw Error('Timeout: '+label);
}
(async()=>{
 app.nav('shop');
 assert.match(html,/data-action="promo-open"[^>]*>.*REDEEM PROMO CODE!/,'Shop has a large dedicated coupon CTA');
 assert.ok(html.indexOf('data-action="promo-open"')<html.indexOf('hold-store'),'Coupon CTA precedes shop inventory');
 assert.ok(html.includes('id="shop-promo-form" hidden'),'Shop redemption input is closed until requested');
 click({action:'promo-open'});
 assert.equal(formOpen,true,'Coupon opens redemption form');
 assert.equal(promoFocused,true,'Coupon click puts cursor in code field');
 assert.equal(ariaExpanded,'true','Accessibility state is updated');
 click({action:'promo-open'});
 assert.equal(formOpen,false,'Coupon can close input without repainting Shop');
 assert.equal(ariaExpanded,'false');
 click({action:'promo-open'});
 assert.ok(!html.includes('Issuer key not configured'),'Public key makes redemption available');
 const first=app.getSave().coins,hammer=P.count(app.getSave(),'hammer');
 click({action:'promo-redeem'});
 await waitFor(()=>app.getSave().promoRedemptions?.[nonce],'signed claim');
 assert.equal(app.getSave().coins,first+750);
 assert.equal(P.count(app.getSave(),'hammer'),hammer+2);
 assert.equal(JSON.parse(persisted['nutbuster.v1']).promoRedemptions[nonce].kid,'test-2026');
 click({action:'promo-redeem'});
 await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(app.getSave().coins,first+750,'Duplicate code must not pay again');
 const tamperedPayload={...payload,nonce:'0'.repeat(32),grant:{nuts:99999}};
 const unsigned='NBR1.'+Buffer.from(JSON.stringify(tamperedPayload)).toString('base64url')+'.'+code.split('.')[2];
 codeValue=unsigned;
 click({action:'promo-redeem'});await new Promise(resolve=>setTimeout(resolve,80));
 assert.equal(app.getSave().coins,first+750,'Mutated reward must not pay');
 assert.equal(app.getSave().promoRedemptions['0'.repeat(32)],undefined);
 console.log('PASS: signed offline promo redeemed from real Shop event, bonus and ledger persisted, duplicate and forged codes rejected');
})().catch(e=>{console.error(e);process.exitCode=1;});
