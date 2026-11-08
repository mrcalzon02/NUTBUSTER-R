'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../web/engine.js'),P=require('../web/progression.js');
const source=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
function boot(store){
 let html='',listeners={};
 const screen={classList:{toggle(){}},addEventListener:(k,fn)=>listeners[k]=fn,
  set innerHTML(s){html=s;},get innerHTML(){return html;},querySelectorAll:()=>[],querySelector:()=>null};
 const toast={textContent:'',classList:{add(){},remove(){}}};
 const document={getElementById:k=>k==='screen'?screen:k==='toast'?toast:null,querySelectorAll:()=>[],querySelector:()=>null};
 const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;}};
 const window={NutEngine:E,NutProgress:P,NutDailyMoves:require('../web/daily-moves.js'),
  NutBenefits:require('../web/benefits.js'),NutElementalChallenges:require('../web/elemental-challenges.js'),
  NutElementalRewards:require('../web/elemental-rewards.js'),NutCampaignMaps:require('../web/campaign-maps.js'),
  NutHomestead:require('../web/homestead.js'),NutAvatarArt:require('../web/avatar-art.js'),
  NutPurchases:require('../web/purchase-disclosures.js'),addEventListener(){}};
 vm.runInNewContext(source,{window,document,localStorage,console,setTimeout:()=>1,clearTimeout:()=>{}});
 return {app:window.NutbusterApp,html:()=>html,click:dataset=>listeners.click({target:{closest:()=>({dataset})}})};
}
const locked=boot({});
assert.match(locked.html(),/LEVEL EDITOR · CLEAR 1000 TO UNLOCK/);
assert.match(locked.html(),/data-nav="editor" disabled/);
locked.app.nav('editor');
assert.equal(locked.app.getState().page,'home');
assert.equal(locked.app.getState().editor,null);
const reached=boot({'nutbuster.v1':JSON.stringify({unlocked:1000,stars:{999:3}})});
reached.click({nav:'editor'});assert.equal(reached.app.getState().page,'home');
const store={'nutbuster.v1':JSON.stringify({unlocked:1000,stars:{1000:1}})};
const app=boot(store);assert.equal(P.hasLevelEditor(app.app.getSave()),true);
const save=JSON.stringify(app.app.getSave()),hearts=app.app.getSave().hearts;
app.click({nav:'editor'});assert.equal(app.app.getState().page,'editor');
assert.match(app.html(),/Editable Nutbuster board/);
assert.match(app.html(),/art\/primary\/nuts\/peanut.png/);
const g=app.app.getState().editor,i=g.cells.findIndex(x=>x!==null);
assert.ok(i>=0);
const before=g.cells[i].type,next=before===0?1:0;
app.click({action:'editor-select',type:String(next)});app.click({cell:String(i)});
assert.equal(g.cells[i].type,next);
assert.equal(app.app.getSave().hearts,hearts);
assert.equal(JSON.stringify(app.app.getSave()),save);
app.click({action:'editor-back'});assert.equal(app.app.getState().page,'home');
app.click({nav:'editor'});assert.equal(app.app.getState().editor.cells[i].type,next);
const draftKey='nutbuster.custom-level.draft.v1';
assert.equal(store[draftKey],undefined,'painting must not silently overwrite a saved draft');
const campaignBytes=store['nutbuster.v1'];
app.click({action:'editor-save'});
assert.ok(store[draftKey],'explicit save must write an independent local draft');
const valid=JSON.parse(store[draftKey]);
assert.equal(valid.version,1);
assert.equal(valid.width,g.cfg.width);assert.equal(valid.height,g.cfg.height);
assert.equal(valid.tiles[i],next);
assert.equal(store['nutbuster.v1'],campaignBytes,'campaign bytes must be untouched');
const draftOnDisk=store[draftKey];
app.click({action:'editor-select',type:String(before)});
app.click({cell:String(i)});
assert.equal(app.app.getState().editor.cells[i].type,before);
app.click({action:'editor-load'});
assert.equal(app.app.getState().editor.cells[i].type,next,'load should restore real painted cells');
const restart=boot(store);assert.equal(P.hasLevelEditor(restart.app.getSave()),true);
restart.app.nav('editor');assert.equal(restart.app.getState().page,'editor');
assert.equal(restart.app.getState().editor.cells[i].type,next,'saved draft must reopen after a process restart');
assert.equal(restart.app.getSave().unlocked,1000);
assert.equal(restart.app.getSave().stars[1000],1);
assert.equal(restart.app.getSave().hearts,hearts);
const wrong=[
 {...valid,version:2},
 {...valid,width:9},
 {...valid,tiles:valid.tiles.slice(1)},
 {...valid,tiles:valid.tiles.map((t,j)=>j===i?12:t)},
 {...valid,tiles:valid.tiles.map((t,j)=>j===i?100:t)}
];
for(const payload of wrong){
 store[draftKey]=JSON.stringify(payload);
 restart.click({action:'editor-load'});
 assert.equal(restart.app.getState().editor.cells[i].type,next,'invalid draft cannot destroy current work');
 const badBoot=boot(store);badBoot.app.nav('editor');
 assert.equal(badBoot.app.getState().editor.cells[i].type,before,'invalid draft must be isolated after restart');
}
store[draftKey]='{truncated';
restart.click({action:'editor-load'});
assert.equal(restart.app.getState().editor.cells[i].type,next);
store[draftKey]=draftOnDisk;
const lockedWithDraft=boot({...store,'nutbuster.v1':JSON.stringify({unlocked:1,stars:{}})});
lockedWithDraft.app.nav('editor');
assert.equal(lockedWithDraft.app.getState().page,'home');
assert.equal(lockedWithDraft.app.getState().editor,null);
assert.equal(store[draftKey],draftOnDisk,'corruption probes must not alter the saved draft');
console.log('PASS Level Editor: entitlement, real paint, V1 save/reload/restart, corruption isolation, campaign separation');
