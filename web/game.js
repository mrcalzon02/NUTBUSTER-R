(function(){'use strict';
const E=window.NutEngine, M=window.NutCampaignMaps, P=window.NutProgress, screen=document.getElementById('screen');
const icons=['🥜','🌰','🌰','🥜','🌰','🟢'];
const key='nutbuster.v1';let saved={unlocked:1,stars:{},coins:250,gems:25,shells:0,hearts:5,vip:false,streak:0,claimed:0,sound:true,music:true,levels:{voice:.9,music:.28,reactions:.38},completed:0};
try{const o=JSON.parse(localStorage.getItem(key)||'{}');if(o&&typeof o==='object')saved={...saved,...o,stars:o.stars||{}};}catch(_){}
P.migrate(saved);
if(!saved.chestReadyAt)saved.chestReadyAt=Date.now()+3*60*60*1000;
let state={page:'home',chapter:0,mapZoom:1,game:null,selected:-1,tool:null,announcer:'',sound:saved.sound,music:saved.music,animating:false,epoch:0,checkout:null,checkoutStep:0,checkoutFrom:'shop',outcome:null};let toastHandle;
if(window.NutAudio){window.NutAudio.setVoiceEnabled(state.sound);window.NutAudio.setMusicEnabled(state.music);window.NutAudio.setLevels?.(saved.levels||{voice:.9,music:.28,reactions:.38});}
function persist(){try{localStorage.setItem(key,JSON.stringify(saved));}catch(_){}}
function safeNum(n){return Number.isFinite(n)?Math.min(999999999,Math.max(0,Math.trunc(n))):0;}
function gain(coins=0,gems=0){saved.coins=safeNum(saved.coins+coins);saved.gems=safeNum(saved.gems+gems);persist();counters();}
function counters(){document.getElementById('wallet').textContent=saved.coins.toLocaleString();document.getElementById('gems').textContent=saved.gems.toLocaleString();}
function boosterSummary(pack){return P.packText(pack,Object.fromEntries(E.BOOSTERS.map(id=>[id,E.BOOSTER_META[id].label])));}
function inventorySummary(){return P.available(saved).map(id=>E.BOOSTER_META[id].label+' ×'+P.count(saved,id)).join(' · ');}
function awardPack(kind){const pack=P.actualPack(saved,kind);P.grant(saved,pack);persist();return pack;}
function refreshBoosters(){screen.querySelectorAll('[data-tool]').forEach(el=>{const id=el.dataset.tool,tag=el.querySelector('[data-stock]');if(tag)tag.textContent=P.unlocked(saved,id)?'×'+P.count(saved,id):'LV '+P.LEVEL_BY_TOOL[id];el.classList.toggle('empty',P.unlocked(saved,id)&&!P.count(saved,id));});}
function activateBooster(id,index){const meta=E.BOOSTER_META[id];
 if(!meta)return null;
 if(!P.unlocked(saved,id)){notice('CLEAR LEVEL '+P.LEVEL_BY_TOOL[id]+' TO UNLOCK '+meta.label.toUpperCase());return null;}
 if(!P.count(saved,id)){notice('OUT OF '+meta.label.toUpperCase()+' · CHECK YOUR PACKS');return null;}
 const result=E.booster(state.game,id,index);
 if(!result.valid){notice(result.reason==='no-locks'?'No chains to unlock.':'Choose a valid target.');return null;}
 if(!P.spend(saved,id))throw new Error('Inventory desynchronized after power activation');
 persist();refreshBoosters();return result;
}
function notice(message){const n=document.getElementById('toast');n.textContent=message;n.classList.add('show');clearTimeout(toastHandle);toastHandle=setTimeout(()=>n.classList.remove('show'),2300);}
function announce(txt,clip){state.announcer=txt;const el=document.getElementById('announcer');if(el)el.textContent='🎙 '+txt;if(state.sound&&clip)window.NutAudio?.voice(clip);}
const $=(selector)=>document.querySelector(selector);
function nav(page){state.epoch++;state.animating=false;state.page=page;state.selected=-1;state.tool=null;
 if(page==='campaign'&&state.game)state.chapter=M.chapterOf(state.game.level).id;
 render();}

function banner(title,sub){return `<div class="panel hero"><h1>${title}</h1><p>${sub}</p></div>`;}
function uiIcon(name,alt=''){return `<img src="art/additions/ui/${name}.png" class="ui-icon" alt="${alt}">`;}
function home(){return `${banner('WELCOME TO NUTBUSTER','The match-three game with every premium feature ever invented. An offer this irresistible can only end one way.')}
 <div class="space"></div><div class="actions"><button class="btn green" data-action="play" data-level="${Math.min(500,saved.unlocked)}">${uiIcon('play')}PLAY NOW</button><button class="btn secondary" data-nav="campaign">${uiIcon('campaign-map')}LEVEL MAP</button><button class="btn secondary" data-nav="shop">${uiIcon('store')}SHOP</button><button class="btn secondary" data-nav="settings">${uiIcon('settings')}SETTINGS</button><button class="btn ghost" data-action="sound">${state.sound?'🔊 Voice On':'🔇 Voice Off'}</button><button class="btn ghost" data-action="music">${state.music?'♫ Music On':'♫ Music Off'}</button></div>
 <h2 class="section">Your entirely unnecessary privileges</h2><div class="tiles-row"><div class="panel mini-card"><span class="icon">❤️</span><b>${saved.hearts}/5 Lives</b><button class="btn ghost" data-action="refill">REFILL NOW</button></div><div class="panel mini-card"><span class="icon">👑</span><b>${saved.vip?'VIP ACTIVE':'VIP STATUS'}</b><button class="btn ghost" data-action="vip">${saved.vip?'VIP BENEFITS':'BECOME VIP'}</button></div><div class="panel mini-card"><span class="icon">🎁</span><b>Daily Loot</b><button class="btn ghost" data-action="daily">CLAIM BONUS</button></div></div>
 <div class="panel center"><b>LIMITED-TIME EXCLUSIVE OFFER</b><p class="muted">Unmissable deals, luxury upgrades, and important-looking countdowns await in the Nut Emporium.</p><button class="btn secondary" data-nav="shop">EXPLORE OFFERS</button></div>`;}
function campaign(){
 const progress=M.CHAPTERS.map(c=>({c,stars:Object.keys(saved.stars).filter(level=>Number(level)>=c.start&&Number(level)<=c.end).length}));
 // World map is a full-screen image with five real programmatic selectors, not painted-on UI.
 if(!state.chapter){
  const positions=[[.33,.90],[.29,.68],[.68,.51],[.36,.30],[.62,.11]];
  return `<div class="map-titlebar"><h2>THE GREAT NUT ODYSSEY · 500 LEVELS</h2><button class="btn ghost" data-nav="home">⌂</button></div>
  <div class="map-viewport" data-map-scroll><div class="map-canvas map-overview" style="--map-w:${Math.round(M.WIDTH*state.mapZoom)}px;--map-h:${Math.round(M.HEIGHT*state.mapZoom)}px">
  <img class="map-background" src="${M.OVERVIEW}" alt="Five connected Nutbuster campaign regions" draggable="false">
  ${progress.map(({c,stars},i)=>`<button class="chapter-marker" style="left:${positions[i][0]*100}%;top:${positions[i][1]*100}%" data-chapter="${c.id}" aria-label="Open ${c.name}, levels ${c.start} through ${c.end}"><b>${c.id}. ${c.name}</b><small>Levels ${c.start}–${c.end} · ${stars}/100</small></button>`).join('')}
  </div></div><p class="map-hint">Choose a region. Five regions. One extremely ambitious loyalty program.</p>`;
 }
 const chapter=M.CHAPTERS[state.chapter-1],points=M.nodes(state.chapter);
 const currentLevel=Math.min(chapter.end,Math.max(chapter.start,saved.unlocked));
 const buttons=points.map(p=>{
  const stars=saved.stars[p.level]||0,open=p.level<=saved.unlocked;
  const status=stars?'complete':p.level===currentLevel?'current':open?'open':'future';
  return `<button class="map-node ${status} ${p.kind} ${p.milestone?'milestone':''}" style="left:${(p.x*100).toFixed(3)}%;top:${(p.y*100).toFixed(3)}%" data-action="play" data-level="${p.level}" ${p.level===currentLevel?'data-current="true"':''} aria-label="${p.title}; ${stars?'completed '+stars+' stars':open?'available':'enter this stage'}" title="${p.title} · ${stars?'★'.repeat(stars):'Play stage'}">${p.milestone?p.level:p.local}</button>`;
 }).join('');
 return `<div class="map-titlebar"><button class="btn ghost" data-action="world-map">← REGIONS</button><h2>${chapter.name} · ${chapter.start}–${chapter.end}</h2><div class="map-zoom"><button class="btn ghost" data-action="map-zoom" data-zoom="-.2" aria-label="Zoom map out">−</button><button class="btn ghost" data-action="map-zoom" data-zoom=".2" aria-label="Zoom map in">＋</button></div></div>
 <div class="map-viewport" data-map-scroll><div class="map-canvas" style="--map-w:${Math.round(M.WIDTH*state.mapZoom)}px;--map-h:${Math.round(M.HEIGHT*state.mapZoom)}px">
 <img class="map-background" src="${chapter.image}" alt="${chapter.name} winding adventure route" draggable="false">
 ${buttons}</div></div><p class="map-hint">100 stages · <b>${points.filter(p=>saved.stars[p.level]).length}</b> completed. Tap a marker to play; choose any marker to enter that stage. Move around the map by scrolling.</p>`;
}

function art(category,name,emoji,cls='art'){return `<span class="${cls}"><img class="art-image" src="art/primary/${category}/${name}.png" alt="" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.style.visibility='visible'"><span class="icon-fallback" aria-hidden="true">${emoji}</span></span>`;}
function piece(type){if(type===null||type===undefined)return '';const name=E.TYPES[type];
 return `<img class="piece" src="art/primary/nuts/${name}.png" alt="" draggable="false" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.style.visibility='visible'"><span class="fallback" aria-hidden="true">${icons[type]}</span>`;
}
function nutVisual(c){return `<span class="nut-visual">${piece(c.type)}${c.special?`<span class="nut-special">${c.special==='rainbow'?'🌈':c.special==='blast'?'💥':c.special==='line-v'?'↕':'↔'}</span>`:''}</span>`;}
function blockerVisual(c){return c.ice?`<span class="overlay ice">❄${c.ice>1?'²':''}</span>`:c.lock?'<span class="overlay chain">🔒</span>':c.chest?'<span class="overlay chest">📦</span>':'';}
function nutKey(c){return c.type+':'+(c.special||'');}
function blockKey(c){return c.ice+':'+c.lock+':'+c.chest;}
function cellMarkup(c,i,w){if(!c)return '<div class="cell void" aria-hidden="true"></div>';
 return `<button class="cell" data-cell="${i}" data-nut-key="${nutKey(c)}" data-block-key="${blockKey(c)}" aria-label="${E.TYPES[c.type]} row ${Math.floor(i/w)+1} column ${i%w+1}">${nutVisual(c)}${blockerVisual(c)}</button>`;
}
function objectiveDisplay(g){
 const status=E.objectiveState(g);
 return status.map(o=>o.label+' '+Math.min(o.value,o.target)+'/'+o.target).join(' · ');
}
function objectivePercent(g){
 const status=E.objectiveState(g);
 return Math.round(100*status.reduce((sum,o)=>sum+Math.min(1,o.value/o.target),0)/status.length);
}
const toolGlyphs={hammer:'🔨',row:'➡️',column:'⬇️',cross:'✚',blast:'💥',color:'🌈',shuffle:'🔀',extra:'➕',drill:'🪛',unlock:'🗝️'};
function toolButtons(){
 return E.BOOSTERS.map(tool=>{
  const d=E.BOOSTER_META[tool];
  const image=tool==='hammer'?art('powerups','hammer','🔨','booster-art'):
   tool==='row'?art('powerups','row-clear','➡️','booster-art'):
   tool==='shuffle'?art('powerups','rainbow','🔀','booster-art'):
   tool==='extra'?art('powerups','nut-burst','➕','booster-art'):
   `<span class="booster-glyph" aria-hidden="true">${toolGlyphs[tool]}</span>`;
  const earned=P.unlocked(saved,tool),qty=P.count(saved,tool);
  return `<button data-tool="${tool}" class="${earned?qty?'ready':'empty':'locked'}" title="${earned?d.tip:'Beat level '+P.LEVEL_BY_TOOL[tool]+' to unlock'}" aria-label="${d.label}: ${earned?qty+' stocked, '+d.tip:'unlocks after level '+P.LEVEL_BY_TOOL[tool]}">${image}<span>${d.label.toUpperCase()}</span><small data-stock>${earned?'×'+qty:'LV '+P.LEVEL_BY_TOOL[tool]}</small></button>`;
 }).join('');
}
function game(){const g=state.game;if(!g)return '<p>Choose a level from the campaign map.</p>';
 const ratio=objectivePercent(g);
 return `<div class="topline game-topline"><button class="btn ghost" data-nav="campaign">← LEVELS</button><h2>LEVEL ${g.level} · ${g.cfg.title}</h2></div>
 <div class="game-stat"><div class="stat"><small>Score</small><b data-stat="score">${g.score.toLocaleString()}</b></div><div class="stat"><small>Moves</small><b data-stat="moves">${g.moves}</b></div><div class="stat objective-stat"><small>Objective</small><b data-objective>${objectiveDisplay(g)}</b></div></div>
 <div class="progress"><div data-progress style="width:${ratio}%"></div></div>
 <div class="board-wrap"><div class="board" style="--cols:${g.cfg.width}" role="group" aria-label="Nutbuster match-three board">${g.cells.map((c,i)=>cellMarkup(c,i,g.cfg.width)).join('')}</div></div>
 <div class="announcer" id="announcer">🎙 ${state.announcer||'SHOW ME THOSE NUTS!'}</div>
 <div class="boosters" role="group" aria-label="Tactical boosters">${toolButtons()}</div>
 <div class="tip">Earn new powers throughout Nutwood Meadows. Every reward and exclusive package restocks the booster vault.</div>
 <div class="actions game-actions"><button class="btn secondary" data-action="restart">RESTART</button><button class="btn secondary" data-nav="shop">NUT EMPORIUM</button><button class="btn ghost" data-action="sound">${state.sound?'🔊 Voice On':'🔇 Voice Off'}</button><button class="btn ghost" data-action="music">${state.music?'♫ Music On':'♫ Music Off'}</button></div>`;
}
function paintCells(cells){
 if(state.page!=='game')return;
 const g=state.game,board=screen.querySelector('.board');if(!board)return;
 for(let i=0;i<cells.length;i++){const c=cells[i];if(!c)continue;
  const el=board.querySelector(`[data-cell="${i}"]`);if(!el)continue;
  const nk=nutKey(c),bk=blockKey(c);
  if(el.dataset.nutKey!==nk){const vis=el.querySelector('.nut-visual');if(vis)vis.outerHTML=nutVisual(c);el.dataset.nutKey=nk;}
  if(el.dataset.blockKey!==bk){el.querySelectorAll('.overlay').forEach(node=>node.remove());el.insertAdjacentHTML('beforeend',blockerVisual(c));el.dataset.blockKey=bk;}
  el.setAttribute('aria-label',`${c.type===null?'empty':E.TYPES[c.type]} row ${Math.floor(i/g.cfg.width)+1} column ${i%g.cfg.width+1}`);
 }
}
function paintStats(){if(state.page!=='game'||!state.game)return;const g=state.game;
 const score=screen.querySelector('[data-stat="score"]'),moves=screen.querySelector('[data-stat="moves"]'),progress=screen.querySelector('[data-progress]'),objective=screen.querySelector('[data-objective]');
 if(score)score.textContent=g.score.toLocaleString();if(moves)moves.textContent=g.moves;
 if(objective)objective.textContent=objectiveDisplay(g);
 if(progress)progress.style.width=objectivePercent(g)+'%';
}
function selectCell(i){const old=screen.querySelector('.cell.selected');if(old)old.classList.remove('selected');
 state.selected=i;if(i>=0)screen.querySelector(`[data-cell="${i}"]`)?.classList.add('selected');
}
function updateTools(){screen.querySelectorAll('[data-tool]').forEach(el=>el.classList.toggle('active',el.dataset.tool===state.tool));}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function reducedMotion(){return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;}
async function swapAnimation(pair,epoch){
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
async function cascadeAnimation(stage,epoch){
 if(state.page!=='game'||epoch!==state.epoch)return;
 if(stage.kind==='repair'){paintCells(stage.cells);return;}
 const board=screen.querySelector('.board');if(!board)return;
 stage.clear.forEach(i=>board.querySelector(`[data-cell="${i}"]`)?.classList.add('clearing'));
 if(!reducedMotion())await sleep(190);
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
 paintCells(stage.cells);board.querySelectorAll('.clearing').forEach(el=>el.classList.remove('clearing'));
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
  for(const stage of result.stages||[]){await cascadeAnimation(stage,epoch);if(epoch!==state.epoch||state.page!=='game')return;}
  paintCells(E.snapshot(state.game).cells);paintStats();
  concludeMove(result);
 }finally{if(epoch===state.epoch)state.animating=false;}
}
function outcome(){const g=state.game,won=state.outcome==='win',stars=g.moves>10?3:g.moves>3?2:1;
 return `<div class="outcome-screen"><div class="outcome-symbol">${won?'🏆':'💔'}</div><h1>${won?'LEVEL COMPLETE!':'OUT OF MOVES!'}</h1>
 <p>${won?'YOUR NUTS ARE LEGENDARY!':'A devastating development for the premium nut economy.'}</p>
 <div class="outcome-stars">${won?'★'.repeat(stars)+'☆'.repeat(3-stars):'☆ ☆ ☆'}</div>
 <div class="outcome-numbers"><span>Level <b>${g.level}</b></span><span>Score <b>${g.score.toLocaleString()}</b></span><span>Objective <b>${objectiveDisplay(g)}</b></span></div>
 <div class="actions">${won?`<button class="btn green" data-action="play" data-level="${Math.min(500,g.level+1)}">NEXT LEVEL →</button>`:`<button class="btn green" data-action="continue-level">CONTINUE · +5 MOVES</button><button class="btn secondary" data-action="restart">RETRY LEVEL</button>`}
 <button class="btn secondary" data-nav="campaign">LEVEL MAP</button></div>
 ${won?'<p class="muted">Reward: 500 Golden Nuts + 10 Gems</p>':'<p class="muted">Need a little help? The Continue offer has a surprise at checkout.</p>'}</div>`;
}
function beginCheckout(index,from=state.page){
 if(!Number.isInteger(index)||!offers[index])return;
 state.epoch++;state.animating=false;state.checkout=index;state.checkoutFrom=from;state.checkoutStep=0;state.page='checkout';render();
}
function checkout(){const p=offers[state.checkout];if(!p)return '<p>Offer unavailable.</p>';
 const review=state.checkoutStep===0;
 const description=state.checkout===6?'Restores all five lives':state.checkout===7?'Five additional moves on your current board':p[2].toLocaleString()+' Golden Nuts · '+p[3].toLocaleString()+' Gems';
 return `<div class="checkout-screen"><div class="topline"><button class="btn ghost" data-action="checkout-back">← BACK</button><h2>${review?'EXCLUSIVE OFFER':'SECURE NUT CHECKOUT'}</h2></div>
 <div class="panel checkout-sheet"><h1>${review?'CONFIRM YOUR PACKAGE':'YOUR ORDER TOTAL'}</h1><div class="checkout-item"><span class="checkout-emoji">${p[1]}</span><div><b>${p[0]}</b><small>${description}</small></div></div>
 ${review?`<div class="checkout-price"><span>Advertised price</span><strong>${p[4]}</strong></div><p class="muted">Reserved just for you. Surely there are no catches.</p>
 <button class="btn green wide" data-action="checkout-review">PROCEED TO CHECKOUT →</button>`:
 `<div class="checkout-price"><span>Package</span><strong class="cross">${p[4]}</strong></div><div class="checkout-price"><span>Mandatory Nutbuster generosity adjustment</span><b>−100%</b></div>
 <div class="checkout-total"><span>TOTAL DUE</span><strong>FREE</strong><small>$0.00</small></div>
 <p class="muted">Parody checkout. No payment details, billing connection, or actual transaction.</p><button class="btn green wide" data-action="checkout-complete">COMPLETE ORDER · FREE</button>`}
 </div></div>`;
}
const shopSprites=['golden-nuts','golden-nuts','gift','treasure','vip-crown','treasure'];
const products=[['GIGANTIC NUT PACKAGE','🌰',50000,250,'$199.99'],['RIDICULOUSLY PREMIUM GEMS','💎',2000,2000,'$499.99'],['ROYAL SQUIRREL BUNDLE','🐿️',9999,500,'$99.99'],['HUNDRED YEAR CHEST','🧰',10000,150,'$79.99'],['ABSOLUTELY NECESSARY VIP','👑',1000,100,'$29.99/mo'],['MYSTERY NUT CRATE','🎲',3000,30,'$24.99']];
const offers=[...products,['EMERGENCY HEART REFILL','❤️',0,0,'$4.99'],['EXTRA FIVE MOVES','➕',0,0,'$9.99']];
function shop(){return `<div class="topline"><h2>THE PREMIER NUT EMPORIUM</h2><span class="pill">VIP DEALS</span></div><p class="muted">Extraordinary bundles. Unbelievable prices. One last step before checkout.</p><div class="shop-grid">${products.map((p,i)=>`<div class="panel shop-item">${art('economy',shopSprites[i],p[1])}<h3>${p[0]}</h3><p class="muted">+${p[2].toLocaleString()} nuts · +${p[3].toLocaleString()} gems</p><div class="offer-price">${p[4]}</div><button class="btn green" data-action="claim" data-item="${i}">BUY PACKAGE</button></div>`).join('')}</div>`;}
function rewards(){let mins=Math.max(0,Math.ceil((saved.chestReadyAt-Date.now())/60000));return `<div class="topline"><h2>REWARDS, REWARDS, REWARDS</h2></div><div class="reward-lines"><div class="panel">${art('economy','piggy-bank','🐷')}<b>PIGGY BANK</b><p class="muted">Your vault is bursting. Premium extraction available.</p><button class="btn green" data-action="pig">SMASH PIG</button></div><div class="panel">${art('economy','treasure','🧰')}<b>3-HOUR TREASURE CHEST</b><p class="muted">${mins===0?'Timer complete!':mins+' minutes remaining. Instant unlock available.'}</p><button class="btn green" data-action="chest">${mins===0?'OPEN CHEST':'OPEN INSTANTLY'}</button></div><div class="panel">${art('economy','gift','💌')}<b>FRIEND REFERRAL</b><p class="muted">Invite a friend. Or nominate yourself.</p><button class="btn green" data-action="friend">I AM MY OWN FRIEND</button></div><div class="panel">${art('economy','vip-crown','🎟️')}<b>ELITE PREMIUM SEASON PASS</b><p class="muted">Premium track, supreme track, and downright suspicious track.</p><button class="btn green" data-action="pass">UNLOCK PREMIUM</button></div><div class="panel"><span class="art">📅</span><b>DAILY LOGIN STREAK</b><p class="muted">Streak: ${saved.streak} · Missed days are forgiven.</p><button class="btn green" data-action="daily">CLAIM TODAY</button></div><div class="panel"><span class="art">🎰</span><b>CHOICE LOOT BOX</b><p class="muted">The odds have never been so promising.</p><button class="btn green" data-action="loot">GIVE ME THE GOOD ONE</button></div></div><p class="tip">Premium rewards refresh whenever you need another hit of excitement.</p>`;}
function settings(){const lev=saved.levels||{voice:.9,music:.28,reactions:.38};return `<div class="topline"><h2>${uiIcon('settings')} AUDIO & SETTINGS</h2><button class="btn ghost" data-nav="home">BACK</button></div><div class="panel audio-settings"><p class="muted">Separate levels for the announcer, music and compulsory little grunts.</p>${[['voice','Announcer'],['music','Music'],['reactions','Click grunts']].map(([id,label])=>`<label>${label}<input type="range" data-volume="${id}" min="0" max="100" value="${Math.round(lev[id]*100)}"><output>${Math.round(lev[id]*100)}%</output></label>`).join('')}<div class="actions"><button class="btn secondary" data-action="sound">${state.sound?'Mute voice':'Unmute voice'}</button><button class="btn secondary" data-action="music">${state.music?'Mute music':'Unmute music'}</button></div><div class="panel" style="margin-top:12px"><b>GAME UPDATES</b><p class="muted" data-update-status>Manually check for signed new releases. Never required to play.</p><button class="btn secondary" onclick="window.NutbusterUpdates.check()">CHECK FOR UPDATES</button></div></div>`;}
function render(){counters();screen.classList?.toggle('campaign-map-active',state.page==='campaign');
 screen.classList?.toggle('game-active',state.page==='game');
 screen.innerHTML=state.page==='home'?home():state.page==='campaign'?campaign():state.page==='game'?game():state.page==='shop'?shop():state.page==='settings'?settings():state.page==='checkout'?checkout():state.page==='outcome'?outcome():rewards();
 if(state.page==='campaign'&&state.chapter&&typeof screen.querySelector==='function'){
  const center=()=>{const selected=screen.querySelector('[data-current="true"]'),viewport=screen.querySelector('[data-map-scroll]');
   if(selected&&viewport){viewport.scrollLeft=Math.max(0,selected.offsetLeft-viewport.clientWidth/2);viewport.scrollTop=Math.max(0,selected.offsetTop-viewport.clientHeight/2);}};
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(center);else setTimeout(center,0);
 }
}
function start(n){state.epoch++;state.animating=false;
 if(saved.hearts<=0){saved.hearts=5;notice('ENERGY RESTORED!');}
 saved.hearts--;persist();const level=Math.min(500,Math.max(1,Number(n)||1));
 state.game=E.create(level,Math.floor(Math.random()*0xffffffff));state.page='game';state.selected=-1;state.tool=null;state.outcome=null;
 state.announcer='PREPARE TO BUST SOME NUTS!';render();window.NutAudio?.voice('nutbuster-soft');
}
function concludeMove(result){
 if(result.won){const g=state.game,stars=g.moves>10?3:g.moves>3?2:1;
  saved.stars[g.level]=Math.max(stars,saved.stars[g.level]||0);saved.unlocked=Math.max(saved.unlocked,Math.min(500,g.level+1));saved.completed++;
  gain(500,10);persist();announce('UNBELIEVABLE PERFORMANCE! YOUR NUTS ARE LEGENDARY!','win');}
 else if(result.lost)announce('OOOH... THAT WAS CLOSE.','close');
 else if(result.loops>=6)announce('NUTBUSTERRRR!','nutbuster');
 else if(result.loops>=4)announce('THEY JUST KEEP COMING!','cascade');
 else if(result.loops>=2)announce('MAGNIFICENT NUTS!','magnificent');
 else if(result.removed>=5)announce('OOOH, THAT IS A BIG ONE!','big-one');
 else {announce('NICE ONE!');window.NutAudio?.grunt();}
 paintStats();
 const fx=result.won?'supernova':result.cracked?'shell-crack':result.loops>=3?'rainbow':'burst';
 if(result.loops)window.NutFX?.emit(fx,screen.querySelector?.('.board-wrap'));
 if(result.won||result.lost){state.outcome=result.won?'win':'loss';state.page='outcome';render();}
}
function doSwap(a,b){if(state.animating||state.page!=='game')return;
 const r=E.swap(state.game,a,b);if(!r.valid){notice('Choose two adjacent nuts.');selectCell(-1);return;}
 void applyMove(r);
}
function cell(i){if(!state.game||state.game.won||state.game.lost||state.animating)return;
 if(state.tool){const tool=state.tool;state.tool=null;updateTools();const result=activateBooster(tool,i);if(result)void applyMove(result);return;}
 if(state.selected<0){selectCell(i);return;}if(state.selected===i){selectCell(-1);return;}doSwap(state.selected,i);
}
function action(a,button){
 if(a==='play'){start(button.dataset.level);return;}
 if(a==='world-map'){state.chapter=0;render();return;}
 if(a==='map-zoom'){state.mapZoom=Math.max(.7,Math.min(1.5,Math.round((state.mapZoom+(Number(button.dataset.zoom)||0))*10)/10));render();return;}
 if(a==='next-chapter'){state.chapter=Math.max(1,Math.min(5,Number(button.dataset.chapter)||1));render();return;}
 if(a==='restart'){start(state.game?.level||1);return;}
 if(a==='claim'){beginCheckout(Number(button.dataset.item));return;}
 if(a==='checkout-review'){state.checkoutStep=1;render();return;}
 if(a==='checkout-back'){if(state.checkoutStep){state.checkoutStep=0;render();}else nav(state.checkoutFrom==='outcome'?'outcome':state.checkoutFrom);return;}
 if(a==='checkout-complete'){if(state.checkoutStep!==1||state.checkout===null)return;
  const i=state.checkout,p=offers[i];const dest=state.checkoutFrom;
  if(i===6){saved.hearts=5;persist();}
  else if(i===7){if(state.game){E.booster(state.game,'extra',-1);}}
  else {gain(p[2],p[3]);if(i===4)saved.vip=true;persist();}
  state.checkout=null;state.checkoutStep=0;notice('ORDER COMPLETE · TOTAL PAID $0.00');
  announce('THAT IS AN ENORMOUS PACKAGE!','package');
  state.page=(dest==='outcome'||dest==='game')?'game':dest==='home'?'home':'shop';
  if(state.page==='game'&&(!state.game||state.game.won))state.page='campaign';
  render();window.NutFX?.emit('coin-shower');return;
 }
 if(a==='continue-level'){beginCheckout(7,'outcome');return;}
 if(a==='vip'){beginCheckout(4);return;}
 if(a==='refill'){beginCheckout(6);return;}
 if(a==='sound'){state.sound=!state.sound;saved.sound=state.sound;window.NutAudio?.setVoiceEnabled(state.sound);persist();
   if(state.page==='game'){screen.querySelectorAll('[data-action="sound"]').forEach(b=>b.textContent=state.sound?'🔊 Voice On':'🔇 Voice Off');}else render();return;}
 if(a==='music'){state.music=!state.music;saved.music=state.music;window.NutAudio?.setMusicEnabled(state.music);persist();
   if(state.page==='game'){screen.querySelectorAll('[data-action="music"]').forEach(b=>b.textContent=state.music?'♫ Music On':'♫ Music Off');}else render();return;}
 if(a==='daily'){saved.streak++;gain(500,10);notice('DAILY BONUS CLAIMED.');announce('SATISFACTION GUARANTEED!','satisfaction');render();return;}
 if(a==='pig'||a==='chest'||a==='friend'||a==='pass'||a==='loot'){
  if(a==='chest')saved.chestReadyAt=Date.now()+3*60*60*1000;
  gain(1000,100);notice({pig:'PIG OBLITERATED.',chest:'CHEST UNLOCKED.',friend:'YOU ARE AN EXCELLENT FRIEND TO YOURSELF.',pass:'EVERY PREMIUM TIER ACTIVATED.',loot:'JACKPOT!'}[a]);
  announce('PREMIUM REWARDS DELIVERED!',{pig:'oh-my',chest:'nutbuster',friend:'nutbuster-soft',pass:'premium',loot:'package'}[a]);
  render();window.NutFX?.emit(a==='chest'?'chest-open':'coin-shower');return;
 }
}
screen.addEventListener('click',e=>{window.NutAudio?.unlock();window.NutAudio?.grunt();if(Date.now()<swipeGuard)return;
 const target=e.target.closest('button');if(!target||state.animating)return;
 if(target.dataset.cell!==undefined){cell(Number(target.dataset.cell));return;}
 if(target.dataset.tool){const tool=target.dataset.tool;if(!state.game||state.page!=='game')return;
  if(!P.unlocked(saved,tool)||!P.count(saved,tool)){activateBooster(tool,-1);return;}
  if(!E.BOOSTER_META[tool].targeted){
   const res=activateBooster(tool,-1);if(!res)return;
   state.tool=null;updateTools();
   if(res.stages?.length)void applyMove(res);else {paintCells(E.snapshot(state.game).cells);paintStats();}
   announce('UNLIMITED SATISFACTION!','oh-my');
  }else{state.tool=state.tool===tool?null:tool;selectCell(-1);updateTools();}return;}
 if(target.dataset.chapter){state.chapter=Number(target.dataset.chapter);render();return;}
 if(target.dataset.action)action(target.dataset.action,target);else if(target.dataset.nav)nav(target.dataset.nav);
});
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{window.NutAudio?.unlock();window.NutAudio?.grunt();nav(b.dataset.nav);}));
let pointer=null,swipeGuard=0;screen.addEventListener('pointerdown',e=>{const t=e.target.closest('[data-cell]');if(t)pointer={i:Number(t.dataset.cell),x:e.clientX,y:e.clientY};});screen.addEventListener('pointerup',e=>{window.NutAudio?.unlock();if(!pointer||!state.game||state.page!=='game'||state.animating)return;const startPoint=pointer;pointer=null;const dx=e.clientX-startPoint.x,dy=e.clientY-startPoint.y;if(Math.max(Math.abs(dx),Math.abs(dy))<24||state.tool)return;const w=state.game.cfg.width;let j=startPoint.i+(Math.abs(dx)>Math.abs(dy)?(dx>0?1:-1):(dy>0?w:-w));if(E.adjacent(state.game,startPoint.i,j)){swipeGuard=Date.now()+400;doSwap(startPoint.i,j);}});
screen.addEventListener('input',e=>{const id=e.target?.dataset?.volume;if(!id||!['voice','music','reactions'].includes(id))return;saved.levels={...saved.levels,[id]:Number(e.target.value)/100};window.NutAudio?.setLevels?.(saved.levels);persist();const out=e.target.parentElement?.querySelector('output');if(out)out.textContent=e.target.value+'%';});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.page==='game')nav('campaign');else if(e.key==='Escape'&&state.page==='checkout')action('checkout-back',{});});
window.NutbusterApp={start,nav,getState:()=>state,getSave:()=>saved};render();
})();
