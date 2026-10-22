'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const F=require('../web/fishing.js'),U=require('../web/fishing-ui.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../web/art/fishing/species/v2/manifest.json'),'utf8'));
const published=manifest.items.filter(x=>x.status==='passed');
assert.equal(published.length,68,'68 reviewed species sprites');
assert.equal(F.FISH.length,80,'80 total catchable species');
assert.equal(new Set(F.FISH.map(f=>f.id)).size,80,'Unique species IDs');
const lookup=new Map(F.FISH.map(f=>[f.id,f]));
for(const item of manifest.quarantined){
 assert.ok(!lookup.has(item.id),'Quarantined fish must stay outside the catch pool: '+item.id);
}
for(const item of published){
 const fish=lookup.get(item.id);
 assert.ok(fish,'Species missing from catch table: '+item.id);
 assert.equal(fish.art,item.art,'Sprite mismatch for '+item.id);
 assert.equal(fish.value,item.value,'Value mismatch for '+item.id);
 assert.equal(fish.difficulty,item.difficulty,'Difficulty mismatch for '+item.id);
 const sprite=path.join(__dirname,'../web',fish.art);
 const bytes=fs.readFileSync(sprite);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),384);
 assert.equal(bytes.readUInt32BE(20),384);
 assert.equal(bytes[25],6,'Must be RGBA: '+item.id);
 const blob=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(blob,item.git_blob_sha,'Sprite digest mismatch: '+item.id);
}
const d=new Date(2030,0,2,10).getTime();
const save={nutravaganza:{dollars:999999,rod:5}};
const n=F.ensure(save,d);
n.baits.worm=999999;
const N=1n<<32n,M=1664525n,A=1013904223n,X=0x9e3779b9n;
// Multiplicative inverse of the deterministic catch RNG's odd LCG multiplier.
function inverse(a,mod){
 let [t,nextT,r,nextR]=[0n,1n,mod,a];
 while(nextR!==0n){const q=r/nextR;[t,nextT]=[nextT,t-q*nextT];[r,nextR]=[nextR,r-q*nextR];}
 assert.equal(r,1n);
 return (t%mod+mod)%mod;
}
const inverseM=inverse(M,N);
let casts=0;
for(const rod of F.RODS){
 n.rodStock[rod.id]=rod.maxDurability;
 for(const quality of [0,2,4]){
  const odds=F.rodOdds(rod.id,quality);
  assert.equal(odds.length,80);
  assert.ok(odds.every(x=>x.probability>0));
  assert.ok(Math.abs(odds.reduce((s,x)=>s+x.probability,0)-1)<1e-10);
  let cumulative=0;
  for(const outcome of odds){
   const start=cumulative;
   cumulative+=outcome.probability;
   const mid=BigInt(Math.floor(((start+cumulative)/2)*2**32));
   const seed=Number(((((mid-A+N)%N)*inverseM)%N)^X);
   assert.equal(F.chooseFish(seed,quality,rod.id).id,outcome.id,'Unreachable fish '+outcome.id);
   if(quality===0){
    n.equippedRod=rod.id;n.rodStock[rod.id]=rod.maxDurability;
    const result=F.cast(save,'worm',seed,d);
    assert.equal(result.valid,true,rod.id+' '+outcome.id);
    assert.equal(result.fish,outcome.id);
    assert.equal(n.fight.id,outcome.id);
    n.fight=null;casts++;
   }
  }
 }
}
assert.equal(casts,16*80,'Every rod must be able to catch every species');
// Verify the actual wharf, encounter, catch decision, aquarium and saved resident display.
for(const fish of F.FISH.filter(x=>x.art)){
 n.fish=[{id:fish.id,size:55,value:fish.value}];
 n.pending={id:fish.id,size:55,value:fish.value};
 n.fight=null;
 const aquarium=U.aquarium(save);
 const caught=U.wharf(save,{fishBait:'worm'},{BOOSTERS:[]},{unlocked:()=>false});
 assert.ok(aquarium.includes('src="'+fish.art+'"'),'Missing aquarium sprite: '+fish.id);
 assert.ok(aquarium.includes('loading="eager"'),'Aquarium fish should load immediately');
 assert.ok(caught.includes('src="'+fish.art+'"'),'Missing caught-fish sprite: '+fish.id);
 n.pending=null;
 n.fight={id:fish.id,seed:7,rodId:'woodland',turn:0,fish:45,hook:50,progress:0,tension:10};
 const fight=U.wharf(save,{fishBait:'worm'},{BOOSTERS:[]},{unlocked:()=>false});
 assert.ok(fight.includes('src="'+fish.art+'" alt="" loading="eager"'),'Encounter sprite should load immediately: '+fish.id);
 const saved=JSON.parse(JSON.stringify(save));
 assert.equal(F.ensure(saved,d).fight.id,fish.id,'Encounter lost after serialization: '+fish.id);
 n.fight=null;
 const savedFish=JSON.parse(JSON.stringify(save));
 assert.equal(F.ensure(savedFish,d).fish[0].id,fish.id,'Aquarium resident lost after serialization: '+fish.id);
}
n.fish=[];
const wharf=U.wharf(save,{fishBait:'worm'},{BOOSTERS:[]},{unlocked:()=>false});
assert.equal((wharf.match(/class="fish-catch-entry"/g)||[]).length,80);
for(const item of published)assert.ok(wharf.includes('src="'+item.art+'"'),'Species not indexed: '+item.id);
// Source-set references automatically package web art into Android and desktop builds.
const gradle=fs.readFileSync(path.join(__dirname,'../android/app/build.gradle'),'utf8');
const desktop=fs.readFileSync(path.join(__dirname,'../desktop/package.json'),'utf8');
assert.match(gradle,/assets\.srcDirs\s*=\s*\['\.\.\/\.\.\/web'\]/);
assert.ok(JSON.parse(desktop).build.extraResources.some(x=>x.from==='../web'));
console.log('PASS 68 fish sprites, 80 actual catchables, 1280 casts, 3840 rod/bait/odds, UI, saved fish, packages');
