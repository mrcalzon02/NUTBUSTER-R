'use strict';
/* Release-blocking mining expansion behavior; no cosmetic image-judgment gate. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
require('../web/nutvale-mining-gear.js');
const M=require('../web/nutvale-mines.js');
const UI=require('../web/nutvale-mines-ui.js');
const ROOT=path.join(__dirname,'../web/art/nutvale/mining-ore');
const DAY=Date.parse('2026-10-26T10:00:00');
const fresh=()=>({unlocked:500,stars:{500:1},nutravaganza:{dollars:1000},nutravaganzaExpedition:{}});
for(let r=1;r<=4;r++)for(let c=1;c<=6;c++){
 const p=path.join(ROOT,'r'+r+'c'+c+'.png');
 assert.ok(fs.statSync(p).size>30000,'Approved ore sprite must be present: '+p);
 assert.ok(fs.readFileSync(p).subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Approved PNG signature');
}
assert.equal(Object.keys(M.FIND_IMAGE).length,17);
let s=fresh(),n=M.ensure(s,DAY),before=M.currentBoard(s,DAY);
assert.equal(before.length,16);
assert.ok(before.every(c=>c.deposit===null),'Undug lodes stay undisclosed');
assert.equal(before[0].done,false);
assert.match(M.cellArt(before[0]),/mining-ore\/r1c1\.png$/);
for(const [target,quantity] of [['coal',1],['metal',1],['gems',1],['fossils',1],['relics',1],['blastCharges',1],['lensCharges',1]]){
 let match=null;
 for(let seed=1;seed<10000;seed++){
  const candidate=M.tile(seed,0,0,0);
  if((M.FIND[candidate.deposit]?.bonus?.[target]||0)>=quantity){match={seed,candidate};break;}
 }
 assert.ok(match,'Must have reachable lode for '+target);
 const save=fresh(),exp=M.ensure(save,DAY);
 exp.seed=match.seed;exp.tileContentsByXY={};
 exp.strikesLeft=12;exp.cartOre=0;
 assert.equal(M.currentBoard(save,DAY)[0].deposit,null,'No pre-reveal of '+target);
 let last;
 for(let hit=0;hit<match.candidate.hardness;hit++)last=M.excavate(save,0,0,DAY);
 assert.equal(last.valid,true);
 assert.equal(last.cleared,true);
 assert.equal(last.deposit,match.candidate.deposit);
 assert.ok(last.rewards[target]>=quantity,target+' credited on crack');
 assert.equal(M.stats(save,DAY)[target],last.rewards[target],target+' saved');
 assert.equal(M.currentBoard(save,DAY)[0].deposit,match.candidate.deposit);
 const again=M.excavate(save,0,0,DAY);
 assert.equal(again.valid,false,'No duplicate loot from already broken stone');
 assert.equal(M.stats(save,DAY)[target],last.rewards[target]);
 assert.equal(M.ensure(save,DAY)[target],last.rewards[target],'Save reload preserves '+target);
}
s=fresh();n=M.ensure(s,DAY);n.coal=2;n.ore=8;
const fuel=M.coalRefine(s,DAY);
assert.equal(fuel.valid,true);assert.equal(fuel.coalUsed,1);
assert.equal(n.coal,1);assert.equal(n.ore,6);assert.equal(n.metal,1);
assert.equal(M.refine(s,1,DAY).valid,true,'Original ore recipe retained');
assert.equal(n.metal,2);
n.strikesLeft=0;n.blastCharges=1;
const first=M.currentBoard(s,DAY).find(c=>!c.done);
const blast=M.blast(s,first.x,first.y,DAY);
assert.equal(blast.valid,true);assert.equal(blast.blast,true);
assert.equal(M.stats(s,DAY).strikesLeft,0,'Blast does not spend daily strikes');
assert.equal(blast.hits,Math.min(2,first.hardness));
assert.equal(M.blast(s,first.x,first.y,DAY).valid,false,'Cannot reuse consumed blast charge');
n.scansLeft=0;n.lensCharges=1;
const pending=M.currentBoard(s,DAY).find(c=>!c.done&&!c.scanned);
assert.ok(pending,'Unscanned tile available');
assert.equal(M.lensSurvey(s,pending.x,pending.y,DAY).valid,true);
assert.equal(n.scansLeft,0,'Lens does not spend daily scans');
assert.equal(n.lensCharges,0);
assert.equal(M.lensSurvey(s,pending.x,pending.y,DAY).valid,false,'Cannot resurvey');
const html=UI.render(s,{mineTab:'dig',mineMode:'dig'});
assert.match(html,/data-mode="blast"/);assert.match(html,/data-mode="lens"/);
assert.match(html,/mining-ore\/r1c1\.png/);
assert.doesNotMatch(html,/[🪨💎💠💥🟤⚫]/u,'Board must render real mining PNGs');
const refinery=UI.render(s,{mineTab:'refinery',mineMode:'dig'});
assert.match(refinery,/COAL-FIRED SMELTING/);
assert.match(refinery,/FOSSILS/);
assert.match(refinery,/RELICS/);
console.log('PASS approved 24 ore PNGs; hidden deterministic finds; coal, metal, gems, fossils, relics, Blast and Lens; no repeat rewards or emoji mining sprites');
