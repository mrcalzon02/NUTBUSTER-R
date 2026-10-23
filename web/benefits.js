/* NUTBUSTER VIP daily grants and two independently redeemed 12-hour free rewards.
   Offline save-only bookkeeping. This module owns eligibility; the UI is not authority. */
(function(root){'use strict';
const PERIOD_MS=12*60*60*1000;
const VIP_DAILY_MOVES=5;
const VIP_DAILY_NUTS=250;
const VIP_DAILY_BOOSTERS=Object.freeze({hammer:2,extra:1,shuffle:1});
const MAX=999999;
const atTime=at=>Number.isFinite(Number(at))?Math.max(0,Math.trunc(Number(at))):Date.now();
function claimState(save){
 if(!save.freeClaims||typeof save.freeClaims!=='object'||Array.isArray(save.freeClaims))save.freeClaims={};
 return save.freeClaims;
}
function nextAt(save,kind){
 if(kind!=='hearts'&&kind!=='moves')return Infinity;
 const value=Number(claimState(save)[kind]);
 return Number.isFinite(value)&&value>0?Math.max(0,Math.trunc(value)):0;
}
function remaining(save,kind,at=Date.now()){return Math.max(0,nextAt(save,kind)-atTime(at));}
function ready(save,kind,at=Date.now()){return (kind==='hearts'||kind==='moves')&&remaining(save,kind,at)===0;}
function countdown(ms){if(ms<=0)return 'READY';const minutes=Math.ceil(ms/60000);return Math.floor(minutes/60)+'h '+String(minutes%60).padStart(2,'0')+'m';}
function claim(save,kind,at=Date.now(),D,cap){
 const now=atTime(at);
 if(kind!=='hearts'&&kind!=='moves')return {valid:false,reason:'unknown'};
 if(!ready(save,kind,now))return {valid:false,reason:'cooldown',remaining:remaining(save,kind,now)};
 if(kind==='hearts'){
  const current=Number.isFinite(Number(save.hearts))?Math.max(0,Math.min(5,Math.trunc(Number(save.hearts)))):0;
  if(current>=5)return {valid:false,reason:'full'};
  save.hearts=5;
 }else{
  if(!D||typeof D.topUp!=='function')return {valid:false,reason:'wallet'};
  D.topUp(save,5,now,cap);
 }
 const timestamp=now+PERIOD_MS;
 claimState(save)[kind]=timestamp;
 return {valid:true,kind,nextAt:timestamp,amount:kind==='hearts'?5:5};
}
function applyVipDaily(save,at=Date.now(),cap,D,P){
 if(!D||typeof D.ensure!=='function')return {valid:false,reason:'wallet'};
 const bank=D.ensure(save,at,cap);
 if(!save.vip||bank.vipGranted)return {valid:false,reason:!save.vip?'not-vip':'already',bank};
 if(!P||typeof P.grant!=='function'||typeof P.actualPack!=='function')return {valid:false,reason:'inventory',bank};
 const pack=P.actualPack(save,'vipDaily');
 const count=P.grant(save,pack);
 if(count!==4)throw new Error('VIP grant failed before finalizing daily cycle');
 bank.base=Math.min(MAX,bank.base+VIP_DAILY_MOVES);
 bank.remaining=Math.min(MAX,bank.remaining+VIP_DAILY_MOVES);
 save.coins=Math.min(999999999,Math.max(0,Math.trunc(Number(save.coins)||0))+VIP_DAILY_NUTS);
 bank.vipGranted=true;
 return {valid:true,moves:VIP_DAILY_MOVES,nuts:VIP_DAILY_NUTS,boosters:pack,bank};
}
const api=Object.freeze({PERIOD_MS,VIP_DAILY_MOVES,VIP_DAILY_NUTS,VIP_DAILY_BOOSTERS,claimState,nextAt,remaining,ready,countdown,claim,applyVipDaily});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutBenefits=api;
})(typeof window!=='undefined'?window:globalThis);
