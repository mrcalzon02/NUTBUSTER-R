#!/usr/bin/env node
'use strict';
// Non-blocking assessment of the published campaign probes. Greedy bot outcomes
// are NOT human completion rates, proof of unfairness, or proof of impossibility.
const fs=require('node:fs');
function requireValid(ok,message){if(!ok)throw Error('Balance review: '+message);}
function integer(n){return Number.isInteger(n)&&n>=0;}
function review(structural,bot){
 requireValid(structural&&structural.campaignLevels===1000&&Array.isArray(structural.chapters)&&structural.chapters.length===10,'requires full 1,000-level structural audit');
 requireValid(bot&&bot.campaignLevels===1000&&bot.botTrials===2&&Array.isArray(bot.levels)&&bot.levels.length===1000&&Array.isArray(bot.chapters)&&bot.chapters.length===10,'requires full two-trial 1,000-level bot audit');
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
 text+='\n**Interpretation:** Bot is deliberately simplistic and never uses boosters. Flags are requests for further playtesting, not automatic balance changes. Findings remain **report-only** and cannot block Android, Fire OS, Windows or Linux builds.\n';
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
