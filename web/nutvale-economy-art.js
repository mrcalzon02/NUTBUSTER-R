/* Approved Nutvale production artwork.
 * The existing currency, Writ and manufactured-goods counters remain authoritative.
 * Art reflects cosmetic display quality, not extra economic value or spendable inventory.
 */
(function(root){'use strict';
const PREFIX='art/nutvale/mining-economy/';
const CURRENCY=Object.freeze(["copper-coins","silver-coins","gold-coins","gold-medallion","rainbow-coins","rainbow-coin-stacks","rainbow-coin","copper-acorn-bag","gold-acorn-bag","gold-coin-chest","gemmed-currency-chest","violet-coins","acorn-copper-coins","acorn-silver-coins","acorn-gold-coins","acorn-medallion","rainbow-coins-pile","rainbow-medallion"]);
const WRITS=Object.freeze(["red-writ","gold-writ","silver-writ","blue-writ","violet-writ","leaf-writ","red-writ-alt","royal-violet-writ","royal-blue-writ","royal-gold-writ","acorn-gold-writ","acorn-blue-writ","acorn-violet-writ"]);
const GOODS=Object.freeze(["crate-bottles","crate-mining-supplies","crate-cloth","crate-sacks-and-scrolls","crate-golden-luxury"]);
const finite=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const path=(kind,id)=>PREFIX+kind+'/'+id+'.png';
function money(dollars){
 const n=finite(dollars);
 // Balance determines only which coin illustration is shown.
 const idx=n<100?0:n<250?1:n<500?2:n<1000?3:n<2000?4:n<4000?5:n<8000?6:n<16000?7:n<32000?8:n<64000?9:n<128000?10:n<256000?11:n<512000?12:n<1000000?13:n<2000000?14:n<4000000?15:n<8000000?16:17;
 return path('currency',CURRENCY[idx]);
}
function goods(refineryTier){
 const t=Number.isInteger(refineryTier)?Math.max(0,Math.min(5,refineryTier)):0;
 // There are six refinery states and five approved crate styles.
 return path('goods',GOODS[Math.min(4,t)]);
}
function writs(count){
 return path('writs',WRITS[Math.min(WRITS.length-1,finite(count))]);
}
function image(src,label,emoji){
 if(typeof src!=='string'||!src.startsWith(PREFIX))return emoji||'';
 return '<span class="mines-economy-icon"><img src="'+src+'" alt="'+(label||'')+'" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden aria-hidden="true">'+(emoji||'')+'</span></span>';
}
const api={PREFIX,CURRENCY,WRITS,GOODS,path,money,goods,writs,image};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutvaleEconomyArt=api;
})(typeof window!=='undefined'?window:globalThis);
