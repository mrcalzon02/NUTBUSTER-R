/* NUTBUSTER woodland companions. Offline saved progress; feed is purchased using earned Golden Nuts. */
(function(root){'use strict';
const PETS=Object.freeze([
 {id:'squirrel',name:'Hazel',species:'Squirrel',blessing:'Nut finder'},
 {id:'bunny',name:'Thistle',species:'Bunny',blessing:'Hop of joy'},
 {id:'chipmunk',name:'Pip',species:'Chipmunk',blessing:'Tiny treasure'},
 {id:'fox',name:'Ember',species:'Fox',blessing:'Lucky spark'},
 {id:'fawn',name:'Willow',species:'Fawn',blessing:'Gentle grace'},
 {id:'raccoon',name:'Bandit',species:'Raccoon',blessing:'Shiny things'},
 {id:'owl',name:'Moonbeam',species:'Owl',blessing:'Night watch'},
 {id:'hedgehog',name:'Bramble',species:'Hedgehog',blessing:'Garden helper'},
 {id:'turtle',name:'Moss',species:'Turtle',blessing:'Patient heart'},
 {id:'bluebird',name:'Skye',species:'Bluebird',blessing:'Songs of spring'}
]);
// Currency exchange; feed comes from the owner's rainbow pawprint icons at the bottom of the sprite sheet.
const FOOD=Object.freeze([
 {id:'bronze',name:'Bronze Paw Feed',cost:25,bond:3,hunger:6,chance:.04,gems:1},
 {id:'silver',name:'Silver Paw Feed',cost:60,bond:6,hunger:10,chance:.08,gems:1},
 {id:'gold',name:'Golden Paw Feed',cost:120,bond:10,hunger:17,chance:.12,gems:2},
 {id:'blue',name:'Blue Paw Feed',cost:210,bond:15,hunger:24,chance:.16,gems:2},
 {id:'green',name:'Green Paw Feed',cost:330,bond:21,hunger:32,chance:.20,gems:3},
 {id:'violet',name:'Violet Paw Feed',cost:500,bond:29,hunger:42,chance:.24,gems:4},
 {id:'red',name:'Ruby Paw Feed',cost:750,bond:40,hunger:55,chance:.28,gems:5}
]);
const LIMIT=999999999,FOOD_MAX=99999,HOUR=3600000;
const integer=(v,max=LIMIT)=>Number.isSafeInteger(v)&&v>=0?Math.min(max,v):0;
const findPet=id=>PETS.find(p=>p.id===id);
const findFood=id=>FOOD.find(f=>f.id===id);
function ensure(save,at=Date.now()){
 if(!save||typeof save!=='object')throw new TypeError('A valid save object is required');
 let state=save.companions;
 if(!state||typeof state!=='object'||Array.isArray(state))state=save.companions={};
 if(!findPet(state.active))state.active='squirrel';
 if(!state.pets||typeof state.pets!=='object'||Array.isArray(state.pets))state.pets={};
 if(!state.feedStock||typeof state.feedStock!=='object'||Array.isArray(state.feedStock))state.feedStock={};
 state.totalGems=integer(state.totalGems);
 state.pity=integer(state.pity,7);
 for(const p of PETS){
  let pet=state.pets[p.id];if(!pet||typeof pet!=='object'||Array.isArray(pet))pet=state.pets[p.id]={};
  pet.bond=integer(pet.bond,100);pet.hunger=pet.hunger===undefined?75:integer(pet.hunger,100);
  pet.feedings=integer(pet.feedings);
  const now=Number.isFinite(at)?Math.max(0,Math.trunc(at)):Date.now();
  if(!Number.isFinite(pet.lastCareAt)||pet.lastCareAt<0)pet.lastCareAt=now;
  // Mild hunger progression; companions never die, disappear, become inaccessible or cost real money.
  if(now>pet.lastCareAt){const elapsed=Math.floor((now-pet.lastCareAt)/HOUR);if(elapsed){pet.hunger=Math.max(0,pet.hunger-Math.min(100,elapsed));pet.lastCareAt+=elapsed*HOUR;}}
 }
 for(const food of FOOD)state.feedStock[food.id]=integer(state.feedStock[food.id],FOOD_MAX);
 return state;
}
function select(save,id,at=Date.now()){
 if(!findPet(id))return {valid:false,reason:'pet'};
 const state=ensure(save,at);state.active=id;return {valid:true,pet:id};
}
function buy(save,kind,quantity=1,at=Date.now()){
 const spec=findFood(kind);if(!spec||!Number.isSafeInteger(quantity)||quantity<1||quantity>50)return {valid:false,reason:'item'};
 const state=ensure(save,at),coins=integer(save.coins),cost=spec.cost*quantity;
 if(coins<cost)return {valid:false,reason:'nuts',needed:cost,available:coins};
 if(state.feedStock[kind]>FOOD_MAX-quantity)return {valid:false,reason:'stock-full'};
 save.coins=coins-cost;state.feedStock[kind]+=quantity;
 return {valid:true,kind,quantity,cost,stock:state.feedStock[kind],coins:save.coins};
}
function feed(save,kind,at=Date.now(),random=Math.random){
 const spec=findFood(kind);if(!spec)return {valid:false,reason:'item'};
 const state=ensure(save,at),pet=state.pets[state.active];
 if(state.feedStock[kind]<1)return {valid:false,reason:'no-feed'};
 // Use injected RNG for tests but never accept NaN, out-of-range, or a crashing provider.
 const roll=typeof random==='function'?random():1;
 if(!Number.isFinite(roll)||roll<0||roll>=1)return {valid:false,reason:'rng'};
 state.feedStock[kind]--;
 pet.hunger=Math.min(100,pet.hunger+spec.hunger);
 pet.bond=Math.min(100,pet.bond+spec.bond);
 pet.feedings++;
 pet.lastCareAt=Number.isFinite(at)?Math.max(pet.lastCareAt,Math.trunc(at)):Date.now();
 const jackpot=(roll<spec.chance)||(state.pity>=7);
 const gems=jackpot?spec.gems:0;
 if(jackpot){save.gems=Math.min(LIMIT,integer(save.gems)+gems);state.totalGems=Math.min(LIMIT,state.totalGems+gems);state.pity=0;}
 else state.pity++;
 return {valid:true,kind,pet:state.active,name:findPet(state.active).name,hunger:pet.hunger,bond:pet.bond,feedings:pet.feedings,gems,pity:state.pity,remaining:state.feedStock[kind]};
}
function rank(bond){const n=integer(bond,100);return n>=90?'Inseparable':n>=65?'Best Friends':n>=35?'Trusting':n>=15?'Friendly':'New Friends';}
const art=(kind,id)=>'art/companions/'+kind+'/'+id+'.png';
const api=Object.freeze({PETS,FOOD,ensure,select,buy,feed,rank,art});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutCompanions=api;
})(typeof window!=='undefined'?window:globalThis);
