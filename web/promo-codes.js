/* Nutbuster offline promo verifier. Signatures prove issuer authenticity; local saved
   nonce ledger prevents replay only within that save. Global single-use needs a server.
   Issuer private keys must NEVER be packaged or committed. */
(function(root){'use strict';
const PREFIX='NBR1',MAX_LENGTH=1024,MAX_RECORDS=5000;
const BOOSTERS=new Set(['hammer','extra','row','shuffle','column','blast','cross','color','drill','unlock']);
const integers=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const nowValue=n=>Number.isFinite(Number(n))?Math.max(0,Math.trunc(Number(n))):Date.now();
const cleanCode=v=>String(v||'').trim().replace(/\s+/g,'');
function decode64(s){
 if(!/^[A-Za-z0-9_-]+$/.test(s)||s.length%4===1)throw Error('format');
 const padded=s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4);
 const decoder=root.atob||((typeof atob==='function')?atob:null);
 if(typeof decoder!=='function')throw Error('decoder');
 const bin=decoder(padded),arr=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
 return arr;
}
function utf8(bytes){
 const Decoder=root.TextDecoder||((typeof TextDecoder==='function')?TextDecoder:null);
 if(!Decoder)throw Error('decoder');
 return new Decoder('utf-8',{fatal:true}).decode(bytes);
}
function textBytes(value){
 const Encoder=root.TextEncoder||((typeof TextEncoder==='function')?TextEncoder:null);
 if(!Encoder)throw Error('encoder');
 return new Encoder().encode(value);
}
function format(input){
 const raw=cleanCode(input),parts=raw.split('.');
 if(raw.length>MAX_LENGTH||parts.length!==3||parts[0]!==PREFIX)throw Error('format');
 if(parts[1].length<16||parts[1].length>800||parts[2].length!==86)throw Error('format');
 const bytes=decode64(parts[1]),sig=decode64(parts[2]);
 if(sig.length!==64)throw Error('format');
 const payload=JSON.parse(utf8(bytes));
 if(!payload||Array.isArray(payload)||typeof payload!=='object')throw Error('format');
 return {payload,sig,signed:parts[0]+'.'+parts[1]};
}
function validate(payload){
 if(payload.v!==1||typeof payload.kid!=='string'||!/^[a-zA-Z0-9-]{1,32}$/.test(payload.kid))return false;
 if(typeof payload.nonce!=='string'||!/^[a-f0-9]{32}$/.test(payload.nonce))return false;
 if(!integers(payload.nbf,4102444800000)||!integers(payload.exp,4102444800000))return false;
 if(payload.exp!==0&&payload.exp<=payload.nbf)return false;
 const g=payload.grant;
 if(!g||typeof g!=='object'||Array.isArray(g))return false;
 for(const key of Object.keys(g))if(!['nuts','gems','moves','hearts','vip','boosters'].includes(key))return false;
 if(!integers(g.nuts||0,100000)||!integers(g.gems||0,10000)||!integers(g.moves||0,50)||!integers(g.hearts||0,5))return false;
 if(g.vip!==undefined&&typeof g.vip!=='boolean')return false;
 const boosters=g.boosters||{};
 if(!boosters||typeof boosters!=='object'||Array.isArray(boosters))return false;
 for(const [id,n] of Object.entries(boosters))if(!BOOSTERS.has(id)||!integers(n,20)||n===0)return false;
 return Boolean(g.nuts||g.gems||g.moves||g.hearts||g.vip||Object.keys(boosters).length);
}
async function verify(code,{keys=root.NutPromoKeys?.keys||{},cryptoImpl=root.crypto,now=Date.now()}={}){
 let parsed;
 try{parsed=format(code);}catch(_){return {valid:false,reason:'invalid-format'};}
 const p=parsed.payload;
 if(!validate(p))return {valid:false,reason:'invalid-format'};
 const jwk=Object.prototype.hasOwnProperty.call(keys,p.kid)?keys[p.kid]:null;
 if(!jwk)return {valid:false,reason:'unknown-issuer'};
 if(!cryptoImpl?.subtle?.importKey||!cryptoImpl?.subtle?.verify)return {valid:false,reason:'crypto-unavailable'};
 try{
  const pub=await cryptoImpl.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  const authentic=await cryptoImpl.subtle.verify({name:'ECDSA',hash:'SHA-256'},pub,parsed.sig,textBytes(parsed.signed));
  if(!authentic)return {valid:false,reason:'bad-signature'};
 }catch(_){return {valid:false,reason:'verification-failed'};}
 const t=nowValue(now);
 if(t<p.nbf)return {valid:false,reason:'not-yet-valid'};
 if(p.exp!==0&&t>=p.exp)return {valid:false,reason:'expired'};
 return {valid:true,payload:p};
}
function ledger(save){
 if(!save.promoRedemptions||typeof save.promoRedemptions!=='object'||Array.isArray(save.promoRedemptions))save.promoRedemptions={};
 return save.promoRedemptions;
}
function apply(save,verified,{P,D,B,at=Date.now(),cap=36}={}){
 if(!verified?.valid||!validate(verified.payload))return {valid:false,reason:'unverified'};
 const p=verified.payload,history=ledger(save);
 if(Object.prototype.hasOwnProperty.call(history,p.nonce))return {valid:false,reason:'already-redeemed'};
 if(Object.keys(history).length>=MAX_RECORDS)return {valid:false,reason:'ledger-full'};
 if(!P?.available||!P?.grant||!D?.topUp)return {valid:false,reason:'integration'};
 const grant=p.grant,active=P.available(save);
 const pack={};
 for(const [id,n] of Object.entries(grant.boosters||{})){
  const target=P.unlocked(save,id)?id:active[active.length-1];
  if(!target)return {valid:false,reason:'locked'};
  pack[target]=(pack[target]||0)+n;
 }
 const alreadyVip=!!save.vip;
 if(grant.vip&&alreadyVip&&!grant.nuts&&!grant.gems&&!grant.moves&&!grant.hearts&&!Object.keys(pack).length)return {valid:false,reason:'already-owned'};
 const hearts=Number.isFinite(Number(save.hearts))?Math.max(0,Math.min(5,Math.trunc(Number(save.hearts)))):0;
 if(grant.hearts&&hearts>=5&&!grant.nuts&&!grant.gems&&!grant.moves&&!grant.vip&&!Object.keys(pack).length)return {valid:false,reason:'hearts-full'};
 const before=Object.fromEntries(Object.keys(pack).map(id=>[id,P.count(save,id)]));
 const received=P.grant(save,pack);
 if(received!==Object.values(pack).reduce((a,b)=>a+b,0))throw Error('Promo booster inventory desynchronized');
 if(grant.moves)D.topUp(save,grant.moves,at,cap);
 if(grant.hearts)save.hearts=Math.min(5,hearts+grant.hearts);
 if(grant.nuts)save.coins=Math.min(999999999,Math.max(0,Math.trunc(Number(save.coins)||0))+grant.nuts);
 if(grant.gems)save.gems=Math.min(999999999,Math.max(0,Math.trunc(Number(save.gems)||0))+grant.gems);
 let vipDaily=null;
 if(grant.vip&&!alreadyVip){save.vip=true;vipDaily=B?.applyVipDaily?.(save,at,cap,D,P)||null;}
 history[p.nonce]={at:nowValue(at),kid:p.kid};
 return {valid:true,nuts:grant.nuts||0,gems:grant.gems||0,moves:grant.moves||0,hearts:save.hearts-hearts,boosters:pack,boosterBefore:before,vipActivated:!!grant.vip&&!alreadyVip,vipDaily,remaining:D.left(save,at,cap)};
}
async function redeem(save,code,context){
 const result=await verify(code,context);
 if(!result.valid)return result;
 return apply(save,result,context);
}
const api=Object.freeze({PREFIX,MAX_LENGTH,MAX_RECORDS,BOOSTERS,format,validate,verify,redeem});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutPromo=api;
})(typeof window!=='undefined'?window:globalThis);
