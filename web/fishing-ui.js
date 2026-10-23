/* Nutravaganza compact wharf and aquarium views; engine remains in fishing.js. */
(function(root){
'use strict';
const F=root.NutFishing;
if(!F)throw new Error('NutFishing must load before fishing-ui');
function fishIcon(spec,active=false){return spec?.art?'<img class="fish-art" src="'+spec.art+'" alt="" loading="'+(active?'eager':'lazy')+'">':'<span class="fish-art-missing" aria-label="Artwork unavailable"></span>';}
function hub(save){
 const n=F.ensure(save),capacity=F.capacity(n),active=F.rodModel(n);
 return '<div class="nutravaganza-head"><h1>🎣 NUTVALE VALLEY WHARF</h1><div class="fish-wallet"><b>N$ '+n.dollars.toLocaleString()+'</b><button class="btn ghost" data-nav="aquarium"><img class="fish-header-icon" src="art/fishing/species/v2/fish-set01-azure-darter.png" alt="" loading="lazy"> AQUARIUM '+n.fish.length+'/'+capacity+'</button><button class="btn ghost" data-nav="homestead">← ESTATE</button></div></div>'+
  '<div class="wharf-hub-scene" aria-label="Nutvale Valley Wharf with Fishing on the left and Bait Shop on the right"><img class="wharf-landscape" src="art/wharf/nutvale-valley-wharf-hub.webp" alt="Sunlit Nutvale Valley Wharf: fishing shelter on the left, bait shop on the right, and boats in the bay" width="1672" height="941" draggable="false">'+
  '<button class="wharf-hub-hotspot wharf-hub-fishing" data-nav="fishing" aria-label="Go fishing at the waterfront"><span>🎣 GO FISHING</span></button>'+
  '<button class="wharf-hub-hotspot wharf-hub-shop" data-nav="bait-shop" aria-label="Enter the bait and tackle shop"><span>🪱 BAIT SHOP</span></button></div>'+
  '<div class="wharf-hub-foot"><span>WHARF TIER '+n.wharfTier+'/5 · 🪱 '+n.baits.worm+' worms · 🎣 '+active.name+' · '+n.rodStock[active.id]+'/'+active.maxDurability+' durability</span><button class="btn ghost" data-nav="aquarium">VIEW AQUARIUM →</button></div>';
}
function wharf(save,state,E,P){
 const n=F.ensure(save),fight=n.fight,pending=n.pending;
 const bait=state.fishBait||'worm',cap=F.capacity(n);
 let play='',stage='';
 if(pending){
  const item=F.FISH.find(s=>s.id===pending.id);
  play='<div class="fish-decision"><h2>'+fishIcon(item,true)+' '+item.name+' CAUGHT!</h2><p>'+pending.size+' cm · Species Max '+item.maxSize+' cm · Personal Best '+(n.trophyRecords[item.id]?.size||pending.size)+' cm · Worth N$ '+pending.value+'</p><div class="fish-actions"><button class="btn green" data-action="fish-keep" '+(n.fish.length>=cap?'disabled':'')+'>KEEP IN AQUARIUM</button><button class="btn secondary" data-action="fish-sell">SELL · N$ '+(pending.value+F.saleBonus(n,pending.value))+'</button><button class="btn ghost" data-action="fish-release">RELEASE</button></div></div>';
 }else if(fight){
  const item=F.FISH.find(s=>s.id===fight.id);
  const radius=16+n.rod*2;
  stage='<div class="fish-water" aria-label="Fish position and moving hook"><div class="fish-catch-zone" style="left:'+Math.max(0,fight.hook-radius)+'%;width:'+radius*2+'%"></div><span class="fish-in-fight" style="left:'+fight.fish+'%">'+fishIcon(item,true)+'</span><span class="fish-hook" style="left:'+fight.hook+'%">⌄</span></div>';
  play='<div class="fish-fight"><div class="fish-fight-head"><b>'+fishIcon(item,true)+' '+item.name+'</b><small>TURN '+fight.turn+'/34</small></div><div class="fish-gauges"><label>REEL PROGRESS <meter min="0" max="100" value="'+fight.progress+'"></meter>'+Math.round(fight.progress)+'%</label><label>LINE TENSION <meter min="0" max="100" value="'+fight.tension+'" low="25" high="70" optimum="0"></meter>'+Math.round(fight.tension)+'%</label></div><div class="fish-actions"><button class="btn secondary" data-action="fish-left">◀ TRACK</button><button class="btn green" data-action="fish-reel">REEL!</button><button class="btn secondary" data-action="fish-right">TRACK ▶</button><button class="btn ghost" data-action="fish-slack">GIVE LINE</button></div><small>Keep the hook under the fish. Reel when aligned; give line to avoid a snap. Each command advances the fight.</small></div>';
 }else{
  const options=F.BAITS.filter(spec=>spec.level<=n.baitTier).map(spec=>
   '<button class="fish-bait '+(bait===spec.id?'selected':'')+'" data-action="fish-select-bait" data-bait="'+spec.id+'" aria-pressed="'+(bait===spec.id)+'"><span>'+spec.icon+'</span><b>'+spec.name+'</b><small>×'+n.baits[spec.id]+'</small></button>'
  ).join('');
  play='<div class="fish-cast"><h2>CAST A LINE · '+F.dailyBait(n)+' FREE WORMS DAILY</h2><div class="fish-bait-row">'+options+'</div><button class="btn green" data-action="fish-cast" '+(!n.baits[bait]?'disabled':'')+'>CAST · '+bait.toUpperCase()+'</button><small>Casting consumes one bait. Escaped fish do not refund it.</small></div>';
 }

 const claimed=typeof n.wharfAdDay==='string'&&n.wharfAdDay>=F.localDay(Date.now());
 const wharfAd='<section class="fish-store wharf-ad-offer"><b>🎣 SQUIRREL FISHERMEN ADS</b><button class="btn green" data-action="ad-wharf" '+(claimed?'disabled':'')+'>'+(claimed?'WHARF BONUS CLAIMED TODAY':'WATCH AD · +2 🪱 BAIT + N$100')+'</button><small>Optional parody · once daily · 2-minute wah-wah timer</small></section>';

 return '<div class="nutravaganza-head"><h1>🎣 NUTVALE FISHING</h1><div class="fish-wallet"><b>N$ '+n.dollars.toLocaleString()+'</b><button class="btn ghost" data-nav="bait-shop">🪱 BAIT SHOP</button><button class="btn ghost" data-nav="aquarium"><img class="fish-header-icon" src="art/fishing/species/v2/fish-set01-azure-darter.png" alt="" loading="lazy"> AQUARIUM '+n.fish.length+'/'+cap+'</button><button class="btn ghost" data-nav="wharf">← WHARF</button></div></div>'+
 '<div class="wharf-fishing-stage"><img class="wharf-landscape" src="art/wharf/nutvale-wharf-fishing-scene.webp" alt="Side-on fishing pier above a sunlit underwater seafloor with pilings, fish, coral and a shipwreck" width="1672" height="941" draggable="false"><div class="wharf-underwater-interface">'+stage+'</div></div>'+
 '<div class="wharf-fishing-controls">'+play+'</div><div class="wharf-fishing-foot">'+wharfAd+'</div>';
}
/* Single read-only rate ledger reused in both shops; inventory trade is shared. */
function exchangeSheet(save,E,P,expanded=false){
 const totals=F.exchangeBalance(save,P);
 const rows=totals.rates.map(q=>{
  const label=E?.BOOSTER_META?.[q.booster]?.label||q.booster;
  const lock=!q.earned?'LV '+(P?.LEVEL_BY_TOOL?.[q.booster]||'?'):!q.owned?'EMPTY':!q.room?'FULL':null;
  return '<tr class="'+(q.earned?'':'fish-balance-locked')+'"><th scope="row">'+label+'</th><td>'+q.owned+'</td><td>1 → '+q.rate+' 🪱</td><td><button class="fish-exchange-btn" data-action="fish-trade" data-booster="'+q.booster+'" '+(lock?'disabled':'aria-label="Trade one '+label+' for '+q.rate+' worm bait"')+'>'+(lock||'TRADE +'+q.rate)+'</button></td></tr>';
 }).join('');
 const recipes=F.BAITS.filter(b=>!!F.BAIT_RECIPES[b.id]).map(b=>{
  const c=F.BAIT_RECIPES[b.id];return '<span class="fish-balance-recipe">'+b.name+' · '+c.worms+' 🪱 + N$'+c.dollars+(totals.craftTier<c.tier?' (Bait Tier '+c.tier+')':'')+'</span>';
 }).join('');
 return '<details class="fish-balance-sheet" '+(expanded?'open':'')+'><summary><b>🪱 BOOSTER → BAIT BALANCE</b><span>'+totals.stocked+' boosters · '+totals.potentialWorms+' potential worms</span></summary><div class="fish-balance-content"><div class="fish-balance-stats"><span>STOCK <b>'+totals.currentWorms+' 🪱</b></span><span>FREE DAILY <b>'+totals.freeDaily+' 🪱</b></span><span>NUTVALE <b>N$'+totals.dollars+'</b></span></div><div class="fish-balance-scroll"><table class="fish-balance-table"><thead><tr><th>BOOSTER</th><th>OWNED</th><th>RATE</th><th>REDEEM</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="fish-balance-recipes">'+recipes+'</div><small>Each trade spends one unlocked booster. Golden Nuts and Gems remain unchanged.</small></div></details>';
}
function baitCatalog(save,state){
 const n=F.ensure(save);
 const rows=F.BAITS.map(spec=>{
  const open=n.baitTier>=spec.level,stock=n.baits[spec.id],recipe=F.BAIT_RECIPES[spec.id],
   buy1=open&&stock<999999&&n.dollars>=spec.price,buy5=open&&stock<=999994&&n.dollars>=spec.price*5,
   craft=recipe&&open&&stock<999999&&n.baits.worm>=recipe.worms&&n.dollars>=recipe.dollars,
   active=state.fishBait===spec.id;
  return '<article class="fish-bait-offer '+(open?'':'locked')+'"><span class="fish-bait-icon" aria-hidden="true">'+spec.icon+'</span><div class="fish-bait-copy"><b>'+spec.name+'</b>'+
   '<small>×'+stock+' · '+(open?'UNLOCKED':'SHOP TIER '+spec.level+' TO UNLOCK')+' · QUALITY +'+spec.quality+(spec.habitat?' · '+spec.habitat.toUpperCase()+' BONUS':'')+'</small>'+
   '<small>'+spec.description+'</small></div><div class="fish-bait-purchase">'+
   '<button class="btn secondary" data-action="fish-bait-buy" data-bait="'+spec.id+'" data-qty="1" '+(buy1?'':'disabled')+'>BUY 1 · N$'+spec.price+'</button>'+
   '<button class="btn ghost" data-action="fish-bait-buy" data-bait="'+spec.id+'" data-qty="5" '+(buy5?'':'disabled')+'>BUY 5 · N$'+spec.price*5+'</button>'+
   (recipe?'<button class="btn ghost" data-action="fish-craft" data-bait="'+spec.id+'" '+(craft?'':'disabled')+'>CRAFT · '+recipe.worms+' 🪱 + N$'+recipe.dollars+'</button>':'')+
   '<button class="btn ghost" data-action="fish-select-bait" data-bait="'+spec.id+'" '+(!open||!stock?'disabled':'')+'>'+(!open?'🔒':active?'EQUIPPED':'EQUIP')+'</button></div></article>';
 }).join('');
 return '<section class="fish-store fish-bait-catalog"><div class="fish-rod-heading"><b>🪱 BAIT SHELVES · '+F.BAITS.length+' TYPES</b><small>BAIT SHOP '+n.baitTier+'/5</small></div>'+
 '<div class="fish-bait-catalog-list">'+rows+'</div><small>Higher quality shifts fish odds; habitat bait favours corresponding fish. Bait is consumed on cast.</small></section>';
}
function baitShop(save,state,E,P){
 const n=F.ensure(save),bait=state.fishBait||'worm',cap=F.capacity(n);
 const upgrades=[['bait','Bait Shop',n.baitTier,5],['wharf','Wharf',n.wharfTier,5],['rod','Rod Skill',n.rod,5],['tank','Aquarium',n.tank,10]].map(([id,name,tier,max])=>{
  const cost=F.nextCost(id,n);
  return '<button class="btn secondary" data-action="fish-upgrade" data-kind="'+id+'" '+(cost===null||n.dollars<cost?'disabled':'')+'>'+name+' '+tier+'/'+max+' · '+(cost===null?'MAX':'N$ '+cost)+'</button>';
 }).join('');
 const activeRod=F.rodModel(n),currentBait=F.BAITS.find(b=>b.id===bait)||F.BAITS[0],q=currentBait.quality;
 const rodGallery=F.RODS.map(model=>{
  const owned=Object.prototype.hasOwnProperty.call(n.rodStock,model.id),durability=owned?n.rodStock[model.id]:0;
  const locked=n.rod<model.tier;
  const favors=F.rodOdds(model.id,q).filter(e=>model.affinity.includes(e.id)).map(e=>e.name+' '+Math.round(e.probability*100)+'%').join(' · ');
  const repairCost=model.id==='woodland'?0:Math.ceil((model.maxDurability-durability)*(1.2+model.tier*.4));
  const action=owned?(durability===0?'fish-rod-repair':'fish-rod-equip'):'fish-rod-buy';
  const disabled=locked||(!owned&&n.dollars<model.cost)||(owned&&durability===0&&n.dollars<repairCost);
  const repair=owned&&durability>0&&durability<model.maxDurability?'<button data-action="fish-rod-repair" data-rod="'+model.id+'" '+(n.dollars<repairCost?'disabled':'')+' class="btn ghost">REPAIR N$ '+repairCost+'</button>':'';
  return '<div class="fish-rod-card '+(activeRod.id===model.id?'selected':'')+'"><img src="'+model.art+'" alt="'+model.name+' fishing rod" loading="lazy"><div><b>'+model.name+'</b><small>Skill '+model.tier+' · '+(owned?durability+'/'+model.maxDurability+' condition':'Max '+model.maxDurability)+'</small><small>'+favors+'</small></div><div class="fish-rod-actions"><button class="btn secondary" data-action="'+action+'" data-rod="'+model.id+'" '+(disabled?'disabled':'')+'>'+(locked?'LOCKED':owned?(durability===0?'REPAIR N$ '+repairCost:'EQUIP'):'BUY N$ '+model.cost)+'</button>'+repair+'</div></div>';
 }).join('');
 const catchOdds=F.rodOdds(activeRod.id,q,currentBait.habitat);
 const catchSection='<details class="fish-catch-index"><summary>CATCH LIST · '+F.FISH.length+' SPECIES · VIEW ODDS</summary><div class="fish-catch-grid">'+F.FISH.map((species,i)=>'<div class="fish-catch-entry">'+fishIcon(species)+'<span><b>'+species.name+'</b><small>'+(species.rarity||'classic').toUpperCase()+' · '+(100*catchOdds[i].probability).toFixed(2)+'% · N$ '+species.value+'</small></span></div>').join('')+'</div></details>';
 const rodSection='<section class="fish-store fish-rods"><div class="fish-rod-heading"><b>FISHING RODS · '+activeRod.name+'</b><small>'+n.rodStock[activeRod.id]+'/'+activeRod.maxDurability+' DURABILITY</small></div><div class="fish-rod-list">'+rodGallery+'</div></section>';

 const exchanges=exchangeSheet(save,E,P,true),catalog=baitCatalog(save,state);

 const claimed=typeof n.wharfAdDay==='string'&&n.wharfAdDay>=F.localDay(Date.now());
 const wharfAd='<section class="fish-store wharf-ad-offer"><b>🎣 SQUIRREL FISHERMEN ADS</b><button class="btn green" data-action="ad-wharf" '+(claimed?'disabled':'')+'>'+(claimed?'WHARF BONUS CLAIMED TODAY':'WATCH AD · +2 🪱 BAIT + N$100')+'</button><small>Optional parody · once daily · 2-minute wah-wah timer</small></section>';



 return '<div class="nutravaganza-head"><h1>🪱 NUTVALE BAIT & TACKLE</h1><div class="fish-wallet"><b>N$ '+n.dollars.toLocaleString()+'</b><button class="btn ghost" data-nav="fishing">🎣 FISHING</button><button class="btn ghost" data-nav="aquarium"><img class="fish-header-icon" src="art/fishing/species/v2/fish-set01-azure-darter.png" alt="" loading="lazy"> AQUARIUM '+n.fish.length+'/'+cap+'</button><button class="btn ghost" data-nav="wharf">← WHARF</button></div></div>'+
 '<div class="wharf-bait-scene"><img class="wharf-landscape" src="art/wharf/nutvale-wharf-bait-shop.webp" alt="Squirrel-run bait and tackle shop with rods, bait jars, lures, crabs, and fishing boats outside" width="1672" height="941" draggable="false"></div>'+
 '<div class="wharf-bait-layout"><div class="wharf-bait-main">'+rodSection+catchSection+'</div><div class="wharf-bait-side">'+catalog+'<section class="fish-store"><h2>UPGRADE YOUR WHARF · NUTVALE DOLLARS</h2><small>Better Bait Shop = more bait · Wharf = +1 daily worm and +5% fish-sale premium per tier</small><div class="fish-upgrades">'+upgrades+'</div></section><section class="fish-store fish-balance-container">'+exchanges+'</section>'+wharfAd+'</div></div>';
}

// Personal-best fish mounts: wood plaque, actual species art, species label,
// length and catch count. Empty mounts do not reveal undiscovered species art.
function trophyMounts(save,{limit=Infinity,includeEmpty=true}={}){
 const n=F.ensure(save),list=F.FISH.filter(spec=>!!n.trophyRecords[spec.id]);
 const ordered=includeEmpty?[...list,...F.FISH.filter(spec=>!n.trophyRecords[spec.id])]:list;
 return ordered.slice(0,limit).map(spec=>{
  const record=n.trophyRecords[spec.id],found=!!record;
  const art=found?fishIcon(spec):'<span class="fish-trophy-silhouette" aria-hidden="true"><img class="fish-art" src="art/fishing/species/v2/fish-set01-azure-darter.png" alt="" loading="lazy"></span>';
  const size=found?record.size+' cm':'—';
  const quality=found?Math.round(100*record.size/spec.maxSize):0;
  return '<div class="fish-trophy-mount '+(found?'earned':'unclaimed')+'" aria-label="'+(found?spec.name+', personal best '+record.size+' centimeters':'Undiscovered fish trophy')+'">'+
   '<div class="fish-trophy-art">'+art+'</div><div class="fish-trophy-name">'+(found?spec.name:'UNDISCOVERED')+'</div>'+
   '<div class="fish-trophy-size">'+size+'</div><div class="fish-trophy-meta">'+(found?record.catches+' caught · '+quality+'% of species max':'CATCH TO UNLOCK')+'</div></div>';
 }).join('');
}
function trophyPreview(save){
 const status=F.trophyStatus(save),mounted=trophyMounts(save,{limit:3,includeEmpty:false});
 return '<section class="homestead-section estate-trophy-preview"><div class="fish-trophy-head"><b>🏆 FISH RECORDS · '+status.collected+'/'+status.total+'</b><button class="btn ghost" data-nav="fish-records">VIEW RECORD WALL →</button></div>'+
  '<div class="fish-trophy-preview-row">'+(mounted||'<small>Catch your first fish to earn a mounted record.</small>')+'</div></section>';
}
function trophyHall(save){
 const status=F.trophyStatus(save),best=status.records.reduce((largest,r)=>!largest||r.size>largest.size?r:largest,null);
 return '<div class="nutravaganza-head"><h1>🏆 NUTVALE RECORD WALL</h1><div class="fish-wallet"><b>'+status.collected+'/'+status.total+' SPECIES</b><button class="btn ghost" data-nav="aquarium"><img class="fish-header-icon" src="art/fishing/species/v2/fish-set01-azure-darter.png" alt="" loading="lazy"> AQUARIUM</button><button class="btn ghost" data-nav="homestead">← ESTATE</button></div></div>'+
  '<div class="fish-record-status"><span>'+status.totalCatches+' TOTAL CATCHES</span><span>'+status.collected+' SPECIES RECORDED</span><span>'+(best?'LONGEST: '+best.species.name+' · '+best.size+' cm':'FIRST RECORD AWAITS')+'</span></div>'+
  '<div class="fish-trophy-wall" aria-label="Personal-best mounted fish collection">'+trophyMounts(save)+'</div>'+
  '<small class="fish-trophy-footnote">One mount per species. A larger catch replaces its recorded length, even if sold or released. Fish can still live in your aquarium independently.</small>';
}
function aquariumPreview(save){
 const n=F.ensure(save),cap=F.capacity(n),stamps=F.stampCapacity(n);
 const fish=n.fish.slice(0,4).map(resident=>fishIcon(F.FISH.find(f=>f.id===resident.id))).join('');
 return '<section class="homestead-section estate-aquarium-preview"><button class="estate-tank-button" data-nav="aquarium" aria-label="Enter your estate aquarium">'+
  '<span class="estate-tank-mini" aria-hidden="true">'+(fish||'🐚 🫧 🌿')+'</span>'+
  '<span class="estate-tank-copy"><b><img class="fish-header-icon" src="art/fishing/species/v2/fish-set01-azure-darter.png" alt="" loading="lazy"> ESTATE AQUARIUM · TIER '+n.tank+'/10</b><small>'+n.fish.length+'/'+cap+' fish · '+n.aquarium.stamps.length+'/'+stamps+' stamps</small><small>VIEW & DECORATE →</small></span></button></section>';
}
function aquarium(save,state={}){
 const n=F.ensure(save),cap=F.capacity(n),stampLimit=F.stampCapacity(n),cost=F.nextCost('tank',n),editing=!!state.aquariumEditing;
 const residents=new Map(n.fish.map(f=>[f.slot,f]));
 const background=F.BACKGROUNDS.find(b=>b.id===n.aquarium.background)||F.BACKGROUNDS[0];
 const theme=F.BACKGROUNDS.map(b=>{
  const unlocked=F.backgroundUnlocked(n,b.id);
  const thumbnail=b.art?'<img src="'+b.art+'" alt="" loading="lazy" draggable="false">':'<span class="aquarium-theme-gradient" aria-hidden="true">🌊</span>';
  return '<button class="aquarium-theme '+(b.id===background.id?'chosen':'')+'" data-action="fish-aqua-background" data-background="'+b.id+'" '+(unlocked?'':'disabled')+' aria-pressed="'+(b.id===background.id)+'" title="'+(unlocked?'Select '+b.name:'Catch a matching species to unlock '+b.name)+'">'+thumbnail+'<span>'+b.name+(unlocked?'':' 🔒')+'</span></button>';
 }).join('');
 const stampCards=F.STAMPS.map(spec=>{
  const unlocked=F.stampUnlocked(n,spec.id),selected=state.aquariumStamp===spec.id;
  return '<button class="aquarium-stamp-card '+(selected?'selected':'')+'" data-action="fish-aqua-stamp-select" data-stamp="'+spec.id+'" '+(unlocked?'':'disabled')+' aria-pressed="'+selected+'" title="'+(unlocked?'Place '+spec.name:'Catch '+(F.FISH.find(f=>f.id===spec.fish)?.name||'a fish')+' to unlock')+'"><span>'+spec.icon+'</span><b>'+spec.name+'</b><small>'+(unlocked?'UNLOCKED':'🔒 '+(F.FISH.find(f=>f.id===spec.fish)?.name||'Fish'))+'</small></button>';
 }).join('');
 const stampLayers=n.aquarium.stamps.map((entry,i)=>{
  const stamp=F.STAMPS.find(spec=>spec.id===entry.id);
  return '<'+(editing?'button':'span')+' class="aquarium-stamp '+(editing?'removable':'')+'" '+(editing?'type="button" data-action="fish-aqua-stamp-remove" data-stamp-index="'+i+'" aria-label="Remove '+stamp.name+' stamp"':'aria-hidden="true"')+' style="left:'+entry.x+'%;top:'+entry.y+'%">'+stamp.icon+'</'+(editing?'button':'span')+'>';
 }).join('');
 // Fish roam through the open water, independent of their inventory slot.
 // Deterministic per-slot phases ensure re-renders do not shuffle fish randomly.
 const occupants=n.fish.map((fish,i)=>{
  const spec=F.FISH.find(x=>x.id===fish.id),position=fish.slot,
   y=15+(position*17+fish.size)%58,y2=16+(position*31+fish.size)%60,
   duration=8+(position*3+fish.size)%14,width=38+Math.min(24,Math.floor(fish.size/5));
  return '<span class="aquarium-fish aquarium-swimmer" role="img" aria-label="Slot '+(position+1)+': '+spec.name+', '+fish.size+' centimeters" style="--swim-y:'+y+'%;--swim-y2:'+y2+'%;--swim-speed:'+duration+'s;--swim-delay:-'+(position*3%17)+'s;--swim-width:'+width+'px">'+fishIcon(spec,true)+'</span>';
 }).join('');
 const slotButtons=Array.from({length:cap},(_,slot)=>{
  const fish=residents.get(slot),spec=fish&&F.FISH.find(x=>x.id===fish.id);
  const selected=state.aquariumFishFrom===slot;
  return '<button class="aquarium-fish-slot '+(fish?'occupied':'empty')+' '+(selected?'selected':'')+'" data-action="fish-aqua-slot" data-slot="'+slot+'" aria-pressed="'+selected+'" aria-label="Tank slot '+(slot+1)+': '+(spec?spec.name:'empty')+'"><b>'+(slot+1)+'</b>'+(spec?fishIcon(spec):'<span>＋</span>')+'<small>'+(spec?spec.name:'EMPTY')+'</small></button>';
 }).join('');
 const room='<section class="aquarium-room"><div class="aquarium-room-title"><b>ESTATE AQUARIUM · TIER '+n.tank+'/10</b><small>'+n.fish.length+'/'+cap+' fish · '+n.aquarium.stamps.length+'/'+stampLimit+' stamps</small></div>'+
  '<div class="aquarium-display aquarium-tier-'+n.tank+'"><div class="aquarium-tank aquarium-bg-'+background.id+' '+(background.art?'aquarium-art-scene ':'')+(editing?'editing':'')+'" style="--aquarium-tier:'+n.tank+';width:min(100%,'+(460+90*n.tank)+'px);height:min(74vh,'+(270+35*n.tank)+'px);" aria-label="Animated '+background.name+' aquarium, '+n.fish.length+' of '+cap+' fish, '+n.aquarium.stamps.length+' stamps"><div class="aquarium-back-glow"></div><div class="aquarium-back-water'+(background.art?' aquarium-real-backdrop':'')+'"'+(background.art?' style="background-image:url('+background.art+');background-size:100% 100%;background-position:center"':'')+'></div><div class="aquarium-floor" aria-hidden="true">'+(background.art?'':'🪨 🌿 🪸 🐚 🌾 🪸 🌿')+'</div>'+stampLayers+occupants+
  (editing&&state.aquariumStamp?'<button class="aquarium-placement-canvas" data-action="fish-aqua-stamp-place" aria-label="Tap a location in the aquarium to place the selected stamp"></button>':'')+
  '<div class="aquarium-light" aria-hidden="true"></div></div></div></section>';
 const editor=editing?'<section class="aquarium-editor"><div class="aquarium-edit-head"><b>BACKGROUNDS</b><small>Catch new species to unlock themes</small></div><div class="aquarium-themes">'+theme+'</div>'+
  '<div class="aquarium-edit-head"><b>STAMPS · '+n.aquarium.stamps.length+'/'+stampLimit+'</b><small>'+((state.aquariumStamp)?'Tap a spot in the tank to place':'Select an unlocked stamp, then tap the tank')+'</small></div><div class="aquarium-stamp-palette">'+stampCards+'</div>'+
  '<div class="aquarium-edit-head"><b>FISH SLOTS · '+n.fish.length+'/'+cap+'</b><small>'+(state.aquariumFishFrom===null?'Select a fish, then another slot to move or swap it':'Select its destination slot')+'</small></div><div class="aquarium-fish-slots">'+slotButtons+'</div></section>':'';
 return '<div class="nutravaganza-head"><h1><img class="fish-header-icon" src="art/fishing/species/v2/fish-set01-azure-darter.png" alt="" loading="lazy"> ESTATE AQUARIUM</h1><div class="fish-wallet"><b>N$ '+n.dollars.toLocaleString()+'</b><button class="btn ghost" data-nav="wharf">🎣 WHARF</button><button class="btn ghost" data-nav="homestead">← ESTATE</button></div></div>'+
 room+'<div class="aquarium-footer"><span>'+n.fish.length+'/'+cap+' FISH · '+stampLimit+' STAMP SLOTS · TANK '+n.tank+'/10</span><button class="btn secondary" data-action="fish-aqua-edit" aria-pressed="'+editing+'">'+(editing?'✓ FINISH EDITING':'✎ EDIT AQUARIUM')+'</button><button class="btn secondary" data-action="fish-upgrade" data-kind="tank" '+(cost===null||n.dollars<cost?'disabled':'')+'>'+(cost===null?'MAX SIZE':'EXPAND TANK · N$ '+cost)+'</button></div>'+editor;
}
function action(name,button,ctx){
 if(!name.startsWith('fish-'))return false;
 const {save,state,progression:P,persist,render,notice}=ctx;
 let result;
 if(name==='fish-select-bait'){
  const spec=F.BAITS.find(b=>b.id===button.dataset.bait);
  if(spec&&spec.level<=F.ensure(save).baitTier)state.fishBait=spec.id;
  render();return true;
 }
 if(name==='fish-aqua-edit'){
  state.aquariumEditing=!state.aquariumEditing;state.aquariumStamp=null;state.aquariumFishFrom=null;render();return true;
 }
 if(name==='fish-aqua-stamp-select'){
  const id=button.dataset.stamp,n=F.ensure(save);
  if(!state.aquariumEditing||!F.stampUnlocked(n,id)){notice('CATCH THE REQUIRED FISH TO UNLOCK THIS STAMP');return true;}
  state.aquariumStamp=state.aquariumStamp===id?null:id;render();return true;
 }
 if(name==='fish-aqua-slot'){
  if(!state.aquariumEditing)return true;
  const slot=Number(button.dataset.slot),n=F.ensure(save);
  if(!Number.isInteger(slot)||slot<0||slot>=F.capacity(n))return true;
  if(state.aquariumFishFrom===null){
   if(!n.fish.some(f=>f.slot===slot))return true;
   state.aquariumFishFrom=slot;render();return true;
  }
  if(state.aquariumFishFrom===slot){state.aquariumFishFrom=null;render();return true;}
  result=F.moveFish(save,state.aquariumFishFrom,slot);
  state.aquariumFishFrom=null;
  if(result.valid){persist();render();root.NutSFX?.play('place');}
  return true;
 }
 if(name==='fish-aqua-stamp-place'){
  if(!state.aquariumEditing||!state.aquariumStamp)return true;
  result=F.placeStamp(save,state.aquariumStamp,Number(button.dataset.x),Number(button.dataset.y));
  if(!result.valid){notice(result.reason==='full'?'UPGRADE THE TANK FOR MORE STAMP SLOTS':'CANNOT PLACE STAMP HERE');return true;}
  persist();render();root.NutSFX?.play('place');return true;
 }
 if(name==='fish-aqua-stamp-remove'){
  if(!state.aquariumEditing)return true;
  result=F.removeStamp(save,Number(button.dataset.stampIndex));
  if(result.valid){persist();render();root.NutSFX?.play('select');}return true;
 }
 if(name==='fish-aqua-background'){
  if(!state.aquariumEditing)return true;
  result=F.chooseBackground(save,button.dataset.background);
  if(!result.valid){notice('CATCH FISH TO UNLOCK THAT BACKGROUND');return true;}
  persist();render();root.NutSFX?.play('place');return true;
 }
 if(name==='fish-rod-buy')result=F.buyRod(save,button.dataset.rod);
 else if(name==='fish-rod-equip')result=F.equipRod(save,button.dataset.rod);
 else if(name==='fish-rod-repair')result=F.repairRod(save,button.dataset.rod);
 else if(name==='fish-upgrade')result=F.upgrade(save,button.dataset.kind);
 else if(name==='fish-trade')result=F.trade(save,button.dataset.booster,P);
 else if(name==='fish-bait-buy')result=F.buyBait(save,button.dataset.bait,Number(button.dataset.qty));
 else if(name==='fish-craft')result=F.craft(save,button.dataset.bait);
 else if(name==='fish-cast')result=F.cast(save,state.fishBait||'worm',Math.floor(Math.random()*4294967296));
 else if(['fish-left','fish-right','fish-reel','fish-slack'].includes(name))result=F.step(save,name.slice(5));
 else if(['fish-keep','fish-sell','fish-release'].includes(name))result=F.resolve(save,name.slice(5));
 else return false;
 if(!result.valid){root.NutSFX?.play('invalid');notice(({dollars:'NOT ENOUGH NUTVALE DOLLARS',full:'AQUARIUM FULL · UPGRADE OR SELL',stock:'NO BAIT LEFT',busy:'FINISH THE CATCH FIRST',booster:'POWER-UP UNAVAILABLE',limit:'BAIT STOCK FULL',bait:'UNKNOWN BAIT',locked:'UPGRADE THE BAIT SHOP',quantity:'INVALID QUANTITY',tier:'UPGRADE ROD SKILL FIRST','rod-broken':'ROD BROKEN · REPAIR BEFORE CASTING','not-owned':'PURCHASE THIS ROD FIRST'})[result.reason]||'ACTION UNAVAILABLE');return true;}
 persist();render();
 const cue=result.status==='escaped'?'escaped':result.status==='caught'?'caught':name==='fish-cast'?'cast':name==='fish-reel'?'reel':name==='fish-slack'?'transport':name==='fish-left'||name==='fish-right'?'ui':result.choice==='sell'||name==='fish-upgrade'?'coin':result.choice==='keep'?'place':'select';
 root.NutSFX?.play(cue);
 if(result.status==='escaped')notice(result.reason==='snapped'?'LINE SNAPPED!':'THE FISH GOT AWAY!');
 else if(result.status==='caught')notice(result.trophy?.newRecord?'🏆 '+(result.trophy.newSpecies?'NEW SPECIES RECORD':'NEW PERSONAL BEST')+' · '+result.trophy.size+' cm':'FISH CAUGHT · '+result.catch.size+' cm');
 else if(result.choice==='sell')notice('SOLD FOR N$ '+(result.fish.value+F.saleBonus(F.ensure(save),result.fish.value)));
 else if(result.choice==='keep')notice('NEW AQUARIUM RESIDENT!');
 else if(name==='fish-trade')notice('EXCHANGED ONE '+(button.dataset.booster||'BOOSTER').toUpperCase()+' · +'+result.amount+' HONEST WORMS');
 else if(name==='fish-craft')notice('BAIT CRAFTED · -N$'+result.cost+' · -1 HONEST WORM');
 else if(name==='fish-bait-buy')notice('BOUGHT '+result.quantity+' '+F.BAITS.find(x=>x.id===result.id).name.toUpperCase()+' · -N$'+result.cost);
 else if(name==='fish-upgrade')notice('UPGRADED '+(button.dataset.kind==='bait'?'BAIT SHOP':button.dataset.kind.toUpperCase())+' TO TIER '+result.level);
 return true;
}
const api={hub,wharf,baitShop,baitCatalog,aquarium,aquariumPreview,trophyHall,trophyPreview,trophyMounts,exchangeSheet,action};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutFishingUI=api;
})(typeof window!=='undefined'?window:globalThis);
