'use strict';
const assert=require('node:assert/strict');
const D=require('../web/daily-moves.js');
const B=require('../web/benefits.js');
const P=require('../web/progression.js');

const HOUR=60*60*1000;
const t=new Date(2026,9,22,11,0,0).getTime();
function fresh(){const s={unlocked:1,stars:{},coins:100,hearts:2,vip:false};P.migrate(s);return s;}

// Both free rewards start available, require explicit redemption, and share no timer.
let s=fresh();
assert.equal(B.ready(s,'moves',t),true);
assert.equal(B.ready(s,'hearts',t),true);
assert.equal(D.left(s,t,20),20);
let res=B.claim(s,'hearts',t,D,20);
assert.equal(res.valid,true);assert.equal(s.hearts,5);
assert.equal(B.ready(s,'hearts',t+HOUR),false);
assert.equal(B.ready(s,'moves',t+HOUR),true);
assert.equal(B.claim(s,'hearts',t+HOUR,D,20).reason,'cooldown');
res=B.claim(s,'moves',t+HOUR,D,20);
assert.equal(res.valid,true);
assert.equal(D.left(s,t+HOUR,20),25);
assert.equal(s.freeClaims.hearts,t+12*HOUR);
assert.equal(s.freeClaims.moves,t+13*HOUR);
assert.equal(B.claim(s,'moves',t+HOUR+1000,D,20).reason,'cooldown');
assert.equal(B.ready(s,'hearts',t+12*HOUR),true);
assert.equal(B.ready(s,'moves',t+12*HOUR),false);
assert.equal(B.ready(s,'moves',t+13*HOUR),true);
assert.equal(B.claim(s,'hearts',t+12*HOUR,D,20).reason,'full');
assert.equal(B.ready(s,'hearts',t+12*HOUR),true,'Full hearts cannot waste a free claim');
s.hearts=1;assert.equal(B.claim(s,'hearts',t+12*HOUR,D,20).valid,true);
assert.equal(B.claim(s,'unknown',t,D,20).reason,'unknown');

// Save survives reload and clock rollback; free 12-hour timers cannot reset the 24h wallet.
const copied=JSON.parse(JSON.stringify(s));
assert.equal(B.ready(copied,'hearts',t+13*HOUR),false);
assert.equal(D.left(copied,t+23*HOUR,20),25);
assert.equal(D.left(copied,t+24*HOUR,20),20);
assert.equal(D.left(copied,t,20),20,'Moving the clock backward cannot farm a daily refill');
assert.equal(D.left(copied,t+47*HOUR,20),20);
assert.equal(D.left(copied,t+48*HOUR,20),20);
assert.equal(copied.dailyMoves.resetAt,t+72*HOUR);

// VIP: a permanent flag gives automatic one-time daily rewards, not a subscription.
s=fresh();const baseHammer=P.count(s,'hammer');
assert.equal(B.applyVipDaily(s,t,20,D,P).valid,false,'No benefits before lifetime unlock');
s.vip=true;
res=B.applyVipDaily(s,t,20,D,P);
assert.equal(res.valid,true);
assert.equal(res.moves,5);assert.equal(res.nuts,250);
assert.equal(s.coins,350);
assert.equal(D.left(s,t,20),25);
assert.equal(s.dailyMoves.base,25);
assert.equal(P.count(s,'hammer'),baseHammer+4,'All four starter-tier booster substitutes must be credited');
assert.equal(B.applyVipDaily(s,t+HOUR,20,D,P).valid,false);
assert.equal(s.coins,350);
assert.equal(P.count(s,'hammer'),baseHammer+4);
assert.equal(D.spend(s,11,t,20),true);
const copyVip=JSON.parse(JSON.stringify(s));
assert.equal(B.applyVipDaily(copyVip,t+23*HOUR,20,D,P).valid,false);
assert.equal(B.applyVipDaily(copyVip,t+24*HOUR,20,D,P).valid,true);
assert.equal(copyVip.dailyMoves.base,25);
assert.equal(copyVip.dailyMoves.remaining,25);
assert.equal(copyVip.coins,600);
assert.equal(P.count(copyVip,'hammer'),baseHammer+8);
assert.equal(B.applyVipDaily(copyVip,t+24*HOUR,20,D,P).valid,false);
assert.equal(B.applyVipDaily(copyVip,t,20,D,P).valid,false,'Clock rollback may not duplicate VIP rewards');
assert.equal(B.countdown(0),'READY');
assert.equal(B.countdown(12*HOUR),'12h 00m');
assert.equal(B.countdown(HOUR+1),'1h 01m');

console.log('PASS: independent 12h manual heart/move claims, reload/clock checks, rolling 24h move reset, permanent VIP daily credit, idempotence');
