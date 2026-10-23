/* Offline Nutvale reward crates — truthful disclosed, weighted drop tables.
 * Outcomes are committed to the save BEFORE opening animation. No checkout SDK.
 * No remote odds, no undelivered prize, no undisclosed reroll. */
(function(root){
'use strict';
const P=root.NutProgress,F=root.NutFishing,A=root.NutAvatarArt;
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
const outfits=A.SEASONAL.map((id,i)=>[
 id,'cosmetic',id,1,i<8?8:i<14?5:1,i<8?'common':i<14?'rare':'legendary'
]);
const table=items=>Object.freeze(items.map(([id,kind,item,amount,weight,rarity])=>Object.freeze({id,kind,item,amount,weight,rarity})));
const CRATES=Object.freeze({
 acorn:Object.freeze({id:'acorn',name:'Acorn Surprise',icon:'🌰',art:'art/additions/economy/booster-pack.png',cost:700,currency:'coins',style:'acorn',fixed:{booster:'hammer'},outcomes:table(basic)}),
 royal:Object.freeze({id:'royal',name:'Royal Arsenal Chest',icon:'👑',art:'art/additions/economy/locked-chest.png',cost:3000,currency:'coins',style:'royal',fixed:{booster:'quake'},outcomes:table(grand)}),
 wharf:Object.freeze({id:'wharf',name:'Wharf Treasure Chest',icon:'⚓',art:'art/additions/economy/timed-chest.png',cost:300,currency:'dollars',style:'wharf',fixed:{bait:'worm',amount:2},outcomes:table(wharf)}),
 cosmetic:Object.freeze({id:'cosmetic',name:'Wardrobe Mystery Trunk',icon:'🎭',art:'art/additions/economy/open-lootbox.png',cost:1400,currency:'coins',style:'cosmetic',fixed:null,outcomes:table(outfits)})
});
const CAP=999999999;
const countCurrency=(save,currency)=>currency==='dollars'?F.ensure(save).dollars:Math.max(0,Number(save[currency])||0);
function details(save,outcome){
 const name=outcome.kind==='booster'?root.NutEngine.BOOSTER_META[outcome.item]?.label:
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
 if(fixed.booster)return 'Guaranteed +1 '+root.NutEngine.BOOSTER_META[fixed.booster].label+' booster (early-use unlock included)';
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
 save.boosterInventory[id]=Math.min(999999,(Number(save.boosterInventory[id])||0)+amount);
}
function credit(save,kind,amount){
 save[kind]=Math.min(CAP,Math.max(0,Number(save[kind])||0)+amount);
}
function grant(save,outcome){
 const n=F.ensure(save),result=details(save,outcome);
 if(outcome.kind==='booster')grantBooster(save,outcome.item,outcome.amount);
 else if(outcome.kind==='bait')n.baits[outcome.item]=Math.min(999999,(n.baits[outcome.item]||0)+outcome.amount);
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
function open(save,id,random=Math.random){
 const crate=CRATES[id];if(!crate)return {valid:false,reason:'crate'};
 const n=F.ensure(save),balance=countCurrency(save,crate.currency);
 if(balance<crate.cost)return {valid:false,reason:'funds',missing:crate.cost-balance};
 const x=Number(random());if(!Number.isFinite(x)||x<0||x>=1)return {valid:false,reason:'rng'};
 // A single weighted roll per crate; exact probabilities shown by odds().
 const picked=rngChoice(crate,x),rewards=[];
 if(crate.currency==='dollars')n.dollars-=crate.cost;
 else save[crate.currency]=balance-crate.cost;
 if(crate.fixed?.booster){
  grantBooster(save,crate.fixed.booster,1);
  rewards.push({label:'1 × '+root.NutEngine.BOOSTER_META[crate.fixed.booster].label+' (guaranteed)',kind:'booster',rarity:'guaranteed'});
 }
 if(crate.fixed?.bait){
  n.baits[crate.fixed.bait]=(n.baits[crate.fixed.bait]||0)+crate.fixed.amount;
  rewards.push({label:crate.fixed.amount+' × Honest Worm (guaranteed)',kind:'bait',rarity:'guaranteed'});
 }
 const rolled=grant(save,picked);rewards.push(rolled);
 return {valid:true,id,cost:crate.cost,currency:crate.currency,style:crate.style,name:crate.name,
  art:crate.art,icon:crate.icon,rewards,roll:x,rolled:picked.id,rarity:picked.rarity,weight:picked.weight};
}
for(const c of Object.values(CRATES)){
 if(c.outcomes.reduce((sum,o)=>sum+o.weight,0)!==100)throw Error('Invalid odds: '+c.id);
 if(new Set(c.outcomes.map(o=>o.id)).size!==c.outcomes.length)throw Error('Duplicate outcome: '+c.id);
}
const api=Object.freeze({CRATES,odds,open,rngChoice,details});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutCrates=api;
})(typeof window!=='undefined'?window:globalThis);
