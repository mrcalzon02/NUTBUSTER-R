/* Shared offline 24-hour move wallet. Stage changes, losses, and restarts do not refill it.
   Each cycle is 24 elapsed hours; manual bonus moves use topUp(), not reset().
   Existing local-calendar saves preserve their next reset when migrated. */
(function(root){'use strict';
const clamp=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(999999,Math.trunc(Number(n)))):0;
function key(at=Date.now()){const d=new Date(at);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const DAY_MS=24*60*60*1000;
function ensure(save,at=Date.now(),cap=36){
 const now=Number.isFinite(Number(at))?Math.max(0,Math.trunc(Number(at))):Date.now();
 const today=key(now),allowance=Math.max(1,Math.min(100,clamp(cap)));
 let bank=save.dailyMoves;
 if(!bank||typeof bank!=='object'||Array.isArray(bank)){
  bank={day:today,resetAt:now+DAY_MS,base:allowance,remaining:allowance,spent:0,bonus:0};
 }else{
  // Migrate previous calendar-day wallets without wiping spent moves.
  if(!Number.isFinite(bank.resetAt)||bank.resetAt<=0){
   const match=typeof bank.day==='string'?/^(\d{4})-(\d{2})-(\d{2})$/.exec(bank.day):null;
   bank.resetAt=match?new Date(Number(match[1]),Number(match[2])-1,Number(match[3])+1).getTime():now+DAY_MS;
  }
  if(now>=bank.resetAt){
   const periods=Math.floor((now-bank.resetAt)/DAY_MS)+1;
   bank={day:today,resetAt:bank.resetAt+periods*DAY_MS,base:allowance,remaining:allowance,spent:0,bonus:0};
  }
 }
 // Clock rollback never grants a new cycle; keep the existing reset timestamp.
 bank.base=clamp(bank.base);
 bank.remaining=clamp(bank.remaining);
 bank.spent=clamp(bank.spent);
 bank.bonus=clamp(bank.bonus);
 save.dailyMoves=bank;return bank;
}
function left(save,at,cap){return ensure(save,at,cap).remaining;}
function spend(save,amount=1,at,cap){
 const bank=ensure(save,at,cap),n=clamp(amount);
 if(n===0||bank.remaining<n)return false;
 bank.remaining-=n;bank.spent+=n;return true;
}
function topUp(save,amount=5,at,cap){
 const bank=ensure(save,at,cap),n=clamp(amount);
 bank.bonus+=n;bank.remaining+=n;return bank.remaining;
}
const api=Object.freeze({key,DAY_MS,ensure,left,spend,topUp});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutDailyMoves=api;
})(typeof window!=='undefined'?window:globalThis);
