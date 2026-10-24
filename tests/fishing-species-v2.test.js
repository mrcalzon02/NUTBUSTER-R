'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const F=require('../web/fishing.js'),U=require('../web/fishing-ui.js');
assert.equal(F.FISH.length,80);
assert.equal(new Set(F.FISH.map(f=>f.id)).size,80);
const activeSave={nutravaganza:{dollars:1000}};
const active=F.ensure(activeSave,new Date(2030,4,1).getTime());
active.fight={id:'minnow',seed:7,rodId:'woodland',turn:0,fish:45,hook:50,progress:0,tension:10};
for(const rod of F.RODS)for(const q of [0,2,4]){
 const odds=F.rodOdds(rod.id,q);assert.equal(odds.length,80);assert.ok(odds.every(x=>x.probability>0));
 assert.ok(Math.abs(odds.reduce((a,b)=>a+b.probability,0)-1)<1e-10);
}
assert.ok(F.rodOdds('storm',0).find(x=>x.id==='leviathan').probability>F.rodOdds('woodland',0).find(x=>x.id==='leviathan').probability*3);
const s={nutravaganza:{dollars:999999,rod:5}};F.ensure(s,new Date(2030,4,1).getTime());
const html=U.baitShop(s,{fishBait:'worm'},{BOOSTERS:[],BOOSTER_META:{}},{unlocked:()=>false,count:()=>0});
assert.match(html,/CATCH LIST · 80 SPECIES/);assert.equal((html.match(/fish-catch-entry/g)||[]).length,80);
const seen=new Set();for(let i=0;i<100000;i++)seen.add(F.chooseFish((i*9973)>>>0,2,'woodland').id);
assert.ok(seen.size>=70);console.log('PASS: 80 species, catch odds, rod affinity and functioning species index');
