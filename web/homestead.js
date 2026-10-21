/* Nutvale Homestead: offline, earned collectibles, cosmetic ownership and placement.
   Never calls a network, store SDK, clock, or billing provider. */
(function(root){
'use strict';
const SLOTS=12;
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
 {id:'royal-throne',name:'Diamond Throne',icon:'🪑',premium:'royal-estate',group:'Premium'}
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
 {id:'score-100k',name:'High-Score Mogul',icon:'💰',kind:'score',need:100000}
]);
const decors=Object.fromEntries(DECOR.map(x=>[x.id,x]));
const avatars=Object.fromEntries(AVATARS.map(x=>[x.id,x]));
const num=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(999999999,Math.trunc(Number(n)))):0;
function ensure(save){
 if(!save.homestead||typeof save.homestead!=='object'||Array.isArray(save.homestead))save.homestead={};
 const h=save.homestead;
 if(!h.purchases||typeof h.purchases!=='object'||Array.isArray(h.purchases))h.purchases={};
 if(!h.placed||typeof h.placed!=='object'||Array.isArray(h.placed))h.placed={};
 if(!h.highScores||typeof h.highScores!=='object'||Array.isArray(h.highScores))h.highScores={};
 const prior=h.placed;h.placed={};const used=new Set();
 for(let i=0;i<SLOTS;i++){
  const id=prior[i];
  if(decors[id]&&!used.has(id)&&owned(save,id)) {h.placed[i]=id;used.add(id);}
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
function owned(save,id){const item=decors[id];return !!item&&(item.premium?save.homestead?.purchases?.[item.premium]===true:cleared(save,item.level));}
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
 const achievements=ACHIEVEMENTS.filter(a=>({wins,stars,threeStars,score:bestScore})[a.kind]>=a.need);
 const tier=wins>=500?'Legendary Nutlord':wins>=400?'Royal Magnate':wins>=200?'Estate Baron':wins>=100?'Nutwood Noble':wins>=50?'Acorn Entrepreneur':wins>=10?'Respectable Landowner':'New Property Owner';
 return {wins,stars,threeStars,bestScore,bestLevel,scoreTotal,achievements,tier,decorOwned:DECOR.filter(d=>owned(save,d.id)).length};
}
function place(save,id,slot){
 ensure(save);const n=Number(slot);
 if(!Number.isInteger(n)||n<0||n>=SLOTS)return false;
 if(!owned(save,id))return false;
 const p=save.homestead.placed;
 for(const key of Object.keys(p))if(p[key]===id)delete p[key];
 p[n]=id;return true;
}
function remove(save,slot){ensure(save);const n=Number(slot);if(!Number.isInteger(n)||n<0||n>=SLOTS||!save.homestead.placed[n])return false;delete save.homestead.placed[n];return true;}
function equip(save,id){ensure(save);if(!avatarOwned(save,id))return false;save.homestead.avatar=id;return true;}
function purchase(save,id){ensure(save);if(id!=='royal-estate')return false;save.homestead.purchases[id]=true;return true;}
function recordWin(save,level,score){
 ensure(save);if(!Number.isInteger(level)||level<1||level>500||!cleared(save,level))return false;
 const old=num(save.homestead.highScores[level]),now=num(score);
 if(now<=old)return false;save.homestead.highScores[level]=now;return true;
}
const api={SLOTS,DECOR,AVATARS,ACHIEVEMENTS,ensure,owned,avatarOwned,stats,place,remove,equip,purchase,recordWin};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutHomestead=api;
})(typeof window!=='undefined'?window:globalThis);
