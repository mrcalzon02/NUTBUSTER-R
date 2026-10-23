'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'web/art/nutvale/mining-tools');
const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
const art=JSON.parse(fs.readFileSync(path.join(root,'config/nutvale-mining-tool-art.json'),'utf8'));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function png(file,expectedWidth,expectedHeight,expectedHash){
 const buf=fs.readFileSync(file);
 assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file+' PNG signature');
 assert.equal(buf.readUInt32BE(16),expectedWidth,file+' width');
 assert.equal(buf.readUInt32BE(20),expectedHeight,file+' height');
 assert.equal(buf[25],6,file+' RGBA color type');
 assert.equal(hash(buf),expectedHash,file+' source SHA-256');
}
assert.equal(manifest.total,86);
assert.equal(manifest.sprites.length,86);
assert.deepEqual(manifest.categories,{pickaxes:44,gloves:42});
assert.deepEqual(art.tiered_visuals,{pickaxes:40,gloves:40,reserve_pickaxes:4,reserve_gloves:2,tiers_zero_based:[0,39]});
const names=new Set();
for(const sprite of manifest.sprites){
 assert.ok(['pickaxes','gloves'].includes(sprite.category));
 assert.ok(!names.has(sprite.id),sprite.id+' duplicated');
 names.add(sprite.id);
 const file=path.join(root,'web',sprite.path);
 png(file,192,192,sprite.sha256);
}
for(const group of ['pickaxes','gloves']){
 const expected=group==='pickaxes'?44:42;
 assert.equal(fs.readdirSync(path.join(folder,group)).filter(x=>x.endsWith('.png')).length,expected);
 const atlas=manifest.atlases[group];
 const file=path.join(root,'web',atlas.path);
 png(file,192*atlas.columns,192*atlas.rows,atlas.sha256);
}
const original=path.join(root,'assets/source/expansion/nutvale-mining-pickaxes-gloves-original.png');
const chunks=[1,2,3,4].map(i=>fs.readFileSync(original+'.part-'+String(i).padStart(2,'0')));
assert.deepEqual(chunks.map(x=>x.length),[789678,789678,789678,789676]);
const combined=Buffer.concat(chunks);
assert.equal(combined.length,3158710);
assert.equal(hash(combined),manifest.source_sha256,'Lossless source chunks must match approved sheet');
if(fs.existsSync(original))assert.equal(hash(fs.readFileSync(original)),manifest.source_sha256);
const qa=JSON.parse(fs.readFileSync(path.join(root,'docs/assets/nutvale-mining-tool-qa-report.json'),'utf8'));
assert.equal(qa.status,'passed');
assert.equal(qa.individual_rgba_png,86);
assert.equal(qa.all_output_alpha_corners_transparent,true);
console.log('PASS Nutvale mining binaries: 86 verified RGBA PNGs, 2 atlases, QA, and exact original source reconstruction');
