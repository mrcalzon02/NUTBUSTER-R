'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const s=JSON.parse(fs.readFileSync(path.join(root,'docs/economy/nutvale-mines-design-lock.v1.json'),'utf8'));
assert.equal(s.schema,'nutvale-mines/v1.0-design-lock');
assert.equal(s.status,'DESIGN_LOCKED_NOT_IMPLEMENTED');
assert.equal(s.tiers.length,6);
const tracks=Object.keys(s.upgradePricesNutvaleDollars);
assert.deepEqual(tracks,['mineMap','pickaxe','gloves','cart','refinery']);
for(const costs of Object.values(s.upgradePricesNutvaleDollars)){
 assert.equal(costs.length,6);assert.equal(costs[0],0);
 for(let i=1;i<costs.length;i++)assert.ok(costs[i]>costs[i-1]);
}
assert.equal(s.campaign.length,5);
let previous=1000;
for(const [i,r] of s.campaign.entries()){
 assert.equal(r.region,i+1);
 assert.equal(r.idStart,previous+1);
 assert.equal(r.idEnd,r.idStart+99);
 assert.equal(r.displayEnd-r.displayStart+1,100);
 previous=r.idEnd;
}
assert.equal(previous,1500);
assert.deepEqual(s.rules.elementalTrialReservedIds,[501,650]);
assert.deepEqual(s.rules.secondCampaignIds,[1001,1500]);
assert.equal(s.rules.writPriceNutvaleDollars,180);
assert.equal(s.rules.writEntryCostPerAttempt,1);
assert.equal(s.rocks.length,4);
assert.deepEqual(s.rocks.map(x=>x.ore),[0,1,2,4]);
let prevPockets=0,prevOreChance=101;
s.tiers.forEach((t,i)=>{
 assert.equal(t.tier,i);assert.equal(t.size,i+4);
 assert.equal(t.oreOdds.length,4);
 assert.equal(t.oreOdds.reduce((a,b)=>a+b,0),100,'Odds must be exhaustive');
 const chance=100-t.oreOdds[0],pockets=t.size*t.size*chance/100;
 assert.ok(chance<prevOreChance,'Ore discovery per-tile odds must decline');
 assert.ok(pockets>prevPockets,'Larger boards must have more total ore pockets');
 assert.equal(t.strikes,12+5*i);
 assert.equal(t.scans,i);
 assert.ok(t.cart>=10&&t.cart<=80);
 assert.ok(t.orePerMetal>0&&t.metalPerGood>0);
 prevPockets=pockets;prevOreChance=chance;
});
assert.equal(s.rules.rockHardness.one+s.rules.rockHardness.two+s.rules.rockHardness.three,100);
assert.ok(s.savedState.migration.some(x=>x.includes('Remove legacy direct ore-to-writ')));
const wiki=fs.readFileSync(path.join(root,'docs/wiki/Nutvale-Mines-Design-Lock.md'),'utf8');
assert.ok(wiki.includes('DESIGN LOCKED / IMPLEMENTATION PENDING'));
assert.ok(wiki.includes('no direct ore → Writ conversion')||wiki.includes('no direct ore → Writ'));
assert.ok(wiki.includes('IDs 501–650')&&wiki.includes('1001–1500'));
const expedition=fs.readFileSync(path.join(root,'web/nutravaganza-expedition.js'),'utf8');
const html=fs.readFileSync(path.join(root,'web/index.html'),'utf8');
assert.ok(expedition.includes('const W = 4, H = 4, COST = 3'),'Prototype detected: replace before calling implemented');
assert.ok(!html.includes('<script src="nutravaganza-expedition.js">'),'Prototype must not be presented as finished gameplay');
console.log('PASS mining design-lock v1: 6 boards, 5 tracks, 100%-odds, slower per-tile prospecting, 500 reserved levels; prototype not shipped');
