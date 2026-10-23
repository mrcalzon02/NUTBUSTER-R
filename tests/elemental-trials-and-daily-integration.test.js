'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js'),T=require('../web/elemental-challenges.js'),R=require('../web/elemental-rewards.js');
const D=require('../web/daily-moves.js'),P=require('../web/progression.js');
assert.equal(T.profile(1001).baseLevel,15);
assert.equal(T.profile(1300).baseLevel,999);
let starts=0,swaps=0;
for(let id=1;id<=1300;id++)for(const seed of [id*127+17,id*37+99]){
 const g=E.create(id,seed),cfg=g.cfg,w=cfg.width;starts++;
 assert.equal(g.level,id,'Level identity '+id);
 assert.equal(E.matches(g).hit.size,0,'Free initial match '+id);
 assert.ok(E.hasMove(g),'No legal opening '+id);
 if(id>1000){assert.ok(cfg.trial,'No trial profile '+id);assert.ok(g.cells.some(c=>c?.elemental===cfg.trial.element),'Elemental piece missing '+id);}
 const stock={ice:0,locks:0,chests:0,jam:0};
 for(const c of g.cells)if(c){stock.ice+=c.ice||0;stock.locks+=c.lock||0;stock.chests+=c.chest||0;stock.jam+=c.jam||0;}
 for(const o of cfg.objectives)if(o.kind in stock)assert.ok(o.target<=stock[o.kind],'Phantom quota '+id+' '+o.kind);
 let pair=null;
 for(let a=0;a<g.cells.length&&!pair;a++)for(const b of [a+1,a+w]){
  if(!E.adjacent(g,a,b))continue;
  const x=g.cells[a],y=g.cells[b],xt=x.type,yt=y.type;x.type=yt;y.type=xt;
  const hit=E.matches(g).hit.size;x.type=xt;y.type=yt;if(hit)pair=[a,b];
 }
 assert.ok(pair,'No scoring pair '+id);
 assert.ok(E.swap(g,...pair).valid,'Swap invalid '+id);
 assert.ok(g.cells.every(c=>!c||cfg.roster.includes(c.type)),'Unlocked or empty refill '+id);
 swaps++;
}
for(let i=0;i<15;i++){
 const id=1001+i*10,trial=T.profile(id),g=E.create(id,id*111+77);
 const target=g.cells.findIndex(c=>c?.elemental===trial.element);
 assert.ok(target>=0,'Unspawned '+trial.element);
 E.booster(g,'hammer',target);
 assert.ok(g.elementalActivations.includes(trial.element),'Elemental not activated '+trial.element);
 assert.equal(g.elementalQueue.length,0,'Reaction did not settle '+trial.element);
}
const clean=E.create(1,9876),charged=E.create(1,9876);charged.crystalCharge=2;
let pair=null;
for(let i=0;i<clean.cells.length&&!pair;i++)for(const j of [i+1,i+clean.cfg.width]){
 if(!E.adjacent(clean,i,j))continue;
 const a=clean.cells[i],b=clean.cells[j],x=a.type,y=b.type;a.type=y;b.type=x;
 const hit=E.matches(clean).hit.size;a.type=x;b.type=y;if(hit)pair=[i,j];
}
assert.ok(pair);E.swap(clean,...pair);E.swap(charged,...pair);
assert.equal(charged.score-clean.score,400,'Crystal charge not applied to the next score');
assert.equal(charged.crystalCharge,0);
const nature=E.create(1061,7610),natureAt=nature.cells.findIndex(c=>c?.elemental==='nature');
assert.ok(natureAt>=0);
const butterAt=nature.cells.findIndex((c,i)=>c&&i!==natureAt&&c.type!==null);
nature.cells[butterAt].jam=1;
E.booster(nature,'hammer',natureAt);
assert.ok(nature.elementalRefunds>=1,'Successful Nature wash must refund a move');
const largeTrial={unlocked:1000,stars:{},coins:4200000,gems:3500000};P.migrate(largeTrial);R.ensure(largeTrial);
const largeFirst=R.clear(largeTrial,1001,1200);
assert.ok(largeFirst.first);
assert.equal(largeTrial.coins,4200000+largeFirst.coins,'Trial reward must preserve high Golden Nut balance');
assert.equal(largeTrial.gems,3500000+largeFirst.gems,'Trial reward must preserve high Gem balance');
const save={unlocked:1000,stars:{},coins:0,gems:0};P.migrate(save);R.ensure(save);
for(let id=1001;id<=1300;id++){
 assert.ok(T.available(save,id),'Trial locked '+id);
 assert.equal(R.clear(save,id,10000).first,true);
 const before=JSON.stringify([save.coins,save.gems,save.boosterInventory,save.elementalRelics]);
 assert.equal(R.clear(save,id,10000).first,false);
 assert.equal(JSON.stringify([save.coins,save.gems,save.boosterInventory,save.elementalRelics]),before);
}
assert.equal(R.summary(save).completed,300);
assert.equal(R.summary(save).relics.length,15);
assert.deepEqual(save.stars,{},'Trials must not progress main campaign stars');
const first=new Date(2026,9,22,12).getTime(),next=new Date(2026,9,23,12).getTime();
const wallet={};assert.equal(D.left(wallet,first,36),36);
assert.equal(D.spend(wallet,12,first,36),true);
assert.equal(D.left(JSON.parse(JSON.stringify(wallet)),first,15),24,'Bank must persist across levels');
assert.equal(D.spend(wallet,25,first,36),false,'Daily overdraft');
assert.equal(D.topUp(wallet,5,first,36),29);
assert.equal(D.left(wallet,next,18),18);
assert.equal(D.left(wallet,first,36),18,'Clock rollback may not refill');
const fs=require('node:fs');
const ui=fs.readFileSync(require('node:path').join(__dirname,'../web/game.js'),'utf8');
assert.ok(ui.includes('D.spend(saved,used,Date.now(),dailyCap())'));
assert.ok(ui.includes('R.clear(saved,g.level,g.score)'));
assert.ok(ui.includes('D.topUp(saved,earnedRefunds,Date.now(),dailyCap())'));
console.log('PASS 2600 boards/swaps, 15 powers, crystal and nature, 300 one-time rewards, daily persistence and rollover');
