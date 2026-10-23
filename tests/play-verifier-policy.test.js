const assert=require('node:assert/strict');
const v=require('../services/play-verifier/core');
const base={packageName:v.PACKAGE,productId:'nutbuster_lifetime_vip',
 purchaseToken:'purchase_01234567890123456789',installId:'12345678-1234-1234-1234-123456789012'};
const request=v.validateRequest(base);
assert.ok(request);
assert.match(request.receiptId,/^[0-9a-f]{64}$/);
assert.ok(!JSON.stringify(request).includes('secret-access-token'));
assert.equal(v.validateRequest({...base,packageName:'wrong.app'}),null);
assert.equal(v.validateRequest({...base,productId:'unknown'}),null);
assert.equal(v.validateRequest({...base,purchaseToken:'short'}),null);
assert.equal(v.validateRequest({...base,installId:'invalid'}),null);
const owned={purchaseStateContext:{purchaseState:'PURCHASED'},
 purchaseCompletionTime:'2026-10-23T12:00:00Z',
 productLineItem:[{productId:base.productId,productOfferDetails:{quantity:1,refundableQuantity:1}}]};
assert.equal(v.validateGooglePurchase(owned,request),true);
assert.equal(v.validateGooglePurchase({...owned,purchaseStateContext:{purchaseState:'PENDING'}},request),false);
assert.equal(v.validateGooglePurchase({...owned,productLineItem:[{productId:'other'}]},request),false);
assert.equal(v.validateGooglePurchase({...owned,productLineItem:[{productId:base.productId,productOfferDetails:{quantity:2}}]},request),false);
assert.equal(v.validateGooglePurchase({...owned,productLineItem:[]},request),false);
const row={productId:base.productId,installHash:request.installHash};
assert.equal(v.validateOwner(row,request),true);
assert.equal(v.validateOwner(row,{...request,installHash:'another'}),true,'durables restorable on another install');
assert.equal(v.validateOwner({...row,productId:'nutbuster_gigantic_nuts'},request),false);
const consumable=v.validateRequest({...base,productId:'nutbuster_gigantic_nuts'});
assert.equal(v.validateOwner({productId:consumable.productId,installHash:consumable.installHash},consumable),true);
assert.equal(v.validateOwner({productId:consumable.productId,installHash:'another'},consumable),false);
console.log('PASS: Play purchase validation, pending/refunds, product IDs and install-bound consumables');
