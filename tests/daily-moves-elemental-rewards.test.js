'use strict';
const assert=require('node:assert/strict');
const D=require('../web/daily-moves.js'),R=require('../web/elemental-rewards.js'),P=require('../web/progression.js');
const K=require('../web/elemental-challenges.js');
const at=new Date(2026,9,22,11).getTime(),later=new Date(2026,9,23,11).getTime();
const save={unlocked:500,coins:0,gems:0,stars:{}};
P.migrate(save);
assert.equal(D.ensure(save,at,15).remaining,15);
assert.equal(D.ensure(save,at,36).base,15,'No same-day refills or increasing cap on new stages');
assert.equal(D.spend(save,3,at,15),true);
const reloaded=JSON.parse(JSON.stringify(save));
assert.equal(D.left(reloaded,at,15),12);
assert.equal(D.spend(reloaded,13,at,15),false,'Cannot overdraft');
assert.equal(D.spend(reloaded,12,at,15),true);
assert.equal(D.spend(reloaded,1,at,15),false);
assert.equal(D.topUp(reloaded,5,at,15),5);
assert.equal(D.spend(reloaded,2,at,15),true);
assert.equal(D.left(reloaded,later,13),13,'Local next-day refill');
assert.equal(D.left(reloaded,at,40),13,'Clock rollback must not replenish');
assert.equal(K.profile(501).area,1);
assert.equal(K.profile(650).area,5);
assert.equal(K.profile(650).local,30);
for(let area=1;area<=5;area++){
 const from=501+(area-1)*30;
 save.unlocked=area*100;
 for(let i=0;i<30;i++){
  const id=from+i,p=K.profile(id);
  assert.ok(K.available(save,id),'Sequential unlock '+id);
  const first=R.clear(save,id,555);
  assert.equal(first.valid,true);
  assert.equal(first.first,true);
  const prev=JSON.stringify([save.coins,save.gems,save.boosterInventory,save.elementalRelics]);
  assert.equal(R.clear(save,id,555).first,false,'Replay '+id);
  assert.equal(JSON.stringify([save.coins,save.gems,save.boosterInventory,save.elementalRelics]),prev,'Rewards repeated '+id);
  assert.equal(K.done(save,id),true);
  if(p.mastery)assert.equal(save.elementalRelics[p.element],true);
 }
}
assert.equal(R.summary(save).completed,150);
assert.equal(R.summary(save).relics.length,15);
assert.deepEqual(R.summary(save).areas.map(x=>x.completed),[30,30,30,30,30]);
console.log('PASS shared daily move bank, rollover, anti-replay rewards, 150 trial grants, 15 relics');
