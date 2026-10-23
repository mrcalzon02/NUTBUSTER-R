'use strict';
const {createHash,timingSafeEqual}=require('node:crypto');
const PACKAGE='io.github.mrcalzon02.nutbuster';
const PRODUCTS=Object.freeze({
 nutbuster_gigantic_nuts:'consumable',nutbuster_premium_gems:'consumable',
 nutbuster_royal_bundle:'consumable',nutbuster_century_chest:'consumable',
 nutbuster_lifetime_vip:'durable',nutbuster_booster_crate:'consumable',
 nutbuster_royal_manor:'durable'
});
const VERSION='nutbuster-play-integrity-v1';
const MAX_AGE_MS=120000;
const sha256=s=>createHash('sha256').update(s).digest('hex');
const validUuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s);
function validateRequest(body){
 if(!body||body.packageName!==PACKAGE||!Object.hasOwn(PRODUCTS,body.productId)||
    typeof body.purchaseToken!=='string'|| !/^[a-zA-Z0-9._:-]{20,4096}$/.test(body.purchaseToken)||
    !validUuid(body.installId)||!validUuid(body.attemptId)||
    typeof body.integrityToken!=='string'||body.integrityToken.length<40||body.integrityToken.length>8192)
   return null;
 return {packageName:PACKAGE,productId:body.productId,purchaseToken:body.purchaseToken,
  integrityToken:body.integrityToken,installHash:sha256(body.installId),
  attemptId:body.attemptId,receiptId:sha256(body.purchaseToken),
  requestHash:requestHash(PACKAGE,body.productId,body.purchaseToken,body.installId,body.attemptId)};
}
function requestHash(pkg,sku,token,install,attempt){
 return sha256([VERSION,pkg,sku,token,install,attempt].join('\n'));
}
function equalHex(a,b){
 if(!/^[a-f0-9]{64}$/.test(a)||!/^[a-f0-9]{64}$/.test(b))return false;
 return timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
}
function validateIntegrity(verdict,req,expectedCert,now=Date.now()){
 const d=verdict?.requestDetails,app=verdict?.appIntegrity;
 if(!d||!app||d.requestPackageName!==PACKAGE||d.requestHash!==req.requestHash||
  app.appRecognitionVerdict!=='PLAY_RECOGNIZED'||app.packageName!==PACKAGE)return false;
 const issued=Number(d.timestampMillis);
 if(!Number.isSafeInteger(issued)||issued>now+30000||now-issued>MAX_AGE_MS)return false;
 if(!/^[a-fA-F0-9]{64}$/.test(expectedCert||''))return false;
 const fingerprints=app.certificateSha256Digest;
 if(!Array.isArray(fingerprints)||!fingerprints.length)return false;
 return fingerprints.some(encoded=>{
  if(typeof encoded!=='string'||!/^[A-Za-z0-9_-]{43}=?$/.test(encoded))return false;
  try{return equalHex(Buffer.from(encoded,'base64url').toString('hex'),expectedCert.toLowerCase());}
  catch(_){return false;}
 });
}
function validateGooglePurchase(verified,request){
 if(!verified||verified.purchaseStateContext?.purchaseState!=='PURCHASED'||
 !verified.purchaseCompletionTime||!Array.isArray(verified.productLineItem)||
 verified.productLineItem.length!==1)return false;
 const item=verified.productLineItem[0],offer=item.productOfferDetails||{};
 if(item.productId!==request.productId)return false;
 if(offer.quantity!==undefined&&Number(offer.quantity)!==1)return false;
 if(offer.refundableQuantity!==undefined&&Number(offer.refundableQuantity)!==1)return false;
 if(verified.testPurchaseContext && process.env.DENY_TEST_PURCHASES==='true')return false;
 return true;
}
function validateOwner(row,request){
 return !!row && row.productId===request.productId && row.revoked!==true &&
 (PRODUCTS[request.productId]==='durable'||row.installHash===request.installHash);
}
module.exports={PACKAGE,PRODUCTS,VERSION,MAX_AGE_MS,sha256,requestHash,validateRequest,
 validateIntegrity,validateGooglePurchase,validateOwner};
