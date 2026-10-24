/* Offline Nutvale reward crates — truthful disclosed, weighted drop tables.
 * Outcomes are committed to the save BEFORE opening animation. No checkout SDK.
 * No remote odds, no undelivered prize, no undisclosed reroll. */
(function(root){
'use strict';
const P=root.NutProgress||(typeof require==='function'?require('./progression.js'):null),F=root.NutFishing||(typeof require==='function'?require('./fishing.js'):null),A=root.NutAvatarArt||(typeof require==='function'?require('./avatar-art.js'):null),E=root.NutEngine||(typeof require==='function'?require('./engine.js'):null);
if(!P||!F||!A||!E)throw new Error('Reward crate dependencies must be loaded before the shop');
const basic=[
 ['hammer','booster','hammer',1,30,'common'],
 ['extra','booster','extra',1,20,'common'],
 ['row','booster','row',1,15,'common'],
 ['coins','coins',null,1000,15,'rare'],
 ['gems','gems',null,20,10,'rare'],
 ['glitter','bait','glitter',2,6,'rare'],
 ['royal','bait','royal',1,4,'epic']
];
const grand=[
 ['quake','booster','quake',1,22,'rare'],['triple-row','booster','triple-row',1,20,'rare'],
 ['triple-column','booster','triple-column',1,15,'rare'],['starburst','booster','starburst',1,12,'epic'],
 ['spectrum','booster','spectrum',1,10,'epic'],['frostbreaker','booster','frostbreaker',1,6,'legendary'],
 ['gems','gems',null,160,5,'epic'],['coins','coins',null,6500,5,'rare'],
 ['tank','tank',null,1,3,'legendary'],['astral','bait','astral-roe',3,2,'legendary']
];
const wharf=[
 ['worms','bait','worm',10,25,'common'],['glitter','bait','glitter',5,20,'common'],
 ['royal','bait','royal',3,15,'rare'],['squid','bait','deep-squid',2,10,'rare'],
 ['leviathan','bait','leviathan-lure',1,5,'epic'],['dollars','dollars',null,900,10,'rare'],
 ['tank','tank',null,1,5,'epic'],['shop','bait-tier',null,1,5,'legendary'],
 ['wharf','wharf-tier',null,1,5,'legendary']
];
const sampler=[
 ['hammer','booster','hammer',3,20,'common'],['row','booster','row',2,18,'common'],
 ['extra','booster','extra',3,18,'common'],['shuffle','booster','shuffle',2,14,'uncommon'],
 ['cross','booster','cross',2,12,'uncommon'],['blast','booster','blast',2,10,'rare'],
 ['spectrum','booster','spectrum',1,5,'epic'],['gems','gems',null,60,3,'legendary']
];
const aquarium=[
 ['worms','bait','worm',12,20,'common'],['glitter','bait','glitter',5,15,'common'],
 ['royal','bait','royal',3,10,'uncommon'],['dollars','dollars',null,1200,15,'uncommon'],
 ['tank','tank',null,1,20,'rare'],['bait-tier','bait-tier',null,1,8,'rare'],
 ['wharf-tier','wharf-tier',null,1,7,'epic'],['gems','gems',null,100,5,'legendary']
];
const festival=[
 ...A.SEASONAL.slice(0,6).map(id=>[id,'cosmetic',id,1,10,'rare']),
 ['starburst','booster','starburst',2,10,'epic'],['royal','bait','royal',5,10,'uncommon'],
 ['coins','coins',null,3200,10,'rare'],['gems','gems',null,90,10,'legendary']
];
const vault=[
 ['frostbreaker','booster','frostbreaker',2,12,'legendary'],
 ['spectrum','booster','spectrum',2,16,'epic'],['starburst','booster','starburst',3,16,'epic'],
 ['gems','gems',null,180,17,'rare'],['coins','coins',null,7000,17,'rare'],
 ['tank','tank',null,2,12,'legendary'],
 ['starfall-eve','cosmetic','starfall-eve',1,10,'legendary']
];
const outfits=A.SEASONAL.map((id,i)=>[
 id,'cosmetic',id,1,i<8?8:i<14?5:1,i<8?'common':i<14?'rare':'legendary'
]);
const table=items=>Object.freeze(items.map(([id,kind,item,amount,weight,rarity])=>Object.freeze({id,kind,item,amount,weight,rarity})));
const CRATES=Object.freeze({
 acorn:Object.freeze({id:'acorn',name:'Acorn Surprise',icon:'🌰',art:'art/additions/economy/grand-bundle.png',cost:700,currency:'coins',style:'acorn',fixed:{booster:'hammer'},outcomes:table(basic)}),
 royal:Object.freeze({id:'royal',name:'Royal Arsenal Chest',icon:'👑',art:'art/additions/economy/open-lootbox.png',cost:3000,currency:'coins',style:'royal',fixed:{booster:'quake'},outcomes:table(grand)}),
 wharf:Object.freeze({id:'wharf',name:'Wharf Treasure Chest',icon:'⚓',art:'art/additions/economy/timed-chest.png',cost:300,currency:'dollars',style:'wharf',fixed:{bait:'worm',amount:2},outcomes:table(wharf)}),
 cosmetic:Object.freeze({id:'cosmetic',name:'Wardrobe Mystery Trunk',icon:'🎭',art:'art/additions/economy/squirrel-pass.png',cost:1400,currency:'coins',style:'cosmetic',fixed:null,outcomes:table(outfits)}),
 sampler:Object.freeze({id:'sampler',name:'Trail Mix Booster Box',art:'art/additions/economy/level-badge.png',cost:1100,currency:'coins',style:'sampler',fixed:null,outcomes:table(sampler)}),
 aquarium:Object.freeze({id:'aquarium',name:'Aquarium Treasure Net',art:'art/fishing/species/v2/fish-set08-diamond-puffer.png',cost:360,currency:'dollars',style:'aquarium',fixed:null,outcomes:table(aquarium)}),
 festival:Object.freeze({id:'festival',name:'Festival Prize Satchel',art:'art/additions/economy/premium-ticket.png',cost:2500,currency:'coins',style:'festival',fixed:null,outcomes:table(festival)}),
 vault:Object.freeze({id:'vault',name:'Gilded Collector Vault',art:'art/additions/economy/achievement-medal.png',cost:5200,currency:'coins',style:'vault',fixed:null,outcomes:table(vault)})
});
const CAP=999999999;
const countCurrency=(save,currency)=>currency==='dollars'?F.ensure(save).dollars:Math.max(0,Number(save[currency])||0);
function details(save,outcome){
 const name=outcome.kind==='booster'?E.BOOSTER_META[outcome.item]?.label:
  outcome.kind==='bait'?F.BAITS.find(x=>x.id===outcome.item)?.name:
  outcome.kind==='cosmetic'?A.COSTUMES.find(x=>x.id===outcome.item)?.name:
  outcome.kind==='tank'?'Aquarium tank upgrade':
  outcome.kind==='bait-tier'?'Bait Shop upgrade':
  outcome.kind==='wharf-tier'?'Wharf upgrade':
  outcome.kind==='coins'?'Golden Nuts':
  outcome.kind==='gems'?'Gems':'Nutvale Dollars';
 const n=F.ensure(save),max=outcome.kind==='tank'?n.tank>=10:outcome.kind==='bait-tier'?n.baitTier>=5:outcome.kind==='wharf-tier'?n.wharfTier>=5:false;
 const owned=outcome.kind==='cosmetic'&&A.owned(save,outcome.item);
 const message=max?'(at maximum: +N$800 instead)':owned?'(already owned: +600 Golden Nuts instead)':
  outcome.kind==='bait'&&F.BAITS.find(b=>b.id===outcome.item)?.level>n.baitTier?'(stocked now; usable after shop tier unlock)':'';
 return {name,amount:outcome.amount,label:outcome.amount+' × '+name+' '+message,rarity:outcome.rarity,weight:outcome.weight,kind:outcome.kind,id:outcome.id};
}
function odds(save,id){
 const crate=CRATES[id];if(!crate)return null;
 const rows=crate.outcomes.map(x=>({...details(save,x),percent:x.weight}));
 return {crate:crate.name,cost:crate.cost,currency:crate.currency,fixed:crate.fixed?fixedLabel(crate.fixed):null,
  odds:rows,probabilityTotal:rows.reduce((s,x)=>s+x.percent,0)};
}
function fixedLabel(fixed){
 if(fixed.booster)return 'Guaranteed +1 '+E.BOOSTER_META[fixed.booster].label+' booster (early-use unlock included)';
 if(fixed.bait)return 'Guaranteed +'+fixed.amount+' Honest Worm bait';
 return null;
}
function rngChoice(crate,random){
 let x=Math.max(0,Math.min(.9999999999999999,Number(random))),threshold=x*100;
 for(const outcome of crate.outcomes){threshold-=outcome.weight;if(threshold<0)return outcome;}
 return crate.outcomes[crate.outcomes.length-1];
}
function grantBooster(save,id,amount){
 if(!save.claimedUnlocks||typeof save.claimedUnlocks!=='object')save.claimedUnlocks={};
 save.claimedUnlocks[id]=true; // crate offers early use, including advanced boosters
 if(!save.boosterInventory||typeof save.boosterInventory!=='object')save.boosterInventory={};
 const owned=Math.max(0,Math.trunc(Number(save.boosterInventory[id])||0));
 if(owned>999999-amount)return false;
 save.boosterInventory[id]=owned+amount;
 return true;
}
function credit(save,kind,amount){
 save[kind]=Math.min(CAP,Math.max(0,Number(save[kind])||0)+amount);
}
function grant(save,outcome){
 const n=F.ensure(save),result=details(save,outcome);
 if(outcome.kind==='booster'&&!grantBooster(save,outcome.item,outcome.amount)){
  credit(save,'coins',800);result.label='+800 Golden Nuts (booster inventory full)';result.kind='coins';result.amount=800;
 }
 else if(outcome.kind==='bait'){
  if(!Object.prototype.hasOwnProperty.call(n.baits,outcome.item))throw new Error('Unknown prize bait '+outcome.item);
  if(n.baits[outcome.item]>999999-outcome.amount){n.dollars=Math.min(CAP,n.dollars+800);result.label='N$800 (bait inventory full)';result.kind='dollars';result.amount=800;}
  else n.baits[outcome.item]+=outcome.amount;
 }
 else if(outcome.kind==='coins'||outcome.kind==='gems')credit(save,outcome.kind,outcome.amount);
 else if(outcome.kind==='dollars')n.dollars=Math.min(CAP,n.dollars+outcome.amount);
 else if(outcome.kind==='tank'||outcome.kind==='bait-tier'||outcome.kind==='wharf-tier'){
  const field=outcome.kind==='tank'?'tank':outcome.kind==='bait-tier'?'baitTier':'wharfTier';
  const limit=field==='tank'?10:5;
  if(n[field]>=limit){n.dollars=Math.min(CAP,n.dollars+800);result.label='N$800 (maximum upgrade compensation)';result.kind='dollars';result.amount=800;}
  else n[field]++;
 }
 else if(outcome.kind==='cosmetic'){
  if(A.owned(save,outcome.item)){credit(save,'coins',600);result.label='+600 Golden Nuts (duplicate outfit compensation)';result.kind='coins';result.amount=600;}
  else {if(!save.homestead||typeof save.homestead!=='object')save.homestead={};
   if(!save.homestead.lootCostumes||typeof save.homestead.lootCostumes!=='object')save.homestead.lootCostumes={};
   save.homestead.lootCostumes[outcome.item]=true;}
 }
 return result;
}
function open(save,id,random=Math.random,options={}){
 const crate=CRATES[id];if(!crate)return {valid:false,reason:'crate'};
 const n=F.ensure(save),balance=countCurrency(save,crate.currency);
 if(!options.free&&balance<crate.cost)return {valid:false,reason:'funds',missing:crate.cost-balance};
 const x=Number(random());if(!Number.isFinite(x)||x<0||x>=1)return {valid:false,reason:'rng'};
 // A single weighted roll per crate; exact probabilities shown by odds().
 const picked=rngChoice(crate,x),rewards=[];
 if(!options.free){if(crate.currency==='dollars')n.dollars-=crate.cost;
 else save[crate.currency]=balance-crate.cost;}
 if(crate.fixed?.booster){
  if(grantBooster(save,crate.fixed.booster,1))rewards.push({label:'1 × '+E.BOOSTER_META[crate.fixed.booster].label+' (guaranteed)',kind:'booster',rarity:'guaranteed'});
  else{credit(save,'coins',800);rewards.push({label:'+800 Golden Nuts (booster inventory full)',kind:'coins',rarity:'guaranteed'});}
 }
 if(crate.fixed?.bait){
  n.baits[crate.fixed.bait]=(n.baits[crate.fixed.bait]||0)+crate.fixed.amount;
  rewards.push({label:crate.fixed.amount+' × Honest Worm (guaranteed)',kind:'bait',rarity:'guaranteed'});
 }
 const rolled=grant(save,picked);rewards.push(rolled);
 if(!Array.isArray(save.crateHistory))save.crateHistory=[];
 save.crateHistory.push({id,outcome:picked.id,rarity:picked.rarity,weight:picked.weight,price:options.free?0:crate.cost,currency:crate.currency,at:Date.now(),rewards:rewards.map(x=>x.label)});
 if(save.crateHistory.length>50)save.crateHistory=save.crateHistory.slice(-50);
 return {valid:true,id,cost:options.free?0:crate.cost,currency:crate.currency,style:crate.style,name:crate.name,
  art:crate.art,icon:crate.icon,rewards,roll:x,rolled:picked.id,rarity:picked.rarity,weight:picked.weight};
}
for(const c of Object.values(CRATES)){
 if(c.outcomes.reduce((sum,o)=>sum+o.weight,0)!==100)throw Error('Invalid odds: '+c.id);
 if(new Set(c.outcomes.map(o=>o.id)).size!==c.outcomes.length)throw Error('Duplicate outcome: '+c.id);
 if(c.outcomes.some(o=>!Number.isInteger(o.weight)||o.weight<1||!Number.isInteger(o.amount)||o.amount<1))throw Error('Invalid prize amount or probability: '+c.id);
}
const api=Object.freeze({CRATES,odds,open,rngChoice,details});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutCrates=api;
})(typeof window!=='undefined'?window:globalThis);
