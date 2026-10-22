/* Two-hit ice: animate each real damage step using existing authored sprite art. */
(function(root){'use strict';
 const art='art/primary/overlays/frost.png';
 function plan(stage){
  if(!stage||!Array.isArray(stage.before)||!Array.isArray(stage.afterClear))return [];
  const hits=[];
  for(let i=0;i<stage.before.length;i++){
   const old=stage.before[i]?.ice||0,now=stage.afterClear[i]?.ice||0;
   for(let layer=old;layer>now;layer--)hits.push({index:i,step:old-layer,from:layer,to:layer-1,breaks:layer===1});
  }
  return hits;
 }
 const pause=ms=>new Promise(resolve=>(root.setTimeout||setTimeout)(resolve,ms));
 async function animate(stage,board,opts={}){
  const hits=plan(stage);
  if(!board||!hits.length)return;
  const active=opts.active||(()=>true),reduced=!!opts.reducedMotion;
  const steps=Math.max(...hits.map(h=>h.step))+1;
  for(let step=0;step<steps;step++){
   if(!active())return;
   const tiles=hits.filter(h=>h.step===step).map(h=>{
    const tile=board.querySelector(`[data-cell="${h.index}"]`);
    const overlay=tile?.querySelector('.overlay.blocker-art.ice');
    const image=overlay?.querySelector('.blocker-sprite');
    return tile&&overlay&&image?{...h,tile,overlay,image}:null;
   }).filter(Boolean);
   tiles.slice(0,12).forEach((hit,i)=>root.NutSFX?.play('ice',{delay:i*.018,pitch:hit.from>1?.82:1.15}));
   for(const hit of tiles){
    hit.overlay.dataset.strength=String(hit.from);
    hit.image.src=art;
    hit.overlay.classList.remove('ice-hit','ice-damaged','ice-break');
    if(!reduced){void hit.overlay.offsetWidth;hit.overlay.classList.add('ice-hit');}
   }
   if(tiles.length&&!reduced)await pause(160);
   if(!active())return;
   for(const hit of tiles){
    hit.overlay.classList.remove('ice-hit');
    if(hit.breaks){
     hit.overlay.classList.add('ice-break');
     if(!reduced)root.NutFX?.emit('ice-shatter',hit.tile);
    }else{
     hit.image.src=art;
     hit.overlay.dataset.strength=String(hit.to);
     const marker=hit.overlay.querySelector('.blocker-layer-count');if(marker)marker.textContent=String(hit.to);
     if(!reduced)hit.overlay.classList.add('ice-damaged');
    }
   }
   if(tiles.length&&!reduced)await pause(tiles.some(h=>h.breaks)?220:100);
   if(!active())return;
   for(const hit of tiles){
    if(hit.breaks)hit.overlay.remove();
    else hit.overlay.classList.remove('ice-damaged');
   }
  }
 }
 const api=Object.freeze({plan,animate});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.NutIceFX=api;
})(typeof window!=='undefined'?window:globalThis);
