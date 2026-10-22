/* Nutravaganza: local-only daily bait, active fishing, fish keeping, and Nutvale Dollars.
   No services, purchases, advertisements, or cross-device state. */
(function(root){
'use strict';
// Rod skill level remains 0-5; the sixteen purchasable rod models are independent.
const RODS=Object.freeze([{"id":"woodland","name":"Woodland Twig","tier":0,"maxDurability":260,"cost":0,"affinity":["minnow","bluegill"],"bias":3,"art":"art/fishing/rods/v1/woodland.png"},{"id":"brass","name":"Brass Spinner","tier":0,"maxDurability":190,"cost":115,"affinity":["perch","carp"],"bias":3.4,"art":"art/fishing/rods/v1/brass.png"},{"id":"gilded","name":"Gilded Tackle","tier":1,"maxDurability":215,"cost":230,"affinity":["trout","bass"],"bias":3.7,"art":"art/fishing/rods/v1/gilded.png"},{"id":"carbon","name":"Carbon Striker","tier":1,"maxDurability":360,"cost":320,"affinity":["bass","catfish"],"bias":3.4,"art":"art/fishing/rods/v1/carbon.png"},{"id":"verdant","name":"Verdant Vine","tier":1,"maxDurability":255,"cost":280,"affinity":["carp","koi"],"bias":4.1,"art":"art/fishing/rods/v1/verdant.png"},{"id":"coral","name":"Coral Dancer","tier":2,"maxDurability":170,"cost":450,"affinity":["koi","puffer"],"bias":4.2,"art":"art/fishing/rods/v1/coral.png"},{"id":"industrial","name":"Iron Bastion","tier":2,"maxDurability":530,"cost":490,"affinity":["sturgeon","catfish"],"bias":4.2,"art":"art/fishing/rods/v1/industrial.png"},{"id":"royal-blue","name":"Royal Current","tier":2,"maxDurability":345,"cost":570,"affinity":["trout","eel"],"bias":4,"art":"art/fishing/rods/v1/royal-blue.png"},{"id":"pirate","name":"Buccaneer","tier":3,"maxDurability":245,"cost":680,"affinity":["catfish","bass"],"bias":4.7,"art":"art/fishing/rods/v1/pirate.png"},{"id":"glacier","name":"Glacier Fang","tier":3,"maxDurability":260,"cost":760,"affinity":["trout","sturgeon"],"bias":4.8,"art":"art/fishing/rods/v1/glacier.png"},{"id":"storm","name":"Stormcaller","tier":3,"maxDurability":235,"cost":790,"affinity":["eel","leviathan"],"bias":5.2,"art":"art/fishing/rods/v1/storm.png"},{"id":"magma","name":"Magma Hook","tier":4,"maxDurability":210,"cost":980,"affinity":["puffer","sturgeon"],"bias":4.9,"art":"art/fishing/rods/v1/magma.png"},{"id":"sovereign","name":"Crown Angler","tier":4,"maxDurability":410,"cost":1175,"affinity":["koi","leviathan"],"bias":5,"art":"art/fishing/rods/v1/sovereign.png"},{"id":"astral","name":"Moonlit Reel","tier":4,"maxDurability":275,"cost":1200,"affinity":["eel","koi"],"bias":5.3,"art":"art/fishing/rods/v1/astral.png"},{"id":"prismatic","name":"Prism Sovereign","tier":5,"maxDurability":325,"cost":1560,"affinity":["puffer","leviathan"],"bias":5.8,"art":"art/fishing/rods/v1/prismatic.png"},{"id":"confection","name":"Sugar Rush","tier":5,"maxDurability":155,"cost":1380,"affinity":["minnow","puffer"],"bias":6,"art":"art/fishing/rods/v1/confection.png"}].map(rod=>Object.freeze({...rod,affinity:Object.freeze(rod.affinity)})));
const ROD_BY_ID=new Map(RODS.map(rod=>[rod.id,rod]));
const STARTER_ROD='woodland';
const FISH=Object.freeze([
 {id:'minnow',name:'Penny Minnow',icon:'🐟',value:15,weight:1,difficulty:1},
 {id:'bluegill',name:'Bluegill Baron',icon:'🐟',value:24,weight:3,difficulty:2},
 {id:'perch',name:'Gilded Perch',icon:'🐠',value:34,weight:3,difficulty:2},
 {id:'carp',name:'Dividend Carp',icon:'🐟',value:48,weight:4,difficulty:3},
 {id:'trout',name:'Rainbow Trout',icon:'🐟',value:60,weight:4,difficulty:3},
 {id:'bass',name:'Bigmouth Bass',icon:'🐟',value:78,weight:5,difficulty:4},
 {id:'catfish',name:'Tax Haven Catfish',icon:'🐟',value:100,weight:6,difficulty:4},
 {id:'koi',name:'Royal Koi',icon:'🐠',value:145,weight:7,difficulty:5},
 {id:'puffer',name:'Inflation Puffer',icon:'🐡',value:210,weight:8,difficulty:6},
 {id:'eel',name:'Electric Eel',icon:'🐍',value:275,weight:8,difficulty:7},
 {id:'sturgeon',name:'Imperial Sturgeon',icon:'🐟',value:425,weight:9,difficulty:8},
 {id:'leviathan',name:'Nutvale Leviathan',icon:'🐉',value:800,weight:10,difficulty:9}
]);
const BAITS=Object.freeze([
 {id:'worm',name:'Honest Worm',icon:'🪱',level:0,quality:0},
 {id:'glitter',name:'Glitter Grub',icon:'✨',level:1,quality:2},
 {id:'royal',name:'Royal Roe',icon:'👑',level:2,quality:4}
]);
const BOOSTER_BAIT=Object.freeze({hammer:2,extra:2,row:2,shuffle:2,column:3,blast:3,cross:3,color:3,drill:4,unlock:4});
const DAILY=6;
const limit=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,999999999):0;
const specimenId=new Map(FISH.map(x=>[x.id,x]));
function localDay(now){const date=new Date(now);if(!Number.isFinite(date.getTime()))return null;return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
function ensure(save,now=Date.now()){
 if(!save.nutravaganza||typeof save.nutravaganza!=='object'||Array.isArray(save.nutravaganza))save.nutravaganza={};
 const n=save.nutravaganza;
 n.dollars=limit(n.dollars);n.rod=Number.isInteger(n.rod)?Math.max(0,Math.min(5,n.rod)):0;
 if(!n.rodStock||typeof n.rodStock!=='object'||Array.isArray(n.rodStock))n.rodStock={};
 for(const model of RODS)if(Object.prototype.hasOwnProperty.call(n.rodStock,model.id))
  n.rodStock[model.id]=Math.max(0,Math.min(model.maxDurability,Math.trunc(Number(n.rodStock[model.id])||0)));
 if(!Object.prototype.hasOwnProperty.call(n.rodStock,STARTER_ROD))n.rodStock[STARTER_ROD]=ROD_BY_ID.get(STARTER_ROD).maxDurability;
 if(typeof n.equippedRod!=='string'||!Object.prototype.hasOwnProperty.call(n.rodStock,n.equippedRod)||!ROD_BY_ID.has(n.equippedRod))n.equippedRod=STARTER_ROD;
 n.baitTier=Number.isInteger(n.baitTier)?Math.max(0,Math.min(2,n.baitTier)):0;
 n.tank=Number.isInteger(n.tank)?Math.max(0,Math.min(10,n.tank)):0;
 if(!n.baits||typeof n.baits!=='object'||Array.isArray(n.baits))n.baits={};
 for(const bait of BAITS)n.baits[bait.id]=limit(n.baits[bait.id]);
 if(!Array.isArray(n.fish))n.fish=[];
 n.fish=n.fish.filter(f=>f&&specimenId.has(f.id)&&Number.isInteger(f.size)&&f.size>=1&&f.size<=100&&Number.isInteger(f.value)&&f.value>=1&&f.value<=100000).slice(0,capacity(n));
 if(!n.pending||!specimenId.has(n.pending.id)||!Number.isInteger(n.pending.value)||n.pending.value<1||n.pending.value>100000||!Number.isInteger(n.pending.size)||n.pending.size<1||n.pending.size>100)n.pending=null;
 if(!n.fight||!specimenId.has(n.fight.id)||!Number.isSafeInteger(n.fight.seed)||n.fight.seed<0||n.fight.seed>4294967295||!Number.isInteger(n.fight.turn)||n.fight.turn<0||n.fight.turn>50||!Number.isFinite(n.fight.fish)||!Number.isFinite(n.fight.hook)||!Number.isFinite(n.fight.progress)||!Number.isFinite(n.fight.tension))n.fight=null;
 const today=localDay(now);
 // Grant once on a new local calendar day; a backward clock adjustment never grants bait.
 if(today&&(!n.day||typeof n.day!=='string'||today>n.day)){
  n.day=today;n.baits.worm=Math.min(12,n.baits.worm+DAILY);
 }
 return n;
}
function capacity(n){return 4+3*n.tank;}
function nextCost(kind,n){const level=kind==='rod'?n.rod:kind==='tank'?n.tank:n.baitTier;
 const max=kind==='rod'?5:kind==='tank'?10:kind==='bait'?2:-1;
 if(max<0||level>=max)return null;
 return kind==='rod'?90+level*160:kind==='tank'?85+level*140:120+level*280;
}
function upgrade(save,kind,now=Date.now()){
 const n=ensure(save,now),cost=nextCost(kind,n);
 if(cost===null)return {valid:false,reason:kind==='rod'||kind==='tank'||kind==='bait'?'max':'unknown'};
 if(n.dollars<cost)return {valid:false,reason:'dollars',short:cost-n.dollars};
 n.dollars-=cost;if(kind==='rod')n.rod++;else if(kind==='tank')n.tank++;else n.baitTier++;
 return {valid:true,cost,kind,level:kind==='rod'?n.rod:kind==='tank'?n.tank:n.baitTier};
}
function trade(save,booster,progression,now=Date.now()){
 const n=ensure(save,now),amount=BOOSTER_BAIT[booster];
 if(!amount||!progression||!progression.count||!progression.spend||progression.count(save,booster)<1||!progression.unlocked(save,booster))return {valid:false,reason:'booster'};
 if(n.baits.worm>999999-amount)return {valid:false,reason:'limit'};
 if(!progression.spend(save,booster))return {valid:false,reason:'booster'};
 n.baits.worm+=amount;return {valid:true,amount,stock:n.baits.worm};
}
function craft(save,kind,now=Date.now()){
 const n=ensure(save,now),spec=BAITS.find(x=>x.id===kind);
 if(!spec||spec.level===0||n.baitTier<spec.level)return {valid:false,reason:'locked'};
 const price=spec.level===1?35:100;
 if(n.dollars<price||n.baits.worm<1)return {valid:false,reason:n.baits.worm<1?'worm':'dollars'};
 n.dollars-=price;n.baits.worm--;n.baits[spec.id]++;
 return {valid:true,cost:price};
}
function rodModel(n){return ROD_BY_ID.get(n.equippedRod)||ROD_BY_ID.get(STARTER_ROD);}
function rodOdds(rodId,quality=0){
 const rod=ROD_BY_ID.get(rodId)||ROD_BY_ID.get(STARTER_ROD);
 const q=Math.max(0,Math.min(4,Number(quality)||0));
 const weights=FISH.map((fish,i)=>(18/Math.pow(1.35,i))*Math.pow(1+q*.08,fish.difficulty)*(rod.affinity.includes(fish.id)?rod.bias:1));
 const sum=weights.reduce((a,b)=>a+b,0);
 return FISH.map((fish,i)=>({id:fish.id,name:fish.name,probability:weights[i]/sum}));
}
function chooseFish(seed,quality,rodId=STARTER_ROD){
 // Rod preferences and bait quality affect actual seeded probabilities.
 let x=(seed>>>0)^0x9e3779b9;x=(Math.imul(x,1664525)+1013904223)>>>0;
 let roll=x/4294967296;
 for(const entry of rodOdds(rodId,quality)){
  roll-=entry.probability;
  if(roll<0)return specimenId.get(entry.id);
 }
 return FISH[FISH.length-1];
}
function buyRod(save,id,now=Date.now()){
 const n=ensure(save,now),rod=ROD_BY_ID.get(id);
 if(!rod)return {valid:false,reason:'unknown'};
 if(Object.prototype.hasOwnProperty.call(n.rodStock,id))return {valid:false,reason:'owned'};
 if(n.rod<rod.tier)return {valid:false,reason:'tier'};
 if(n.dollars<rod.cost)return {valid:false,reason:'dollars'};
 n.dollars-=rod.cost;n.rodStock[id]=rod.maxDurability;n.equippedRod=id;
 return {valid:true,id,durability:rod.maxDurability};
}
function equipRod(save,id,now=Date.now()){
 const n=ensure(save,now),rod=ROD_BY_ID.get(id);
 if(!rod)return {valid:false,reason:'unknown'};
 if(!Object.prototype.hasOwnProperty.call(n.rodStock,id))return {valid:false,reason:'not-owned'};
 if(n.rodStock[id]<=0)return {valid:false,reason:'rod-broken'};
 n.equippedRod=id;return {valid:true,id,durability:n.rodStock[id]};
}
function repairRod(save,id,now=Date.now()){
 const n=ensure(save,now),rod=ROD_BY_ID.get(id);
 if(!rod)return {valid:false,reason:'unknown'};
 if(!Object.prototype.hasOwnProperty.call(n.rodStock,id))return {valid:false,reason:'not-owned'};
 const missing=rod.maxDurability-n.rodStock[id];
 if(missing<=0)return {valid:false,reason:'full-durability'};
 // Starter repairs stay free so an empty wallet never softlocks fishing.
 const cost=id===STARTER_ROD?0:Math.ceil(missing*(1.2+rod.tier*.4));
 if(n.dollars<cost)return {valid:false,reason:'dollars'};
 n.dollars-=cost;n.rodStock[id]=rod.maxDurability;
 return {valid:true,id,cost,durability:rod.maxDurability};
}
function cast(save,baitId,seed,now=Date.now()){
 const n=ensure(save,now),bait=BAITS.find(x=>x.id===baitId);
 if(!bait||n.baitTier<bait.level)return {valid:false,reason:'bait'};
 if(n.pending||n.fight)return {valid:false,reason:'busy'};
 if(!n.baits[baitId])return {valid:false,reason:'stock'};
 if(!Number.isSafeInteger(seed)||seed<0||seed>4294967295)return {valid:false,reason:'seed'};
 const rod=rodModel(n);
 if(n.rodStock[rod.id]<=0)return {valid:false,reason:'rod-broken',id:rod.id};
 n.baits[baitId]--;
 const fish=chooseFish(seed,bait.quality,rod.id);
 n.rodStock[rod.id]=Math.max(0,n.rodStock[rod.id]-(fish.difficulty>=7?2:1));
 n.fight={id:fish.id,seed,rodId:rod.id,turn:0,fish:45+seed%12,hook:50,progress:0,tension:10};
 return {valid:true,fish:fish.id,bait:baitId,rod:rod.id,durability:n.rodStock[rod.id]};
}
function step(save,mode,now=Date.now()){
 const n=ensure(save,now),f=n.fight;
 if(!f)return {valid:false,reason:'no-fight'};
 if(!['left','right','reel','slack'].includes(mode))return {valid:false,reason:'action'};
 const species=specimenId.get(f.id);f.turn++;
 // Changing cross-current and short surges force the player to respond instead of holding REEL.
 const wave=Math.sin((f.turn+f.seed%11)*1.95)*(8+species.difficulty*1.6)+Math.sin((f.turn*3+f.seed%17)*.61)*(5+species.difficulty);
 const surge=(f.turn+f.seed%7)%5===0?(f.turn%2?-1:1)*(7+species.difficulty*2):0;
 f.fish=Math.max(5,Math.min(95,f.fish+wave+surge));
 const steering=11+n.rod*3;
 if(mode==='left')f.hook=Math.max(0,f.hook-steering);
 if(mode==='right')f.hook=Math.min(100,f.hook+steering);
 const aligned=Math.abs(f.fish-f.hook)<=(13+n.rod*2);
 if(mode==='reel'){
  f.progress+=aligned?Math.max(7,19+n.rod*3-species.difficulty):(2+n.rod);
  f.tension+=aligned?(8+species.difficulty*2):(16+species.difficulty*3);
 }else if(mode==='slack'){
  f.tension=Math.max(0,f.tension-26-n.rod*2);
  f.progress=Math.max(0,f.progress-4);
 }else{
  f.progress=Math.max(0,f.progress-1);
  f.tension=Math.max(0,f.tension-6);
 }
 f.tension=Math.min(100,Math.max(0,f.tension));f.progress=Math.max(0,Math.min(100,f.progress));
 if(f.progress>=100){
  const size=20+(f.seed%81),value=Math.round(species.value*(.65+size/100));
  n.pending={id:f.id,size,value};n.fight=null;
  return {valid:true,status:'caught',catch:{...n.pending}};
 }
 if(f.tension>=100||f.turn>=34){
  if(f.tension>=100&&f.rodId&&Object.prototype.hasOwnProperty.call(n.rodStock,f.rodId))
   n.rodStock[f.rodId]=Math.max(0,n.rodStock[f.rodId]-2);
  n.fight=null;return {valid:true,status:'escaped',reason:f.tension>=100?'snapped':'exhausted'};
 }
 return {valid:true,status:'playing',fight:{...f}};
}
function resolve(save,choice,now=Date.now()){
 const n=ensure(save,now),fish=n.pending;
 if(!fish)return {valid:false,reason:'no-catch'};
 if(choice!=='keep'&&choice!=='sell'&&choice!=='release')return {valid:false,reason:'choice'};
 if(choice==='keep'&&n.fish.length>=capacity(n))return {valid:false,reason:'full'};
 if(choice==='keep')n.fish.push({...fish});
 if(choice==='sell')n.dollars=limit(n.dollars+fish.value);
 n.pending=null;
 return {valid:true,choice,fish:{...fish},dollars:n.dollars};
}
const api={FISH,BAITS,RODS,BOOSTER_BAIT,DAILY,localDay,ensure,capacity,nextCost,upgrade,trade,craft,cast,step,resolve,rodModel,rodOdds,chooseFish,buyRod,equipRod,repairRod};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutFishing=api;
})(typeof window!=='undefined'?window:globalThis);
