'use strict';
const {createHmac,timingSafeEqual}=require('node:crypto');
const {PACKAGE,sha256}=require('./core');
const SESSION_SECONDS=900, VERSION='nutbuster-play-account-v1';
function accountRequest(body){
 if(!body||body.packageName!==PACKAGE||
  typeof body.authCode!=='string'||body.authCode.length<16||body.authCode.length>2048||
  typeof body.installId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(body.installId)||
  typeof body.attemptId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(body.attemptId)||
  typeof body.integrityToken!=='string'||body.integrityToken.length<40||body.integrityToken.length>8192)return null;
 return {packageName:PACKAGE,authCode:body.authCode,installId:body.installId,attemptId:body.attemptId,
  integrityToken:body.integrityToken,
  requestHash:sha256([VERSION,PACKAGE,body.authCode,body.installId,body.attemptId].join('\n'))};
}
const mac=(secret,s)=>createHmac('sha256',secret).update(s).digest('base64url');
function pseudonym(secret,rawId){
 if(typeof secret!=='string'||secret.length<32||
  typeof rawId!=='string'||!rawId||rawId.length>256)throw Error('Invalid account pseudonym input');
 return createHmac('sha256',secret).update('nutbuster-pgs-v1\n'+rawId).digest('hex');
}
function issueSession(secret,accountHash,now=Date.now()){
 if(typeof secret!=='string'||secret.length<32||!/^[0-9a-f]{64}$/.test(accountHash))throw Error('Invalid session key');
 const data=Buffer.from(JSON.stringify({v:1,aud:PACKAGE,sub:accountHash,
  iat:Math.floor(now/1000),exp:Math.floor(now/1000)+SESSION_SECONDS})).toString('base64url');
 return data+'.'+mac(secret,'nutbuster-account-session-v1.'+data);
}
function verifySession(secret,session,now=Date.now()){
 if(typeof secret!=='string'||secret.length<32||
 typeof session!=='string'||session.length>1024)return null;
 const parts=session.split('.');
 if(parts.length!==2||!parts[0].match(/^[A-Za-z0-9_-]+$/)||!parts[1].match(/^[A-Za-z0-9_-]{43}$/))return null;
 const expected=mac(secret,'nutbuster-account-session-v1.'+parts[0]);
 if(!timingSafeEqual(Buffer.from(expected),Buffer.from(parts[1])))return null;
 try{
  const value=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
  const nowSec=Math.floor(now/1000);
  if(value.v!==1||value.aud!==PACKAGE||typeof value.sub!=='string'||
   !/^[0-9a-f]{64}$/.test(value.sub)||!Number.isInteger(value.iat)||
   !Number.isInteger(value.exp)||value.exp-value.iat!==SESSION_SECONDS||
   value.iat>nowSec+30||value.exp<=nowSec)return null;
  return value.sub;
 }catch(_){return null;}
}
module.exports={accountRequest,pseudonym,issueSession,verifySession,SESSION_SECONDS};
