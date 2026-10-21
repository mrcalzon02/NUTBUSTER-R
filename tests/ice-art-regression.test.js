const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),zlib=require('node:zlib');
const root=path.join(__dirname,'..'),style=fs.readFileSync(path.join(root,'web/style.css'),'utf8');
const game=fs.readFileSync(path.join(root,'web/game.js'),'utf8');
function inspectPNG(file){
 const buf=fs.readFileSync(file);
 assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a','must be PNG');
 let off=8,w=0,h=0,palette=null,alpha=null,frames=[];
 while(off+12<=buf.length){
  const n=buf.readUInt32BE(off),tag=buf.toString('ascii',off+4,off+8);
  const data=buf.subarray(off+8,off+8+n);
  if(tag==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);assert.equal(data[8],8,'indexed 8-bit ice');assert.equal(data[9],3,'original indexed palette artwork')}
  if(tag==='PLTE')palette=data;
  if(tag==='tRNS')alpha=data;
  if(tag==='IDAT')frames.push(data);
  off+=n+12;
  if(tag==='IEND')break;
 }
 assert.ok(palette?.length>=3);
 assert.ok(alpha,'original ice sprite must have a transparency palette');
 assert.equal(w,96);assert.equal(h,96);
 const bytes=zlib.inflateSync(Buffer.concat(frames));
 const result=new Uint8Array(w*h),row=new Uint8Array(w),prev=new Uint8Array(w);
 let at=0;
 for(let y=0;y<h;y++){
  const filter=bytes[at++];
  assert.ok(filter>=0&&filter<=4,'valid PNG filter');
  for(let x=0;x<w;x++){
   const left=x?row[x-1]:0,up=prev[x],corner=x?prev[x-1]:0;
   let add=0;
   if(filter===1)add=left;
   if(filter===2)add=up;
   if(filter===3)add=(left+up)>>1;
   if(filter===4){const p=left+up-corner;const a=Math.abs(p-left),b=Math.abs(p-up),c=Math.abs(p-corner);add=a<=b&&a<=c?left:b<=c?up:corner}
   row[x]=(bytes[at++]+add)&255;
   result[y*w+x]=alpha[row[x]]??255;
  }
  prev.set(row);
 }
 assert.equal(at,bytes.length,'each PNG row decoded exactly');
 let strong=0,transparent=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let a=result[y*w+x];if(a>=128)strong++;if(a===0)transparent++;
  if(x===0||y===0||x===w-1||y===h-1)
   assert.ok(a<16,'opaque ice pixel at crop boundary: '+x+','+y);
 }
 assert.ok(strong>300,'ice sculpture pixels must remain present');
 assert.ok(transparent>500,'background is real transparency, not solid blue/black');
 return {strong,transparent};
}
for(const tier of ['ice-1','ice-2']){
 const stats=inspectPNG(path.join(root,'web/art/primary/blockers',tier+'.png'));
 console.log(tier,stats);
}
assert.match(game,/class="overlay blocker-art \${kind}"/,'runtime uses authored ice blocker');
const styleBlock=style.match(/\.cell \.overlay\.blocker-art\.ice\{([^}]*)\}/)?.[1];
assert.ok(styleBlock);
assert.match(styleBlock,/background:transparent!important/,'ice background cannot be tinted solid');
assert.match(styleBlock,/border:0!important/,'no ice icon border');
const artBlock=style.match(/\.cell \.overlay\.blocker-art\.ice \.blocker-sprite\{([^}]*)\}/)?.[1];
assert.ok(artBlock);
assert.match(artBlock,/width:86%;/,'painted ice must be inset from rounded clip');
assert.match(artBlock,/height:86%;/,'bottom face must be inset from cell bottom');
assert.match(artBlock,/object-fit:contain/,'never crop a transparent blocker');
assert.match(artBlock,/opacity:\.59/,'ice artwork must be translucent so the nut below remains visible');
assert.match(style,/\.overlay\.blocker-art\.ice\[data-strength="2"\] \.blocker-sprite\{[^}]*opacity:\.74/,'layer 2 ice remains translucent but thicker');
console.log('PASS: two decoded original ice PNGs have alpha and clear boundaries; painted cubes inset, never opaque/tile-cropped');