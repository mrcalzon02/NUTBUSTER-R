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
const launcher=fs.readFileSync(path.join(root,'launcher/main.go'),'utf8');
assert.match(launcher,/\/\/go:embed web/);assert.match(launcher,/127\.0\.0\.1/);
console.log('PASS: referenced files exist, Android packaging inputs and offline desktop launcher');
