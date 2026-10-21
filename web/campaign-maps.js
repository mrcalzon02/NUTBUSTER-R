/* NUTBUSTER campaign geography: scenery is independent of every level marker.
   Waypoints use fractions of the original 941x1672 image, bottom -> top.
   Edit a chapter's path here to move all 100 markers without repainting art. */
(function(root){
'use strict';
const WIDTH=941,HEIGHT=1672;
const LESSON_BOOK=typeof module!=='undefined'&&module.exports?require('./level-design.js'):root.NutLevelDesign;
const CHAPTERS=[
 {id:1,name:'Nutwood Meadows',start:1,end:100,theme:'meadow',image:'art/maps/chapter-1-nutwood-meadows.webp',
  path:[[0.59,0.96],[0.55,0.91],[0.47,0.86],[0.58,0.81],[0.70,0.77],[0.70,0.73],[0.51,0.69],[0.48,0.65],[0.60,0.61],[0.69,0.57],[0.66,0.53],[0.51,0.49],[0.36,0.46],[0.35,0.43],[0.49,0.40],[0.62,0.36],[0.68,0.33],[0.66,0.30],[0.46,0.27],[0.31,0.24],[0.34,0.21],[0.52,0.18],[0.67,0.16],[0.60,0.13],[0.47,0.11],[0.48,0.08]]},
 {id:2,name:'Peanut Butter Factory',start:101,end:200,theme:'factory',image:'art/maps/chapter-2-peanut-butter-factory.webp',
  path:[[0.52,0.96],[0.52,0.91],[0.50,0.86],[0.45,0.82],[0.41,0.78],[0.51,0.74],[0.64,0.70],[0.66,0.66],[0.48,0.62],[0.34,0.58],[0.32,0.54],[0.46,0.51],[0.63,0.48],[0.69,0.44],[0.64,0.40],[0.46,0.37],[0.35,0.34],[0.34,0.30],[0.51,0.27],[0.65,0.23],[0.61,0.20],[0.48,0.17],[0.39,0.14],[0.41,0.11],[0.61,0.08]]},
 {id:3,name:'Squirrel Hoard Highlands',start:201,end:300,theme:'highlands',image:'art/maps/chapter-3-squirrel-hoard-highlands.webp',
  path:[[0.57,0.96],[0.56,0.91],[0.42,0.87],[0.38,0.82],[0.55,0.78],[0.71,0.73],[0.75,0.69],[0.66,0.65],[0.48,0.61],[0.40,0.57],[0.51,0.53],[0.68,0.49],[0.71,0.45],[0.58,0.42],[0.41,0.38],[0.39,0.35],[0.56,0.32],[0.68,0.28],[0.67,0.24],[0.49,0.21],[0.40,0.17],[0.49,0.14],[0.70,0.11],[0.69,0.08],[0.58,0.06]]},
 {id:4,name:'Autumn Windmill Vale',start:301,end:400,theme:'autumn',image:'art/maps/chapter-4-autumn-windmill-vale.webp',
  path:[[0.56,0.96],[0.50,0.92],[0.39,0.88],[0.35,0.83],[0.46,0.79],[0.62,0.74],[0.68,0.70],[0.59,0.66],[0.44,0.62],[0.33,0.58],[0.34,0.54],[0.50,0.50],[0.64,0.46],[0.62,0.42],[0.47,0.38],[0.34,0.35],[0.34,0.31],[0.51,0.28],[0.64,0.25],[0.65,0.21],[0.51,0.18],[0.35,0.15],[0.37,0.12],[0.51,0.09],[0.62,0.06]]},
 {id:5,name:'Moonlit Golden Palace',start:401,end:500,theme:'palace',image:'art/maps/chapter-5-moonlit-golden-palace.webp',
  path:[[0.51,0.96],[0.54,0.91],[0.62,0.87],[0.74,0.83],[0.75,0.78],[0.61,0.74],[0.44,0.70],[0.33,0.66],[0.40,0.62],[0.57,0.58],[0.69,0.54],[0.68,0.50],[0.50,0.46],[0.35,0.43],[0.29,0.39],[0.38,0.35],[0.55,0.32],[0.68,0.29],[0.68,0.25],[0.53,0.22],[0.39,0.19],[0.35,0.16],[0.49,0.13],[0.64,0.10],[0.60,0.07]]}
];
const OVERVIEW='art/maps/campaign-overview.webp';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function chapterOf(level){const n=Math.trunc(Number(level));return CHAPTERS[clamp(Math.floor((n-1)/100),0,4)];}
// Equal arclength in IMAGE PIXELS, not equal t along individual segments.
// Stops knots with short distances becoming crowded, and makes path editing predictable.
function nodes(chapterId){
 const chapter=CHAPTERS[chapterId-1];if(!chapter)throw new RangeError('Invalid chapter '+chapterId);
 const segments=[];let length=0;
 for(let i=1;i<chapter.path.length;i++){
  const a=chapter.path[i-1],b=chapter.path[i];
  const d=Math.hypot((b[0]-a[0])*WIDTH,(b[1]-a[1])*HEIGHT);
  if(d>0){segments.push({a,b,start:length,end:length+d,length:d});length+=d;}
 }
 return Array.from({length:100},(_,index)=>{
  const distance=length*index/99;
  const seg=segments.find(s=>s.end>=distance)||segments[segments.length-1];
  const t=clamp((distance-seg.start)/seg.length,0,1);
  return {level:chapter.start+index,chapter:chapter.id,local:index+1,
   x:seg.a[0]+(seg.b[0]-seg.a[0])*t,y:seg.a[1]+(seg.b[1]-seg.a[1])*t,
   milestone:(index===0||index===99||(index+1)%20===0),
   kind:index===99?'finale':(index+1)%20===0?'challenge':(index+1)%15===0?'treasure':(index+1)%12===0?'booster':(index+1)%10===0?'hard':'standard',
   title:`Level ${chapter.start+index} · ${chapter.name}`};
 });
}
const api={WIDTH,HEIGHT,CHAPTERS,OVERVIEW,chapterOf,nodes};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutCampaignMaps=api;
})(typeof window!=='undefined'?window:globalThis);
