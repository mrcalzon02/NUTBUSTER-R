/* Self-contained companion view: portraits and seven colored feed tokens from the sprite atlas. */
(function(root){'use strict';
const C=root.NutCompanions;
function render(save,lastMessage=''){
 if(!C)return '<p>Companion collection unavailable.</p>';
 const state=C.ensure(save),active=C.PETS.find(p=>p.id===state.active),pet=state.pets[active.id];
 const mood=Math.round((pet.bond+pet.hunger)/2);
 const portraits=C.PETS.map(p=>{
  const selected=p.id===state.active,record=state.pets[p.id];
  return `<button type="button" class="companion-portrait ${selected?'active':''}" data-action="companion-select" data-pet-id="${p.id}" aria-pressed="${selected}" aria-label="Select ${p.name} the ${p.species}; bond ${record.bond} percent"><img src="${C.art('portrait',p.id)}" alt="" loading="lazy"><b>${p.name}</b><small>${record.bond}% bond</small></button>`;
 }).join('');
 const feeds=C.FOOD.map(f=>{
  const stock=state.feedStock[f.id];
  return `<div class="companion-feed-card"><img src="${C.art('ui','feed-'+f.id)}" alt="" loading="lazy"><b>${f.name}</b><small>+${f.bond} bond · ${Math.round(f.chance*100)}% gem chance</small><small>Owned: ${stock}</small><div class="companion-feed-actions"><button class="btn secondary" type="button" data-action="companion-buy" data-food-id="${f.id}" aria-label="Buy ${f.name} for ${f.cost} Golden Nuts">BUY · ${f.cost} NUTS</button><button class="btn green" type="button" data-action="companion-feed" data-food-id="${f.id}" ${stock?'':'disabled'} aria-label="Feed ${active.name} ${f.name}">FEED</button></div></div>`;
 }).join('');
 return `<section class="companion-page"><div class="topline"><h2>WOODLAND COMPANIONS</h2><button class="btn ghost" data-nav="home">← HOME</button></div><p class="muted">Make a woodland friend, buy colorful Paw Feed with Golden Nuts, and occasionally discover a gem gift. No real-money payments.</p>
 <div class="companion-hero panel"><img src="${C.art('portrait',active.id)}" alt="${active.name} showing their woodland magic"><div><h3>${active.name} · ${active.species}</h3><p>${active.blessing} · ${C.rank(pet.bond)}</p><label>Friendship <b>${pet.bond}/100</b><meter value="${pet.bond}" min="0" max="100">${pet.bond}%</meter></label><label>Fullness <b>${pet.hunger}/100</b><meter value="${pet.hunger}" min="0" max="100">${pet.hunger}%</meter></label><label>Well-being <b>${mood}/100</b><meter value="${mood}" min="0" max="100">${mood}%</meter></label><small>${pet.feedings} feedings · ${state.totalGems} gem gifts collected</small></div></div>
 ${lastMessage?`<p class="companion-last-gift" role="status">${lastMessage}</p>`:''}
 <h3 class="section">Choose a companion</h3><div class="companion-gallery">${portraits}</div><h3 class="section">Paw Feed Market</h3><p class="muted">Bronze → Silver → Gold → Blue → Green → Violet → Ruby. Higher feed improves companionship faster and has better gem odds. At least one gem gift is guaranteed after eight giftless feedings.</p><div class="companion-feed-grid">${feeds}</div><p class="tip">They never disappear, and there are no compulsory timers or punishments for taking a break.</p></section>`;
}
const api={render};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.NutCompanionsUI=api;
})(typeof window!=='undefined'?window:globalThis);
