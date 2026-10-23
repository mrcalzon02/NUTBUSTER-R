/* Nutvale Mines: persistent seeded excavation, equipment, cart, refinery, Writ Office.
 * Campaign II stage combat is NOT enabled here; those stages require separate authoring.
 * Deterministic site/coordinate identity is never derived from page visits.
 */
(function(root){'use strict';
const G=root.NutMiningGear;
if(!G)throw Error('NutMiningGear must load first');
const MAX=999999999;
const MAP=Object.freeze([
 {size:4,odds:[45,40,12,3],cart:10,orePerMetal:4,sale:300},
 {size:5,odds:[50,35,11,4],cart:20,orePerMetal:4,sale:340},
 {size:6,odds:[55,29,11,5],cart:30,orePerMetal:3,sale:380},
 {size:7,odds:[60,25,9,6],cart:45,orePerMetal:3,sale:430},
 {size:8,odds:[65,20,9,6],cart:60,orePerMetal:2,sale:480},
 {size:9,odds:[70,16,8,6],cart:80,orePerMetal:2,sale:550}
]);
const CART=[10,20,30,45,60,80], ORE_PER_METAL=[4,4,3,3,2,2], SALE=[300,340,380,430,480,550];
const COSTS=Object.freeze({mineTier:[0,250,600,1150,1900,3000],cartTier:[0,120,300,580,960,1540],refineryTier:[0,300,700,1300,2200,3500]});
const clamp=(v,max=MAX)=>Number.isSafeInteger(v)?Math.max(0,Math.min(max,v)):0;
const validQty=q=>Number.isSafeInteger(q)&&q>=1&&q<=MAX;
function localDay(at=Date.now()){const d=new Date(at);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function h32(v){let x=v>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);return (x^(x>>>16))>>>0;}
function key(x,y){return x+','+y;}
function roll(seed,x,y,salt){return h32((seed>>>0)^Math.imul(x+1,15485863)^Math.imul(y+1,32452843)^salt)%100;}
function tile(seed,x,y,level){
 const odds=MAP[level].odds;let chance=roll(seed,x,y,0x248fd19d),kind='barren',ore=0;
 const types=['barren','ordinary','rich','crystal'],outputs=[0,1,2,4];
 for(let i=0;i<odds.length;i++){chance-=odds[i];if(chance<0){kind=types[i];ore=outputs[i];break;}}
 const hardRoll=roll(seed,x,y,0x74220a3b);
 const hardness=hardRoll<55?1:hardRoll<90?2:3;
 return {x,y,key:key(x,y),kind,ore,hardness};
}
function contents(n,x,y){
 const k=key(x,y),old=n.tileContentsByXY[k];
 if(old&&['barren','ordinary','rich','crystal'].includes(old.kind)&&[0,1,2,4].includes(old.ore)&&old.hardness>=1&&old.hardness<=3)return {x,y,key:k,...old};
 const fresh=tile(n.seed,x,y,n.mineTier);
 n.tileContentsByXY[k]={kind:fresh.kind,ore:fresh.ore,hardness:fresh.hardness};
 return fresh;
}
function eachCoord(n,fn){const size=MAP[n.mineTier].size;for(let y=0;y<size;y++)for(let x=0;x<size;x++)fn(x,y,key(x,y));}
function ensure(save,at=Date.now()){
 if(!save.nutravaganza||typeof save.nutravaganza!=='object'||Array.isArray(save.nutravaganza))save.nutravaganza={};
 const w=save.nutravaganza;if(!Number.isSafeInteger(w.dollars)||w.dollars<0||w.dollars>MAX)w.dollars=0;
 if(!save.nutravaganzaExpedition||typeof save.nutravaganzaExpedition!=='object'||Array.isArray(save.nutravaganzaExpedition))save.nutravaganzaExpedition={};
 const n=save.nutravaganzaExpedition;
 const legacy=n.schemaVersion!==3,oldSite=legacy&&Array.isArray(n.site)?n.site.slice():null,legacyPicks=n.picks;
 n.mineTier=clamp(n.mineTier,5);n.cartTier=clamp(n.cartTier,5);n.refineryTier=clamp(n.refineryTier,5);
 n.pickTier=clamp(n.pickTier,G.LAST);n.gloveTier=clamp(n.gloveTier,G.LAST);
 // In v1 the map tier also advanced the pick budget. Preserve that earned tier
 // as an equivalent 40-step pick tier when migrating, without granting refills.
 if(legacy&&oldSite&&!Number.isInteger(n.pickTierOriginalMigrated)&&!Number.isInteger(n.pickTier))n.pickTier=n.mineTier;
 n.sites=clamp(n.sites);n.seed=Number.isSafeInteger(n.seed)&&n.seed!==0?n.seed:4099;
 for(const id of ['tileHitsByXY','tileScansByXY','exposedOreByXY','tileContentsByXY']){
  if(!n[id]||typeof n[id]!=='object'||Array.isArray(n[id]))n[id]={};
 }
 n.cartOre=clamp(n.cartOre);n.ore=clamp(n.ore);n.metal=clamp(n.metal);n.goods=clamp(n.goods);n.writs=clamp(n.writs);
 n.unlocked=clamp(n.unlocked,500)||1;n.completed=clamp(n.completed,500);
 if(!n.stars||typeof n.stars!=='object'||Array.isArray(n.stars))n.stars={};
 if(legacy&&oldSite){
  // Legacy completed cells were paid already; never regenerate their rewards.
  for(let i=0;i<16;i++){
   const x=i%4,y=Math.floor(i/4),k=key(x,y),newCell=contents(n,x,y),hits=clamp(oldSite[i]);
   const oldHash=h32(n.seed+i*1691+83),oldHard=1+oldHash%3;
   if(hits>=oldHard)n.tileHitsByXY[k]=newCell.hardness;
   else n.tileHitsByXY[k]=Math.min(hits,Math.max(0,newCell.hardness-1));
  }
 }
 eachCoord(n,(x,y)=>{const k=key(x,y),c=contents(n,x,y);n.tileHitsByXY[k]=clamp(n.tileHitsByXY[k],c.hardness);
  if(n.tileScansByXY[k]!==true)delete n.tileScansByXY[k];
  n.exposedOreByXY[k]=clamp(n.exposedOreByXY[k],4);
  if(n.exposedOreByXY[k]===0)delete n.exposedOreByXY[k];
 });
 n.schemaVersion=3;
 const today=localDay(at),pickMax=G.dailyLimit('pickaxe',n.pickTier),gloveMax=G.dailyLimit('gloves',n.gloveTier);
 if(typeof n.day!=='string'){n.day=today;n.strikesLeft=legacy&&Number.isInteger(legacyPicks)?Math.min(pickMax,clamp(legacyPicks)):pickMax;n.scansLeft=gloveMax;}
 else if(today>n.day){n.day=today;n.strikesLeft=pickMax;n.scansLeft=gloveMax;}
 else{n.strikesLeft=Number.isSafeInteger(n.strikesLeft)?clamp(n.strikesLeft,pickMax):legacy&&Number.isInteger(legacyPicks)?Math.min(pickMax,clamp(legacyPicks)):pickMax;
  n.scansLeft=Number.isSafeInteger(n.scansLeft)?clamp(n.scansLeft,gloveMax):0;}
 if(n.cartOre>CART[n.cartTier]){ // Never delete old legitimate ores: leave overflow on cart until unloading.
  n.cartOre=clamp(n.cartOre);
 }
 return n;
}
function available(save){return G.isUnlocked(save);}
function stats(save,at=Date.now()){
 const n=ensure(save,at);let completed=0,exposed=0,scanned=0;
 eachCoord(n,(x,y,k)=>{const c=contents(n,x,y);if(n.tileHitsByXY[k]>=c.hardness)completed++;if(n.exposedOreByXY[k])exposed++;if(n.tileScansByXY[k])scanned++;});
 return {mineTier:n.mineTier,pickTier:n.pickTier,gloveTier:n.gloveTier,cartTier:n.cartTier,refineryTier:n.refineryTier,
  size:MAP[n.mineTier].size,strikesLeft:n.strikesLeft,strikeMax:G.dailyLimit('pickaxe',n.pickTier),
  scansLeft:n.scansLeft,scanMax:G.dailyLimit('gloves',n.gloveTier),cartOre:n.cartOre,cartMax:CART[n.cartTier],
  ore:n.ore,metal:n.metal,goods:n.goods,writs:n.writs,dollars:save.nutravaganza.dollars,
  odds:MAP[n.mineTier].odds.slice(),completed,exposed,scanned,
  pick:G.entry('pickaxe',n.pickTier),glove:G.entry('gloves',n.gloveTier),site:n.sites};
}
function currentBoard(save,at=Date.now()){
 const n=ensure(save,at),cells=[];eachCoord(n,(x,y,k)=>{
  const c=contents(n,x,y),hits=clamp(n.tileHitsByXY[k],c.hardness),done=hits>=c.hardness;
  cells.push({x,y,key:k,hits,hardness:c.hardness,done,scanned:n.tileScansByXY[k]===true,
   survey:n.tileScansByXY[k]===true?(c.ore>0?'ore':'barren'):null,
   kind:done?c.kind:null,ore:done?c.ore:0,exposed:clamp(n.exposedOreByXY[k],4)});
 });return cells;
}
function resetIfFinished(n){
 let finished=true;
 eachCoord(n,(x,y,k)=>{const c=contents(n,x,y);if(clamp(n.tileHitsByXY[k])<c.hardness||clamp(n.exposedOreByXY[k])>0)finished=false;});
 if(!finished)return false;
 n.sites=clamp(n.sites+1);n.seed=h32(n.seed+Math.imul(n.sites,15485863)+0x2f9187)||113;
 n.tileHitsByXY={};n.tileScansByXY={};n.exposedOreByXY={};n.tileContentsByXY={};
 return true;
}
function excavate(save,x,y,at=Date.now()){
 if(!available(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,at),size=MAP[n.mineTier].size;
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=size||y>=size)return {valid:false,reason:'cell'};
 const k=key(x,y),c=contents(n,x,y),hits=n.tileHitsByXY[k];
 if(hits>=c.hardness)return {valid:false,reason:n.exposedOreByXY[k]?'collect':'cleared'};
 if(n.strikesLeft<=0)return {valid:false,reason:'strikes'};
 n.strikesLeft--;n.tileHitsByXY[k]=hits+1;
 const done=n.tileHitsByXY[k]>=c.hardness;
 let collected=0;
 if(done&&c.ore>0){
  if(n.cartOre+c.ore<=CART[n.cartTier]){n.cartOre+=c.ore;collected=c.ore;}
  else n.exposedOreByXY[k]=c.ore;
 }
 const result={valid:true,x,y,hits:n.tileHitsByXY[k],hardness:c.hardness,cleared:done,kind:done?c.kind:null,
  cartAdded:collected,exposed:clamp(n.exposedOreByXY[k],4),remaining:n.strikesLeft};
 if(done)result.nextSite=resetIfFinished(n);
 return result;
}
function survey(save,x,y,at=Date.now()){
 if(!available(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,at),size=MAP[n.mineTier].size;
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=size||y>=size)return {valid:false,reason:'cell'};
 const k=key(x,y),c=contents(n,x,y);
 if(n.tileHitsByXY[k]>=c.hardness)return {valid:false,reason:'cleared'};
 if(n.tileScansByXY[k])return {valid:false,reason:'scanned'};
 if(n.scansLeft<=0)return {valid:false,reason:'scans'};
 n.scansLeft--;n.tileScansByXY[k]=true;
 return {valid:true,orePresent:c.ore>0,remaining:n.scansLeft}; // NEVER reveal rarity/yield
}
function collect(save,x,y,at=Date.now()){
 if(!available(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,at),size=MAP[n.mineTier].size;
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=size||y>=size)return {valid:false,reason:'cell'};
 const k=key(x,y),ore=clamp(n.exposedOreByXY[k],4);
 if(!ore)return {valid:false,reason:'empty'};
 if(n.cartOre+ore>CART[n.cartTier])return {valid:false,reason:'cart'};
 n.cartOre+=ore;delete n.exposedOreByXY[k];
 return {valid:true,ore,cartOre:n.cartOre,nextSite:resetIfFinished(n)};
}
function unload(save,at=Date.now()){
 if(!available(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,at);if(n.cartOre<=0)return {valid:false,reason:'empty'};
 if(n.ore+n.cartOre>MAX)return {valid:false,reason:'capacity'};
 const count=n.cartOre;n.ore+=count;n.cartOre=0;return {valid:true,count};
}
function upgrade(save,track,at=Date.now()){
 if(!available(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,at);
 if(track==='pickaxe'||track==='gloves')return G.upgrade(save,track);
 const list=COSTS[track];if(!list)return {valid:false,reason:'track'};
 const current=n[track];if(current>=5)return {valid:false,reason:'max'};
 const cost=list[current+1];if(save.nutravaganza.dollars<cost)return {valid:false,reason:'funds',need:cost-save.nutravaganza.dollars,cost};
 save.nutravaganza.dollars-=cost;n[track]=current+1;
 // Larger map retains all previously rolled tiles exactly.
 if(track==='mineTier')eachCoord(n,(x,y)=>contents(n,x,y));
 return {valid:true,track,tier:n[track],cost};
}
function prices(save,at=Date.now()){
 const n=ensure(save,at);return {
  pickaxe:G.entry('pickaxe',n.pickTier),gloves:G.entry('gloves',n.gloveTier),
  mineTier:{tier:n.mineTier,cost:n.mineTier<5?COSTS.mineTier[n.mineTier+1]:null},
  cartTier:{tier:n.cartTier,cost:n.cartTier<5?COSTS.cartTier[n.cartTier+1]:null},
  refineryTier:{tier:n.refineryTier,cost:n.refineryTier<5?COSTS.refineryTier[n.refineryTier+1]:null}
 };
}
function refine(save,qty=1,at=Date.now()){
 if(!available(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,at),rate=ORE_PER_METAL[n.refineryTier];
 if(!validQty(qty)||qty>Math.floor(n.ore/rate)||n.metal+qty>MAX)return {valid:false,reason:'materials'};
 n.ore-=qty*rate;n.metal+=qty;return {valid:true,metal:qty,used:qty*rate};
}
function manufacture(save,qty=1,at=Date.now()){
 if(!available(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,at);if(!validQty(qty)||qty>Math.floor(n.metal/2)||n.goods+qty>MAX)return {valid:false,reason:'materials'};
 n.metal-=qty*2;n.goods+=qty;return {valid:true,goods:qty,used:qty*2};
}
function sell(save,qty=1,at=Date.now()){
 if(!available(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,at),price=SALE[n.refineryTier];
 if(!validQty(qty)||qty>n.goods||qty>Math.floor((MAX-save.nutravaganza.dollars)/price))return {valid:false,reason:'goods'};
 n.goods-=qty;save.nutravaganza.dollars+=qty*price;return {valid:true,earned:qty*price};
}
function buyWrits(save,qty=1,at=Date.now()){
 if(!available(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,at);if(!validQty(qty)||qty>Math.floor(save.nutravaganza.dollars/180)||n.writs+qty>MAX)return {valid:false,reason:'funds'};
 save.nutravaganza.dollars-=qty*180;n.writs+=qty;return {valid:true,writs:qty,spent:180*qty};
}
const api={MAP,CART,ORE_PER_METAL,SALE,COSTS,localDay,tile,ensure,available,stats,currentBoard,excavate,survey,collect,unload,upgrade,prices,refine,manufacture,sell,buyWrits};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutvaleMines=api;
})(typeof window!=='undefined'?window:globalThis);
