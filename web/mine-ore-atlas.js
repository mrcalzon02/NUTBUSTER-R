/* Approved 6x4 Nutvale Mines ore atlas; exact pixel rectangles, not placeholders.
   Source: nutvale/source-atlases/nutvale-mines-ore-atlas-approved.png
   Visual selection must never change mine probability, ore class or persistence.
*/
(function(root){'use strict';
const SOURCE='art/nutvale/mines/nutvale-mines-ore-atlas-approved.png';
const X=[37,270,504,736,968,1200];
const Y=[55,295,536,777];
const WIDTH=212, HEIGHT=215, ATLAS_WIDTH=1448, ATLAS_HEIGHT=1086;
const names=Object.freeze([
 ['stone-light','stone-dark','stone-sandstone','stone-crack-1','stone-crack-2','stone-shattered'],
 ['coal-surface','coal-deep','gold-ore','copper-ore','silver-ore','blue-crystal'],
 ['amethyst-crystal','emerald-crystal','amethyst-geode','fossil','ruby-ore','lava-stone'],
 ['barren-rubble','sapphire-ore','pink-crystal','aqua-gold-crystal','magma-ore','prismatic-crystal']
]);
function select(cell){
 if(!cell||!cell.done){const hits=Math.max(0,Number(cell?.hits)||0);return hits>=2?[0,4]:hits>=1?[0,3]:[0,0];}
 return cell.kind==='barren'?[3,0]:cell.kind==='rich'?[1,2]:cell.kind==='crystal'?[1,5]:[1,0];
}
function sprite(cell){
 const [row,col]=select(cell);
 const px=(100*X[col]/(ATLAS_WIDTH-WIDTH)).toFixed(4)+'%';
 const py=(100*Y[row]/(ATLAS_HEIGHT-HEIGHT)).toFixed(4)+'%';
 return '<span class="mine-ore-slice" style="background-position:'+px+' '+py+'" aria-hidden="true"></span>';
}
const api=Object.freeze({SOURCE,WIDTH,HEIGHT,names,select,sprite});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.MineOreAtlas=api;
})(typeof window!=='undefined'?window:globalThis);
