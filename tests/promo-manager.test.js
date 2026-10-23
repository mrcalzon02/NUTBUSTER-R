'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const Manager=require('../tools/promo-manager.js'),Promo=require('../web/promo-codes.js');
const P=require('../web/progression.js'),D=require('../web/daily-moves.js'),B=require('../web/benefits.js'),H=require('../web/homestead.js');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'nutbuster-owner-manager-')),vault=path.join(root,'owner-vault');
 try{
  const master=Manager.init({vault,kid:'owner-test-2026'});
  assert.equal(master.count,9);
  const raw=fs.readFileSync(path.join(vault,'master-codes.csv'),'utf8').trim().split(/\r?\n/);
  assert.equal(raw.length,10,'Header plus nine current store offers');
  assert.deepEqual(Manager.OFFERS,['shop0','shop1','shop2','shop3','shop4','shop5','hearts','moves','manor']);
  assert.ok(fs.existsSync(path.join(vault,'issuer-private.pem')));
  assert.equal(fs.readFileSync(path.join(vault,'promo-keys.js'),'utf8').includes('PRIVATE KEY'),false);
  if(process.platform!=='win32'){
   for(const name of ['master-codes.csv','issuer-private.pem'])
    assert.equal(fs.statSync(path.join(vault,name)).mode&0o077,0,'Only the owner may read '+name);
  }
  const jwk=JSON.parse(fs.readFileSync(path.join(vault,'issuer-public.jwk.json'),'utf8')).jwk;
  const keys={'owner-test-2026':jwk},context={keys,cryptoImpl:crypto.webcrypto,now:Date.UTC(2026,9,22),at:Date.UTC(2026,9,22),cap:36,P,D,B,H};
  for(let i=1;i<raw.length;i++){
   const row=raw[i].split('","').map(col=>col.replace(/^"|"$/g,''));
   const [,id,,code]=row;
   assert.equal(id,Manager.OFFERS[i-1]);
   const verified=await Promo.verify(code,context);
   assert.equal(verified.valid,true,'Master code signature '+id);
   assert.equal(verified.payload.grant.package,id);
   const save={stars:{},unlocked:1,coins:0,gems:0,hearts:2,vip:false};P.migrate(save);
   const first=await Promo.redeem(save,code,context);
   assert.equal(first.valid,true,'Redemption '+id+' '+JSON.stringify(first));
   assert.equal(first.packageId,id);
   if(id==='shop0'){assert.equal(save.coins,50000);assert.equal(save.gems,250);assert.equal(P.count(save,'hammer'),9);}
   if(id==='shop1'){assert.equal(save.coins,2000);assert.equal(save.gems,2000);}
   if(id==='shop4'){assert.equal(save.vip,true);assert.equal(save.coins,1250,'One-time package and first daily VIP award');}
   if(id==='hearts')assert.equal(save.hearts,5);
   if(id==='moves')assert.equal(D.left(save,context.at,36),41);
   if(id==='manor')assert.equal(H.ensure(save).purchases['royal-estate'],true);
   assert.equal((await Promo.redeem(save,code,context)).reason,'already-redeemed','No duplicate grant in same save');
  }
  assert.equal(Manager.list({vault}).total,9);
  assert.throws(()=>Manager.init({vault,kid:'owner-test-2026'}),/already exist/i,'Never overwrite key + master');
  const extra=Manager.issue({vault,offer:'shop0',count:'3',batch:'second-batch'});
  assert.equal(extra.count,3);
  assert.equal(Manager.list({vault}).total,12);
  assert.throws(()=>Manager.issue({vault,offer:'shop0',count:'3',batch:'second-batch'}),/already/i);
  const extraCSV=fs.readFileSync(extra.output,'utf8').trim().split(/\r?\n/);
  const extraCode=extraCSV[1].split('","')[3];
  const one=path.join(root,'one-code.txt');
  fs.writeFileSync(one,extraCode+'\n');
  assert.equal(Manager.verify({vault,file:one}).valid,true);
  assert.throws(()=>Manager.issue({vault,offer:'not-a-product',batch:'invalid'}),/Unknown offer/);
  assert.throws(()=>Manager.issue({vault,offer:'shop0',count:'0',batch:'zero'}),/Count/);
  console.log('PASS: local manager creates nine signed master vouchers, real rewards, repeat protection, private inventory, later issuance and authentication');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
