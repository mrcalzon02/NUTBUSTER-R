/* Functional contract only: IDs, save keys, economy, and gameplay mechanics.
   Artwork, sprite choice, CSS and pixel content are intentionally not tested here. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
function parseCSV(text){
 const records=[];let record=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){record.push(field);field='';}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&text[i+1]==='\n')i++;
   if(field.length||record.length){record.push(field);records.push(record);}
   record=[];field='';
  }else field+=c;
 }
 if(quoted)throw new Error('Unclosed CSV string');
 if(field.length||record.length){record.push(field);records.push(record);}
 const columns=records.shift(),required=['contract_id','domain','stable_id','code_or_save_identity','state'];
 for(const column of required)assert(columns.includes(column),'Missing contract column '+column);
 return records.map((values,i)=>{
  assert.equal(values.length,columns.length,'Malformed contract row '+(i+2));
  return Object.fromEntries(columns.map((name,j)=>[name,values[j]]));
 });
}
const records=parseCSV(get('docs/contracts/nutbuster-primary-mechanics-and-asset-lock.csv'));
assert(records.length>=320,'Gameplay contract catalog truncated');
const registry=new Map(records.map(r=>[r.contract_id,r]));
assert.equal(registry.size,records.length,'Duplicate functional contract ID');
const row=id=>{const rec=registry.get(id);assert(rec,'Missing contract '+id);return rec;};
function identity(id,stable,saveKey){
 const r=row(id);
 assert.equal(r.stable_id,stable,'Functional identifier changed at '+id);
 assert.equal(r.code_or_save_identity,saveKey,'Save binding changed at '+id);
}
identity('P-002','save.v1','localStorage:nutbuster.v1');
identity('P-003','golden-nuts','saved.coins');
identity('P-004','gems','saved.gems');
identity('P-005','shells','saved.shells');
identity('P-006','nutvale-dollars','saved.nutravaganza.dollars');
identity('P-008','header-wallet','wallet|gems');
identity('P-009','header-gems','gems');
identity('P-010','play-wallet','play-wallet');
identity('P-011','play-gems','play-gems');
assert.equal(row('P-032').stable_id,'locked-walnut-is-nut');
assert.equal(row('P-033').stable_id,'tile-status-layer');
assert.equal(row('P-034').state,'PLANNED','Unimplemented elemental chains cannot be reported as playable');
const game=get('web/game.js'),engine=get('web/engine.js'),fishing=get('web/fishing.js');
assert(game.includes("const key='nutbuster.v1'"),'Persistent save namespace must remain stable');
assert(game.includes('coins:250,gems:25,shells:0'),'Starter wallet data changed');
assert(game.includes('gain(500,10)'),'Level-clear rewards missing');
assert(game.includes("['wallet',saved.coins]")&&game.includes("['gems',saved.gems]"),'Header wallet values disconnected');
assert(game.includes("['play-wallet',saved.coins]")&&game.includes("['play-gems',saved.gems]"),'In-level wallet values disconnected');
assert(game.includes('TOTAL DUE')&&game.includes('$0.00')&&game.includes('COMPLETE ORDER · FREE'),'Free checkout behavior changed');
assert(fishing.includes('n.dollars='),'Fishing balance must exist');
assert(!fishing.includes('save.coins=')&&!fishing.includes('save.gems='),'Fishing cannot overwrite primary currency balances');
const E=require('../web/engine.js'),P=require('../web/progression.js');
const expectedNuts=['peanut','walnut','almond','cashew','hazelnut','pistachio','gold-acorn',
 'beechnut','brazil-nut','candlenut','chestnut','coconut','ginkgo-nut',
 'hickory-nut','macadamia','pecan','pili-nut','pine-nut','tiger-nut'];
assert.deepEqual(E.TYPES,expectedNuts,'Playable nut identities/order changed');
assert.equal(records.filter(r=>r.domain==='match-nut').length,expectedNuts.length);
for(const [i,name] of expectedNuts.entries())identity('NUT-'+String(i+1).padStart(2,'0'),name,row('NUT-'+String(i+1).padStart(2,'0')).code_or_save_identity);
for(const tool of P.LADDER){
 assert.ok(E.BOOSTERS.includes(tool.id),'Unlocked booster has no engine operation: '+tool.id);
 assert.ok(P.LEVEL_BY_TOOL[tool.id]===tool.level,'Booster progression level changed '+tool.id);
}
for(const [id,saveKey,cost,drops] of [
 ['butter_hold','holdInventory.butter_hold',15,1],
 ['jam_hold','holdInventory.jam_hold',30,2]
]){
 const rec=records.find(r=>r.domain==='gravity-hold'&&r.stable_id===id);
 assert.ok(rec,'Missing hold contract '+id);
 assert.equal(rec.code_or_save_identity,saveKey,'Hold save identity changed '+id);
 assert.equal(P.HOLD_ITEMS[id].gems,cost,'Hold purchase cost changed '+id);
 assert.equal(P.HOLD_ITEMS[id].drops,drops,'Hold functional duration changed '+id);
}
assert(engine.includes("const NEW=['beechnut'"),'Progression roster missing');
console.log('PASS: functional IDs, save compatibility, money isolation, engine roster, boosters, hold behavior');
