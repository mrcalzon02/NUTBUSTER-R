const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../web/sfx.js'),'utf8'),instances=[];
class MockAudio{
 constructor(src){this.src=src;this.paused=true;this.playbackRate=1;instances.push(this);}
 play(){this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}
}
const win={Audio:MockAudio};
vm.runInNewContext(source,{window:win,Math});
const s=win.NutSFX;
assert.equal(s.play('match'),false,'No audio before user gesture');
s.unlock();
const used=new Set(Object.values(s.recordings).flat());
assert.equal(used.size,17,'Only intended curated recordings');
for(const file of used)assert.ok(fs.existsSync(path.join(__dirname,'../web/audio/sfx',file)),file+' missing');
assert.equal(s.play('ui'),true);
assert.match(instances[0].src,/audio\/sfx\/klick.mp3$/);
const rate=instances[0].playbackRate;
assert.equal(s.play('ui'),true);
assert.notEqual(instances[1].playbackRate,rate,'Repeated cues vary');
for(const instance of instances){instance.pause();instance.onended();}
const initial=instances.length;
assert.equal(s.burst(32),32);
assert.equal(instances.length-initial,8,'Samples cap concurrent audio decoders');
assert.equal(s.setEnabled(false),false);
assert.equal(s.play('ui'),false);
assert.ok(instances.every(x=>x.paused),'Muting silences existing sample voices');
s.setEnabled(true);s.setVolume(0);assert.equal(s.play('ui'),false);
console.log('PASS: 17 licensed clips, per-trigger variation, offline playback, gesture lock, sample cap and mute');
