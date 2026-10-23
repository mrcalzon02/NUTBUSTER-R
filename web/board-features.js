/* Fixed board infrastructure: move nut identities and specials, not blockers or holes. */
(function(root){'use strict';
function make(level,mask,width,height){
 const conveyors=[],portals=[],wind=[],n=Math.trunc(level);
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
 // Autumn Windmill Vale introduces reversing vertical gust lanes. They cycle
 // EXISTING nut identities, never moving blockers, cells, or hazards.
 if(n>=301){
  const lanes=[];
  for(let x=0;x<width;x++){
   let start=-1;
   for(let y=0;y<=height;y++){
    const active=y<height&&mask[y*width+x];
    if(active&&start<0)start=y;
    if(!active&&start>=0){
     if(y-start>=3){
      const indices=Array.from({length:y-start},(_,i)=>(start+i)*width+x);
      const center=Math.abs(x-(width-1)/2);
      lanes.push({indices,priority:indices.length*100-center*10});
     }
     start=-1;
    }
   }
  }
  lanes.sort((a,b)=>b.priority-a.priority||a.indices[0]-b.indices[0]);
  const pickedColumns=new Set(),count=n>=401?2:1;
  for(const candidate of lanes){
   if(wind.length>=count)break;
   const column=candidate.indices[0]%width;
   if(pickedColumns.has(column))continue;
   pickedColumns.add(column);
   wind.push({indices:candidate.indices,every:n>=401?1:2});
  }
 }
 return {conveyors,portals,wind};
}
// Wind direction changes after each gust, not randomly on each render.
function windDirection(lane,turn){
 const cycle=Math.floor(turn/lane.every);
 return cycle%2?'up':'down';
}
function nextWindDirection(lane,currentTurn){
 const next=(Math.floor(currentTurn/lane.every)+1)*lane.every;
 return windDirection(lane,next);
}
function advance(g,turn,snapshot){
 const features=g.cfg.features||{},stages=[];
 const blocked=i=>!!(g.cells[i]&&(g.cells[i].ice>0||g.cells[i].lock>0||g.cells[i].chest>0||g.cells[i].frozen>0));
 const move=(from,to)=>({from,to,type:g.cells[from].type,special:g.cells[from].special,elemental:g.cells[from].elemental||null,hold:g.cells[from].hold||0});
 function apply(mode,transfers){
  if(!transfers.length)return;
  const before=snapshot();
  for(const t of transfers){g.cells[t.to].type=t.type;g.cells[t.to].special=t.special;g.cells[t.to].elemental=t.elemental;g.cells[t.to].hold=t.hold;}
  stages.push({kind:'transport',mode,before,cells:snapshot(),transfers});
 }
 for(const belt of features.conveyors||[]){
  if(turn%belt.every)continue;
  const chunks=[];let segment=[];
  for(const i of belt.indices){if(blocked(i)){if(segment.length>1)chunks.push(segment);segment=[];}else segment.push(i);}
  if(segment.length>1)chunks.push(segment);
  for(const ids of chunks)apply('conveyor',ids.map((from,i)=>move(from,ids[belt.direction==='right'?(i+1)%ids.length:(i+ids.length-1)%ids.length])));
 }
 for(const portal of features.portals||[]){
  if(turn%portal.every)continue;
  const [a,b]=portal.indices;
  if(!blocked(a)&&!blocked(b))apply('portal',[move(a,b),move(b,a)]);
 }
 for(const lane of features.wind||[]){
  if(turn%lane.every)continue;
  const dir=windDirection(lane,turn),chunks=[];let segment=[];
  for(const i of lane.indices){if(blocked(i)){if(segment.length>1)chunks.push(segment);segment=[];}else segment.push(i);}
  if(segment.length>1)chunks.push(segment);
  for(const ids of chunks)apply('wind',ids.map((from,i)=>move(from,ids[
   dir==='down'?(i+1)%ids.length:(i+ids.length-1)%ids.length
  ])));
 }
 return stages;
}
const api={make,advance,windDirection,nextWindDirection};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutBoardFeatures=api;
})(typeof window!=='undefined'?window:globalThis);
