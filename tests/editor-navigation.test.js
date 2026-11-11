'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../web/engine.js'),P=require('../web/progression.js');
const source=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
function boot(store){
 let html='',listeners={},windowEvents={},documentEvents={},nextTimer=0,now=0,recoveryWritable=true;
 const timers=new Map(),recoveryKey='nutbuster.custom-level.recovery.v1';
 const screen={classList:{toggle(){}},addEventListener:(k,fn)=>listeners[k]=fn,
  set innerHTML(s){html=s;},get innerHTML(){return html;},querySelectorAll:()=>[],querySelector:()=>null};
 const toast={textContent:'',classList:{add(){},remove(){}}};
 const document={visibilityState:'visible',getElementById:k=>k==='screen'?screen:k==='toast'?toast:null,
  querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(k,fn)=>documentEvents[k]=fn};
 const localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{
  if(k===recoveryKey&&!recoveryWritable)throw new Error('simulated WebView quota/storage failure');
  store[k]=v;
 },removeItem:k=>{delete store[k];}};
 const window={NutEngine:E,NutProgress:P,NutDailyMoves:require('../web/daily-moves.js'),
  NutBenefits:require('../web/benefits.js'),NutElementalChallenges:require('../web/elemental-challenges.js'),
  NutElementalRewards:require('../web/elemental-rewards.js'),NutCampaignMaps:require('../web/campaign-maps.js'),
  NutHomestead:require('../web/homestead.js'),NutAvatarArt:require('../web/avatar-art.js'),
  NutPurchases:require('../web/purchase-disclosures.js'),addEventListener:(k,fn)=>windowEvents[k]=fn};
 const setTimeout=(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;};
 const clearTimeout=id=>timers.delete(id);
 vm.runInNewContext(source,{window,document,localStorage,console,setTimeout,clearTimeout});
 return {
  app:window.NutbusterApp,html:()=>html,click:dataset=>listeners.click({target:{closest:()=>({dataset})}}),
  advance(ms){
   const end=now+ms;
   while(true){
    let due=null;
    for(const [id,timer] of timers)if(timer.at<=end&&(!due||timer.at<due.timer.at))due={id,timer};
    if(!due)break;
    now=due.timer.at;timers.delete(due.id);due.timer.fn();
   }
   now=end;
  },
  background(){document.visibilityState='hidden';documentEvents.visibilitychange?.();},
  pagehide(){windowEvents.pagehide?.();},
  recoveryWritable(value){recoveryWritable=value;}
 };
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
assert.equal(app.app.getState().editorUndo.length,1);
assert.match(app.html(),/data-action="editor-undo"/);
app.click({action:'editor-undo'});
assert.equal(g.cells[i].type,before,'Undo restores the actual nut');
assert.equal(app.app.getState().editorRedo.length,1);
app.click({action:'editor-redo'});
assert.equal(g.cells[i].type,next,'Redo repaints the actual nut');
app.click({action:'editor-undo'});
app.click({cell:String(i)});
assert.equal(g.cells[i].type,next,'repaint after Undo works');
assert.equal(app.app.getState().editorRedo.length,0,'new paint invalidates Redo');
app.click({action:'editor-redo'});
assert.equal(g.cells[i].type,next,'invalidated Redo cannot alter draft');
app.click({action:'editor-undo'});app.click({action:'editor-redo'});
assert.equal(g.cells[i].type,next);
app.click({cell:String(i)});
assert.equal(app.app.getState().editorUndo.length,1,'no-op paint must not create a history entry');
assert.equal(app.app.getSave().hearts,hearts);
assert.equal(JSON.stringify(app.app.getSave()),save);
app.click({action:'editor-back'});assert.equal(app.app.getState().page,'home');
app.click({nav:'editor'});assert.equal(app.app.getState().editor.cells[i].type,next);
const draftKey='nutbuster.custom-level.draft.v1';
assert.equal(store[draftKey],undefined,'painting must not silently overwrite a saved draft');
const recoveryKey='nutbuster.custom-level.recovery.v1';
app.advance(899);
assert.equal(store[recoveryKey],undefined,'debounce must not save before 900ms');
app.advance(1);
assert.equal(JSON.parse(store[recoveryKey]).tiles[i],next,'painted nut must autosave after idle');
assert.equal(app.app.getState().editorStatus,'AUTOSAVED V1 DRAFT');
assert.equal(store[draftKey],undefined,'autosave must not overwrite explicit SAVE DRAFT');
const campaignBytes=store['nutbuster.v1'];
app.click({action:'editor-save'});
assert.ok(store[draftKey],'explicit save must write an independent local draft');
assert.equal(store[recoveryKey],undefined,'explicit Save clears superseded recovery');
const valid=JSON.parse(store[draftKey]);
assert.equal(valid.version,1);
assert.equal(valid.width,g.cfg.width);assert.equal(valid.height,g.cfg.height);
assert.equal(valid.tiles[i],next);
assert.equal(store['nutbuster.v1'],campaignBytes,'campaign bytes must be untouched');
const draftOnDisk=store[draftKey];
app.click({action:'editor-select',type:String(before)});
app.click({cell:String(i)});
assert.equal(app.app.getState().editor.cells[i].type,before);
app.advance(900);
assert.equal(JSON.parse(store[recoveryKey]).tiles[i],before,'new paint autosaves a separate working copy');
app.click({action:'editor-load'});
assert.equal(store[recoveryKey],undefined,'manual Reload discards superseded recovery');
assert.equal(app.app.getState().editor.cells[i].type,next,'load should restore real painted cells');
assert.equal(app.app.getState().editorUndo.length,0,'successful reload clears obsolete Undo history');
assert.equal(app.app.getState().editorRedo.length,0,'successful reload clears obsolete Redo history');
app.click({action:'editor-undo'});
assert.equal(app.app.getState().editor.cells[i].type,next,'reloaded draft cannot be undone into stale state');
const restart=boot(store);assert.equal(P.hasLevelEditor(restart.app.getSave()),true);
restart.app.nav('editor');assert.equal(restart.app.getState().page,'editor');
assert.equal(restart.app.getState().editor.cells[i].type,next,'saved draft must reopen after a process restart');
assert.equal(restart.app.getSave().unlocked,1000);
assert.equal(restart.app.getSave().stars[1000],1);
assert.equal(restart.app.getSave().hearts,hearts);
const wrong=[
 [{...valid,version:2},/UNSUPPORTED DRAFT FORMAT/],
 [{...valid,width:9},/INVALID BOARD DIMENSIONS/],
 [{...valid,tiles:valid.tiles.slice(1)},/INVALID TILE COUNT/],
 [{...valid,tiles:valid.tiles.map(()=>null)},/VOID-ONLY BOARD/],
 [{...valid,tiles:valid.tiles.map((t,j)=>j===i?12:t)},/INVALID NUT OR VOID MASK/],
 [{...valid,tiles:valid.tiles.map((t,j)=>j===i?100:t)},/INVALID NUT OR VOID MASK/]
];
for(const [payload,warning] of wrong){
 store[draftKey]=JSON.stringify(payload);
 restart.click({action:'editor-load'});
 assert.match(restart.html(),warning,'user must see the specific rejected draft reason');
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
// Validated autosave recovery across restart, exit, page lifecycle, corruption and failed writes.
const autosaveStore={'nutbuster.v1':JSON.stringify({unlocked:1000,stars:{1000:1}})};
const automatic=boot(autosaveStore);automatic.app.nav('editor');
const autoIndex=automatic.app.getState().editor.cells.findIndex(Boolean);
const oldType=automatic.app.getState().editor.cells[autoIndex].type,newType=oldType===0?1:0;
const originalCampaign=autosaveStore['nutbuster.v1'];
automatic.click({action:'editor-select',type:String(newType)});automatic.click({cell:String(autoIndex)});
automatic.advance(900);
assert.equal(JSON.parse(autosaveStore[recoveryKey]).tiles[autoIndex],newType);
assert.equal(autosaveStore[draftKey],undefined,'autosave must not invent explicit manual save');
assert.equal(autosaveStore['nutbuster.v1'],originalCampaign,'autosave cannot alter campaign');
const recovered=boot(autosaveStore);recovered.app.nav('editor');
assert.equal(recovered.app.getState().editor.cells[autoIndex].type,newType,'relaunch must recover idle edits');
assert.equal(recovered.app.getState().editorStatus,'AUTOSAVED V1 DRAFT RECOVERED');
assert.equal(recovered.app.getState().editorUndo.length,0,'recovery starts fresh undo history');
const exitStore={'nutbuster.v1':originalCampaign},exitApp=boot(exitStore);exitApp.app.nav('editor');
exitApp.click({action:'editor-select',type:String(newType)});exitApp.click({cell:String(autoIndex)});
exitApp.click({action:'editor-back'});
assert.equal(JSON.parse(exitStore[recoveryKey]).tiles[autoIndex],newType,'editor exit flushes before 900ms');
const backgroundStore={'nutbuster.v1':originalCampaign},backgroundApp=boot(backgroundStore);
backgroundApp.app.nav('editor');backgroundApp.click({action:'editor-select',type:String(newType)});
backgroundApp.click({cell:String(autoIndex)});backgroundApp.background();
assert.equal(JSON.parse(backgroundStore[recoveryKey]).tiles[autoIndex],newType,'WebView background flushes');
const hideStore={'nutbuster.v1':originalCampaign},hideApp=boot(hideStore);
hideApp.app.nav('editor');hideApp.click({action:'editor-select',type:String(newType)});
hideApp.click({cell:String(autoIndex)});hideApp.pagehide();
assert.equal(JSON.parse(hideStore[recoveryKey]).tiles[autoIndex],newType,'pagehide flushes');
const failureStore={'nutbuster.v1':originalCampaign},failed=boot(failureStore);
failed.app.nav('editor');failed.recoveryWritable(false);
failed.click({action:'editor-select',type:String(newType)});failed.click({cell:String(autoIndex)});
failed.advance(900);
assert.match(failed.app.getState().editorStatus,/AUTOSAVE FAILED/);
assert.equal(failureStore[recoveryKey],undefined,'failed write cannot be reported as durable');
failed.recoveryWritable(true);failed.advance(4000);
assert.equal(JSON.parse(failureStore[recoveryKey]).tiles[autoIndex],newType,'bounded retry preserves edits');
const corruptedStore={'nutbuster.v1':originalCampaign,[draftKey]:draftOnDisk,[recoveryKey]:'{broken'};
const corrupted=boot(corruptedStore);corrupted.app.nav('editor');
assert.equal(corrupted.app.getState().editor.cells[i].type,next,'corrupt recovery falls back to manual save');
assert.match(corrupted.app.getState().editorStatus,/AUTO-RECOVERY DRAFT REJECTED/);
assert.equal(corruptedStore[draftKey],draftOnDisk,'corrupt recovery never destroys manual save');
assert.equal(corruptedStore['nutbuster.v1'],originalCampaign);
// Run a valid authored board through the real engine and return mid-cascade without side effects.
const playStore={'nutbuster.v1':JSON.stringify({unlocked:1000,stars:{1000:1}})};
const play=boot(playStore);play.click({nav:'editor'});
const authored=play.app.getState().editor,startTiles=authored.cells.map(c=>c?.type??null);
const savedBefore=JSON.stringify(play.app.getSave()),campaignBefore=playStore['nutbuster.v1'];
play.click({action:'editor-play'});
assert.equal(play.app.getState().page,'game');
assert.equal(play.app.getState().editorPlay,true);
assert.match(play.html(),/LOCAL DRAFT · NO CAMPAIGN REWARDS/);
assert.match(play.html(),/Custom draft playtest board/);
assert.doesNotMatch(play.html(),/data-nav="shop"/);
const trial=play.app.getState().game;
assert.notStrictEqual(trial,authored);
const initialMoves=trial.moves;
let pair=null;
for(let a=0;a<trial.cells.length&&!pair;++a)for(const b of [a+1,a+trial.cfg.width]){
 if(!E.adjacent(trial,a,b))continue;
 const probe=E.create(1,7919);
 probe.cells.forEach((cell,i)=>{if(cell)cell.type=trial.cells[i].type;});
 const move=E.swap(probe,a,b);
 if(move.valid&&move.removed>0){pair=[a,b];break;}
}
assert.ok(pair,'real engine must find a scoring move');
play.click({cell:String(pair[0])});play.click({cell:String(pair[1])});
assert.ok(play.app.getState().game.moves<initialMoves,'playtest uses real turn mechanics');
assert.equal(JSON.stringify(play.app.getSave()),savedBefore);
assert.equal(playStore['nutbuster.v1'],campaignBefore);
play.click({action:'editor-return'}); // The exit button must work even mid-animation.
assert.equal(play.app.getState().page,'editor');
assert.deepEqual(play.app.getState().editor.cells.map(c=>c?.type??null),startTiles);
assert.equal(playStore['nutbuster.v1'],campaignBefore);
assert.equal(playStore['nutbuster.custom-level.draft.v1'],undefined);
play.click({action:'editor-play'});assert.equal(play.app.getState().page,'game');
play.click({action:'editor-return'});
const invalid=play.app.getState().editor,w=invalid.cfg.width;
let triple=-1;
for(let i=0;i<invalid.cells.length-2;++i)
 if(Math.floor(i/w)===Math.floor((i+2)/w)&&[i,i+1,i+2].every(j=>invalid.cells[j]&&!invalid.cells[j].ice&&!invalid.cells[j].lock&&!invalid.cells[j].chest))
  {triple=i;break;}
assert.ok(triple>=0);
for(let j=triple;j<triple+3;++j)invalid.cells[j].type=0;
play.click({action:'editor-play'});
assert.equal(play.app.getState().page,'editor','prematched draft must be rejected');
assert.match(play.html(),/DRAFT NOT PLAYABLE/);
assert.equal(playStore['nutbuster.v1'],campaignBefore);
play.click({action:'editor-save'});
assert.match(play.html(),/PLAYTEST NOT READY/,'invalid playable state may be saved as an editable draft, with a visible warning');
assert.ok(playStore[draftKey],'an unplayable draft must remain editable after save');
assert.equal(playStore['nutbuster.v1'],campaignBefore,'warning must not change official progress');
console.log('PASS Level Editor: entitlement, real paint, Undo/Redo, WebView idle/background/crash recovery, bounded storage retry, manual save isolation, invalid drafts, reversible engine playtest');
