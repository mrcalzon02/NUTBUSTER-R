/* Fixed board infrastructure: move nut identities and specials, not blockers or holes. */
(function(root){'use strict';
function make(level,mask,width,height){
 const conveyors=[],portals=[],n=Math.trunc(level);
 if(n>=125&&(n>=201||n===125||n===126||n%3!==0)){
  const runs=[];
  for(let y=0;y<height;y++){
   let start=-1;
   for(let x=0;x<=width;x++){
    const active=x<width&&mask[y*width+x];
    if(active&&start<0)start=x;
    if(!active&&start>=0){
     if(x-start>=3)runs.push({indices:Array.from({length:x-start},(_,i)=>y*width+start+i),priority:(x-start)*100-Math.abs(y-(height-1)/2)*4});
     start=-1;
    }
   }
  }
  runs.sort((a,b)=>b.priority-a.priority||a.indices[0]-b.indices[0]);
  if(runs.length)conveyors.push({indices:runs[0].indices,direction:n%2?'left':'right',every:n>=301?1:2});
 }
 if(n>=164&&(n>=201||n===164||n===165||n%4!==0)){
  const excluded=new Set(conveyors.flatMap(c=>c.indices));
  const valid=mask.map((yes,i)=>yes&&!excluded.has(i)?i:-1).filter(i=>i>=0);
  let max=-1,pair=null;
  for(let i=0;i<valid.length;i++)for(let j=i+1;j<valid.length;j++){
   const a=valid[i],b=valid[j],ya=Math.floor(a/width),yb=Math.floor(b/width);
   if(ya===yb)continue;
   const dist=Math.abs(ya-yb)*height+Math.abs(a%width-b%width);
   if(dist>max){max=dist;pair=[a,b];}
  }
  if(pair)portals.push({indices:pair,every:n>=301?2:3});
 }
 return {conveyors,portals};
}
function advance(g,turn,snapshot){
 const features=g.cfg.features||{},stages=[];
 const move=(from,to)=>({from,to,type:g.cells[from].type,special:g.cells[from].special});
 function apply(mode,transfers){
  if(!transfers.length)return;
  const before=snapshot();
  for(const t of transfers){g.cells[t.to].type=t.type;g.cells[t.to].special=t.special;}
  stages.push({kind:'transport',mode,before,cells:snapshot(),transfers});
 }
 for(const belt of features.conveyors||[]){
  if(turn%belt.every)continue;
  const ids=belt.indices;
  apply('conveyor',ids.map((from,i)=>move(from,ids[belt.direction==='right'?(i+1)%ids.length:(i+ids.length-1)%ids.length])));
 }
 for(const portal of features.portals||[]){
  if(turn%portal.every)continue;
  const [a,b]=portal.indices;
  apply('portal',[move(a,b),move(b,a)]);
 }
 return stages;
}
const api={make,advance};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutBoardFeatures=api;
})(typeof window!=='undefined'?window:globalThis);
