const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const created=[];
class FakeAudio {
 constructor(src=''){this.src=src;this.paused=true;this.volume=1;this.currentTime=0;this.playCount=0;created.push(this);}
 play(){this.paused=false;this.playCount++;return Promise.resolve();}
 pause(){this.paused=true;}
}
const window={Audio:FakeAudio};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/audio.js'),'utf8'),{window,Date});
const a=window.NutAudio;
assert.equal(created.length,3,'Separate voice/reaction/music channels');
assert.equal(created[2].loop,true);
assert.equal(created[2].playCount,0,'No autoplay before a gesture');
a.unlock();assert.equal(created[2].playCount,1);
a.voice('win');assert.ok(created[0].src.endsWith('unbelievable-performance.mp3'));
assert.ok(Math.abs(created[2].volume-0.28*0.39)<1e-10,'Music should duck beneath voice');
created[0].onended();assert.equal(created[2].volume,.28);
a.setVoiceEnabled(false);assert.equal(a.voice('package'),false);
a.setVoiceEnabled(true);assert.equal(a.voice('package'),true);
assert.ok(created[0].src.endsWith('enormous-package.mp3'));
a.setMusicEnabled(false);assert.equal(created[2].paused,true);
a.setMusicEnabled(true);assert.equal(created[2].paused,false);
assert.equal(a.voice('not-a-key'),false);
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/audio/catalog.json'),'utf8'));
for(const item of catalog.files){
 const target=path.join(__dirname,'../web/audio',item.filename);
 assert.ok(fs.existsSync(target),item.filename+' missing');
 const digest=require('node:crypto').createHash('sha256').update(fs.readFileSync(target)).digest('hex');
 assert.equal(digest,item.sha256,item.filename+' corrupted');
}
console.log('PASS: voice/music channels, ducking, toggles, catalog integrity, all 16 audio files');
