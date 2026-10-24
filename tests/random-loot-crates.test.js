'use strict';
// End-to-end randomized rewards: published odds, actual weighted rolls, save-only debits,
// permanent cosmetics, tank upgrades, and in-shop reveal after a confirmed purchase.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const P=require('../web/progression.js'),E=require('../web/engine.js'),F=require('../web/fishing.js');
const A=require('../web/avatar-art.js'),C=require('../web/loot-crates.js'),D=require('../web/daily-moves.js');
const B=require('../web/benefits.js'),Purchases=require('../web/purchase-disclosures.js');
const ROOT=path.resolve(__dirname,'..');
const names=Object.keys(C.CRATES);
assert.deepEqual(names,['acorn','royal','wharf','cosmetic','sampler','aquarium','festival','vault'],'Restore all original reward crates plus four new varieties');
const originals=['acorn','royal','wharf','cosmetic'];
for(const id of originals)assert.ok(names.includes(id),'Original crate removed: '+id);
function save(){const s={unlocked:1,stars:{},coins:20000,gems:100,hearts:4,vip:false};P.migrate(s);F.ensure(s);A.ensure(s);s.nutravaganza.dollars=10000;return s;}
for(const [id,crate] of Object.entries(C.CRATES)){
 assert.ok(fs.existsSync(path.join(ROOT,'web',crate.art)),'Sprite missing '+crate.art);
 const s=save(),info=C.odds(s,id);
 assert.equal(info.probabilityTotal,100,'The disclosed odds are exactly 100%: '+id);
 assert.equal(info.odds.length,crate.outcomes.length,'Never hide a possible outcome '+id);
 assert.ok(info.odds.every(item=>item.label&&item.percent>0),'All outcomes have readable odds '+id);
 const roll0=C.rngChoice(crate,0),roll1=C.rngChoice(crate,0.999999);
 assert.equal(roll0.id,crate.outcomes[0].id,'First weighted bucket '+id);
 assert.equal(roll1.id,crate.outcomes.at(-1).id,'Last weighted bucket '+id);
 assert.notEqual(roll0.id,roll1.id,'Every crate has distinct possible outcomes '+id);
 const balance=crate.currency==='dollars'?s.nutravaganza.dollars:s.coins;
 const first=C.open(s,id,()=>0),second=C.open(s,id,()=>0.999999);
 assert.equal(first.valid,true);assert.equal(second.valid,true);
 assert.equal(first.rolled,roll0.id);assert.equal(second.rolled,roll1.id);
 assert.equal(crate.currency==='dollars'?s.nutravaganza.dollars:s.coins,balance-2*crate.cost,'Exact debit, no duplicate billing '+id);
 assert.equal(s.crateHistory.length,2,'Exactly one saved roll record per opening '+id);
 assert.equal(s.crateHistory[0].outcome,roll0.id);
 assert.equal(s.crateHistory[1].outcome,roll1.id);
 assert.ok(first.rewards.length>=1);
 const insufficient=save();insufficient.coins=0;insufficient.nutravaganza.dollars=0;
 const pre=JSON.stringify(insufficient);let called=false;
 assert.equal(C.open(insufficient,id,()=>{called=true;return 0}).reason,'funds');
 assert.equal(called,false,'Never roll on failed payment '+id);
 assert.equal(JSON.stringify(insufficient),pre,'Failed purchase never changes the save '+id);
}
{
 const s=save(),before=s.coins;
 const preview=C.odds(s,'cosmetic');
 assert.equal(s.coins,before,'Reading odds must be free');
 const outcome=C.open(s,'cosmetic',()=>0);
 assert.equal(outcome.valid,true);assert.equal(A.owned(s,A.SEASONAL[0]),true,'Seasonal outfit must really unlock');
 assert.equal(s.homestead.lootCostumes[A.SEASONAL[0]],true);
 const duplicate=C.open(s,'cosmetic',()=>0);
 assert.match(duplicate.rewards[0].label,/600 Golden Nuts/);
 assert.equal(s.coins,before-2800+600,'Duplicate cosmetic compensates instead of silently discarding prize');
 const full=save();full.nutravaganza.tank=10;
 const tankIndex=C.CRATES.aquarium.outcomes.findIndex(x=>x.kind==='tank');
 const weightBefore=C.CRATES.aquarium.outcomes.slice(0,tankIndex).reduce((n,x)=>n+x.weight,0);
 const tank=C.open(full,'aquarium',()=>((weightBefore+1)/100));
 assert.equal(tank.rolled,'tank');assert.equal(full.nutravaganza.tank,10);
 assert.equal(tank.rewards[0].label,'N$800 (maximum upgrade compensation)');
 const noRng=save(),snap=JSON.stringify(noRng);
 assert.equal(C.open(noRng,'royal',()=>NaN).reason,'rng');
 assert.equal(JSON.stringify(noRng),snap,'Invalid RNG cannot debit currency or grant');
}
{
 const html=fs.readFileSync(path.join(ROOT,'web/index.html'),'utf8');
 assert.match(html,/<script src="avatar-art\.js"><\/script><script src="loot-crates\.js"><\/script>/,'Load crate engine after wardrobe and fishing dependencies');
 assert.ok(html.indexOf('loot-crates.js')<html.indexOf('purchase-disclosures.js'),'Crates must exist before disclosure and shop modules');
 const script=fs.readFileSync(path.join(ROOT,'web/game.js'),'utf8');
 const css=fs.readFileSync(path.join(ROOT,'web/style.css'),'utf8');
 assert.match(css,/\.random-crate-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'Compact two-column crate shelf');
 let markup='',clickHandler,store={},opens=0;
 const classes={add(){},remove(){},toggle(){}},wallet={textContent:''},gems={textContent:''},toast={textContent:'',classList:classes};
 const screen={classList:classes,addEventListener:(name,cb)=>{if(name==='click')clickHandler=cb;},
  get innerHTML(){return markup},set innerHTML(value){markup=value;},querySelector:()=>null,querySelectorAll:()=>[]};
 const document={getElementById:id=>({screen,app:{classList:classes},wallet,gems,toast})[id]||null,
  querySelector:()=>null,querySelectorAll:()=>[]};
 const fakeCrates={CRATES:C.CRATES,odds:C.odds,open(s,id){opens++;return C.open(s,id,()=>0.999999);}};
 const win={
  NutCrates:fakeCrates,NutFishing:F,NutAvatarArt:A,NutEngine:E,NutProgress:P,
  NutDailyMoves:D,NutBenefits:B,NutPurchases:Purchases,
  NutElementalRewards:require('../web/elemental-rewards.js'),
  NutElementalChallenges:require('../web/elemental-challenges.js'),
  NutHomestead:require('../web/homestead.js'),NutCampaignMaps:require('../web/campaign-maps.js'),
  addEventListener(){}
 };
 vm.runInNewContext(script,{window:win,document,localStorage:{getItem:k=>store[k]||null,setItem:(k,value)=>{store[k]=value;}},setTimeout:()=>0,clearTimeout(){},console});
 const app=win.NutbusterApp,play=app.getSave();
 play.coins=10000;play.nutravaganza.dollars=10000;
 app.nav('shop');
 assert.equal((markup.match(/data-action="crate-open"/g)||[]).length,8,'All eight random crates must appear');
 assert.match(markup,/RANDOM LOOT BUNDLES/);
 assert.match(markup,/SEE EXACT DROP CHANCES/);
 assert.match(markup,/Odds total 100%/,'Visible listing must explain normalized 100% odds');
 const click=data=>clickHandler({target:{closest:()=>({dataset:data})}});
 const before=play.coins,beforeRoyal=play.nutravaganza.baits.royal;
 click({action:'crate-open',crate:'acorn'});
 assert.equal(opens,0,'Showing odds never rolls a reward');
 assert.equal(play.coins,before,'Preview cannot debit balance');
 assert.match(markup,/GUARANTEED REWARDS \+ RANDOM DROP ODDS/);
 assert.match(markup,/ACTUAL DROP CHANCES/);
 click({action:'purchase-cancel'});
 assert.equal(opens,0,'Cancellation does not roll');
 assert.equal(play.coins,before);
 click({action:'crate-open',crate:'acorn'});
 click({action:'purchase-confirm'});
 assert.equal(opens,1,'Confirmation causes exactly one random roll');
 assert.equal(play.coins,before-C.CRATES.acorn.cost,'Exact cost debited after confirmation');
 assert.equal(play.nutravaganza.baits.royal,beforeRoyal+1,'Real reward must be written to existing fishing bait inventory');
 assert.equal(play.crateHistory.length,1);
 assert.equal(JSON.parse(store['nutbuster.v1']).crateHistory.length,1,'Roll is persisted before visual reveal');
 assert.equal(wallet.textContent,(before-C.CRATES.acorn.cost).toLocaleString(),'Wallet visibly reflects debit');
 assert.match(markup,/random-crate-reveal/,'Show won items without inventing a running transaction tally');
 assert.match(markup,/Royal Roe/);
 assert.match(markup,/BUY PACKAGE/,'Preserve all six original fixed-content fictional cash offers');
 click({action:'purchase-confirm'});
 assert.equal(opens,1,'Double-confirm cannot open a second crate');
}
console.log('PASS: eight disclosed weighted loot crates, one-roll purchase confirmation, actual rewards and saved results');
