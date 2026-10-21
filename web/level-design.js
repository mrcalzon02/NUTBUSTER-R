/* NUTBUSTER level design book. No DOM, randomness, or painted level markers.
   Explicit lessons teach booster purpose; all 500 levels retain deterministic seeds. */
(function(root){'use strict';
const ACTS=[
 'Morning in the Meadows','Crackling Creek','Acorn Orchard','Bramble Trail',
 'Sweet Shell Hollow','Sapling Switchbacks','Buttercup Crossing',
 'Squirrel Lookout','Harvest Hollow','The Great Canopy'
];
const CHAPTERS=['Nutwood Meadows','Peanut Butter Factory','Squirrel Hoard Highlands','Autumn Windmill Vale','Moonlit Golden Palace'];
// These are lessons, not purchases. The listed tool is earned on CLEAR of its milestone.
// The next challenge demonstrates why the newly earned tool is helpful, but never required.
const LESSONS=Object.freeze({
 1:{name:'The First Crack',kind:'score',hint:'Match three nuts; a Hammer can rescue a stubborn square.'},
 3:{name:'First Frost',kind:'ice',target:2,ice:2,formation:'cluster',hint:'Matches crack ice one layer at a time.'},
 5:{name:'One More Turn',kind:'score',hint:'Complete this stage to earn your first Extra Moves supply.'},
 6:{name:'A Little Breathing Room',kind:'ice',target:3,ice:3,formation:'cluster',hint:'Extra Moves can finish a nearly completed objective.'},
 10:{name:'Rocket Graduation',kind:'ice',target:4,ice:4,formation:'row',hint:'Clear this stage to earn the Row Rocket.'},
 11:{name:'Across the Clearing',kind:'ice',target:4,ice:4,formation:'row',hint:'A Row Rocket reaches a whole band of ice.'},
 18:{name:'A Tangled Supply',kind:'collect',target:5,hint:'Clear this stage to earn Shuffle.'},
 19:{name:'Fresh Arrangement',kind:'collect',target:6,hint:'Shuffle is useful when the available matches miss your target color.'},
 26:{name:'Vertical Thinking',kind:'ice',target:4,ice:4,formation:'column',hint:'Clear this stage to earn the Column Rocket.'},
 27:{name:'The Narrow Shaft',kind:'ice',target:4,ice:5,formation:'column',hint:'A Column Rocket reaches blockers deep in a narrow shaft.'},
 37:{name:'Cluster Control',kind:'ice',target:5,ice:5,formation:'cluster',hint:'Clear this stage to earn the Shell Bomb.'},
 38:{name:'Shell Shock',kind:'ice',target:5,ice:6,formation:'cluster',hint:'The Shell Bomb is particularly good against tightly packed blockers.'},
 49:{name:'The Crossroads',kind:'locks',target:3,locks:4,formation:'cross',hint:'Clear this stage to earn Crossfire.'},
 50:{name:'Two Roads Collide',kind:'locks',target:4,locks:5,formation:'cross',hint:'Crossfire strikes a row and a column at once.'},
 62:{name:'Seeing in Color',kind:'collect',target:8,hint:'Clear this stage to earn Color Pop.'},
 63:{name:'Color Harvest',kind:'collect',target:9,hint:'Color Pop hunts one chosen nut type across isolated board sections.'},
 77:{name:'Deep Below',kind:'chests',target:4,chests:5,formation:'column',hint:'Clear this stage to earn the Deep Drill.'},
 78:{name:'The Chest Shaft',kind:'chests',target:5,chests:5,formation:'column',hint:'The Deep Drill can strike several layers in one column.'},
 92:{name:'Locked Vault',kind:'locks',target:5,locks:7,formation:'scatter',hint:'Clear this stage to earn the Master Key.'},
 93:{name:'Unlock the Hoard',kind:'locks',target:6,locks:8,formation:'scatter',hint:'The Master Key removes locks throughout the board.'},
 100:{name:'The Great Meadow Finale',kind:'dual',hint:'Combine color collection with lock removal to complete the first campaign.'},
 110:{name:'Sticky Situation',kind:'jam',jam:3,target:3,formation:'cluster',hint:'Peanut butter spreads. Clear sticky layers before they multiply.'},
 111:{name:'The Butter Trap',kind:'jam',jam:4,target:4,formation:'cluster',hint:'A Shell Bomb or Hammer can remove concentrated peanut butter quickly.'},
 210:{name:'Ticking Acorns',kind:'collect',bombs:2,formation:'scatter',hint:'Timed acorns detonate after several moves unless you clear their cells.'},
 211:{name:'Five Seconds to Nuts',kind:'collect',bombs:3,formation:'cross',hint:'Precision tools defuse countdown acorns before they steal your moves.'},
 125:{name:'Conveyor Initiation',kind:'collect',hint:'A conveyor rotates nuts after every second turn; blockers stay in place.'},
 126:{name:'Production Rotation',kind:'ice',hint:'Try a Row Rocket before the belt rearranges your nuts.'},
 164:{name:'Portal Puzzles',kind:'collect',hint:'Portal cells exchange nuts every three turns.'},
 165:{name:'Through the Nut Gate',kind:'locks',hint:'Portals transport nuts; the chain locks stay attached to their cells.'}
});
const FORMATIONS=['scatter','row','column','cluster','cross'];
function profile(level){
 const n=Math.max(1,Math.min(500,Math.trunc(Number(level))||1));
 const chapter=Math.floor((n-1)/100)+1,local=(n-1)%100+1;
 const act=Math.floor((local-1)/10),beat=(local-1)%10;
 const lesson=LESSONS[n]||null;
 // Chapter 1 alternates goal families by deliberately scheduled learning bands.
 // Chapters 2+ remix the known systems, with stacked objectives after level 200.
 let kind='score';
 if(chapter===1){
  if(n<=5)kind=n===3?'ice':'score';
  else if(n<=18)kind=beat%3===0?'score':'ice';
  else if(n<=27)kind=beat%3===0?'ice':'collect';
  else if(n<=48)kind=beat%4===0?'collect':beat%2===0?'locks':'ice';
  else if(n<=67)kind=beat%4===0?'score':beat%2===0?'locks':'collect';
  else if(n<=91)kind=beat%4===0?'chests':beat%2===0?'collect':'locks';
  else kind=beat%3===0?'dual':beat%2===0?'locks':'chests';
 }else{
  const mix=['score','ice','collect','locks','chests'];
  kind=mix[(n+Math.floor(n/20))%mix.length];
  if(chapter===2&&local>=10&&(beat%3===1||local%7===0))kind='jam';
  if(chapter>=3&&local%7===2)kind='jam';
  if(n>200&&n%5===0)kind='dual';
 }
 const formation=lesson?.formation||FORMATIONS[(act+beat+chapter)%FORMATIONS.length];
 // Brief tutorial stages are forgiving; pressure increases during campaign 2,
 // then deliberately exceeds the fairness ceiling from chapter 3 onward.
 const moveAdjustment=n<=10?4:n<=30?2:n<=100?1:n<=200?0:-Math.min(4,Math.floor((n-201)/75)+1);
 return Object.freeze({
  id:n,chapter,local,act:act+1,beat:beat+1,
  name:lesson?.name||ACTS[act]+' · '+['Trail','Clearing','Crossing','Hollow','Challenge','Switchback','Cache','Scramble','Vault','Finale'][beat],
  hint:lesson?.hint||(
   kind==='jam'?'Clear sticky peanut butter before it spreads to more tiles.':
   kind==='ice'?'Break the layered frost before your moves run out.':
   kind==='locks'?'Unlock trapped nuts to free the route.':
   kind==='chests'?'Open every required chest layer to claim the hoard.':
   kind==='collect'?'Collect the named nut color; aim moves at your objective.':
   kind==='dual'?'Both counters must be completed, not just your score.':
   'Make matches and build cascades to reach the score goal.'
  ),kind:lesson?.kind||kind,formation,lesson:!!lesson,
  objectiveTarget:lesson?.target||null,
  ice:lesson?.ice??null,locks:lesson?.locks??null,chests:lesson?.chests??null,
  jam:lesson?.jam??null,bombs:lesson?.bombs??null,
  moveAdjustment
 });
}
const api={ACTS,CHAPTERS,LESSONS,FORMATIONS,profile};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutLevelDesign=api;
})(typeof window!=='undefined'?window:globalThis);
