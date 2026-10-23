'use strict';
const {validateRequest,validateIntegrity,validateGooglePurchase}=require('./core');
const {accountRequest,pseudonym,issueSession,verifySession}=require('./account');

/** Financial route orchestration; all external Google/Firestore operations injected. */
async function verifyPurchase(body, deps) {
 const req=validateRequest(body);
 if(!req)return {code:400,body:{error:'invalid-request'}};
 const verdict=await deps.decodeIntegrity(req);
 if(!validateIntegrity(verdict,req,deps.appCert,deps.now?.()||Date.now()))
  return {code:403,body:{error:'app-attestation-rejected'}};
 if(req.accountSession){
  req.accountHash=verifySession(deps.sessionSecret,req.accountSession,deps.now?.()||Date.now());
  if(!req.accountHash)return {code:401,body:{error:'account-session-invalid'}};
 }
 const purchase=await deps.verifyWithGoogle(req);
 if(!validateGooglePurchase(purchase,req))
  return {code:403,body:{error:'purchase-rejected'}};
 if(!await deps.reserve(req,purchase))
  return {code:409,body:{error:'purchase-owner-conflict'}};
 return {code:200,body:{verified:true,productId:req.productId,receiptId:req.receiptId}};
}
async function linkAccount(body,deps) {
 const req=accountRequest(body);
 if(!req)return {code:400,body:{error:'invalid-request'}};
 if(!deps.sessionSecret||deps.sessionSecret.length<32 ||
    !deps.pseudonymKey||deps.pseudonymKey.length<32)
  return {code:503,body:{error:'account-link-unconfigured'}};
 const verdict=await deps.decodeIntegrity(req);
 if(!validateIntegrity(verdict,req,deps.appCert,deps.now?.()||Date.now()))
  return {code:403,body:{error:'app-attestation-rejected'}};
 const playerId=await deps.exchangePlayerId(req.authCode);
 const id=pseudonym(deps.pseudonymKey,playerId);
 return {code:200,body:{verified:true,
  accountSession:issueSession(deps.sessionSecret,id,deps.now?.()||Date.now()),
  expiresInSeconds:900}};
}
module.exports={verifyPurchase,linkAccount};
