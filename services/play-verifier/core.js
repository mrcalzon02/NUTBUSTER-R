'use strict';
const {createHash}=require('node:crypto');
const PACKAGE='io.github.mrcalzon02.nutbuster';
const PRODUCTS=Object.freeze({
  nutbuster_gigantic_nuts:'consumable',
  nutbuster_premium_gems:'consumable',
  nutbuster_royal_bundle:'consumable',
  nutbuster_century_chest:'consumable',
  nutbuster_lifetime_vip:'durable',
  nutbuster_booster_crate:'consumable',
  nutbuster_royal_manor:'durable'
});
function sha256(s){return createHash('sha256').update(s).digest('hex');}
function validateRequest(input){
 if(!input||input.packageName!==PACKAGE||!Object.hasOwn(PRODUCTS,input.productId)||
  typeof input.purchaseToken!=='string'||!/^[-a-zA-Z0-9._:]{20,4096}$/.test(input.purchaseToken)||
  typeof input.installId!=='string'||!/^[a-f0-9-]{36}$/.test(input.installId))return null;
 return {packageName:PACKAGE,productId:input.productId,purchaseToken:input.purchaseToken,
   installHash:sha256(input.installId),receiptId:sha256(input.purchaseToken)};
}
function validateGooglePurchase(verified,request){
 if(!verified||verified.purchaseStateContext?.purchaseState!=='PURCHASED'||
    !verified.purchaseCompletionTime||
    !Array.isArray(verified.productLineItem)||verified.productLineItem.length!==1)return false;
 const line=verified.productLineItem[0],details=line.productOfferDetails||{};
 if(line.productId!==request.productId)return false;
 if(details.quantity!==undefined && Number(details.quantity)!==1)return false;
 if(details.refundableQuantity!==undefined && Number(details.refundableQuantity)!==1)return false;
 return true;
}
function validateOwner(row,request){
 return !!row && row.productId===request.productId &&
  (PRODUCTS[request.productId]==='durable' || row.installHash===request.installHash);
}
module.exports={PACKAGE,PRODUCTS,sha256,validateRequest,validateGooglePurchase,validateOwner};
