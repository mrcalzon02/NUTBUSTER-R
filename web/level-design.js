/* NUTBUSTER level design book. No DOM, randomness, or painted level markers.
   Explicit lessons teach booster purpose; all 500 levels retain deterministic seeds. */
(function(root){'use strict';
const CHAPTER_ACTS=[
 [
  'Morning in the Meadows','Crackling Creek','Acorn Orchard','Bramble Trail',
  'Sweet Shell Hollow','Sapling Switchbacks','Buttercup Crossing',
  'Squirrel Lookout','Harvest Hollow','The Great Canopy'
 ],
 [
  'Receiving Bay','Roasting Floor','Grinding Hall','Mixing Line','Jarworks',
  'Conveyor Annex','Quality Control','Packing Floor','Shipping Deck','Executive Vatroom'
 ],
 [
  'Foothill Cache','Granite Switchbacks','Buried Pantry','Acorn Watch','Hoarder Pass',
  'Chestbreaker Ridge','Fusefield','Cliffside Vaults','Crown Cache','Summit Hoard'
 ],
 [
  'Copperleaf Road','Millrace Crossing','Gale Orchard','Sailhouse Row','Harvest Gusts',
  'Cider Switchbacks','Turbine Fields','Storm Barns','Twilight Millworks','Maelstrom Hill'
 ],
 [
  'Lantern Causeway','Mooncourt','Gilded Gallery','Royal Vaultwalk','Silver Gardens',
  'Portal Court','Crown Hall','Midnight Treasury','Throne Approaches','Golden Apex'
 ],
 ['Lantern Jetty','Pebble Crescent','Moonlit Pier','Mistwater Grove','Fishermans Causeway','Starfall Inlet','Reedbank Locks','Mirrorwater Grotto','Midnight Wharf','Lunar Headland'],
 ['Seaweed Stair','Clamshell Terrace','Reef of Lanterns','Tideglass Bridges','Coral Switchbacks','Pearl Gate','Sunken Court','Nautilus Arch','Trident Pass','Shell Throne'],
 ['Broken Jetty','Palmwatch','Brigantine Reach','Ropebridge Gauntlet','Corsair Cove','Powder Deck','Stormtide Narrows','Black Sail Fort','Thunder Reef','Stormbreaker Keep'],
 ['Glowvent Approach','Gearreef Station','Pressure Gate','Coral Boilerworks','Tidal Turbines','Amber Condensers','Brasslight Crossing','Deepwheel Control','Blackwater Foundry','Abyssal Core'],
 ['Broken Crown Causeway','Moonpearl Bastion','Trench Cathedral','Abyss Observatory','Colossus Gate','Crowned Current','Starless Vault','Tidemaw Crossing','Imperial Shelldome','Leviathan Throne']
];
const ACTS=CHAPTER_ACTS[0];
const CHAPTERS=['Nutwood Meadows','Peanut Butter Factory','Squirrel Hoard Highlands','Autumn Windmill Vale','Moonlit Golden Palace','Moonnut Lake Shores','Sunken Shell Kingdom','Stormbreaker Archipelago','The Abyssal Nutworks',"Leviathan's Crown"];
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
 84:{name:'The Hollow Chest Run',kind:'chests',target:4,chests:4,formation:'column',hint:'Chests can take repeated hits. Drill a route down one column before the last moves disappear.'},
 99:{name:'The Canopy Gate',kind:'dual',secondaryKind:'locks',secondaryTarget:3,locks:5,formation:'cross',hint:'The chapter finale is next. Collect the quota and crack the gate locks in the same run.'},
 100:{name:'The Great Meadow Finale',kind:'dual',hint:'Combine color collection with lock removal to complete the first campaign.'},
 101:{name:'Receiving Bay Orientation',kind:'collect',target:5,formation:'row',hint:'The Factory introduces a new nut type. Watch the collection color before clearing the conveyor floor.'},
 110:{name:'Sticky Situation',kind:'jam',jam:3,target:3,formation:'cluster',hint:'Peanut butter spreads. Clear sticky layers before they multiply.'},
 111:{name:'The Butter Trap',kind:'jam',jam:4,target:4,formation:'cluster',hint:'A Shell Bomb or Hammer can remove concentrated peanut butter quickly.'},
 210:{name:'Ticking Acorns',kind:'collect',bombs:2,formation:'scatter',hint:'Timed acorns detonate after several moves unless you clear their cells.'},
 211:{name:'Five Seconds to Nuts',kind:'collect',bombs:3,formation:'cross',hint:'Precision tools defuse countdown acorns before they steal your moves.'},
 116:{name:'Spreading Spread',kind:'jam',target:3,jam:4,formation:'cluster',hint:'Peanut butter sticks to tiles and can spread. Attack the source before clearing distant matches.'},
 125:{name:'Conveyor Initiation',kind:'collect',hint:'A conveyor rotates nuts after every second turn; blockers stay in place.'},
 126:{name:'Production Rotation',kind:'ice',hint:'Try a Row Rocket before the belt rearranges your nuts.'},
 139:{name:'Assembly Belt Frost',kind:'ice',target:6,ice:7,formation:'row',hint:'The conveyor shifts nuts but not the ice. Break the fixed frozen row before the belt cycles again.'},
 151:{name:'Sticky Shipping Quota',kind:'dual',secondaryKind:'jam',secondaryTarget:5,jam:6,formation:'row',hint:'Collect the shipment and remove the butter. The conveyor changes your matches, not your goals.'},
 164:{name:'Portal Puzzles',kind:'collect',hint:'Portal cells exchange nuts every three turns.'},
 165:{name:'Through the Nut Gate',kind:'locks',hint:'Portals transport nuts; the chain locks stay attached to their cells.'},
 175:{name:'Portal Assembly Line',kind:'dual',secondaryKind:'locks',secondaryTarget:6,locks:7,formation:'cross',hint:'Conveyors and portals move nut payloads while chained cells stay fixed. Plan for both systems.'},
 177:{name:'Portal Lockdown',kind:'locks',target:6,locks:8,formation:'scatter',hint:'Portals swap nut payloads across the floor; lock layers stay put. Strike the pinned lock tiles.'},
 190:{name:'Butter on the Belt',kind:'jam',jam:7,target:7,formation:'row',hint:'Clear the sticky line before peanut butter spreads and the conveyor shifts your setup.'},
 199:{name:'Factory Final Inspection',kind:'dual',secondaryKind:'jam',secondaryTarget:7,jam:9,formation:'cross',hint:'Last inspection: meet the color quota while cleaning the central spread before the Factory finale.'},
 200:{name:'Factory Shutdown',kind:'dual',secondaryKind:'jam',secondaryTarget:8,jam:8,formation:'cross',hint:'Factory finale: collect the quota and scrub the butter while belts and portals keep moving the floor.'},
 201:{name:'The Highland Arrival',kind:'collect',target:7,formation:'scatter',hint:'The Highlands introduce another nut type. Start with the new color before chasing treasure.'},
 218:{name:'Locked Countdown',kind:'dual',secondaryKind:'locks',secondaryTarget:5,locks:7,bombs:2,formation:'cross',hint:'Keep the collection and lock counters moving while timed acorns threaten the route.'},
 225:{name:'Fuse in the Hoard',kind:'dual',secondaryKind:'locks',secondaryTarget:6,locks:8,bombs:3,formation:'scatter',hint:'Timed acorns force a route through the locked hoard. Precision tools buy breathing room.'},
 240:{name:'Frozen Fuse Corridor',kind:'ice',target:8,ice:10,bombs:3,formation:'column',hint:'Ice blocks the route to the acorns. Break the vertical barrier without losing the countdown.'},
 250:{name:'Treasury Countdown',kind:'dual',secondaryKind:'chests',secondaryTarget:8,chests:7,bombs:4,formation:'column',hint:'Open the treasury while countdown acorns punish wasted moves.'},
 275:{name:'Buried Fuse Vaults',kind:'dual',secondaryKind:'chests',secondaryTarget:8,chests:8,bombs:4,formation:'column',hint:'Open layered chests and collect the color quota before multiple fuses run out.'},
 300:{name:'Highlands Last Stand',kind:'dual',secondaryKind:'chests',secondaryTarget:10,chests:8,bombs:5,formation:'cross',hint:'Highlands finale: crack the hoard under maximum timed-acorn pressure before your move budget collapses.'},
 301:{name:'Windmill Welcome',kind:'collect',hint:'Wind tunnels move nuts vertically every second turn. Arrows show the next gust.'},
 302:{name:'The Returning Gale',kind:'ice',hint:'Wind reverses after each gust. Ice stays in place while nuts ride the air.'},
 312:{name:'Locked Millrace',kind:'locks',target:7,locks:9,formation:'column',hint:'Wind can move nuts past a fixed lock column. The locks only yield when their tiles are struck.'},
 320:{name:'The Crosswind Challenge',kind:'dual',hint:'A gust can set up a cascade or spoil your carefully planned matches.'},
 330:{name:'Crosswind Frostline',kind:'dual',secondaryKind:'ice',secondaryTarget:9,ice:11,formation:'row',hint:'Collect the color and strip horizontal ice while alternating gusts rebuild your setup.'},
 350:{name:'Gale-Locked Gallery',kind:'dual',secondaryKind:'locks',secondaryTarget:8,locks:10,formation:'cross',hint:'Break the locked gallery while the wind keeps moving the nuts you meant to use.'},
 360:{name:'Butter in the Turbine',kind:'jam',target:6,jam:8,formation:'cluster',hint:'The mill keeps turning even as peanut butter spreads. Clear the cluster before chasing side matches.'},
 375:{name:'Vaults in the Wind',kind:'dual',secondaryKind:'chests',secondaryTarget:10,chests:8,formation:'column',hint:'Open deep vaults while reversing gusts repeatedly rebuild the board around them.'},
 389:{name:'The Maelstrom Lockworks',kind:'dual',secondaryKind:'locks',secondaryTarget:9,locks:12,bombs:4,formation:'cross',hint:'Collect the quota while wind, locks and countdowns fight for your remaining turns.'},
 400:{name:'The Great Windmill Maelstrom',kind:'dual',secondaryKind:'locks',secondaryTarget:10,locks:12,bombs:4,formation:'cross',hint:'Windmill finale: conveyors, portals, gusts, locks and countdowns all compete for the same moves.'},
 401:{name:'The Royal Tempest',kind:'collect',hint:'The Golden Palace has two wind lanes, gusting every turn.'},
 402:{name:'Two Winds, No Mercy',kind:'dual',hint:'Two reversing wind lanes combine with conveyors, portals and blockers.'},
 410:{name:'Moonlit Vault Columns',kind:'chests',target:9,chests:8,formation:'column',hint:'Two wind lanes move nuts every turn, but the layered royal chests stay where they were placed.'},
 425:{name:'Palace Portal Court',kind:'dual',secondaryKind:'chests',secondaryTarget:10,chests:8,formation:'column',hint:'Two wind lanes and palace portals keep the route unstable while the vaults stay put.'},
 435:{name:'Gilded Butter Crisis',kind:'dual',secondaryKind:'jam',secondaryTarget:7,jam:9,formation:'cluster',hint:'Clean the palace spread and collect the quota while conveyors, portals and double wind lanes cycle.'},
 450:{name:'Royal Butterworks',kind:'dual',secondaryKind:'jam',secondaryTarget:8,jam:9,formation:'cluster',hint:'Scrub the royal peanut-butter spill while every turn rearranges the nuts around it.'},
 460:{name:'The Frosted Crown Hall',kind:'dual',secondaryKind:'ice',secondaryTarget:11,ice:14,formation:'cross',hint:'Break the reinforced ice while meeting the color quota across the two royal wind lanes.'},
 475:{name:'Crown Countdown',kind:'dual',secondaryKind:'locks',secondaryTarget:10,locks:12,bombs:5,formation:'scatter',hint:'Break the crown locks under the Palace’s fastest countdown pressure.'},
 490:{name:'Last Vault Before the Throne',kind:'dual',secondaryKind:'chests',secondaryTarget:12,chests:10,bombs:5,formation:'cross',hint:'The final vault demands color collection, layered chest damage and survival of five active fuses.'},

 // Earlier advanced boosters now have explicit unlock and immediately following practice lessons.
 120:{name:'Nutquake Graduation',kind:'ice',ice:9,formation:'cluster',hint:'Clear this stage to earn Nutquake, which strikes a five-by-five patch around a selected tile.'},
 121:{name:'The Wide Blast',kind:'ice',ice:10,formation:'cluster',hint:'Aim Nutquake at the center of a dense ice formation for maximum coverage.'},
 160:{name:'Triple Row Graduation',kind:'ice',ice:10,formation:'row',hint:'Clear this stage to earn Triple Row, striking the selected row and the two beside it.'},
 161:{name:'Three Belts Wide',kind:'ice',ice:11,formation:'row',hint:'Triple Row reaches adjacent frozen conveyor lanes in one activation.'},
 205:{name:'Triple Column Graduation',kind:'locks',locks:9,formation:'column',hint:'Clear this stage to earn Triple Column, which strikes three neighboring columns.'},
 206:{name:'Three Shafts Deep',kind:'locks',locks:10,formation:'column',hint:'A Triple Column can break three fixed vertical lock lanes despite moving nuts.'},
 260:{name:'Starburst Graduation',kind:'ice',ice:11,formation:'cross',hint:'Clear this stage to earn Starburst, striking both diagonals through a selected cell.'},
 261:{name:'The Diagonal Break',kind:'ice',ice:12,formation:'cross',hint:'Aim Starburst where diagonal ice barriers intersect.'},
 331:{name:'Spectrum Practice',kind:'collect',formation:'scatter',hint:'Spectrum hits the chosen nut color and the next color; watch the collection objective.'},
 420:{name:'Frostbreaker Graduation',kind:'ice',ice:15,formation:'scatter',hint:'Clear this stage to earn Frostbreaker, which strikes ice across the board.'},
 421:{name:'Across the Frozen Palace',kind:'ice',ice:16,formation:'scatter',hint:'Frostbreaker damages all ice layers, including separated pockets.'},
 500:{name:'The Final Nut',kind:'dual',secondaryKind:'chests',secondaryTarget:12,chests:8,jam:9,bombs:5,formation:'cross',hint:'Finale: finish the collection and open the royal vault while every late-game system is active.'},
 501:{name:'Moonnut Shore Landing',kind:'collect',hint:'The lake introduces the next journey: keep the collection moving while old hazards return.'},
 520:{name:'Frost on the Jetty',kind:'ice',ice:12,formation:'row',hint:'Reinforced ice blocks the lakeside causeway. Strike it before the moving nuts drift away.'},
 540:{name:'Mirrorwater Locks',kind:'locks',locks:12,formation:'column',hint:'Unlock the fixed lakeshore tiles while the wind changes the nut positions.'},
 560:{name:'Reedbank Treasury',kind:'dual',secondaryKind:'chests',chests:9,formation:'scatter',hint:'Collect nuts while cracking chests along the hidden lakeside path.'},
 580:{name:'Midnight Whirlpool',kind:'dual',secondaryKind:'ice',ice:14,formation:'cross',hint:'Break layered frost while conveyors, portals and wind challenge your remaining moves.'},
 600:{name:'Lake of a Thousand Stars',kind:'dual',secondaryKind:'chests',chests:10,formation:'cross',hint:'Lake finale: open the sunken cache and finish the collection before the last moves.'},
 601:{name:'Through the Seaweed Gate',kind:'locks',locks:12,formation:'column',hint:'Follow the kelp passages by breaking locks fixed to the reef.'},
 620:{name:'Pearl Reef Freeze',kind:'ice',ice:14,formation:'row',hint:'Coral corridors conceal layers of unbroken ice.'},
 640:{name:'The Nautilus Vault',kind:'dual',secondaryKind:'chests',chests:10,formation:'cluster',hint:'Collect the required color while breaking layered treasury shells.'},
 660:{name:'Coral Butter Bloom',kind:'jam',jam:9,formation:'cluster',hint:'Clear spreading butter patches before they fill the reef.'},
 680:{name:'Tideglass Crosswind',kind:'dual',secondaryKind:'locks',locks:13,formation:'cross',hint:'Fixed lock gates, shifting winds and portals all overlap in the tideglass pass.'},
 700:{name:'The Pearl Throne',kind:'dual',secondaryKind:'chests',chests:11,bombs:5,formation:'cross',hint:'Kingdom finale: break the royal shells while timed acorns demand careful planning.'},
 701:{name:'The Broken Gangplank',kind:'collect',bombs:3,formation:'scatter',hint:'Stormbreaker begins with a hazardous crossing under a running fuse clock.'},
 720:{name:'Ropebridge Lockdown',kind:'locks',locks:13,formation:'column',hint:'Crack the pirate fort locks while moving nuts cross the bridge.'},
 740:{name:'Black Sail Powder Run',kind:'dual',secondaryKind:'jam',jam:11,bombs:4,formation:'row',hint:'Collect the cargo before the powder deck hazards spread.'},
 760:{name:'Corsair Frosthold',kind:'ice',ice:16,formation:'cross',hint:'Blast the ice barricades guarding the pirate citadel.'},
 780:{name:'Thunder Reef Gauntlet',kind:'dual',secondaryKind:'locks',locks:14,bombs:5,formation:'scatter',hint:'The crossing mixes countdowns, chains and shifting wind lanes.'},
 800:{name:'Stormbreaker Last Stand',kind:'dual',secondaryKind:'chests',chests:12,bombs:6,formation:'cross',hint:'Archipelago finale: open the fortified treasure holds under full storm pressure.'},
 801:{name:'Pressure Gate One',kind:'ice',ice:16,formation:'column',hint:'Descend into the old Nutworks by clearing reinforced pressure seals.'},
 820:{name:'Clockwork Brine',kind:'dual',secondaryKind:'locks',locks:14,formation:'cross',hint:'Release the fixed machinery locks while the conveyors and wind lanes spin.'},
 840:{name:'Foundry Frostworks',kind:'ice',ice:17,formation:'row',hint:'Strip the cooling ice from the old underwater assembly line.'},
 860:{name:'Sealed Boiler Vault',kind:'dual',secondaryKind:'chests',chests:12,bombs:6,formation:'cluster',hint:'Break multiple chest layers while fuses threaten the pressure chamber.'},
 880:{name:'Abyssal Spillway',kind:'jam',jam:12,formation:'scatter',hint:'Remove spreading butter before the moving machinery carries the nuts away.'},
 900:{name:'Heart of the Nutworks',kind:'dual',secondaryKind:'locks',locks:15,bombs:7,formation:'cross',hint:'Nutworks finale: collect the output and crack the deep pressure locks.'},
 901:{name:'Leviathan Approach',kind:'dual',secondaryKind:'ice',ice:17,bombs:6,formation:'column',hint:'The final sea begins with a barrier of ancient frost and two furious wind lanes.'},
 920:{name:'Moonpearl Bastion',kind:'dual',secondaryKind:'chests',chests:12,formation:'cluster',hint:'Break the moonpearl treasury while securing the required nut color.'},
 940:{name:'Colossus Gate Chains',kind:'locks',locks:15,bombs:6,formation:'cross',hint:'Open the colossal fixed gates without wasting moves in the currents.'},
 960:{name:'Tidemaw Maelstrom',kind:'dual',secondaryKind:'jam',jam:12,bombs:6,formation:'scatter',hint:'Spreading tile hazards and fast currents compete for the last moves.'},
 980:{name:'Crown Chamber Frost',kind:'dual',secondaryKind:'ice',ice:18,bombs:7,formation:'cross',hint:'Break the toughest visible ice layers before the final throne.'},
 1000:{name:'The Leviathans Crown',kind:'dual',secondaryKind:'chests',chests:13,bombs:7,formation:'cross',hint:'Grand finale: complete the collection and break the crown treasury while every existing system is active.'}
});
const FORMATIONS=['scatter','row','column','cluster','cross'];
function profile(level){
 const n=Math.max(1,Math.min(1000,Math.trunc(Number(level))||1));
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
  name:lesson?.name||CHAPTER_ACTS[chapter-1][act]+' · '+['Trail','Clearing','Crossing','Hollow','Challenge','Switchback','Cache','Scramble','Vault','Finale'][beat],
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
  secondaryKind:lesson?.secondaryKind||null,secondaryTarget:lesson?.secondaryTarget??null,
  ice:lesson?.ice??null,locks:lesson?.locks??null,chests:lesson?.chests??null,
  jam:lesson?.jam??null,bombs:lesson?.bombs??null,
  moveAdjustment
 });
}
const api={ACTS,CHAPTER_ACTS,CHAPTERS,LESSONS,FORMATIONS,profile};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutLevelDesign=api;
})(typeof window!=='undefined'?window:globalThis);
