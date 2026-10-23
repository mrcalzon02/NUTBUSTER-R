/* Shared local-day move wallet. Stage changes, losses, and restarts never refill it.
   Only the next local calendar day and explicitly consumed +5 Moves items add moves.
   Daily baseline is locked on first access for that day even when levels advance. */
(function(root){'use strict';
const clamp=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(999999,Math.trunc(Number(n)))):0;
function key(at=Date.now()){const d=new Date(at);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function ensure(save,at=Date.now(),cap=36){
 const today=key(at),allowance=Math.max(1,Math.min(100,clamp(cap)));
 let bank=save.dailyMoves;
 if(!bank||typeof bank!=='object'||Array.isArray(bank)){
  bank={day:today,base:allowance,remaining:allowance,spent:0,bonus:0};
 }else if(typeof bank.day!=='string'||bank.day<today){
  bank={day:today,base:allowance,remaining:allowance,spent:0,bonus:0};
 }
 // A clock rollback cannot manufacture an extra daily refill.
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
const api=Object.freeze({key,ensure,left,spend,topUp});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutDailyMoves=api;
})(typeof window!=='undefined'?window:globalThis);
