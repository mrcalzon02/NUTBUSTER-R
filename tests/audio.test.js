const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const created=[];
class FakeAudio {
 constructor(src=''){this._src=src;this.listeners={};this.paused=true;this.volume=1;this.currentTime=0;this.playCount=0;this.playbackRate=1;this.defaultPlaybackRate=1;this.preservesPitch=true;this.webkitPreservesPitch=true;this.mozPreservesPitch=true;created.push(this);}
 // Simulate an Android media backend resetting playback settings when src changes.
 set src(value){this._src=value;this.playbackRate=1;this.defaultPlaybackRate=1;this.preservesPitch=true;}
 get src(){return this._src;}
 addEventListener(event,fn){(this.listeners[event]??=[]).push(fn);}
 emit(event){for(const fn of this.listeners[event]||[])fn();}
 play(){this.paused=false;this.playCount++;return Promise.resolve();}
 pause(){this.paused=true;}
}
const window={Audio:FakeAudio};
const math=Object.create(Math);math.random=()=>.5; // Repeated random samples must not yield identical consecutive cues.
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/audio.js'),'utf8'),{window,Date,Math:math});
const a=window.NutAudio;
assert.equal(created.length,3,'Separate voice/reaction/music channels');
assert.equal(created[2].loop,true);
assert.equal(created[2].playCount,0,'No autoplay before a gesture');
a.unlock();assert.equal(created[2].playCount,1);
a.voice('win');assert.ok(created[0].src.endsWith('unbelievable-performance.mp3'));
const within=(rate,min,max)=>assert.ok(rate>=min-1e-10&&rate<=max+1e-10,`Playback rate ${rate} outside ${min}–${max}`);
within(created[0].playbackRate,.91,1.09);
assert.ok(Math.abs(created[0].playbackRate-1)>.06,'First voice variation should be perceptible');
assert.equal(created[0].preservesPitch,false,'Voice changes pitch along with speed');
assert.equal(created[0].webkitPreservesPitch,false);
assert.equal(created[0].mozPreservesPitch,false);
const firstVoiceRate=created[0].playbackRate;
assert.equal(created[0].defaultPlaybackRate,firstVoiceRate);
// Test late resets after audio decoding or WebView media initialization.
created[0].playbackRate=1;created[0].preservesPitch=true;created[0].emit('loadedmetadata');
assert.equal(created[0].playbackRate,firstVoiceRate,'Loaded metadata restores the chosen rate');
assert.equal(created[0].preservesPitch,false,'Loaded metadata restores the pitch setting');
created[0].playbackRate=1;created[0].emit('playing');
assert.equal(created[0].playbackRate,firstVoiceRate,'Playing restores the chosen rate');
assert.equal(a.voice('win'),true);
within(created[0].playbackRate,.91,1.09);
assert.ok(Math.abs(created[0].playbackRate-firstVoiceRate)>=.0647,'Consecutive voice cues should have clear audible separation');
assert.equal(a.grunt(),true);
const firstGruntRate=created[1].playbackRate;
within(firstGruntRate,.89,1.11);
assert.equal(created[1].preservesPitch,false,'Reaction changes pitch along with speed');
assert.equal(a.grunt(),true);
within(created[1].playbackRate,.89,1.11);
assert.ok(Math.abs(created[1].playbackRate-firstGruntRate)>=.0791,'Consecutive reaction cues should have clear audible separation');
const secondGruntRate=created[1].playbackRate;
created[1].playbackRate=1;created[1].preservesPitch=true;created[1].emit('playing');
assert.equal(created[1].playbackRate,secondGruntRate,'Reaction rate survives deferred media initialization');
assert.equal(created[1].preservesPitch,false);
assert.ok(created[1].src.endsWith('grunt-2.mp3'));
assert.equal(created[2].playbackRate,1,'Music loop speed and pitch remain unchanged');
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
console.log('PASS: audible voice/reaction variation, media-load reset recovery, music isolation, ducking, toggles, catalog integrity, all 16 audio files');
