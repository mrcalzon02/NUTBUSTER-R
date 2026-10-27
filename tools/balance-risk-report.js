#!/usr/bin/env node
'use strict';
// Non-blocking assessment of the published campaign probes. Greedy bot outcomes
// are NOT human completion rates, proof of unfairness, or proof of impossibility.
const fs=require('node:fs');
const {reviewFailureAnalysis,markdownFailureAnalysis}=require('./failure-analysis.js');
function requireValid(ok,message){if(!ok)throw Error('Balance review: '+message);}
function integer(n){return Number.isInteger(n)&&n>=0;}
function review(structural,bot){
 requireValid(structural&&structural.campaignLevels===1000&&Array.isArray(structural.chapters)&&structural.chapters.length===10,'requires full 1,000-level structural audit');
 requireValid(bot&&bot.campaignLevels===1000&&bot.botTrials===2&&Array.isArray(bot.levels)&&bot.levels.length===1000&&Array.isArray(bot.chapters)&&bot.chapters.length===10,'requires full two-trial 1,000-level bot audit');
 requireValid(bot.dailyAllowanceModel==='FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET'&&
  typeof bot.dailyAllowanceRule==='string'&&bot.dailyAllowanceRule.includes('NutDailyMoves.ensure'),
  'requires an independent, full daily-wallet allotment for each simulated level');
 const entries=bot.levels;
 for(let i=0;i<entries.length;i++){
  const x=entries[i];
  requireValid(x.level===i+1&&x.trials===2&&integer(x.wins)&&x.wins<=2&&integer(x.hazardDetonations)&&integer(x.transports)&&Number.isFinite(x.avgSpentMoves),'invalid gameplay sample at stage '+(i+1));
 }
 let wins=0,zeroWinLevels=0,hazards=0,transports=0;
 const chapters=[];
 for(let i=0;i<10;i++){
  const levels=entries.slice(i*100,(i+1)*100),c=structural.chapters[i],b=bot.chapters[i];
  const chapterWins=levels.reduce((sum,x)=>sum+x.wins,0);
  const noWins=levels.filter(x=>x.wins===0).length;
  const chapterHazards=levels.reduce((sum,x)=>sum+x.hazardDetonations,0);
  const chapterTransports=levels.reduce((sum,x)=>sum+x.transports,0);
  requireValid(c.chapter===i+1&&c.levels===100&&Number.isFinite(c.averageMoves)&&Number.isFinite(c.averageOpenings)&&c.minOpenings>=1,'structural chapter mismatch at '+(i+1));
  requireValid(b.chapter===i+1&&b.greedyBotWinCount===chapterWins&&b.zeroWinStages===noWins&&b.attempts===200&&b.totalHazardDetonations===chapterHazards&&b.totalTransports===chapterTransports,'bot chapter aggregation mismatch at '+(i+1));
  chapters.push({chapter:i+1,levels:(i*100+1)+'-'+((i+1)*100),
   attempts:200,botWins:chapterWins,botWinPercent:chapterWins/2,
   zeroWinStages:noWins,averageMoves:c.averageMoves,averageOpenings:c.averageOpenings,
   minimumOpeningSwaps:c.minOpenings,hazardDetonations:chapterHazards,
   transports:chapterTransports,
   reviewFlag:chapterWins<=10?'EXTREME_BOT_DIFFICULTY':chapterWins<=40?'HIGH_BOT_DIFFICULTY':chapterWins<=100?'ELEVATED_BOT_DIFFICULTY':'BASELINE'});
  wins+=chapterWins;zeroWinLevels+=noWins;hazards+=chapterHazards;transports+=chapterTransports;
 }
 // Sparse comparison uses the SAME seed for a second run, not the
 // existing full-campaign no-booster baseline counted in the table above.
 const comparison=bot.boosterComparison;
 requireValid(comparison?.kind==='SPARSE_EMERGENCY_HAMMER_PROBE_NOT_INVENTORY'&&
  comparison.attempts===200&&comparison.frequencyLevels===5&&comparison.trial===0&&
  comparison.maxPerProbe===1&&Array.isArray(comparison.probes)&&comparison.probes.length===200&&
  Array.isArray(comparison.chapters)&&comparison.chapters.length===10,
  'requires 200 matched-seed, one-Hammer maximum comparison attempts');
 requireValid(comparison?.dailyAllowanceModel==='FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
  'scarce-booster comparison must use the same fresh daily-wallet allowance');
 let hammerUses=0,pairedBaselineWins=0,assistedWins=0;
 for(let i=0;i<comparison.probes.length;i++){
  const p=comparison.probes[i],level=(i+1)*5;
  requireValid(p.level===level&&p.trial===0&&integer(p.hammerUsed)&&p.hammerUsed<=1&&
   typeof p.baselineWon==='boolean'&&typeof p.assistedWon==='boolean'&&
   integer(p.dailyAllotment)&&p.dailyAllotment>=12&&p.dailyAllotment<=36&&
   integer(p.baselineRemainingMoves)&&integer(p.assistedRemainingMoves)&&
   integer(p.baselineEarnedRefunds)&&integer(p.assistedEarnedRefunds)&&
   p.baselineRemainingMoves<=p.dailyAllotment+p.baselineEarnedRefunds&&
   p.assistedRemainingMoves<=p.dailyAllotment+p.assistedEarnedRefunds&&
   Number.isFinite(p.baselineSpentMoves)&&Number.isFinite(p.assistedSpentMoves)&&
   p.baselineSpentMoves===p.dailyAllotment-p.baselineRemainingMoves&&
   p.assistedSpentMoves===p.dailyAllotment-p.assistedRemainingMoves,
   'invalid scarce-booster probe at '+level);
  hammerUses+=p.hammerUsed;
  pairedBaselineWins+=Number(p.baselineWon);
  assistedWins+=Number(p.assistedWon);
  if(i%20===19){
   const block=comparison.probes.slice(i-19,i+1),c=comparison.chapters[Math.floor(i/20)];
   requireValid(c.chapter===Math.floor(i/20)+1&&c.attempts===20&&
    c.hammerUsed===block.reduce((n,x)=>n+x.hammerUsed,0)&&
    c.baselineWins===block.filter(x=>x.baselineWon).length&&
    c.assistedWins===block.filter(x=>x.assistedWon).length,'scarce-booster chapter mismatch');
  }
 }
 requireValid(comparison.hammerUsed===hammerUses&&
  comparison.baselineWins===pairedBaselineWins&&comparison.assistedWins===assistedWins,
  'scarce-booster totals mismatch');
 // Objective-aware runs are an additional same-seed comparison, NOT replacements
 // for the original 2,000 greedy trials or the sparse greedy-Hammer probes.
 const strategy=bot.strategicComparison;
 requireValid(strategy?.kind==='MATCHED_SEED_OBJECTIVE_HAZARD_POLICY_NOT_HUMAN_WIN_RATE'&&
  strategy.dailyAllowanceModel==='FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET'&&
  strategy.attempts===200&&strategy.levelsPerProbe===5&&strategy.trial===0&&
  Array.isArray(strategy.probes)&&strategy.probes.length===200&&
  Array.isArray(strategy.chapters)&&strategy.chapters.length===10,
  'requires 200 matched-seed objective-aware player trials');
 let strategyWins=0,strategyHammerWins=0,strategyHammerUses=0,strategyFallbacks=0,pairedGreedyWins=0;
 for(let i=0;i<200;i++){
  const p=strategy.probes[i],b=comparison.probes[i],level=(i+1)*5;
  requireValid(p.level===level&&p.trial===0&&p.dailyAllotment===b.dailyAllotment&&
   p.greedyWon===b.baselineWon&&typeof p.strategicWon==='boolean'&&
   typeof p.strategicHammerWon==='boolean'&&integer(p.hammerUsed)&&p.hammerUsed<=1&&
   integer(p.fallbackSwaps)&&integer(p.noBoosterRemainingMoves)&&
   integer(p.minimalHammerRemainingMoves),
   'invalid objective-aware matched-seed trial '+level);
  pairedGreedyWins+=Number(p.greedyWon);
  strategyWins+=Number(p.strategicWon);
  strategyHammerWins+=Number(p.strategicHammerWon);
  strategyHammerUses+=p.hammerUsed;
  strategyFallbacks+=p.fallbackSwaps;
  if(i%20===19){
   const a=strategy.probes.slice(i-19,i+1),c=strategy.chapters[Math.floor(i/20)];
   requireValid(c.chapter===Math.floor(i/20)+1&&c.attempts===20&&
    c.greedyWins===a.filter(x=>x.greedyWon).length&&
    c.strategicWins===a.filter(x=>x.strategicWon).length&&
    c.strategicHammerWins===a.filter(x=>x.strategicHammerWon).length&&
    c.hammerUsed===a.reduce((n,x)=>n+x.hammerUsed,0)&&
    c.fallbackSwaps===a.reduce((n,x)=>n+x.fallbackSwaps,0),
    'objective-aware chapter aggregation mismatch');
  }
 }
 requireValid(strategy.greedyWins===pairedGreedyWins&&strategyWins===strategy.strategicWins&&
  strategyHammerWins===strategy.strategicHammerWins&&
  strategyHammerUses===strategy.hammerUsed&&strategyFallbacks===strategy.fallbackSwaps&&
  pairedGreedyWins===pairedBaselineWins,
  'objective-aware comparison totals mismatch');
 const failureCauses=reviewFailureAnalysis(bot.failureAnalysis,strategy);
 // Contiguous zero-win stretches prioritize review, NOT proof of level impossibility.
 const streaks=[];
 for(let i=0;i<entries.length;){
  if(entries[i].wins!==0){i++;continue;}
  const start=i;
  while(i<entries.length&&entries[i].wins===0)i++;
  const span=entries.slice(start,i);
  streaks.push({start:start+1,end:i,count:i-start,
   hazards:span.reduce((sum,x)=>sum+x.hazardDetonations,0)});
 }
 streaks.sort((a,b)=>b.count-a.count||a.start-b.start);
 const openingPressure=chapters.filter(c=>c.averageOpenings<2);
 const summary={
  schema:1,kind:'NONBLOCKING_GREEDY_BOT_DIAGNOSTIC_NOT_PLAYER_WIN_RATE',
  limitations:'Two seeded no-booster, immediate-match greedy attempts per level. Does not measure human skill, optimal play, booster availability, purchase economics or solvability.',
  stages:1000,attempts:2000,botWins:wins,botWinPercent:wins/20,
  zeroWinStages:zeroWinLevels,hazardDetonations:hazards,transportEvents:transports,
  chapters,topZeroWinStreaks:streaks.slice(0,15),
  firstZeroWinStage:entries.find(x=>x.wins===0)?.level??null,
  lastBotWinStage:[...entries].reverse().find(x=>x.wins>0)?.level??null,
  lowOpeningChapters:openingPressure.map(x=>x.chapter),
  dailyAllowanceModel:'FRESH_LEVEL_SPECIFIC_24_HOUR_WALLET',
  failureCauses,
  objectiveAwareComparison:{attempts:strategy.attempts,greedyWins:pairedGreedyWins,
   objectiveAwareWins:strategyWins,objectiveAwareHammerWins:strategyHammerWins,
   actualHammerUses:strategyHammerUses,policyFallbackSwaps:strategyFallbacks,
   limitations:strategy.description,chapters:strategy.chapters},
  minimalBoosterComparison:{attempts:comparison.attempts,hammerUsed:hammerUses,
   baselineWins:pairedBaselineWins,assistedWins,
   maxHammersPerAttempt:1,comparisonsPerTenLevels:2,
   note:'Hypothetical emergency Hammer only, at most one in trial 0 every fifth level; no earned-inventory or purchasing model.',
   chapters:comparison.chapters},
  priorityStageSamples:[
   ...entries.filter(x=>x.wins===0&&x.level<=100).slice(0,12).map(x=>x.level),
   ...[500,600,700,800,900,1000]
  ].filter((x,i,a)=>a.indexOf(x)===i)
 };
 requireValid(wins<=2000&&zeroWinLevels<=1000&&chapters.reduce((s,x)=>s+x.botWins,0)===wins,'invalid aggregate results');
 return summary;
}
function markdown(r){
 let text='### Optional balance review — heuristic bot, not player win rate\n\n';
 text+='**'+r.botWins+' / '+r.attempts+' greedy-bot wins**; '+r.zeroWinStages+' / 1,000 stages had zero wins in two samples. No human-difficulty or solvability conclusion follows.\n\n';
 text+='| Chapter | Bot wins / 200 | Stages 0 / 2 | Opening swaps | Hazards | Review flag |\n|---|---:|---:|---:|---:|---|\n';
 for(const c of r.chapters)text+='| '+c.chapter+' | '+c.botWins+' | '+c.zeroWinStages+' | '+c.averageOpenings+' | '+c.hazardDetonations+' | '+c.reviewFlag+' |\n';
 text+='\nLongest zero-win streaks: '+r.topZeroWinStreaks.slice(0,4).map(x=>x.start+'–'+x.end+' ('+x.count+' levels)').join(', ')+'.\n';
 text+='\n**Daily allowance:** Each simulated level starts with its own full, level-specific 24-hour move wallet. Real move debits, fuse penalties and earned refunds are applied; no unused moves carry between attempts.\n';
 text+='\n**Sparse booster comparison:** '+r.minimalBoosterComparison.attempts+
 ' same-seed rescue attempts; '+r.minimalBoosterComparison.hammerUsed+
 ' emergency Hammers actually used (maximum one on every fifth level, only when 1–2 moves remain). '+
 'No-booster matched-seed wins: '+r.minimalBoosterComparison.baselineWins+
 '; emergency-Hammer wins: '+r.minimalBoosterComparison.assistedWins+'.\n';
 text+='\n**Objective-aware paired simulation:** '+r.objectiveAwareComparison.attempts+
 ' fresh-daily-wallet same-seed attempts; greedy '+r.objectiveAwareComparison.greedyWins+
 ', objective-aware '+r.objectiveAwareComparison.objectiveAwareWins+
 ', objective-aware with at most one emergency Hammer '+
 r.objectiveAwareComparison.objectiveAwareHammerWins+
 ' wins; actual Hammers '+r.objectiveAwareComparison.actualHammerUses+
 '; scoring-swap policy fallbacks '+r.objectiveAwareComparison.policyFallbackSwaps+'.\n\n';
 text+='| Chapter | Greedy / 20 | Goal-aware / 20 | Goal-aware + Hammer / 20 | Hammers used | Fallbacks |\n|---|---:|---:|---:|---:|---:|\n';
 for(const c of r.objectiveAwareComparison.chapters)
  text+='| '+c.chapter+' | '+c.greedyWins+' | '+c.strategicWins+
   ' | '+c.strategicHammerWins+' | '+c.hammerUsed+' | '+c.fallbackSwaps+' |\n';
 text+='\nThis second player ranks single-turn objective progress, specials and expiring hazards; it is **not** a multi-turn solver or a measure of human skill.\n';
 text+=markdownFailureAnalysis(r.failureCauses);
 text+='\n**Interpretation:** The full 2,000-attempt baseline never uses boosters. The sparse, optional rescue probe uses a hypothetical single Hammer only; no purchase, earned stock, or real player progression is simulated. Flags are requests for further playtesting, not automatic balance changes. Findings remain **report-only** and cannot block Android, Fire OS, Windows or Linux builds.\n';
 return text;
}
if(require.main===module){
 try{
  const [, ,structuralPath,botPath,jsonPath]=process.argv;
  requireValid(structuralPath&&botPath&&jsonPath,'usage: balance-risk-report.js structural.json greedy.json review.json');
  const r=review(JSON.parse(fs.readFileSync(structuralPath,'utf8')),JSON.parse(fs.readFileSync(botPath,'utf8')));
  fs.writeFileSync(jsonPath,JSON.stringify(r,null,2)+'\n');
  const summary=markdown(r);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
  process.stdout.write(summary);
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={review,markdown};
