'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const V=require('../services/play-verifier/core');
const A=require('../services/play-verifier/account');
const INSTALL='12345678-1234-1234-1234-123456789012',ATTEMPT='55555555-5555-4555-8555-555555555555';
const CERT='11'.repeat(32),CERT_BASE64=Buffer.from(CERT,'hex').toString('base64url');
const TOKEN='purchase_01234567890123456789',IT='integrity-test-token-'.repeat(4);
const request={
 packageName:V.PACKAGE,productId:'nutbuster_lifetime_vip',
 purchaseToken:TOKEN,installId:INSTALL,attemptId:ATTEMPT,integrityToken:IT
};
const req=V.validateRequest(request);
assert.ok(req,'valid purchase proof');
assert.equal(req.receiptId,crypto.createHash('sha256').update(TOKEN).digest('hex'));
assert.equal(req.requestHash,V.requestHash(V.PACKAGE,request.productId,TOKEN,INSTALL,ATTEMPT));
for(const bad of [{...request,integrityToken:undefined},{...request,attemptId:undefined},
 {...request,packageName:'someone.else.app'},{...request,productId:'unknown'},
 {...request,purchaseToken:'123'}, {...request,installId:'corrupt'}])assert.equal(V.validateRequest(bad),null);
const now=Date.parse('2026-10-23T12:00:00Z');
const integrity={requestDetails:{
 requestPackageName:V.PACKAGE,requestHash:req.requestHash,timestampMillis:String(now-20000)},
 appIntegrity:{appRecognitionVerdict:'PLAY_RECOGNIZED',packageName:V.PACKAGE,
 certificateSha256Digest:[CERT_BASE64]}};
assert.equal(V.validateIntegrity(integrity,req,CERT,now),true,'signed genuine Play version');
assert.equal(V.validateIntegrity({...integrity,requestDetails:{...integrity.requestDetails,requestHash:'f'.repeat(64)}},req,CERT,now),false,'reject replay of token for another purchase');
assert.equal(V.validateIntegrity({...integrity,requestDetails:{...integrity.requestDetails,timestampMillis:String(now-240000)}},req,CERT,now),false,'expired attestation');
assert.equal(V.validateIntegrity({...integrity,requestDetails:{...integrity.requestDetails,timestampMillis:String(now+120000)}},req,CERT,now),false,'future attestation');
assert.equal(V.validateIntegrity({...integrity,appIntegrity:{...integrity.appIntegrity,appRecognitionVerdict:'UNRECOGNIZED_VERSION'}},req,CERT,now),false,'modified binary');
assert.equal(V.validateIntegrity({...integrity,appIntegrity:{...integrity.appIntegrity,certificateSha256Digest:[Buffer.from('22'.repeat(32),'hex').toString('base64url')]}},req,CERT,now),false,'wrong Play signing certificate');
assert.equal(V.validateIntegrity(integrity,req,'',now),false,'unconfigured signing refuses paid verification');
const item={purchaseStateContext:{purchaseState:'PURCHASED'},purchaseCompletionTime:'2026-10-23T11:58:00Z',
 productLineItem:[{productId:request.productId,productOfferDetails:{quantity:1,refundableQuantity:1}}]};
assert.equal(V.validateGooglePurchase(item,req),true);
assert.equal(V.validateGooglePurchase({...item,purchaseStateContext:{purchaseState:'PENDING'}},req),false);
assert.equal(V.validateGooglePurchase({...item,purchaseStateContext:{purchaseState:'CANCELLED'}},req),false);
assert.equal(V.validateGooglePurchase({...item,productLineItem:[{productId:'other'}]},req),false);
assert.equal(V.validateGooglePurchase({...item,productLineItem:[]},req),false);
assert.equal(V.validateGooglePurchase({...item,productLineItem:[{productId:request.productId,productOfferDetails:{refundableQuantity:0}}]},req),false);
const SECRET='this-is-a-long-local-only-test-secret-please-replace';
const player=A.pseudonym(SECRET,'opaque-PGS-player-ID-123');
assert.match(player,/^[0-9a-f]{64}$/);
assert.ok(!player.includes('opaque'));
const session=A.issueSession(SECRET,player,now);
assert.equal(A.verifySession(SECRET,session,now+60000),player);
assert.equal(A.verifySession(SECRET,session,now+901000),null,'expired session rejected');
assert.equal(A.verifySession(SECRET,session.slice(0,-3)+'abc',now),null,'forged MAC rejected');
assert.equal(A.verifySession('wrong-secret-but-still-at-least-thirty-two',session,now),null,'wrong signer rejected');
const anonymous={productId:request.productId,installHash:req.installHash};
assert.equal(V.validateOwner(anonymous,req),true,'durable Play-owned receipt can be restored');
assert.equal(V.validateOwner({...anonymous,accountHash:player},req),false,'linked purchase requires its verified account');
assert.equal(V.validateOwner({...anonymous,accountHash:player},{...req,accountHash:player}),true);
assert.equal(V.validateOwner({...anonymous,accountHash:player},{...req,accountHash:'0'.repeat(64)}),false);
const consumable=V.validateRequest({...request,productId:'nutbuster_gigantic_nuts'});
assert.equal(V.validateOwner({productId:consumable.productId,installHash:consumable.installHash},consumable),true);
assert.equal(V.validateOwner({productId:consumable.productId,installHash:'other'},consumable),false);
const auth=A.accountRequest({packageName:V.PACKAGE,authCode:'one-time-server-oauth-code-123456',
 installId:INSTALL,attemptId:ATTEMPT,integrityToken:IT});
assert.ok(auth);
assert.equal(auth.requestHash,crypto.createHash('sha256').update(
 ['nutbuster-play-account-v1',V.PACKAGE,'one-time-server-oauth-code-123456',INSTALL,ATTEMPT].join('\n')).digest('hex'));
assert.equal(A.accountRequest({packageName:V.PACKAGE,authCode:'short'}),null);
console.log('PASS: purchase-state, app signing, integrity freshness/binding, pseudonymous sessions, account/receipt ownership');
