/* Nutbuster campaign unlocks, booster inventory and reward tracks.
   Offline and deterministic; no billing, telemetry, ad views or account access. */
(function(root){
'use strict';
const LADDER=Object.freeze([
 {id:'hammer',level:1,starter:3},
 {id:'extra',level:5,starter:3},
 {id:'row',level:10,starter:3},
 {id:'shuffle',level:18,starter:3},
 {id:'column',level:26,starter:3},
 {id:'blast',level:37,starter:3},
 {id:'cross',level:49,starter:3},
 {id:'color',level:62,starter:3},
 {id:'drill',level:77,starter:3},
 {id:'unlock',level:92,starter:3},
 {id:'quake',level:120,starter:1},
 {id:'triple-row',level:160,starter:1},
 {id:'triple-column',level:205,starter:1},
 {id:'starburst',level:260,starter:1},
 {id:'spectrum',level:330,starter:1},
 {id:'frostbreaker',level:420,starter:1}
]);

/* Gameplay icon catalog. NUTDEX mirrors active controls, never "uses up" an asset. */
const BOOSTER_ART=Object.freeze({
 hammer:'art/primary/powerups/hammer.png',
 row:'art/primary/powerups/row-clear.png',
 column:'art/additions/effects/vertical-clear.png',
 cross:'art/additions/effects/horizontal-clear.png',
 blast:'art/primary/powerups/nut-burst.png',
 color:'art/primary/powerups/rainbow.png',
 shuffle:'art/additions/effects/shell-ring.png',
 extra:'art/additions/economy/hourglass.png',
 drill:'art/additions/effects/rocket-impact.png',
 unlock:'art/additions/effects/chain-break.png',
 quake:'art/additions/effects/shell-supernova.png',
 'triple-row':'art/primary/powerups/row-clear.png',
 'triple-column':'art/additions/effects/vertical-clear.png',
 starburst:'art/additions/effects/sparkle-burst.png',
 spectrum:'art/additions/effects/rainbow-pulse.png',
 frostbreaker:'art/additions/effects/ice-shatter.png'
});
const BOOSTER_BADGES=Object.freeze({'triple-row':'×3','triple-column':'×3',spectrum:'×2'});
const CHALLENGE_STEPS=Object.freeze([1,2,3,4,5,7,10,12,15,18,21,25]);
const BUNDLES=Object.freeze({
 shop0:{hammer:3,extra:2,row:1},
 shop1:{color:2,shuffle:2,extra:1},
 shop2:{column:2,cross:2,blast:1},
 shop3:{drill:2,unlock:2,hammer:2},
 shop4:{hammer:1,extra:1,row:1,column:1,shuffle:1,blast:1,cross:1,color:1,drill:1,unlock:1},
 vipDaily:{hammer:2,extra:1,shuffle:1},
 shop5:{blast:2,drill:1,color:2},
 daily:{hammer:1,extra:1,shuffle:1},
 chest:{blast:1,drill:1,extra:1},
 pig:{hammer:2,row:1},
 friend:{shuffle:2,extra:1},
 pass:{column:2,cross:1,unlock:1},
 loot:{color:2,blast:1,hammer:1},
 treasure:{hammer:1,blast:1},
 booster:{extra:1,row:1},
 finale:{cross:2,unlock:1,drill:1}
});
const LEVEL_BY_TOOL=Object.freeze(Object.fromEntries(LADDER.map(item=>[item.id,item.level])));
const HOLD_ITEMS=Object.freeze({
 butter_hold:Object.freeze({label:'Peanut Butter',drops:1,gems:15,art:'art/additions/effects/golden-acorn-glow.png',tip:'Hold one nut for one actual gravity drop; held matches triple that nut\'s points'}),
 jam_hold:Object.freeze({label:'Jam',drops:2,gems:30,art:'art/additions/effects/royal-boost.png',tip:'Hold one nut for two actual gravity drops; held matches triple that nut\'s points'})
});
const nonnegative=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(999999,Math.trunc(Number(n)))):0;
function normalizedMap(input){const result={};if(input&&typeof input==='object'&&!Array.isArray(input))
 for(const [key,value] of Object.entries(input))if(Object.prototype.hasOwnProperty.call(LEVEL_BY_TOOL,key))result[key]=nonnegative(value);
 return result;
}
function hasCleared(save,level){return level===1 || !!(save.stars&&nonnegative(save.stars[level])>0);}
function unlocked(save,id){return Object.prototype.hasOwnProperty.call(LEVEL_BY_TOOL,id)&&(hasCleared(save,LEVEL_BY_TOOL[id])||save.claimedUnlocks?.[id]===true);}
function available(save){return LADDER.filter(spec=>unlocked(save,spec.id)).map(spec=>spec.id);}
function nextUnlock(save){return LADDER.find(spec=>!unlocked(save,spec.id))||null;}
function migrate(save){
 if(!save.stars||typeof save.stars!=='object')save.stars={};
 // The old alpha stored completion as unlocked = last completed + 1.
 // On first migration only, honor that existing progression without inventing new wins.
 if(!save.boosterInventory||typeof save.boosterInventory!=='object'||Array.isArray(save.boosterInventory)){
  const previous=Math.max(0,nonnegative(save.unlocked)-1);
  const stock={};
  for(const item of LADDER)stock[item.id]=(item.level===1||hasCleared(save,item.level)||previous>=item.level)?item.starter:0;
  save.boosterInventory=stock;
 }else save.boosterInventory=normalizedMap(save.boosterInventory);
 if(!save.holdInventory||typeof save.holdInventory!=='object'||Array.isArray(save.holdInventory))save.holdInventory={};
 for(const id of Object.keys(HOLD_ITEMS))save.holdInventory[id]=nonnegative(save.holdInventory[id]);
 if(!save.claimedUnlocks||typeof save.claimedUnlocks!=='object')save.claimedUnlocks={};
 if(!save.claimedLevelRewards||typeof save.claimedLevelRewards!=='object')save.claimedLevelRewards={};
 if(!save.claimedChallengeRewards||typeof save.claimedChallengeRewards!=='object')save.claimedChallengeRewards={};
 // Prevent retroactive repeated starter grants on migrated saves.
 const previous=Math.max(0,nonnegative(save.unlocked)-1);
 for(const item of LADDER)if(item.level===1||hasCleared(save,item.level)||previous>=item.level)
  save.claimedUnlocks[item.id]=true;
 return save;
}
// Golden Nuts buy one already-unlocked booster; Gems and Wharf Dollars stay separate.
const BOOSTER_PRICES=Object.freeze({
 hammer:400,extra:450,row:550,shuffle:600,column:750,blast:950,
 cross:1200,color:1450,drill:1800,unlock:2200,
 quake:2600,'triple-row':3000,'triple-column':3000,starburst:3500,spectrum:4200,frostbreaker:4400
});
function buyBooster(save,id){
 const cost=BOOSTER_PRICES[id];
 if(!cost)return {valid:false,reason:'unknown'};
 if(!unlocked(save,id))return {valid:false,reason:'locked'};
 if(count(save,id)>=999999)return {valid:false,reason:'limit'};
 const coins=nonnegative(save.coins);
 if(coins<cost)return {valid:false,reason:'coins',short:cost-coins};
 save.coins=coins-cost;
 if(!save.boosterInventory||typeof save.boosterInventory!=='object')save.boosterInventory={};
 save.boosterInventory[id]=count(save,id)+1;
 return {valid:true,id,cost,owned:count(save,id)};
}
function count(save,id){return nonnegative(save.boosterInventory?.[id]);}
function spend(save,id){if(!unlocked(save,id)||count(save,id)<1)return false;
 save.boosterInventory[id]--;return true;}
function holdCount(save,id){return HOLD_ITEMS[id]?nonnegative(save.holdInventory?.[id]):0;}
function buyHold(save,id){
 const item=HOLD_ITEMS[id];if(!item)return {valid:false,reason:'unknown'};
 if(nonnegative(save.gems)<item.gems)return {valid:false,reason:'gems',short:item.gems-nonnegative(save.gems)};
 if(!save.holdInventory||typeof save.holdInventory!=='object')save.holdInventory={};
 save.gems=nonnegative(save.gems)-item.gems;
 save.holdInventory[id]=nonnegative(holdCount(save,id)+1);
 return {valid:true,id,gems:save.gems,stock:holdCount(save,id)};
}
function spendHold(save,id){if(!HOLD_ITEMS[id]||holdCount(save,id)<1)return false;save.holdInventory[id]--;return true;}
function actualPack(save,kind){
 const intended=BUNDLES[kind];
 if(!intended)throw new RangeError('Unknown pack '+kind);
 const active=available(save),result={};
 for(const [id,amount] of Object.entries(intended)){
  // Packs never prematurely unlock a tool; the offer contains an equivalent
  // quantity of the strongest tool currently earned through campaign play.
  const given=unlocked(save,id)?id:active[active.length-1];
  result[given]=(result[given]||0)+amount;
 }
 return result;
}
function grant(save,contents){
 let total=0;
 for(const [id,n] of Object.entries(contents||{})){
  if(!unlocked(save,id))continue;
  const quantity=nonnegative(n);save.boosterInventory[id]=nonnegative(count(save,id)+quantity);total+=quantity;
 }
 return total;
}
function packText(contents,labels){
 return Object.entries(contents).map(([id,n])=>n+'× '+(labels?.[id]||id)).join(' · ');
}
function kindForLevel(level){
 const local=(level-1)%100+1;
 return local===100?'finale':local%20===0?'challenge':local%15===0?'treasure':local%12===0?'booster':local%10===0?'hard':'standard';
}
function firstClear(save,level){
 if(!Number.isInteger(level)||level<1||level>1000)return {valid:false,reason:'level'};
 if(!hasCleared(save,level))return {valid:false,reason:'not-cleared'};
 const result={valid:true,unlock:[],pack:null,contents:{},first:false};
 if(!save.claimedLevelRewards[level]){
  result.first=true;
  const kind=kindForLevel(level);
  const key=kind==='finale'?'finale':kind==='treasure'?'treasure':kind==='booster'?'booster':kind==='challenge'?'booster':null;
  if(key){result.pack=key;result.contents=actualPack(save,key);grant(save,result.contents);}
  save.claimedLevelRewards[level]=true;
 }
 for(const item of LADDER)if(item.level===level&&!save.claimedUnlocks[item.id]){
  save.claimedUnlocks[item.id]=true;
  save.boosterInventory[item.id]=nonnegative(count(save,item.id)+item.starter);
  result.unlock.push(item.id);
 }
 return result;
}
function challengeProgress(save){
 return Object.keys(save.stars||{}).filter(key=>{
  const n=Number(key);
  return Number.isInteger(n)&&n>=1&&n<=1000&&n%20===0&&nonnegative(save.stars[key])>0;
 }).length;
}
function challengeRewards(save){
 const completed=challengeProgress(save);
 return CHALLENGE_STEPS.map((requirement,index)=>({
  index,requirement,completed,claimed:!!save.claimedChallengeRewards[index],
  ready:completed>=requirement&&!save.claimedChallengeRewards[index],
  contents:actualPack(save,index%3===0?'shop2':index%3===1?'shop3':'shop1')
 }));
}
function claimChallenge(save,index){
 if(!Number.isInteger(index)||index<0||index>=CHALLENGE_STEPS.length)return {valid:false,reason:'tier'};
 const reward=challengeRewards(save)[index];
 if(!reward.ready)return {valid:false,reason:reward.claimed?'claimed':'not-ready'};
 save.claimedChallengeRewards[index]=true;
 grant(save,reward.contents);
 return {valid:true,contents:reward.contents};
}
const api={LADDER,CHALLENGE_STEPS,BUNDLES,LEVEL_BY_TOOL,HOLD_ITEMS,BOOSTER_ART,BOOSTER_BADGES,BOOSTER_PRICES,buyBooster,migrate,unlocked,available,nextUnlock,count,spend,holdCount,buyHold,spendHold,actualPack,grant,packText,kindForLevel,firstClear,challengeProgress,challengeRewards,claimChallenge};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutProgress=api;
})(typeof window!=='undefined'?window:globalThis);
