const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),web=path.join(root,'web');
const icons=JSON.parse(fs.readFileSync(path.join(web,'art/fx-ui-catalog.json')));
const map=JSON.parse(fs.readFileSync(path.join(web,'art/maps/manifest.json')));
const stock=JSON.parse(fs.readFileSync(path.join(web,'art/additions/manifest.json')));
assert.equal(Object.keys(stock.sprites).length,59);
for(const [role,item] of Object.entries(icons.icons)){
 const file=path.join(web,item);assert.ok(fs.existsSync(file),role+' missing: '+item);
 assert.ok(fs.statSync(file).size>1000,role+' unexpectedly tiny');
}
assert.equal(map.assets.length,12,'Ten individual chapter maps and two campaign overviews');
for(const asset of map.assets){
 const p=path.join(web,asset.path);assert.ok(fs.existsSync(p),asset.path);
 const bytes=fs.readFileSync(p);assert.equal(bytes.length,asset.bytes);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);
}
console.log('PASS: six SHA-256 checked map backgrounds, 59 existing isolated sprites and '+Object.keys(icons.icons).length+' FX/UI references');
