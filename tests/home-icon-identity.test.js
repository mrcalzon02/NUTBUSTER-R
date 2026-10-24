'use strict';
// Diagnostic only: canonical home-screen icon identities must not silently become emoji or shuffled art.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const E=require('../web/engine.js');
let html='';
const screen={addEventListener(){},set innerHTML(s){html=s;},get innerHTML(){return html;}};
const elems={screen,wallet:{textContent:''},gems:{textContent:''},toast:{textContent:'',classList:{add(){},remove(){}}}};
const document={getElementById:id=>elems[id]||null,querySelectorAll:()=>[],querySelector:()=>null};
const store={},localStorage={getItem:k=>store[k],setItem:(k,v)=>{store[k]=v;}};
const window={
 NutDailyMoves:require('../web/daily-moves.js'),
 NutElementalChallenges:require('../web/elemental-challenges.js'),
 NutElementalRewards:require('../web/elemental-rewards.js'),
 NutEngine:E,NutBenefits:require('../web/benefits.js'),
 NutPurchases:require('../web/purchase-disclosures.js'),
 NutProgress:require('../web/progression.js'),
 NutHomestead:require('../web/homestead.js'),
 NutAvatarArt:require('../web/avatar-art.js'),
 NutCampaignMaps:require('../web/campaign-maps.js'),
 addEventListener(){},
 NutAudio:{unlock(){},voice(){},grunt(){},setMusicEnabled(){},setVoiceEnabled(){}}
};
const game=fs.readFileSync(path.join(root,'web/game.js'),'utf8');
const css=fs.readFileSync(path.join(root,'web/style.css'),'utf8');
assert.match(game,/const HOME_MENU_ICON_ART=Object\.freeze\(/,'Home image identities should remain explicit and frozen');
assert.match(css,/\.home-privilege-icon\{[^}]*width:48px;height:48px;[^}]*object-fit:contain/,'Reward icons must stay visible and uncropped');
vm.runInNewContext(game,{window,document,localStorage,console,setTimeout:()=>1,clearTimeout(){}});
assert.match(html,/Your entirely unnecessary privileges/,'Expected the rendered home screen');
const buttons=[...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(m=>m[0]);
const checks=[
 ['data-action="play"','PLAY NOW','art/additions/ui/play.png'],
 ['data-nav="campaign"','LEVEL MAP','art/additions/ui/campaign-map.png'],
 ['data-nav="homestead"','NUTVALE HOMESTEAD','art/homestead/tier-01.webp'],
 ['data-nav="companions"','WOODLAND COMPANIONS','art/companions/portrait/squirrel.png'],
 ['data-nav="mines"','NUTVALE MINES','art/nutvale/mining-tools/pickaxes/holly-star.png'],
 ['data-nav="wharf"','NUTVALE WHARF','art/wharf/nutvale-valley-wharf-hub.webp'],
 ['data-nav="codex"','NUT INDEX','art/additions/ui/help.png'],
 ['data-action="invite"','INVITE FRIENDS','art/additions/economy/friends-gift.png'],
 ['data-nav="shop"','SHOP','art/additions/economy/shell-coins.png'],
 ['data-nav="settings"','SETTINGS','art/additions/ui/settings.png'],
 ['data-action="sound"','Voice On','art/additions/ui/sound-on.png'],
 ['data-action="music"','Music On','art/additions/ui/music-on.png'],
 ['data-action="effects"','Effects On','art/additions/effects/sparkle-burst.png']
];
const assets=new Set();
for(const [selector,label,asset] of checks){
 const button=buttons.find(b=>b.includes(selector)&&b.includes(label));
 assert(button,'Missing home control '+selector+' '+label);
 assert(button.includes('src="'+asset+'"'),'Wrong or missing illustrated icon for '+label+': '+button);
 assert(!/[🏡📖↗🔊🔇♫]/u.test(button),'Emoji replacement on '+label);
 assets.add(asset);
}
const rewards=html.slice(html.indexOf('Your entirely unnecessary privileges'),html.indexOf('FEATURED NUT EMPORIUM OFFERS'));
for(const asset of ['art/additions/ui/life.png','art/additions/ui/vip-crown.png','art/additions/ui/gift.png']){
 assert(rewards.includes('class="home-privilege-icon" src="'+asset+'"'),'Missing approved reward art '+asset);
 assets.add(asset);
}
assert.doesNotMatch(rewards,/<span class="icon">(?:❤️|👑|🎁)<\/span>/u,'Emoji reward stand-ins have returned');
for(const file of ['art/additions/ui/sound-off.png','art/additions/ui/music-off.png']){
 assert(game.includes("'"+file+"'"),'Missing OFF-state illustration '+file);
 assets.add(file);
}
const protectedFiles=require('../assets/recovery/original-non-nut/live-replacements.json').mapping;
for(const asset of assets){
 const filename=path.join(root,'web',asset),bytes=fs.readFileSync(filename);
 assert(bytes.length>512,'Missing or empty illustrated icon '+asset);
 if(asset.endsWith('.png'))assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a',asset+' PNG signature');
 if(asset.endsWith('.webp')){assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
 if(asset.startsWith('art/additions/ui/')||asset.startsWith('art/additions/economy/'))
  assert(protectedFiles['web/'+asset],'Home button uses unprotected substitute artwork: '+asset);
}
console.log('PASS: every main-menu button and privilege card renders its fixed source illustration; ON/OFF assets exist; no emoji stand-ins');
