const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const art=JSON.parse(fs.readFileSync(path.join(root,'web/art/additions/manifest.json'),'utf8'));
assert.equal(Object.keys(art.sprites).length,59);
for(const [id,info] of Object.entries(art.sprites)){
 const file=path.join(root,'web',info.path);
 assert.ok(fs.statSync(file).size>0,id+' is missing');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),info.sha256,
  id+' pixel asset changed without an approved new sprite manifest');
 assert.match(id,/^(ui|economy|effects)\//);
}
const icon=path.join(root,'android/app/src/main/res/drawable-nodpi/nutbuster_icon.png');assert.ok(fs.statSync(icon).size>0);
const app=fs.readFileSync(path.join(root,'android/app/build.gradle'),'utf8');
assert.match(app,/minSdk 26/);assert.match(app,/targetSdk 36/);assert.match(app,/assets\.srcDirs/);
// Packaging must remain a byte-for-byte consumer of committed artwork, never an exporter.
const buildInputs=[
 '.github/workflows/build-and-release.yml','android/app/build.gradle',
 'tools/build_desktop_launchers.sh','desktop/package.json'
];
for(const name of buildInputs){
 const source=fs.readFileSync(path.join(root,name),'utf8');
 assert.doesNotMatch(source,/\b(?:python(?:3)?\s+)?tools\/(?:prepare_assets|prepare_new_art|slice_[A-Za-z0-9_]+)\.py\b/,
  name+' must not reslice source art during ordinary build/packaging');
}
const launcher=fs.readFileSync(path.join(root,'launcher/main.go'),'utf8');
assert.match(launcher,/\/\/go:embed web/);assert.match(launcher,/127\.0\.0\.1/);
console.log('PASS: 59 supplementary sprites, Android packaging layout, icon, offline desktop launcher');
