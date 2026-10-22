/* Nutravaganza compact wharf and aquarium views; engine remains in fishing.js. */
(function(root){
'use strict';
const F=root.NutFishing;
if(!F)throw new Error('NutFishing must load before fishing-ui');
function wharf(save,state,E,P){
 const n=F.ensure(save),fight=n.fight,pending=n.pending;
 const bait=state.fishBait||'worm',cap=F.capacity(n);
 const upgrades=[['rod','Rod',n.rod,5],['bait','Bait Quality',n.baitTier,2],['tank','Aquarium',n.tank,10]].map(([id,name,tier,max])=>{
  const cost=F.nextCost(id,n);
  return '<button class="btn secondary" data-action="fish-upgrade" data-kind="'+id+'" '+(cost===null||n.dollars<cost?'disabled':'')+'>'+name+' '+tier+'/'+max+' · '+(cost===null?'MAX':'N$ '+cost)+'</button>';
 }).join('');
 let play='';
 if(pending){
  const item=F.FISH.find(s=>s.id===pending.id);
  play='<div class="fish-decision"><h2>'+item.icon+' '+item.name+' CAUGHT!</h2><p>'+pending.size+' cm · Worth N$ '+pending.value+'</p><div class="fish-actions"><button class="btn green" data-action="fish-keep" '+(n.fish.length>=cap?'disabled':'')+'>KEEP IN AQUARIUM</button><button class="btn secondary" data-action="fish-sell">SELL · N$ '+pending.value+'</button><button class="btn ghost" data-action="fish-release">RELEASE</button></div></div>';
 }else if(fight){
  const item=F.FISH.find(s=>s.id===fight.id);
  const radius=16+n.rod*2;
  play='<div class="fish-fight"><div class="fish-fight-head"><b>'+item.icon+' '+item.name+'</b><small>TURN '+fight.turn+'/34</small></div><div class="fish-water" aria-label="Fish position and moving hook"><div class="fish-catch-zone" style="left:'+Math.max(0,fight.hook-radius)+'%;width:'+radius*2+'%"></div><span class="fish-in-fight" style="left:'+fight.fish+'%">'+item.icon+'</span><span class="fish-hook" style="left:'+fight.hook+'%">⌄</span></div><div class="fish-gauges"><label>REEL PROGRESS <meter min="0" max="100" value="'+fight.progress+'"></meter>'+Math.round(fight.progress)+'%</label><label>LINE TENSION <meter min="0" max="100" value="'+fight.tension+'" low="25" high="70" optimum="0"></meter>'+Math.round(fight.tension)+'%</label></div><div class="fish-actions"><button class="btn secondary" data-action="fish-left">◀ TRACK</button><button class="btn green" data-action="fish-reel">REEL!</button><button class="btn secondary" data-action="fish-right">TRACK ▶</button><button class="btn ghost" data-action="fish-slack">GIVE LINE</button></div><small>Keep the hook under the fish. Reel when aligned; give line to avoid a snap. Each command advances the fight.</small></div>';
 }else{
  const options=F.BAITS.filter(spec=>spec.level<=n.baitTier).map(spec=>
   '<button class="fish-bait '+(bait===spec.id?'selected':'')+'" data-action="fish-select-bait" data-bait="'+spec.id+'" aria-pressed="'+(bait===spec.id)+'"><span>'+spec.icon+'</span><b>'+spec.name+'</b><small>×'+n.baits[spec.id]+'</small></button>'
  ).join('');
  play='<div class="fish-cast"><h2>CAST A LINE · '+F.DAILY+' FREE WORMS DAILY</h2><div class="fish-bait-row">'+options+'</div><button class="btn green" data-action="fish-cast" '+(!n.baits[bait]?'disabled':'')+'>CAST · '+bait.toUpperCase()+'</button><small>Casting consumes one bait. Escaped fish do not refund it.</small></div>';
 }
 const exchanges=E.BOOSTERS.filter(id=>P.unlocked(save,id)).map(id=>
  '<button class="fish-exchange" data-action="fish-trade" data-tool="'+id+'" '+(!P.count(save,id)?'disabled':'')+'>'+E.BOOSTER_META[id].label+' ×'+P.count(save,id)+' → '+F.BOOSTER_BAIT[id]+' 🪱</button>'
 ).join('')||'<small>Unlock power-ups in the campaign to exchange them for bait.</small>';
 const craft=n.baitTier>=1?'<div class="fish-actions"><button class="btn ghost" data-action="fish-craft" data-bait="glitter" '+(!n.baits.worm||n.dollars<35?'disabled':'')+'>GLITTER GRUB · 1 🪱 + N$35</button>'+(n.baitTier>=2?'<button class="btn ghost" data-action="fish-craft" data-bait="royal" '+(!n.baits.worm||n.dollars<100?'disabled':'')+'>ROYAL ROE · 1 🪱 + N$100</button>':'')+'</div>':'';
 return '<div class="nutravaganza-head"><h1>🎣 NUTVALE FISHING WHARF</h1><div class="fish-wallet"><b>N$ '+n.dollars.toLocaleString()+'</b><button class="btn ghost" data-nav="aquarium">🐠 AQUARIUM '+n.fish.length+'/'+cap+'</button><button class="btn ghost" data-nav="homestead">← ESTATE</button></div></div><div class="fish-layout"><div class="fish-main"><div class="fish-dock" aria-hidden="true">🛶 MOONNUT WATERFRONT 🌊</div>'+play+'</div><aside class="fish-sidebar"><section class="fish-store"><h2>UPGRADES</h2><div class="fish-upgrades">'+upgrades+'</div>'+craft+'</section><section class="fish-store"><h2>POWER-UP → BAIT</h2><div class="fish-exchanges">'+exchanges+'</div></section></aside></div>';
}
function aquarium(save){
 const n=F.ensure(save),cap=F.capacity(n),cost=F.nextCost('tank',n);
 const occupants=n.fish.map((fish,i)=>{
  const spec=F.FISH.find(x=>x.id===fish.id),top=7+(i*23)%74,seconds=7+(i*3)%13;
  return '<span class="aquarium-fish" role="img" aria-label="'+spec.name+', '+fish.size+' centimeters" style="top:'+top+'%;--fish-speed:'+seconds+'s;--fish-delay:-'+i*2+'s">'+spec.icon+'<small>'+spec.name+'</small></span>';
 }).join('');
 const ledger=n.fish.map(f=>{const spec=F.FISH.find(x=>x.id===f.id);return '<span class="fish-specimen">'+spec.icon+' <b>'+spec.name+'</b> '+f.size+' cm</span>';}).join('');
 return '<div class="nutravaganza-head"><h1>🐠 NUTVALE AQUARIUM</h1><div class="fish-wallet"><b>N$ '+n.dollars.toLocaleString()+'</b><button class="btn ghost" data-nav="fishing">🎣 WHARF</button><button class="btn ghost" data-nav="homestead">← ESTATE</button></div></div><div class="aquarium-tank" aria-label="Animated aquarium, '+n.fish.length+' of '+cap+' fish"><div class="aquarium-light"></div>'+occupants+'<div class="aquarium-floor">🪸 🌿 🪨 🌾 🪸 🌿</div></div><div class="aquarium-footer"><b>'+n.fish.length+'/'+cap+' FISH · TANK TIER '+n.tank+'/10</b><button class="btn secondary" data-action="fish-upgrade" data-kind="tank" '+(cost===null||n.dollars<cost?'disabled':'')+'>'+(cost===null?'MAX CAPACITY':'EXPAND TANK · N$ '+cost)+'</button></div><div class="fish-collection">'+(ledger||'No residents yet. The water is suspiciously tranquil. Try the wharf!')+'</div>';
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
 if(name==='fish-upgrade')result=F.upgrade(save,button.dataset.kind);
 else if(name==='fish-trade')result=F.trade(save,button.dataset.tool,P);
 else if(name==='fish-craft')result=F.craft(save,button.dataset.bait);
 else if(name==='fish-cast')result=F.cast(save,state.fishBait||'worm',Math.floor(Math.random()*4294967296));
 else if(['fish-left','fish-right','fish-reel','fish-slack'].includes(name))result=F.step(save,name.slice(5));
 else if(['fish-keep','fish-sell','fish-release'].includes(name))result=F.resolve(save,name.slice(5));
 else return false;
 if(!result.valid){notice(({dollars:'NOT ENOUGH NUTVALE DOLLARS',full:'AQUARIUM FULL · UPGRADE OR SELL',stock:'NO BAIT LEFT',busy:'FINISH THE CATCH FIRST',booster:'POWER-UP UNAVAILABLE'})[result.reason]||'ACTION UNAVAILABLE');return true;}
 persist();render();
 if(result.status==='escaped')notice(result.reason==='snapped'?'LINE SNAPPED!':'THE FISH GOT AWAY!');
 else if(result.status==='caught')notice('FISH CAUGHT · KEEP OR SELL?');
 else if(result.choice==='sell')notice('SOLD FOR N$ '+result.fish.value);
 else if(result.choice==='keep')notice('NEW AQUARIUM RESIDENT!');
 return true;
}
const api={wharf,aquarium,action};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutFishingUI=api;
})(typeof window!=='undefined'?window:globalThis);
