'use strict';
/* Every restored premium/UI icon is an exact pinned RGBA PNG with a transparent safe margin.
   Do not silently regenerate/reassign these HARD-locked icons during routine updates. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const manifest=require('../assets/recovery/original-non-nut/live-replacements.json');
assert.equal(manifest.count,41);
const files=Object.entries(manifest.mapping);
assert.equal(files.length,41);
assert.equal(new Set(files.map(([p])=>p)).size,41);
function checkPNG(bytes,filename){
 assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a',filename+' PNG signature');
 let pos=8,width=0,height=0,ctype=-1,bit=-1,chunks=[];
 while(pos+12<=bytes.length){
  const n=bytes.readUInt32BE(pos),tag=bytes.toString('ascii',pos+4,pos+8);
  assert(pos+12+n<=bytes.length,filename+' truncated chunk');
  if(tag==='IHDR'){width=bytes.readUInt32BE(pos+8);height=bytes.readUInt32BE(pos+12);bit=bytes[pos+16];ctype=bytes[pos+17];}
  if(tag==='IDAT')chunks.push(bytes.subarray(pos+8,pos+8+n));
  pos+=n+12;if(tag==='IEND')break;
 }
 assert.equal(width,384,filename+' width');assert.equal(height,384,filename+' height');
 assert.equal(bit,8,filename+' bit depth');assert.equal(ctype,6,filename+' must be RGBA');
 const raw=zlib.inflateSync(Buffer.concat(chunks));const stride=width*4;
 assert.equal(raw.length,height*(stride+1),filename+' decompression');
 let prev=Buffer.alloc(stride),opaque=0;
 for(let y=0,off=0;y<height;y++){
  const filter=raw[off++],row=Buffer.alloc(stride);
  for(let i=0;i<stride;i++){
   const left=i>=4?row[i-4]:0,up=prev[i],ul=i>=4?prev[i-4]:0;
   let predict=0;
   if(filter===1)predict=left;
   else if(filter===2)predict=up;
   else if(filter===3)predict=Math.floor((left+up)/2);
   else if(filter===4){const p=left+up-ul,aa=Math.abs(p-left),bb=Math.abs(p-up),cc=Math.abs(p-ul);predict=aa<=bb&&aa<=cc?left:bb<=cc?up:ul;}
   else assert.equal(filter,0,filename+' PNG filter');
   row[i]=(raw[off+i]+predict)&255;
  }
  off+=stride;
  for(let x=0;x<width;x++){
   const alpha=row[x*4+3];
   if(x<12||x>=372||y<12||y>=372)assert.equal(alpha,0,filename+' has clipped/bleeding border at '+x+','+y);
   if(alpha>=128)opaque++;
  }
  prev=row;
 }
 assert(opaque>1700,filename+' lacks substantial sprite content');
}
const rootPath=p=>path.join(ROOT,p);
for(const [name,expected] of files){
 assert(/^web\/art\/additions\/(?:economy|ui)\/[a-z0-9-]+\.png$/.test(name),'Unexpected live target '+name);
 const bytes=fs.readFileSync(rootPath(name));
 const blob=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 assert.equal(blob,expected,'Changed protected art '+name);
 checkPNG(bytes,name);
}
const original=Object.fromEntries(manifest.sources.map(p=>[p,fs.readFileSync(rootPath(p))]));
assert(Object.values(original).every(b=>b.length>1900000),'Missing/short original source atlases');
console.log('PASS: 41 immutable premium and UI PNG exports; 384px RGBA, clear borders, exact binary hashes and original atlases');
