/* Render-only Nutvale Mines interface. Economy mutations live in NutvaleMines. */
(function(root){'use strict';
const M=root.NutvaleMines, G=root.NutMiningGear, Art=root.NutvaleEconomyArt, OreAtlas=root.MineOreAtlas||(typeof module!=='undefined'&&module.exports?require('./mine-ore-atlas.js'):null);
if(!M||!G||!Art||!OreAtlas)throw Error('Mining model, gear and approved ore artwork must load before Mine UI');
const format=n=>Number(n||0).toLocaleString('en-US');
const art=(i,emoji)=>'<span class="mines-art"><img src="'+i.image+'" alt="" loading="lazy" onerror="this.hidden=true"><span aria-hidden="true">'+emoji+'</span></span>';
const economy=(src,label,emoji)=>Art.image(src,label,emoji);
// Dedicated UI illustrations avoid unrelated emoji and preserve tier-specific gear art.
const ICONS=Object.freeze({
 heading:'art/nutvale/mining-tools/pickaxes/deepsea-orb.png',
 dig:'art/nutvale/mining-tools/pickaxes/brass-anthem.png',
 equipment:'art/nutvale/mining-tools/gloves/harvest-petal.png',
 refinery:'art/nutvale/mining-economy/goods/crate-golden-luxury.png',
 writs:'art/nutvale/mining-economy/writs/royal-blue-writ.png',
 digAction:'art/nutvale/mining-tools/pickaxes/moonlit-silver.png',
 scanAction:'art/nutvale/mining-tools/gloves/jackolantern.png',
 cart:'art/nutvale/mining-economy/goods/crate-mining-supplies.png',
 ore:'art/primary/blockers/rock.png'
});
const icon=(src,label)=>'<img class="mine-ui-icon" src="'+src+'" alt="" aria-hidden="true" title="'+label+'" loading="lazy">';
const gearIcon=(kind,tier)=>icon(G.entry(kind,tier).image,kind);
function nav(tab,active){return ['dig','equipment','refinery','writs'].map(x=>'<button class="mines-tab '+(x===active?'selected':'')+'" data-action="mine-tab" data-tab="'+x+'" aria-pressed="'+(x===active)+'">'+icon(ICONS[x],x)+' '+({dig:'DIG',equipment:'EQUIPMENT',refinery:'REFINERY',writs:'WRITS'}[x])+'</button>').join('');}
function dig(save,state){
 const s=M.stats(save),cells=M.currentBoard(save),scan=state.mineMode==='scan';
 const odds=['BARREN','ORE','RICH','CRYSTAL'].map((name,i)=>name+' '+s.odds[i]+'%').join(' · ');
 const tiles=cells.map(c=>{
  const status=c.done?(c.exposed?'ORE WAITING · '+c.exposed:c.kind==='barren'?'EMPTY':c.kind.toUpperCase()):c.survey==='ore'?'ORE PRESENT':c.survey==='barren'?'BARREN':'ROCK';
  const face=OreAtlas.sprite(c);
  return '<button class="mine-rock '+(c.done?'cleared ':'')+(c.exposed?'exposed ':'')+(c.scanned?'scanned':'')+'" data-action="mine-cell" data-x="'+c.x+'" data-y="'+c.y+'" aria-label="Rock '+(c.x+1)+','+(c.y+1)+': '+status+'" title="'+status+'">'+face+'<small>'+((!c.done&&c.hits)?('CRACK '+c.hits+'/'+c.hardness):status)+'</small></button>';
 }).join('');
 return '<div class="mine-resource-strip"><b>'+gearIcon('pickaxe',s.pickTier)+' '+s.strikesLeft+'/'+s.strikeMax+'</b><b>'+gearIcon('gloves',s.gloveTier)+' '+s.scansLeft+'/'+s.scanMax+'</b><b>'+icon(ICONS.cart,'Cart')+' '+s.cartOre+'/'+s.cartMax+'</b><b>'+OreAtlas.sprite({done:true,kind:'ordinary'})+' '+s.ore+' stored</b></div>'+
  '<div class="mine-mode"><button class="btn '+(!scan?'green':'secondary')+'" data-action="mine-mode" data-mode="dig" aria-pressed="'+(!scan)+'">'+icon(ICONS.digAction,'Dig')+' DIG</button><button class="btn '+(scan?'green':'secondary')+'" data-action="mine-mode" data-mode="scan" aria-pressed="'+scan+'">'+icon(ICONS.scanAction,'Scan')+' SCAN</button><button class="btn secondary" data-action="mine-unload" '+(s.cartOre?'':'disabled')+'>UNLOAD +'+s.cartOre+'</button></div>'+
  '<div class="mine-board-wrap"><div class="mine-board" style="--mine-grid:'+s.size+'">'+tiles+'</div></div>'+
  '<p class="mine-odds">SITE '+(s.site+1)+' · '+s.size+'×'+s.size+' · '+odds+' · Hardness: 55% 1-hit, 35% 2-hit, 10% 3-hit</p>';
}
function equipment(save){
 const s=M.stats(save),p=M.prices(save),list=[
  ['pickaxe','PICKAXE','PICK','+'+5+' daily strikes',G.dailyLimit('pickaxe',s.pickTier),G.dailyLimit('pickaxe',Math.min(39,s.pickTier+1)),p.pickaxe.nextCost,G.entry('pickaxe',s.pickTier)],
  ['gloves','SURVEY GLOVES','SCAN','+1 daily scan',G.dailyLimit('gloves',s.gloveTier),G.dailyLimit('gloves',Math.min(39,s.gloveTier+1)),p.gloves.nextCost,G.entry('gloves',s.gloveTier)],
  ['mineTier','MINE MAP','◈','Larger grid',M.MAP[s.mineTier].size,M.MAP[Math.min(5,s.mineTier+1)].size,p.mineTier.cost,{image:ICONS.dig}],
  ['cartTier','MINING CART','◈','More ore storage',M.CART[s.cartTier],M.CART[Math.min(5,s.cartTier+1)],p.cartTier.cost,{image:ICONS.cart}],
  ['refineryTier','REFINERY','◈','Better refining/sales',M.SALE[s.refineryTier],M.SALE[Math.min(5,s.refineryTier+1)],p.refineryTier.cost,{image:Art.goods(s.refineryTier)}]
 ];
 return '<div class="mines-shop-wallet"><b>'+economy(Art.money(s.dollars),'Nutvale Dollars','💰')+' N$ '+format(s.dollars)+'</b><span>Each purchase is permanent; current daily allowances gain only the new capacity.</span></div>'+
 list.map(row=>{const [id,name,emoji,desc,now,next,cost,icon]=row;const current=id==='pickaxe'?s.pickTier:id==='gloves'?s.gloveTier:s[id],max=id==='pickaxe'||id==='gloves'?39:5,done=current>=max;
 return '<div class="mines-upgrade">'+(icon?art(icon,emoji):'<span class="mines-art">'+emoji+'</span>')+
 '<div class="mines-upgrade-label"><b>'+name+'</b><small>Level '+(current+1)+'/'+(max+1)+' · '+(id==='refineryTier'?'N$ per good':id==='mineTier'?'Grid side':id==='cartTier'?'Capacity':id==='pickaxe'?'Strikes/day':'Scans/day')+' '+format(now)+(done?'':' → '+format(next))+'</small></div>'+
 '<button class="btn '+(cost!==null&&s.dollars>=cost?'green':'secondary')+'" data-action="mine-upgrade" data-track="'+id+'" '+(done?'disabled':'')+'>'+(done?'MAX':'N$ '+format(cost))+'</button></div>';
 }).join('')+
 '<p class="mine-odds">Pickaxes and gloves each have 40 distinct named visual states; extras remain bonus cosmetic variants. Mining uses N$ only, not Golden Nuts or Gems.</p>';
}
function refinery(save){
 const s=M.stats(save),rate=M.ORE_PER_METAL[s.refineryTier];
 return '<div class="mine-resource-strip"><b>'+OreAtlas.sprite({done:true,kind:'ordinary'})+' ORE '+s.ore+'</b><b>🔩 METAL '+s.metal+'</b><b>'+economy(Art.goods(s.refineryTier),'Produced goods','📦')+' GOODS '+s.goods+'</b><b>'+economy(Art.money(s.dollars),'Nutvale Dollars','💰')+' N$ '+format(s.dollars)+'</b></div>'+
 '<div class="mine-industrial-actions"><div class="mines-upgrade"><span>🔩</span><div><b>SMELT METAL</b><small>'+rate+' ore → 1 ingot</small></div><button class="btn green" data-action="mine-refine" '+(s.ore>=rate?'':'disabled')+'>REFINE 1</button></div>'+
 '<div class="mines-upgrade">'+economy(Art.goods(s.refineryTier),'Current manufactured crate','📦')+'<div><b>MANUFACTURE GOODS</b><small>2 ingots → 1 crate · style follows refinery tier '+(s.refineryTier+1)+'/6</small></div><button class="btn green" data-action="mine-craft" '+(s.metal>=2?'':'disabled')+'>CRAFT 1</button></div>'+
 '<div class="mines-upgrade">'+economy(Art.money(s.dollars),'Nutvale Dollars','💰')+'<div><b>SELL GOODS</b><small>1 crate → N$ '+M.SALE[s.refineryTier]+'</small></div><button class="btn green" data-action="mine-sell" '+(s.goods?'':'disabled')+'>SELL 1</button></div></div>';
}
function writs(save){
 const s=M.stats(save);
 return '<div class="mine-resource-strip"><b>'+economy(Art.money(s.dollars),'Nutvale Dollars','💰')+' N$ '+format(s.dollars)+'</b><b>'+economy(Art.writs(s.writs),'Prospector Writs','WRIT')+' '+format(s.writs)+' WRITS</b></div>'+
 '<div class="mines-upgrade">'+economy(Art.writs(s.writs),'Prospector Writ','WRIT')+'<div><b>PROSPECTOR’S WRIT</b><small>One Writ: N$180 · Mine proceeds and fishing use one N$ wallet</small></div><button class="btn green" data-action="mine-writ" '+(s.dollars>=180?'':'disabled')+'>BUY 1 · N$180</button></div>'+
 '<p class="mine-odds">Writ art reflects current holdings without changing Writ value. Campaign II stage admission remains unavailable until its independent 500 stages are authored and verified. Your Writs are safely stored.</p>';
}
function render(save,state){
 if(!M.available(save))return '<div class="topline"><h2>'+icon(ICONS.heading,'Nutvale Mines')+' NUTVALE MINES</h2><button class="btn ghost" data-nav="homestead">← ESTATE</button></div><div class="panel"><b>LOCKED: CLEAR CAMPAIGN LEVEL 500</b><p>Excavation, survey tools, and the industrial economy open after your first campaign victory.</p></div>';
 const tab=['dig','equipment','refinery','writs'].includes(state.mineTab)?state.mineTab:'dig';
 return '<div class="topline"><h2>'+icon(ICONS.heading,'Nutvale Mines')+' NUTVALE MINES</h2><button class="btn ghost" data-nav="homestead">← ESTATE</button></div>'+
 '<div class="mines-tabs">'+nav(tab,tab)+'</div>'+
 (tab==='dig'?dig(save,state):tab==='equipment'?equipment(save):tab==='refinery'?refinery(save):writs(save))+
 (state.minePending?'<div class="mine-confirm" role="dialog" aria-modal="true" aria-label="Confirm mining purchase"><b>CONFIRM UPGRADE</b><p>'+state.minePending.label+' · N$ '+format(state.minePending.cost)+'</p><small>N$ '+format(state.minePending.before)+' → '+format(state.minePending.after)+'</small><div class="actions"><button class="btn green" data-action="mine-confirm">CONFIRM</button><button class="btn secondary" data-action="mine-cancel">CANCEL</button></div></div>':'');
}
const api={render};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutvaleMinesUI=api;
})(typeof window!=='undefined'?window:globalThis);
