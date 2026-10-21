const assert=require('node:assert/strict');
const H=require('../web/homestead.js');
assert.equal(H.RENOVATIONS.length,5);
assert.equal(H.RENOVATION_STEPS,5);
assert.equal(H.RENOVATION_TOTAL,1000);
assert.equal(new Set(H.RENOVATIONS.map(r=>r.id)).size,5);
const save={unlocked:500,stars:{1:3},coins:1000};
H.ensure(save);
assert.equal(H.renovationSummary(save).total,0);
assert.equal(H.renovationSummary(save,1).houseTotal,0);
assert.equal(H.renovationOffer(save,2,'roof').reason,'house','Other tiers must be owned');
assert.equal(H.renovationOffer(save,1,'prototype').reason,'unknown');
assert.equal(H.renovationOffer(save,1,'constructor').reason,'unknown');
assert.equal(H.upgradeRenovation(save,99,'roof').reason,'unknown');
const first=H.renovationOffer(save,1,'roof');
assert.equal(first.valid,true);
assert.equal(first.rank,1);
assert.equal(first.level,0);
assert.ok(first.cost>0);
save.coins=first.cost-1;
assert.equal(H.upgradeRenovation(save,1,'roof').reason,'coins');
assert.equal(save.coins,first.cost-1);
assert.equal(H.renovationSummary(save).total,0);
save.coins=1000;
let result=H.upgradeRenovation(save,1,'roof');
assert.equal(result.valid,true);
assert.equal(result.spent,first.cost);
assert.equal(H.renovationRanks(save,1).roof,1);
assert.equal(H.renovationSummary(save).total,1);
assert.equal(H.stats(save).renovations,1);
assert.equal(H.stats(save).achievements.some(a=>a.id==='renovator'),true);
let wallet=save.coins;
assert.equal(H.upgradeRenovation(save,1,'roof').reason,'level','Next rank requires a genuine level-2 clear');
assert.equal(save.coins,wallet);
save.stars[2]=2;
result=H.upgradeRenovation(save,1,'roof');
assert.equal(result.valid,true);assert.equal(result.rank,2);
assert.equal(H.renovationRanks(save,1).roof,2);
assert.equal(H.renovationRanks(save,1).garden,0);
const stable=JSON.stringify(save);H.ensure(save);
assert.equal(JSON.stringify(save),stable,'Old and new saves must stay stable on repeat migration');
const hostile={stars:{},coins:333,homestead:{maxTier:1,tier:1,renovations:{1:{roof:99,porch:2,heraldry:-2,unknown:4},40:{roof:5},constructor:{roof:5}}}};
H.ensure(hostile);
assert.deepEqual(hostile.homestead.renovations,{'1':{porch:2}});
assert.equal(hostile.coins,333,'Save sanitation never spends currency');
assert.equal(H.renovationOffer(hostile,1,'roof').level,0);
const full={stars:{},coins:10000000};
for(let l=1;l<=500;l++)full.stars[l]=3;
H.ensure(full);
let spent=0;
for(let t=2;t<=40;t++){
 const out=H.upgradeTier(full);
 assert.equal(out.valid,true,'Full campaign can unlock building '+t);
 spent+=out.spent;
}
assert.equal(full.homestead.maxTier,40);
let count=0;
for(let tier=1;tier<=40;tier++){
 for(const track of H.RENOVATIONS){
  for(let rank=1;rank<=5;rank++){
   const before=full.coins;
   const out=H.upgradeRenovation(full,tier,track.id);
   assert.equal(out.valid,true,'Build '+tier+' '+track.id+' renovation rank '+rank);
   assert.equal(out.rank,rank);
   assert.equal(before-full.coins,out.spent,'Only the actual upgrade is charged');
   spent+=out.spent;count++;
  }
  const before=full.coins;
  assert.equal(H.upgradeRenovation(full,tier,track.id).reason,'complete','No charge beyond rank five');
  assert.equal(full.coins,before);
 }
 assert.equal(H.renovationSummary(full,tier).houseTotal,25);
}
assert.equal(count,1000);
assert.equal(H.renovationSummary(full).total,1000);
assert.equal(H.stats(full).renovations,1000);
assert.equal(H.stats(full).renovationCapacity,1000);
assert.equal(full.coins,10000000-spent);
assert.equal(H.stats(full).achievements.some(a=>a.id==='thousand-renovations'),true);
assert.match(H.prestigePlate(full),/1000\/1000 renovations/);
H.chooseTier(full,1);
assert.equal(H.renovationRanks(full,1).roof,5,'Toggling building style retains its local renovations');
assert.equal(H.renovationRanks(full,40).heraldry,5,'Last tier renovations remain separately stored');
const fullStable=JSON.stringify(full);H.ensure(full);
assert.equal(JSON.stringify(full),fullStable,'Mass renovations survive stable migration');
console.log('PASS 1000 renovations: five tracks per 40 houses, rank gates, wallet accounting, legacy sanitation, achievements and persistence');
