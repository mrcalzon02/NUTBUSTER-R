'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const F=require('../web/fishing.js'),U=require('../web/fishing-ui.js');
assert.equal(F.FISH.length,80,'80 catchable species');
assert.equal(new Set(F.FISH.map(f=>f.id)).size,80,'Species IDs are unique');
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
 n.pending=null;
 n.fight={id:fish.id,seed:7,rodId:'woodland',turn:0,fish:45,hook:50,progress:0,tension:10};
 const fight=U.wharf(save,{fishBait:'worm'},{BOOSTERS:[]},{unlocked:()=>false});
 const saved=JSON.parse(JSON.stringify(save));
 assert.equal(F.ensure(saved,d).fight.id,fish.id,'Encounter lost after serialization: '+fish.id);
 n.fight=null;
 const savedFish=JSON.parse(JSON.stringify(save));
 assert.equal(F.ensure(savedFish,d).fish[0].id,fish.id,'Aquarium resident lost after serialization: '+fish.id);
}
n.fish=[];
const wharf=U.baitShop(save,{fishBait:'worm'},{BOOSTERS:[]},{unlocked:()=>false});
assert.equal((wharf.match(/class="fish-catch-entry"/g)||[]).length,80);
// Source-set references automatically package web art into Android and desktop builds.
const gradle=fs.readFileSync(path.join(__dirname,'../android/app/build.gradle'),'utf8');
const desktop=fs.readFileSync(path.join(__dirname,'../desktop/package.json'),'utf8');
assert.match(gradle,/assets\.srcDirs\s*=\s*\['\.\.\/\.\.\/web'\]/);
assert.ok(JSON.parse(desktop).build.extraResources.some(x=>x.from==='../web'));
console.log('PASS: 80 catchable species, 1280 successful casts, outcome odds, persistence and packages');
