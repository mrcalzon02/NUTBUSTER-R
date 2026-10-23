'use strict';
const assert=require('node:assert/strict'),zlib=require('node:zlib');
const Z=require('../tools/nutvale-asset-zip.js');
const contents=[
 Buffer.from('abc'.repeat(2000)+'small-repeat-'+'abc'.repeat(900)),
 Buffer.from(JSON.stringify({schema:1,role:'Nutvale mining production/goods and purchase cosmetics',items:Array.from({length:36},(_,i)=>({path:'art/nutvale/mining-economy/goods/crate-'+i+'.png',size:192,sha256:'0123456789abcdef'.repeat(4)}))})),
 Buffer.from(Array.from({length:33000},(_,i)=>i%8===0?'Z':'a').join(''))
];
for(const bytes of contents){
 const compressed=zlib.deflateRawSync(bytes,{level:9});
 const result=Z.inflate(Uint8Array.from(compressed),bytes.length);
 assert.equal(Buffer.compare(Buffer.from(result),bytes),0,'DEFLATE must preserve overlapping repeat bytes exactly');
 const encoded=Z.toBase64(Uint8Array.from(bytes));
 assert.equal(Buffer.compare(Buffer.from(Z.fromBase64(encoded)),bytes),0,'base64 transfer round-trip must be exact');
}
assert.throws(()=>Z.inflate(Uint8Array.from(zlib.deflateRawSync(contents[0])),contents[0].length+1),/Incorrect output length/);
console.log('PASS: binary importer roundtrips repetitive DEFLATE and base64 without byte corruption');
