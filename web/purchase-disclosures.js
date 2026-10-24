/* NUTBUSTER purchase disclosure authority. Read live rewards and rates.
 * No payment provider: real-money storefront offers remain fictional.
 * This module never mutates a player's save. */
(function(root){
'use strict';
const money=n=>Number(n||0).toLocaleString('en-US');
function packLines(pack,E){
 return E.BOOSTERS.filter(id=>Number(pack?.[id])>0).map(id=>E.BOOSTER_META[id].label+' ×'+pack[id]);
}
function offer(index,products,pack,E){
 const p=products[index];
 if(!p)return null;
 if(index===6)return {name:p[0],lines:['Manual free reward: restore hearts to exactly 5, only when below 5.','One redemption every 12 elapsed hours per saved game; no stacking of unclaimed refills.','Its timer is separate from the 24-hour daily-move bank and free +5 move timer.','Golden Nuts +0; Gems +0; boosters: none. Fixed, guaranteed reward.']};
 if(index===7)return {name:p[0],lines:['Manual free reward: immediately add exactly 5 moves to the current daily wallet.','One redemption every 12 elapsed hours per saved game; no unclaimed-charge stacking.','Moves can exceed the daily baseline, do not refill the 24-hour allowance, and are not banked across cycles.','Independent of the free heart refill timer. Golden Nuts +0; Gems +0; boosters: none. Guaranteed.']};
 if(index===8)return {name:p[0],lines:['One permanent-for-this-save Royal Manor entitlement.','Platinum Royal avatar, Platinum Fountain, and Diamond Throne decorations become eligible for use.','Golden Nuts +0; Gems +0; boosters: none.','Fixed result; 100% certainty. No random rewards.']};
 return {name:p[0],lines:['Golden Nuts +'+money(p[2]),'Gems +'+money(p[3]),
 ...packLines(pack,E).map(line=>'Booster: '+line),
 ...(index===4?['One-time permanent VIP status for this local save; no recurring subscription.',
 'Each 24-hour daily reset: +5 extra daily moves automatically.',
 'Each 24-hour daily reset: +250 Golden Nuts automatically.',
 'Each 24-hour daily reset: +4 boosters (2 Hammers, 1 Extra Moves, 1 Shuffle), with locked kinds converted to the strongest already earned.',
 'Today’s VIP daily allowance and booster pack are granted once on activation; no duplicate grants in the same cycle.',
 'Independent free 12-hour heart and +5-moves claims stay available without VIP.']:[]),
 'If a booster is not yet unlocked, its units are replaced by the strongest unlocked booster. The exact replacement quantities are listed above.',
 'Fixed result; 100% certainty. No random rewards.']};
}
function describe(action,data,{save,P,E,F,H,state}){
 const n=F?.ensure(save);
 if(action==='crate-open'){
  const C=root.NutCrates,info=C?.odds(save,data.crate),crate=C?.CRATES[data.crate];
  if(!info||!crate)return null;
  const price=info.currency==='dollars'?'Wharf Dollars '+money(info.cost):money(info.cost)+' Golden Nuts';
  return {name:'Open '+crate.name,lines:['Price: '+price+'.','One random outcome from the itemized odds table.',
   ...(info.fixed?[info.fixed]:[]),'All listed chances sum to 100%.',
   'Duplicate outfits pay +600 Golden Nuts; full booster stock pays +800 Golden Nuts; capped upgrades or bait stock pay N$800.',
   'Bait won before its shop tier is unlocked remains stocked until usable.',
   'In-game currency only; no actual payment.'],odds:info.odds.map(o=>({name:o.label,probability:o.percent/100}))};
 }
 if(action==='shop-currency-buy'){
  const offer=P.SHOP_EXCHANGES[data.offer];
  if(!offer)return null;
  const current=offer.kind==='hearts'?Math.min(5,Math.max(0,Number(save.hearts)||0)):0;
  const quantity=offer.kind==='hearts'?Math.min(offer.amount,5-current):offer.amount;
  return {name:offer.name,lines:[
   'Pay exactly '+money(offer.cost)+' '+(offer.currency==='gems'?'Gems':'Golden Nuts')+'.',
   offer.kind==='hearts'?'Receive '+quantity+' '+(quantity===1?'life':'lives')+' now; five is the maximum. Current lives: '+current+'/5.':'Receive exactly '+quantity+' additional daily-wallet moves, immediately available in the current puzzle.',
   'Current '+(offer.currency==='gems'?'Gems':'Golden Nuts')+': '+money(save[offer.currency])+'.',
   'No real-money transaction, no cooldown, no chance involved. Balance and capacity checked again when confirmed.'
  ]};
 }
 if(action==='booster-gems-buy'){
  const id=data.booster,price=P.GEM_BOOSTER_PRICES[id],meta=E.BOOSTER_META[id];
  if(!price||!meta)return null;
  return {name:'Gem Booster Pack · '+meta.label,lines:[
   'Pay exactly '+money(price)+' Gems.',
   'Receive '+P.GEM_BOOSTER_QUANTITY+' '+meta.label+' boosters. Guaranteed.',
   'Requires campaign level '+P.LEVEL_BY_TOOL[id]+' unlocked.',
   'Golden Nuts and Wharf Dollars unchanged. No actual payment.'
  ]};
 }
 if(action==='booster-buy'){
  const id=data.booster,price=P.BOOSTER_PRICES[id],meta=E.BOOSTER_META[id];
  if(!meta||!price)return null;
  return {name:'Buy '+meta.label,lines:['Pay '+money(price)+' Golden Nuts.','Receive exactly 1 '+meta.label+' booster.','Requires campaign level '+P.LEVEL_BY_TOOL[id]+' unlocked.','Optional Wharf exchange pays '+F.BOOSTER_BAIT[id]+' Honest Worm bait per booster.','No Gems or N$ spent. Guaranteed 100%; no random contents.']};
 }
 if(!n)return null;
 if(action==='fish-bait-buy'){
  const bait=F.BAITS.find(x=>x.id===data.bait),qty=Number(data.qty);
  if(!bait||![1,5].includes(qty))return null;
  const rod=F.rodModel(n);
  return {name:'Buy '+qty+' '+bait.name,lines:['Pay N$'+money(bait.price*qty)+'.','Receive exactly '+qty+' '+bait.name+' bait.','Requires Bait Shop tier '+bait.level+'.','One bait is consumed on each cast; quality +'+bait.quality+(bait.habitat?', favours '+bait.habitat+' fish':'')+'.','No Golden Nuts or Gems deducted. Fish species are random; actual odds for '+rod.name+' appear below.'],odds:F.rodOdds(rod.id,bait.quality,bait.habitat)};
 }
 if(action==='fish-craft'){
  const bait=F.BAITS.find(x=>x.id===data.bait),recipe=F.BAIT_RECIPES[data.bait];
  if(!bait||!recipe)return null;
  return {name:'Craft '+bait.name,lines:['Pay '+recipe.worms+' Honest Worm bait plus N$'+money(recipe.dollars)+'.','Receive exactly 1 '+bait.name+' bait.','Requires Bait Shop tier '+recipe.tier+'.','Fixed craft; 100%. Golden Nuts and Gems unaffected.']};
 }
 if(action==='fish-trade'){
  const id=data.booster,quote=F.exchangeQuote(save,id,P),meta=E.BOOSTER_META[id];
  if(!meta||!quote.rate)return null;
  return {name:'Trade '+meta.label,lines:['Spend exactly 1 '+meta.label+' booster (must own it and have it unlocked).','Receive exactly '+quote.rate+' Honest Worm bait.','No currency deducted. Guaranteed 100%; no random outcomes.']};
 }
 if(action==='fish-rod-buy'){
  const rod=F.RODS.find(x=>x.id===data.rod);if(!rod)return null;
  const bait=F.BAITS.find(x=>x.id===state.fishBait)||F.BAITS[0];
  return {name:'Buy '+rod.name,lines:['Pay N$'+money(rod.cost)+'.','Receive exactly 1 '+rod.name+' rod in the permanent local Wharf rod inventory.','Starting durability: '+rod.maxDurability+'; requires Rod Skill tier '+rod.tier+'.','No bait, fish, Golden Nuts or Gems granted. Fish catch chances for '+bait.name+' appear below.'],odds:F.rodOdds(rod.id,bait.quality,bait.habitat)};
 }
 if(action==='fish-rod-repair'){
  const rod=F.RODS.find(x=>x.id===data.rod);if(!rod)return null;
  const current=n.rodStock[rod.id]??0,missing=Math.max(0,rod.maxDurability-current);
  const cost=rod.id==='woodland'?0:Math.ceil(missing*(1.2+rod.tier*.4));
  return {name:'Repair '+rod.name,lines:['Pay N$'+money(cost)+'.','Restore existing '+rod.name+' rod from '+current+' to '+rod.maxDurability+' durability.','No extra item, fish, bait, or currency. Fixed outcome 100%.']};
 }
 if(action==='fish-upgrade'){
  const id=data.kind,level=id==='bait'?n.baitTier:id==='wharf'?n.wharfTier:id==='rod'?n.rod:id==='tank'?n.tank:null;
  if(level===null)return null;
  const price=F.nextCost(id,n);if(price===null)return null;
  const lines=['Pay N$'+money(price)+'.','Upgrade '+({bait:'Bait Shop',wharf:'Wharf',rod:'Rod Skill',tank:'Aquarium'}[id])+' from tier '+level+' to '+(level+1)+'.'];
  if(id==='bait')lines.push('Unlock bait: '+(F.BAITS.filter(x=>x.level===level+1).map(x=>x.name).join(', ')||'none')+'. Access only; these are not automatically added to stock.');
  if(id==='wharf')lines.push('Daily worm grant becomes '+(F.DAILY+level+1)+'; fish sale bonus becomes '+(5*(level+1))+'%.');
  if(id==='rod')lines.push('Unlock purchasable rods: '+(F.RODS.filter(x=>x.tier===level+1).map(x=>x.name).join(', ')||'none')+'. Rods sold separately.');
  if(id==='tank')lines.push('Fish slots become '+(F.capacity(n)+3)+'; decoration stamp slots become '+(F.stampCapacity(n)+2)+'; visual tank size increases.');
  lines.push('No booster, currency or other item granted. Guaranteed 100%.');
  return {name:'Upgrade '+id,lines};
 }
 if(action==='homestead-tier-upgrade'){
  const h=H.ensure(save),t=H.HOUSE_TIERS.find(x=>x.tier===h.maxTier+1);if(!t)return null;
  return {name:'Build '+t.name,lines:['Pay '+money(t.cost)+' Golden Nuts.','Unlock exactly 1 residence appearance: '+t.name+' (tier '+t.tier+'/40).','Requires clearing level '+t.level+'.','No boosters, Gems or decorating items awarded. Fixed result 100%.']};
 }
 if(action==='homestead-build'){
  const house=H.HOUSES.find(x=>x.id===data.id);if(!house)return null;
  const owned=H.ensure(save).houses[house.id]===true;
  return {name:'Acquire '+house.name,lines:[owned?'Already owned: pay nothing.':'First purchase costs '+money(house.cost)+' Golden Nuts.','Equip '+house.name+' residence. Requires campaign level '+house.level+'.','No currency, Gems, boosters, or accessories awarded. Fixed result 100%.']};
 }
 if(action==='homestead-renovate'){
  const tier=Number(data.tier),item=H.RENOVATIONS.find(x=>x.id===data.id),offer=H.renovationOffer(save,tier,data.id);
  if(!item||!offer.valid)return null;
  return {name:'Renovate '+item.name,lines:['Pay '+money(offer.cost)+' Golden Nuts.','Raise '+item.name+' to rank '+offer.rank+'/5 in residence tier '+tier+'.',item.detail+'.','Requires campaign level '+offer.level+' cleared. Cosmetic only: no bonus slots, currencies or inventory items.','Fixed result 100%.']};
 }
 return null;
}
const api=Object.freeze({offer,describe,packLines});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutPurchases=api;
})(typeof window!=='undefined'?window:globalThis);
