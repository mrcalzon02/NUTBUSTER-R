/* Nutbuster deterministic, DOM-free match-three engine. MIT-style project code; art remains user-owned. */
(function(root){
'use strict';
// One more illustrated nut unlocks at the start of each new campaign.
// The rainbow nut remains a special and never enters the ordinary spawn pool.
const ORIGINAL=['peanut','walnut','almond','cashew','hazelnut','pistachio','gold-acorn'];
// Keep stable ID/index positions (including retired artwork) for asset contracts.
const NEW=['beechnut','brazil-nut','candlenut','chestnut','coconut','ginkgo-nut','hickory-nut','macadamia','pecan','pili-nut','pine-nut','tiger-nut'];
const TYPES=Object.freeze([...ORIGINAL,...NEW]);
const RETIRED_NUTS=Object.freeze(['ginkgo-nut']); // Closed pistachio lookalike: never playable.
const NEW_INTRODUCTIONS=Object.freeze([
 {level:15,name:'coconut'},
 {level:35,name:'tiger-nut'},
 {level:80,name:'pecan'},
 {level:126,name:'brazil-nut'},
 {level:172,name:'chestnut'},
 {level:218,name:'macadamia'},
 {level:264,name:'pine-nut'},
 {level:310,name:'hickory-nut'},
 {level:356,name:'beechnut'},
 {level:402,name:'pili-nut'},
 {level:448,name:'candlenut'}
].map(x=>Object.freeze(x)));
function chapterTypeCount(chapter){return Math.min(ORIGINAL.length,chapter+2);}
// Each new species debuts at a named stage. Rotate only two expansion slots to
// keep the board matchable; original chapter unlocks remain permanently active.
function rosterForLevel(number){
 const n=Math.max(1,Math.min(1000,Math.trunc(number)||1));
 const chapter=Math.floor((n-1)/100)+1,ordinary=chapterTypeCount(chapter);
 const open=NEW_INTRODUCTIONS.filter(x=>n>=x.level).map(x=>TYPES.indexOf(x.name));
 const extras=open.length<=2?open:
  [open[open.length-1],open[Math.floor((n-1)/16)%(open.length-1)]];
 return [...Array.from({length:ordinary},(_,i)=>i),...extras];
}
const DESIGN=typeof module!=='undefined'&&module.exports?require('./level-design.js'):root.NutLevelDesign;
if(!DESIGN)throw new Error('NUTBUSTER level book must load before match-three engine');
const FEATURES=typeof module!=='undefined'&&module.exports?require('./board-features.js'):root.NutBoardFeatures;
if(!FEATURES)throw new Error('Board features must load before the engine');
const TRIALS=typeof module!=='undefined'&&module.exports?require('./elemental-challenges.js'):root.NutElementalChallenges;
const POWERS=typeof module!=='undefined'&&module.exports?require('./elemental-powers.js'):root.NutElementalPowers;
if(!TRIALS||!POWERS)throw Error('Elemental modules missing');
const BOOSTERS=['hammer','row','column','cross','blast','color','shuffle','extra','drill','unlock',
 'quake','triple-row','triple-column','starburst','spectrum','frostbreaker'];
const HOLD_DROPS=Object.freeze({butter_hold:1,jam_hold:2});
// Tile overlays are square-bound effects, never extra nut colors. Each enters
// the main campaign deliberately, rather than being an art-only random decal.
const TILE_OVERLAY_UNLOCKS=Object.freeze([
 {kind:'fire',level:45,turns:2},{kind:'poison',level:115,turns:2},
 {kind:'nature-vines',level:155,turns:2},{kind:'crystal',level:195,turns:2},
 {kind:'shadow',level:245,turns:2},{kind:'arcane',level:285,turns:2},
 {kind:'water',level:325,turns:2},{kind:'radiance',level:365,turns:2},
 {kind:'lightning',level:425,turns:2},{kind:'storm',level:525,turns:2},
 {kind:'magma',level:625,turns:2},{kind:'void-rock',level:745,turns:2}
].map(x=>Object.freeze(x)));
function overlayPlan(level){
 const n=Math.max(1,Math.min(1000,Math.trunc(level)||1)),pool=TILE_OVERLAY_UNLOCKS.filter(x=>n>=x.level);
 if(!pool.length)return [];
 const count=n<150?1:n<300?2:n<600?3:4;
 return Array.from({length:Math.min(count,pool.length)},(_,i)=>pool[(Math.floor(n/7)+i*3)%pool.length]);
}
const BOOSTER_META=Object.freeze({
 hammer:{label:'Hammer',targeted:true,tip:'Break every layer of one stubborn cell'},
 row:{label:'Row Rocket',targeted:true,tip:'Strike one complete row'},
 column:{label:'Column Rocket',targeted:true,tip:'Strike one complete column'},
 cross:{label:'Crossfire',targeted:true,tip:'Strike a complete row and column'},
 blast:{label:'Shell Bomb',targeted:true,tip:'Explode a three-by-three region'},
 color:{label:'Color Pop',targeted:true,tip:'Remove nuts matching the chosen color'},
 shuffle:{label:'Shuffle',targeted:false,tip:'Rearrange nuts while preserving obstacles'},
 extra:{label:'+5 Moves',targeted:false,tip:'Five extra chances to finish'},
 drill:{label:'Deep Drill',targeted:true,tip:'Strike three layers down an entire column'},
 unlock:{label:'Master Key',targeted:false,tip:'Release every locked walnut'},
 quake:{label:'Nutquake',targeted:true,tip:'Hit a 5×5 area around the chosen nut'},
 'triple-row':{label:'Triple Row',targeted:true,tip:'Clear the selected row and one above and below'},
 'triple-column':{label:'Triple Column',targeted:true,tip:'Clear the chosen column and its neighbors'},
 starburst:{label:'Starburst',targeted:true,tip:'Blast both diagonals crossing a chosen nut'},
 spectrum:{label:'Double Rainbow',targeted:true,tip:'Hit the chosen nut color and the next nut color'},
 frostbreaker:{label:'Frostbreaker',targeted:false,tip:'Shatter ice layers across the entire board'}
});
function rng(seed){let x=(seed>>>0)||0x9e3779b9;return function(){x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function shape(level,x,y,w,h){
 const cx=(w-1)/2, cy=(h-1)/2;
 if(w<=4)return true; // Intro grids must support three-nut matches.
 switch((level-1)%8){
 case 0:return true;
 case 1:return Math.abs(x-cx)<=Math.floor(1+Math.abs(y-cy)*0.67); // hourglass
 case 2:return (x>=1&&x<=w-2)||(y===2||y===h-3); // narrow spine with wings
 case 3:return !(x>=2&&x<=w-3&&y>=2&&y<=h-3); // ring
 case 4:return x<=2 || x>=w-3 || y===Math.floor(h/2); // dual chambers, connecting bridge
 case 5:return y<3?Math.abs(x-cx)<=1:y>=h-3?x>=1&&x<=w-2:true;
 case 6:return !(x<2&&y<2)&&!(x>w-3&&y>h-3)&&!(x<2&&y>h-3);
 default:return Math.abs(x-cx)+Math.abs(y-cy)<=Math.floor((w+h)*0.38);
 }
}
// Explicit early-fivefold goal scale, then increasingly demanding later chapters.
// Budget is allowed to recover slightly on a new map; it never flatlines at 9.
function difficultyAt(n){
 n=Math.min(1000,Math.max(1,Math.trunc(n)||1));
 const lerp=(points)=>{for(let i=1;i<points.length;i++)if(n<=points[i][0]){
  const [a,v]=points[i-1],[b,w]=points[i];return v+(w-v)*(n-a)/(b-a);
 }return points[points.length-1][1];};
 const scoreScale=lerp([[1,5],[40,5],[100,4.2],[200,3.2],[500,2.4],[1000,2.4]]);
 const quotaScale=lerp([[1,5],[40,5],[100,3.5],[200,2.5],[500,1.8],[600,1.95],[700,2.1],[800,2.25],[900,2.4],[1000,2.55]]);
 const moves=Math.round(lerp([[1,36],[10,34],[30,31],[70,25],[100,22],[101,23],[150,20],[200,16],[201,19],[250,17],[300,15],[301,18],[350,16],[400,14],[401,17],[450,15],[500,13],[501,18],[550,16],[600,14],[601,18],[650,16],[700,13],[701,18],[750,16],[800,13],[801,17],[850,15],[900,12],[901,17],[950,15],[1000,12]]));
 return {scoreScale,quotaScale,moves};
}
function makeLevel(number){
 const trial=TRIALS.profile(Number(number));
 const n=trial?trial.baseLevel:Math.max(1,Math.min(1000,Math.trunc(number)||1)),design=DESIGN.profile(n);
 // 8x9 is the late-game maximum, not the beginner board.
 const w=n<=10?4:n<=30?5:n<=70?6:n<=140?7:8, h=w+1;
 const mask=[]; for(let y=0;y<h;y++)for(let x=0;x<w;x++)mask.push(shape(n,x,y,w,h));
 const chapter=Math.floor((n-1)/100),roster=rosterForLevel(n),difficulty=difficultyAt(n);
 const teachingGrace=(n===70||n===72||n===98)?3:0;
 const moves=Math.min(36,Math.max(12,difficulty.moves+teachingGrace));
 const goal=Math.round((700+18*n+Math.pow(Math.max(0,n-100)/12,1.35)*40)*difficulty.scoreScale);
 const cfg={number:trial?trial.id:n,trial,chapter:chapter+1,typeCount:roster.length,roster,
  newNut:n>1&&(n-1)%100===0&&chapterTypeCount(chapter+1)>chapterTypeCount(chapter)?ORIGINAL[chapterTypeCount(chapter+1)-1]:(NEW_INTRODUCTIONS.find(x=>x.level===n)?.name||null),
  width:w,height:h,mask,moves,goal,
  ice:design.ice??(n>=3?Math.min(24,1+Math.floor(n/8)):0),
  locks:design.locks??(n>=28?Math.min(17,1+Math.floor((n-28)/15)):0),
  chests:design.chests??(n>=68?Math.min(13,1+Math.floor((n-68)/26)):0),
  jam:design.jam??(n>=110?Math.min(12,1+Math.floor((n-110)/40)):0),
  bombs:design.bombs??(n>=210?Math.min(7,1+Math.floor((n-210)/70)):0),
  fuseTurns:n>=210?Math.max(3,6-Math.floor((n-210)/100)):0,
  title:DESIGN.CHAPTERS[chapter],stageTitle:trial?trial.name:design.name,hint:trial?trial.hint:design.hint,
  design,elementPool:trial?[trial.element]:n>=15?POWERS.ELEMENTS.slice(0,Math.min(15,(chapter+1)*3)):[],tileOverlays:overlayPlan(n)};
 // Irregular late-game silhouettes have fewer cells than the rectangular grid.
 // Reserve space for ordinary nuts and guarantee that advertised blocker layers
 // can actually be placed; otherwise a board can start mathematically unwinnable.
 const usable=mask.filter(Boolean).length;
 // Reserve tangible stock for the new quota before shrinking for board geometry.
 const goalKind=design.kind==='dual'?(design.secondaryKind||'locks'):design.kind;
 const legacyPressure=Math.floor((n-1)/55)+(n>100&&n<=200?Math.floor((n-101)/25):0);
 const previousStock={ice:cfg.ice,locks:cfg.locks,chests:cfg.chests,jam:cfg.jam};
 const explicitGoal=design.kind==='dual'?design.secondaryTarget??design.objectiveTarget:design.objectiveTarget;
 const originalQuota=(kind)=>{
  if(Number.isFinite(explicitGoal)&&explicitGoal>0)return Math.trunc(explicitGoal);
  if(kind==='ice'||kind==='chests')return Math.min(previousStock[kind]*2,2+legacyPressure);
  return Math.min(previousStock[kind],1+legacyPressure);
 };
 const boostedQuota=['ice','locks','chests','jam'].includes(goalKind)?
  Math.ceil(originalQuota(goalKind)*difficulty.quotaScale):0;
 if(goalKind==='ice'||goalKind==='locks'||goalKind==='chests')
  cfg[goalKind]=Math.max(cfg[goalKind],Math.ceil(boostedQuota/3));
 if(goalKind==='jam')cfg.jam=Math.max(cfg.jam,boostedQuota);
 cfg.ice=Math.min(cfg.ice,Math.floor(usable*.44));
 cfg.locks=Math.min(cfg.locks,Math.floor(usable*.32));
 cfg.chests=Math.min(cfg.chests,Math.floor(usable*.24));
 cfg.jam=Math.min(cfg.jam,Math.floor(usable*.30));
 cfg.bombs=Math.min(cfg.bombs,Math.floor(usable*.12));
 // Original illustrated blockers are immovable whole-piece replacements,
 // so reserve >60% of board cells for visible matchable ordinary nuts.
 const capacity=Math.floor(usable*.38);
 while(cfg.ice+cfg.locks+cfg.chests>capacity){
  const kind=['ice','locks','chests'].filter(k=>k!==goalKind&&cfg[k])
   .sort((a,b)=>cfg[b]-cfg[a])[0]||['ice','locks','chests'].filter(k=>cfg[k])
   .sort((a,b)=>cfg[b]-cfg[a])[0];
  if(!cfg[kind])break;
  cfg[kind]--;
 }
 // Layers are real hits, visually numbered above the translucent art.
 cfg.iceLayers=cfg.ice?Math.max(2,Math.min(5,goalKind==='ice'?Math.ceil(boostedQuota/cfg.ice):2)):0;
 cfg.lockLayers=cfg.locks?Math.max(1,Math.min(5,goalKind==='locks'?Math.ceil(boostedQuota/cfg.locks):1)):0;
 cfg.chestLayers=cfg.chests?Math.max(2,Math.min(5,goalKind==='chests'?Math.ceil(boostedQuota/cfg.chests):2)):0;
 // Level-book objectives replace the old modulo-ten wheel. Every target must be
 // physically satisfiable by its starting board, even without a purchased booster.
 const factoryObjectiveRamp=n>100&&n<=200?Math.floor((n-101)/25):0;
 const pressure=Math.floor((n-1)/55)+factoryObjectiveRamp;
 const collect=Math.min(n<=100?11:15,4+pressure+Math.floor((n%10)/4));
 const build=(kind,target)=>{
  if(kind==='ice')return {kind:'ice',target:Math.max(1,Math.min(goalKind==='ice'?boostedQuota:Math.ceil((target||Math.min(cfg.ice*2,2+pressure))*difficulty.quotaScale),cfg.ice*cfg.iceLayers))};
  if(kind==='locks')return {kind:'locks',target:Math.max(1,Math.min(goalKind==='locks'?boostedQuota:Math.ceil((target||Math.min(cfg.locks,1+pressure))*difficulty.quotaScale),cfg.locks*cfg.lockLayers))};
  if(kind==='chests')return {kind:'chests',target:Math.max(1,Math.min(goalKind==='chests'?boostedQuota:Math.ceil((target||Math.min(cfg.chests*2,2+pressure))*difficulty.quotaScale),cfg.chests*cfg.chestLayers))};
  if(kind==='jam')return {kind:'jam',target:Math.max(1,Math.min(goalKind==='jam'?boostedQuota:Math.ceil((target||Math.min(cfg.jam,1+pressure))*difficulty.quotaScale),cfg.jam))};
  if(kind==='collect')return {kind:'collect',color:cfg.roster[n%cfg.typeCount],target:Math.ceil((target||collect)*difficulty.quotaScale)};
  return {kind:'score',target:goal};
 };
 const available=(kind)=>kind==='ice'?cfg.ice>0:kind==='locks'?cfg.locks>0:kind==='chests'?cfg.chests>0:kind==='jam'?cfg.jam>0:true;
 const kind=design.kind==='dual'?'dual':available(design.kind)?design.kind:'score';
 if(kind==='dual'){
  const requested=design.secondaryKind;
  const blocker=requested&&available(requested)?requested:cfg.locks?'locks':cfg.chests?'chests':cfg.jam?'jam':'ice';
  const secondaryTarget=design.secondaryTarget??design.objectiveTarget??null;
  cfg.objectives=[build('collect',Math.min(9,collect)),build(blocker,secondaryTarget)];
 }else cfg.objectives=[build(kind,design.objectiveTarget)];
 if(trial){
  const scale=1.7+(trial.local-1)/22;
  cfg.goal=Math.ceil(cfg.goal*scale);
  cfg.moves=Math.max(12,cfg.moves-2-Math.floor((trial.local-1)/10));
  cfg.objectives=cfg.objectives.map(o=>{
   const stock=o.kind==='ice'?cfg.ice*cfg.iceLayers:o.kind==='locks'?cfg.locks*cfg.lockLayers:
    o.kind==='chests'?cfg.chests*cfg.chestLayers:o.kind==='jam'?cfg.jam:Infinity;
   return {...o,target:o.kind==='score'?cfg.goal:Math.min(stock,Math.ceil(o.target*scale))};
  });
 }
 cfg.features=FEATURES.make(n,cfg.mask,cfg.width,cfg.height);
 return cfg;
}
function create(level=1,seed=level*7919){
 const cfg=makeLevel(level);let rand=rng(seed);const a=cfg.mask.map(v=>v?{type:0,ice:0,lock:0,chest:0,jam:0,fuse:0,special:null,hold:0,elemental:null,frozen:0,poison:0,ward:0,rock:0,aura:null,auraTurns:0}:null);
 const g={level:cfg.number,cfg,seed,rand,cells:a,score:0,moves:cfg.moves,won:false,lost:false,combos:0,history:[],boosterUsed:0,turns:0,progress:{ice:0,locks:0,chests:0,jam:0,bombs:0,colors:TYPES.map(()=>0)},uses:{},elementalQueue:[],magmaQueue:[],crystalCharge:0,elementalActivations:[],elementalRefunds:0};
 for(let y=0;y<cfg.height;y++)for(let x=0;x<cfg.width;x++){
  const i=y*cfg.width+x;if(!a[i])continue;let opts=cfg.roster.filter(t=>!(x>=2&&a[i-1]&&a[i-2]&&a[i-1].type===t&&a[i-2].type===t)&&!(y>=2&&a[i-cfg.width]&&a[i-2*cfg.width]&&a[i-cfg.width].type===t&&a[i-2*cfg.width].type===t));a[i].type=opts[Math.floor(rand()*opts.length)];
 }
 const candidates=a.map((v,i)=>v?i:-1).filter(i=>i>=0);
 function plant(count,key){
  for(let t=0;t<count;t++){
   const free=candidates.filter(i=>a[i]&&(key==='jam'||key==='fuse'?a[i][key]===0:a[i].ice===0&&a[i].lock===0&&a[i].chest===0));
   if(!free.length)break;
   // Dedicated lesson layouts visibly demonstrate line/column/cross/area tools.
   // The rest of the campaign keeps seeded random distribution.
   let chosen=free[Math.floor(rand()*free.length)];
   if(cfg.design.lesson&&cfg.design.formation!=='scatter'){
    const cy=Math.floor(cfg.height/2),cx=Math.floor(cfg.width/2);
    const priority=i=>{
     const x=i%cfg.width,y=Math.floor(i/cfg.width),dx=Math.abs(x-cx),dy=Math.abs(y-cy);
     if(cfg.design.formation==='row')return dy*20+dx;
     if(cfg.design.formation==='column')return dx*20+dy;
     if(cfg.design.formation==='cross')return Math.min(dx,dy)*20+dx+dy;
     return (dx+dy)*20+dx*2+dy;
    };
    chosen=free.sort((a,b)=>priority(a)-priority(b)||a-b)[0];
   }
   a[chosen][key]=key==='fuse'?cfg.fuseTurns:key==='chest'?cfg.chestLayers:key==='ice'?cfg.iceLayers:key==='lock'?cfg.lockLayers:1;
   if(key==='lock')a[chosen].type=TYPES.indexOf('walnut');
  }
 }
 plant(cfg.ice,'ice');plant(cfg.locks,'lock');plant(cfg.chests,'chest');
 plant(cfg.jam,'jam');plant(cfg.bombs,'fuse');
 if(matches(g).hit.size||!hasMove(g))shuffle(g);
 const stageNumber=cfg.trial?cfg.trial.baseLevel:cfg.number;
 const count=cfg.trial?Math.min(3,1+Math.floor((cfg.trial.local-1)/10)):
  (stageNumber>=15&&(stageNumber===15||stageNumber===35||stageNumber%7===0)?1:0);
 if(count&&cfg.elementPool.length){
  let eligible=a.map((c,i)=>c&&!pinned(c)&&c.type>=ORIGINAL.length?i:-1).filter(i=>i>=0);
  if(cfg.trial&&!eligible.length){
   const newType=cfg.roster.find(t=>t>=ORIGINAL.length);
   for(let i=0;i<a.length&&!eligible.length;i++){
    if(!a[i]||pinned(a[i]))continue;
    const old=a[i].type;a[i].type=newType;
    if(!matches(g).hit.size&&hasMove(g))eligible.push(i);
    else a[i].type=old;
   }
  }
  for(let k=0;k<count&&eligible.length;k++){
   const i=eligible.splice(Math.floor(rand()*eligible.length),1)[0];
   a[i].elemental=cfg.elementPool[cfg.trial?0:(Math.floor(stageNumber/7)+k)%cfg.elementPool.length];
  }
 }
 // Never seed a vine if it removes the board's last playable move. Existing
 // blockers, objective stock and elemental identities are left untouched.
 for(const spec of cfg.tileOverlays){
  const free=a.map((c,i)=>c&&!pinned(c)&&!c.aura&&!c.poison&&!c.jam&&!c.fuse?i:-1)
   .filter(i=>i>=0);
  for(let tries=0;tries<free.length;tries++){
   const at=free.splice(Math.floor(rand()*free.length),1)[0],c=a[at];
   if(spec.kind==='poison')c.poison=spec.turns;
   else {c.aura=spec.kind;c.auraTurns=spec.turns;}
   if(hasMove(g)&&matches(g).hit.size===0)break;
   c.poison=0;c.aura=null;c.auraTurns=0;
  }
 }
 return g;
}
function pinned(c){return !!(c&&(c.ice>0||c.lock>0||c.chest>0||c.rock>0||c.frozen>0||(c.aura==='nature-vines'&&c.auraTurns>0)));}
function matches(g){const hit=new Set(),groups=[];const {width:w,height:h}=g.cfg;function run(indices){if(indices.length>=3){groups.push(indices);indices.forEach(i=>hit.add(i));}}
 for(let y=0;y<h;y++){let active=[],prev=null;for(let x=0;x<=w;x++){const i=y*w+x,c=x<w?g.cells[i]:null,t=c&&!pinned(c)?c.type:null;if(t!==null&&t===prev)active.push(i);else{run(active);active=t!==null?[i]:[];prev=t;}}}
 for(let x=0;x<w;x++){let active=[],prev=null;for(let y=0;y<=h;y++){const i=y*w+x,c=y<h?g.cells[i]:null,t=c&&!pinned(c)?c.type:null;if(t!==null&&t===prev)active.push(i);else{run(active);active=t!==null?[i]:[];prev=t;}}}
 return {hit,groups};
}
function adjacent(g,a,b){const w=g.cfg.width;return a>=0&&b>=0&&a<g.cells.length&&b<g.cells.length&&g.cells[a]&&g.cells[b]&&!pinned(g.cells[a])&&!pinned(g.cells[b])&&((Math.abs(a-b)===w)||(Math.floor(a/w)===Math.floor(b/w)&&Math.abs(a-b)===1));}
function hasMove(g){for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+g.cfg.width]){if(!adjacent(g,a,b))continue;
 if(g.cells[a].special||g.cells[b].special)return true;
 const p=g.cells[a].type;g.cells[a].type=g.cells[b].type;g.cells[b].type=p;const ok=matches(g).hit.size>0;g.cells[b].type=g.cells[a].type;g.cells[a].type=p;if(ok)return true;}return false;}
function swapPayload(a,b){for(const key of ['type','special','hold','elemental']){const t=a[key];a[key]=b[key];b[key]=t;}}
function shuffle(g){const ids=g.cells.map((v,i)=>v&&!pinned(v)?i:-1).filter(i=>i>=0);for(let attempt=0;attempt<100;attempt++){
 for(let j=ids.length-1;j>0;j--){const k=Math.floor(g.rand()*(j+1));swapPayload(g.cells[ids[j]],g.cells[ids[k]]);}
 if(matches(g).hit.size===0&&hasMove(g))return true;
 }
 // Guaranteed local repair: rebuild types until there is at least one legal match without pre-existing matches.
 for(let tries=0;tries<50;tries++){for(const i of ids)if(!g.cells[i].hold)g.cells[i].type=g.cfg.roster[Math.floor(g.rand()*g.cfg.typeCount)];if(matches(g).hit.size===0&&hasMove(g))return true;}
 return false;
}
function gravity(g,falls=[]){
 const w=g.cfg.width,h=g.cfg.height,didDrop=g.cells.some(c=>c&&c.type===null);
 function compact(x,top,bottom){
  if(top>bottom)return;
  const survivors=[];
  for(let y=bottom;y>=top;y--){const i=y*w+x,c=g.cells[i];if(c.type!==null)survivors.push({type:c.type,special:c.special,elemental:c.elemental||null,hold:c.hold||0,from:i});}
  const fresh=bottom-top+1-survivors.length;
  for(let y=bottom,n=0;y>=top;y--,n++){
   const i=y*w+x,c=g.cells[i],s=survivors[n];
   c.type=s?s.type:g.cfg.roster[Math.floor(g.rand()*g.cfg.typeCount)];
   c.special=s?s.special:null;c.elemental=s?s.elemental:null;c.hold=s?s.hold:0;
   if(s){if(s.from!==i)falls.push({from:s.from,to:i,type:s.type,special:s.special,elemental:s.elemental,hold:s.hold});}
   else falls.push({from:-1,to:i,startRow:y-fresh,type:c.type,special:null,elemental:null,hold:0});
  }
 }
 for(let x=0;x<w;x++){
  let y=h-1;
  while(y>=0){
   while(y>=0&&!g.cells[y*w+x])y--;
   if(y<0)break;
   const bottom=y;
   while(y>=0&&g.cells[y*w+x])y--;
   const top=y+1;
   let end=bottom;
   for(let at=bottom;at>=top-1;at--){
    if(at===top-1||((g.cells[at*w+x].hold>0||pinned(g.cells[at*w+x]))&&g.cells[at*w+x].type!==null)){
     compact(x,at+1,end);
     end=at-1;
    }
   }
  }
 }
 // Gravity only consumes duration if an actual vacancy was resolved, not each turn.
 if(didDrop)for(const c of g.cells)if(c&&c.hold>0)c.hold--;
}
function objectiveState(g){
 return g.cfg.objectives.map(spec=>{
  const value=spec.kind==='score'?g.score:spec.kind==='collect'?g.progress.colors[spec.color]:g.progress[spec.kind];
  const label=spec.kind==='score'?'Score':spec.kind==='ice'?'Crack ice':spec.kind==='locks'?'Break locks':spec.kind==='chests'?'Open chests':spec.kind==='jam'?'Scrub butter':'Collect '+TYPES[spec.color];
  return {kind:spec.kind,label,value,target:spec.target,done:value>=spec.target};
 });
}
function complete(g){return objectiveState(g).every(o=>o.done);}
function damage(g,i,summary){
 const c=g.cells[i];if(!c||c.type===null)return;
 if(c.ward>0||c.aura==='shadow'){c.ward=0;if(c.aura==='shadow'){c.aura=null;c.auraTurns=0;}summary.cracked++;return;}
 if(c.jam>0){c.jam--;g.progress.jam++;summary.cracked++;return;}
 if(c.rock>0){c.rock--;summary.cracked++;return;}
 if(c.ice>0){c.ice--;g.progress.ice++;summary.cracked++;return;}
 if(c.lock>0){c.lock--;g.progress.locks++;summary.cracked++;return;}
 if(c.chest>0){c.chest--;g.progress.chests++;summary.cracked++;return;}
 if(c.fuse>0){c.fuse=0;g.progress.bombs++;summary.cracked++;return;}
 if(c.elemental)g.elementalQueue.push({at:i,kind:c.elemental,color:c.type});
 g.progress.colors[c.type]++;c.type=null;c.special=null;c.elemental=null;c.hold=0;summary.removed++;
}
function markAura(g,at,kind,turns=2){
 const c=g.cells[at];
 if(!c||c.type===null||c.ice||c.lock||c.chest||c.rock||c.aura)return false;
 if(kind==='poison'){c.poison=Math.max(c.poison||0,turns);return true;}
 c.aura=kind;c.auraTurns=turns;
 // Vines can hold an ordinary nut still, but never eliminate the final move.
 if(kind==='nature-vines'&&!hasMove(g)){c.aura=null;c.auraTurns=0;return false;}
 return true;
}
function resolveTileAura(g,at,kind,summary){
 const c=g.cells[at];if(!c||c.type===null)return;
 const w=g.cfg.width,r=Math.floor(at/w),x=at%w;
 const valid=i=>i>=0&&i<g.cells.length&&g.cells[i]?.type!==null;
 const neighbors=[at-w,at-1,at+1,at+w].filter(i=>valid(i)&&(Math.abs(i-at)===w||Math.floor(i/w)===r));
 const nearest=g.cells.map((v,i)=>valid(i)&&i!==at?i:-1).filter(i=>i>=0)
  .sort((a,b)=>Math.abs(Math.floor(a/w)-r)+Math.abs(a%w-x)-Math.abs(Math.floor(b/w)-r)-Math.abs(b%w-x)||a-b);
 const strike=ids=>ids.forEach(i=>{if(valid(i))damage(g,i,summary);});
 const wash=ids=>ids.forEach(i=>{const v=g.cells[i];if(!v)return;
  if(v.jam){g.progress.jam+=v.jam;summary.cracked+=v.jam;v.jam=0;}
  v.poison=0;if(v.aura==='fire'||v.aura==='poison'){v.aura=null;v.auraTurns=0;}
 });
 if(kind==='fire')strike([at,...neighbors]);
 else if(kind==='poison'){c.jam=Math.max(c.jam,1);g.cfg.jam=Math.max(1,g.cfg.jam);}
 else if(kind==='nature-vines'){const target=neighbors.find(i=>!pinned(g.cells[i]));if(target!==undefined)g.cells[target].type=c.type;}
 else if(kind==='crystal'){c.hold=Math.max(c.hold||0,2);g.crystalCharge=Math.min(3,(g.crystalCharge||0)+1);}
 else if(kind==='arcane'){const index=g.cfg.roster.indexOf(c.type);if(index>=0)c.type=g.cfg.roster[(index+1)%g.cfg.roster.length];}
 else if(kind==='shadow'){} // Until expiration, shadow absorbs the next strike.
 else if(kind==='water')wash(g.cells.map((v,i)=>valid(i)&&Math.floor(i/w)===r?i:-1).filter(i=>i>=0));
 else if(kind==='radiance'){
  const targets=[at,...nearest].filter(i=>{const v=g.cells[i];return v.jam||v.poison||v.lock||v.ice||v.aura==='shadow';}).slice(0,3);
  for(const i of targets){wash([i]);if(g.cells[i].aura==='shadow'){g.cells[i].aura=null;g.cells[i].auraTurns=0;}if(g.cells[i].lock||g.cells[i].ice)damage(g,i,summary);}
 }
 else if(kind==='lightning')strike(nearest.filter(i=>g.cells[i].type===c.type).slice(0,3));
 else if(kind==='storm')strike(nearest.slice(0,4));
 else if(kind==='magma')strike(g.cells.map((v,i)=>valid(i)&&i%w===x?i:-1).filter(i=>i>=0));
 else if(kind==='void-rock')c.rock=Math.max(c.rock||0,2);
}
function resolveElementals(g,summary){
 const hit=[],seen=new Set();let limit=g.cells.length*3;
 while(g.elementalQueue.length&&limit-->0){
  g.elementalQueue.sort((a,b)=>a.at-b.at);
  const rec=g.elementalQueue.shift(),key=rec.at+':'+rec.kind;
  if(seen.has(key))continue;seen.add(key);
  const before=g.cells.map(c=>c?.type??null);
  POWERS.activate(g,rec,{damage,pinned,summary,markAura});
  g.elementalActivations.push(rec.kind);
  for(let i=0;i<before.length;i++)if(before[i]!==null&&g.cells[i]?.type===null)hit.push(i);
 }
 if(g.elementalQueue.length)throw Error('Elemental reaction exceeded safe work limit');
 return hit;
}
function runMagma(g,summary){
 const hit=[];
 for(const x of g.magmaQueue.splice(0))for(let i=x;i<g.cells.length;i+=g.cfg.width){
  if(!g.cells[i]||g.cells[i].type===null)continue;
  const before=g.cells[i].type;damage(g,i,summary);
  if(before!==null&&g.cells[i].type===null)hit.push(i);
 }
 hit.push(...resolveElementals(g,summary));return hit;
}
function expandSpecials(g,initial,targetColor){
 const hit=new Set(initial),pending=[...hit],seen=new Set(),w=g.cfg.width;
 function add(i){if(g.cells[i]&&!hit.has(i)){hit.add(i);pending.push(i);}}
 while(pending.length){
  const i=pending.pop(),c=g.cells[i];if(!c||!c.special||seen.has(i))continue;seen.add(i);
  const row=Math.floor(i/w),col=i%w,kind=c.special;
  if(kind==='rainbow'){const color=targetColor&&Object.prototype.hasOwnProperty.call(targetColor,i)?targetColor[i]:c.type;
   g.cells.forEach((v,k)=>{if(v&&v.type===color)add(k);});}
  else if(kind==='line'||kind==='line-h')g.cells.forEach((v,k)=>{if(v&&Math.floor(k/w)===row)add(k);});
  else if(kind==='line-v')g.cells.forEach((v,k)=>{if(v&&k%w===col)add(k);});
  else if(kind==='blast')g.cells.forEach((v,k)=>{if(v&&Math.abs(Math.floor(k/w)-row)<=1&&Math.abs(k%w-col)<=1)add(k);});
 }
 return hit;
}
/* Two match-created specials have bespoke pair effects. They remain distinct from
   ordinary special chains and are deterministic on both desktop and Android. */
function specialComboHits(g,a,b,found){
 const left=g.cells[a]?.special,right=g.cells[b]?.special;
 if(!left||!right)return null;
 const w=g.cfg.width,hit=new Set([...found.hit,a,b]);
 const isLine=kind=>kind==='line'||kind==='line-h'||kind==='line-v';
 const add=i=>{if(g.cells[i])hit.add(i);};
 const row=y=>g.cells.forEach((c,i)=>{if(c&&Math.floor(i/w)===y)add(i);});
 const column=x=>g.cells.forEach((c,i)=>{if(c&&i%w===x)add(i);});
 const area=(at,radius)=>g.cells.forEach((c,i)=>{
  if(c&&Math.abs(Math.floor(i/w)-Math.floor(at/w))<=radius&&Math.abs(i%w-at%w)<=radius)add(i);
 });
 let combo='paired-specials';
 if(left==='rainbow'&&right==='rainbow'){
  g.cells.forEach((c,i)=>{if(c)add(i);});combo='double-rainbow';
 }else if(left==='rainbow'||right==='rainbow'){
  const other=left==='rainbow'?b:a;
  const kind=g.cells[other].special,color=g.cells[other].type;
  g.cells.forEach((c,i)=>{
   if(!c||c.type!==color)return;
   add(i);
   if(isLine(kind))kind==='line-v'?column(i%w):row(Math.floor(i/w));
   else if(kind==='blast')area(i,1);
  });
  combo=isLine(kind)?'rainbow-rockets':kind==='blast'?'rainbow-bombs':'rainbow-pair';
 }else if(left==='blast'&&right==='blast'){
  area(a,2);area(b,2);combo='double-bomb';
 }else if((left==='blast'&&isLine(right))||(right==='blast'&&isLine(left))){
  const center=left==='blast'?a:b;
  const y=Math.floor(center/w),x=center%w;
  for(let d=-1;d<=1;d++){row(y+d);column(x+d);}
  combo='bomb-rockets';
 }else if(isLine(left)&&isLine(right)){
  row(Math.floor(a/w));column(b%w);combo='cross-rockets';
 }else {
  area(a,1);area(b,1);
 }
 const overrides={};
 if(left==='rainbow')overrides[a]=g.cells[b].type;
 if(right==='rainbow')overrides[b]=g.cells[a].type;
 return {hit:expandSpecials(g,hit,overrides),groups:found.groups,combo};
}
function newSpecial(groups){
 const five=groups.find(a=>a.length>=5);
 if(five)return {at:five[Math.floor(five.length/2)],kind:'rainbow'};
 const overlaps=new Map();
 for(const a of groups)for(const i of a)overlaps.set(i,(overlaps.get(i)||0)+1);
 const common=[...overlaps].find(([,n])=>n>=2);
 if(common)return {at:common[0],kind:'blast'};
 const four=groups.find(a=>a.length>=4);
 if(!four)return null;
 return {at:four[Math.floor(four.length/2)],kind:four[1]-four[0]===1?'line-h':'line-v'};
}
function blockerNeighbors(g,hit){
 const w=g.cfg.width,affected=new Set(hit);
 for(const i of hit){
  const row=Math.floor(i/w);
  for(const j of [i-1,i+1,i-w,i+w]){
   if(j<0||j>=g.cells.length)continue;
   if(Math.abs(j-i)===1&&Math.floor(j/w)!==row)continue;
   if(pinned(g.cells[j]))affected.add(j);
  }
 }
 return affected;
}
function collapse(g,first){let loops=0,removed=0,cracked=0;const stages=[];let found=first||matches(g);
 while(found.hit.size&&loops<60){loops++;let bonus=0;
  const before=snapshot(g).cells,ids=[...blockerNeighbors(g,expandSpecials(g,found.hit))],made=newSpecial(found.groups||[]);
  const summary={removed:0,cracked:0};
  const crystalBonus=(g.crystalCharge||0)*200;g.crystalCharge=0;
  const heldMatches=ids.filter(i=>found.hit.has(i)&&g.cells[i]?.hold>0).length;
  for(const i of ids)damage(g,i,summary);
  const powered=resolveElementals(g,summary);
  removed+=summary.removed;cracked+=summary.cracked;
  if(made&&g.cells[made.at]?.type===null&&!before[made.at]?.special){
   g.cells[made.at].type=before[made.at].type;
   g.cells[made.at].special=made.kind;g.cells[made.at].elemental=null;bonus+=100;
  }
  g.score+=(ids.length*60+bonus+heldMatches*120)*Math.min(loops,6)+crystalBonus;
  const afterClear=snapshot(g).cells,falls=[];gravity(g,falls);
  const magma=runMagma(g,summary);if(magma.length){gravity(g,falls);removed+=magma.length;}
  stages.push({kind:'cascade',before,afterClear,clear:[...new Set([...ids,...powered,...magma])],falls,cells:snapshot(g).cells});
  found=matches(g);
 }
 g.combos=loops;g.won=complete(g);g.lost=g.moves<=0&&!g.won;
 if(!g.won&&!g.lost&&!hasMove(g)){if(!repairMove(g))throw new Error('No legal moves after repair');
  stages.push({kind:'repair',cells:snapshot(g).cells});}
 g.history.push({loops,removed,cracked,score:g.score});return {valid:true,loops,removed,cracked,won:g.won,lost:g.lost,stages};
}
function repairMove(g){
 // Deadlock recovery exchanges only two existing nut identities before considering a full shuffle.
 const ids=g.cells.map((v,i)=>v&&!pinned(v)?i:-1).filter(i=>i>=0);
 for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
  const left=g.cells[ids[a]],right=g.cells[ids[b]];if(left.type===right.type)continue;
  const t=left.type;left.type=right.type;right.type=t;
  if(matches(g).hit.size===0&&hasMove(g)){const h=left.hold;left.hold=right.hold;right.hold=h;const s=left.special;left.special=right.special;right.special=s;return true;}
  right.type=left.type;left.type=t;
 }
 return shuffle(g);
}
function advanceBoardFeatures(g,result){
 if(result.won)return result;
 const stages=FEATURES.advance(g,g.turns+1,()=>snapshot(g).cells);
 if(!stages.length)return result;
 result.stages.push(...stages);
 const found=matches(g);
 if(found.hit.size){
  const settled=collapse(g,found);
  result.stages.push(...settled.stages);
  result.loops+=settled.loops;result.removed+=settled.removed;result.cracked+=settled.cracked;
  result.won=settled.won;result.lost=settled.lost;
 }else if(!g.lost&&!hasMove(g)){
  if(!repairMove(g))throw new Error('Cannot repair transport deadlock');
  result.stages.push({kind:'repair',cells:snapshot(g).cells});
 }
 return result;
}
function finishTurn(g,result){return advanceHazards(g,advanceBoardFeatures(g,result));}
function advanceHazards(g,result){
 g.turns++;
 if(g.won||g.lost)return result;
 const auraExpired=[],auraBefore=snapshot(g).cells;
 const activeTimer=auraBefore.some(c=>c&&(c.auraTurns>0||c.poison>0||c.ward>0||c.frozen>0));
 for(let i=0;i<g.cells.length;i++){const c=g.cells[i];if(!c)continue;
  if(c.frozen>0)c.frozen--;
  if(c.ward>0)c.ward--;
  if(c.poison>0&&!--c.poison){c.jam=1;g.cfg.jam=Math.max(1,g.cfg.jam);}
  if(c.aura&&c.auraTurns>0&&!--c.auraTurns){auraExpired.push({at:i,kind:c.aura});c.aura=null;}
 }
 if(auraExpired.length){
  const summary={removed:0,cracked:0};
  for(const item of auraExpired)resolveTileAura(g,item.at,item.kind,summary);
  const powered=resolveElementals(g,summary),falls=[];
  if(summary.removed)gravity(g,falls);
  // Root growth and arcane transmutation can create matches without directly
  // destroying nuts; settle those naturally instead of leaving free triples.
  const ready=matches(g);
  if(ready.hit.size){
   const settled=collapse(g,ready);
   result.stages.push(...settled.stages);result.loops=(result.loops||0)+settled.loops;
   result.removed=(result.removed||0)+settled.removed;result.cracked=(result.cracked||0)+settled.cracked;
  }
  result.removed=(result.removed||0)+summary.removed;
  result.cracked=(result.cracked||0)+summary.cracked;
  result.stages.push({kind:'aura',before:auraBefore,expired:auraExpired,clear:powered,falls,cells:snapshot(g).cells});
  g.won=complete(g);result.won=g.won;
 }
 if(!g.cfg.jam&&!g.cfg.bombs&&!activeTimer&&!auraExpired.length)return result;
 const spread=[],expired=[];
 // One sticky spread every third swap; deterministic and bounded by board size.
 // It never creates a brand-new bomb or alters the void layout.
 if(g.cfg.jam>0&&g.turns%3===0){
  const w=g.cfg.width,origins=g.cells.map((c,i)=>c&&c.jam>0?i:-1).filter(i=>i>=0);
  for(const i of origins){
   const neighbors=[i-w,i+w,i-1,i+1].filter(j=>j>=0&&j<g.cells.length&&g.cells[j]&&
    (Math.abs(j-i)===w||Math.floor(j/w)===Math.floor(i/w))&&g.cells[j].jam===0);
   if(neighbors.length){
    const choice=neighbors[Math.floor(g.rand()*neighbors.length)];
    g.cells[choice].jam=1;spread.push(choice);break;
   }
  }
 }
 for(let i=0;i<g.cells.length;i++){
  const c=g.cells[i];
  if(!c||c.fuse<=0)continue;
  c.fuse--;
  if(!c.fuse){expired.push(i);g.moves=Math.max(0,g.moves-2);}
 }
 if(spread.length||expired.length||g.cfg.bombs>0||auraExpired.length||activeTimer)
  result.stages.push({kind:'hazard',cells:snapshot(g).cells,spread,expired});
 if(!g.won&&!g.lost&&!hasMove(g)){
  if(!repairMove(g))throw Error('Cannot repair overlay deadlock');
  result.stages.push({kind:'repair',cells:snapshot(g).cells});
 }
 g.lost=g.moves<=0&&!g.won;
 result.lost=g.lost;result.won=g.won;
 result.hazards={spread,expired};
 return result;
}
function swap(g,a,b){
 if(g.won||g.lost)return {valid:false,reason:'finished'};
 if(!adjacent(g,a,b))return {valid:false,reason:'adjacency'};
 const ca=g.cells[a],cb=g.cells[b];
 swapPayload(ca,cb);
 let found=matches(g);
 let combination=null;
 if(ca.special||cb.special){
  combination=specialComboHits(g,a,b,found);
  if(combination)found=combination;
  else {
   const source=ca.special?a:b,other=source===a?b:a;
   const hit=new Set([...found.hit,source,other]);
   const overrides={};
   if(g.cells[source].special==='rainbow')overrides[source]=g.cells[other].type;
   found={hit:expandSpecials(g,hit,overrides),groups:found.groups};
  }
 }
 if(!found.hit.size){
  // Non-matching adjacent swaps are intentional moves. Keep the new board and deduct a turn.
  g.moves--;g.combos=0;g.lost=g.moves<=0;const stages=[];
  if(!g.lost&&!hasMove(g)){if(!repairMove(g))throw new Error('No legal moves after non-matching swap');
   stages.push({kind:'repair',cells:snapshot(g).cells});}
  g.history.push({loops:0,removed:0,cracked:0,score:g.score});
  return finishTurn(g,{valid:true,loops:0,removed:0,cracked:0,won:false,lost:g.lost,swap:[a,b],stages});
 }
 g.moves--;return finishTurn(g,{...collapse(g,found),swap:[a,b],specialCombo:combination?.combo||null});
}
function applyHold(g,type,index){
 if(g.won||g.lost)return {valid:false,reason:'finished'};
 const drops=HOLD_DROPS[type];if(!drops)return {valid:false,reason:'unknown'};
 if(!Number.isInteger(index)||index<0||index>=g.cells.length||!g.cells[index]||g.cells[index].type===null||pinned(g.cells[index]))return {valid:false,reason:'target'};
 const c=g.cells[index];if((c.hold||0)>=drops)return {valid:false,reason:'already-held'};
 c.hold=drops;g.boosterUsed++;g.uses[type]=(g.uses[type]||0)+1;
 return {valid:true,type,index,drops,stages:[],objectives:objectiveState(g)};
}
function booster(g,type,index){
 if(g.won)return {valid:false,reason:'finished'};
 if(!BOOSTERS.includes(type))return {valid:false,reason:'unknown'};
 if(type==='extra'){g.moves+=5;g.lost=false;g.boosterUsed++;g.uses.extra=(g.uses.extra||0)+1;
  return {valid:true,type,stages:[],objectives:objectiveState(g)};}
 if(type==='frostbreaker'){
  const ids=g.cells.map((c,i)=>c?.ice>0?i:-1).filter(i=>i>=0);
  if(!ids.length)return {valid:false,reason:'no-ice'};
  const before=snapshot(g).cells;let cracked=0;
  for(const i of ids){cracked+=g.cells[i].ice;g.cells[i].ice=0;}
  g.progress.ice+=cracked;g.boosterUsed++;g.uses.frostbreaker=(g.uses.frostbreaker||0)+1;
  g.won=complete(g);g.lost=g.moves<=0&&!g.won;
  return {valid:true,type,removed:0,cracked,stages:[{kind:'cascade',before,afterClear:snapshot(g).cells,clear:ids,falls:[],cells:snapshot(g).cells}],objectives:objectiveState(g),won:g.won,lost:g.lost};
 }
 if(type==='shuffle'){
  const before=snapshot(g).cells;
  if(!shuffle(g))return {valid:false,reason:'deadlock'};
  g.boosterUsed++;g.uses.shuffle=(g.uses.shuffle||0)+1;
  return {valid:true,type,stages:[{kind:'repair',before,cells:snapshot(g).cells}],objectives:objectiveState(g)};
 }
 let ids=[];
 const w=g.cfg.width;
 if(type==='unlock'){ids=g.cells.map((c,i)=>c&&c.lock>0?i:-1).filter(i=>i>=0);
  if(!ids.length)return {valid:false,reason:'no-locks'};}
 else {
  if(!Number.isInteger(index)||index<0||index>=g.cells.length||!g.cells[index])return {valid:false,reason:'target'};
  const row=Math.floor(index/w),col=index%w,nutType=g.cells[index].type;
  const nextType=nutType===null?null:(nutType+1)%TYPES.length;
  ids=g.cells.map((c,i)=>{
   if(!c)return -1;
   const r=Math.floor(i/w),x=i%w;
   const ok=type==='hammer'&&i===index||
     (type==='row'||type==='cross')&&r===row||
     (type==='column'||type==='drill'||type==='cross')&&x===col||
     type==='blast'&&Math.abs(r-row)<=1&&Math.abs(x-col)<=1||
     type==='color'&&c.type===nutType||
     type==='quake'&&Math.abs(r-row)<=2&&Math.abs(x-col)<=2||
     type==='triple-row'&&Math.abs(r-row)<=1||
     type==='triple-column'&&Math.abs(x-col)<=1||
     type==='starburst'&&Math.abs(r-row)===Math.abs(x-col)||
     type==='spectrum'&&(c.type===nutType||c.type===nextType);
   return ok?i:-1;
  }).filter(i=>i>=0);
 }
 const before=snapshot(g).cells,summary={removed:0,cracked:0};
 const targets=type==='unlock'?ids:[...expandSpecials(g,ids)];
 for(const i of targets){
  // Master Key bypasses surface hazards: it acts on the lock mechanism itself.
  if(type==='unlock'){
   const layers=g.cells[i]?.lock||0;
   if(layers){g.cells[i].lock=0;g.progress.locks+=layers;summary.cracked+=layers;}
   continue;
  }
  // Hammer removes *all* layers in one cell; drills pierce three layers.
  const blows=type==='hammer'?20:type==='drill'?3:1;
  for(let n=0;n<blows&&g.cells[i]?.type!==null;n++)damage(g,i,summary);
 }
 const powered=resolveElementals(g,summary);
 g.boosterUsed++;g.uses[type]=(g.uses[type]||0)+1;
 g.score+=targets.length*35;
 const afterClear=snapshot(g).cells,falls=[];gravity(g,falls);
 const magma=runMagma(g,summary);if(magma.length)gravity(g,falls);
 const afterGravity=snapshot(g).cells,r=collapse(g);
 g.won=complete(g);g.lost=g.moves<=0&&!g.won;
 const stage={kind:'cascade',before,afterClear,clear:[...new Set([...targets,...powered,...magma])],falls,cells:afterGravity};
 return {...r,valid:true,type,removed:r.removed+summary.removed,cracked:r.cracked+summary.cracked,
  won:g.won,lost:g.lost,stages:[stage,...r.stages],objectives:objectiveState(g)};
}
function snapshot(g){return {level:g.level,seed:g.seed,moves:g.moves,score:g.score,won:g.won,lost:g.lost,boosterUsed:g.boosterUsed,turns:g.turns,progress:{...g.progress,colors:[...g.progress.colors]},uses:{...g.uses},objectives:objectiveState(g),cells:g.cells.map(c=>c?{type:c.type,ice:c.ice,lock:c.lock,chest:c.chest,jam:c.jam,fuse:c.fuse,special:c.special,hold:c.hold||0,elemental:c.elemental||null,frozen:c.frozen||0,poison:c.poison||0,ward:c.ward||0,rock:c.rock||0,aura:c.aura||null,auraTurns:c.auraTurns||0}:null)};}
const api={TYPES,ORIGINAL,NEW,RETIRED_NUTS,NEW_INTRODUCTIONS,TILE_OVERLAY_UNLOCKS,overlayPlan,ELEMENTAL_ABILITIES:POWERS.ABILITIES,rosterForLevel,difficultyAt,BOOSTERS,BOOSTER_META,HOLD_DROPS,makeLevel,create,matches,adjacent,hasMove,gravity,shuffle,repairMove,objectiveState,expandSpecials,specialComboHits,advanceBoardFeatures,advanceHazards,swap,booster,applyHold,snapshot,rng};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.NutEngine=api;
})(typeof window!=='undefined'?window:globalThis);
