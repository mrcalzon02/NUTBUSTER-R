/* NUTBUSTER campaign geography: scenery is independent of every level marker.
   Waypoints use fractions of the original 941x1672 image, bottom -> top.
   Edit a chapter's path here to move all 100 markers without repainting art. */
(function(root){
'use strict';
const WIDTH=941,HEIGHT=1672;
const CHAPTERS=[
 {id:1,name:'Nutwood Meadows',start:1,end:100,theme:'meadow',image:'art/maps/chapter-1-nutwood-meadows.webp',
  path:[[.58,.96],[.68,.91],[.55,.86],[.35,.83],[.29,.76],[.42,.71],[.57,.65],[.42,.59],[.27,.55],[.26,.49],[.52,.45],[.59,.40],[.43,.36],[.26,.34],[.31,.29],[.52,.26],[.61,.22],[.47,.18],[.36,.14],[.58,.10],[.57,.06]]},
 {id:2,name:'Peanut Butter Factory',start:101,end:200,theme:'factory',image:'art/maps/chapter-2-peanut-butter-factory.webp',
  path:[[.51,.97],[.57,.91],[.36,.88],[.31,.82],[.48,.77],[.64,.72],[.55,.66],[.32,.62],[.28,.56],[.54,.52],[.69,.47],[.53,.42],[.35,.38],[.40,.32],[.60,.28],[.63,.23],[.46,.19],[.39,.14],[.59,.08]]},
 {id:3,name:'Squirrel Hoard Highlands',start:201,end:300,theme:'highlands',image:'art/maps/chapter-3-squirrel-hoard-highlands.webp',
  path:[[.50,.97],[.62,.91],[.41,.86],[.33,.79],[.56,.75],[.72,.68],[.59,.63],[.36,.59],[.29,.53],[.47,.48],[.69,.44],[.64,.39],[.41,.35],[.37,.29],[.60,.25],[.68,.20],[.49,.16],[.43,.11],[.63,.07]]},
 {id:4,name:'Autumn Windmill Vale',start:301,end:400,theme:'autumn',image:'art/maps/chapter-4-autumn-windmill-vale.webp',
  path:[[.51,.97],[.67,.92],[.49,.88],[.31,.83],[.47,.77],[.63,.72],[.55,.67],[.35,.63],[.30,.56],[.48,.53],[.64,.47],[.53,.42],[.36,.37],[.40,.32],[.61,.27],[.62,.22],[.43,.17],[.39,.12],[.58,.07]]},
 {id:5,name:'Moonlit Golden Palace',start:401,end:500,theme:'palace',image:'art/maps/chapter-5-moonlit-golden-palace.webp',
  path:[[.55,.97],[.41,.91],[.46,.85],[.67,.81],[.59,.75],[.37,.70],[.32,.64],[.54,.59],[.67,.53],[.54,.48],[.35,.42],[.33,.36],[.56,.32],[.69,.27],[.62,.22],[.46,.17],[.59,.11],[.56,.06]]}
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
   title:`Level ${chapter.start+index} · ${chapter.name}`};
 });
}
const api={WIDTH,HEIGHT,CHAPTERS,OVERVIEW,chapterOf,nodes};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutCampaignMaps=api;
})(typeof window!=='undefined'?window:globalThis);
