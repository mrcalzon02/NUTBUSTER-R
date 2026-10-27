'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const child=require('node:child_process');
const root=path.resolve(__dirname,'..');
const cli=path.join(root,'tools/platform-parity.js');
const config=JSON.parse(fs.readFileSync(path.join(root,'config/platform-parity.json'),'utf8'));
const cmd=(...args)=>child.spawnSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8'});
let r=cmd('validate');
assert.equal(r.status,0,r.stderr);
assert.match(r.stdout,/four-platform development contract/);
r=cmd('report');
assert.equal(r.status,0,r.stderr);
for(const target of ['Android','Fire OS','Windows','Linux'])assert.match(r.stdout,new RegExp(target));
assert.match(r.stdout,/not ported/);
assert.equal(config.targets.fire_os.sameArtifactAs,'android');
assert.equal(config.targets.windows.runtime,'cpp17-sdl3');
assert.equal(config.targets.linux.runtime,'cpp17-sdl3');
assert(config.features.some(f=>f.native==='preview-partial'));
assert(config.features.some(f=>f.native==='not-ported'));
r=cmd('require-full');
assert.notEqual(r.status,0,'Native production must be blocked while missing features remain');
assert.match(r.stderr,/Native production release BLOCKED/);
const work=fs.mkdtempSync(path.join(os.tmpdir(),'nutbuster-parity-'));
function impact(files){
 const name=path.join(work,'changed.txt');
 fs.writeFileSync(name,files.join('\n')+'\n');
 return cmd('impact',name);
}
try{
 assert.equal(impact(['native/src/core.cpp']).status,0,'Native catch-up patches must remain possible');
 assert.equal(impact(['web/engine.js','native/src/core.cpp']).status,0,'Cross-implementation patches must pass');
 assert.equal(impact(['web/engine.js','config/platform-parity.json']).status,0,'Explicit backlog review must pass');
 assert.notEqual(impact(['web/engine.js']).status,0,'Unaccounted mobile-only mechanics must be flagged');
 assert.match(impact(['web/surprise-new-game.js','native/src/core.cpp']).stderr,/lacks platform feature mapping/);
 assert.equal(impact(['web/release-news.js']).status,0,'Non-game release descriptions are exempt');
}finally{fs.rmSync(work,{recursive:true,force:true});}
const native=fs.readFileSync(path.join(root,'.github/workflows/native-desktop-preview.yml'),'utf8');
const mobile=fs.readFileSync(path.join(root,'.github/workflows/build-and-release.yml'),'utf8');
assert.match(native,/web\/\*\*/,'Every gameplay web change must build both native previews');
assert.match(native,/node tools\/platform-parity\.js impact/);
assert.match(native,/--self-test/);
assert.match(mobile,/node tools\/platform-parity\.js validate/);
const publish=mobile.slice(mobile.indexOf('  publisher-release:'));
assert.match(publish,/needs: \[functional-tests\]/);
assert.doesNotMatch(publish,/needs:.*(native|diagnostics|emulator-smoke)/);
console.log('PASS: all four release targets accounted; missing native features block full release, not the independent signed APK');
