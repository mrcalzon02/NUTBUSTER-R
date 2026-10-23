/* Nutvale Human Avatar Atlas. All costumes are cosmetic, local and permanent. */
(function(root){
'use strict';
const SEASONAL=Object.freeze([
 'spring-blossom','rainfall-picnic','midsummer-gala','sunharvest','autumn-masquerade',
 'harvest-festival','moonlantern-night','first-snow','evergreen-yule','new-year-regent',
 'heartsbloom-ball','clover-day','rainbow-fair','rose-court','beesong-picnic',
 'starfall-eve','applecrown-feast','gilded-harvest','frostlight-masque','dawnspring-return'
]);
const TIERS=Object.freeze(Array.from({length:40},(_,i)=>Object.freeze({
 id:'tier-'+String(i+1).padStart(2,'0'),name:'Outfit Tier '+(i+1),category:'progression',
 tier:i+1,level:i===0?0:i===39?500:Math.round(i*500/40),
 art:'art/avatars/progression/tier-'+String(i+1).padStart(2,'0')+'.webp'
})));
const COSTUMES=Object.freeze([...TIERS,...SEASONAL.map((id,i)=>Object.freeze({
 id,name:id.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),
 category:'seasonal',level:5+10*i,
 art:'art/avatars/seasonal/'+id+'.webp'
}))]);
const IDS=Object.freeze(Object.fromEntries(COSTUMES.map(c=>[c.id,c])));
const first=TIERS[0];
const LEGACY_OUTFIT=Object.freeze({squire:'tier-01',gardener:'tier-01',champion:'tier-03',baron:'tier-05',explorer:'tier-09',emperor:'tier-21',legend:'tier-40',royal:'tier-01'});
function owned(save,id){
 const item=Object.prototype.hasOwnProperty.call(IDS,id)?IDS[id]:null;
 if(!item)return false;
 if(item.level===0)return true;
 // Seasonal outfits remain earned through campaign progress OR their
 // individually awarded cosmetic crates; a duplicate never revokes ownership.
 if(item.category==='seasonal'&&save?.homestead?.lootCostumes?.[item.id]===true)return true;
 const stars=save?.stars||{};
 return Number(stars[item.level])>0;
}
function ensure(save){
 if(!save.homestead||typeof save.homestead!=='object'||Array.isArray(save.homestead))save.homestead={};
 const h=save.homestead;
 if(!owned(save,h.outfit)){
  const legacy=Object.prototype.hasOwnProperty.call(LEGACY_OUTFIT,h.avatar)?LEGACY_OUTFIT[h.avatar]:first.id;
  h.outfit=owned(save,legacy)?legacy:first.id;
 }
 return h;
}
function equip(save,id){ensure(save);if(!owned(save,id))return false;save.homestead.outfit=id;return true;}
function current(save){ensure(save);return IDS[save.homestead.outfit]||first;}
function unlockedAt(level){return COSTUMES.filter(c=>c.level===level);}
function summary(save){return {unlocked:COSTUMES.filter(c=>owned(save,c.id)).length,total:COSTUMES.length,seasonal:COSTUMES.filter(c=>c.category==='seasonal'&&owned(save,c.id)).length};}
const api={COSTUMES,TIERS,SEASONAL,owned,ensure,equip,current,unlockedAt,summary};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutAvatarArt=api;
})(typeof window!=='undefined'?window:globalThis);
