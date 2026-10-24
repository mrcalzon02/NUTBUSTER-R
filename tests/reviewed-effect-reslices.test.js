'use strict';
// Tests *approved* visual repairs only. Rejected FX candidates must not be installed.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const ROOT=path.resolve(__dirname,'..');
const audit=require('../assets/recovery/original-non-nut/effects-reviewed.json');
const source=fs.readFileSync(path.join(ROOT,audit.source));
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),audit.source_sha256,'Original source atlas changed');
const expected=Object.entries(audit.repaired);
assert.equal(expected.length,4,'No unreviewed effect may enter this release');
assert.equal(new Set(expected.map(([id])=>id)).size,4);
assert.equal(audit.unchangedAlreadyAcceptable.length,2);
assert.equal(audit.quarantinedCandidates.length,12);
assert.equal(new Set([...expected.map(([n])=>n),...audit.unchangedAlreadyAcceptable,...audit.quarantinedCandidates]).size,18,'All 18 atlas subjects must be accounted for exactly once');
for(const [name,item] of expected){
 const file=fs.readFileSync(path.join(ROOT,item.path));
 assert.equal(file.length,item.bytes,name+' binary size');
 assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+file.length+'\\0')).update(file).digest('hex'),item.git_blob_sha,name+' changed without approval');
 assert.equal(crypto.createHash('sha256').update(file).digest('hex'),item.sha256,name+' SHA-256 changed');
 assert.equal(file.toString('hex',0,8),'89504e470d0a1a0a',name+' invalid PNG signature');
 let p=8,wide=0,high=0,depth=0,type=0,idats=[];
 while(p+12<=file.length){const n=file.readUInt32BE(p),kind=file.toString('ascii',p+4,p+8);
  assert(p+12+n<=file.length,name+' truncated PNG');
  if(kind==='IHDR'){wide=file.readUInt32BE(p+8);high=file.readUInt32BE(p+12);depth=file[p+16];type=file[p+17];}
  if(kind==='IDAT')idats.push(file.subarray(p+8,p+8+n));
  p+=12+n;if(kind==='IEND')break;
 }
 assert.equal(wide,384);assert.equal(high,384);assert.equal(depth,8);assert.equal(type,6,'Must remain true RGBA');
 const raw=zlib.inflateSync(Buffer.concat(idats));assert.equal(raw.length,high*(wide*4+1));
 let prev=Buffer.alloc(wide*4),opaque=0;
 for(let y=0,off=0;y<high;y++){
  const mode=raw[off++],row=Buffer.alloc(wide*4);
  for(let i=0;i<row.length;i++){const left=i>=4?row[i-4]:0,up=prev[i],ul=i>=4?prev[i-4]:0;let predict=0;
   if(mode===1)predict=left;else if(mode===2)predict=up;else if(mode===3)predict=Math.floor((left+up)/2);
   else if(mode===4){const p=left+up-ul,aa=Math.abs(p-left),bb=Math.abs(p-up),cc=Math.abs(p-ul);predict=aa<=bb&&aa<=cc?left:bb<=cc?up:ul;} else assert.equal(mode,0,'Unsupported PNG filter');
   row[i]=(raw[off+i]+predict)&255;
  }
  off+=wide*4;
  for(let x=0;x<wide;x++){const a=row[4*x+3];
   if(x<12||x>=372||y<12||y>=372)assert.equal(a,0,name+' border bleed at '+x+','+y);
   if(a>=128)opaque++;
  }
  prev=row;
 }
 assert(opaque>1700,name+' lost its core illustration');
}
const art=require('../web/art/additions/manifest.json');
const c=fs.readFileSync(path.join(ROOT,'docs/contracts/nutbuster-primary-mechanics-and-asset-lock.csv'),'utf8');
for(const [name,item] of expected){
 assert.equal(art.sprites['effects/'+name].sha256,item.sha256,name+' stale supplementary manifest');
 assert(c.includes(item.git_blob_sha),name+' missing new protected artwork identity');
}
assert(fs.existsSync(path.join(ROOT,audit.review_sheet)),'Visual inspection evidence missing');
console.log('PASS: four reviewed effects, hashes, full RGBA PNG decoding, clear borders and quarantined atlas neighbors');
