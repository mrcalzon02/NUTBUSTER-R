const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../web/engine.js'),M=require('../web/campaign-maps.js');
let handlers={},html='';
const screen={addEventListener:(event,fn)=>handlers[event]=fn,set innerHTML(s){html=s;},get innerHTML(){return html;},querySelector:()=>null};
const wallet={textContent:''},gems={textContent:''},toast={textContent:'',classList:{add(){},remove(){}}};
const document={getElementById:id=>({screen,wallet,gems,toast}[id]||null),querySelectorAll:()=>[],querySelector:()=>null};
const storage={};const localStorage={getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v};
const window={NutEngine:E,NutProgress:require('../web/progression.js'),NutHomestead:require('../web/homestead.js'),NutCampaignMaps:M,NutBoardFeatures:require('../web/board-features.js'),addEventListener:()=>{},NutAudio:{unlock(){},grunt(){},voice(){},setVoiceEnabled(){},setMusicEnabled(){}}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../web/game.js'),'utf8'),{window,document,localStorage,setTimeout(){},clearTimeout(){},console});
const app=window.NutbusterApp;
app.nav('campaign');
assert.match(html,/THE GREAT NUT ODYSSEY/);
assert.equal((html.match(/data-chapter=/g)||[]).length,5);
for(let chapter=1;chapter<=5;chapter++){
 handlers.click({target:{closest:()=>({dataset:{chapter:String(chapter)}})}});
 assert.equal(app.getState().chapter,chapter);
 assert.equal((html.match(/class="map-node /g)||[]).length,100);
 assert.match(html,new RegExp('data-level="'+((chapter-1)*100+1)+'"'));
 assert.match(html,new RegExp('data-level="'+(chapter*100)+'"'));
 handlers.click({target:{closest:()=>({dataset:{action:'world-map'}})}});
 assert.equal((html.match(/data-chapter=/g)||[]).length,5);
}
app.start(500);assert.equal(app.getState().game.level,500);
app.nav('campaign');assert.equal(app.getState().chapter,5);
assert.equal((html.match(/class="map-node /g)||[]).length,100);
console.log('PASS: fullscreen five-chapter map interaction, each hundred-node overlay, play level 500, map back navigation');
