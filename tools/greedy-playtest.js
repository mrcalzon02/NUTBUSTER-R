/* Automated difficulty probe, NOT a prediction of real player win rates.
   A deliberately simple non-booster bot makes greedy matching moves. */
const E=require('../web/engine.js');
const trials=2,results=[];
function choose(g){
 const w=g.cfg.width,objective=g.cfg.objectives;
 let best=null,bestScore=-Infinity;
 for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+w]){
  if(!E.adjacent(g,a,b))continue;
  const ca=g.cells[a],cb=g.cells[b],left=ca.type,right=cb.type;
  ca.type=right;cb.type=left;
  const hit=E.matches(g).hit;
  let score=hit.size*10;
  if(ca.special||cb.special)score+=25;
  for(const i of hit){
   const c=g.cells[i];
   if(objective.some(o=>o.kind==='collect'&&o.color===c.type))score+=15;
   if(objective.some(o=>o.kind==='ice')&&c.ice)score+=25;
   if(objective.some(o=>o.kind==='locks')&&c.lock)score+=30;
   if(objective.some(o=>o.kind==='chests')&&c.chest)score+=30;
   if(objective.some(o=>o.kind==='jam')&&c.jam)score+=40;
   if(c.fuse)score+=20;
  }
  ca.type=left;cb.type=right;
  if(score>bestScore){bestScore=score;best=[a,b];}
 }
 return best;
}
for(let level=1;level<=200;level++){
 let wins=0,totalTurns=0,totalTransport=0,totalHazards=0;
 for(let trial=0;trial<trials;trial++){
  const g=E.create(level,level*16321+trial*7093+11),initial=g.moves;
  while(!g.won&&!g.lost&&g.moves>0){
   const pair=choose(g);
   if(!pair)throw Error('No adjacent pair on playable level '+level);
   const turn=E.swap(g,...pair);
   if(!turn.valid)throw Error('Bot swap not legal at level '+level);
   totalTransport+=turn.stages.filter(x=>x.kind==='transport').length;
   totalHazards+=(turn.hazards?.expired?.length||0);
  }
  if(g.won)wins++;
  totalTurns+=initial-g.moves;
 }
 results.push({level,wins,trials,avgSpentMoves:+(totalTurns/trials).toFixed(1),
  transports:totalTransport,hazardDetonations:totalHazards});
}
const bands=[];
for(let start=1;start<=200;start+=20){
 const section=results.slice(start-1,start+19);
 bands.push({levels:start+'-'+(start+19),greedyBotWinCount:section.reduce((s,r)=>s+r.wins,0),
  attempts:section.length*trials,zeroWinStages:section.filter(r=>r.wins===0).length,
  meanSpentMoves:+(section.reduce((s,r)=>s+r.avgSpentMoves,0)/section.length).toFixed(1)});
}
console.log(JSON.stringify({description:'Greedy non-booster bot; proxy diagnostic only, not real human completion rate',
 botTrials:trials,seed:'level*16321 + trial*7093 + 11',bands,levels:results},null,2));
