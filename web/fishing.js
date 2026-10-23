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
 {id:'leviathan',name:'Nutvale Leviathan',icon:'🐉',value:800,weight:10,difficulty:9},
 {id:"fish-set01-azure-darter",name:"Azure Darter",icon:"🐟",value:28,difficulty:1,habitat:"river",rarity:"common",art:"art/fishing/species/v2/fish-set01-azure-darter.png"},
 {id:"fish-set01-copper-fin",name:"Copper Fin",icon:"🐠",value:49,difficulty:2,habitat:"pond",rarity:"common",art:"art/fishing/species/v2/fish-set01-copper-fin.png"},
 {id:"fish-set01-ribbon-koi",name:"Ribbon Koi",icon:"🐠",value:84,difficulty:3,habitat:"pond",rarity:"uncommon",art:"art/fishing/species/v2/fish-set01-ribbon-koi.png"},
 {id:"fish-set01-moss-trout",name:"Moss Trout",icon:"🐟",value:133,difficulty:4,habitat:"river",rarity:"uncommon",art:"art/fishing/species/v2/fish-set01-moss-trout.png"},
 {id:"fish-set01-constellation-gar",name:"Constellation Gar",icon:"🐟",value:273,difficulty:6,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set01-constellation-gar.png"},
 {id:"fish-set01-sunline-perch",name:"Sunline Perch",icon:"🐠",value:28,difficulty:1,habitat:"pond",rarity:"common",art:"art/fishing/species/v2/fish-set01-sunline-perch.png"},
 {id:"fish-set01-sapphire-catfish",name:"Sapphire Catfish",icon:"🐟",value:84,difficulty:3,habitat:"arcane",rarity:"uncommon",art:"art/fishing/species/v2/fish-set01-sapphire-catfish.png"},
 {id:"fish-set01-amethyst-snapper",name:"Amethyst Snapper",icon:"🐟",value:133,difficulty:4,habitat:"arcane",rarity:"uncommon",art:"art/fishing/species/v2/fish-set01-amethyst-snapper.png"},
 {id:"fish-set02-gilded-ridge",name:"Gilded Ridge",icon:"🐠",value:32,difficulty:1,habitat:"pond",rarity:"common",art:"art/fishing/species/v2/fish-set02-gilded-ridge.png"},
 {id:"fish-set02-cobalt-whisker",name:"Cobalt Whisker",icon:"🐟",value:53,difficulty:2,habitat:"deep",rarity:"common",art:"art/fishing/species/v2/fish-set02-cobalt-whisker.png"},
 {id:"fish-set02-rose-current",name:"Rose Current",icon:"🐟",value:88,difficulty:3,habitat:"river",rarity:"uncommon",art:"art/fishing/species/v2/fish-set02-rose-current.png"},
 {id:"fish-set02-comet-guppy",name:"Comet Guppy",icon:"🐟",value:200,difficulty:5,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set02-comet-guppy.png"},
 {id:"fish-set02-sawtooth-pike",name:"Sawtooth Pike",icon:"🐟",value:200,difficulty:5,habitat:"river",rarity:"rare",art:"art/fishing/species/v2/fish-set02-sawtooth-pike.png"},
 {id:"fish-set02-blue-streak",name:"Blue Streak",icon:"🐟",value:53,difficulty:2,habitat:"river",rarity:"common",art:"art/fishing/species/v2/fish-set02-blue-streak.png"},
 {id:"fish-set03-emerald-paddlefish",name:"Emerald Paddlefish",icon:"🐟",value:57,difficulty:2,habitat:"deep",rarity:"common",art:"art/fishing/species/v2/fish-set03-emerald-paddlefish.png"},
 {id:"fish-set03-candyline-minnow",name:"Candyline Minnow",icon:"🐟",value:92,difficulty:3,habitat:"river",rarity:"uncommon",art:"art/fishing/species/v2/fish-set03-candyline-minnow.png"},
 {id:"fish-set03-tiger-jaw",name:"Tiger Jaw",icon:"🐟",value:141,difficulty:4,habitat:"deep",rarity:"uncommon",art:"art/fishing/species/v2/fish-set03-tiger-jaw.png"},
 {id:"fish-set03-sakura-koi",name:"Sakura Koi",icon:"🐠",value:204,difficulty:5,habitat:"pond",rarity:"rare",art:"art/fishing/species/v2/fish-set03-sakura-koi.png"},
 {id:"fish-set03-frost-darter",name:"Frost Darter",icon:"🐟",value:372,difficulty:7,habitat:"arcane",rarity:"epic",art:"art/fishing/species/v2/fish-set03-frost-darter.png"},
 {id:"fish-set03-violet-catfish",name:"Violet Catfish",icon:"🐟",value:92,difficulty:3,habitat:"arcane",rarity:"uncommon",art:"art/fishing/species/v2/fish-set03-violet-catfish.png"},
 {id:"fish-set03-teal-disc",name:"Teal Disc",icon:"🐠",value:92,difficulty:3,habitat:"pond",rarity:"uncommon",art:"art/fishing/species/v2/fish-set03-teal-disc.png"},
 {id:"fish-set03-amber-whisker",name:"Amber Whisker",icon:"🐟",value:141,difficulty:4,habitat:"deep",rarity:"uncommon",art:"art/fishing/species/v2/fish-set03-amber-whisker.png"},
 {id:"fish-set04-opal-runner",name:"Opal Runner",icon:"🐟",value:61,difficulty:2,habitat:"river",rarity:"common",art:"art/fishing/species/v2/fish-set04-opal-runner.png"},
 {id:"fish-set04-sunburst-discus",name:"Sunburst Discus",icon:"🐟",value:145,difficulty:4,habitat:"arcane",rarity:"uncommon",art:"art/fishing/species/v2/fish-set04-sunburst-discus.png"},
 {id:"fish-set04-scarlet-trout",name:"Scarlet Trout",icon:"🐟",value:145,difficulty:4,habitat:"river",rarity:"uncommon",art:"art/fishing/species/v2/fish-set04-scarlet-trout.png"},
 {id:"fish-set04-lumen-eel",name:"Lumen Eel",icon:"🐟",value:285,difficulty:6,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set04-lumen-eel.png"},
 {id:"fish-set04-golden-pumpkinfish",name:"Golden Pumpkinfish",icon:"🐠",value:285,difficulty:6,habitat:"pond",rarity:"rare",art:"art/fishing/species/v2/fish-set04-golden-pumpkinfish.png"},
 {id:"fish-set04-peacock-tail",name:"Peacock Tail",icon:"🐠",value:61,difficulty:2,habitat:"pond",rarity:"common",art:"art/fishing/species/v2/fish-set04-peacock-tail.png"},
 {id:"fish-set04-speckle-cat",name:"Speckle Cat",icon:"🐟",value:96,difficulty:3,habitat:"deep",rarity:"uncommon",art:"art/fishing/species/v2/fish-set04-speckle-cat.png"},
 {id:"fish-set04-jade-riverfish",name:"Jade Riverfish",icon:"🐟",value:145,difficulty:4,habitat:"river",rarity:"uncommon",art:"art/fishing/species/v2/fish-set04-jade-riverfish.png"},
 {id:"fish-set05-midnight-darter",name:"Midnight Darter",icon:"🐟",value:100,difficulty:3,habitat:"river",rarity:"uncommon",art:"art/fishing/species/v2/fish-set05-midnight-darter.png"},
 {id:"fish-set05-vermilion-fanfish",name:"Vermilion Fanfish",icon:"🐠",value:149,difficulty:4,habitat:"pond",rarity:"uncommon",art:"art/fishing/species/v2/fish-set05-vermilion-fanfish.png"},
 {id:"fish-set05-leopard-whisker",name:"Leopard Whisker",icon:"🐟",value:212,difficulty:5,habitat:"deep",rarity:"rare",art:"art/fishing/species/v2/fish-set05-leopard-whisker.png"},
 {id:"fish-set05-emerald-bass",name:"Emerald Bass",icon:"🐠",value:289,difficulty:6,habitat:"pond",rarity:"rare",art:"art/fishing/species/v2/fish-set05-emerald-bass.png"},
 {id:"fish-set05-pearl-shiner",name:"Pearl Shiner",icon:"🐟",value:380,difficulty:7,habitat:"river",rarity:"epic",art:"art/fishing/species/v2/fish-set05-pearl-shiner.png"},
 {id:"fish-set05-rusty-catfish",name:"Rusty Catfish",icon:"🐟",value:100,difficulty:3,habitat:"deep",rarity:"uncommon",art:"art/fishing/species/v2/fish-set05-rusty-catfish.png"},
 {id:"fish-set05-prismatic-gourami",name:"Prismatic Gourami",icon:"🐟",value:212,difficulty:5,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set05-prismatic-gourami.png"},
 {id:"fish-set05-sunspot-trout",name:"Sunspot Trout",icon:"🐟",value:212,difficulty:5,habitat:"river",rarity:"rare",art:"art/fishing/species/v2/fish-set05-sunspot-trout.png"},
 {id:"fish-set06-verdigris-perch",name:"Verdigris Perch",icon:"🐠",value:104,difficulty:3,habitat:"pond",rarity:"uncommon",art:"art/fishing/species/v2/fish-set06-verdigris-perch.png"},
 {id:"fish-set06-royal-silkfin",name:"Royal Silkfin",icon:"🐟",value:216,difficulty:5,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set06-royal-silkfin.png"},
 {id:"fish-set06-crystal-flash",name:"Crystal Flash",icon:"🐟",value:293,difficulty:6,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set06-crystal-flash.png"},
 {id:"fish-set06-ember-maw",name:"Ember Maw",icon:"🐠",value:384,difficulty:7,habitat:"pond",rarity:"epic",art:"art/fishing/species/v2/fish-set06-ember-maw.png"},
 {id:"fish-set06-painted-trout",name:"Painted Trout",icon:"🐟",value:153,difficulty:4,habitat:"river",rarity:"uncommon",art:"art/fishing/species/v2/fish-set06-painted-trout.png"},
 {id:"fish-set06-lunar-longfin",name:"Lunar Longfin",icon:"🐟",value:293,difficulty:6,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set06-lunar-longfin.png"},
 {id:"fish-set07-blazing-crown",name:"Blazing Crown",icon:"🐠",value:157,difficulty:4,habitat:"pond",rarity:"uncommon",art:"art/fishing/species/v2/fish-set07-blazing-crown.png"},
 {id:"fish-set07-banded-catfish",name:"Banded Catfish",icon:"🐟",value:220,difficulty:5,habitat:"deep",rarity:"rare",art:"art/fishing/species/v2/fish-set07-banded-catfish.png"},
 {id:"fish-set07-silver-courier",name:"Silver Courier",icon:"🐟",value:297,difficulty:6,habitat:"river",rarity:"rare",art:"art/fishing/species/v2/fish-set07-silver-courier.png"},
 {id:"fish-set07-blush-trout",name:"Blush Trout",icon:"🐟",value:388,difficulty:7,habitat:"river",rarity:"epic",art:"art/fishing/species/v2/fish-set07-blush-trout.png"},
 {id:"fish-set07-emerald-drum",name:"Emerald Drum",icon:"🐠",value:493,difficulty:8,habitat:"pond",rarity:"epic",art:"art/fishing/species/v2/fish-set07-emerald-drum.png"},
 {id:"fish-set07-gold-ribbon-koi",name:"Gold Ribbon Koi",icon:"🐠",value:157,difficulty:4,habitat:"pond",rarity:"uncommon",art:"art/fishing/species/v2/fish-set07-gold-ribbon-koi.png"},
 {id:"fish-set07-violet-whisker",name:"Violet Whisker",icon:"🐟",value:297,difficulty:6,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set07-violet-whisker.png"},
 {id:"fish-set07-rose-reef",name:"Rose Reef",icon:"🐠",value:297,difficulty:6,habitat:"pond",rarity:"rare",art:"art/fishing/species/v2/fish-set07-rose-reef.png"},
 {id:"fish-set08-sunset-koi",name:"Sunset Koi",icon:"🐠",value:161,difficulty:4,habitat:"pond",rarity:"uncommon",art:"art/fishing/species/v2/fish-set08-sunset-koi.png"},
 {id:"fish-set08-diamond-puffer",name:"Diamond Puffer",icon:"🐟",value:301,difficulty:6,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set08-diamond-puffer.png"},
 {id:"fish-set08-green-reef-bass",name:"Green Reef Bass",icon:"🐠",value:301,difficulty:6,habitat:"pond",rarity:"rare",art:"art/fishing/species/v2/fish-set08-green-reef-bass.png"},
 {id:"fish-set08-scarlet-stripe",name:"Scarlet Stripe",icon:"🐠",value:392,difficulty:7,habitat:"pond",rarity:"epic",art:"art/fishing/species/v2/fish-set08-scarlet-stripe.png"},
 {id:"fish-set08-copper-crown",name:"Copper Crown",icon:"🐠",value:497,difficulty:8,habitat:"pond",rarity:"epic",art:"art/fishing/species/v2/fish-set08-copper-crown.png"},
 {id:"fish-set08-crystal-runner",name:"Crystal Runner",icon:"🐟",value:224,difficulty:5,habitat:"arcane",rarity:"rare",art:"art/fishing/species/v2/fish-set08-crystal-runner.png"},
 {id:"fish-set08-jade-longnose",name:"Jade Longnose",icon:"🐠",value:224,difficulty:5,habitat:"pond",rarity:"rare",art:"art/fishing/species/v2/fish-set08-jade-longnose.png"},
 {id:"fish-set08-royal-ink-koi",name:"Royal Ink Koi",icon:"🐟",value:392,difficulty:7,habitat:"arcane",rarity:"epic",art:"art/fishing/species/v2/fish-set08-royal-ink-koi.png"},
 {id:"fish-set09-dandelion-bluegill",name:"Dandelion Bluegill",icon:"🐠",value:228,difficulty:5,habitat:"pond",rarity:"rare",art:"art/fishing/species/v2/fish-set09-dandelion-bluegill.png"},
 {id:"fish-set09-ruby-shiner",name:"Ruby Shiner",icon:"🐟",value:305,difficulty:6,habitat:"river",rarity:"rare",art:"art/fishing/species/v2/fish-set09-ruby-shiner.png"},
 {id:"fish-set09-tin-fin-minnow",name:"Tin Fin Minnow",icon:"🐟",value:396,difficulty:7,habitat:"river",rarity:"epic",art:"art/fishing/species/v2/fish-set09-tin-fin-minnow.png"},
 {id:"fish-set09-sunset-paddle",name:"Sunset Paddle",icon:"🐟",value:501,difficulty:8,habitat:"deep",rarity:"epic",art:"art/fishing/species/v2/fish-set09-sunset-paddle.png"},
 {id:"fish-set09-ocean-crown",name:"Ocean Crown",icon:"🐠",value:620,difficulty:9,habitat:"pond",rarity:"legendary",art:"art/fishing/species/v2/fish-set09-ocean-crown.png"},
 {id:"fish-set09-ember-spotted-cat",name:"Ember Spotted Cat",icon:"🐟",value:228,difficulty:5,habitat:"deep",rarity:"rare",art:"art/fishing/species/v2/fish-set09-ember-spotted-cat.png"},
 {id:"fish-set09-violet-disc",name:"Violet Disc",icon:"🐟",value:396,difficulty:7,habitat:"arcane",rarity:"epic",art:"art/fishing/species/v2/fish-set09-violet-disc.png"},
 {id:"fish-set09-royal-koi-tail",name:"Royal Koi Tail",icon:"🐟",value:501,difficulty:8,habitat:"arcane",rarity:"epic",art:"art/fishing/species/v2/fish-set09-royal-koi-tail.png"}
].map(spec=>{
 // Distinct maximum lengths per species; classic species use individually
 // chosen bounds, and added fish get stable differences by ID/difficulty.
 const classics={minnow:32,bluegill:48,perch:55,carp:125,trout:110,bass:95,
  catfish:190,koi:115,puffer:65,eel:225,sturgeon:475,leviathan:1300};
 let hash=2166136261;
 for(let i=0;i<spec.id.length;i++)hash=Math.imul(hash^spec.id.charCodeAt(i),16777619)>>>0;
 const cap=classics[spec.id]||(28+spec.difficulty*spec.difficulty*6+(hash%30));
 return Object.freeze({...spec,maxSize:cap});
}));
// The wharf shop tier determines which real, playable bait species it stocks.
// Existing three SKUs and their original quality/recipe values stay unchanged.
const BAITS=Object.freeze([
 {id:'worm',name:'Honest Worm',icon:'🪱',level:0,quality:0,price:25,habitat:null,description:'Classic all-water bait'},
 {id:'glitter',name:'Glitter Grub',icon:'✨',level:1,quality:2,price:85,habitat:null,description:'Sparkling bait for harder catches'},
 {id:'pond-mash',name:'Pond Mash',icon:'🌿',level:1,quality:1,price:55,habitat:'pond',description:'Favours pond species'},
 {id:'royal',name:'Royal Roe',icon:'👑',level:2,quality:4,price:180,habitat:null,description:'Royal bait with high-rarity appeal'},
 {id:'river-cricket',name:'River Cricket',icon:'🦗',level:2,quality:3,price:110,habitat:'river',description:'Favours river species'},
 {id:'glow-shrimp',name:'Glow Shrimp',icon:'🦐',level:3,quality:5,price:210,habitat:'arcane',description:'Favours arcane species'},
 {id:'deep-squid',name:'Deepwater Squid',icon:'🦑',level:4,quality:6,price:290,habitat:'deep',description:'Favours deepwater catches'},
 {id:'storm-lure',name:'Storm Lure',icon:'⚡',level:4,quality:7,price:350,habitat:'arcane',description:'Electric attraction for arcane fish'},
 {id:'astral-roe',name:'Astral Roe',icon:'🌌',level:5,quality:8,price:450,habitat:'arcane',description:'Very high-tier arcane lure'},
 {id:'leviathan-lure',name:'Leviathan Lure',icon:'🐙',level:5,quality:9,price:520,habitat:'deep',description:'Deepwater trophy bait'}
 ].map(x=>Object.freeze(x)));
// Canonical 2 / 3 / 4 Honest Worm exchange values; change only after review.
const BOOSTER_BAIT=Object.freeze({hammer:2,extra:2,row:2,shuffle:2,column:3,blast:3,cross:3,color:3,drill:4,unlock:4});
const BAIT_RECIPES=Object.freeze({
 glitter:Object.freeze({tier:1,worms:1,dollars:35}),
 royal:Object.freeze({tier:2,worms:1,dollars:100})
});
function exchangeQuote(save,booster,progression,now=Date.now()){
 const n=ensure(save,now),rate=BOOSTER_BAIT[booster];
 if(!Number.isInteger(rate))return {valid:false,reason:'booster'};
 const earned=!!(progression&&typeof progression.unlocked==='function'&&progression.unlocked(save,booster));
 const owned=progression&&typeof progression.count==='function'?progression.count(save,booster):0;
 const room=n.baits.worm<=999999-rate;
 return {valid:!!(earned&&owned>=1&&room),booster,owned:Math.max(0,owned||0),earned,rate,room,
  reason:!earned?'locked':owned<1?'stock':!room?'limit':null};
}
function exchangeBalance(save,progression,now=Date.now()){
 const n=ensure(save,now),rates=Object.keys(BOOSTER_BAIT).map(id=>exchangeQuote(save,id,progression,now));
 return {rates,stocked:rates.reduce((sum,r)=>sum+(r.earned?r.owned:0),0),
  potentialWorms:rates.reduce((sum,r)=>sum+(r.earned?r.owned*r.rate:0),0),
  currentWorms:n.baits.worm,freeDaily:DAILY,craftTier:n.baitTier,dollars:n.dollars};
}
const DAILY=6;
const WHARF_AD_REWARD=Object.freeze({bait:2,dollars:100});
const limit=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,999999999):0;
const specimenId=new Map(FISH.map(x=>[x.id,x]));
// Records are earned on a successful catch, not when fish are kept. The
// collection is independent from aquarium capacity and persists after sales.
function trophyStatus(save,now=Date.now()){
 const n=ensure(save,now),entries=FISH.filter(spec=>n.trophyRecords[spec.id]);
 return {collected:entries.length,total:FISH.length,
  totalCatches:entries.reduce((count,spec)=>count+n.trophyRecords[spec.id].catches,0),
  records:entries.map(spec=>({species:spec,...n.trophyRecords[spec.id]}))};
}
function recordCatch(n,spec,size,now){
 const old=n.trophyRecords[spec.id],newRecord=!old||size>old.size,day=localDay(now);
 const entry=old?{...old}:{size:0,catches:0,firstCaught:day,lastCaught:day,recordDate:day};
 entry.catches=Math.min(999999999,entry.catches+1);
 if(!entry.firstCaught)entry.firstCaught=day;
 entry.lastCaught=day;
 if(newRecord){entry.size=size;entry.recordDate=day;}
 n.trophyRecords[spec.id]=entry;
 return {newSpecies:!old,newRecord,previous:old?.size||0,size,maxSize:spec.maxSize,catches:entry.catches};
}
function generatedSize(spec,seed){
 const mixed=(Math.imul((seed>>>0)^0xa511e9b3,1664525)+1013904223)>>>0;
 return Math.max(1,Math.min(spec.maxSize,Math.round(spec.maxSize*(.26+.74*mixed/4294967295))));
}

// The estate aquarium is a collectible display, independent from the backyard.
// Discovery is permanent within this save, even when the fish is sold or released.
const STAMPS=Object.freeze([
 ['coral','Coral Garden','🪸','minnow'],['seagrass','Seagrass','🌿','bluegill'],
 ['shell','Pearl Shell','🐚','perch'],['stones','River Pebbles','🪨','carp'],
 ['bubbles','Bubble Column','🫧','trout'],['anchor','Lost Anchor','⚓','bass'],
 ['driftwood','Driftwood','🪵','catfish'],['pagoda','Koi Pagoda','⛩️','koi'],
 ['starfish','Sea Star','⭐','puffer'],['lantern','Glow Lantern','🏮','eel'],
 ['relic','Sunken Relic','🏺','sturgeon'],['wreck','Shipwreck','🚢','leviathan'],
 ['blue-reeds','Blue Reeds','🌾','fish-set01-azure-darter'],
 ['sea-flower','Sea Flower','🌺','fish-set01-copper-fin'],
 ['royal-kelp','Royal Kelp','🌱','fish-set01-ribbon-koi'],
 ['moss-rock','Moss Rock','🪴','fish-set01-moss-trout'],
 ['starlight','Starlight','✨','fish-set01-constellation-gar'],
 ['sunflower','Sea Sun','🌻','fish-set01-sunline-perch']
 ].map(([id,name,icon,fish])=>Object.freeze({id,name,icon,fish})));
const STAMP_BY_ID=new Map(STAMPS.map(x=>[x.id,x]));
const BACKGROUNDS=Object.freeze([
 {id:'lagoon',name:'Lagoon Glass',need:[]},
 {id:'river',name:'Riverbed',need:['trout','fish-set01-azure-darter','fish-set01-moss-trout']},
 {id:'reef',name:'Coral Reef',need:['koi','puffer','fish-set01-ribbon-koi']},
 {id:'deep',name:'Midnight Depths',need:['catfish','sturgeon','fish-set01-sapphire-catfish']},
 {id:'arcane',name:'Starwater',need:['eel','leviathan','fish-set01-constellation-gar']},
 // These six source-approved scenes have open central water for moving fish
 // and user-placed decorations; no fish or stamp is baked into the image.
 {id:'plain-kelp-canyon',name:'Sunlit Kelp Canyon',need:["bluegill"],art:'art/aquarium/backgrounds/v1/plain-kelp-canyon.png'},
 {id:'plain-kelp-lagoon',name:'Open Kelp Lagoon',need:[],art:'art/aquarium/backgrounds/v1/plain-kelp-lagoon.png'},
 {id:'plain-ruins',name:'Quiet Ruins',need:["perch","carp"],art:'art/aquarium/backgrounds/v1/plain-ruins.png'},
 {id:'plain-kelp-forest',name:'Gentle Kelp Forest',need:["trout"],art:'art/aquarium/backgrounds/v1/plain-kelp-forest.png'},
 {id:'plain-coral',name:'Coral Window',need:["koi","puffer"],art:'art/aquarium/backgrounds/v1/plain-coral.png'},
 {id:'plain-seafloor',name:'Open Seafloor',need:[],art:'art/aquarium/backgrounds/v1/plain-seafloor.png'}
 ].map(x=>Object.freeze({...x,need:Object.freeze(x.need)})));
function stampCapacity(n){return 3+2*n.tank;}
function stampUnlocked(n,id){const spec=STAMP_BY_ID.get(id);return !!spec&&n.aquarium.discovered.includes(spec.fish);}
function backgroundUnlocked(n,id){const spec=BACKGROUNDS.find(x=>x.id===id);return !!spec&&(spec.need.length===0||spec.need.some(fish=>n.aquarium.discovered.includes(fish)));}
function aquariumState(n){
 if(!n.aquarium||typeof n.aquarium!=='object'||Array.isArray(n.aquarium))n.aquarium={};
 const a=n.aquarium;
 const found=Array.isArray(a.discovered)?a.discovered:[];
 const saved=Array.isArray(n.fish)?n.fish.map(x=>x?.id):[];
 a.discovered=[...new Set([...found,...saved].filter(id=>specimenId.has(id)))];
 if(!backgroundUnlocked(n,a.background))a.background='plain-seafloor';
 const used=new Set;
 a.stamps=(Array.isArray(a.stamps)?a.stamps:[]).filter(entry=>{
  if(!entry||!stampUnlocked(n,entry.id)||!Number.isFinite(entry.x)||!Number.isFinite(entry.y))return false;
  const key=entry.id+':'+Math.round(entry.x)+':'+Math.round(entry.y);
  if(used.has(key)||used.size>=stampCapacity(n))return false;
  used.add(key);entry.x=Math.max(6,Math.min(94,Math.round(entry.x)));entry.y=Math.max(12,Math.min(84,Math.round(entry.y)));
  return true;
 });
 return a;
}
function placeStamp(save,id,x,y,now=Date.now()){
 const n=ensure(save,now);
 if(!stampUnlocked(n,id))return {valid:false,reason:'locked'};
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>100||y<0||y>100)return {valid:false,reason:'position'};
 if(n.aquarium.stamps.length>=stampCapacity(n))return {valid:false,reason:'full'};
 const entry={id,x:Math.max(6,Math.min(94,Math.round(x))),y:Math.max(12,Math.min(84,Math.round(y)))};
 if(n.aquarium.stamps.some(item=>item.id===entry.id&&Math.abs(item.x-entry.x)<7&&Math.abs(item.y-entry.y)<7))return {valid:false,reason:'overlap'};
 n.aquarium.stamps.push(entry);return {valid:true,entry,slots:stampCapacity(n)};
}
function removeStamp(save,index,now=Date.now()){
 const n=ensure(save,now);
 if(!Number.isInteger(index)||index<0||index>=n.aquarium.stamps.length)return {valid:false,reason:'index'};
 return {valid:true,entry:n.aquarium.stamps.splice(index,1)[0]};
}
function chooseBackground(save,id,now=Date.now()){
 const n=ensure(save,now);
 if(!backgroundUnlocked(n,id))return {valid:false,reason:'locked'};
 n.aquarium.background=id;return {valid:true,id};
}
function moveFish(save,from,to,now=Date.now()){
 const n=ensure(save,now),max=capacity(n);
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=max||to>=max)return {valid:false,reason:'slot'};
 const moving=n.fish.find(f=>f.slot===from);
 if(!moving)return {valid:false,reason:'empty'};
 const other=n.fish.find(f=>f.slot===to);
 if(other)other.slot=from;
 moving.slot=to;
 return {valid:true,from,to,swapped:!!other};
}

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
 n.baitTier=Number.isInteger(n.baitTier)?Math.max(0,Math.min(5,n.baitTier)):0;
 n.wharfTier=Number.isInteger(n.wharfTier)?Math.max(0,Math.min(5,n.wharfTier)):0;
 n.tank=Number.isInteger(n.tank)?Math.max(0,Math.min(10,n.tank)):0;
 if(!n.trophyRecords||typeof n.trophyRecords!=='object'||Array.isArray(n.trophyRecords))n.trophyRecords={};
 for(const [id,raw] of Object.entries(n.trophyRecords)){
  const spec=specimenId.get(id);
  if(!spec||!raw||typeof raw!=='object'||!Number.isInteger(raw.size)||raw.size<1){
   delete n.trophyRecords[id];continue;
  }
  raw.size=Math.min(spec.maxSize,raw.size);
  raw.catches=Number.isInteger(raw.catches)&&raw.catches>0?Math.min(999999999,raw.catches):1;
  for(const k of ['firstCaught','lastCaught','recordDate'])if(typeof raw[k]!=='string')raw[k]=null;
 }
 if(!n.baits||typeof n.baits!=='object'||Array.isArray(n.baits))n.baits={};
 for(const bait of BAITS)n.baits[bait.id]=limit(n.baits[bait.id]);
 if(!Array.isArray(n.fish))n.fish=[];
 n.fish=n.fish.filter(f=>f&&specimenId.has(f.id)&&Number.isInteger(f.size)&&f.size>=1&&f.size<=100&&Number.isInteger(f.value)&&f.value>=1&&f.value<=100000).slice(0,capacity(n));
 // Preserve all older residents and upgrade into explicit independent display slots.
 const claimedSlots=new Set;
 for(const f of n.fish){
  if(!Number.isInteger(f.slot)||f.slot<0||f.slot>=capacity(n)||claimedSlots.has(f.slot)){
   f.slot=Array.from({length:capacity(n)},(_,i)=>i).find(i=>!claimedSlots.has(i));
  }
  claimedSlots.add(f.slot);
 }
 aquariumState(n);
 // For existing early saves, register surviving aquarium and pending fish
 // once, without adding fictitious repeat catches on every render.
 for(const fish of [...n.fish,...(n.pending?[n.pending]:[])]){
  if(specimenId.has(fish.id)&&!n.trophyRecords[fish.id]&&Number.isInteger(fish.size)&&fish.size>0)
   n.trophyRecords[fish.id]={size:Math.min(specimenId.get(fish.id).maxSize,fish.size),catches:1,firstCaught:null,lastCaught:null,recordDate:null};
 }
 if(!n.pending||!specimenId.has(n.pending.id)||!Number.isInteger(n.pending.value)||n.pending.value<1||n.pending.value>100000||!Number.isInteger(n.pending.size)||n.pending.size<1||n.pending.size>100)n.pending=null;
 if(!n.fight||!specimenId.has(n.fight.id)||!Number.isSafeInteger(n.fight.seed)||n.fight.seed<0||n.fight.seed>4294967295||!Number.isInteger(n.fight.turn)||n.fight.turn<0||n.fight.turn>50||!Number.isFinite(n.fight.fish)||!Number.isFinite(n.fight.hook)||!Number.isFinite(n.fight.progress)||!Number.isFinite(n.fight.tension))n.fight=null;
 const today=localDay(now);
 // Grant once on a new local calendar day; a backward clock adjustment never grants bait.
 if(today&&(!n.day||typeof n.day!=='string'||today>n.day)){
  n.day=today;n.baits.worm=Math.min(12+2*n.wharfTier,n.baits.worm+dailyBait(n));
 }
 return n;
}
// Never pay a wharf ad twice on the same day, or after a clock rollback.
function claimWharfAd(save,now=Date.now()){
 const today=localDay(now);if(!today)return {valid:false,reason:'date'};
 const n=ensure(save,now);
 if(typeof n.wharfAdDay==='string'&&today<=n.wharfAdDay)return {valid:false,reason:'claimed'};
 if(n.baits.worm>999999999-WHARF_AD_REWARD.bait)return {valid:false,reason:'bait-limit'};
 n.wharfAdDay=today;n.baits.worm+=WHARF_AD_REWARD.bait;
 const prior=n.dollars;n.dollars=limit(n.dollars+WHARF_AD_REWARD.dollars);
 return {valid:true,bait:WHARF_AD_REWARD.bait,dollars:n.dollars-prior,day:today};
}
function capacity(n){return 4+3*n.tank;}
function dailyBait(n){return DAILY+(n.wharfTier||0);}
function saleBonus(n,value){return Math.floor(value*(n.wharfTier||0)*0.05);}
function nextCost(kind,n){
 const max=kind==='rod'?5:kind==='tank'?10:kind==='bait'?5:kind==='wharf'?5:-1;
 const level=kind==='rod'?n.rod:kind==='tank'?n.tank:kind==='bait'?n.baitTier:kind==='wharf'?n.wharfTier:-1;
 if(max<0||level>=max)return null;
 return kind==='rod'?90+level*160:kind==='tank'?85+level*140:kind==='bait'?120+level*280:200+level*420;
}
function upgrade(save,kind,now=Date.now()){
 const n=ensure(save,now),cost=nextCost(kind,n);
 if(cost===null)return {valid:false,reason:['rod','tank','bait','wharf'].includes(kind)?'max':'unknown'};
 if(n.dollars<cost)return {valid:false,reason:'dollars',short:cost-n.dollars};
 n.dollars-=cost;
 if(kind==='rod')n.rod++;else if(kind==='tank')n.tank++;else if(kind==='bait')n.baitTier++;else n.wharfTier++;
 return {valid:true,cost,kind,level:kind==='rod'?n.rod:kind==='tank'?n.tank:kind==='bait'?n.baitTier:n.wharfTier};
}
function trade(save,booster,progression,now=Date.now()){
 const quote=exchangeQuote(save,booster,progression,now);
 if(!quote.valid)return {valid:false,reason:quote.reason==='limit'?'limit':'booster'};
 const n=ensure(save,now);
 if(typeof progression.spend!=='function'||!progression.spend(save,booster))return {valid:false,reason:'booster'};
 n.baits.worm+=quote.rate;
 return {valid:true,amount:quote.rate,stock:n.baits.worm};
}
function buyBait(save,kind,quantity=1,now=Date.now()){
 const n=ensure(save,now),spec=BAITS.find(x=>x.id===kind);
 if(!spec)return {valid:false,reason:'bait'};
 if(n.baitTier<spec.level)return {valid:false,reason:'locked'};
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>5)return {valid:false,reason:'quantity'};
 if(n.baits[kind]>999999-quantity)return {valid:false,reason:'limit'};
 const cost=spec.price*quantity;
 if(n.dollars<cost)return {valid:false,reason:'dollars',short:cost-n.dollars};
 n.dollars-=cost;n.baits[kind]+=quantity;
 return {valid:true,id:kind,quantity,cost,stock:n.baits[kind]};
}
function craft(save,kind,now=Date.now()){
 const n=ensure(save,now),spec=BAITS.find(x=>x.id===kind),recipe=BAIT_RECIPES[kind];
 if(!spec||!recipe||n.baitTier<recipe.tier)return {valid:false,reason:'locked'};
 if(n.dollars<recipe.dollars||n.baits.worm<recipe.worms)return {valid:false,reason:n.baits.worm<recipe.worms?'worm':'dollars'};
 if(n.baits[spec.id]>=999999)return {valid:false,reason:'limit'};
 n.dollars-=recipe.dollars;n.baits.worm-=recipe.worms;n.baits[spec.id]++;
 return {valid:true,cost:recipe.dollars};
}
function rodModel(n){return ROD_BY_ID.get(n.equippedRod)||ROD_BY_ID.get(STARTER_ROD);}
const HABITAT_AFFINITY=Object.freeze({woodland:['pond'],brass:['river'],gilded:['river'],carbon:['deep'],verdant:['pond','arcane'],coral:['pond','arcane'],industrial:['deep'],'royal-blue':['river','arcane'],pirate:['deep'],glacier:['river','deep'],storm:['arcane','deep'],magma:['deep','arcane'],sovereign:['arcane','pond'],astral:['arcane'],prismatic:['arcane','deep'],confection:['pond','arcane']});
const DIFFICULTY_BANDS=Object.freeze([0,22,18,16,14,10,7,4,2.5,1.2]);
// Keep rarity-band probability mass stable as more fish enter the catalog.
function rodOdds(rodId,quality=0,baitHabitat=null){
 const rod=ROD_BY_ID.get(rodId)||ROD_BY_ID.get(STARTER_ROD);
 const q=Math.max(0,Math.min(9,Number(quality)||0)),counts=Array(10).fill(0);
 for(const fish of FISH)counts[fish.difficulty]++;
 const weights=FISH.map(fish=>(DIFFICULTY_BANDS[fish.difficulty]/counts[fish.difficulty])*Math.pow(1+q*.17,fish.difficulty-1)*(rod.affinity.includes(fish.id)?rod.bias:1)*(HABITAT_AFFINITY[rod.id]?.includes(fish.habitat)?1.6:1)*(baitHabitat&&baitHabitat===fish.habitat?1.9:1));
 const sum=weights.reduce((a,b)=>a+b,0);
 return FISH.map((fish,i)=>({id:fish.id,name:fish.name,probability:weights[i]/sum}));
}
function chooseFish(seed,quality,rodId=STARTER_ROD,baitHabitat=null){
 // Rod preferences and bait quality affect actual seeded probabilities.
 let x=(seed>>>0)^0x9e3779b9;x=(Math.imul(x,1664525)+1013904223)>>>0;
 let roll=x/4294967296;
 for(const entry of rodOdds(rodId,quality,baitHabitat)){
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
 const fish=chooseFish(seed,bait.quality,rod.id,bait.habitat);
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
  const size=generatedSize(species,f.seed),value=Math.round(species.value*(.65+.65*size/species.maxSize));
  const trophy=recordCatch(n,species,size,now);
  n.pending={id:f.id,size,value};n.fight=null;
  if(!n.aquarium.discovered.includes(f.id))n.aquarium.discovered.push(f.id);
  return {valid:true,status:'caught',catch:{...n.pending},trophy};
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
 if(!n.aquarium.discovered.includes(fish.id))n.aquarium.discovered.push(fish.id);
 if(choice==='keep'){
  const claimed=new Set(n.fish.map(f=>f.slot)),slot=Array.from({length:capacity(n)},(_,i)=>i).find(i=>!claimed.has(i));
  n.fish.push({...fish,slot});
 }
 if(choice==='sell')n.dollars=limit(n.dollars+fish.value+saleBonus(n,fish.value));
 n.pending=null;
 return {valid:true,choice,fish:{...fish},dollars:n.dollars};
}
const api={FISH,BAITS,RODS,STAMPS,BACKGROUNDS,trophyStatus,generatedSize,BOOSTER_BAIT,BAIT_RECIPES,buyBait,dailyBait,saleBonus,exchangeQuote,exchangeBalance,DAILY,WHARF_AD_REWARD,localDay,ensure,claimWharfAd,capacity,stampCapacity,stampUnlocked,backgroundUnlocked,placeStamp,removeStamp,chooseBackground,moveFish,nextCost,upgrade,trade,craft,cast,step,resolve,rodModel,rodOdds,chooseFish,buyRod,equipRod,repairRod};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutFishing=api;
})(typeof window!=='undefined'?window:globalThis);
