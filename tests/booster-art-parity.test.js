'use strict';
// Non-blocking presentation contract: real packaged PNGs and matching game/shop art.
// Android and Fire OS share the WebView assets. Native SDL3 remains preview-partial.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const E=require('../web/engine.js');
const P=require('../web/progression.js');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const gameSource=read('web/game.js');
const css=read('web/style.css');
const ids=E.BOOSTERS;
// Audit the four genuine primary power-up crops by exact intended identity.
// Other mapped boosters may reuse owner-authored effects; do not invent a
// direct power-up crop where none has been approved.
const primaryIdentity=Object.freeze({
 hammer:'art/primary/powerups/hammer.png',
 row:'art/primary/powerups/row-clear.png',
 blast:'art/primary/powerups/nut-burst.png',
 color:'art/primary/powerups/rainbow.png'
});
for(const [id,sprite] of Object.entries(primaryIdentity))
 assert.equal(P.BOOSTER_ART[id],sprite,'Original primary power-up identity changed: '+id);
// Supplementary effects/economy sprites are tracked in an authored atlas
// manifest. A filename or valid PNG header alone does not prove the correct
// atlas crop was shipped. Verify the actual installed bytes against provenance.
const additionManifest=JSON.parse(read('web/art/additions/manifest.json'));
const additionByPath=new Map(Object.values(additionManifest.sprites).map(entry=>[entry.path,entry]));
assert.equal(ids.length,16,'All ten tactical and six advanced boosters must be represented');
assert.deepEqual(Object.keys(P.BOOSTER_ART).sort(),[...ids].sort(),'Art mapping must cover every actual booster ID, without orphans');
assert.doesNotMatch(gameSource,/BOOSTER_ICON_PATHS|data:image\/svg\+xml/,'Generic in-code vector icons must not return');
for(const id of ids){
 const sprite=P.BOOSTER_ART[id];
 assert.match(sprite,/^art\/[a-z0-9/_-]+\.png$/i,id+' must use a packaged relative PNG path');
 const file=path.resolve(root,'web',sprite);
 assert.ok(file.startsWith(path.join(root,'web')+path.sep),'Asset path escaped Android/Fire OS WebView root: '+id);
 const png=fs.readFileSync(file);
 assert.ok(png.length>=24,'Empty or truncated sprite: '+id);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Not a PNG: '+id);
 assert.ok(png.readUInt32BE(16)>0&&png.readUInt32BE(20)>0,'Invalid PNG dimensions: '+id);
 if(sprite.startsWith('art/additions/')){
  const record=additionByPath.get(sprite);
  assert.ok(record&&record.source&&Array.isArray(record.source_rect)&&record.sha256,
   'Missing source atlas crop provenance for '+id+': '+sprite);
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),record.sha256,
   'Packaged sprite no longer matches approved atlas crop for '+id+': '+sprite);
 }
}
const android=read('android/app/build.gradle');
assert.match(android,/assets\.srcDirs\s*=\s*\['\.\.\/\.\.\/web'\]/,'APK must package the exact web/ asset tree');
const parity=JSON.parse(read('config/platform-parity.json'));
assert.equal(parity.targets.fire_os.sameArtifactAs,'android','Fire OS must use the same packaged art');
assert.equal(parity.targets.windows.productionReady,false,'Native Windows artwork parity is not certified');
assert.equal(parity.targets.linux.productionReady,false,'Native Linux artwork parity is not certified');

let html='';
const noop=()=>{};
const screen={addEventListener:noop,set innerHTML(value){html=value;},get innerHTML(){return html;},
 querySelector:()=>null,querySelectorAll:()=>[],classList:{add:noop,remove:noop,contains:()=>false,toggle:noop}};
const elements={screen,wallet:{textContent:''},gems:{textContent:''},toast:{textContent:'',classList:{add:noop,remove:noop}}};
const document={getElementById:id=>elements[id]||null,querySelectorAll:()=>[],querySelector:()=>null};
const localStorage={getItem:()=>null,setItem:noop};
const window={NutDailyMoves:require('../web/daily-moves.js'),
 NutElementalChallenges:require('../web/elemental-challenges.js'),
 NutElementalRewards:require('../web/elemental-rewards.js'),
 NutEngine:E,NutBenefits:require('../web/benefits.js'),
 NutPurchases:require('../web/purchase-disclosures.js'),
 NutProgress:P,NutHomestead:require('../web/homestead.js'),
 NutAvatarArt:require('../web/avatar-art.js'),NutCampaignMaps:require('../web/campaign-maps.js'),
 addEventListener:noop};
vm.runInNewContext(gameSource,{window,document,localStorage,console,setTimeout:()=>1,clearTimeout:noop});
const app=window.NutbusterApp;
function assertArtwork(markup,id,location){
 const src=P.BOOSTER_ART[id];
 assert.ok(markup.includes('class="booster-picture"'),location+' missing shared authored picture: '+id);
 assert.ok(markup.includes('class="booster-icon" src="'+src+'"'),location+' has wrong art: '+id);
 if(P.BOOSTER_BADGES[id])assert.ok(markup.includes('class="booster-variant"'),location+' missing variant badge: '+id);
}
app.start(1);
let buttons=[...html.matchAll(/<button data-tool="([^"]+)"[\s\S]*?<\/button>/g)];
assert.deepEqual(buttons.map(m=>m[1]),ids,'Compact and advanced game controls must preserve all booster IDs/order');
for(const [i,m] of buttons.entries()){
 assertArtwork(m[0],ids[i],'game');
 assert.match(m[0],/data-stock/,'Inventory stock badge lost: '+ids[i]);
}
assert.equal((html.match(/data-hold-tool="/g)||[]).length,2,'Butter and Jam controls must remain alongside ten compact boosters');
assert.match(css,/#app\.playing \.game-active \.boosters\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/,
 'Ten compact boosters plus two hold powers require six columns');
assert.match(css,/grid-template-rows:repeat\(2,51px\)/,'Compact controls must retain two rows');
app.nav('shop');
const cards=[...html.matchAll(/<div class="nut-booster-offer">([\s\S]*?)<div class="booster-shop-prices">/g)];
assert.equal(cards.length,ids.length,'Shop must show every booster, including advanced variants');
for(const [i,m] of cards.entries()){
 assertArtwork(m[1],ids[i],'shop');
 assert.ok(m[1].includes(E.BOOSTER_META[ids[i]].label),'Shop label lost: '+ids[i]);
}
assert.doesNotMatch(html,/class="booster-shop-icon"/,'Shop must not bypass the shared picture/variant renderer');
assert.match(css,/\.nut-booster-offer \.booster-picture\{[^}]*width:40px;height:40px/,
 'Shop shared art requires a compact image container');
console.log('PASS: 16 installed PNGs, 10+2 compact controls, six advanced tools, 16 matching shop images and variant badges; Android/Fire OS source verified; native preview not certified');
