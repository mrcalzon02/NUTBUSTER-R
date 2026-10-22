/* Nutbuster deterministic, DOM-free match-three engine. MIT-style project code; art remains user-owned. */
(function(root){
'use strict';
// One more illustrated nut unlocks at the start of each new campaign.
// The rainbow nut remains a special and never enters the ordinary spawn pool.
const TYPES=['peanut','walnut','almond','cashew','hazelnut','pistachio','gold-acorn'];
function chapterTypeCount(chapter){return Math.min(TYPES.length,chapter+2);}
const DESIGN=typeof module!=='undefined'&&module.exports?require('./level-design.js'):root.NutLevelDesign;
if(!DESIGN)throw new Error('NUTBUSTER level book must load before match-three engine');
const FEATURES=typeof module!=='undefined'&&module.exports?require('./board-features.js'):root.NutBoardFeatures;
if(!FEATURES)throw new Error('Board features must load before the engine');
const BOOSTERS=['hammer','row','column','cross','blast','color','shuffle','extra','drill','unlock'];
const HOLD_DROPS=Object.freeze({butter_hold:1,jam_hold:2});
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
 unlock:{label:'Master Key',targeted:false,tip:'Open every chained tile'}
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
function makeLevel(number){
 const n=Math.max(1,Math.min(500,Math.trunc(number)||1)),design=DESIGN.profile(n);
 // 8x9 is the late-game maximum, not the beginner board.
 const w=n<=10?4:n<=30?5:n<=70?6:n<=140?7:8, h=w+1;
 const mask=[]; for(let y=0;y<h;y++)for(let x=0;x<w;x++)mask.push(shape(n,x,y,w,h));
 const chapter=Math.floor((n-1)/100),past200=Math.max(0,n-200);
 // Difficulty grows progressively for 200 levels, then deliberately exceeds the normal ceiling.
 // Three chapter-one levels were outliers in the reproducible non-booster bot
 // sample. Give them breathing room while human completion data is gathered.
 const teachingGrace=(n===70||n===72||n===98)?3:0;
 const moves=Math.max(9,32-Math.floor(n/12)-Math.floor(past200/39)+design.moveAdjustment+teachingGrace);
 // Chapter 2 approaches the maximum *fair* target at level 200, rather than
 // accidentally becoming easier after the Meadow's late lock/chest stages.
 const factoryRamp=n>100&&n<=200?(n-101)/170:0;
 const goal=Math.round((700+18*n+Math.pow(past200/12,1.35)*55)*(1+factoryRamp));
 const cfg={number:n,chapter:chapter+1,typeCount:chapterTypeCount(chapter+1),
  newNut:n>1&&(n-1)%100===0?TYPES[chapterTypeCount(chapter+1)-1]:null,
  width:w,height:h,mask,moves,goal,
  ice:design.ice??(n>=3?Math.min(20,1+Math.floor(n/16)):0),
  locks:design.locks??(n>=28?Math.min(14,1+Math.floor((n-28)/24)):0),
  chests:design.chests??(n>=68?Math.min(10,1+Math.floor((n-68)/36)):0),
  jam:design.jam??(n>=110?Math.min(9,1+Math.floor((n-110)/65)):0),
  bombs:design.bombs??(n>=210?Math.min(5,1+Math.floor((n-210)/90)):0),
  fuseTurns:n>=210?Math.max(3,6-Math.floor((n-210)/100)):0,
  title:DESIGN.CHAPTERS[chapter],stageTitle:design.name,hint:design.hint,design};
 // Irregular late-game silhouettes have fewer cells than the rectangular grid.
 // Reserve space for ordinary nuts and guarantee that advertised blocker layers
 // can actually be placed; otherwise a board can start mathematically unwinnable.
 const usable=mask.filter(Boolean).length;
 cfg.ice=Math.min(cfg.ice,Math.floor(usable*.42));
 cfg.locks=Math.min(cfg.locks,Math.floor(usable*.27));
 cfg.chests=Math.min(cfg.chests,Math.floor(usable*.20));
 cfg.jam=Math.min(cfg.jam,Math.floor(usable*.18));
 cfg.bombs=Math.min(cfg.bombs,Math.floor(usable*.12));
 // Level-book objectives replace the old modulo-ten wheel. Every target must be
 // physically satisfiable by its starting board, even without a purchased booster.
 const factoryObjectiveRamp=n>100&&n<=200?Math.floor((n-101)/25):0;
 const pressure=Math.floor((n-1)/55)+factoryObjectiveRamp;
 const collect=Math.min(n<=100?11:15,4+pressure+Math.floor((n%10)/4));
 const build=(kind,target)=>{
  if(kind==='ice')return {kind:'ice',target:Math.max(1,Math.min(cfg.ice*2,target||Math.min(cfg.ice*2,2+pressure)))};
  if(kind==='locks')return {kind:'locks',target:Math.max(1,Math.min(cfg.locks,target||Math.min(cfg.locks,1+pressure)))};
  if(kind==='chests')return {kind:'chests',target:Math.max(1,Math.min(cfg.chests*2,target||Math.min(cfg.chests*2,2+pressure)))};
  if(kind==='jam')return {kind:'jam',target:Math.max(1,Math.min(cfg.jam,target||Math.min(cfg.jam,1+pressure)))};
  if(kind==='collect')return {kind:'collect',color:n%cfg.typeCount,target:target||collect};
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
 cfg.features=FEATURES.make(n,cfg.mask,cfg.width,cfg.height);
 return cfg;
}
function create(level=1,seed=level*7919){
 const cfg=makeLevel(level);let rand=rng(seed);const a=cfg.mask.map(v=>v?{type:0,ice:0,lock:0,chest:0,jam:0,fuse:0,special:null,hold:0}:null);
 const g={level:cfg.number,cfg,seed,rand,cells:a,score:0,moves:cfg.moves,won:false,lost:false,combos:0,history:[],boosterUsed:0,turns:0,progress:{ice:0,locks:0,chests:0,jam:0,bombs:0,colors:TYPES.map(()=>0)},uses:{}};
 for(let y=0;y<cfg.height;y++)for(let x=0;x<cfg.width;x++){
  const i=y*cfg.width+x;if(!a[i])continue;let opts=Array.from({length:cfg.typeCount},(_,i)=>i).filter(t=>!(x>=2&&a[i-1]&&a[i-2]&&a[i-1].type===t&&a[i-2].type===t)&&!(y>=2&&a[i-cfg.width]&&a[i-2*cfg.width]&&a[i-cfg.width].type===t&&a[i-2*cfg.width].type===t));a[i].type=opts[Math.floor(rand()*opts.length)];
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
   a[chosen][key]=key==='fuse'?cfg.fuseTurns:key==='chest'||key==='ice'?2:1;
  }
 }
 plant(cfg.ice,'ice');plant(cfg.locks,'lock');plant(cfg.chests,'chest');
 plant(cfg.jam,'jam');plant(cfg.bombs,'fuse');
 if(!hasMove(g))shuffle(g);return g;
}
function matches(g){const hit=new Set(),groups=[];const {width:w,height:h}=g.cfg;function run(indices){if(indices.length>=3){groups.push(indices);indices.forEach(i=>hit.add(i));}}
 for(let y=0;y<h;y++){let active=[],prev=null;for(let x=0;x<=w;x++){const i=y*w+x,c=x<w?g.cells[i]:null,t=c?c.type:null;if(t!==null&&t===prev)active.push(i);else{run(active);active=t!==null?[i]:[];prev=t;}}}
 for(let x=0;x<w;x++){let active=[],prev=null;for(let y=0;y<=h;y++){const i=y*w+x,c=y<h?g.cells[i]:null,t=c?c.type:null;if(t!==null&&t===prev)active.push(i);else{run(active);active=t!==null?[i]:[];prev=t;}}}
 return {hit,groups};
}
function adjacent(g,a,b){const w=g.cfg.width;return a>=0&&b>=0&&a<g.cells.length&&b<g.cells.length&&g.cells[a]&&g.cells[b]&&((Math.abs(a-b)===w)||(Math.floor(a/w)===Math.floor(b/w)&&Math.abs(a-b)===1));}
function hasMove(g){for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+g.cfg.width]){if(!adjacent(g,a,b))continue;
 if(g.cells[a].special||g.cells[b].special)return true;
 const p=g.cells[a].type;g.cells[a].type=g.cells[b].type;g.cells[b].type=p;const ok=matches(g).hit.size>0;g.cells[b].type=g.cells[a].type;g.cells[a].type=p;if(ok)return true;}return false;}
function swapPayload(a,b){for(const key of ['type','special','hold']){const t=a[key];a[key]=b[key];b[key]=t;}}
function shuffle(g){const ids=g.cells.map((v,i)=>v?i:-1).filter(i=>i>=0);for(let attempt=0;attempt<100;attempt++){
 for(let j=ids.length-1;j>0;j--){const k=Math.floor(g.rand()*(j+1));swapPayload(g.cells[ids[j]],g.cells[ids[k]]);}
 if(matches(g).hit.size===0&&hasMove(g))return true;
 }
 // Guaranteed local repair: rebuild types until there is at least one legal match without pre-existing matches.
 for(let tries=0;tries<50;tries++){for(const i of ids)if(!g.cells[i].hold)g.cells[i].type=Math.floor(g.rand()*g.cfg.typeCount);if(matches(g).hit.size===0&&hasMove(g))return true;}
 return false;
}
function gravity(g,falls=[]){
 const w=g.cfg.width,h=g.cfg.height,didDrop=g.cells.some(c=>c&&c.type===null);
 function compact(x,top,bottom){
  if(top>bottom)return;
  const survivors=[];
  for(let y=bottom;y>=top;y--){const i=y*w+x,c=g.cells[i];if(c.type!==null)survivors.push({type:c.type,special:c.special,hold:c.hold||0,from:i});}
  const fresh=bottom-top+1-survivors.length;
  for(let y=bottom,n=0;y>=top;y--,n++){
   const i=y*w+x,c=g.cells[i],s=survivors[n];
   c.type=s?s.type:Math.floor(g.rand()*g.cfg.typeCount);
   c.special=s?s.special:null;c.hold=s?s.hold:0;
   if(s){if(s.from!==i)falls.push({from:s.from,to:i,type:s.type,special:s.special,hold:s.hold});}
   else falls.push({from:-1,to:i,startRow:y-fresh,type:c.type,special:null,hold:0});
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
    if(at===top-1||(g.cells[at*w+x].hold>0&&g.cells[at*w+x].type!==null)){
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
 if(c.jam>0){c.jam--;g.progress.jam++;summary.cracked++;return;}
 if(c.ice>0){c.ice--;g.progress.ice++;summary.cracked++;return;}
 if(c.lock>0){c.lock--;g.progress.locks++;summary.cracked++;return;}
 if(c.chest>0){c.chest--;g.progress.chests++;summary.cracked++;return;}
 if(c.fuse>0){c.fuse=0;g.progress.bombs++;summary.cracked++;return;}
 g.progress.colors[c.type]++;c.type=null;c.special=null;c.hold=0;summary.removed++;
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
function collapse(g,first){let loops=0,removed=0,cracked=0;const stages=[];let found=first||matches(g);
 while(found.hit.size&&loops<60){loops++;let bonus=0;
  const before=snapshot(g).cells,ids=[...expandSpecials(g,found.hit)],made=newSpecial(found.groups||[]);
  const summary={removed:0,cracked:0};
  const heldMatches=ids.filter(i=>found.hit.has(i)&&g.cells[i]?.hold>0).length;
  for(const i of ids)damage(g,i,summary);
  removed+=summary.removed;cracked+=summary.cracked;
  if(made&&g.cells[made.at]?.type===null&&!before[made.at]?.special){
   g.cells[made.at].type=before[made.at].type;
   g.cells[made.at].special=made.kind;bonus+=100;
  }
  g.score+=(ids.length*60+bonus+heldMatches*120)*Math.min(loops,6);
  const afterClear=snapshot(g).cells,falls=[];gravity(g,falls);stages.push({kind:'cascade',before,afterClear,clear:ids,falls,cells:snapshot(g).cells});
  found=matches(g);
 }
 g.combos=loops;g.won=complete(g);g.lost=g.moves<=0&&!g.won;
 if(!g.won&&!g.lost&&!hasMove(g)){if(!repairMove(g))throw new Error('No legal moves after repair');
  stages.push({kind:'repair',cells:snapshot(g).cells});}
 g.history.push({loops,removed,cracked,score:g.score});return {valid:true,loops,removed,cracked,won:g.won,lost:g.lost,stages};
}
function repairMove(g){
 // Deadlock recovery exchanges only two existing nut identities before considering a full shuffle.
 const ids=g.cells.map((v,i)=>v?i:-1).filter(i=>i>=0);
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
 if(g.won||g.lost||(!g.cfg.jam&&!g.cfg.bombs))return result;
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
 if(spread.length||expired.length||g.cfg.bombs>0)
  result.stages.push({kind:'hazard',cells:snapshot(g).cells,spread,expired});
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
 if(!Number.isInteger(index)||index<0||index>=g.cells.length||!g.cells[index]||g.cells[index].type===null)return {valid:false,reason:'target'};
 const c=g.cells[index];if((c.hold||0)>=drops)return {valid:false,reason:'already-held'};
 c.hold=drops;g.boosterUsed++;g.uses[type]=(g.uses[type]||0)+1;
 return {valid:true,type,index,drops,stages:[],objectives:objectiveState(g)};
}
function booster(g,type,index){
 if(g.won)return {valid:false,reason:'finished'};
 if(!BOOSTERS.includes(type))return {valid:false,reason:'unknown'};
 if(type==='extra'){g.moves+=5;g.lost=false;g.boosterUsed++;g.uses.extra=(g.uses.extra||0)+1;
  return {valid:true,type,stages:[],objectives:objectiveState(g)};}
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
  ids=g.cells.map((c,i)=>{
   if(!c)return -1;
   const r=Math.floor(i/w),x=i%w;
   const ok=type==='hammer'&&i===index||
     (type==='row'||type==='cross')&&r===row||
     (type==='column'||type==='drill'||type==='cross')&&x===col||
     type==='blast'&&Math.abs(r-row)<=1&&Math.abs(x-col)<=1||
     type==='color'&&c.type===nutType;
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
 g.boosterUsed++;g.uses[type]=(g.uses[type]||0)+1;
 g.score+=targets.length*35;
 const afterClear=snapshot(g).cells,falls=[];gravity(g,falls);
 const afterGravity=snapshot(g).cells,r=collapse(g);
 g.won=complete(g);g.lost=g.moves<=0&&!g.won;
 const stage={kind:'cascade',before,afterClear,clear:targets,falls,cells:afterGravity};
 return {...r,valid:true,type,removed:r.removed+summary.removed,cracked:r.cracked+summary.cracked,
  won:g.won,lost:g.lost,stages:[stage,...r.stages],objectives:objectiveState(g)};
}
function snapshot(g){return {level:g.level,seed:g.seed,moves:g.moves,score:g.score,won:g.won,lost:g.lost,boosterUsed:g.boosterUsed,turns:g.turns,progress:{...g.progress,colors:[...g.progress.colors]},uses:{...g.uses},objectives:objectiveState(g),cells:g.cells.map(c=>c?{type:c.type,ice:c.ice,lock:c.lock,chest:c.chest,jam:c.jam,fuse:c.fuse,special:c.special,hold:c.hold||0}:null)};}
const api={TYPES,BOOSTERS,BOOSTER_META,HOLD_DROPS,makeLevel,create,matches,adjacent,hasMove,gravity,shuffle,repairMove,objectiveState,expandSpecials,specialComboHits,advanceBoardFeatures,advanceHazards,swap,booster,applyHold,snapshot,rng};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.NutEngine=api;
})(typeof window!=='undefined'?window:globalThis);
