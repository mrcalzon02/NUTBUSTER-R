const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Ads=require('../web/fake-ads.js');
assert.equal(Ads.posters.length,8);
assert.equal(Ads.DURATION_MS,120000);
for(const p of Ads.posters){
 const disk=path.join(__dirname,'../web',p.image);
 assert.ok(fs.existsSync(disk),'Missing actual generated poster '+p.id);
 const bytes=fs.readFileSync(disk);
 assert.equal(bytes.subarray(0,4).toString('hex'),'52494646','Optimized poster must be RIFF WebP');
 assert.equal(bytes.subarray(8,12).toString(),'WEBP','Poster not a WebP');
}
assert.ok(fs.existsSync(path.join(__dirname,'../web',Ads.audioPath)),'Missing actual wah-wah voice recording');
assert.equal(Ads.session('discount',9),null,'No discount for unknown offer');
assert.equal(Ads.session('fake',null),null);
const s=Ads.session('daily',null,9,0);
assert.equal(s.poster.id,'tailfluff-supreme','Poster rotation stable');
assert.equal(Ads.claim(s),false,'An unopened ad must not pay rewards');
assert.equal(Ads.tick(s,200, true),false);
assert.equal(s.elapsed,200);
Ads.tick(s,12000000,false);
assert.equal(s.elapsed,200,'Background time must not count');
Ads.tick(s,12000001,true);
assert.equal(s.elapsed,201,'Wall-clock jump must not complete an ad');
let now=12000001;
for(let i=0;i<120;i++){now+=1000;Ads.tick(s,now,true);}
assert.equal(s.ready,true);assert.equal(Ads.remaining(s),0);
assert.equal(Ads.claim(s),true);
assert.equal(Ads.claim(s),false,'Never double pay one finished ad');
const c=Ads.session('discount',3,3,0);Ads.tick(c,1000);Ads.cancel(c);
assert.equal(Ads.claim(c),false,'Closing forfeits the ad reward');
assert.equal(Ads.tick(c,300000),false,'Cancelled sessions stay dead');
assert.equal(Ads.dayKey(new Date(2026,9,22)),'2026-10-22');
console.log('PASS: 8 real poster assets, wah-wah recording, 120-second foreground-only ad timer, single-claim payout, abort protection');
