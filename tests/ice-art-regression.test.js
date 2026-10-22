const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.join(__dirname,'..');
const game=fs.readFileSync(path.join(root,'web/game.js'),'utf8'),css=fs.readFileSync(path.join(root,'web/style.css'),'utf8');
function read(tier){const img=fs.readFileSync(path.join(root,'web/art/primary/blockers',tier+'.png'));
assert.equal(img.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
let p=8,w=0,h=0,chunks=[];while(p+12<=img.length){const n=img.readUInt32BE(p),tag=img.toString('ascii',p+4,p+8),v=img.subarray(p+8,p+8+n);
if(tag==='IHDR'){w=v.readUInt32BE(0);h=v.readUInt32BE(4);assert.equal(v[8],8);assert.equal(v[9],6,'actual RGBA ice must have per-pixel alpha');}
if(tag==='IDAT')chunks.push(v);p+=n+12;if(tag==='IEND')break;}assert.equal(w,96);assert.equal(h,96);
const data=zlib.inflateSync(Buffer.concat(chunks)),pixels=new Uint8Array(w*h*4);assert.equal(data.length,96*385);let at=0,prev=new Uint8Array(w*4);
for(let y=0;y<h;y++){const f=data[at++],row=new Uint8Array(w*4);assert.ok(f<=4);for(let x=0;x<w*4;x++){const a=x>=4?row[x-4]:0,b=prev[x],c=x>=4?prev[x-4]:0;let d=0;if(f===1)d=a;else if(f===2)d=b;else if(f===3)d=(a+b)>>1;else if(f===4){const p=a+b-c,A=Math.abs(p-a),B=Math.abs(p-b),C=Math.abs(p-c);d=A<=B&&A<=C?a:B<=C?b:c;}row[x]=(data[at++]+d)&255;pixels[y*w*4+x]=row[x];}prev=row;}
const A=(x,y)=>pixels[(y*96+x)*4+3];let center=0,n=0,rim=0,m=0,opaque=0,transparent=0;const last=Array(96).fill(0);
for(let y=0;y<96;y++)for(let x=0;x<96;x++){const a=A(x,y);if(a>150)opaque++;if(a===0)transparent++;if(a>30)last[x]=y;
if(x>=34&&x<62&&y>=34&&y<62){center+=a;n++;}if(x>15&&x<25&&y>35&&y<60){rim+=a;m++;}
if(x===0||y===0||x===95||y===95)assert.ok(a<16,'image-edge cropping not allowed');}
const C=center/n,R=rim/m;assert.ok(C<115,'the underlying nut must be visible through the blue interior');
assert.ok(R>C,'crystalline facets are stronger than center');
assert.ok(last[48]-last[15]>=4,'bottom contour must curve, not end in a horizontal straight crop');
assert.ok(A(48,92)<16,'lower edge must feather before crop');
assert.ok(opaque>250&&transparent>500,'original detailed ice art must be retained');
return {center:C,rim:R,curve:last[48]-last[15]};}
const thin=read('ice-1'),thick=read('ice-2');
assert.ok(thick.center>thin.center+12,'reinforced ice visibly stronger');
assert.ok(game.includes('function blockerVisual(c)'),'render still uses original blocker assets');
assert.ok(css.includes('object-fit:contain'),'ice remains uncropped by CSS');
console.log('PASS: two RGBA ice variants have see-through centers, distinct thickness and naturally curved bottom edges');
