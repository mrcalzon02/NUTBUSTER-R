'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'web/art/nutvale/mining-tools');
const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
const art=JSON.parse(fs.readFileSync(path.join(root,'config/nutvale-mining-tool-art.json'),'utf8'));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const gitHash=data=>crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
const zlib=require('node:zlib');
// Validate real PNG alpha, not just a file extension or a self-reported QA flag.
function transparentCorners(data){
 const w=data.readUInt32BE(16),h=data.readUInt32BE(20),stride=w*4,parts=[];
 assert.equal(data[24],8,'PNG must have eight-bit channels');
 assert.equal(data[28],0,'Interlaced PNG not supported by this QA decoder');
 for(let pos=8;pos+12<=data.length;){
  const n=data.readUInt32BE(pos),type=data.toString('ascii',pos+4,pos+8),start=pos+8;
  assert.ok(start+n+4<=data.length,'PNG chunk exceeds file');
  if(type==='IDAT')parts.push(data.subarray(start,start+n));
  pos=start+n+4;if(type==='IEND')break;
 }
 assert.ok(parts.length,'Missing compressed PNG data');
 const raw=zlib.inflateSync(Buffer.concat(parts));
 assert.equal(raw.length,(stride+1)*h,'PNG decoded payload length');
 let before=new Uint8Array(w),opaque=0;
 for(let y=0;y<h;y++){
  const row=new Uint8Array(w),start=y*(stride+1),filter=raw[start];
  assert.ok(filter<=4,'Invalid PNG row predictor');
  for(let x=0;x<w;x++){
   const left=x?row[x-1]:0,up=before[x],corner=x?before[x-1]:0;
   const prediction=filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):
    (()=>{const p=left+up-corner,a=Math.abs(p-left),b=Math.abs(p-up),c=Math.abs(p-corner);return a<=b&&a<=c?left:b<=c?up:corner;})();
   row[x]=(raw[start+1+4*x+3]+prediction)&255;if(row[x]>0)opaque++;
  }
  if(y===0||y===h-1){assert.equal(row[0],0,'Top/bottom-left PNG corner not transparent');assert.equal(row[w-1],0,'Top/bottom-right PNG corner not transparent');}
  before=row;
 }
 assert.ok(opaque>0,'PNG icon is entirely transparent');
}
function png(file,expectedWidth,expectedHeight,expectedHash){
 const buf=fs.readFileSync(file);
 assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file+' PNG signature');
 assert.equal(buf.readUInt32BE(16),expectedWidth,file+' width');
 assert.equal(buf.readUInt32BE(20),expectedHeight,file+' height');
 assert.equal(buf[25],6,file+' RGBA color type');
 assert.equal(gitHash(buf),expectedHash,file+' pinned Git blob SHA-1');
 transparentCorners(buf);
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
 png(file,192,192,sprite.git_blob_sha);
}
for(const group of ['pickaxes','gloves']){
 const expected=group==='pickaxes'?44:42;
 assert.equal(fs.readdirSync(path.join(folder,group)).filter(x=>x.endsWith('.png')).length,expected);
 const atlas=manifest.atlases[group];
 const file=path.join(root,'web',atlas.path);
 // Atlases are too large for repeated full pixel QA; independent constituent
 // icons above are decompressed and checked individually.
 const bytes=fs.readFileSync(file);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),192*atlas.columns);
 assert.equal(bytes.readUInt32BE(20),192*atlas.rows);
 assert.equal(gitHash(bytes),atlas.git_blob_sha);
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
