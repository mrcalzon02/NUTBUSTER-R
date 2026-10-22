const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../web/fake-ads.js'),'utf8');
const sounds=[];
class RecordedAudio{
 constructor(src){this.src=src;this.loop=false;this.volume=1;this.currentTime=0;this.playCount=0;this.pauseCount=0;sounds.push(this);}
 play(){this.playCount++;return Promise.resolve();}
 pause(){this.pauseCount++;}
}
const window={Audio:RecordedAudio},context=vm.createContext({window});
vm.runInContext(source,context);
const Ads=window.NutFakeAds;
assert.equal(Ads.audio(true,.8),true,'Wah-wah must start after user opts in');
assert.equal(sounds.length,1);
assert.equal(sounds[0].src,'audio/ads/wah-wah-voice.mp3');
assert.equal(sounds[0].loop,true,'13-second wah-wah recording loops through ad timer');
assert.ok(sounds[0].volume>0&&sounds[0].volume<=.34);
assert.equal(Ads.audio(false,.8),false);
assert.equal(sounds[0].pauseCount,1,'Mute/background pauses recording');
assert.equal(Ads.audio(true,.8),true);
assert.equal(sounds[0].playCount,2,'Unmute resumes the same source');
Ads.stopAudio();assert.equal(sounds[0].pauseCount,2);
Ads.audio(true,.8);assert.equal(sounds.length,2,'New watch uses fresh local Audio source');
Ads.cancel(Ads.session('daily',null,0,0));
assert.ok(sounds[1].pauseCount>=1,'Cancelled watch must stop audio');
console.log('PASS: authentic Wah wahvoice MP3 loops locally; volume clamp, mute, resume and stop on exit');
