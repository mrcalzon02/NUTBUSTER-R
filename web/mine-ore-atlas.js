/* Owner-approved Nutvale ore sprites: exact source cells, no emoji or stock art.
   Generated from nutvale-mines-ore-atlas-approved.png by tools/slice_nutvale_ore.py.
   The hidden tile chooses artwork independently of its hidden ore contents.
*/
(function(root){'use strict';
const SOURCE='art/nutvale/mining-ore/';
const names=Object.freeze([
 ['stone-light','stone-dark','stone-sandstone','stone-crack-1','stone-crack-2','stone-shattered'],
 ['coal-surface','coal-deep','gold-ore','copper-ore','silver-ore','blue-crystal'],
 ['amethyst-crystal','emerald-crystal','amethyst-geode','fossil','ruby-ore','lava-stone'],
 ['barren-rubble','sapphire-ore','pink-crystal','aqua-gold-crystal','magma-ore','prismatic-crystal']
]);
const variants=Object.freeze({
  intact:[[0,0],[0,1],[0,2]],
  cracked1:[[0,3]],
  cracked2:[[0,4]],
  barren:[[0,5],[3,0]],
  ordinary:[[1,0],[1,1],[1,3],[1,4]],
  rich:[[1,2],[1,5],[2,0],[2,1],[2,4],[2,5],[3,1],[3,2],[3,4]],
  crystal:[[2,2],[2,3],[3,3],[3,5]]
});
function select(cell){
 const x=Number.isInteger(cell?.x)?cell.x:0,y=Number.isInteger(cell?.y)?cell.y:0;
 const n=Math.abs(x*7+y*11);
 const choices=!cell?.done?(cell?.hits>=2?variants.cracked2:cell?.hits>=1?variants.cracked1:variants.intact):(variants[cell.kind]||variants.barren);
 return choices[n%choices.length];
}
function sprite(cell){
 const [r,c]=select(cell);
 return '<img class="mine-ore-slice" src="'+SOURCE+'r'+(r+1)+'c'+(c+1)+'.png" alt="" aria-hidden="true" loading="eager">';
}
const api=Object.freeze({SOURCE,names,select,sprite});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.MineOreAtlas=api;
})(typeof window!=='undefined'?window:globalThis);
