/* Nutvale Homestead: offline, earned collectibles, cosmetic ownership and placement.
   Never calls a network, store SDK, clock, or billing provider. */
(function(root){
'use strict';
const SLOTS=12; // Legacy yard positions remain 0–11.
const ZONES=Object.freeze([
 {id:'yard',name:'Cottage Green',icon:'🏠',level:0,start:0,count:12,description:'The original backyard'},
 {id:'orchard',name:'Whispering Orchard',icon:'🌳',level:25,start:12,count:8,description:'A suspiciously profitable grove'},
 {id:'terrace',name:'Manor Terrace',icon:'🏛️',level:100,start:20,count:8,description:'A monument to fiscal restraint'},
 {id:'lake',name:'Moonnut Lake',icon:'🌙',level:250,start:28,count:8,description:'Waterfront status, naturally'},
 {id:'palace',name:'Crown Gardens',icon:'👑',level:400,start:36,count:8,description:'Royal property speculation'}
]);
const TOTAL_PLOTS=ZONES.reduce((n,z)=>n+z.count,0);
const HOUSES=Object.freeze([
 {id:'cottage',name:'Acorn Cottage',icon:'🏠',level:0,cost:0},
 {id:'lodge',name:'Walnut Lodge',icon:'🏡',level:25,cost:2000},
 {id:'manor',name:'Nutwood Manor',icon:'🏘️',level:100,cost:8000},
 {id:'estate',name:'Regal Estate',icon:'🏰',level:250,cost:20000},
 {id:'palace',name:'Nutvale Palace',icon:'🏯',level:400,cost:50000}
]);
const PETS=Object.freeze([
 {id:'squirrel',name:'Resident Squirrel',icon:'🐿️',level:0},
 {id:'hedgehog',name:'Garden Hedgehog',icon:'🦔',level:10},
 {id:'owl',name:'Accountant Owl',icon:'🦉',level:25},
 {id:'rabbit',name:'Prizewinning Rabbit',icon:'🐇',level:50},
 {id:'fox',name:'Estate Inspector Fox',icon:'🦊',level:100},
 {id:'raccoon',name:'Night Auditor',icon:'🦝',level:150},
 {id:'deer',name:'Golden-Horned Deer',icon:'🦌',level:250},
 {id:'dragon',name:'Overleveraged Dragon',icon:'🐉',level:500}
]);
const SETS=Object.freeze([
 {id:'homely',name:'The Homely Collection',icon:'🏡',items:['mailbox','sapling','acorn','flowerbed'],reward:'homely-sign'},
 {id:'society',name:'The Antique Nut Society',icon:'🫖',items:['bench','tea-set','nut-clock'],reward:'society-plaque'},
 {id:'brag',name:'Bragging Rights',icon:'🏆',items:['bronze-cup','silver-cup','gold-statue'],reward:'victory-pedestal'},
 {id:'gardens',name:'Distinguished Gardens',icon:'🌻',items:['birdbath','hedge','fountain'],reward:'garden-arch'},
 {id:'kingdom',name:'The Great Nut Odyssey',icon:'🌍',items:['first-campaign','second-campaign','third-campaign','fourth-campaign','final-monument'],reward:'world-tree'}
]);
const DECOR=Object.freeze([
 {id:'mailbox',name:'Royal Mailbox',icon:'📫',level:0,group:'Garden'},
 {id:'sapling',name:'Tiny Nut Tree',icon:'🌱',level:0,group:'Garden'},
 {id:'acorn',name:'Acorn Patch',icon:'🌰',level:1,group:'Garden'},
 {id:'flowerbed',name:'Blooming Border',icon:'🌷',level:3,group:'Garden'},
 {id:'lantern',name:'Estate Lantern',icon:'🏮',level:5,group:'Garden'},
 {id:'bench',name:'Nutwood Bench',icon:'🪑',level:8,group:'Furniture'},
 {id:'bronze-cup',name:'First Ten Cup',icon:'🥉',level:10,group:'Trophies'},
 {id:'birdbath',name:'Squirrel Birdbath',icon:'⛲',level:15,group:'Garden'},
 {id:'banner',name:'Victory Banner',icon:'🚩',level:20,group:'Trophies'},
 {id:'gold-statue',name:'Golden Acorn',icon:'🏆',level:25,group:'Trophies'},
 {id:'hedge',name:'Trimmed Hedge',icon:'🌳',level:30,group:'Garden'},
 {id:'tea-set',name:'Executive Tea Set',icon:'🫖',level:40,group:'Furniture'},
 {id:'silver-cup',name:'Fifty-Level Chalice',icon:'🥈',level:50,group:'Trophies'},
 {id:'gazebo',name:'Squirrel Gazebo',icon:'🏡',level:60,group:'Furniture'},
 {id:'nut-clock',name:'Prestige Clock',icon:'🕰️',level:75,group:'Furniture'},
 {id:'first-campaign',name:'Nutwood Monument',icon:'🏛️',level:100,group:'Trophies'},
 {id:'golden-swing',name:'Golden Swing',icon:'🛝',level:125,group:'Furniture'},
 {id:'fountain',name:'Gem Fountain',icon:'💠',level:150,group:'Garden'},
 {id:'royal-gates',name:'Royal Estate Gates',icon:'🏰',level:175,group:'Furniture'},
 {id:'second-campaign',name:'Two Hundred Triumph',icon:'🥇',level:200,group:'Trophies'},
 {id:'night-garden',name:'Moonlit Garden',icon:'🌙',level:250,group:'Garden'},
 {id:'third-campaign',name:'Three Hundred Crest',icon:'🛡️',level:300,group:'Trophies'},
 {id:'diamond-tree',name:'Diamond Nut Tree',icon:'💎',level:350,group:'Garden'},
 {id:'fourth-campaign',name:'Four Hundred Crown',icon:'👑',level:400,group:'Trophies'},
 {id:'glory-arch',name:'Arch of Excess',icon:'🌈',level:450,group:'Furniture'},
 {id:'final-monument',name:'Legend of Nutvale',icon:'🏅',level:500,group:'Trophies'},
 {id:'royal-fountain',name:'Platinum Fountain',icon:'💦',premium:'royal-estate',group:'Premium'},
 {id:'royal-throne',name:'Diamond Throne',icon:'🪑',premium:'royal-estate',group:'Premium'},
 {id:'nut-picnic',name:'Annual Nut Picnic',icon:'🧺',level:28,group:'Orchard'},
 {id:'windmill',name:'Windmill of Profit',icon:'🌬️',level:35,group:'Orchard'},
 {id:'cider-press',name:'Acorn Cider Press',icon:'🍎',level:45,group:'Orchard'},
 {id:'mushroom-ring',name:'Faerie Nut Circle',icon:'🍄',level:55,group:'Orchard'},
 {id:'orchard-cart',name:'Harvest Cart',icon:'🛒',level:70,group:'Orchard'},
 {id:'sunflower',name:'Estate Sunflowers',icon:'🌻',level:85,group:'Orchard'},
 {id:'marble-column',name:'Marble Column',icon:'🏛️',level:110,group:'Terrace'},
 {id:'revenue-vase',name:'Revenue Vase',icon:'🏺',level:135,group:'Terrace'},
 {id:'grand-piano',name:'Executive Piano',icon:'🎹',level:160,group:'Terrace'},
 {id:'royal-portrait',name:'Portrait of Excellence',icon:'🖼️',level:180,group:'Terrace'},
 {id:'telescope',name:'Celestial Nut Scope',icon:'🔭',level:220,group:'Terrace'},
 {id:'balcony',name:'Platinum Balcony',icon:'🪟',level:240,group:'Terrace'},
 {id:'water-lilies',name:'Moonnut Lilies',icon:'🪷',level:260,group:'Lake'},
 {id:'fishing-pier',name:'Fishing Pier',icon:'🎣',level:280,group:'Lake'},
 {id:'swan',name:'Executive Swan',icon:'🦢',level:320,group:'Lake'},
 {id:'sailboat',name:'Luxury Nut Yacht',icon:'⛵',level:340,group:'Lake'},
 {id:'island',name:'Personal Tax Haven',icon:'🏝️',level:360,group:'Lake'},
 {id:'moon-bridge',name:'Silver Bridge',icon:'🌉',level:380,group:'Lake'},
 {id:'royal-cannon',name:'Ceremonial Nut Cannon',icon:'💣',level:410,group:'Palace'},
 {id:'crown-lights',name:'Crown Lanterns',icon:'✨',level:425,group:'Palace'},
 {id:'peacock',name:'Prestigious Peacock',icon:'🦚',level:440,group:'Palace'},
 {id:'throne-fountain',name:'Glorious Royal Fountain',icon:'⛲',level:460,group:'Palace'},
 {id:'dragon-statue',name:'Dragon of Dividends',icon:'🐲',level:480,group:'Palace'},
 {id:'gold-tree',name:'Gold-Plated Orchard',icon:'🌳',level:495,group:'Palace'},
 {id:'homely-sign',name:'Home Sweet Nutvale',icon:'🪧',set:'homely',group:'Sets'},
 {id:'society-plaque',name:'Antique Society Plaque',icon:'📜',set:'society',group:'Sets'},
 {id:'victory-pedestal',name:'Trophy Pedestal',icon:'🥇',set:'brag',group:'Sets'},
 {id:'garden-arch',name:'Rainbow Garden Arch',icon:'🌈',set:'gardens',group:'Sets'},
 {id:'world-tree',name:'Legendary World Tree',icon:'🌲',set:'kingdom',group:'Sets'}
]);
const AVATARS=Object.freeze([
 {id:'squire',name:'Nutvale Squire',icon:'🐿️',level:0},
 {id:'gardener',name:'Acorn Gardener',icon:'🧑‍🌾',level:5},
 {id:'champion',name:'Nut Champion',icon:'🦸',level:25},
 {id:'baron',name:'Baron von Walnut',icon:'🎩',level:50},
 {id:'explorer',name:'Nut Odyssey Explorer',icon:'🧭',level:100},
 {id:'emperor',name:'Emperor of Shells',icon:'👑',level:250},
 {id:'legend',name:'The Uncrackable',icon:'🐉',level:500},
 {id:'royal',name:'Platinum Royal',icon:'🤴',premium:'royal-estate'}
]);
const ACHIEVEMENTS=Object.freeze([
 {id:'first-win',name:'Property Owner',icon:'🏠',kind:'wins',need:1},
 {id:'ten-wins',name:'Tenacious Nut',icon:'🥜',kind:'wins',need:10},
 {id:'fifty-wins',name:'Acorn Industrialist',icon:'⚙️',kind:'wins',need:50},
 {id:'hundred-wins',name:'Nutwood Conqueror',icon:'🏛️',kind:'wins',need:100},
 {id:'two-hundred',name:'Unreasonable Commitment',icon:'🎖️',kind:'wins',need:200},
 {id:'five-hundred',name:'Completion Obsession',icon:'🌟',kind:'wins',need:500},
 {id:'triple-star',name:'Three-Star Debut',icon:'⭐',kind:'threeStars',need:1},
 {id:'star-vault',name:'Constellation Collector',icon:'✨',kind:'stars',need:100},
 {id:'star-empire',name:'A Thousand Stars',icon:'🌌',kind:'stars',need:1000},
 {id:'score-10k',name:'Five-Figure Nuts',icon:'📈',kind:'score',need:10000},
 {id:'score-100k',name:'High-Score Mogul',icon:'💰',kind:'score',need:100000},
 {id:'three-sets',name:'A Curated Obsession',icon:'🎨',kind:'sets',need:3},
 {id:'all-sets',name:'Certified Collector',icon:'🗃️',kind:'sets',need:5},
 {id:'four-pets',name:'A Proper Menagerie',icon:'🐾',kind:'pets',need:4},
 {id:'full-estate',name:'Landlord Supreme',icon:'🏰',kind:'zones',need:5}
]);
const decors=Object.fromEntries(DECOR.map(x=>[x.id,x]));
const avatars=Object.fromEntries(AVATARS.map(x=>[x.id,x]));
const houses=Object.fromEntries(HOUSES.map(x=>[x.id,x]));
const pets=Object.fromEntries(PETS.map(x=>[x.id,x]));
const sets=Object.fromEntries(SETS.map(x=>[x.id,x]));
const num=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(999999999,Math.trunc(Number(n)))):0;
function ensure(save){
 if(!save.homestead||typeof save.homestead!=='object'||Array.isArray(save.homestead))save.homestead={};
 const h=save.homestead;
 if(!h.purchases||typeof h.purchases!=='object'||Array.isArray(h.purchases))h.purchases={};
 if(!h.placed||typeof h.placed!=='object'||Array.isArray(h.placed))h.placed={};
 if(!h.highScores||typeof h.highScores!=='object'||Array.isArray(h.highScores))h.highScores={};
 if(!h.houses||typeof h.houses!=='object'||Array.isArray(h.houses))h.houses={};
 const built={cottage:true};
 for(const house of HOUSES.slice(1))if(h.houses[house.id]===true&&cleared(save,house.level))built[house.id]=true;
 h.houses=built;
 if(!Object.prototype.hasOwnProperty.call(houses,h.house)||h.houses[h.house]!==true)h.house='cottage';
 if(!pets[h.pet]||!petOwned(save,h.pet))h.pet='squirrel';
 const prior=h.placed;h.placed={};const used=new Set();
 for(let i=0;i<TOTAL_PLOTS;i++){
  const id=prior[i];
  if(Object.prototype.hasOwnProperty.call(decors,id)&&zoneUnlocked(save,zoneForSlot(i)?.id)&&!used.has(id)&&owned(save,id)) {h.placed[i]=id;used.add(id);}
 }
 for(const [key,value] of Object.entries(h.highScores)){
  const n=Number(key);
  if(!Number.isInteger(n)||n<1||n>500||num(value)===0)delete h.highScores[key];
  else h.highScores[key]=num(value);
 }
 if(!avatars[h.avatar]||!avatarOwned(save,h.avatar))h.avatar='squire';
 return h;
}
function cleared(save,level){return level===0||(Number.isInteger(level)&&level>=1&&level<=500&&num(save.stars?.[level])>0);}
function zoneForSlot(index){return ZONES.find(z=>Number.isInteger(index)&&index>=z.start&&index<z.start+z.count)||null;}
function zoneUnlocked(save,id){const z=ZONES.find(z=>z.id===id);return !!z&&cleared(save,z.level);}
function petOwned(save,id){const p=pets[id];return Object.prototype.hasOwnProperty.call(pets,id)&&!!p&&cleared(save,p.level);}
function setProgress(save){return SETS.map(set=>({id:set.id,name:set.name,icon:set.icon,reward:set.reward,have:set.items.filter(id=>owned(save,id)).length,total:set.items.length,complete:set.items.every(id=>owned(save,id))}));}
function owned(save,id){const item=decors[id];return Object.prototype.hasOwnProperty.call(decors,id)&&!!item&&(item.premium?save.homestead?.purchases?.[item.premium]===true:item.set?!!sets[item.set]&&sets[item.set].items.every(required=>owned(save,required)):cleared(save,item.level));}
function avatarOwned(save,id){const a=avatars[id];return !!a&&(a.premium?save.homestead?.purchases?.[a.premium]===true:cleared(save,a.level));}
function stats(save){
 let wins=0,stars=0,threeStars=0;
 for(const [level,raw] of Object.entries(save.stars||{})){
  const n=Number(level),count=Math.min(3,num(raw));
  if(Number.isInteger(n)&&n>=1&&n<=500&&count){wins++;stars+=count;if(count===3)threeStars++;}
 }
 const scores=save.homestead?.highScores||{};
 let bestScore=0,scoreTotal=0,bestLevel=0;
 for(const [level,raw] of Object.entries(scores)){
  if(!Number.isInteger(Number(level))||Number(level)<1||Number(level)>500)continue;
  const value=num(raw);
  scoreTotal+=value;
  if(value>bestScore){bestScore=value;bestLevel=Number(level);}
 }
 const collections=setProgress(save),setCount=collections.filter(x=>x.complete).length;
 const petCount=PETS.filter(p=>petOwned(save,p.id)).length;
 const zones=ZONES.filter(z=>zoneUnlocked(save,z.id)).length;
 const achievements=ACHIEVEMENTS.filter(a=>({wins,stars,threeStars,score:bestScore,sets:setCount,pets:petCount,zones})[a.kind]>=a.need);
 const tier=wins>=500?'Legendary Nutlord':wins>=400?'Royal Magnate':wins>=200?'Estate Baron':wins>=100?'Nutwood Noble':wins>=50?'Acorn Entrepreneur':wins>=10?'Respectable Landowner':'New Property Owner';
 return {wins,stars,threeStars,bestScore,bestLevel,scoreTotal,achievements,tier,decorOwned:DECOR.filter(d=>owned(save,d.id)).length,setCount,collections,petCount,zones};
}
function place(save,id,slot){
 ensure(save);const n=Number(slot);
 if(!Number.isInteger(n)||n<0||n>=TOTAL_PLOTS||!zoneUnlocked(save,zoneForSlot(n)?.id))return false;
 if(!owned(save,id))return false;
 const p=save.homestead.placed;
 for(const key of Object.keys(p))if(p[key]===id)delete p[key];
 p[n]=id;return true;
}
function remove(save,slot){ensure(save);const n=Number(slot);if(!Number.isInteger(n)||n<0||n>=TOTAL_PLOTS||!zoneUnlocked(save,zoneForSlot(n)?.id)||!save.homestead.placed[n])return false;delete save.homestead.placed[n];return true;}
function equip(save,id){ensure(save);if(!avatarOwned(save,id))return false;save.homestead.avatar=id;return true;}
function equipPet(save,id){ensure(save);if(!petOwned(save,id))return false;save.homestead.pet=id;return true;}
function buildHouse(save,id){
 ensure(save);const house=houses[id];
 if(!Object.prototype.hasOwnProperty.call(houses,id)||!house)return {valid:false,reason:'unknown'};
 if(!cleared(save,house.level))return {valid:false,reason:'level',level:house.level};
 const newlyBuilt=save.homestead.houses[id]!==true;
 if(newlyBuilt){
  const balance=num(save.coins);
  if(balance<house.cost)return {valid:false,reason:'coins',short:house.cost-balance};
  save.coins=balance-house.cost;save.homestead.houses[id]=true;
 }
 save.homestead.house=id;return {valid:true,spent:newlyBuilt?house.cost:0};
}
function prestigePlate(save){
 const status=stats(save),h=save.homestead||{};
 const avatar=avatars[h.avatar]&&avatarOwned(save,h.avatar)?avatars[h.avatar]:AVATARS[0];
 const house=Object.prototype.hasOwnProperty.call(houses,h.house)&&h.houses?.[h.house]===true?houses[h.house]:HOUSES[0];
 const pet=pets[h.pet]&&petOwned(save,h.pet)?pets[h.pet]:PETS[0];
 return [
  '🏡 NUTVALE HOMESTEAD · NUTBUSTER',
  status.tier+' · '+house.icon+' '+house.name,
  avatar.icon+' '+avatar.name+' · '+pet.icon+' '+pet.name,
  '🏆 '+status.wins+'/500 levels · ⭐ '+status.stars+' stars',
  '🎖 '+status.achievements.length+'/'+ACHIEVEMENTS.length+' awards · 🧩 '+status.setCount+'/'+SETS.length+' sets',
  '📈 Personal best: '+status.bestScore.toLocaleString('en-US'),
  'Get NUTBUSTER: https://github.com/mrcalzon02/NUTBUSTER-R/releases'
 ].join('\n');
}
function purchase(save,id){ensure(save);if(id!=='royal-estate')return false;save.homestead.purchases[id]=true;return true;}
function recordWin(save,level,score){
 ensure(save);if(!Number.isInteger(level)||level<1||level>500||!cleared(save,level))return false;
 const old=num(save.homestead.highScores[level]),now=num(score);
 if(now<=old)return false;save.homestead.highScores[level]=now;return true;
}
const api={SLOTS,TOTAL_PLOTS,ZONES,HOUSES,PETS,SETS,DECOR,AVATARS,ACHIEVEMENTS,ensure,owned,avatarOwned,petOwned,zoneForSlot,zoneUnlocked,setProgress,stats,place,remove,equip,equipPet,buildHouse,prestigePlate,purchase,recordWin};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutHomestead=api;
})(typeof window!=='undefined'?window:globalThis);
