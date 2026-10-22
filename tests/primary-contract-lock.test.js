/* Canonical Nutbuster mechanics + artwork regression gate.
   Run: node tests/primary-contract-lock.test.js
   This is intentionally independent of test runners and any network/SDK.
   CSV additions are allowed; changes to HARD identities require updating the contract
   and explicitly reviewing the corresponding invariants. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
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
 const columns=records.shift(),needed=['contract_id','domain','stable_id','image_path','git_blob_sha','lock','state'];
 for(const key of needed)assert(columns.includes(key),'Missing CSV column '+key);
 return records.map((row,i)=>{
  assert.equal(row.length,columns.length,'Wrong CSV column count on row '+(i+2));
  return Object.fromEntries(columns.map((name,j)=>[name,row[j]]));
 });
}
function gitBlobHash(bytes){
 const h=crypto.createHash('sha1');h.update('blob '+bytes.length+'\0');h.update(bytes);return h.digest('hex');
}
const rows=parseCSV(get('docs/contracts/nutbuster-primary-mechanics-and-asset-lock.csv'));
assert(rows.length>=320,'Canonical contract unexpectedly truncated');
const byId=new Map(rows.map(r=>[r.contract_id,r]));
assert.equal(byId.size,rows.length,'Duplicate contract ID');
const row=id=>{const item=byId.get(id);assert(item,'Missing contract '+id);return item;};
const all=rows.filter(r=>r.image_path&&r.state!=='PENDING_IMPORT');
for(const rec of all){
 assert(!path.isAbsolute(rec.image_path),'Absolute image path '+rec.contract_id);
 const f=path.join(root,rec.image_path);
 assert(fs.existsSync(f),'Missing canonical art '+rec.image_path+' ('+rec.contract_id+')');
 assert.equal(gitBlobHash(fs.readFileSync(f)),rec.git_blob_sha,
  'Changed/reassigned protected art '+rec.contract_id+': '+rec.image_path);
}
const hard=(id,stable,saveKey,img)=>{
 const rec=row(id);
 assert.equal(rec.stable_id,stable,'Immutable ID changed at '+id);
 assert.equal(rec.code_or_save_identity,saveKey,'Immutable save binding changed at '+id);
 assert.equal(rec.image_path,img,'Immutable image binding changed at '+id);
 assert.equal(rec.lock,'HARD','Hard lock lost at '+id);
};
hard('P-003','golden-nuts','saved.coins','web/art/primary/economy/golden-nuts.png');
hard('P-004','gems','saved.gems','web/art/additions/economy/prismatic-acorn.png');
hard('P-005','shells','saved.shells','web/art/additions/economy/shell-coins.png');
hard('P-006','nutvale-dollars','saved.nutravaganza.dollars','');
hard('P-010','play-wallet','play-wallet','web/art/primary/economy/golden-nuts.png');
hard('P-011','play-gems','play-gems','web/art/additions/economy/prismatic-acorn.png');
hard('P-024','no-early-ordinary-rainbow','special:rainbow','web/art/primary/nuts/rainbow-nut.png');
hard('P-025','gold-acorn-distinction','TYPES:gold-acorn','web/art/primary/nuts/gold-acorn.png');
const game=get('web/game.js'),html=get('web/index.html'),engine=get('web/engine.js');
const fishing=get('web/fishing.js'),progress=get('web/progression.js');
assert(game.includes("const key='nutbuster.v1'"),'Save namespace changed');
assert(game.includes('coins:250,gems:25,shells:0'),'Starter currency keys changed');
assert(game.includes('gain(500,10)'),'Per-level Golden Nuts + Gems win grant missing');
assert(game.includes("['wallet',saved.coins]")&&game.includes("['gems',saved.gems]"),'Header wallet bindings changed');
assert(game.includes("['play-wallet',saved.coins]")&&game.includes("['play-gems',saved.gems]"),'In-level wallet bindings changed');
assert(html.includes('id="wallet"')&&html.includes('id="gems"'),'Header currency counters changed');
assert(html.includes('art/primary/economy/golden-nuts.png')&&html.includes('art/additions/economy/prismatic-acorn.png'),
 'Header currency images changed');
assert(game.includes('TOTAL DUE')&&game.includes('$0.00')&&game.includes('COMPLETE ORDER · FREE'),
 'Free final parody checkout changed');
assert(fishing.includes('n.dollars='),'Fishing dollars balance missing');
assert(!fishing.includes('save.coins=')&&!fishing.includes('save.gems='),'Fishing overwrites main balances');
const expectedNuts=['peanut','walnut','almond','cashew','hazelnut','pistachio','gold-acorn',
 'beechnut','brazil-nut','candlenut','chestnut','coconut','ginkgo-nut',
 'hickory-nut','macadamia','pecan','pili-nut','pine-nut','tiger-nut'];
const types=require('../web/engine.js').TYPES;
assert.deepEqual(types,expectedNuts,'Core nut roster identity or order changed');
const nutRows=rows.filter(r=>r.domain==='match-nut');
assert.equal(nutRows.length,expectedNuts.length,'Changed nut registry size');
for(const [i,name] of expectedNuts.entries()){
 const rec=row('NUT-'+String(i+1).padStart(2,'0'));
 assert.equal(rec.stable_id,name);
 assert.equal(rec.image_path,'web/art/primary/nuts/'+name+'.png');
}
const boosts=[
 ['hammer','art/primary/powerups/hammer.png'],['row','art/primary/powerups/row-clear.png'],
 ['column','art/additions/effects/vertical-clear.png'],['cross','art/additions/effects/horizontal-clear.png'],
 ['blast','art/primary/powerups/nut-burst.png'],['color','art/primary/powerups/rainbow.png'],
 ['shuffle','art/additions/effects/rainbow-pulse.png'],['extra','art/additions/economy/hourglass.png'],
 ['drill','art/additions/effects/rocket-impact.png'],['unlock','art/additions/effects/chain-break.png']
];
for(const [id,art] of boosts){
 const matches=rows.filter(r=>r.domain==='booster'&&r.stable_id===id);
 assert.equal(matches.length,1,'Booster lock missing '+id);
 assert.equal(matches[0].image_path,'web/'+art,'Booster icon mapping changed '+id);
 assert(game.includes(id+":'"+art+"'"),'Runtime icon mapping changed '+id);
}
const ladder=require('../web/progression.js').LADDER;
for(const item of ladder)assert(boosts.some(([id])=>id===item.id),'Unlocked booster not registered: '+item.id);
assert.equal(rows.filter(r=>r.domain==='avatar-outfit').length,60);
assert.equal(rows.filter(r=>r.domain==='homestead-tier').length,40);
assert.equal(rows.filter(r=>r.domain==='campaign-map').length,6);
assert.equal(rows.filter(r=>r.domain==='fake-ad-splash'&&r.state==='PENDING_IMPORT').length,8,
 'Do not mark generated but uncommitted fake ads as deployed');
assert(progress.includes('gems:15')&&progress.includes('gems:30'),'Gravity-hold gem costs changed');
assert(engine.includes("const NEW=['beechnut'"),'Expansion roster removed');
console.log('NUTBUSTER contract verified: '+rows.length+' entries; '+all.length+
 ' on-disk image hashes; primary Nuts and Gems; boosters; nuts; avatar and estate mapping; pending ad slots.');
