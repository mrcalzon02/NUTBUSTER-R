/* Structural level analysis; these are NOT human win-rate predictions. */
const E=require('../web/engine.js');
const CAMPAIGN_LEVELS=1000,CHAPTER_LENGTH=100;
let table=[];
for(let chapter=1;chapter<=CAMPAIGN_LEVELS/CHAPTER_LENGTH;chapter++){
 let totalMoves=0,totalMovesAvailable=0,totalCells=0,conveyor=0,portal=0,wind=0,minOpenings=Infinity,minimumMoves=Infinity;
 for(let level=(chapter-1)*CHAPTER_LENGTH+1;level<=chapter*CHAPTER_LENGTH;level++){
  const g=E.create(level,level*127+17),w=g.cfg.width;let openings=0;
  for(let a=0;a<g.cells.length;a++)for(const b of [a+1,a+w]){
   if(!E.adjacent(g,a,b))continue;
   const left=g.cells[a].type,right=g.cells[b].type;
   g.cells[a].type=right;g.cells[b].type=left;
   if(E.matches(g).hit.size)openings++;
   g.cells[a].type=left;g.cells[b].type=right;
  }
  if(openings<1)throw Error('No opening scoring swaps at '+level);
  totalMoves+=g.moves;totalMovesAvailable+=openings;totalCells+=g.cells.filter(Boolean).length;
  conveyor+=g.cfg.features.conveyors.length>0;portal+=g.cfg.features.portals.length>0;wind+=g.cfg.features.wind.length>0;
  minOpenings=Math.min(minOpenings,openings);minimumMoves=Math.min(minimumMoves,g.moves);
 }
 table.push({chapter,levels:CHAPTER_LENGTH,averageMoves:+(totalMoves/CHAPTER_LENGTH).toFixed(1),
  averageOpenings:+(totalMovesAvailable/CHAPTER_LENGTH).toFixed(1),averageCells:+(totalCells/CHAPTER_LENGTH).toFixed(1),
  minOpenings,minimumMoves,conveyorStages:conveyor,portalStages:portal,windStages:wind});
}
if(!(table[0].averageMoves>table[1].averageMoves&&table[1].averageMoves>table[4].averageMoves))
 throw Error('The planned move-budget difficulty ramp has regressed');
if(table.length!==10||table.reduce((n,chapter)=>n+chapter.levels,0)!==CAMPAIGN_LEVELS)throw Error('Incomplete authored campaign coverage in structural audit');
console.log(JSON.stringify({kind:'structural_audit_not_player_completion_rate',campaignLevels:CAMPAIGN_LEVELS,chapterLength:CHAPTER_LENGTH,seed:'level*127+17',chapters:table},null,2));
