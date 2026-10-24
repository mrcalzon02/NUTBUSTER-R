'use strict';
// Regression for an owner-reported visibility failure in the installed Nutdex and board:
// do not cull a second hole from transparent status PNGs using CSS radial masks.
// Their existing authored RGBA, including partial translucency over underlying nuts,
// is the sole alpha source. No gameplay nut image is changed here.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const style=read('web/style.css'),game=read('web/game.js');
const codex=require('../web/nut-codex.js');
const manifest=JSON.parse(read('web/art/primary/overlays/manifest.json'));
assert.match(style,/\.cell \.hazard\.tile-status \.status-art\{[^}]*object-fit:contain/,'tile art should remain a full image above its nut');
assert.match(style,/\.codex-picture img\{[^}]*object-fit:contain/,'NUTDEX needs readable whole-image previews');
assert.doesNotMatch(style,/(?:-webkit-)?mask-image\s*:\s*radial-gradient\s*\(/,'a CSS circle mask erases most of the translucent overlay illustration');
assert.match(game,/art\/primary\/overlays\/\$\{auraKind\}\.png/,'game tile statuses still use the original overlays');
const entries=codex.entries.filter(e=>e.group==='tile-effects');
const sprites=Object.keys(manifest.sprites);
assert.equal(entries.length,16,'all 16 overlay entries must stay available in Nutdex');
assert.equal(sprites.length,16,'overlay manifest inventory must not shrink');
for(const name of sprites){
 const file='web/art/primary/overlays/'+name+'.png';
 const bytes=fs.readFileSync(path.join(root,file));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','not a PNG: '+name);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.sprites[name].sha256,'previously authored transparent overlay changed: '+name);
 assert.ok(entries.some(e=>e.art==='art/primary/overlays/'+name+'.png'),'NUTDEX lost overlay '+name);
}
console.log('PASS: original 16 translucent overlays intact, indexed, and free of destructive CSS culling');
