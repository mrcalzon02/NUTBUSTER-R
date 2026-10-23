'use strict';
// HTTPS Cloud Run backend. Does not hold card details, account emails or Google tokens in logs.
const http=require('node:http');
const {GoogleAuth}=require('google-auth-library');
const {Firestore,FieldValue}=require('@google-cloud/firestore');
const {PACKAGE,validateRequest,validateIntegrity,validateGooglePurchase,validateOwner}=require('./core');
const db=new Firestore();
const publisherAuth=new GoogleAuth({scopes:['https://www.googleapis.com/auth/androidpublisher']});
const integrityAuth=new GoogleAuth({scopes:['https://www.googleapis.com/auth/playintegrity']});
const appCert=(process.env.PLAY_APP_SIGNING_CERT_SHA256||'').toLowerCase();
function configured(){
 return /^[0-9a-f]{64}$/.test(appCert)&&/^[0-9]+$/.test(process.env.PLAY_INTEGRITY_PROJECT_NUMBER||'');
}
async function decodeIntegrity(req){
 const client=await integrityAuth.getClient();
 const url='https://playintegrity.googleapis.com/v1/'+PACKAGE+':decodeIntegrityToken';
 const result=await client.request({url,method:'POST',data:{integrity_token:req.integrityToken}});
 return result.data?.tokenPayloadExternal;
}
async function verifyWithGoogle(req){
 const client=await publisherAuth.getClient();
 const url='https://androidpublisher.googleapis.com/androidpublisher/v3/applications/'+PACKAGE+
  '/purchases/productsv2/tokens/'+encodeURIComponent(req.purchaseToken);
 const result=await client.request({url,method:'GET'});
 return result.data;
}
async function reserve(req,purchase){
 const doc=db.collection('nutbuster-play-purchases-v2').doc(req.receiptId);
 return db.runTransaction(async tx=>{
  const prior=await tx.get(doc);
  if(prior.exists)return validateOwner(prior.data(),req);
  tx.create(doc,{productId:req.productId,installHash:req.installHash,
   purchasedAt:purchase.purchaseCompletionTime,createdAt:FieldValue.serverTimestamp(),revoked:false});
  return true;
 });
}
function respond(res,code,body){
 res.writeHead(code,{'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff'});
 res.end(JSON.stringify(body));
}
async function readJson(req){
 if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return null;
 const len=Number(req.headers['content-length']);
 if(Number.isFinite(len)&&len>16384)return null;
 let size=0,chunks=[];
 for await(const chunk of req){
  size+=chunk.length;
  if(size>16384)return null;
  chunks.push(chunk);
 }
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
 catch(_){return null;}
}
async function handle(req,res,deps={}){
 if(req.method!=='POST'||req.url!=='/verify'){respond(res,404,{error:'not-found'});return;}
 if(!configured()){respond(res,503,{error:'verification-not-configured'});return;}
 const body=await readJson(req),purchaseReq=validateRequest(body);
 if(!purchaseReq){respond(res,400,{error:'invalid-request'});return;}
 const integrity=deps.decodeIntegrity||decodeIntegrity;
 const google=deps.verifyWithGoogle||verifyWithGoogle;
 const ledger=deps.reserve||reserve;
 try{
  const verdict=await integrity(purchaseReq);
  if(!validateIntegrity(verdict,purchaseReq,appCert)){respond(res,403,{error:'app-attestation-rejected'});return;}
  const purchase=await google(purchaseReq);
  if(!validateGooglePurchase(purchase,purchaseReq)){respond(res,403,{error:'purchase-rejected'});return;}
  if(!await ledger(purchaseReq,purchase)){respond(res,409,{error:'purchase-owner-conflict'});return;}
  respond(res,200,{verified:true,productId:purchaseReq.productId,receiptId:purchaseReq.receiptId});
 }catch(e){
  // NEVER include exception, request payload, purchase token, code or account ID in logs.
  console.error('Play financial verification request failed');
  respond(res,503,{error:'verification-unavailable'});
 }
}
if(require.main===module){
 http.createServer((req,res)=>{handle(req,res).catch(()=>{
  if(!res.headersSent)respond(res,503,{error:'verification-unavailable'});
 });}).listen(Number(process.env.PORT)||8080,'0.0.0.0');
}
module.exports={handle,decodeIntegrity,verifyWithGoogle,reserve,configured};
