(function(){'use strict';
const E=window.NutEngine, M=window.NutCampaignMaps, P=window.NutProgress, H=window.NutHomestead, A=window.NutAvatarArt, screen=document.getElementById('screen');
const icons=['🥜','🌰','🌰','🥜','🌰','🟢','🌟'];
const D=window.NutDailyMoves, B=window.NutBenefits, T=window.NutElementalChallenges, R=window.NutElementalRewards;
if(!D||!T||!R)throw new Error('Daily moves and elemental reward modules must load before gameplay');
const Mines=window.NutvaleMines, MineUI=window.NutvaleMinesUI;
 const key='nutbuster.v1';let saved={unlocked:1,stars:{},coins:250,gems:25,shells:0,hearts:5,vip:false,streak:0,claimed:0,sound:true,music:true,announcerVoice:'original',levels:{voice:.9,music:.28,reactions:.38,sfx:.48},effects:true,completed:0};
try{const o=JSON.parse(localStorage.getItem(key)||'{}');if(o&&typeof o==='object')saved={...saved,...o,stars:o.stars||{}};}catch(_){}
P.migrate(saved);R.ensure(saved);H.ensure(saved);A.ensure(saved);if(!['original','auditor'].includes(saved.announcerVoice))saved.announcerVoice='original';D.ensure(saved,Date.now(),E.makeLevel(Math.min(1000,Math.max(1,saved.unlocked||1))).moves);saved.effects=saved.effects!==false;saved.levels={voice:.9,music:.28,reactions:.38,sfx:.48,...saved.levels};if(window.NutFishing){const previousDay=saved.nutravaganza?.day;window.NutFishing.ensure(saved);if(saved.nutravaganza.day!==previousDay)persist();}
if(!saved.chestReadyAt)saved.chestReadyAt=Date.now()+3*60*60*1000;
let state={page:'home',chapter:0,world:0,mapZoom:1,game:null,selected:-1,tool:null,announcer:'',sound:saved.sound,music:saved.music,effects:saved.effects,animating:false,epoch:0,checkout:null,checkoutStep:0,checkoutFrom:'shop',outcome:null,homesteadSelection:null,homesteadEditing:false,homesteadZone:'yard',homesteadPreview:null,holdTool:null,holdOffer:null,purchasePending:null,fishBait:'worm',aquariumEditing:false,aquariumStamp:null,aquariumFishFrom:null,codexTab:'blockers',codexBack:'home',nutdexOpen:false,adSession:null,adReturn:null,adMuted:false,discountOffer:null,mineTab:'dig',mineMode:'dig',minePending:null};let toastHandle;
if(window.NutAudio){window.NutAudio.setVoiceEnabled(state.sound);window.NutAudio.setMusicEnabled(state.music);window.NutAudio.setLevels?.(saved.levels||{voice:.9,music:.28,reactions:.38});window.NutAudio.setAnnouncerVoice?.(saved.announcerVoice);}
if(window.NutSFX){window.NutSFX.setEnabled(state.effects);window.NutSFX.setVolume(saved.levels.sfx);}
function playSFX(name,opts){window.NutSFX?.play(name,opts);}
const Ads=window.NutFakeAds, Purchases=window.NutPurchases, Promos=window.NutPromo;let adTicker=null,promoBusy=false;
const adNow=()=>typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():Date.now();
function persist(){try{localStorage.setItem(key,JSON.stringify(saved));}catch(_){}}
function dailyCap(){return E.makeLevel(Math.min(1000,Math.max(1,saved.unlocked||1))).moves;}
function syncDaily(now=Date.now()){
 const before=saved.dailyMoves?.resetAt,credited=saved.dailyMoves?.vipGranted;
 const bank=D.ensure(saved,now,dailyCap());
 B?.applyVipDaily?.(saved,now,dailyCap(),D,P);
 if(bank.resetAt!==before||bank.vipGranted!==credited)persist();
 return bank;
}
function movesLeft(){return syncDaily().remaining;}
function freeRemaining(kind){return B?.remaining?.(saved,kind)??0;}
function freeClaimButton(kind,action,label){
 const remaining=freeRemaining(kind),full=kind==='hearts'&&saved.hearts>=5;
 const message=full?'HEARTS FULL':remaining?'READY IN '+B.countdown(remaining):label;
 return '<button class="btn ghost" data-action="'+action+'" data-free-reward="'+kind+'" data-label="'+label+'" '+(remaining||full?'disabled':'')+'>'+message+'</button>';
}
let rewardRefreshTimer=null;
function updateFreeTimers(){
 if(rewardRefreshTimer!==null){clearTimeout(rewardRefreshTimer);rewardRefreshTimer=null;}
 let pending=false;
 for(const button of screen.querySelectorAll?.('[data-free-reward]')||[]){
  const kind=button.dataset.freeReward,remaining=freeRemaining(kind),full=kind==='hearts'&&saved.hearts>=5;
  button.disabled=!!(remaining||full);
  button.textContent=full?'HEARTS FULL':remaining?'READY IN '+B.countdown(remaining):button.dataset.label;
  if(remaining)pending=true;
 }
 if(pending)rewardRefreshTimer=setTimeout(updateFreeTimers,30000);
}
function safeNum(n){return Number.isFinite(n)?Math.min(999999999,Math.max(0,Math.trunc(n))):0;}
function gain(coins=0,gems=0){saved.coins=safeNum(saved.coins+coins);saved.gems=safeNum(saved.gems+gems);persist();counters();}
function counters(){
 for(const [id,value] of [['wallet',saved.coins],['gems',saved.gems],['play-wallet',saved.coins],['play-gems',saved.gems]]){
  const el=document.getElementById(id);if(el)el.textContent=value.toLocaleString();
 }
}
function boosterSummary(pack){return P.packText(pack,Object.fromEntries(E.BOOSTERS.map(id=>[id,E.BOOSTER_META[id].label])));}
function inventorySummary(){return P.available(saved).map(id=>E.BOOSTER_META[id].label+' ×'+P.count(saved,id)).join(' · ');}
function awardPack(kind){const pack=P.actualPack(saved,kind);P.grant(saved,pack);persist();return pack;}
function refreshBoosters(){
 screen.querySelectorAll('[data-tool]').forEach(el=>{const id=el.dataset.tool,tag=el.querySelector('[data-stock]');if(tag)tag.textContent=P.unlocked(saved,id)?'×'+P.count(saved,id):'LV '+P.LEVEL_BY_TOOL[id];el.classList.toggle('empty',P.unlocked(saved,id)&&!P.count(saved,id));});
 screen.querySelectorAll('[data-hold-tool]').forEach(el=>{const qty=P.holdCount(saved,el.dataset.holdTool),tag=el.querySelector('[data-stock]');if(tag)tag.textContent=qty?'×'+qty:'BUY';el.classList.toggle('empty',!qty);});
}
function activateBooster(id,index){const meta=E.BOOSTER_META[id];
 if(!meta)return null;
 if(!P.unlocked(saved,id)){notice('CLEAR LEVEL '+P.LEVEL_BY_TOOL[id]+' TO UNLOCK '+meta.label.toUpperCase());return null;}
 if(!P.count(saved,id)){notice('OUT OF '+meta.label.toUpperCase()+' · CHECK YOUR PACKS');return null;}
 const priorRefunds=state.game.elementalRefunds||0;
 const result=E.booster(state.game,id,index);
 if(!result.valid){notice(result.reason==='no-locks'?'No chains to unlock.':'Choose a valid target.');return null;}
 if(!P.spend(saved,id))throw new Error('Inventory desynchronized after power activation');
 const earnedRefunds=Math.max(0,(state.game.elementalRefunds||0)-priorRefunds);
 if(earnedRefunds)D.topUp(saved,earnedRefunds,Date.now(),dailyCap());
 if(id==='extra'){state.game.moves=D.topUp(saved,5,Date.now(),dailyCap());state.game.lost=false;}
 else if(earnedRefunds){state.game.moves=movesLeft();state.game.lost=false;}
 // Successful activations always play their OWN visual, even if no nut is cleared.
 const target=index>=0?screen.querySelector(`[data-cell="${index}"]`):screen.querySelector('.board-wrap');
 window.NutFX?.booster?.(id,target);
 persist();refreshBoosters();playSFX(id==='unlock'?'chain':id==='shuffle'?'shuffle':'booster');return result;
}
function notice(message){const n=document.getElementById('toast');n.textContent=message;n.classList.add('show');clearTimeout(toastHandle);toastHandle=setTimeout(()=>n.classList.remove('show'),2300);}
function announce(txt,clip){state.announcer=clip?(window.NutAudio?.caption?.(clip,txt)||txt):txt;const el=document.getElementById('announcer');if(el)el.textContent=state.announcer;if(state.sound&&clip)window.NutAudio?.voice(clip);}
const $=(selector)=>document.querySelector(selector);
function nav(page){
 // Header currency buttons and bottom tabs may target the page already on screen.
 // Replacing #screen.innerHTML for a no-op navigation reloads sprites and visibly flashes on Android.
 if(state.page===page)return;
 if(page==='codex')state.codexBack=state.page;
 if(state.page==='fake-ad')cancelFakeAd();
 closeNutdex();state.purchasePending=null;
 state.epoch++;state.animating=false;state.page=page;state.selected=-1;state.tool=null;state.holdTool=null;
 if(page==='homestead'){state.homesteadEditing=false;state.homesteadSelection=null;}
  if(page==='mines'&&Mines){Mines.ensure(saved);state.minePending=null;persist();}
 if(page!=='aquarium'){state.aquariumEditing=false;state.aquariumStamp=null;state.aquariumFishFrom=null;}
 if(page==='campaign'&&state.game){state.chapter=T.profile(state.game.level)?.area||M.chapterOf(state.game.level).id;state.world=Math.floor((state.chapter-1)/5);}
 render();}

function banner(title,sub){return `<div class="panel hero"><h1>${title}</h1><p>${sub}</p></div>`;}
function uiIcon(name,alt=''){return `<img src="art/additions/ui/${name}.png" class="ui-icon" alt="${alt}">`;}
function home(){return `${banner('WELCOME TO NUTBUSTER','The match-three game with every premium feature ever invented. An offer this irresistible can only end one way.')}
 <p class="daily-move-indicator">DAILY MOVES ${movesLeft()} / ${saved.dailyMoves.base}</p><div class="space"></div><div class="actions"><button class="btn green" data-action="play" data-level="${Math.min(1000,saved.unlocked)}">${uiIcon('play')}PLAY NOW</button><button class="btn secondary" data-nav="campaign">${uiIcon('campaign-map')}LEVEL MAP</button><button class="btn secondary" data-nav="homestead">🏡 NUTVALE HOMESTEAD</button><button class="btn secondary" data-nav="mines"><img class="ui-icon mine-home-icon" src="art/nutvale/mining-tools/pickaxes/holly-star.png" alt=""> NUTVALE MINES</button><button class="btn secondary" data-nav="wharf"><img class="ui-icon wharf-menu-icon" src="art/wharf/nutvale-valley-wharf-hub.webp" alt="">NUTVALE WHARF</button><button class="btn secondary" data-nav="codex">📖 NUT INDEX</button><button class="btn secondary" data-action="invite">↗ INVITE FRIENDS</button><button class="btn secondary" data-nav="shop">${uiIcon('store')}SHOP</button><button class="btn secondary" data-nav="settings">${uiIcon('settings')}SETTINGS</button><button class="btn ghost" data-action="sound">${state.sound?'🔊 Voice On':'🔇 Voice Off'}</button><button class="btn ghost" data-action="music">${state.music?'♫ Music On':'♫ Music Off'}</button><button class="btn ghost" data-action="effects">${state.effects?'Effects On':'Effects Off'}</button></div>
 <h2 class="section">Your entirely unnecessary privileges</h2><div class="tiles-row"><div class="panel mini-card"><span class="icon">❤️</span><b>${saved.hearts}/5 Lives</b>${freeClaimButton("hearts","refill","REDEEM FREE REFILL")}${freeClaimButton("moves","bonus-moves","REDEEM +5 MOVES")}</div><div class="panel mini-card"><span class="icon">👑</span><b>${saved.vip?'VIP ACTIVE · LIFETIME':'VIP STATUS'}</b><small>+5 daily moves · 4 daily boosters · +250 nuts</small><button class="btn ghost" data-action="vip">${saved.vip?'VIEW VIP BENEFITS':'VIP BENEFITS · $2.99'}</button></div><div class="panel mini-card"><span class="icon">🎁</span><b>Daily Loot</b><button class="btn ghost" data-action="daily">CLAIM BONUS</button><button class="btn secondary" data-action="ad-daily" ${saved.fakeAdDailyDay===Ads?.dayKey()?"disabled":""}>${saved.fakeAdDailyDay===Ads?.dayKey()?"📺 AD BONUS CLAIMED":"📺 WATCH · 750 NUTS + HAMMER"}</button></div></div>
 <div class="panel center"><b>FEATURED NUT EMPORIUM OFFERS</b><p class="muted">Optional bundles, modest sticker prices, and no artificial countdowns.</p><button class="btn secondary" data-nav="shop">EXPLORE OFFERS</button></div>`;}
function promoSection(featured=false){
 const configured=Object.keys(window.NutPromoKeys?.keys||{}).length>0;
 const form='<div class="promo-redeem-controls"><input data-promo-input type="text" aria-label="Signed Nutbuster promo code" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="1024" placeholder="Paste your Nutbuster code" />'+
 '<button class="btn secondary" data-action="promo-redeem" '+(configured?'':'disabled')+'>REDEEM</button></div>'+
 '<small>'+(configured?'Verified offline. One claim per code in this save.':'Issuer key not configured for this development build.')+' No login required. Codes redeemed in this save cannot be redeemed again here.</small>';
 if(featured)return '<section class="shop-promo-entry" aria-label="Promo code redemption">'+
  '<button type="button" class="btn promo-feature-button" data-action="promo-open" aria-controls="shop-promo-form" aria-expanded="false"><img class="promo-coupon-icon" src="art/additions/economy/premium-ticket.png" alt="" aria-hidden="true"> REDEEM PROMO CODE!</button>'+
  '<div class="promo-redeem" id="shop-promo-form" hidden>'+form+'</div></section>';
 return '<details class="promo-redeem"><summary><img class="promo-coupon-icon" src="art/additions/economy/premium-ticket.png" alt="" aria-hidden="true"> REDEEM A PROMO CODE</summary>'+form+'</details>';
}
async function redeemPromoFromUI(){
 if(promoBusy)return;
 const code=screen.querySelector?.('[data-promo-input]')?.value?.trim();
 if(!code){notice('ENTER A PROMO CODE');return;}
 if(!Promos){notice('PROMO VERIFIER IS UNAVAILABLE');return;}
 promoBusy=true;
 try{
  const at=Date.now();
  const result=await Promos.redeem(saved,code,{keys:window.NutPromoKeys?.keys||{},cryptoImpl:window.crypto,now:at,at,cap:dailyCap(),P,D,B,H});
  if(!result.valid){
   const messages={'already-redeemed':'THIS CODE WAS ALREADY REDEEMED IN THIS SAVE','expired':'PROMO CODE EXPIRED',
    'not-yet-valid':'CODE NOT YET ACTIVE','unknown-issuer':'PROMO ISSUER NOT RECOGNIZED',
    'crypto-unavailable':'SECURE PROMO VERIFICATION NOT SUPPORTED ON THIS DEVICE',
    'already-owned':'VIP IS ALREADY OWNED','hearts-full':'HEARTS ALREADY FULL'};
   notice(messages[result.reason]||'CODE INVALID OR REDEMPTION UNAVAILABLE');
   return;
  }
  persist();
  if(state.game&&result.moves){state.game.moves=movesLeft();state.game.lost=false;}
  playSFX('coin');
  const grants=[result.nuts?'+'+result.nuts+' GOLDEN NUTS':'',result.gems?'+'+result.gems+' GEMS':'',result.moves?'+'+result.moves+' MOVES':'',
   result.hearts?'+'+result.hearts+' HEARTS':'',Object.keys(result.boosters).length?boosterSummary(result.boosters):'',result.vipActivated?'LIFETIME VIP ACTIVATED':'',result.royalManor?'ROYAL MANOR KIT UNLOCKED':''].filter(Boolean);
  notice('PROMO REDEEMED · '+grants.join(' · '));
  render();
 }catch(_){notice('PROMO REDEMPTION FAILED · NO CLAIM RECORDED');}
 finally{promoBusy=false;}
}
function vipBenefits(){
 const today=syncDaily(),preview=P.actualPack(saved,'vipDaily');
 return '<div class="topline"><h2>👑 LIFETIME VIP BENEFITS</h2><button class="btn ghost" data-nav="home">BACK</button></div>'+
 '<div class="panel"><b>ONE-TIME UNLOCK · $2.99 FICTIONAL PREVIEW</b><p>Every rolling 24-hour daily move cycle, you automatically receive:</p>'+
 '<p><b>+5 daily moves</b> above the normal allowance, <b>+250 Golden Nuts</b>, and <b>4 boosters</b>: 2 Hammers, 1 Extra Moves, and 1 Shuffle. Types not yet unlocked convert to the strongest already unlocked.</p>'+
 '<p><b>Your current daily booster pack:</b> '+boosterSummary(preview)+'</p>'+
 '<p><b>Status:</b> '+(saved.vip?'ACTIVE · THIS CYCLE GRANT '+(today.vipGranted?'DELIVERED':'PENDING'):'NOT OWNED')+'</p>'+
 '<p class="muted">One-time permanent flag for this save; not a subscription. VIP rewards are automatic. The two separate free 12-hour rewards require manual redemption.</p>'+
 (saved.vip?'<button class="btn secondary" data-nav="shop">VIEW SHOP</button>':'<button class="btn green" data-action="vip-buy">GET LIFETIME VIP · $2.99</button>')+'</div>';
}
function campaign(){
 const currentWorld=state.world===1?1:0;
 const progress=M.CHAPTERS.slice(currentWorld*5,currentWorld*5+5).map(c=>({c,stars:Object.keys(saved.stars).filter(level=>Number(level)>=c.start&&Number(level)<=c.end).length}));
 // World map is a full-screen image with five real programmatic selectors, not painted-on UI.
 if(!state.chapter){
  const positions=currentWorld?[[.35,.90],[.67,.72],[.38,.54],[.63,.32],[.55,.12]]:[[.33,.90],[.29,.68],[.68,.51],[.36,.30],[.62,.11]];
  return `<div class="map-titlebar"><h2>THE GREAT NUT ODYSSEY · 1000 LEVELS</h2><button class="btn ghost" data-nav="home">⌂</button></div>
  <div class="map-world-switch" role="group" aria-label="Campaign world"><button class="btn ghost" data-action="world-page" data-world="0" aria-pressed="${currentWorld===0}">ORIGINAL · 1–500</button><button class="btn ghost" data-action="world-page" data-world="1" aria-pressed="${currentWorld===1}">NUTRAVAGANZA · 501–1000</button></div>
  <div class="map-viewport" data-map-scroll><div class="map-canvas map-overview" style="--map-w:${Math.round(M.WIDTH*state.mapZoom)}px;--map-h:${Math.round(M.HEIGHT*state.mapZoom)}px">
  <img class="map-background" src="${currentWorld?M.OVERVIEW2:M.OVERVIEW}" alt="${currentWorld?'Nutvale oceanside campaign':'Five original Nutbuster campaign regions'}" draggable="false">
  ${progress.map(({c,stars},i)=>`<button class="chapter-marker" style="left:${positions[i][0]*100}%;top:${positions[i][1]*100}%" data-chapter="${c.id}" aria-label="Open ${c.name}, levels ${c.start} through ${c.end}"><b>${c.id}. ${c.name}</b><small>Levels ${c.start}–${c.end} · ${stars}/100</small></button>`).join('')}
  </div></div><p class="map-hint">Choose a region. Ten regions. One extremely ambitious loyalty program.</p>`;
 }
 const chapter=M.CHAPTERS[state.chapter-1],points=M.nodes(state.chapter);
 const trialButtons=Array.from({length:30},(_,i)=>{
  const spec=T.profile(T.FIRST+(state.chapter-1)*T.PER_AREA+i),done=T.done(saved,spec.id),open=T.available(saved,spec.id);
  return '<button class="elemental-trial '+(done?'done':open?'open':'locked')+'" data-action="play" data-level="'+spec.id+'" '+(open?'':'disabled')+
   ' aria-label="'+spec.name+', '+(done?'completed':open?'available':'clear level '+spec.requiredMainLevel+' and prior trial')+'" title="'+spec.name+'">'+
   (done?'★ ':'✦ ')+spec.local+'</button>';
 }).join('');
 const currentLevel=Math.min(chapter.end,Math.max(chapter.start,saved.unlocked));
 const buttons=points.map(p=>{
  const stars=saved.stars[p.level]||0,open=p.level<=saved.unlocked;
  const status=stars?'complete':p.level===currentLevel?'current':open?'open':'future';
  return `<button class="map-node ${status} ${p.kind} ${p.milestone?'milestone':''}" style="left:${(p.x*100).toFixed(3)}%;top:${(p.y*100).toFixed(3)}%" data-action="play" data-level="${p.level}" ${p.level===currentLevel?'data-current="true"':''} aria-label="${p.title}; ${stars?'completed '+stars+' stars':open?'available':'enter this stage'}" title="${p.title} · ${stars?'★'.repeat(stars):'Play stage'}">${p.milestone?p.level:p.local}</button>`;
 }).join('');
 return `<div class="map-titlebar"><button class="btn ghost" data-action="world-map">← REGIONS</button><h2>${chapter.name} · ${chapter.start}–${chapter.end}</h2><div class="map-zoom"><button class="btn ghost" data-action="map-zoom" data-zoom="-.2" aria-label="Zoom map out">−</button><button class="btn ghost" data-action="map-zoom" data-zoom=".2" aria-label="Zoom map in">＋</button></div></div>
 <div class="map-viewport" data-map-scroll><div class="map-canvas" style="--map-w:${Math.round(M.WIDTH*state.mapZoom)}px;--map-h:${Math.round(M.HEIGHT*state.mapZoom)}px">
 <img class="map-background" src="${chapter.image}" alt="${chapter.name} winding adventure route" draggable="false">
 ${buttons}</div></div><div class="elemental-trials"><b>ELEMENTAL TRIALS · ${T.regionProgress(saved,state.chapter)}/30</b><small>Share the daily move bank · Booster prize every fifth · Elemental relic every tenth</small><div class="elemental-trial-strip">${trialButtons}</div></div><p class="map-hint">100 stages · <b>${points.filter(p=>saved.stars[p.level]).length}</b> completed. Tap a marker to play; choose any marker to enter that stage. Move around the map by scrolling.</p>`;
}

function art(category,name,emoji,cls='art'){return `<span class="${cls}"><img class="art-image" src="art/primary/${category}/${name}.png" alt="" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.style.visibility='visible'"><span class="icon-fallback" aria-hidden="true">${emoji}</span></span>`;}
function piece(type){if(type===null||type===undefined)return '';const name=E.TYPES[type];
 return `<img class="piece" src="art/primary/nuts/${name}.png" alt="" draggable="false" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.style.visibility='visible'"><span class="fallback" aria-hidden="true">${icons[type]||'🌰'}</span>`;
}
function nutVisual(c){if(c.ice||c.lock||c.chest)return '';return `<span class="nut-visual">${piece(c.type)}${c.elemental?`<img class="elemental-emblem" src="art/primary/nuts/elemental/${c.elemental}.png" alt="" draggable="false">`:''}${c.special?`<span class="nut-special">${c.special==='rainbow'?'🌈':c.special==='blast'?'💥':c.special==='line-v'?'↕':'↔'}</span>`:''}${c.hold?`<span class="hold-marker" aria-hidden="true"><img src="art/additions/effects/focus-ring.png" alt="" draggable="false"><b>${c.hold}</b></span>`:''}</span>`;}
function blockerVisual(c){
 // The ordinary nut remains visible beneath translucent tile blockers.
 const sprite=c.ice?'frost':c.lock?'chain-lock':c.chest?'chest':null;
 const kind=c.ice?'ice':c.lock?'chain':c.chest?'chest':null;
 const strength=c.ice||c.lock||c.chest||0;
 const spritePath=c.chest?'art/primary/blockers/chest.png':'art/primary/overlays/'+sprite+'.png';
 const layer=sprite?`<span class="overlay blocker-art ${kind}" data-strength="${strength}" aria-hidden="true"><img class="blocker-sprite" src="${spritePath}" alt="" draggable="false">${strength>1?`<b class="blocker-layer-count">${strength}</b>`:''}</span>`:'';
 // Surface hazards layer over the ordinary nut and any pinned cell blocker.
 return layer+(c.jam?'<span class="hazard tile-status jam" aria-hidden="true"><img class="status-art" src="art/primary/overlays/sticky-butter.png" alt="" draggable="false"></span>':'')+(c.fuse?`<span class="hazard tile-status fuse" aria-hidden="true"><img class="status-art" src="art/primary/overlays/bomb.png" alt="" draggable="false"><b class="status-count">${c.fuse}</b></span>`:'');
}
function cellLabel(c,i,w){
 const nut=c.lock?'locked walnut':c.type===null?'empty':E.TYPES[c.type];
 const obstacle=c.ice?' pinned beneath ice '+c.ice+' hits remaining':c.lock?' pinned beneath a chain '+c.lock+' hits remaining':c.chest?' pinned beneath a chest '+c.chest+' hits remaining':'';
 const hazard=(c.jam?' sticky butter':'')+(c.fuse?' timed acorn '+c.fuse+' turns':'');
 const hold=c.hold?' held for '+c.hold+' gravity drops':'';
 const elemental=c.elemental?' '+c.elemental+' elemental power':'';
 return nut+elemental+obstacle+hazard+hold+' row '+(Math.floor(i/w)+1)+' column '+(i%w+1);
}
function featureVisual(features,i){
 if(!features)return '';
 const belt=features.conveyors?.find(c=>c.indices.includes(i));
 const portal=features.portals?.find(c=>c.indices.includes(i));
 const wind=features.wind?.find(c=>c.indices.includes(i));
 const dir=wind?(window.NutBoardFeatures?.nextWindDirection(wind,state.game.turns)||'up'):null;
 return (belt?`<span class="board-feature conveyor" aria-hidden="true">${belt.direction==='right'?'›':'‹'}</span>`:'')+
  (portal?'<span class="board-feature portal" aria-hidden="true">◎</span>':'')+
 (wind?`<span class="board-feature wind" data-wind-direction="${dir}" aria-hidden="true">${dir==='up'?'↑':'↓'}</span>`:'');
}
function nutKey(c){return c.type+':'+(c.special||'')+':'+(c.elemental||'')+':'+(c.hold||0)+':'+Number(!!(c.ice||c.lock||c.chest));}
function blockKey(c){return c.ice+':'+c.lock+':'+c.chest+':'+(c.jam||0)+':'+(c.fuse||0);}
function cellMarkup(c,i,w){if(!c)return '<div class="cell void" aria-hidden="true"></div>';
 return `<button class="cell" data-cell="${i}" data-nut-key="${nutKey(c)}" data-block-key="${blockKey(c)}" aria-label="${cellLabel(c,i,w)}" title="${cellLabel(c,i,w)}">${featureVisual(state.game.cfg.features,i)}${nutVisual(c)}${blockerVisual(c)}</button>`;
}
function objectiveDisplay(g){
 const status=E.objectiveState(g);
 return status.map(o=>o.label+' '+Math.min(o.value,o.target)+'/'+o.target).join(' · ');
}
function objectivePercent(g){
 const status=E.objectiveState(g);
 return Math.round(100*status.reduce((sum,o)=>sum+Math.min(1,o.value/o.target),0)/status.length);
}
// Render owner-authored, already-shipped artwork, not generic substitute SVGs.
const BOOSTER_ART=Object.freeze({
 hammer:'art/primary/powerups/hammer.png',
 row:'art/primary/powerups/row-clear.png',
 column:'art/additions/effects/vertical-clear.png',
 cross:'art/additions/effects/horizontal-clear.png',
 blast:'art/primary/powerups/nut-burst.png',
 color:'art/primary/powerups/rainbow.png',
 shuffle:'art/additions/effects/rainbow-pulse.png',
 extra:'art/additions/economy/hourglass.png',
 drill:'art/additions/effects/rocket-impact.png',
 unlock:'art/additions/effects/chain-break.png',
 quake:'art/primary/powerups/nut-burst.png',
 'triple-row':'art/primary/powerups/row-clear.png',
 'triple-column':'art/additions/effects/vertical-clear.png',
 starburst:'art/additions/effects/rocket-impact.png',
 spectrum:'art/primary/powerups/rainbow.png',
 frostbreaker:'art/additions/effects/chest-pop.png'
});
function boosterIcon(id){
 const sprite=BOOSTER_ART[id];
 if(!sprite)throw new Error('Missing authored power-up art: '+id);
 return '<img class="booster-icon" src="'+sprite+'" alt="" draggable="false" aria-hidden="true">';
}
function toolButtons(){
 return E.BOOSTERS.slice(0,10).map(tool=>{
  const d=E.BOOSTER_META[tool],earned=P.unlocked(saved,tool),qty=P.count(saved,tool);
  return `<button data-tool="${tool}" class="${earned?qty?'ready':'empty':'locked'}" title="${earned?d.tip:'Beat level '+P.LEVEL_BY_TOOL[tool]+' to unlock'}" aria-label="${d.label}: ${earned?qty+' stocked, '+d.tip:'unlocks after level '+P.LEVEL_BY_TOOL[tool]}">${boosterIcon(tool)}<span class="booster-label">${d.label}</span><small data-stock>${earned?'×'+qty:'LV '+P.LEVEL_BY_TOOL[tool]}</small></button>`;
 }).join('')+Object.entries(P.HOLD_ITEMS).map(([id,item])=>{
  const qty=P.holdCount(saved,id);
  return `<button data-hold-tool="${id}" class="${qty?'ready':'empty'}" title="${item.tip}" aria-label="${item.label}: ${qty} stocked. ${item.tip}"><img class="hold-icon" src="${item.art}" alt="" draggable="false"><span class="booster-label">${id==='butter_hold'?'Butter':'Jam'} ${item.drops}↓</span><small data-stock>${qty?'×'+qty:'BUY'}</small></button>`;
 }).join('');
}
function advancedBoosterMenu(){
 const advanced=E.BOOSTERS.slice(10);
 return '<details class="advanced-booster-menu"><summary>✦ ADVANCED BOOSTERS · '+advanced.reduce((n,id)=>n+P.count(saved,id),0)+' STOCKED</summary><div class="advanced-booster-grid">'+advanced.map(tool=>{
  const meta=E.BOOSTER_META[tool],earned=P.unlocked(saved,tool),stock=P.count(saved,tool);
  return '<button data-tool="'+tool+'" class="'+(earned?stock?'ready':'empty':'locked')+'" title="'+meta.tip+'" aria-label="'+meta.label+' '+stock+' stocked">'+boosterIcon(tool)+
   '<span class="booster-label">'+meta.label+'</span><small data-stock>'+(earned?'×'+stock:'LV '+P.LEVEL_BY_TOOL[tool])+'</small></button>';
 }).join('')+'</div></details>';
}
function game(){
 const g=state.game;if(!g)return '<p>Choose a level from the campaign map.</p>';
 const ratio=objectivePercent(g);
 const boardHeightPercent=(100*g.cfg.height/g.cfg.width).toFixed(3);
 const maxBoardHeight=Math.round(545*g.cfg.height/g.cfg.width);
 return `<section class="play-layout" style="--board-w:${g.cfg.width};--board-h:${g.cfg.height};--board-vw:${boardHeightPercent}vw;--board-max-h:${maxBoardHeight}px">
  <div class="play-hud">
   <button class="play-back" data-nav="campaign" aria-label="Return to level map" title="Level map">‹</button>
   <div class="play-title" title="${g.cfg.stageTitle}" aria-label="LEVEL ${g.level}: ${g.cfg.stageTitle}"><b>LV ${g.level}</b><span>${g.cfg.stageTitle}</span></div>
   <div class="play-count" aria-label="Score"><span>SCORE</span><b data-stat="score">${g.score.toLocaleString()}</b></div>
   <div class="play-count" aria-label="Moves left"><span>DAILY</span><b data-stat="moves">${g.moves}</b></div>
   <button class="play-index" data-action="nutdex-open" aria-label="Open in-level Nutdex mechanics" title="NUTDEX">?</button><details class="play-menu"><summary aria-label="Game options" title="Game options">⋮</summary><div class="play-menu-panel">
    <button class="btn secondary" data-action="restart">Restart</button>
    <button class="btn secondary" data-nav="shop">Shop</button><button class="btn secondary" data-action="nutdex-open">NUTDEX</button>
    <button class="btn ghost" data-action="sound">${state.sound?'Voice On':'Voice Off'}</button>
    <button class="btn ghost" data-action="music">${state.music?'Music On':'Music Off'}</button><button class="btn ghost" data-action="effects">${state.effects?'Effects On':'Effects Off'}</button>
   </div></details>
  </div>
  <div class="play-objective"><span class="objective-label">GOAL</span><b data-objective title="${objectiveDisplay(g)}">${objectiveDisplay(g)}</b>
   ${g.cfg.design.lesson?`<details class="play-hint"><summary title="Level tip" aria-label="Level tip">?</summary><p>${g.cfg.hint}</p></details>`:''}
   <div class="progress" aria-label="Objective progress"><div data-progress style="width:${ratio}%"></div></div>
  </div>
  <div class="board-wrap"><div class="board" style="--cols:${g.cfg.width};--rows:${g.cfg.height}" role="group" aria-label="Nutbuster match-three board">${g.cells.map((c,i)=>cellMarkup(c,i,g.cfg.width)).join('')}</div></div>
  <div class="announcer"><span id="announcer" class="announcer-line" aria-live="off">${state.announcer||'SHOW ME THOSE NUTS!'}</span><span class="play-wallet"><button data-nav="shop" aria-label="Open shop, nut balance"><img src="art/primary/economy/golden-nuts.png" alt="" draggable="false"><b id="play-wallet">${saved.coins.toLocaleString()}</b></button><button data-nav="shop" aria-label="Open shop, gem balance"><img src="art/additions/economy/prismatic-acorn.png" alt="" draggable="false"><b id="play-gems">${saved.gems.toLocaleString()}</b></button></span></div>
  <div class="boosters" role="group" aria-label="Tactical boosters">${toolButtons()}</div>${advancedBoosterMenu()}
  <button class="nutdex-tab" data-action="nutdex-open" aria-haspopup="dialog" aria-label="NUTDEX special mechanics">NUTDEX ◀</button>
 </section>`;
}
function paintCells(cells){
 if(state.page!=='game')return;
 const g=state.game,board=screen.querySelector('.board');if(!board)return;
 for(let i=0;i<cells.length;i++){const c=cells[i];if(!c)continue;
  const el=board.querySelector(`[data-cell="${i}"]`);if(!el)continue;
  const nk=nutKey(c),bk=blockKey(c);
  if(el.dataset.nutKey!==nk){const vis=el.querySelector('.nut-visual');if(vis)vis.outerHTML=nutVisual(c);else if(!(c.ice||c.lock||c.chest))el.insertAdjacentHTML('beforeend',nutVisual(c));el.dataset.nutKey=nk;}
  if(el.dataset.blockKey!==bk){el.querySelectorAll('.overlay, .hazard').forEach(node=>node.remove());el.insertAdjacentHTML('beforeend',blockerVisual(c));el.dataset.blockKey=bk;}
  el.setAttribute('aria-label',cellLabel(c,i,g.cfg.width));
 }
}
// Recovery at every completed resolution: temporary animation hiding must never
// survive into interactive play on narrow/disconnected irregular boards.
function reconcileBoardNuts(){
 if(state.page!=='game'||!state.game)return;
 const board=screen.querySelector('.board');if(!board)return;
 const cells=E.snapshot(state.game).cells;
 paintCells(cells);
 for(let i=0;i<cells.length;i++){
  const c=cells[i];if(!c)continue;
  const tile=board.querySelector(`[data-cell="${i}"]`),vis=tile?.querySelector('.nut-visual');
  if(!vis)continue;
  vis.style.visibility='';
  // A late transport/fall frame may leave an old image in a reused fixed tile.
  const image=vis.querySelector?.('.piece');
  const expected=c.type===null||c.ice||c.lock||c.chest?null:'art/primary/nuts/'+E.TYPES[c.type]+'.png';
  if(!expected&&image)vis.outerHTML=nutVisual(c);
  else if(expected&&(!image||image.getAttribute('src')!==expected))vis.outerHTML=nutVisual(c);
  else if(image?.complete&&image.naturalWidth>0)image.classList.add('loaded');
 }
 board.querySelectorAll('.clearing').forEach(el=>el.classList.remove('clearing'));
 board.querySelectorAll('.falling-nut, .transport-nut').forEach(el=>el.remove());
}
function paintStats(){if(state.page!=='game'||!state.game)return;const g=state.game;
 const score=screen.querySelector('[data-stat="score"]'),moves=screen.querySelector('[data-stat="moves"]'),progress=screen.querySelector('[data-progress]'),objective=screen.querySelector('[data-objective]');
 if(score)score.textContent=g.score.toLocaleString();if(moves)moves.textContent=g.moves;
 if(objective){objective.textContent=objectiveDisplay(g);objective.title=objective.textContent;}
 if(progress)progress.style.width=objectivePercent(g)+'%';
 // Keep upcoming gust arrows current without rebuilding tiles or changing nuts.
 for(const mark of screen.querySelectorAll('.board-feature.wind')){
  const cell=mark.closest?.('[data-cell]');
  const i=Number(cell?.dataset?.cell);
  const lane=g.cfg.features.wind.find(l=>l.indices.includes(i));
  if(!lane)continue;
  const dir=window.NutBoardFeatures?.nextWindDirection(lane,g.turns)||'up';
  mark.textContent=dir==='up'?'↑':'↓';
  mark.dataset.windDirection=dir;
 }
}
function selectCell(i){const old=screen.querySelector('.cell.selected');if(old)old.classList.remove('selected');
 state.selected=i;if(i>=0)playSFX('select');if(i>=0)screen.querySelector(`[data-cell="${i}"]`)?.classList.add('selected');
}
function updateTools(){screen.querySelectorAll('[data-tool]').forEach(el=>el.classList.toggle('active',el.dataset.tool===state.tool));screen.querySelectorAll('[data-hold-tool]').forEach(el=>el.classList.toggle('active',el.dataset.holdTool===state.holdTool));}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function reducedMotion(){return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;}
async function swapAnimation(pair,epoch){
 if(pair)playSFX('swap');
 if(!pair||reducedMotion())return;
 const board=screen.querySelector('.board'),a=board?.querySelector(`[data-cell="${pair[0]}"]`),b=board?.querySelector(`[data-cell="${pair[1]}"]`);
 if(!a||!b)return;const va=a.querySelector('.nut-visual'),vb=b.querySelector('.nut-visual');
 const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect(),dx=rb.left-ra.left,dy=rb.top-ra.top;
 if(!va?.animate||!vb?.animate){await sleep(175);return;}
 const opts={duration:225,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'};
 const first=va.animate([{transform:'translate(0,0)'},{transform:`translate(${dx}px,${dy}px)`}],opts);
 const second=vb.animate([{transform:'translate(0,0)'},{transform:`translate(${-dx}px,${-dy}px)`}],opts);
 await Promise.allSettled([first.finished,second.finished]);
 if(epoch===state.epoch){va.style.visibility='hidden';vb.style.visibility='hidden';}
 first.cancel();second.cancel();
}
async function transportAnimation(stage,epoch){
 const board=screen.querySelector('.board');
 if(!board||reducedMotion()){paintCells(stage.cells);return;}
 paintCells(stage.before);
 const origin=board.getBoundingClientRect(),sprites=[],pending=[];
 for(const transfer of stage.transfers){
  const from=board.querySelector(`[data-cell="${transfer.from}"]`);
  const to=board.querySelector(`[data-cell="${transfer.to}"]`);
  if(!from||!to)continue;
  const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),fly=document.createElement('span');
  fly.className='transport-nut';fly.style.left=(a.left-origin.left)+'px';fly.style.top=(a.top-origin.top)+'px';
  fly.style.width=a.width+'px';fly.style.height=a.height+'px';
  fly.innerHTML=nutVisual({type:transfer.type,special:transfer.special,elemental:transfer.elemental});
  board.appendChild(fly);sprites.push(fly);
  const dx=b.left-a.left,dy=b.top-a.top;
  const frames=stage.mode==='portal'?
   [{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.45)',offset:.48},
    {opacity:0,transform:`translate(${dx}px,${dy}px) scale(.45)`,offset:.52},
    {opacity:1,transform:`translate(${dx}px,${dy}px) scale(1)`}] :
   [{transform:'translate(0,0)'},{transform:`translate(${dx}px,${dy}px)`}];
  if(fly.animate)pending.push(fly.animate(frames,{duration:stage.mode==='portal'?450:380,easing:'ease-in-out',fill:'forwards'}).finished.catch(()=>{}));
 }
 for(const t of stage.transfers){
  const vis=board.querySelector(`[data-cell="${t.from}"] .nut-visual`);
  if(vis)vis.style.visibility='hidden';
 }
 if(pending.length)await Promise.all(pending);else await sleep(240);
 sprites.forEach(el=>el.remove());
 if(epoch!==state.epoch||state.page!=='game')return;
 paintCells(stage.cells);
 board.querySelectorAll('.nut-visual').forEach(el=>{el.style.visibility='';});
}
async function cascadeAnimation(stage,epoch,wave=1){
 if(state.page!=='game'||epoch!==state.epoch)return;
 if(stage.kind==='repair'||stage.kind==='hazard'){playSFX(stage.kind==='repair'?'shuffle':stage.expired?.length?'hazard':'crack');paintCells(stage.cells);return;}
 if(stage.kind==='transport'){playSFX(stage.mode==='portal'?'portal':'transport');await transportAnimation(stage,epoch);return;}
 const board=screen.querySelector('.board');if(!board)return;
 // Never fade an ice-shielded nut that survived the hit.
 // Only nuts ACTUALLY removed shake and explode. Cracked-but-surviving nuts stay
 // visible beneath their shields. Each cascade wave has its own Nutsplosion.
 const plan=window.NutFX?.planCascade(stage,wave);
 const removed=plan?.removed||stage.clear.filter(i=>stage.before?.[i]?.type!=null&&stage.afterClear?.[i]?.type===null).map(index=>({index}));
 const exploding=removed.map(item=>board.querySelector(`[data-cell="${item.index}"]`)).filter(Boolean);
 const reduced=reducedMotion();
 if(!reduced)exploding.forEach(tile=>tile.classList.add('nut-shaking'));
 const iceMotion=window.NutIceFX?.animate(stage,board,{
  active:()=>state.page==='game'&&epoch===state.epoch,
  reducedMotion:reduced
 });
 if(!reduced)await sleep(155);
 if(state.page!=='game'||epoch!==state.epoch)return;
 exploding.forEach(tile=>{tile.classList.remove('nut-shaking');if(!reduced)tile.classList.add('nut-exploding');});
 window.NutFX?.burstCascade?.(stage,board,wave);
 window.NutSFX?.burst(removed.length);
 for(const [field,cue] of [['lock','chain'],['chest','chest'],['jam','crack'],['fuse','hazard']]){
  let hits=0;for(let i=0;i<(stage.before?.length||0);i++)if((stage.before[i]?.[field]||0)>(stage.afterClear?.[i]?.[field]||0))hits++;
  for(let i=0;i<Math.min(6,hits);i++)playSFX(cue,{delay:i*.022,level:hits>6?.5:.75});
 }
 if(!reduced)await Promise.all([sleep(200),iceMotion||Promise.resolve()]);
 else if(iceMotion)await iceMotion;
 if(state.page!=='game'||epoch!==state.epoch)return;
 // New specials can be formed during the clear; paint them before cloning falling tiles.
 paintCells(stage.afterClear);
 const tasks=[],hidden=[],overlays=[];
 const rect=board.getBoundingClientRect();
 for(const fall of stage.falls){
  const target=board.querySelector(`[data-cell="${fall.to}"]`);if(!target)continue;
  const to=target.getBoundingClientRect(),from=fall.from>=0?board.querySelector(`[data-cell="${fall.from}"]`):null;
  const source=from?.querySelector('.nut-visual'),fly=document.createElement('span');
  fly.className='falling-nut';fly.style.left=(to.left-rect.left)+'px';fly.style.top=(to.top-rect.top)+'px';
  fly.style.width=to.width+'px';fly.style.height=to.height+'px';
  fly.innerHTML=source?source.outerHTML:nutVisual({type:fall.type,special:fall.special});
  board.appendChild(fly);overlays.push(fly);
  const startY=from?from.getBoundingClientRect().top-to.top:(fall.startRow-Math.floor(fall.to/state.game.cfg.width))*(to.height+1);
  const duration=Math.min(760,360+Math.abs(startY)*.38);
  if(fly.animate&&!reducedMotion()){
   const animation=fly.animate([{transform:`translateY(${startY}px)`},{transform:'translateY(0)'}],{duration,easing:'cubic-bezier(.2,.65,.2,1)',fill:'forwards'});
   tasks.push(animation.finished.catch(()=>{}));
  }
  hidden.push(fall.to);
 }
 // The fixed grid is never rebuilt. Only moved nuts are hidden beneath their animated sprites.
 paintCells(stage.cells);exploding.forEach(tile=>tile.classList.remove('nut-exploding'));
 hidden.forEach(i=>{const v=board.querySelector(`[data-cell="${i}"] .nut-visual`);if(v)v.style.visibility='hidden';});
 if(!reducedMotion())await (tasks.length?Promise.all(tasks):sleep(120));
 overlays.forEach(el=>el.remove());
 if(epoch!==state.epoch)return;
 hidden.forEach(i=>{const v=board.querySelector(`[data-cell="${i}"] .nut-visual`);if(v)v.style.visibility='';});
}
async function applyMove(result){
 if(!result.valid){notice('Choose two neighboring nuts.');return;}
 const epoch=++state.epoch;state.animating=true;selectCell(-1);
 try{
  await swapAnimation(result.swap,epoch);
  if(epoch!==state.epoch||state.page!=='game')return;
  const first=result.stages?.[0]?.before||E.snapshot(state.game).cells;
  paintCells(first);screen.querySelectorAll('.nut-visual').forEach(el=>{el.style.visibility='';});
  let wave=0;
  for(const stage of result.stages||[]){if(stage.kind==='cascade')wave++;await cascadeAnimation(stage,epoch,wave);if(epoch!==state.epoch||state.page!=='game')return;}
  paintCells(E.snapshot(state.game).cells);paintStats();
  concludeMove(result);
 }finally{if(epoch===state.epoch){reconcileBoardNuts();state.animating=false;}}
}
function outcome(){const g=state.game,won=state.outcome==='win',stars=g.moves>10?3:g.moves>3?2:1,trial=T.profile(g.level),next=trial?(trial.local===30?null:g.level+1):(g.level>=1000?null:g.level+1);
 return `<div class="outcome-screen"><div class="outcome-symbol">${won?'🏆':'💔'}</div><h1>${won?'LEVEL COMPLETE!':'OUT OF MOVES!'}</h1>
 <p>${won?'YOUR NUTS ARE LEGENDARY!':'A devastating development for the premium nut economy.'}</p>
 <div class="outcome-stars">${won?'★'.repeat(stars)+'☆'.repeat(3-stars):'☆ ☆ ☆'}</div>
 <div class="outcome-numbers"><span>Level <b>${g.level}</b></span><span>Score <b>${g.score.toLocaleString()}</b></span><span>Objective <b>${objectiveDisplay(g)}</b></span></div>
 <div class="actions">${won?(next===null?`<button class="btn secondary" data-nav="campaign">${trial?'AREA TRIALS CLEARED':'CAMPAIGN COMPLETE'}</button>`:`<button class="btn green" data-action="play" data-level="${next}">NEXT ${trial?'TRIAL':'LEVEL'} →</button>`):`${freeClaimButton("moves","continue-level","REDEEM +5 MOVES")}<button class="btn secondary" data-action="restart">RETRY LEVEL</button>`}
 <button class="btn secondary" data-nav="campaign">LEVEL MAP</button>${won?'<button class="btn secondary" data-nav="homestead">🏡 HOMESTEAD</button>':''}</div>
 ${won?(trial?'<p class="muted">One-time trial rewards paid automatically</p>':'<p class="muted">Reward: 500 Golden Nuts + 10 Gems</p>'):'<p class="muted">Daily moves carry over; retrying never refills them.</p>'}${won&&state.levelReward?`<p class="earned-power">${state.levelReward}</p>`:''}</div>`;
}

function escPurchase(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));}
function purchaseList(lines){return '<ul class="purchase-inventory">'+lines.map(line=>'<li>'+escPurchase(line)+'</li>').join('')+'</ul>';}
function purchaseDialog(){
 const p=state.purchasePending;if(!p)return '';
 const d=p.details;
 return '<div class="purchase-overlay"><section class="purchase-confirm-dialog" role="dialog" aria-modal="true" aria-label="Confirm purchase and exact contents">'+
 '<div class="purchase-confirm-head"><b>'+escPurchase(d.name)+'</b><button class="btn ghost" data-action="purchase-cancel">✕ CLOSE</button></div><b class="purchase-confirm-label">EXACT CONTENTS AND COSTS</b>'+
 purchaseList(d.lines)+(d.odds?'<details class="purchase-odds" open><summary>ACTUAL CATCH ODDS · '+d.odds.length+' SPECIES</summary>'+
 '<div class="purchase-odds-scroll">'+d.odds.map(x=>'<div><span>'+escPurchase(x.name)+'</span><b>'+(100*x.probability).toFixed(5)+'%</b></div>').join('')+'</div>'+
 '<small>Probabilities are computed for the disclosed rod and bait; percentages are rounded. The fishing minigame must still be won to keep or sell the catch.</small></details>':'')+
 '<div class="purchase-confirm-actions"><button class="btn green" data-action="purchase-confirm">CONFIRM PURCHASE</button><button class="btn ghost" data-action="purchase-cancel">CANCEL</button></div></section></div>';
}
const CONFIRMED_PURCHASES=new Set(['booster-buy','fish-bait-buy','fish-craft','fish-trade','fish-rod-buy','fish-rod-repair','fish-upgrade','homestead-tier-upgrade','homestead-build','homestead-renovate']);
function beginCheckout(index,from=state.page){
 if(!Number.isInteger(index)||!offers[index])return;
 if(index===4&&saved.vip){nav('vip-benefits');return;}
 if(index===6&&saved.hearts>=5){notice('HEARTS ALREADY FULL');return;}
 if(index===6||index===7){
  const kind=index===6?'hearts':'moves',remaining=freeRemaining(kind);
  if(remaining){notice('FREE REWARD READY IN '+B.countdown(remaining));return;}
 }
 state.epoch++;state.animating=false;state.checkout=index;state.checkoutFrom=from;state.checkoutStep=0;state.discountOffer=null;state.checkoutPack=index<6?P.actualPack(saved,'shop'+index):{};state.page='checkout';render();
}
function checkout(){const p=offers[state.checkout];if(!p)return '<p>Offer unavailable.</p>';
 const review=state.checkoutStep===0,discounted=state.discountOffer===state.checkout;
 const amountCents=Math.round((Number.parseFloat(String(p[4]).replace(/[^0-9.]/g,''))||0)*100);
 const freeOffer=amountCents===0;
 // Round fictional 50% discounts in integer cents: 99 cents becomes 50.
 const price=freeOffer?'FREE':discounted?'$'+(Math.round(amountCents/2)/100).toFixed(2):p[4];
 const discountMarkup=freeOffer?'<p class="muted">Always free. No ad required.</p>':discounted?'<p class="fake-ad-discount">FAKE AD · 50% OFF ACTIVE</p>':'<button class="btn secondary wide" data-action="ad-discount">📺 WATCH A FAKE AD · 50% OFF</button>';
 const breakdownMarkup=freeOffer?'<div class="checkout-price"><span>Always-free gameplay</span><strong>FREE</strong></div>':`<div class="checkout-price"><span>Package ${discounted?"· FAKE AD −50%":""}</span><strong class="cross">${price}</strong></div><div class="checkout-price"><span>Mandatory Nutbuster generosity adjustment</span><b>−100%</b></div>`;
 const description=state.checkout===6?'Restore to five hearts · claim every 12 hours':state.checkout===7?'Add five moves · claim every 12 hours':state.checkout===8?'Platinum Royal avatar · Platinum Fountain · Diamond Throne':p[2].toLocaleString()+' Golden Nuts · '+p[3].toLocaleString()+' Gems · '+boosterSummary(state.checkoutPack);
 return `<div class="checkout-screen"><div class="topline"><button class="btn ghost" data-action="checkout-back">← BACK</button><h2>${review?'PACKAGE DETAILS':'NUT CHECKOUT'}</h2></div>
 <div class="panel checkout-sheet"><h1>${review?'CONFIRM YOUR PACKAGE':'YOUR ORDER TOTAL'}</h1><div class="checkout-item"><img class="checkout-offer-icon" src="${offerSprites[state.checkout]}" alt="" loading="lazy"><div><b>${p[0]}</b><small>${description}</small></div></div><section class="checkout-disclosure"><b>EXACT REWARDS · GUARANTEED</b>${purchaseList(Purchases.offer(state.checkout,offers,state.checkoutPack,E).lines)}</section>
 ${review?`<div class="checkout-price"><span>Advertised price</span><strong>${price}</strong></div>${discountMarkup}<p class="muted">Fixed contents, no countdown, no recurring charges.</p>
 <button class="btn green wide" data-action="checkout-review">PROCEED TO CHECKOUT →</button>`:
 `${breakdownMarkup}
 <div class="checkout-total"><span>TOTAL DUE</span><strong>FREE</strong><small>$0.00</small></div>
 <p class="muted">Parody checkout. No payment details, billing connection, or actual transaction.</p><button class="btn green wide" data-action="checkout-complete">COMPLETE ORDER · FREE</button>`}
 </div></div>`;
}
// One dedicated premium-package illustration per offer; reuse only for that same offer's checkout.
const shopSprites=Object.freeze([
 'art/additions/economy/grand-bundle.png',
 'art/nutvale/mining-economy/currency/gemmed-currency-chest.png',
 'art/additions/economy/mystery-gift.png',
 'art/additions/economy/locked-chest.png',
 'art/additions/economy/vip-shield.png',
 'art/additions/economy/booster-pack.png'
]);
const offerSprites=Object.freeze([...shopSprites,
 'art/additions/economy/energy-heart.png',
 'art/additions/economy/hourglass.png',
 'art/additions/ui/treasure.png'
]);
// Fictional previews only. Keep indices stable: they map to existing reward and checkout actions.
const products=[['GIGANTIC NUT PACKAGE','🌰',50000,250,'$4.99'],['RIDICULOUSLY PREMIUM GEMS','💎',2000,2000,'$9.99'],['ROYAL SQUIRREL BUNDLE','🐿️',9999,500,'$3.99'],['HUNDRED YEAR CHEST','🧰',10000,150,'$1.99'],['ABSOLUTELY NECESSARY VIP · LIFETIME','👑',1000,100,'$2.99'],['NUTTY BOOSTER CRATE','🎲',3000,30,'$0.99']];
const offers=[...products,['EMERGENCY HEART REFILL','❤️',0,0,'$0.00'],['EXTRA FIVE MOVES','➕',0,0,'$0.00'],['EXCLUSIVE ROYAL MANOR KIT','👑',0,0,'$2.99']];
function nutToBoosterShop(){
 const cards=E.BOOSTERS.map(id=>{
  const price=P.BOOSTER_PRICES[id],unlocked=P.unlocked(saved,id),stock=P.count(saved,id),available=unlocked&&stock<999999&&saved.coins>=price;
  return '<div class="nut-booster-offer"><b>'+E.BOOSTER_META[id].label+'</b><small>×'+stock+' owned · '+(unlocked?FRate(id)+' 🪱 / booster':'LV '+P.LEVEL_BY_TOOL[id]+' to unlock')+'</small>'+
   '<button class="btn secondary" data-action="booster-buy" data-booster="'+id+'" title="Pay '+price+' Golden Nuts; receive exactly one '+E.BOOSTER_META[id].label+' booster; guaranteed, no random chance" '+(available?'':'disabled')+'>BUY · '+price.toLocaleString()+' GOLDEN NUTS</button></div>';
 }).join('');
 return '<details class="nut-booster-shop"><summary><b>🥜 GOLDEN NUTS → BOOSTERS</b><small>'+saved.coins.toLocaleString()+' Golden Nuts · Spend to stock fishing power-ups</small></summary>'+
 '<div class="nut-booster-grid">'+cards+'</div><small>Buy a booster with earned Golden Nuts, exchange it for Honest Worms, then fish for Wharf Dollars.</small>'+
 '<button class="btn ghost" data-nav="bait-shop">→ WHARF BAIT SHOP</button></details>';
}
function FRate(id){return window.NutFishing?.BOOSTER_BAIT?.[id]||0;}
function shop(){
 const holdCards=Object.entries(P.HOLD_ITEMS).map(([id,item])=>{
  const pending=state.holdOffer===id;
  return `<div class="hold-offer"><img src="${item.art}" alt="" draggable="false"><div class="hold-offer-info"><b>${item.label}</b><small>${item.drops} gravity drop${item.drops===1?'':'s'} · held-nut matches ×3 · Owned ${P.holdCount(saved,id)}</small></div><div class="hold-offer-buy"><b>${item.gems} <img src="art/additions/economy/prismatic-acorn.png" alt="gems"></b><button class="btn secondary" data-action="hold-offer" data-hold-id="${id}" title="Spend ${item.gems} Gems for exactly one ${item.label} held-nut power-up; ${item.drops} gravity drops, held matches ×3">BUY</button></div>${pending?`<div class="hold-confirm" role="group" aria-label="Confirm ${item.label} purchase"><span>Spend ${item.gems} Gems; receive exactly 1 ${item.label} power-up. Hold one selected nut for ${item.drops} gravity drops; held matches score ×3. Guaranteed, no randomness. Balance: ${saved.gems.toLocaleString()} Gems.</span><button class="btn green" data-action="hold-buy" data-hold-id="${id}">CONFIRM</button><button class="btn ghost" data-action="hold-cancel">CANCEL</button></div>`:''}</div>`;
 }).join('');
 return `<div class="topline"><h2>THE PREMIER NUT EMPORIUM</h2>${state.game&&!state.game.won&&!state.game.lost?'<button class="btn ghost" data-nav="game">← GAME</button>':'<span class="pill">OPTIONAL BUNDLES</span>'}</div>${promoSection(true)}<div class="panel hold-store"><div class="hold-store-title"><b>GRAVITY HOLD POWER-UPS</b><span>Gems ${saved.gems.toLocaleString()}</span></div>${holdCards}</div>${nutToBoosterShop()}${window.NutFishingUI?.exchangeSheet?.(saved,E,P,false)||''}<p class="muted">Transparent contents, one-time bundles, no subscriptions or purchase countdowns.</p><div class="shop-grid">${products.map((p,i)=>`<div class="panel shop-item"><img class="shop-offer-icon" src="${shopSprites[i]}" alt="" loading="lazy"><h3>${p[0]}</h3><p class="muted">+${p[2].toLocaleString()} nuts · +${p[3].toLocaleString()} gems</p><p class="pack-contents">${boosterSummary(P.actualPack(saved,'shop'+i))}</p><details class="offer-disclosure"><summary>EXACT CONTENTS · NO RANDOM CHANCE</summary>${purchaseList(Purchases.offer(i,offers,P.actualPack(saved,'shop'+i),E).lines)}</details><div class="offer-price">${p[4]}</div>${i===4?'<small>Daily +5 moves · 4 boosters · +250 Golden Nuts. Lifetime.</small>':''}<button class="btn green" data-action="${i===4&&saved.vip?'vip-benefits':'claim'}" data-item="${i}">${i===4&&saved.vip?'OWNED · VIEW BENEFITS':'BUY PACKAGE'}</button></div>`).join('')}</div>`;
}
function rewards(){const tiers=P.challengeRewards(saved),next=P.nextUnlock(saved),elemental=R.summary(saved);let mins=Math.max(0,Math.ceil((saved.chestReadyAt-Date.now())/60000));return `<div class="topline"><h2>REWARDS, REWARDS, REWARDS</h2></div><div class="panel reward-inventory"><b>FREE CLAIMS · 12-HOUR INDEPENDENT COOLDOWNS</b><p class="muted">Redeem manually when ready. Unlike the automatic 24-hour move refill, these do not stockpile.</p>${freeClaimButton("hearts","refill","REDEEM HEART REFILL")} ${freeClaimButton("moves","bonus-moves","REDEEM +5 MOVES")}</div>${promoSection()}<div class="panel reward-inventory"><b>BOOSTER VAULT</b><p class="muted">${inventorySummary()}</p>${next?'<p class="muted">Next power: '+E.BOOSTER_META[next.id].label+' · clear level '+next.level+'</p>':''}</div>
 <div class="panel challenge-rewards"><b>ELEMENTAL TRIAL REWARDS</b><p class="muted">${elemental.completed}/150 trials · ${elemental.relics.length}/15 relics · ${movesLeft()} daily moves left</p><div class="elemental-relics">${elemental.relics.map(id=>'<img src="art/primary/nuts/elemental/'+id+'.png" alt="'+id+' relic" title="'+id+' relic" loading="lazy">').join('')}</div></div><div class="panel challenge-rewards"><b>CHALLENGE REWARD TRACK</b><p class="muted">${P.challengeProgress(saved)}/25 challenge milestones cleared</p>
 <div class="challenge-tiers">${tiers.map(t=>`<div class="challenge-tier"><b>${t.requirement} ★</b><small>${boosterSummary(t.contents)}</small><button class="btn secondary" data-action="challenge-claim" data-tier="${t.index}" ${t.ready?'':'disabled'}>${t.claimed?'CLAIMED':t.ready?'CLAIM':'LOCKED'}</button></div>`).join('')}</div></div>
 <div class="reward-lines"><div class="panel"><img class="reward-feature-icon" src="art/additions/economy/piggy-bank.png" alt="" loading="lazy"><b>PIGGY BANK</b><p class="muted">Your vault is bursting. Premium extraction available.</p><button class="btn green" data-action="pig">SMASH PIG</button></div><div class="panel"><img class="reward-feature-icon" src="art/additions/economy/timed-chest.png" alt="" loading="lazy"><b>3-HOUR TREASURE CHEST</b><p class="muted">${mins===0?'Timer complete!':mins+' minutes remaining. Instant unlock available.'}</p><button class="btn green" data-action="chest">${mins===0?'OPEN CHEST':'OPEN INSTANTLY'}</button></div><div class="panel"><img class="reward-feature-icon" src="art/additions/economy/friends-gift.png" alt="" loading="lazy"><b>FRIEND REFERRAL</b><p class="muted">Invite a friend. Or nominate yourself.</p><button class="btn green" data-action="friend">I AM MY OWN FRIEND</button></div><div class="panel"><img class="reward-feature-icon" src="art/additions/economy/squirrel-pass.png" alt="" loading="lazy"><b>ELITE PREMIUM SEASON PASS</b><p class="muted">Premium track, supreme track, and downright suspicious track.</p><button class="btn green" data-action="pass">UNLOCK PREMIUM</button></div><div class="panel"><img class="reward-feature-icon" src="art/additions/economy/squirrel-cash.png" alt="" loading="lazy"><b>PARODY REWARDED AD</b><p class="muted">Watch a squirrel commercial for 750 Golden Nuts and one Hammer. One ad bonus per day. No real advertisers.</p><button class="btn green" data-action="ad-daily" ${saved.fakeAdDailyDay===Ads?.dayKey()?"disabled":""}>${saved.fakeAdDailyDay===Ads?.dayKey()?"CLAIMED TODAY":"WATCH AND EARN"}</button></div><div class="panel"><img class="reward-feature-icon" src="art/additions/economy/daily-calendar.png" alt="" loading="lazy"><b>DAILY LOGIN STREAK</b><p class="muted">Streak: ${saved.streak} · Missed days are forgiven.</p><button class="btn green" data-action="daily">CLAIM TODAY</button></div><div class="panel"><img class="reward-feature-icon" src="art/additions/economy/open-lootbox.png" alt="" loading="lazy"><b>CHOICE LOOT BOX</b><p class="muted">Fixed reward: ${boosterSummary(P.actualPack(saved,'loot'))} · +1,000 Golden Nuts · +100 Gems. Guaranteed 100%; not random.</p><button class="btn green" data-action="loot">GIVE ME THE GOOD ONE</button></div></div><p class="tip">Premium rewards refresh whenever you need another hit of excitement.</p>`;}

function homestead(){
 const h=H.ensure(saved),status=H.stats(saved),edit=state.homesteadEditing,selection=edit?state.homesteadSelection:null;
 const equipped=H.AVATARS.find(a=>a.id===h.avatar)||H.AVATARS[0];
 const costume=A.current(saved),costumeTotals=A.summary(saved);
 const costumeCard=c=>{
  const has=A.owned(saved,c.id),active=c.id===costume.id;
  return `<button class="nutvale-outfit ${active?'selected':''} ${has?'':'locked'}" data-action="homestead-outfit" data-id="${c.id}" ${has?'':'disabled'} aria-label="${c.name}, ${has?'owned':'clear level '+c.level+' to unlock'}" aria-pressed="${active}"><span class="nutvale-outfit-thumb"><span aria-hidden="true">👩🏻‍🦰</span><img src="${c.art}" loading="lazy" alt="" onerror="this.hidden=true"></span><b>${c.name}</b><small>${has?(active?'EQUIPPED':'WEAR'):'LV '+c.level}</small></button>`;
 };
 const progressionOutfits=A.TIERS.map(costumeCard).join('');
 const seasonalOutfits=A.COSTUMES.filter(c=>c.category==='seasonal').map(costumeCard).join('');
 const house=H.HOUSES.find(a=>a.id===h.house)||H.HOUSES[0];
 const actualTier=H.tierByNumber(h.tier)||H.HOUSE_TIERS[0];
 const preview=H.tierByNumber(state.homesteadPreview)||actualTier;
 const nextTier=H.tierByNumber(h.maxTier+1);
 const previewOwned=preview.tier<=h.maxTier;
 const selectedRenovations=H.renovationRanks(saved,preview.tier);
 const residenceFlair=tier=>H.RENOVATIONS.map(item=>{
  const rank=H.renovationRanks(saved,tier)[item.id];
  return rank?'<span class="homestead-flair-'+item.id+' rank-'+rank+'" title="'+item.name+' '+rank+'/5">'+item.icon+'<sup>'+rank+'</sup></span>':'';
 }).join('');
 const renovations=previewOwned?H.RENOVATIONS.map(item=>{
  const rank=selectedRenovations[item.id],offer=H.renovationOffer(saved,preview.tier,item.id);
  const complete=!offer.valid&&offer.reason==='complete';
  const eligible=offer.valid&&(offer.level===0||Number(saved.stars?.[offer.level])>0);
  return '<div class="homestead-renovation-row"><span class="homestead-renovation-name">'+item.icon+' '+item.name+'</span>'+
   '<span class="homestead-renovation-pips" aria-label="'+rank+' of 5 completed">'+
   Array.from({length:H.RENOVATION_STEPS},(_,i)=>'<i class="'+(i<rank?'done':'')+'"></i>').join('')+'</span>'+
   (complete?'<small>MAXED</small>':'<button class="btn ghost" data-action="homestead-renovate" data-tier="'+preview.tier+'" data-id="'+item.id+'" '+(eligible?'':'disabled')+'>'+
    (eligible?'UPGRADE · '+offer.cost.toLocaleString()+' 🌰':'LV '+offer.level)+'</button>')+'</div>';
 }).join(''):'<small class="homestead-renovation-locked">Build this residence before renovating it.</small>';

 const pet=H.PETS.find(a=>a.id===h.pet)||H.PETS[0];
 const zone=H.ZONES.find(z=>z.id===state.homesteadZone&&H.zoneUnlocked(saved,z.id))||H.ZONES[0];
 const placedIds=new Set(Object.values(h.placed));
 const zoneButtons=H.ZONES.map(z=>{
  const open=H.zoneUnlocked(saved,z.id),selected=zone.id===z.id;
  return `<button class="homestead-zone ${selected?'selected':''} ${open?'':'locked'}" data-action="homestead-zone" data-zone="${z.id}" aria-pressed="${selected}" aria-label="${z.name}; ${open?'open':'clear level '+z.level+' to unlock'}">${z.icon} ${z.name}<small>${open?z.count+' plots':'LV '+z.level}</small></button>`;
 }).join('');
 const plots=Array.from({length:zone.count},(_,i)=>{
  const slot=zone.start+i,id=h.placed[slot],item=H.DECOR.find(d=>d.id===id),occupied=!!item;
  if(!edit)return `<div class="homestead-plot homestead-display-plot ${occupied?'filled':'empty'}" ${occupied?'role="img" aria-label="'+item.name+'"':'aria-hidden="true"'}>${item?'<strong>'+item.icon+'</strong>':''}</div>`;
  return `<button class="homestead-plot ${occupied?'filled':''} ${selection?'target':''}" data-action="homestead-slot" data-slot="${slot}" aria-label="${zone.name} plot ${i+1}: ${item?item.name:'empty'}; ${selection?'place selected item':'tap to remove displayed item'}"><strong>${item?item.icon:'＋'}</strong><small>${item?item.name:'PLOT '+(i+1)}</small></button>`;
 }).join('');
 const titles=H.AVATARS.map(a=>{
  const has=H.avatarOwned(saved,a.id),active=h.avatar===a.id;
  return `<button class="nutvale-legacy-title ${active?'selected':''} ${has?'':'locked'}" data-action="homestead-avatar" data-id="${a.id}" ${has?'':'disabled'}>${a.name}<small>${active?'ACTIVE':has?'SELECT':a.premium?'ROYAL KIT':'LV '+a.level}</small></button>`;
 }).join('');
 const pets=H.PETS.map(a=>{
  const has=H.petOwned(saved,a.id),active=h.pet===a.id;
  return `<button class="homestead-avatar ${has?'':'locked'} ${active?'selected':''}" data-action="homestead-pet" data-id="${a.id}" ${has?'':'disabled'} aria-label="${a.name}, ${has?'available':'locked'}"><strong>${a.icon}</strong><b>${a.name}</b><small>${active?'FOLLOWING':has?'CHOOSE':'LV '+a.level}</small></button>`;
 }).join('');
 const residence=`<div class="homestead-residence-controls"><button class="btn ghost" data-action="homestead-tier-browse" data-dir="-1" ${preview.tier===1?'disabled':''} aria-label="Previous design">◀</button>
 <div><b>TIER ${preview.tier}/40 · ${preview.name}</b><small>${previewOwned?'BUILT · AVAILABLE':preview.level+' LEVEL CLEAR TO UNLOCK · '+preview.cost.toLocaleString()+' NUTS'}</small></div>
 <button class="btn ghost" data-action="homestead-tier-browse" data-dir="1" ${preview.tier===40?'disabled':''} aria-label="Next design">▶</button></div>
 <div class="homestead-preview"><img src="${preview.art}" alt="${preview.name}, tier ${preview.tier}" loading="lazy"><div class="homestead-flair" aria-hidden="true">${residenceFlair(preview.tier)}</div><span class="homestead-preview-tag">${previewOwned?'OWNED':'PREVIEW'}</span></div>
 <div class="homestead-residence-actions">${previewOwned&&preview.tier!==h.tier?`<button class="btn secondary" data-action="homestead-tier-equip" data-tier="${preview.tier}">DISPLAY THIS DESIGN</button>`:''}
 ${nextTier?`<button class="btn green" data-action="homestead-tier-upgrade">UPGRADE TO TIER ${nextTier.tier} · ${nextTier.cost.toLocaleString()} 🌰</button>`:'<span class="pill">MAXIMUM PREMIUM RESIDENCE ACHIEVED</span>'}</div>
 <div class="homestead-tier-progress" role="progressbar" aria-valuenow="${h.maxTier}" aria-valuemin="1" aria-valuemax="40" aria-label="Highest building tier"><span style="width:${(h.maxTier/40*100).toFixed(1)}%"></span></div>
 <small class="homestead-tier-hint">BUILT ${h.maxTier}/40 · DISPLAYING TIER ${h.tier}${nextTier?' · NEXT REQUIRES LEVEL '+nextTier.level:' · CAMPAIGN COMPLETE'}</small><div class="homestead-renovations"><h3>RENOVATIONS · ${H.renovationSummary(saved,preview.tier).houseTotal}/25 THIS HOUSE</h3>${renovations}</div>`;
 const collection=edit?[...H.DECOR].sort((a,b)=>Number(H.owned(saved,b.id))-Number(H.owned(saved,a.id))).map(item=>{
  const has=H.owned(saved,item.id),used=placedIds.has(item.id),active=selection===item.id;
  const gate=item.set?'SET PRIZE':item.premium?'PREMIUM':'LV '+item.level;
  return `<button class="homestead-collectible ${has?'':'locked'} ${active?'selected':''}" data-action="homestead-select" data-id="${item.id}" ${has?'':'disabled'} aria-label="${item.name}: ${has?used?'displayed':'owned':'locked'}"><strong>${item.icon}</strong><b>${item.name}</b><small>${has?used?'DISPLAYED':active?'SELECTED':'PLACE':gate}</small></button>`;
 }).join(''):'';
 const collections=status.collections.map(set=>{
  const prize=H.DECOR.find(d=>d.id===set.reward);
  return `<div class="homestead-set ${set.complete?'completed':''}"><span>${set.icon}</span><div><b>${set.name}</b><small>${set.have}/${set.total} · ${set.complete?'UNLOCKED '+(prize?.name||'reward'):'REWARD: '+(prize?.name||'secret')}</small></div></div>`;
 }).join('');
 const cabinet=H.ACHIEVEMENTS.map(a=>{
  const earned=status.achievements.some(item=>item.id===a.id);
  const kind={score:'Best score',wins:'Levels cleared',threeStars:'Three-star finishes',stars:'Stars earned',sets:'Completed sets',pets:'Unlocked companions',zones:'Estate grounds'}[a.kind];
  return `<div class="homestead-award ${earned?'':'locked'}" title="${a.name}: ${kind} ${a.need}"><span class="emoji">${a.icon}</span><span>${a.name}<small>${earned?' · EARNED':' · '+kind+' '+a.need}</small></span></div>`;
 }).join('');
 const royal=h.purchases['royal-estate']===true;
 return `<div class="homestead-top"><div><h1>🏡 NUTVALE HOMESTEAD</h1><small>${status.tier} · 👩🏻‍🦰 ${costume.name} · ${equipped.name}</small></div><div class="homestead-actions"><button class="btn secondary" data-nav="mines">⛏️ NUTVALE MINES</button><button class="btn secondary" data-nav="wharf">🎣 FISHING WHARF</button><button class="btn secondary" data-nav="aquarium">🐠 AQUARIUM</button><button class="btn secondary" data-nav="fish-records">🏆 FISH RECORDS</button><button class="btn ghost" data-action="homestead-plate">↗ PRESTIGE PLATE</button><button class="btn ghost" data-action="invite">↗ INVITE</button><button class="btn ghost" data-nav="campaign">LEVELS →</button></div></div>
 <div class="homestead-stats"><span>🏆 ${status.wins}/1000 cleared</span><span>⭐ ${status.stars} stars</span><span>🎖 ${status.achievements.length}/${H.ACHIEVEMENTS.length} awards</span><span>🧩 ${status.setCount}/${H.SETS.length} sets</span><span>📈 ${status.bestScore.toLocaleString()} best</span><span>🛠 ${status.renovations}/1000 renovated</span><span>👗 ${costumeTotals.unlocked}/60 outfits</span></div>
 <div class="homestead-layout">
 <div class="homestead-yard-column"><div class="homestead-zone-list">${zoneButtons}</div>
 <div class="homestead-yard zone-${zone.id}" data-estate-zone="${zone.id}"><div class="homestead-yard-heading"><b>${zone.icon} ${zone.name}</b><button class="btn ${edit?'secondary':'ghost'}" data-action="homestead-edit" aria-pressed="${edit}">${edit?'✓ DONE EDITING':'✎ EDIT BACKYARD'}</button></div><div class="homestead-scenery" aria-hidden="true"><span>${zone.icon}</span><small>${zone.description}</small></div>
 <div class="homestead-house"><span class="house homestead-house-art"><img src="${actualTier.art}" alt="${actualTier.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><span hidden>${house.icon}</span><span class="homestead-flair homestead-flair-yard" aria-hidden="true">${residenceFlair(actualTier.tier)}</span></span><span>${actualTier.name.toUpperCase()}<small>HOUSE TIER ${actualTier.tier}/40 · ${zone.name}</small></span><span class="nutvale-estate-avatar" role="img" aria-label="Your human avatar: ${costume.name}"><span aria-hidden="true">👩🏻‍🦰</span><img src="${costume.art}" alt="" loading="lazy" onerror="this.hidden=true"></span><span class="homestead-visitor" role="img" aria-label="Companion: ${pet.name}">${pet.icon}</span></div>
 <div class="homestead-plots ${edit?'editing':'viewing'}">${plots}</div>${edit?`<p class="homestead-instructions">${selection?'SELECT A PLOT TO PLACE · TAP ITEM TO CANCEL':'CHOOSE AN ITEM BELOW, THEN A PLOT · TAP OCCUPIED PLOT TO STORE'}</p>`:''} </div>
 ${edit?`<div class="homestead-section homestead-editor"><div class="homestead-editor-head"><b>PLACEABLE ITEMS · ${status.decorOwned}/${H.DECOR.length} OWNED</b><small>${selection?'TAP A PLOT':'CHOOSE AN ITEM'}</small></div><div class="homestead-scroll homestead-collection-scroll" role="group" aria-label="Placeable backyard decorations">${collection}</div></div>`:''}
 <div class="homestead-premium"><div><b>👑 ROYAL MANOR KIT</b><p>Platinum portrait, fountain, and diamond throne · <strong>One-time $2.99</strong></p></div><button class="btn green" data-action="homestead-offer" ${royal?'disabled':''}>${royal?'OWNED':'BUY NOW'}</button></div></div>
 <div class="homestead-side">
 ${window.NutFishingUI?.aquariumPreview?.(saved)||''}
 ${window.NutFishingUI?.trophyPreview?.(saved)||''}
 <div class="homestead-section"><h2>RESIDENCE · 🌰 ${saved.coins.toLocaleString()} · ${h.maxTier}/40 BUILT</h2>${residence}</div>
 <div class="homestead-section"><h2>HUMAN AVATAR · ${costume.name}</h2>
  <div class="nutvale-avatar-showcase"><div class="nutvale-avatar-portrait"><span aria-hidden="true">👩🏻‍🦰</span><img src="${costume.art}" alt="${costume.name}, the Nutvale protagonist" onerror="this.hidden=true"></div>
  <div class="nutvale-avatar-status"><b>${costume.name}</b><small>${costume.category==='seasonal'?'PERMANENT SEASONAL COLLECTION':'PROGRESSION COSTUME'} · ${costumeTotals.unlocked}/60 OWNED</small></div></div>
  <h3 class="nutvale-avatar-subtitle">PROGRESSION · ${A.TIERS.filter(c=>A.owned(saved,c.id)).length}/40</h3><div class="nutvale-outfit-list">${progressionOutfits}</div>
  <h3 class="nutvale-avatar-subtitle">SEASONAL ARCHIVE · ${costumeTotals.seasonal}/20</h3><div class="nutvale-outfit-list">${seasonalOutfits}</div>
  <div class="nutvale-avatar-titles"><small>PRESTIGE TITLE · ${equipped.name}</small><div class="homestead-scroll">${titles}</div></div></div>
 <div class="homestead-section"><h2>COMPANION · ${pet.name}</h2><div class="homestead-scroll">${pets}</div></div>
 <div class="homestead-section"><h2>CURATED COLLECTIONS · ${status.setCount}/${H.SETS.length}</h2><div class="homestead-sets">${collections}</div></div>
 <div class="homestead-section"><h2>TROPHY CABINET · ${status.achievements.length} EARNED</h2><div class="homestead-awards">${cabinet}</div></div>
 </div></div>`;
}
function renderHomesteadEditor(){
 const scrollX=screen.querySelector?.('.homestead-collection-scroll')?.scrollLeft||0;
 render();
 const scroller=screen.querySelector?.('.homestead-collection-scroll');
 if(scroller)scroller.scrollLeft=scrollX;
}

function codex(inLevel=false){
 const C=window.NutCodex;
 if(!C)return '<p>Nut index unavailable in this build.</p>';
 const group=state.codexTab||'blockers';
 const groups=C.groups.map(([id,label])=>'<button class="codex-tab '+(group===id?'selected':'')+'" data-action="codex-tab" data-group="'+id+'" aria-pressed="'+(group===id)+'">'+label+'</button>').join('');
 const items=C.entries.filter(e=>e.group===group);
 const cards=items.map(e=>{
  const search=(e.name+' '+e.effect+' '+e.rule).toLowerCase().replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const art=e.art?'<img loading="lazy" src="'+e.art+'" alt="">':'<b>'+(e.symbol||'✦')+'</b>';
  return '<article class="codex-entry" data-codex-entry data-codex-search="'+search+'">'+
   '<span class="codex-picture" aria-hidden="true">'+art+'</span><div class="codex-info"><div class="codex-entry-head"><b>'+e.name+
   '</b><small class="'+(e.live?'is-live':'is-preview')+'">'+(e.live?'IN GAME':'PREVIEW')+'</small></div>'+
   '<p>'+e.effect+'</p><small>'+e.rule+'</small></div></article>';
 }).join('');
 const live=C.entries.filter(e=>e.live).length;
 return '<section class="codex-page"><div class="codex-head"><button class="btn ghost" data-action="'+(inLevel?'nutdex-close':'codex-back')+'">'+(inLevel?'← LEVEL':'← BACK')+'</button><h2>'+(inLevel?'NUTDEX':'NUT INDEX')+'</h2><small>'+live+' LIVE · '+(C.entries.length-live)+' PREVIEWS</small></div>'+
  '<nav class="codex-tabs" aria-label="Indexed game mechanics">'+groups+'</nav>'+
  '<label class="codex-search">FIND <input type="search" data-codex-filter placeholder="Filter '+group+'…" aria-label="Filter index entries" autocomplete="off"></label>'+
  '<p class="codex-help">'+(group==='elemental'?'Elemental chains are PREVIEW: another elemental activates only when the prior power actually destroys its nut. Cosmetic effects, movement and shield hits do not chain. Elemental nuts do not yet spawn.':'Live mechanics match engine behavior. Unimplemented art is marked PREVIEW.')+'</p>'+
  '<div class="codex-list">'+cards+'</div><p class="codex-empty" hidden>No matching entries.</p></section>';
}
function openNutdex(){
 if(state.page!=='game'||!state.game||state.animating||state.nutdexOpen)return;
 state.nutdexOpen=true;
 const modal=document.createElement('section');
 modal.className='nutdex-drawer';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','NUTDEX mechanics');
 modal.innerHTML='<button class="nutdex-shade" data-action="nutdex-close" aria-label="Close Nutdex"></button><div class="nutdex-pane"><div class="nutdex-content">'+codex(true)+'</div></div>';
 screen.appendChild(modal);
 modal.querySelector?.('[data-action="nutdex-close"]')?.focus?.();
}
function closeNutdex(){
 state.nutdexOpen=false;
 screen.querySelector?.('.nutdex-drawer')?.remove?.();
}
function fakeAdScreen(){
 const s=state.adSession;if(!s||!Ads)return '<p>Fake ad unavailable.</p>';
 const remaining=Ads.remaining(s),progress=Math.round(s.elapsed/Ads.DURATION_MS*100);
 const wharf=s.kind==='wharf';
 const reward=s.kind==='daily'?'750 Golden Nuts and 1 Hammer':wharf?'2 Worm Bait and N$100':'50% off this fictional shop offer';
 return `<section class="fake-ad-screen ${wharf?'wharf-fisherman-ad':''}" aria-label="${wharf?'Fishing Wharf squirrel fisherman parody ad':'Fictional rewarded advertisement'}">
  <div class="fake-ad-top"><b>${wharf?'NUTVALE WHARF · SQUIRREL FISHERMEN':'SPONSORED BY NUTVALE MARKETING'}</b><button class="btn ghost" data-action="ad-close" aria-label="Close fake advertisement without a reward">✕ SKIP · NO REWARD</button></div>
  <figure class="fake-ad-poster"><img src="${s.poster.image}" alt="${s.poster.name}: fictional ${wharf?'squirrel fisherman':'squirrel product'} advertisement" draggable="false"><figcaption>${s.poster.name}</figcaption></figure>
  <div class="fake-ad-controls"><strong>PARODY AD · NO REAL ADVERTISER</strong>
   <div class="fake-ad-clock" role="timer" data-ad-timer>${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}</div>
   <div class="fake-ad-track" role="progressbar" data-ad-progress aria-label="Ad watch progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div>
   <small class="fake-ad-caption">WAH-WAH-WAH! · ${reward} · timer pauses in the background</small>
   <div class="fake-ad-actions"><button class="btn ghost" data-action="ad-mute">${state.adMuted?'🔇 UNMUTE WAH-WAH':'🔊 MUTE WAH-WAH'}</button>
    <button class="btn green" data-action="ad-claim" ${s.ready?'':'disabled'}>${s.ready?'CLAIM REWARD':'WATCHING…'}</button></div>
  </div>
 </section>`;
}
function stopFakeAdTimer(){
 if(adTicker!==null){clearInterval(adTicker);adTicker=null;}
 Ads?.stopAudio?.();
}
function cancelFakeAd(){
 stopFakeAdTimer();if(state.adSession)Ads?.cancel?.(state.adSession);
 state.adSession=null;state.adReturn=null;state.adMuted=false;
}
function refreshFakeAd(){
 const s=state.adSession;if(!Ads||!s||state.page!=='fake-ad')return;
 Ads.tick(s,adNow(),!document.hidden);
 const remain=Ads.remaining(s),clock=screen.querySelector('[data-ad-timer]');
 if(clock)clock.textContent=Math.floor(remain/60)+':'+String(remain%60).padStart(2,'0');
 const track=screen.querySelector('[data-ad-progress]'),percent=Math.round(s.elapsed/Ads.DURATION_MS*100);
 if(track){track.setAttribute('aria-valuenow',String(percent));const bar=track.querySelector('span');if(bar)bar.style.width=percent+'%';}
 if(s.ready){const button=screen.querySelector('[data-action="ad-claim"]');if(button){button.disabled=false;button.textContent='CLAIM REWARD';}}
}
function startFakeAd(kind){
 if(!Ads){notice('FAKE ADS UNAVAILABLE');return;}
 if(kind==='daily'&&saved.fakeAdDailyDay===Ads.dayKey()){notice('AD BONUS ALREADY CLAIMED TODAY');return;}
 if(kind==='wharf'){
  const F=window.NutFishing;
  if(!['fishing','bait-shop'].includes(state.page)||!F||!Ads.wharfPosters?.length){notice('WHARF ADS ONLY AVAILABLE AT THE DOCK');return;}
  const n=F.ensure(saved),today=F.localDay(Date.now());
  if(!today||typeof n.wharfAdDay==='string'&&n.wharfAdDay>=today){notice('WHARF AD BONUS ALREADY CLAIMED TODAY');return;}
  if(n.baits.worm>999999999-F.WHARF_AD_REWARD.bait){notice('BAIT INVENTORY FULL');return;}
 }
 if(kind==='discount'&&(state.page!=='checkout'||!Number.isInteger(state.checkout))){notice('SELECT AN OFFER FIRST');return;}
 if(state.page==='fake-ad')return;
 const offer=kind==='discount'?state.checkout:null;
 const pool=kind==='wharf'?Ads.wharfPosters:Ads.posters;
 const s=Ads.session(kind,offer,Math.floor(Math.random()*pool.length),adNow());
 if(!s)return;
 stopFakeAdTimer();
 state.adReturn=state.page;state.adSession=s;state.adMuted=false;state.page='fake-ad';
 render();
 Ads.audio(state.sound&&!document.hidden,saved.levels.voice);
 adTicker=setInterval(refreshFakeAd,250);
}
function finishFakeAd(){
 const s=state.adSession;
 if(state.page!=='fake-ad'||!Ads?.claim?.(s)){notice('FINISH THE AD TIMER TO CLAIM');return;}
 const destination=state.adReturn;
 stopFakeAdTimer();
 if(s.kind==='daily'&&saved.fakeAdDailyDay!==Ads.dayKey()){
  saved.fakeAdDailyDay=Ads.dayKey();
  P.grant(saved,{hammer:1});
  gain(750,0);persist();
  notice('AD BONUS · +750 GOLDEN NUTS · +1 HAMMER');
 }else if(s.kind==='discount'&&s.offer===state.checkout){
  state.discountOffer=s.offer;
  notice('50% OFF THE FICTIONAL PRICE · FINAL CHECKOUT STILL FREE');
 }else if(s.kind==='wharf'&&['fishing','bait-shop'].includes(destination)){
  const reward=window.NutFishing?.claimWharfAd?.(saved);
  if(reward?.valid){persist();notice('WHARF AD BONUS · +'+reward.bait+' BAIT · +N$'+reward.dollars);}
  else notice('WHARF BONUS UNAVAILABLE OR ALREADY CLAIMED');
 }
 state.adSession=null;state.adReturn=null;state.adMuted=false;
 state.page=destination||'rewards';
 render();playSFX('coin');
}
function settings(){
 const lev=saved.levels||{voice:.9,music:.28,reactions:.38,sfx:.48};
 const announcers=window.NutAnnouncers?.voices||[{id:'original',label:'The Original Hype Man',description:'Original recordings'},{id:'auditor',label:'The Nutvale Auditor',description:'Prerecorded local MP3 clips'}];
 const choices=announcers.map(v=>`<button class="announcer-choice ${saved.announcerVoice===v.id?'selected':''}" type="button" data-action="announcer-set" data-voice-id="${v.id}" aria-pressed="${saved.announcerVoice===v.id?'true':'false'}"><strong>${saved.announcerVoice===v.id?'● ':'○ '}${v.label}</strong><small>${v.description}</small></button>`).join('');
 return `<div class="topline"><h2>${uiIcon('settings')} AUDIO & SETTINGS</h2><button class="btn ghost" data-nav="home">BACK</button></div><div class="panel audio-settings">
 <div class="announcer-picker" role="group" aria-label="Select announcer"><b>ANNOUNCER VOICE</b><div class="announcer-choices">${choices}</div><div class="announcer-preview"><button class="btn secondary" data-action="announcer-preview">▶ PREVIEW SELECTED VOICE</button><small>${saved.announcerVoice==='auditor'?'Local MP3 voice pack · no speech engine':'Original recording · default'}</small></div></div>
 <p class="muted">Independent volume controls for speech, music, reactions and gameplay effects.</p>
 ${[['voice','Announcer'],['music','Music'],['reactions','Match reactions'],['sfx','Game effects']].map(([id,label])=>`<label>${label}<input type="range" data-volume="${id}" min="0" max="100" value="${Math.round(lev[id]*100)}"><output>${Math.round(lev[id]*100)}%</output></label>`).join('')}
 <div class="actions"><button class="btn secondary" data-action="sound">${state.sound?'Mute voice':'Unmute voice'}</button><button class="btn secondary" data-action="music">${state.music?'Mute music':'Unmute music'}</button><button class="btn secondary" data-action="effects">${state.effects?'Mute effects':'Unmute effects'}</button></div>
 <div class="panel" style="margin-top:12px"><b>GAME UPDATES</b><p class="muted" data-update-status>Update checks run at startup and on level entry. Downloads and installation require your approval.</p><button class="btn secondary" data-action="check-updates">CHECK FOR UPDATES</button><button class="btn ghost" data-action="open-releases">VIEW RELEASES</button><button class="btn ghost" data-action="invite">↗ INVITE FRIENDS</button><button class="btn secondary" data-nav="codex">NUT INDEX · RULES</button></div></div>`;
}
function render(){syncDaily();if(window.NutFishing){const oldDay=saved.nutravaganza?.day;window.NutFishing.ensure(saved);if(saved.nutravaganza.day!==oldDay)persist();}counters();document.getElementById('app')?.classList?.toggle('playing',state.page==='game');document.getElementById('app')?.classList?.toggle('fake-ad-active',state.page==='fake-ad');screen.classList?.toggle('campaign-map-active',state.page==='campaign');
 screen.classList?.toggle('game-active',state.page==='game');screen.classList?.toggle('homestead-active',state.page==='homestead');screen.classList?.toggle('codex-active',state.page==='codex');screen.classList?.toggle('mines-active',state.page==='mines');
 screen.innerHTML=state.page==='home'?home():state.page==='campaign'?campaign():state.page==='game'?game():state.page==='shop'?shop():state.page==='homestead'?homestead():state.page==='mines'?(MineUI?MineUI.render(saved,state):'<p>Mining interface unavailable</p>'):state.page==='wharf'?window.NutFishingUI.hub(saved):state.page==='fishing'?window.NutFishingUI.wharf(saved,state,E,P):state.page==='bait-shop'?window.NutFishingUI.baitShop(saved,state,E,P):state.page==='aquarium'?window.NutFishingUI.aquarium(saved,state):state.page==='fish-records'?window.NutFishingUI.trophyHall(saved):state.page==='codex'?codex():state.page==='settings'?settings():state.page==='vip-benefits'?vipBenefits():state.page==='checkout'?checkout():state.page==='fake-ad'?fakeAdScreen():state.page==='outcome'?outcome():rewards();
 if(state.purchasePending)screen.innerHTML+=purchaseDialog();
 updateFreeTimers();
 window.NutbusterUpdates?.syncStatus?.();
 if(state.page==='campaign'&&state.chapter&&typeof screen.querySelector==='function'){
  const center=()=>{const selected=screen.querySelector('[data-current="true"]'),viewport=screen.querySelector('[data-map-scroll]');
   if(selected&&viewport){viewport.scrollLeft=Math.max(0,selected.offsetLeft-viewport.clientWidth/2);viewport.scrollTop=Math.max(0,selected.offsetTop-viewport.clientHeight/2);}};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(center);else setTimeout(center,0);
 }
}
function start(n){state.epoch++;state.animating=false;
 const requested=Math.trunc(Number(n)||1),trial=T.profile(requested);
 if(trial&&!T.available(saved,requested)){notice('CLEAR THE REQUIRED CAMPAIGN STAGE AND EARLIER TRIAL');return;}
 if(movesLeft()<1){notice('DAILY MOVES EXHAUSTED · REFILLS TOMORROW');return;}
 if(saved.hearts<=0){notice('NO HEARTS · FREE REFILL RETURNS 12 HOURS AFTER REDEMPTION');return;}
 saved.hearts--;persist();const level=trial?requested:Math.min(1000,Math.max(1,requested));
 closeNutdex();state.game=E.create(level,Math.floor(Math.random()*0xffffffff));state.game.moves=movesLeft();state.page='game';state.selected=-1;state.tool=null;state.holdTool=null;state.outcome=null;state.levelReward='';
 playSFX('ui');state.announcer=window.NutAudio?.caption?.('nutbuster-soft',state.game.cfg.newNut?'NEW NUT: '+state.game.cfg.newNut.replace('-',' ').toUpperCase()+'!':'PREPARE TO BUST SOME NUTS!')||'PREPARE TO BUST SOME NUTS!';render();window.NutAudio?.voice('nutbuster-soft');
 window.NutbusterUpdates?.autoCheck?.('level');
}
function concludeMove(result){
 if(result.hazards?.expired?.length)notice('TIMED ACORN DETONATED · 2 MOVES LOST PER ACORN');
 if(result.won){const g=state.game,stars=g.moves>10?3:g.moves>3?2:1;
  if(T.profile(g.level)){
   const win=R.clear(saved,g.level,g.score);
   state.levelReward=win.first?'ELEMENTAL TRIAL · +'+win.coins+' GOLDEN NUTS · +'+win.gems+' GEMS'+
     (Object.keys(win.contents).length?' · '+boosterSummary(win.contents):'')+
     (win.relic?' · UNLOCKED '+win.relic.toUpperCase()+' RELIC':''):'TRIAL REPLAY · REWARD ALREADY CLAIMED';
   persist();playSFX('victory');announce('ELEMENTAL NUTRAVAGANZA!','nutravaganza');
  }else{
  const firstTime=!saved.stars[g.level];
  saved.stars[g.level]=Math.max(stars,saved.stars[g.level]||0);saved.unlocked=Math.max(saved.unlocked,Math.min(1000,g.level+1));saved.completed++;
  const prize=firstTime?P.firstClear(saved,g.level):{unlock:[],contents:{}};
   H.recordWin(saved,g.level,g.score);
  state.levelReward=prize.unlock.length?'NEW POWER: '+prize.unlock.map(id=>E.BOOSTER_META[id].label).join(', '):Object.keys(prize.contents).length?'STAGE PRIZE: '+boosterSummary(prize.contents):'';
   if(firstTime){const items=H.DECOR.filter(item=>item.level===g.level).map(item=>item.name),avatars=H.AVATARS.filter(item=>item.level===g.level).map(item=>item.name);
    if(items.length||avatars.length)state.levelReward+=(state.levelReward?' · ':'')+'HOMESTEAD UNLOCK: '+[...items,...avatars].join(', ');
     const zone=H.ZONES.find(z=>z.level===g.level&&z.level>0),house=H.HOUSES.find(x=>x.level===g.level&&x.level>0),pet=H.PETS.find(x=>x.level===g.level&&x.level>0),residence=H.HOUSE_TIERS.find(x=>x.level===g.level&&x.tier>1);
     if(zone||house||pet||residence)state.levelReward+=(state.levelReward?' · ':'')+'NEW ESTATE FEATURES: '+[zone?.name,house?.name,pet?.name,residence?'BUILD TIER '+residence.tier:null].filter(Boolean).join(', ');
      const activeTier=H.ensure(saved).tier;
      const newPlans=H.RENOVATIONS.filter(track=>{
       const offer=H.renovationOffer(saved,activeTier,track.id);
       return offer.valid&&offer.level===g.level;
      });
      if(newPlans.length)state.levelReward+=(state.levelReward?' · ':'')+'RENOVATION PLANS UNLOCKED: '+newPlans.length;
       const newOutfits=A.unlockedAt(g.level);
       if(newOutfits.length)state.levelReward+=(state.levelReward?' · ':'')+'AVATAR OUTFIT UNLOCKED: '+newOutfits.map(c=>c.name).join(', ');
    }

  gain(500,10);persist();playSFX('victory');if(g.level%5===0)announce('NUTRAVAGANZA! YOUR NUTS ARE LEGENDARY!','nutravaganza');else announce('UNBELIEVABLE PERFORMANCE! YOUR NUTS ARE LEGENDARY!','win');}}
 else if(result.lost){playSFX('failure');announce('OOOH... THAT WAS CLOSE.','close');}
 else if(result.hazards?.expired?.length)announce('LOOK OUT!','look-out');
 else if(result.specialCombo)announce('NUT DESTRUCTION!','nut-destruction');
 else if(result.loops>=6)announce('BUSTED!','busted');
 else if(result.loops>=4)announce('NUTSPLOSION!','nutsplosion');
 else if(result.loops>=3)announce('THEY JUST KEEP COMING!','cascade');
 else if(result.loops>=2&&result.removed>=12)announce('NUTSSELENCE!','nutsselence');
 else if(result.loops>=2)announce('MAGNIFICENT NUTS!','magnificent');
 else if(result.removed>=12)announce('NUT DESTRUCTION!','nut-destruction');
 else if(result.removed>=5)announce('OOOH, THAT IS A BIG ONE!','big-one');
 else {announce('NICE ONE!');window.NutAudio?.grunt();}
 paintStats();
 // Every removed nut already produced its own tile-centered Nutsplosion during
 // the cascade. Reserve the large board overlay for spectacular finishes only.
 if(result.won||result.specialCombo==='double-rainbow')window.NutFX?.emit('supernova',screen.querySelector?.('.board-wrap'));
 if(result.won||result.lost){state.outcome=result.won?'win':'loss';state.page='outcome';render();}
}
function doSwap(a,b){if(state.animating||state.page!=='game')return;
 if(movesLeft()<1){notice('DAILY MOVES EXHAUSTED · REFILLS TOMORROW');return;}
 state.game.moves=movesLeft();
 const priorRefunds=state.game.elementalRefunds||0;
 const r=E.swap(state.game,a,b);if(!r.valid){playSFX('invalid');notice('Choose two adjacent nuts.');selectCell(-1);return;}
 const used=Math.min(movesLeft(),1+2*(r.hazards?.expired?.length||0));
 D.spend(saved,used,Date.now(),dailyCap());
 const earnedRefunds=Math.max(0,(state.game.elementalRefunds||0)-priorRefunds);
 if(earnedRefunds)D.topUp(saved,earnedRefunds,Date.now(),dailyCap());
 state.game.moves=movesLeft();
 if(earnedRefunds&&state.game.moves){state.game.lost=false;r.lost=false;}
 if(!r.won&&!state.game.moves){state.game.lost=true;r.lost=true;}
 persist();void applyMove(r);
}
function cell(i){if(!state.game||state.game.won||state.game.lost||state.animating)return;
 if(state.holdTool){
  const id=state.holdTool;
  if(!P.holdCount(saved,id)){state.holdTool=null;updateTools();notice('BUY '+P.HOLD_ITEMS[id].label.toUpperCase()+' IN THE SHOP');return;}
  const result=E.applyHold(state.game,id,i);
  if(!result.valid){notice(result.reason==='already-held'?'THAT NUT IS ALREADY HELD':'CHOOSE A NUT TO HOLD');return;}
  if(!P.spendHold(saved,id))throw new Error('Hold item inventory out of sync');
  state.holdTool=null;persist();playSFX('booster');paintCells(E.snapshot(state.game).cells);refreshBoosters();updateTools();
  window.NutFX?.booster?.(id,screen.querySelector(`[data-cell="${i}"]`));
  notice(P.HOLD_ITEMS[id].label.toUpperCase()+' · '+result.drops+' GRAVITY DROPS · ×3 MATCH');
  return;
 }
 if(state.tool){const tool=state.tool;state.tool=null;updateTools();const result=activateBooster(tool,i);if(result)void applyMove(result);return;}
 if(state.selected<0){selectCell(i);return;}if(state.selected===i){selectCell(-1);return;}doSwap(state.selected,i);
}
function action(a,button){
 if(a==='mine-tab'){if(state.page!=='mines')return;const t=button.dataset.tab;if(!['dig','equipment','refinery','writs'].includes(t))return;state.mineTab=t;state.minePending=null;render();return;}
 if(a==='mine-mode'){if(state.page!=='mines')return;state.mineMode=button.dataset.mode==='scan'?'scan':'dig';render();return;}
 if(a==='mine-cell'){
  if(state.page!=='mines'||!Mines)return;
  const x=Number(button.dataset.x),y=Number(button.dataset.y);
  const prior=Mines.currentBoard(saved).find(c=>c.x===x&&c.y===y);
  const result=prior?.exposed?Mines.collect(saved,x,y):state.mineMode==='scan'?Mines.survey(saved,x,y):Mines.excavate(saved,x,y);
  if(result.valid){persist();render();playSFX('crack');if(result.cleared)notice(result.kind==='barren'?'BARREN STONE · NO ORE':result.exposed?'ORE EXPOSED · UNLOAD CART TO COLLECT':result.cartAdded+' ORE INTO CART');else if(Object.prototype.hasOwnProperty.call(result,'orePresent'))notice(result.orePresent?'ORE PRESENT':'BARREN ROCK');else if(result.ore)notice('COLLECTED '+result.ore+' ORE');}
  else notice(result.reason==='strikes'?'NO DAILY STRIKES LEFT':result.reason==='scans'?'NO DAILY SCANS LEFT':result.reason==='cart'?'CART FULL · UNLOAD FIRST':'INVALID MINING ACTION');
  return;
 }
 if(a==='mine-unload'||a==='mine-refine'||a==='mine-craft'||a==='mine-sell'||a==='mine-writ'){
  if(state.page!=='mines'||!Mines)return;
  const fn={ 'mine-unload':()=>Mines.unload(saved),'mine-refine':()=>Mines.refine(saved,1),'mine-craft':()=>Mines.manufacture(saved,1),'mine-sell':()=>Mines.sell(saved,1),'mine-writ':()=>Mines.buyWrits(saved,1)}[a];
  const result=fn();if(result.valid){persist();render();playSFX('coin');notice('TRANSACTION COMPLETE');}else notice('INSUFFICIENT MATERIALS OR CURRENCY');return;
 }
 if(a==='mine-upgrade'){
  if(state.page!=='mines'||!Mines)return;
  const track=button.dataset.track,prices=Mines.prices(saved),p=prices[track];
  if(!p)return;
  const cost=track==='pickaxe'||track==='gloves'?p.nextCost:p.cost;
  if(cost===null){notice('MAXIMUM TIER REACHED');return;}
  const before=Mines.stats(saved).dollars;
  state.minePending={track,cost,before,after:before-cost,label:({pickaxe:'Pickaxe +5 daily strikes',gloves:'Survey Gloves +1 daily scan',mineTier:'Mine Map expansion',cartTier:'Cart upgrade',refineryTier:'Refinery upgrade'})[track]};
  render();return;
 }
 if(a==='mine-cancel'){state.minePending=null;render();return;}
 if(a==='mine-confirm'){
  if(!state.minePending||state.page!=='mines'||!Mines)return;
  const requested=state.minePending,prices=Mines.prices(saved),p=prices[requested.track],cost=requested.track==='pickaxe'||requested.track==='gloves'?p?.nextCost:p?.cost;
  if(cost!==requested.cost||Mines.stats(saved).dollars!==requested.before){state.minePending=null;notice('MINE PRICES CHANGED · REVIEW AGAIN');render();return;}
  const result=Mines.upgrade(saved,requested.track);state.minePending=null;
  if(result.valid){persist();playSFX('coin');render();notice('UPGRADE COMPLETE · N$ '+result.cost.toLocaleString());}
  else{render();notice(result.reason==='funds'?'NOT ENOUGH NUTVALE DOLLARS':'UPGRADE UNAVAILABLE');}return;
 }

 if(a==='announcer-set'){
  const id=button?.dataset?.voiceId;
  if(!['original','auditor'].includes(id)||!window.NutAudio?.setAnnouncerVoice?.(id))return;
  saved.announcerVoice=id;persist();render();return;
 }
 if(a==='announcer-preview'){
  if(!state.sound){notice('UNMUTE VOICE TO PREVIEW');return;}
  if(!window.NutAudio?.voice?.('deal')){
   notice('ANNOUNCER RECORDING UNAVAILABLE · CHECK LOCAL MP3 ASSETS');
  }else notice(window.NutAudio?.caption?.('deal','WHAT A DEAL!')||'WHAT A DEAL!');
  return;
 }
 if(a==='promo-open'){
  const form=screen.querySelector?.('#shop-promo-form');
  if(!form)return;
  form.hidden=!form.hidden;
  button?.setAttribute?.('aria-expanded',String(!form.hidden));
  if(!form.hidden)form.querySelector?.('[data-promo-input]')?.focus?.();
  return;
 }
 if(a==='promo-redeem'){void redeemPromoFromUI();return;}
 if(a==='codex-back'){nav(state.codexBack&&state.codexBack!=='codex'?state.codexBack:'home');return;}
 if(a==='nutdex-open'){openNutdex();return;}
 if(a==='nutdex-close'){closeNutdex();return;}
 if(a==='purchase-cancel'){state.purchasePending=null;render();return;}
 if(a==='purchase-confirm'){
  const p=state.purchasePending;if(!p)return;
  state.purchasePending=null;action(p.action,{dataset:p.data});return;
 }
 if(a==='booster-buy'){
  if(state.page!=='shop'){notice('BOOSTERS CAN BE BOUGHT AT THE NUT EMPORIUM');return;}
  const result=P.buyBooster(saved,button.dataset.booster);
  if(!result.valid){
   notice(result.reason==='coins'?'NOT ENOUGH GOLDEN NUTS':result.reason==='locked'?'CLEAR THE REQUIRED LEVEL FIRST':'BOOSTER PURCHASE UNAVAILABLE');return;
  }
  persist();render();playSFX('coin');
  notice('BOUGHT '+E.BOOSTER_META[result.id].label.toUpperCase()+' · '+result.cost+' GOLDEN NUTS');
  return;
 }
 if(a==='ad-daily'){startFakeAd('daily');return;}
 if(a==='ad-wharf'){startFakeAd('wharf');return;}
 if(a==='ad-discount'){startFakeAd('discount');return;}
 if(a==='ad-claim'){finishFakeAd();return;}
 if(a==='ad-close'){const back=state.adReturn||'rewards';cancelFakeAd();state.page=back;render();return;}
 if(a==='ad-mute'){state.adMuted=!state.adMuted;Ads?.audio?.(state.sound&&!state.adMuted&&!document.hidden,saved.levels.voice);const b=screen.querySelector('[data-action="ad-mute"]');if(b)b.textContent=state.adMuted?'🔇 UNMUTE WAH-WAH':'🔊 MUTE WAH-WAH';return;}
 if(a==='codex-tab'){if(window.NutCodex?.groups.some(([id])=>id===button.dataset.group)){
  state.codexTab=button.dataset.group;
  if(state.page==='game'&&state.nutdexOpen){const content=screen.querySelector?.('.nutdex-content');if(content)content.innerHTML=codex(true);}
  else render();
 }return;}
 if(window.NutFishingUI?.action(a,button,{save:saved,state,progression:P,persist,render,notice}))return;
 if(a==='hold-offer'){const id=button.dataset.holdId;if(!P.HOLD_ITEMS[id])return;state.holdOffer=id;render();return;}
 if(a==='hold-cancel'){state.holdOffer=null;render();return;}
 if(a==='hold-buy'){
  const id=button.dataset.holdId;
  if(id!==state.holdOffer||!P.HOLD_ITEMS[id])return;
  const result=P.buyHold(saved,id);
  if(!result.valid){notice(result.reason==='gems'?'NOT ENOUGH GEMS · NEED '+result.short:'ITEM UNAVAILABLE');return;}
  state.holdOffer=null;persist();render();playSFX('coin');notice(P.HOLD_ITEMS[id].label.toUpperCase()+' PURCHASED · ×'+result.stock);return;
 }
 if(a==='check-updates'){window.NutbusterUpdates?.check();return;}
  if(a==='open-releases'){window.NutbusterUpdates?.openReleases();return;}
 if(a==='invite'){
  const share=window.NutbusterInvite?.share;
  if(!share){notice('Invitation sharing is unavailable in this build.');return;}
  Promise.resolve(share()).then(result=>{
    if(result==='copied')notice('INVITATION LINK COPIED');
    else if(result==='select')notice('COPY THE INVITATION LINK');
  }).catch(()=>notice('Could not open the share menu.'));
  return;
 }
 if(a==='homestead-edit'){state.homesteadEditing=!state.homesteadEditing;state.homesteadSelection=null;render();return;}
 if(a==='homestead-offer'){beginCheckout(8,'homestead');return;}
  if(a==='homestead-tier-browse'){
   const current=H.tierByNumber(state.homesteadPreview)||H.tierByNumber(H.ensure(saved).tier);
   state.homesteadPreview=Math.max(1,Math.min(40,current.tier+(Number(button.dataset.dir)||0)));
   render();return;
  }
  if(a==='homestead-tier-equip'){
   const chosen=Number(button.dataset.tier);
   if(H.chooseTier(saved,chosen)){state.homesteadPreview=chosen;persist();render();playSFX('place');}
   else notice('THIS RESIDENCE HAS NOT BEEN BUILT');return;
  }
  if(a==='homestead-renovate'){
   const tier=Number(button.dataset.tier),item=button.dataset.id;
   const result=H.upgradeRenovation(saved,tier,item);
   if(!result.valid){
    const message=result.reason==='level'?'CLEAR LEVEL '+result.level+' TO RENOVATE':
      result.reason==='coins'?'NEED '+result.short.toLocaleString()+' MORE GOLDEN NUTS':
      result.reason==='complete'?'RENOVATION TRACK COMPLETE':'RESIDENCE RENOVATION UNAVAILABLE';
    notice(message);return;
   }
   state.homesteadPreview=tier;persist();render();playSFX('place');
   notice('RENOVATION '+result.rank+'/5 COMPLETE · '+result.spent+' GOLDEN NUTS');
   return;
  }
  if(a==='homestead-tier-upgrade'){
   const result=H.upgradeTier(saved);
   if(!result.valid){
    notice(result.reason==='level'?'CLEAR LEVEL '+result.level+' TO BUILD':result.reason==='coins'?'NEED '+result.short.toLocaleString()+' MORE GOLDEN NUTS':'EVERY RESIDENCE UPGRADE COMPLETE');
    return;
   }
   state.homesteadPreview=result.tier;persist();render();playSFX('place');notice('NEW HOUSE TIER '+result.tier+' BUILT');return;
  }
  if(a==='homestead-zone'){
   const zone=H.ZONES.find(z=>z.id===button.dataset.zone);
   if(!zone)return;
   if(!H.zoneUnlocked(saved,zone.id)){notice('CLEAR LEVEL '+zone.level+' TO OPEN '+zone.name.toUpperCase());return;}
   state.homesteadZone=zone.id;render();return;
  }
  if(a==='homestead-pet'){if(H.equipPet(saved,button.dataset.id)){persist();render();playSFX('place');}return;}
  if(a==='homestead-build'){
   const result=H.buildHouse(saved,button.dataset.id);
   if(!result.valid){
    notice(result.reason==='level'?'CLEAR LEVEL '+result.level+' TO BUILD':result.reason==='coins'?'NEED '+result.short.toLocaleString()+' MORE GOLDEN NUTS':'BUILDING UNAVAILABLE');return;
   }
   persist();render();playSFX('place');return;
  }
  if(a==='homestead-plate'){
   const share=window.NutbusterInvite?.sharePrestige;
   if(!share){notice('PRESTIGE SHARING UNAVAILABLE');return;}
   Promise.resolve(share(H.prestigePlate(saved))).then(status=>{
    if(status==='copied')notice('PRESTIGE PLATE COPIED');
    else if(status==='select')notice('COPY YOUR PRESTIGE PLATE');
   }).catch(()=>notice('COULD NOT SHARE PRESTIGE PLATE'));return;
  }
  if(a==='homestead-select'){if(!state.homesteadEditing)return;const id=button.dataset.id;if(!H.owned(saved,id))return;state.homesteadSelection=state.homesteadSelection===id?null:id;renderHomesteadEditor();return;}
  if(a==='homestead-outfit'){if(A.equip(saved,button.dataset.id)){persist();render();}else notice('CLEAR THE REQUIRED LEVEL TO UNLOCK THIS OUTFIT');return;}
  if(a==='homestead-avatar'){if(H.equip(saved,button.dataset.id)){persist();render();}return;}
  if(a==='homestead-slot'){if(!state.homesteadEditing)return;const slot=Number(button.dataset.slot),id=state.homesteadSelection;
   const ok=id?H.place(saved,id,slot):H.remove(saved,slot);
   if(ok){persist();playSFX('place');if(id)state.homesteadSelection=null;renderHomesteadEditor();}else notice(id?'ITEM UNAVAILABLE':'SELECT AN ITEM FIRST');return;}
  if(a==='challenge-claim'){
  const tier=Number(button.dataset.tier),reward=P.claimChallenge(saved,tier);
  if(!reward.valid){notice(reward.reason==='claimed'?'ALREADY REDEEMED':'FINISH MORE CHALLENGE LEVELS');return;}
  persist();playSFX('coin');notice('CHALLENGE TRACK: '+boosterSummary(reward.contents));render();window.NutFX?.emit('chest-open');return;
 }
 if(a==='play'){start(button.dataset.level);return;}
 if(a==='world-map'){state.chapter=0;render();return;}
 if(a==='world-page'){state.world=Number(button.dataset.world)===1?1:0;state.chapter=0;render();return;}
 if(a==='map-zoom'){state.mapZoom=Math.max(.7,Math.min(1.5,Math.round((state.mapZoom+(Number(button.dataset.zoom)||0))*10)/10));render();return;}
 if(a==='next-chapter'){state.chapter=Math.max(1,Math.min(10,Number(button.dataset.chapter)||1));state.world=Math.floor((state.chapter-1)/5);render();return;}
 if(a==='restart'){start(state.game?.level||1);return;}
 if(a==='claim'){beginCheckout(Number(button.dataset.item));return;}
 if(a==='checkout-review'){state.checkoutStep=1;render();return;}
 if(a==='checkout-back'){if(state.checkoutStep){state.checkoutStep=0;render();}else nav(state.checkoutFrom==='outcome'?'outcome':state.checkoutFrom);return;}
 if(a==='checkout-complete'){if(state.checkoutStep!==1||state.checkout===null)return;
  const i=state.checkout,p=offers[i];const dest=state.checkoutFrom;
  if(i===6||i===7){
   const result=B?.claim(saved,i===6?'hearts':'moves',Date.now(),D,dailyCap());
   if(!result?.valid){notice(result?.reason==='full'?'HEARTS ALREADY FULL':'FREE REWARD UNAVAILABLE');state.checkout=null;state.checkoutStep=0;state.discountOffer=null;state.page=dest;render();return;}
   if(i===7&&state.game){state.game.moves=movesLeft();state.game.lost=false;}
   persist();
  }else if(i===8){H.purchase(saved,'royal-estate');persist();}
  else {P.grant(saved,state.checkoutPack);gain(p[2],p[3]);if(i===4){saved.vip=true;syncDaily();}persist();}
  state.checkout=null;state.checkoutPack=null;state.checkoutStep=0;state.discountOffer=null;notice('ORDER COMPLETE · TOTAL PAID $0.00');
  playSFX('coin');if(i===0||i===3)announce('HECK OF A PACKAGE!','heck-package');else announce('WHAT A DEAL!','deal');
  state.page=(dest==='outcome'||dest==='game')?'game':dest==='home'?'home':dest==='homestead'?'homestead':'shop';
  if(state.page==='game'&&(!state.game||state.game.won))state.page='campaign';
  if(state.page==='homestead'){state.homesteadEditing=false;state.homesteadSelection=null;}
  render();window.NutFX?.emit('coin-shower');return;
 }
 if(a==='continue-level'){beginCheckout(7,'outcome');return;}
 if(a==='bonus-moves'){beginCheckout(7,state.page);return;}
 if(a==='vip'||a==='vip-buy'){if(saved.vip){nav('vip-benefits');return;}beginCheckout(4,state.page);return;}
 if(a==='vip-benefits'){nav('vip-benefits');return;}
 if(a==='refill'){beginCheckout(6);return;}
 if(a==='effects'){state.effects=!state.effects;saved.effects=state.effects;window.NutSFX?.setEnabled(state.effects);persist();if(state.page==='game'){screen.querySelectorAll('[data-action="effects"]').forEach(b=>b.textContent=state.effects?'Effects On':'Effects Off');}else render();return;}
 if(a==='sound'){state.sound=!state.sound;saved.sound=state.sound;window.NutAudio?.setVoiceEnabled(state.sound);persist();
   if(state.page==='game'){screen.querySelectorAll('[data-action="sound"]').forEach(b=>b.textContent=state.sound?'Voice On':'Voice Off');}else render();return;}
 if(a==='music'){state.music=!state.music;saved.music=state.music;window.NutAudio?.setMusicEnabled(state.music);persist();
   if(state.page==='game'){screen.querySelectorAll('[data-action="music"]').forEach(b=>b.textContent=state.music?'Music On':'Music Off');}else render();return;}
 if(a==='daily'){playSFX('coin');saved.streak++;const pack=awardPack('daily');gain(500,10);notice('DAILY BONUS: '+boosterSummary(pack));announce('SATISFACTION GUARANTEED!','satisfaction');render();return;}
 if(a==='pig'||a==='chest'||a==='friend'||a==='pass'||a==='loot'){
  playSFX(a==='pig'?'crack':a==='chest'?'chest':'coin');if(a==='chest')saved.chestReadyAt=Date.now()+3*60*60*1000;
  const pack=awardPack(a);gain(1000,100);notice(boosterSummary(pack));
  announce('PREMIUM REWARDS DELIVERED!',{pig:'oh-my',chest:'nutbuster',friend:'nutbuster-soft',pass:'premium',loot:'package'}[a]);
  render();window.NutFX?.emit(a==='chest'?'chest-open':'coin-shower');return;
 }
}
screen.addEventListener('click',e=>{window.NutAudio?.unlock();window.NutSFX?.unlock();if(Date.now()<swipeGuard)return;
 const target=e.target.closest('button');if(!target||state.animating)return;
 if(state.nutdexOpen&&target.dataset.action!=='nutdex-close'&&target.dataset.action!=='codex-tab')return;
 if(target.dataset.cell!==undefined){cell(Number(target.dataset.cell));return;}
 playSFX('ui');
 if(target.dataset.holdTool){
   const id=target.dataset.holdTool;if(!state.game||state.page!=='game')return;
   if(!P.holdCount(saved,id)){state.holdOffer=id;nav('shop');return;}
   state.holdTool=state.holdTool===id?null:id;state.tool=null;selectCell(-1);updateTools();return;
  }
  if(target.dataset.tool){const tool=target.dataset.tool;if(!state.game||state.page!=='game')return;
  if(!P.unlocked(saved,tool)||!P.count(saved,tool)){activateBooster(tool,-1);return;}
  if(!E.BOOSTER_META[tool].targeted){
   state.holdTool=null;updateTools();
   const res=activateBooster(tool,-1);if(!res)return;
   state.tool=null;updateTools();
   if(res.stages?.length)void applyMove(res);else {paintCells(E.snapshot(state.game).cells);paintStats();}
   announce('UNLIMITED SATISFACTION!','oh-my');
  }else{state.tool=state.tool===tool?null:tool;state.holdTool=null;selectCell(-1);updateTools();}return;}
 if(target.dataset.chapter){state.chapter=Number(target.dataset.chapter);state.world=Math.floor((state.chapter-1)/5);render();return;}
 if(target.dataset.action==='fish-aqua-stamp-place'&&state.page==='aquarium'){
  const rect=target.getBoundingClientRect?.();
  if(!rect||!rect.width||!rect.height)return;
  target.dataset.x=String(Math.max(0,Math.min(100,100*(e.clientX-rect.left)/rect.width)));
  target.dataset.y=String(Math.max(0,Math.min(100,100*(e.clientY-rect.top)/rect.height)));
 }
 if(state.purchasePending&&target.dataset.action!=='purchase-cancel'&&target.dataset.action!=='purchase-confirm')return;
 if(target.dataset.action&&CONFIRMED_PURCHASES.has(target.dataset.action)){
  const info=Purchases.describe(target.dataset.action,target.dataset,{save:saved,P,E,F:window.NutFishing,H,state});
  if(info){state.purchasePending={action:target.dataset.action,data:{...target.dataset},details:info};render();return;}
 }
 if(target.dataset.action)action(target.dataset.action,target);else if(target.dataset.nav)nav(target.dataset.nav);
});
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{window.NutAudio?.unlock();window.NutSFX?.unlock();playSFX('ui');nav(b.dataset.nav);}));
let pointer=null,swipeGuard=0;
screen.addEventListener('pointerdown',e=>{
 if(state.page!=='game'||!state.game||state.nutdexOpen)return;
 const tile=e.target.closest?.('[data-cell]');
 if(!tile&&!e.target.closest?.('.play-layout'))return;
 if(!tile&&e.target.closest?.('button, input, details'))return;
 pointer={i:tile?Number(tile.dataset.cell):-1,x:e.clientX,y:e.clientY};
});
screen.addEventListener('pointercancel',()=>{pointer=null;});
screen.addEventListener('pointerup',e=>{
 window.NutAudio?.unlock();window.NutSFX?.unlock();
 if(!pointer||!state.game||state.page!=='game'||state.animating||state.nutdexOpen)return;
 const p=pointer;pointer=null;
 const dx=e.clientX-p.x,dy=e.clientY-p.y;
 if(dx>=Math.max(110,(window.innerWidth||360)*.30)&&Math.abs(dy)<dx*.55){swipeGuard=Date.now()+400;openNutdex();return;}
 if(p.i<0||Math.max(Math.abs(dx),Math.abs(dy))<24||state.tool)return;
 const w=state.game.cfg.width,j=p.i+(Math.abs(dx)>Math.abs(dy)?(dx>0?1:-1):(dy>0?w:-w));
 if(E.adjacent(state.game,p.i,j)){swipeGuard=Date.now()+400;doSwap(p.i,j);}
});
screen.addEventListener('input',e=>{
 if(e.target?.dataset?.codexFilter!==undefined){const term=String(e.target.value||'').toLowerCase().trim();let count=0;
  screen.querySelectorAll('[data-codex-entry]').forEach(card=>{const show=(card.dataset.codexSearch||'').includes(term);card.hidden=!show;if(show)count++;});
  const empty=screen.querySelector('.codex-empty');if(empty)empty.hidden=count!==0;return;}
 const id=e.target?.dataset?.volume;if(!id||!['voice','music','reactions','sfx'].includes(id))return;saved.levels={...saved.levels,[id]:Number(e.target.value)/100};window.NutAudio?.setLevels?.(saved.levels);if(id==='sfx')window.NutSFX?.setVolume(saved.levels.sfx);persist();const out=e.target.parentElement?.querySelector('output');if(out)out.textContent=e.target.value+'%';});
document.addEventListener?.('visibilitychange',()=>{
 if(state.page==='fake-ad')Ads?.audio?.(state.sound&&!state.adMuted&&!document.hidden,saved.levels.voice);
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.page==='fake-ad'){const back=state.adReturn||'rewards';cancelFakeAd();state.page=back;render();}
 else if(e.key==='Escape'&&state.page==='game'&&state.nutdexOpen)closeNutdex();else if(e.key==='Escape'&&state.page==='game')nav('campaign');else if(e.key==='Escape'&&state.page==='checkout')action('checkout-back',{});else if(e.key==='Escape'&&state.page==='codex')action('codex-back',{});});
window.NutbusterApp={start,nav,getState:()=>state,getSave:()=>saved};render();
})();
