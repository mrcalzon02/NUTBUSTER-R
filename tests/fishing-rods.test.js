'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const F=require('../web/fishing.js'),U=require('../web/fishing-ui.js');
const {sprites}=JSON.parse(fs.readFileSync(path.join(__dirname,'../web/art/fishing/rods/v1/manifest.json')));
const day=new Date(2030,3,2).getTime();
assert.equal(F.RODS.length,16);
assert.equal(new Set(F.RODS.map(r=>r.maxDurability)).size>=12,true);
assert.equal(sprites.length,16);
for(const model of F.RODS){
 const file=path.join(__dirname,'../web',model.art);
 const bytes=fs.readFileSync(file);
 assert.equal(bytes.subarray(1,4).toString(),'PNG');
 assert.equal(bytes.readUInt32BE(16),512);
 assert.equal(bytes.readUInt32BE(20),512);
 assert.equal(bytes[25],6,'must be RGBA');
 const blob=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(blob,sprites.find(x=>x.id===model.id)?.git_blob_sha,'wrong sprite binding');
 const odds=F.rodOdds(model.id,0);
 assert.ok(odds.every(x=>x.probability>0));
 assert.ok(Math.abs(odds.reduce((a,b)=>a+b.probability,0)-1)<1e-10);
 assert.ok(model.affinity.every(id=>odds.some(x=>x.id===id)));
}
assert.ok(F.rodOdds('storm',0).find(x=>x.id==='leviathan').probability >
 F.rodOdds('woodland',0).find(x=>x.id==='leviathan').probability*3,'storm model must favor leviathan');
assert.ok(F.rodOdds('royal-blue',0).find(x=>x.id==='eel').probability >
 F.rodOdds('woodland',0).find(x=>x.id==='eel').probability*2,'blue model must favor electric eel');
assert.notEqual(F.chooseFish(1234567,0,'woodland').id,F.chooseFish(1234567,0,'storm').id,'same seed should respond to different rods');
const save={nutravaganza:{dollars:10000,rod:5}};
const n=F.ensure(save,day);
assert.equal(n.rodStock.woodland,F.RODS[0].maxDurability);
assert.equal(F.buyRod(save,'glacier',day).valid,true);
assert.equal(F.buyRod(save,'glacier',day).reason,'owned');
assert.equal(F.equipRod(save,'glacier',day).valid,true);
const beforeBait=n.baits.worm,beforeDur=n.rodStock.glacier;
const cast=F.cast(save,'worm',444,day);
assert.equal(cast.valid,true);assert.equal(cast.rod,'glacier');
assert.equal(n.baits.worm,beforeBait-1);
assert.ok(n.rodStock.glacier<beforeDur);
assert.equal(JSON.parse(JSON.stringify(save)).nutravaganza.equippedRod,'glacier','rod selection must survive save');
n.fight=null;n.rodStock.glacier=0;
const stock=n.baits.worm;
assert.equal(F.cast(save,'worm',888,day).reason,'rod-broken');
assert.equal(n.baits.worm,stock,'failed cast must not consume bait');
assert.equal(F.equipRod(save,'glacier',day).reason,'rod-broken');
assert.equal(F.repairRod(save,'glacier',day).valid,true);
assert.equal(n.rodStock.glacier,beforeDur);
n.rodStock.woodland=0;assert.equal(F.repairRod(save,'woodland',day).cost,0,'starter repair is always free');
const blocked={nutravaganza:{dollars:99999,rod:0}};
F.ensure(blocked,day);assert.equal(F.buyRod(blocked,'prismatic',day).reason,'tier');
n.rodStock.glacier--; // show partial-wear repair control in the UI
const html=U.baitShop(save,{fishBait:'worm'},{BOOSTERS:[],BOOSTER_META:{}},{unlocked:()=>false,count:()=>0});
assert.equal((html.match(/class="fish-rod-card/g)||[]).length,16,'rod gallery must list all models');
assert.match(html,/data-action="fish-rod-buy"/);
assert.match(html,/data-action="fish-rod-equip"/);
assert.match(html,/data-action="fish-rod-repair"/);
console.log('PASS 16 rod sprites, identity, variable durability, purchase, rod-specific odds, casting, repairs, save and UI');
