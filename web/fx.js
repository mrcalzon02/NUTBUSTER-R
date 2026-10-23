/* Owner-authored local effects: every cleared nut gets its own shake + Nutsplosion.
   Booster activations have independent sprite effects, even without a match cascade. */
(function(root){'use strict';
 const base='art/additions/effects/';
 const assets=Object.freeze({
  burst:base+'match-burst.png',
  'shell-crack':base+'shell-fragments.png',
  'ice-shatter':base+'ice-shatter.png',
  'chain-break':base+'chain-break.png',
  supernova:base+'shell-supernova.png',
  rainbow:base+'rainbow-pulse.png',
  'chest-open':base+'chest-pop.png',
  'coin-shower':base+'coin-shower.png',
  'sparkle-burst':base+'sparkle-burst.png',
  'shell-ring':base+'shell-ring.png',
  'horizontal-clear':base+'horizontal-clear.png',
  'vertical-clear':base+'vertical-clear.png',
  'rocket-impact':base+'rocket-impact.png',
  'time-boost':base+'time-boost.png',
  'royal-boost':base+'royal-boost.png',
  'golden-acorn-glow':base+'golden-acorn-glow.png',
  'focus-ring':base+'focus-ring.png',
  confetti:base+'confetti.png'
 });
 const boosterEffects=Object.freeze({
  hammer:['shell-crack','sparkle-burst'],
  row:['horizontal-clear'],
  column:['vertical-clear'],
  cross:['horizontal-clear','vertical-clear'],
  blast:['supernova'],
  color:['rainbow'],
  shuffle:['shell-ring','rainbow'],
  extra:['time-boost'],
  drill:['rocket-impact'],
  unlock:['chain-break'],
  quake:['supernova','shell-crack'],
  'triple-row':['horizontal-clear','shell-ring'],
  'triple-column':['vertical-clear','sparkle-burst'],
  starburst:['rocket-impact','sparkle-burst'],
  spectrum:['rainbow','shell-ring'],
  frostbreaker:['ice-shatter','sparkle-burst'],
  butter_hold:['golden-acorn-glow'],
  jam_hold:['royal-boost']
 });
 const specialEffects=Object.freeze({
  'line-h':'horizontal-clear','line-v':'vertical-clear',
  blast:'supernova',rainbow:'rainbow'
 });
 const rewards=new Set(['chest-open','coin-shower']);
 function emit(kind,target,opts={}){
  const src=assets[kind],doc=root.document;
  if(!src||!doc||!doc.body||typeof doc.createElement!=='function')return false;
  const img=doc.createElement('img');img.src=src;img.alt='';img.setAttribute('aria-hidden','true');
  const variant=opts.variant==='tile'?' tile':opts.variant==='booster'?' booster':'';
  img.className='nut-fx'+variant+(rewards.has(kind)?' rewards':'')+(kind==='ice-shatter'?' ice-shatter':'');
  let centerX=(root.innerWidth||400)/2,centerY=(root.innerHeight||700)*.46;
  if(target&&typeof target.getBoundingClientRect==='function'){
   const bounds=target.getBoundingClientRect();centerX=bounds.left+bounds.width/2;centerY=bounds.top+bounds.height/2;
   if(variant===' tile'||kind==='ice-shatter'){
    const size=Math.max(34,Math.min(100,bounds.width*1.75));
    img.style.width=size+'px';img.style.height=size+'px';
   }
  }
  img.style.left=centerX+'px';img.style.top=centerY+'px';doc.body.appendChild(img);
  const duration=variant===' tile'?470:rewards.has(kind)?1250:kind==='ice-shatter'?600:850;
  (root.setTimeout||setTimeout)(()=>img.remove(),duration);
  return true;
 }
 function booster(id,target){
  const effects=boosterEffects[id];
  if(!effects)return false;
  return effects.map(kind=>emit(kind,target,{variant:'booster'})).some(Boolean);
 }
 function hazard(stage,board){
  if(!stage||stage.kind!=='hazard')return 0;
  let count=0;
  for(const [indices,kind] of [[stage.expired||[],'supernova'],[stage.spread||[],'shell-ring']]){
   for(const i of indices){
    const tile=board?.querySelector?.('[data-cell="'+i+'"]');
    if(tile&&emit(kind,tile,{variant:'tile'}))count++;
   }
  }
  return count;
 }
 function planCascade(stage,wave=1){
  const removed=[],blockers=[],specials=[];
  if(!stage||!Array.isArray(stage.before)||!Array.isArray(stage.afterClear))return {removed,blockers,specials};
  const intensity=stage.clear?.length>=9?'shell-crack':wave>=3?'shell-crack':wave>=2||stage.clear?.length>=5?'sparkle-burst':'burst';
  for(const i of new Set(Array.isArray(stage.clear)?stage.clear:[])){
   const before=stage.before[i],after=stage.afterClear[i];
   if(!before||!after)continue;
   if(before.special&&specialEffects[before.special])specials.push({index:i,kind:specialEffects[before.special]});
   if(before.type!==null&&after.type===null){
    removed.push({index:i,kind:intensity});
    continue;
   }
   // Ice has its own layered shake/crack/shatter animation in ice-effects.js.
   if((before.lock||0)>(after.lock||0))blockers.push({index:i,kind:'chain-break'});
   if((before.rock||0)>(after.rock||0))blockers.push({index:i,kind:'shell-crack'});
   if((before.chest||0)>(after.chest||0))blockers.push({index:i,kind:(after.chest||0)===0?'chest-open':'shell-crack'});
   if((before.jam||0)>(after.jam||0))blockers.push({index:i,kind:'shell-ring'});
   if((before.fuse||0)>(after.fuse||0))blockers.push({index:i,kind:'sparkle-burst'});
  }
  return {removed,blockers,specials};
 }
 function burstCascade(stage,board,wave=1){
  const plan=planCascade(stage,wave);
  let emitted=0;
  for(const item of [...plan.removed,...plan.blockers,...plan.specials]){
   const tile=board?.querySelector?.('[data-cell="'+item.index+'"]');
   if(tile&&emit(item.kind,tile,{variant:'tile'}))emitted++;
  }
  return emitted;
 }
 root.NutFX={emit,booster,hazard,planCascade,burstCascade,assets,boosterEffects};
})(window);
