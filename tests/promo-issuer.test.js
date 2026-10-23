'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto'),Issuer=require('../tools/promo-issuer.js');
const Promo=require('../web/promo-codes.js');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'nutbuster-issuer-'));
 try{
  const dir=path.join(temp,'secrets'),codes=path.join(temp,'issued-codes.txt');
  assert.throws(()=>Issuer.keygen({out:path.join(__dirname,'../tools/test-private-key'),kid:'x'}),/outside/i,
    'Never create issuer key under repository');
  Issuer.keygen({out:dir,kid:'dev-2026'});
  const secret=path.join(dir,'issuer-private.pem'),pub=path.join(dir,'promo-keys.js');
  assert.ok(fs.existsSync(secret));assert.ok(fs.existsSync(pub));
  assert.equal(fs.readFileSync(secret,'utf8').includes('PRIVATE KEY'),true);
  assert.equal(fs.readFileSync(pub,'utf8').includes('PRIVATE KEY'),false);
  if(process.platform!=='win32')assert.equal(fs.statSync(secret).mode&0o077,0,'Private PEM must not be world readable');
  const window={};vm.runInNewContext(fs.readFileSync(pub,'utf8'),{window});
  assert.ok(window.NutPromoKeys.keys['dev-2026']);
  Issuer.issue({private:secret,kid:'dev-2026',grant:'{"nuts":125,"gems":5,"boosters":{"hammer":1}}',count:'3',output:codes});
  const all=fs.readFileSync(codes,'utf8').trim().split(/\n/);
  assert.equal(all.length,3);assert.equal(new Set(all).size,3,'CSPRNG nonces must be unique');
  for(const code of all){
   const result=await Promo.verify(code,{keys:window.NutPromoKeys.keys,cryptoImpl:crypto.webcrypto});
   assert.equal(result.valid,true,'Owner-issued voucher must verify with shipped public JWK');
  }
  assert.throws(()=>Issuer.issue({private:secret,kid:'dev-2026',grant:'{"nuts":999999999}',count:'1'}),/Invalid reward/);
  console.log('PASS: issuer keygen outside repo, private/public separation, three distinct signed codes verified by WebCrypto');
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
