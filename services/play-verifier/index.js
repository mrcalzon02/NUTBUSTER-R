'use strict';
// NUTBUSTER Play verification service — cloud-only, never embed publisher credentials in the APK.
const http=require('node:http');
const {GoogleAuth}=require('google-auth-library');
const {Firestore,FieldValue}=require('@google-cloud/firestore');
const {PACKAGE,PRODUCTS,validateRequest,validateGooglePurchase,validateOwner}=require('./core');
const db=new Firestore();
const auth=new GoogleAuth({scopes:['https://www.googleapis.com/auth/androidpublisher']});
async function verifyWithGoogle(req){
 const client=await auth.getClient();
 const url='https://androidpublisher.googleapis.com/androidpublisher/v3/applications/'+PACKAGE+
    '/purchases/productsv2/tokens/'+encodeURIComponent(req.purchaseToken);
 const response=await client.request({url,method:'GET'});
 return response.data;
}
async function reserve(req,verified){
 const doc=db.collection('nutbuster-play-purchases-v1').doc(req.receiptId);
 return db.runTransaction(async tx=>{
   const snapshot=await tx.get(doc);
   if(snapshot.exists){
     const old=snapshot.data();
     if(!validateOwner(old,req))return false;
     if(old.revoked===true)return false;
     return true;
   }
   tx.create(doc,{productId:req.productId,installHash:req.installHash,
     purchasedAt:verified.purchaseCompletionTime,
     createdAt:FieldValue.serverTimestamp(),revoked:false});
   return true;
 });
}
function respond(res,code,obj){
 res.writeHead(code,{'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(JSON.stringify(obj));
}
async function handle(req,res){
 if(req.method!=='POST'||req.url!=='/verify'){respond(res,404,{error:'not-found'});return;}
 if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json'){
   respond(res,415,{error:'json-required'});return;
 }
 let bytes=0,chunks=[];
 for await(const chunk of req){
   bytes+=chunk.length;if(bytes>8192){respond(res,413,{error:'too-large'});return;}
   chunks.push(chunk);
 }
 let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}
 catch(_){respond(res,400,{error:'bad-json'});return;}
 const request=validateRequest(body);
 if(!request){respond(res,400,{error:'invalid-request'});return;}
 try{
   const purchase=await verifyWithGoogle(request);
   if(!validateGooglePurchase(purchase,request)){
     respond(res,403,{error:'not-purchased'});return;
   }
   if(!await reserve(request,purchase)){
     respond(res,409,{error:'already-claimed-on-another-install'});return;
   }
   respond(res,200,{verified:true,productId:request.productId,receiptId:request.receiptId});
 }catch(error){
   console.error('Play verification service unavailable:',error?.message||error);
   respond(res,503,{error:'verification-unavailable'});
 }
}
if(require.main===module){
 const port=Number(process.env.PORT)||8080;
 http.createServer((req,res)=>{handle(req,res).catch(err=>{
   console.error('Uncaught verifier error:',err?.message||err);
   if(!res.headersSent)respond(res,503,{error:'unavailable'});
 });}).listen(port,'0.0.0.0');
}
module.exports={handle,verifyWithGoogle,reserve};
