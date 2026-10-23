'use strict';
const assert=require('node:assert/strict');
const {verifyPurchase,linkAccount}=require('../services/play-verifier/flow');
const V=require('../services/play-verifier/core');
const A=require('../services/play-verifier/account');
const now=Date.parse('2026-10-23T12:00:00Z');
const CERT='ab'.repeat(32),SECRET='test-account-session-secret-string-over-32-chars';
const purchaseBody={
 packageName:V.PACKAGE,productId:'nutbuster_lifetime_vip',
 purchaseToken:'purchase_01234567890123456789',
 installId:'12345678-1234-1234-1234-123456789012',
 attemptId:'55555555-5555-4555-8555-555555555555',
 integrityToken:'some-play-integrity-token-'.repeat(4)
};
const certToken=Buffer.from(CERT,'hex').toString('base64url');
const purchased={purchaseStateContext:{purchaseState:'PURCHASED'},
 purchaseCompletionTime:'2026-10-23T11:59:00Z',
 productLineItem:[{productId:purchaseBody.productId,productOfferDetails:{quantity:1,refundableQuantity:1}}]};
const verdict=req=>({
 requestDetails:{requestPackageName:V.PACKAGE,requestHash:req.requestHash,timestampMillis:String(now-1000)},
 appIntegrity:{packageName:V.PACKAGE,appRecognitionVerdict:'PLAY_RECOGNIZED',certificateSha256Digest:[certToken]}
});
function makeDeps(){
 const calls={integrity:0,play:0,reserve:0};
 const deps={
  appCert:CERT,sessionSecret:SECRET,pseudonymKey:SECRET,now:()=>now,
  decodeIntegrity:async req=>(calls.integrity++,verdict(req)),
  verifyWithGoogle:async req=>(calls.play++,purchased),
  reserve:async()=>{calls.reserve++;return true;},
  exchangePlayerId:async()=> 'opaque-player-id-do-not-store'
 };
 return {calls,deps};
}
(async()=>{
 const x=makeDeps(),success=await verifyPurchase(purchaseBody,x.deps);
 assert.equal(success.code,200);
 assert.match(success.body.receiptId,/^[0-9a-f]{64}$/);
 assert.equal(success.body.productId,purchaseBody.productId);
 assert.equal(x.calls.integrity,1);assert.equal(x.calls.play,1);assert.equal(x.calls.reserve,1);
 const legacyPack=await verifyPurchase({...purchaseBody,productId:'nutbuster_gigantic_nuts'},x.deps);
 assert.equal(legacyPack.code,400,'former paid SKU no longer an authorized Play transaction');
 const invalid=await verifyPurchase({...purchaseBody,purchaseToken:'invalid'},x.deps);
 assert.equal(invalid.code,400,'invalid request rejected BEFORE provider call');
 assert.equal(x.calls.play,1);
 const wrongApp=makeDeps();
 wrongApp.deps.decodeIntegrity=async req=>({...verdict(req),appIntegrity:{...verdict(req).appIntegrity,appRecognitionVerdict:'UNRECOGNIZED_VERSION'}});
 assert.equal((await verifyPurchase(purchaseBody,wrongApp.deps)).code,403);
 assert.equal(wrongApp.calls.play,0,'tampered APK must never query purchased receipts');
 const wrongCert=makeDeps();wrongCert.deps.appCert='cd'.repeat(32);
 assert.equal((await verifyPurchase(purchaseBody,wrongCert.deps)).code,403);
 assert.equal(wrongCert.calls.play,0,'unknown signer denied before payment lookup');
 const replay=makeDeps();
 replay.deps.decodeIntegrity=async req=>({...verdict(req),requestDetails:{...verdict(req).requestDetails,requestHash:'0'.repeat(64)}});
 assert.equal((await verifyPurchase(purchaseBody,replay.deps)).code,403);
 assert.equal(replay.calls.play,0,'mismatched request hash rejected');
 const pending=makeDeps();
 pending.deps.verifyWithGoogle=async()=>({...purchased,purchaseStateContext:{purchaseState:'PENDING'}});
 assert.equal((await verifyPurchase(purchaseBody,pending.deps)).code,403);
 assert.equal(pending.calls.reserve,0,'pending must not persist grant');
 const conflict=makeDeps();
 conflict.deps.reserve=async()=>false;
 assert.equal((await verifyPurchase(purchaseBody,conflict.deps)).code,409);
 const acct=makeDeps(),authCode='single-use-google-auth-code-not-an-email';
 const accountBody={packageName:V.PACKAGE,authCode,installId:purchaseBody.installId,
  attemptId:purchaseBody.attemptId,integrityToken:purchaseBody.integrityToken};
 const linked=await linkAccount(accountBody,acct.deps);
 assert.equal(linked.code,200);
 assert.equal(linked.body.verified,true);
 assert.equal(linked.body.expiresInSeconds,900);
 assert.equal(JSON.stringify(linked).includes(authCode),false,'never echo Google auth code');
 assert.equal(JSON.stringify(linked).includes('opaque-player'),false,'never echo raw PGS player ID');
 const linkedId=A.verifySession(SECRET,linked.body.accountSession,now);
 assert.ok(linkedId);
 const tied=makeDeps();
 tied.deps.reserve=async req=>{assert.equal(req.accountHash,linkedId);return true;};
 assert.equal((await verifyPurchase({...purchaseBody,accountSession:linked.body.accountSession},tied.deps)).code,200);
 const badSession=makeDeps();
 const stolen=linked.body.accountSession.slice(0,-1)+'!';
 assert.equal((await verifyPurchase({...purchaseBody,accountSession:stolen},badSession.deps)).code,401);
 assert.equal(badSession.calls.play,0,'bad account signature must block billing lookup');
 const expired=makeDeps();expired.deps.now=()=>now+901000;
 expired.deps.decodeIntegrity=async req=>({...verdict(req),requestDetails:{
  ...verdict(req).requestDetails,timestampMillis:String(now+900000)}});
 assert.equal((await verifyPurchase({...purchaseBody,accountSession:linked.body.accountSession},expired.deps)).code,401);
 const noServer=makeDeps();noServer.deps.sessionSecret='';
 assert.equal((await linkAccount(accountBody,noServer.deps)).code,503,'unconfigured auth server fails closed');
 const missingPseudonym=makeDeps();missingPseudonym.deps.pseudonymKey='';
 assert.equal((await linkAccount(accountBody,missingPseudonym.deps)).code,503,'stable account pseudonym key required');
 const rotatedSigner=makeDeps();
 rotatedSigner.deps.sessionSecret='new-rotated-session-signing-secret-1234567';
 rotatedSigner.deps.pseudonymKey=SECRET;
 const linkedAgain=await linkAccount(accountBody,rotatedSigner.deps);
 const stableAccount=A.verifySession(rotatedSigner.deps.sessionSecret,linkedAgain.body.accountSession,now);
 assert.equal(stableAccount,linkedId,'rotating session signature must preserve pseudonymous owner');
 console.log('PASS: real orchestrator rejects invalid app, replay, unknown signer, pending, conflicts, forged/expired accounts');
})().catch(e=>{console.error(e);process.exitCode=1;});
