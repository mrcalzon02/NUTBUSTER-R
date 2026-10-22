/* Nutbuster visual effects: existing game sprites, no external image downloads or canvas dependencies. */
(function(root){'use strict';
 const assets=Object.freeze({
  burst:'art/additions/effects/match-burst.png',
  'shell-crack':'art/additions/effects/shell-fragments.png',
  'ice-shatter':'art/additions/effects/ice-shatter.png',
  'chain-break':'art/additions/effects/chain-break.png',
  supernova:'art/additions/effects/shell-supernova.png',
  rainbow:'art/additions/effects/rainbow-pulse.png',
  'chest-open':'art/additions/effects/chest-pop.png',
  'coin-shower':'art/additions/effects/coin-shower.png'
 });
 const rewards=new Set(['chest-open','coin-shower']);
 function emit(kind,target){
  const src=assets[kind],doc=root.document;
  if(!src||!doc||!doc.body||typeof doc.createElement!=='function')return false;
  const img=doc.createElement('img');img.src=src;img.alt='';img.setAttribute('aria-hidden','true');
  img.className='nut-fx'+(rewards.has(kind)?' rewards':'')+(kind==='ice-shatter'?' ice-shatter':'');
  let centerX=(root.innerWidth||400)/2,centerY=(root.innerHeight||700)*.46;
  if(target&&typeof target.getBoundingClientRect==='function'){
   const bounds=target.getBoundingClientRect();centerX=bounds.left+bounds.width/2;centerY=bounds.top+bounds.height/2;
   if(kind==='ice-shatter'){const size=Math.max(38,Math.min(94,bounds.width*1.7));img.style.width=size+'px';img.style.height=size+'px';}
  }
  img.style.left=centerX+'px';img.style.top=centerY+'px';doc.body.appendChild(img);
  const duration=rewards.has(kind)?1250:kind==='ice-shatter'?600:850;
  (root.setTimeout||setTimeout)(()=>img.remove(),duration);
  return true;
 }
 root.NutFX={emit,assets};
})(window);
