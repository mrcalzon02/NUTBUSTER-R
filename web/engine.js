/* Nutbuster deterministic, DOM-free match-three engine. MIT-style project code; art remains user-owned. */
(function(root){
'use strict';
const TYPES=['peanut','walnut','almond','cashew','hazelnut','pistachio'];
const BOOSTERS=['hammer','row','shuffle','extra'];
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
 const n=Math.max(1,Math.min(500,Math.trunc(number)||1));
 // 8x9 is the late-game maximum, not the beginner board.
 const w=n<=10?4:n<=30?5:n<=70?6:n<=140?7:8, h=w+1;
 const mask=[]; for(let y=0;y<h;y++)for(let x=0;x<w;x++)mask.push(shape(n,x,y,w,h));
 const chapter=Math.floor((n-1)/100),past200=Math.max(0,n-200);
 // Difficulty grows progressively for 200 levels, then deliberately exceeds the normal ceiling.
 const moves=Math.max(9,32-Math.floor(n/12)-Math.floor(past200/39));
 const goal=Math.round(700+18*n+Math.pow(past200/12,1.35)*55);
 return {number:n,chapter:chapter+1,width:w,height:h,mask,moves,goal,
  ice:n>=3?Math.min(20,1+Math.floor(n/16)):0,
  locks:n>=28?Math.min(14,1+Math.floor((n-28)/24)):0,
  chests:n>=68?Math.min(10,1+Math.floor((n-68)/36)):0,
  title:['Nutwood Meadows','Peanut Butter Factory','Squirrel Hoard Highlands','Autumn Windmill Vale','Moonlit Golden Palace'][chapter]};
}
function create(level=1,seed=level*7919){
 const cfg=makeLevel(level);let rand=rng(seed);const a=cfg.mask.map(v=>v?{type:0,ice:0,lock:0,chest:0,special:null}:null);
 const g={level:cfg.number,cfg,seed,rand,cells:a,score:0,moves:cfg.moves,won:false,lost:false,combos:0,history:[],boosterUsed:0};
 for(let y=0;y<cfg.height;y++)for(let x=0;x<cfg.width;x++){
  const i=y*cfg.width+x;if(!a[i])continue;let opts=TYPES.map((_,i)=>i).filter(t=>!(x>=2&&a[i-1]&&a[i-2]&&a[i-1].type===t&&a[i-2].type===t)&&!(y>=2&&a[i-cfg.width]&&a[i-2*cfg.width]&&a[i-cfg.width].type===t&&a[i-2*cfg.width].type===t));a[i].type=opts[Math.floor(rand()*opts.length)];
 }
 const candidates=a.map((v,i)=>v?i:-1).filter(i=>i>=0);
 function plant(count,key){for(let t=0;t<count;t++){let free=candidates.filter(i=>a[i]&&a[i].ice===0&&a[i].lock===0&&a[i].chest===0);if(!free.length)break;a[free[Math.floor(rand()*free.length)]][key]=key==='chest'?2:key==='ice'?2:1;}}
 plant(cfg.ice,'ice');plant(cfg.locks,'lock');plant(cfg.chests,'chest');
 if(!hasMove(g))shuffle(g);return g;
}
function matches(g){const hit=new Set(),groups=[];const {width:w,height:h}=g.cfg;function run(indices){if(indices.length>=3){groups.push(indices);indices.forEach(i=>hit.add(i));}}
 for(let y=0;y<h;y++){let active=[],prev=null;for(let x=0;x<=w;x++){const i=y*w+x,c=x<w?g.cells[i]:null,t=c?c.type:null;if(t!==null&&t===prev)active.push(i);else{run(active);active=t!==null?[i]:[];prev=t;}}}
 for(let x=0;x<w;x++){let active=[],prev=null;for(let y=0;y<=h;y++){const i=y*w+x,c=y<h?g.cells[i]:null,t=c?c.type:null;if(t!==null&&t===prev)active.push(i);else{run(active);active=t!==null?[i]:[];prev=t;}}}
 return {hit,groups};
}
function adjacent(g,a,b){const w=g.cfg.width;return a>=0&&b>=0&&a<g.cells.length&&b<g.cells.length&&g.cells[a]&&g.cells[b]&&((Math.abs(a-b)===w)||(Math.floor(a/w)===Math.floor(b/w)&&Math.abs(a-b)===1));}
function hasMove(g){for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+g.cfg.width]){if(!adjacent(g,a,b))continue;const p=g.cells[a].type;g.cells[a].type=g.cells[b].type;g.cells[b].type=p;const ok=matches(g).hit.size>0;g.cells[b].type=g.cells[a].type;g.cells[a].type=p;if(ok)return true;}return false;}
function shuffle(g){const ids=g.cells.map((v,i)=>v?i:-1).filter(i=>i>=0);for(let attempt=0;attempt<100;attempt++){
 for(let j=ids.length-1;j>0;j--){const k=Math.floor(g.rand()*(j+1)),p=g.cells[ids[j]].type;g.cells[ids[j]].type=g.cells[ids[k]].type;g.cells[ids[k]].type=p;}
 if(matches(g).hit.size===0&&hasMove(g))return true;
 }
 // Guaranteed local repair: rebuild types until there is at least one legal match without pre-existing matches.
 for(let tries=0;tries<50;tries++){for(const i of ids)g.cells[i].type=Math.floor(g.rand()*TYPES.length);if(matches(g).hit.size===0&&hasMove(g))return true;}
 return false;
}
function gravity(g,falls=[]){const w=g.cfg.width,h=g.cfg.height; // Void cells separate independent column segments.
 for(let x=0;x<w;x++){let y=h-1;while(y>=0){while(y>=0&&!g.cells[y*w+x])y--;if(y<0)break;const bottom=y;while(y>=0&&g.cells[y*w+x])y--;const top=y+1,survivors=[];
  for(let yy=bottom;yy>=top;yy--){const c=g.cells[yy*w+x];if(c.type!==null)survivors.push({type:c.type,special:c.special,from:yy*w+x});}
  const fresh=bottom-top+1-survivors.length;
  for(let yy=bottom,n=0;yy>=top;yy--,n++){const i=yy*w+x,c=g.cells[i],s=survivors[n];
   c.type=s?s.type:Math.floor(g.rand()*TYPES.length);c.special=s?s.special:null;
   if(s){if(s.from!==i)falls.push({from:s.from,to:i,type:s.type,special:s.special});}
   else falls.push({from:-1,to:i,startRow:yy-fresh,type:c.type,special:null});
  }
 }}
}
function collapse(g,first){let loops=0,removed=0,cracked=0;const stages=[];let found=first||matches(g);
 while(found.hit.size&&loops<60){loops++;let bonus=0;
  const before=snapshot(g).cells,ids=[...found.hit],specialSpot=found.groups.find(group=>group.length>=4);
  const sp=specialSpot?specialSpot[Math.floor(specialSpot.length/2)]:-1;
  for(const i of ids){const c=g.cells[i];if(!c)continue;if(c.ice>0){c.ice--;cracked++;}else if(c.lock>0){c.lock--;cracked++;}else if(c.chest>0){c.chest--;cracked++;}else{c.type=null;c.special=null;removed++;}}
  if(sp>=0&&g.cells[sp]&&g.cells[sp].type===null){g.cells[sp].type=Math.floor(g.rand()*TYPES.length);g.cells[sp].special=found.groups.some(k=>k.length>=5)?'rainbow':'line';bonus+=100;}
  g.score+=(ids.length*60+bonus)*Math.min(loops,6);
  const afterClear=snapshot(g).cells,falls=[];gravity(g,falls);stages.push({kind:'cascade',before,afterClear,clear:ids,falls,cells:snapshot(g).cells});
  found=matches(g);
 }
 g.combos=loops;g.won=g.score>=g.cfg.goal;g.lost=g.moves<=0&&!g.won;
 if(!g.won&&!g.lost&&!hasMove(g)){repairMove(g);stages.push({kind:'repair',cells:snapshot(g).cells});}
 g.history.push({loops,removed,cracked,score:g.score});return {valid:true,loops,removed,cracked,won:g.won,lost:g.lost,stages};
}
function repairMove(g){
 // Deadlock recovery exchanges only two existing nut identities before considering a full shuffle.
 const ids=g.cells.map((v,i)=>v?i:-1).filter(i=>i>=0);
 for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
  const left=g.cells[ids[a]],right=g.cells[ids[b]];if(left.type===right.type)continue;
  const t=left.type;left.type=right.type;right.type=t;
  if(matches(g).hit.size===0&&hasMove(g))return true;
  right.type=left.type;left.type=t;
 }
 return shuffle(g);
}
function swap(g,a,b){
 if(g.won||g.lost)return {valid:false,reason:'finished'};
 if(!adjacent(g,a,b))return {valid:false,reason:'adjacency'};
 const ca=g.cells[a],cb=g.cells[b],pa={type:ca.type,special:ca.special},pb={type:cb.type,special:cb.special};
 ca.type=pb.type;ca.special=pb.special;cb.type=pa.type;cb.special=pa.special;
 let found=matches(g);
 if(ca.special||cb.special){
   const source=ca.special?a:b,special=g.cells[source].special,other=source===a?b:a;
   const hit=new Set([source,other]);
   if(special==='rainbow'){
     const target=g.cells[other].type;
     g.cells.forEach((c,i)=>{if(c&&c.type===target)hit.add(i);});
   }else{
     const row=Math.floor(source/g.cfg.width);
     g.cells.forEach((c,i)=>{if(c&&Math.floor(i/g.cfg.width)===row)hit.add(i);});
   }
   found={hit,groups:[]};
 }
 if(!found.hit.size){
  // Non-matching adjacent swaps are intentional moves. Keep the new board and deduct a turn.
  g.moves--;g.combos=0;g.lost=g.moves<=0;g.history.push({loops:0,removed:0,cracked:0,score:g.score});
  return {valid:true,loops:0,removed:0,cracked:0,won:false,lost:g.lost,swap:[a,b],stages:[]};
 }
 g.moves--;return {...collapse(g,found),swap:[a,b]};
}
function booster(g,type,index){if(g.won)return {valid:false,reason:'finished'};if(!BOOSTERS.includes(type))return {valid:false,reason:'unknown'};
 if(type==='extra'){g.moves+=5;g.lost=false;g.boosterUsed++;return {valid:true,type};}
 if(type==='shuffle'){shuffle(g);g.boosterUsed++;return {valid:true,type};}
 if(index<0||index>=g.cells.length||!g.cells[index])return {valid:false,reason:'target'};
 const ids=type==='hammer'?[index]:g.cells.map((v,i)=>v&&Math.floor(i/g.cfg.width)===Math.floor(index/g.cfg.width)?i:-1).filter(i=>i>=0);
 const before=snapshot(g).cells;
 for(const i of ids){let c=g.cells[i];if(c.ice)c.ice--;else if(c.lock)c.lock--;else if(c.chest)c.chest--;else {c.type=null;c.special=null;}}
 g.boosterUsed++;g.score+=ids.length*35;const afterClear=snapshot(g).cells,falls=[];gravity(g,falls);const afterGravity=snapshot(g).cells,r=collapse(g);
 return {...r,type,stages:[{kind:'cascade',before,afterClear,clear:ids,falls,cells:afterGravity},...r.stages]};
}
function snapshot(g){return {level:g.level,seed:g.seed,moves:g.moves,score:g.score,won:g.won,lost:g.lost,boosterUsed:g.boosterUsed,cells:g.cells.map(c=>c?{type:c.type,ice:c.ice,lock:c.lock,chest:c.chest,special:c.special}:null)};}
const api={TYPES,BOOSTERS,makeLevel,create,matches,adjacent,hasMove,shuffle,swap,booster,snapshot,rng};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.NutEngine=api;
})(typeof window!=='undefined'?window:globalThis);
