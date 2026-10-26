const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
const art=JSON.parse(fs.readFileSync(path.join(root,'web/art/additions/manifest.json'),'utf8'));
for(const [id,info] of Object.entries(art.sprites)){
 const file=path.join(root,'web',info.path);
 assert.ok(fs.statSync(file).size>0,id+' is missing');
}
const icon=path.join(root,'android/app/src/main/res/drawable-nodpi/nutbuster_icon.png');assert.ok(fs.statSync(icon).size>0);
const app=fs.readFileSync(path.join(root,'android/app/build.gradle'),'utf8');
assert.match(app,/minSdk 26/);assert.match(app,/targetSdk 36/);assert.match(app,/assets\.srcDirs/);
const cmake=fs.readFileSync(path.join(root,'native/CMakeLists.txt'),'utf8');
const game=fs.readFileSync(path.join(root,'native/src/main.cpp'),'utf8');
const core=fs.readFileSync(path.join(root,'native/src/core.cpp'),'utf8');
const publisher=fs.readFileSync(path.join(root,'.github/workflows/build-and-release.yml'),'utf8');
const nativeCi=fs.readFileSync(path.join(root,'.github/workflows/native-desktop-preview.yml'),'utf8');
assert.match(cmake,/SDL3::SDL3/);assert.match(game,/SDL_CreateWindow/);
assert.match(game,/SDL_RenderTexture/);assert.match(core,/Board::swap/);
assert.match(nativeCi,/--self-test/);
assert.doesNotMatch(publisher,/tools\\/build_desktop_launchers\\.sh/);
assert.doesNotMatch(publisher,/release\\/desktop\\/NUTBUSTER-/);
console.log('PASS: Android inputs and native C++ SDL3 desktop build contract (browser launchers excluded from publisher)');
