'use strict';
// Independent evidence validation and classification; never a solvability claim.
// Each mode gets its own fresh daily wallet, and all 300 selected attempts
// are matched across three seeds on the same 100 spaced-out levels.
function check(ok,msg){if(!ok)throw Error('Failure analysis: '+msg);}
const integer=x=>Number.isSafeInteger(x)&&x>=0;
function checkResult(x,cap,label){
 check(x&&typeof x==='object'&&typeof x.won==='boolean'&&
  ['won','daily-moves-exhausted','engine-ended-with-wallet-remaining'].includes(x.reason)&&
  integer(x.remainingMoves)&&integer(x.hammerUsed)&&integer(x.debitedMoves)&&
  integer(x.earnedRefunds)&&integer(x.swaps)&&integer(x.hazardPenaltyMoves)&&
  integer(x.noProgressSwaps)&&integer(x.expiredFuses)&&integer(x.startedCompleted)&&
  Array.isArray(x.objectives)&&x.objectives.length>=1,'malformed outcome '+label);
 check(x.remainingMoves===cap+x.earnedRefunds-x.debitedMoves&&
  x.hazardPenaltyMoves===x.debitedMoves-x.swaps&&
  x.hazardPenaltyMoves<=2*x.expiredFuses&&
  x.noProgressSwaps<=x.swaps,'daily wallet or hazard accounting mismatch '+label);
 check(x.won===(x.reason==='won')&&
  (x.reason!=='daily-moves-exhausted'||x.remainingMoves===0)&&
  (x.reason!=='engine-ended-with-wallet-remaining'||x.remainingMoves>0),
  'outcome/reason mismatch '+label);
 let complete=0;
 for(const o of x.objectives){
  check(['score','collect','ice','locks','chests','jam'].includes(o.kind)&&
   integer(o.target)&&o.target>0&&Number.isFinite(o.value)&&o.value>=0&&
   Number.isFinite(o.startingValue)&&o.startingValue>=0&&
   o.value>=o.startingValue&&integer(o.remaining)&&
   o.remaining===Math.max(0,o.target-o.value)&&
   Number.isFinite(o.completion)&&o.completion>=0&&o.completion<=1&&
   Math.abs(o.completion-Math.min(1,o.value/o.target))<1e-9,
   'invalid objective evidence '+label);
  complete+=Number(!o.remaining);
 }
 check(x.won===(complete===x.objectives.length),'win/objective mismatch '+label);
 check(x.startedCompleted<=complete,'objectives regressed '+label);
 return x.objectives.reduce((s,o)=>s+o.completion,0)/x.objectives.length;
}
function summary(probes,key){
 const outcomes=probes.map(p=>({level:p.level,trial:p.trial,x:p[key]}));
 const losses=outcomes.filter(v=>!v.x.won),objectiveCounts=new Map(),dominantCounts=new Map();
 let progress=0,lossProgress=0,penalty=0,expiredFuses=0,stalled=0,exhausted=0,engineEnded=0;
 for(const {x} of outcomes){
  progress+=x.objectives.reduce((s,o)=>s+o.completion,0)/x.objectives.length;
  penalty+=x.hazardPenaltyMoves;
  expiredFuses+=x.expiredFuses;
 }
 for(const {x} of losses){
  lossProgress+=x.objectives.reduce((s,o)=>s+o.completion,0)/x.objectives.length;
  exhausted+=Number(x.reason==='daily-moves-exhausted');
  engineEnded+=Number(x.reason==='engine-ended-with-wallet-remaining');
  stalled+=Number(x.noProgressSwaps>0&&x.noProgressSwaps*2>=x.swaps);
  let max=null;
  for(const o of x.objectives){
   if(!o.remaining)continue;
   const name=o.kind==='collect'?'collect:'+o.color:o.kind;
   objectiveCounts.set(name,(objectiveCounts.get(name)||0)+1);
   if(!max||o.remaining/o.target>max.remaining/max.target)max={name,remaining:o.remaining,target:o.target};
  }
  if(max)dominantCounts.set(max.name,(dominantCounts.get(max.name)||0)+1);
 }
 const top=m=>[...m.entries()].map(([kind,count])=>({kind,count}))
  .sort((a,b)=>b.count-a.count||a.kind.localeCompare(b.kind)).slice(0,8);
 const worst=losses.map(({level,trial,x})=>({level,trial,
  progressPct:+(100*x.objectives.reduce((s,o)=>s+o.completion,0)/x.objectives.length).toFixed(1),
  hazardPenaltyMoves:x.hazardPenaltyMoves,swaps:x.swaps,
  stillNeeded:x.objectives.filter(o=>o.remaining>0).map(o=>({
   kind:o.kind,color:o.color,remaining:o.remaining,target:o.target}))}))
  .sort((a,b)=>a.progressPct-b.progressPct||b.hazardPenaltyMoves-a.hazardPenaltyMoves||a.level-b.level).slice(0,5);
 return {attempts:outcomes.length,wins:outcomes.length-losses.length,
  losses:losses.length,dailyExhaustion:exhausted,engineEndedWithWallet:engineEnded,
  objectiveProgressPct:+(100*progress/outcomes.length).toFixed(1),
  lostObjectiveProgressPct:losses.length?+(100*lossProgress/losses.length).toFixed(1):null,
  hazardPenaltyMoves:penalty,expiredFuses,stalledLosses:stalled,
  unresolvedObjectiveIncidence:top(objectiveCounts),
  dominantUnfinishedObjective:top(dominantCounts),
  mostIncompleteLosses:worst};
}
function reviewFailureAnalysis(raw,comparison){
 check(raw?.kind==='DETAILED_FAILURE_CAUSE_SAMPLED_NOT_SOLVABILITY_PROOF'&&
  raw.sampledLevels===100&&raw.seedsPerLevel===3&&raw.attempts===300&&
  raw.chapterSize===100&&raw.dailyAllowanceModel==='FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET'&&
  Array.isArray(raw.probes)&&raw.probes.length===300,'requires 100 levels with three seeds each');
 const matched=new Map(comparison.probes.map(x=>[x.level,x]));
 for(let i=0;i<300;i++){
  const p=raw.probes[i],level=(Math.floor(i/3)+1)*10,trial=i%3;
  check(p.level===level&&p.trial===trial&&integer(p.dailyAllotment)&&
   p.dailyAllotment>=12&&p.dailyAllotment<=36,'bad sampled level or daily cap at index '+i);
  checkResult(p.noBooster,p.dailyAllotment,'no-booster '+level+'/'+trial);
  checkResult(p.minimalHammer,p.dailyAllotment,'Hammer '+level+'/'+trial);
  check(p.noBooster.hammerUsed===0&&p.minimalHammer.hammerUsed<=1,
   'booster budget violated at '+level+'/'+trial);
  check(p.noBooster.objectives.length===p.minimalHammer.objectives.length&&
   p.noBooster.objectives.every((o,j)=>{
    const b=p.minimalHammer.objectives[j];
    return o.kind===b.kind&&o.color===b.color&&o.target===b.target&&o.startingValue===b.startingValue;
   }),'unmatched objectives at '+level+'/'+trial);
  if(trial===0){
   const previous=matched.get(level);
   check(previous&&p.noBooster.won===previous.strategicWon&&
    p.minimalHammer.won===previous.strategicHammerWon&&
    p.minimalHammer.hammerUsed===previous.hammerUsed,
    'original objective-aware matched seed diverged at '+level);
  }
 }
 const chapters=Array.from({length:10},(_,i)=>{
  const subset=raw.probes.slice(i*30,(i+1)*30);
  return {chapter:i+1,levels:(i*100+10)+'-'+(i*100+100),
   noBooster:summary(subset,'noBooster'),minimalHammer:summary(subset,'minimalHammer')};
 });
 return {kind:raw.kind,sampledLevels:100,seedsPerLevel:3,
  attemptsPerMode:300,dailyAllowanceModel:raw.dailyAllowanceModel,
  noBooster:summary(raw.probes,'noBooster'),
  minimalHammer:summary(raw.probes,'minimalHammer'),
  chapters};
}
function markdownFailureAnalysis(r){
 let t='\n**Why the sampled objective-aware player loses** — '+r.sampledLevels+
  ' spaced levels × '+r.seedsPerLevel+' seeds, fresh daily wallet each time. All numbers are test-player evidence, not solvability proofs.\n\n';
 t+='| Chapter | No booster wins / 30 | Hammer wins / 30 | Exhausted daily moves (no booster) | Loss goal completion | Hazard move penalties |\n';
 t+='|---|---:|---:|---:|---:|---:|\n';
 for(const c of r.chapters)t+='| '+c.chapter+' | '+c.noBooster.wins+' | '+
  c.minimalHammer.wins+' | '+c.noBooster.dailyExhaustion+
  ' | '+(c.noBooster.lostObjectiveProgressPct===null?'—':c.noBooster.lostObjectiveProgressPct+'%')+
  ' | '+c.noBooster.hazardPenaltyMoves+' |\n';
 t+='\n**Most common unfinished objective types on losing no-booster attempts:** '+
  (r.noBooster.unresolvedObjectiveIncidence.slice(0,5).map(x=>x.kind+' ('+x.count+')').join(', ')||'none')+'.\n';
 t+='\n**Worst sampled losses:** '+r.noBooster.mostIncompleteLosses.map(x=>
  'stage '+x.level+' seed '+x.trial+' ('+x.progressPct+'% of goals)').join('; ')+'.\n';
 t+='\n**Caveat:** Completing 50% of several different goals is not equivalent to being halfway to a solvable board. This heuristic does not perform full multi-turn search and uses one hypothetical late Hammer only.\n';
 return t;
}
module.exports={reviewFailureAnalysis,markdownFailureAnalysis,checkResult,summary};
