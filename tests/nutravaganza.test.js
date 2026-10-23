const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const F=require('../web/fishing.js'),U=require('../web/fishing-ui.js'),E=require('../web/engine.js');
const P=require('../web/progression.js'),H=require('../web/homestead.js'),A=require('../web/avatar-art.js'),M=require('../web/campaign-maps.js');
const day=new Date(2030,4,1,10).getTime(),tomorrow=new Date(2030,4,2,10).getTime();
const save={coins:4000,gems:25,unlocked:1,stars:{},boosterInventory:{hammer:3}};P.migrate(save);
F.ensure(save,day);assert.equal(save.nutravaganza.baits.worm,6);
F.ensure(save,day);assert.equal(save.nutravaganza.baits.worm,6);
F.ensure(save,tomorrow);assert.equal(save.nutravaganza.baits.worm,12);
F.ensure(save,day);assert.equal(save.nutravaganza.baits.worm,12,'Backward clock may not farm bait');
assert.equal(F.trade(save,'hammer',P,tomorrow).amount,2);
assert.equal(P.count(save,'hammer'),2);assert.equal(save.nutravaganza.baits.worm,14);
assert.equal(F.craft(save,'glitter',tomorrow).valid,false,'Bait quality is gated');
save.nutravaganza.dollars=5000;assert.equal(F.upgrade(save,'bait',tomorrow).valid,true);
assert.equal(F.craft(save,'glitter',tomorrow).valid,true);assert.equal(save.nutravaganza.baits.glitter,1);
const initial=save.nutravaganza.baits.worm;assert.equal(F.cast(save,'worm',123456,tomorrow).valid,true);
assert.equal(save.nutravaganza.baits.worm,initial-1);
assert.equal(F.cast(save,'worm',123457,tomorrow).valid,false,'Only one fight at a time');
assert.equal(F.step(save,'nonsense',tomorrow).valid,false);
let successes=0,failures=0;
for(let t=0;t<34&&save.nutravaganza.fight;t++){
 const f=save.nutravaganza.fight,act=f.tension>=60?'slack':Math.abs(f.hook-f.fish)<=18?'reel':f.hook>f.fish?'left':'right';
 F.step(save,act,tomorrow);
}
if(save.nutravaganza.pending)F.resolve(save,'sell',tomorrow);
for(let seed=0;seed<75;seed++){
 save.nutravaganza.baits.worm++;
 const start=F.cast(save,'worm',Math.imul(seed+11,9137)>>>0,tomorrow);
 assert.equal(start.valid,true);
 const mid=JSON.parse(JSON.stringify(save));
 assert.equal(mid.nutravaganza.fight.id,start.fish,'Fight survives JSON save');
 let result;
 for(let turn=0;turn<35&&save.nutravaganza.fight;turn++){
  const f=save.nutravaganza.fight,mode=f.tension>=60?'slack':Math.abs(f.hook-f.fish)<18?'reel':f.hook>f.fish?'left':'right';
  result=F.step(save,mode,tomorrow);
 }
 assert.ok(result&&['escaped','caught'].includes(result.status),'Encounter must terminate');
 if(result.status==='escaped')failures++;
 else{successes++;const value=save.nutravaganza.pending.value,dollars=save.nutravaganza.dollars;
  if(seed%2===0&&save.nutravaganza.fish.length<F.capacity(save.nutravaganza))assert.equal(F.resolve(save,'keep',tomorrow).valid,true);
  else{assert.equal(F.resolve(save,'sell',tomorrow).valid,true);assert.equal(save.nutravaganza.dollars,dollars+value);}
 }
}
assert.ok(successes>0&&failures>0,'Fish can be caught and can escape');
assert.ok(save.nutravaganza.fish.length>0,'Kept fish live in aquarium');
assert.equal(save.coins,4000);assert.equal(save.gems,25,'Fishing economy must be isolated');
const oldCapacity=F.capacity(save.nutravaganza);
assert.equal(F.upgrade(save,'tank',tomorrow).valid,true);assert.equal(F.capacity(save.nutravaganza),oldCapacity+3);
const view=U.wharf(save,{fishBait:'worm'},E,P),tank=U.aquarium(save);
const exchange=U.exchangeSheet(save,E,P,true);assert.match(exchange,/data-action="fish-trade" data-booster=/);assert.doesNotMatch(exchange,/data-action="fish-trade" data-tool=/);
assert.match(tank,/aquarium-fish/);
const sprites=JSON.parse(fs.readFileSync(path.join(__dirname,'../web/art/primary/nuts/expansion-v2-manifest.json')));
assert.equal(Object.keys(sprites.sprites).length,12);assert.equal(E.NEW.length,12);
const seen=new Set();for(let level=1;level<=500;level++){
 const roster=E.rosterForLevel(level),g=E.create(level,level*127+83);
 assert.equal(g.cfg.typeCount,roster.length);assert.equal(E.matches(g).hit.size,0);assert.ok(E.hasMove(g));
 assert.ok(g.cells.every(c=>!c||roster.includes(c.type)),'Wrong nut at stage '+level);
 assert.ok(g.cfg.objectives.every(o=>o.kind!=='collect'||roster.includes(o.color)));
 for(const id of roster)if(id>=7)seen.add(E.TYPES[id]);
}
assert.deepEqual([...seen].sort(),E.NEW.slice().sort(),'All 12 illustrated nuts must appear in real pools');
for(const name of E.NEW)assert.ok(fs.existsSync(path.join(__dirname,'../web/art/primary/nuts',name+'.png')),'Missing art '+name);
let html='',handlers={},local={};
const screen={classList:{toggle(){}},get innerHTML(){return html;},set innerHTML(s){html=s;},addEventListener:(id,fn)=>{handlers[id]=fn;},querySelector:()=>null,querySelectorAll:()=>[]};
const els={screen,app:{classList:{toggle(){}}},wallet:{textContent:''},gems:{textContent:''},toast:{textContent:'',classList:{add(){},remove(){}}}};
const document={getElementById:id=>els[id]||null,querySelectorAll:()=>[],querySelector:()=>null};
const window={NutDailyMoves:require('../web/daily-moves.js'),NutElementalChallenges:require('../web/elemental-challenges.js'),NutElementalRewards:require('../web/elemental-rewards.js'),NutEngine:E,NutProgress:P,NutHomestead:H,NutAvatarArt:A,NutCampaignMaps:M,NutFishing:F,NutFishingUI:U,addEventListener(){}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8'),{window,document,localStorage:{getItem:k=>local[k],setItem:(k,v)=>{local[k]=v;}},setTimeout:()=>1,clearTimeout(){},console});
const app=window.NutbusterApp,click=dataset=>handlers.click({target:{closest:()=>({dataset})}});
app.nav('homestead');assert.match(html,/data-nav="fishing"/);
app.nav('fishing');assert.match(html,/NUTVALE FISHING/);
app.nav('bait-shop');assert.match(html,/data-action="fish-trade"/);
const held=P.count(app.getSave(),'hammer');click({action:'fish-trade',booster:'hammer'});
assert.equal(P.count(app.getSave(),'hammer'),held-1,'Click delegation must honor bait exchange');
app.nav('fishing');click({action:'fish-cast'});assert.ok(app.getSave().nutravaganza.fight);assert.match(html,/LINE TENSION/);
app.nav('aquarium');assert.match(html,/NUTVALE AQUARIUM/);
app.nav('fishing');assert.match(html,/LINE TENSION/,'Navigating away does not discard active fish');
assert.ok(local['nutbuster.v1'],'New state persists in existing save');
console.log('PASS Nutravaganza: fishing, bait, economy, aquarium, 12 nut types and UI navigation');
