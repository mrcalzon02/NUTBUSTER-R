/* Optional elemental challenge book: 30 stages in each of five regions.
   IDs 501–650 never consume or replace a main campaign stage. */
(function(root){'use strict';
const ELEMENTS=Object.freeze([
 'fire','ice','water','earth','wind','lightning','nature','poison','radiance',
 'shadow','crystal','magma','frost','storm','arcane'
]);
const FIRST=501, LAST=650, PER_AREA=30;
const CHAPTERS=Object.freeze(['Nutwood Meadows','Peanut Butter Factory','Squirrel Hoard Highlands','Autumn Windmill Vale','Moonlit Golden Palace']);
const TITLES=Object.freeze([
 'Ember Clearing','Crystal Creek','Tide Garden','Granite Foundry','Gale Assembly','Thunder Switchyard',
 'Rootbound Cache','Venom Crossing','Sunlit Summit','Umbra Mill','Prism Vault','Molten Wheel',
 'Frozen Court','Tempest Throne','Arcane Treasury'
]);
function profile(id){
 if(!Number.isInteger(id)||id<FIRST||id>LAST)return null;
 const zero=id-FIRST,area=Math.floor(zero/PER_AREA)+1,local=zero%PER_AREA+1;
 const elementIndex=(area-1)*3+Math.floor((local-1)/10);
 const core=(area-1)*100+15+Math.floor((local-1)*84/29);
 const rank=(local-1)%10+1;
 return Object.freeze({id,area,local,baseLevel:core,requiredMainLevel:core,
  element:ELEMENTS[elementIndex],elementIndex,name:TITLES[elementIndex]+' · Trial '+rank,
  hint:'Match the glowing '+ELEMENTS[elementIndex]+' nut by its ordinary color. Clear its shields first; the elemental power activates only when the nut is destroyed.',
  milestone:local%5===0,mastery:local%10===0});
}
function available(save,id){
 const p=profile(id);if(!p)return false;
 const completed=save?.elementalTrials||{};
 return (save?.unlocked||1)>=p.requiredMainLevel&&(p.local===1||Number(completed[id-1])>0);
}
function done(save,id){return Number(save?.elementalTrials?.[id])>0;}
function regionProgress(save,area){
 if(!Number.isInteger(area)||area<1||area>5)return 0;
 return Array.from({length:PER_AREA},(_,i)=>done(save,FIRST+(area-1)*PER_AREA+i)).filter(Boolean).length;
}
function next(save,area){
 if(!Number.isInteger(area)||area<1||area>5)return null;
 for(let local=1;local<=PER_AREA;local++){
  const id=FIRST+(area-1)*PER_AREA+local-1;
  if(available(save,id)&&!done(save,id))return id;
 }
 return null;
}
const api=Object.freeze({FIRST,LAST,PER_AREA,ELEMENTS,CHAPTERS,TITLES,profile,available,done,regionProgress,next});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutElementalChallenges=api;
})(typeof window!=='undefined'?window:globalThis);
