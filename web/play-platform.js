(function(root){'use strict';
const bridge=root.NUTBUSTER_PLAY_BRIDGE,paid=new Set([0,1,2,3,4,5,8]);
const api={required:true,active:!!bridge,prices:{},lastStatus:'',
 isPaidIndex:i=>paid.has(i),price:i=>api.prices[i]||'UNAVAILABLE',
 catalog(values){api.prices=Object.fromEntries(Object.entries(values||{}).filter(([i,v])=>paid.has(Number(i))&&typeof v==='string'&&v.length<64));root.NutbusterApp?.refresh?.();},
 status(message){api.lastStatus=String(message||'');root.NutbusterApp?.platformStatus?.(api.lastStatus);},
 buy(i){if(paid.has(Number(i)))bridge?.buy?.(Number(i));},
 confirmFulfillment(id){if(typeof id==='string')bridge?.confirmFulfillment?.(id);},
 restore(){bridge?.restorePurchases?.();bridge?.refreshCatalog?.();},
 achievements(){bridge?.achievements?.();},friends(){bridge?.friends?.();},
 linkAccount(){bridge?.linkAccount?.();},unlinkAccount(){bridge?.unlinkAccount?.();},
 achievement(level){for(const n of [1,100,500,1000])if(n===level)bridge?.achievementUnlocked?.('level_'+n);}
};
root.NutbusterPlay=api;
})(window);
