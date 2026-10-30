'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../web');
const audioInstances=[],ttsCalls=[];
class FakeAudio{
 constructor(src=''){this.src=src;this.listeners={};this.volume=1;this.currentTime=0;this.paused=true;this.playCount=0;this.playbackRate=1;this.defaultPlaybackRate=1;this.preservesPitch=true;audioInstances.push(this);}
 addEventListener(n,fn){(this.listeners[n]??=[]).push(fn);}
 play(){this.paused=false;this.playCount++;return Promise.resolve();}
 pause(){this.paused=true;}
}
const window={Audio:FakeAudio,addEventListener(){},
 NUTBUSTER_TTS_BRIDGE:{getStatus(){ttsCalls.push('status');return 'ready';},speak(){ttsCalls.push('speak');return true;},stop(){ttsCalls.push('stop');}},
 speechSynthesis:{getVoices(){ttsCalls.push('voices');return [];},speak(){ttsCalls.push('browserSpeak');},cancel(){ttsCalls.push('browserCancel');}}
};
const math=Object.create(Math);math.random=()=>.5;
let testClock=Date.UTC(2026,9,22,12);
class TestDate extends Date {static now(){testClock+=1000;return testClock;}}
for(const file of ['announcer-lines.js','audio.js'])
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),{window,Date:TestDate,Math:math,console});
const A=window.NutAudio,L=window.NutAnnouncers;
A.unlock();
assert.equal(L.voices.length,3);
assert.equal(Object.keys(L.auditor).length,93,'All 93 prerecorded-clip slots must remain scripted');
assert.equal(Object.keys(L.diva).length,93,'All 93 female recordings must have semantic event keys');
assert.equal(A.getAnnouncerVoice(),'original');
assert.equal(A.caption('win','ORIGINAL TEXT'),'ORIGINAL TEXT');
assert.equal(A.voice('win'),true);
assert.ok(audioInstances[0].src.endsWith('/unbelievable-performance.mp3'));
const originalPlays=audioInstances[0].playCount;
assert.equal(A.setAnnouncerVoice('auditor'),true);
assert.equal(A.caption('win','ORIGINAL TEXT'),'Your performance has exceeded the minimum legal requirement.');
assert.equal(A.voice('win'),true);
assert.ok(audioInstances[0].src.endsWith('/announcers/auditor/win.mp3'),'Auditor must play packaged recording');
assert.equal(audioInstances[0].volume,.9);
assert.equal(audioInstances[0].playCount,originalPlays+1,'Auditor shares the prerecorded voice channel');
assert.ok(Math.abs(audioInstances[2].volume-.28*.39)<1e-10,'Recorded voice ducks music');
audioInstances[0].onended();
assert.equal(audioInstances[2].volume,.28,'Music restores at completion');
assert.equal(A.voice('fish-rare'),true,'Expanded scripted keys may play corresponding recordings');
assert.ok(audioInstances[0].src.endsWith('/announcers/auditor/fish-rare.mp3'));
assert.equal(A.voice('not-a-key'),false,'Never fall back to wrong announcer for unmapped events');
A.setVoiceEnabled(false);assert.equal(A.voice('win'),false);
A.setVoiceEnabled(true);
assert.equal(A.setAnnouncerVoice('diva'),true,'Recorded Diva is selectable');
assert.equal(A.caption('win','ORIGINAL TEXT'),L.diva.win,'Diva caption matches scripted spoken intent');
assert.equal(A.voice('win'),true,'Diva recorded speech loads');
assert.ok(audioInstances[0].src.endsWith('/announcers/diva/win.mp3'),'Diva loads her own offline MP3');
assert.equal(A.voice('fish-rare'),true,'Additional mapped Diva clips play');
assert.ok(audioInstances[0].src.endsWith('/announcers/diva/fish-rare.mp3'));
assert.equal(A.voice('unknown'),false,'Never use another voice to fill a missing Diva event');
assert.equal(A.setAnnouncerVoice('lady'),false,'Unknown announcer stays invalid');
assert.equal(A.setAnnouncerVoice('original'),true);
assert.equal(A.voice('win'),true);
assert.ok(audioInstances[0].src.endsWith('/unbelievable-performance.mp3'));
assert.equal(typeof A.ttsStatus,'undefined','No device TTS API remains');
assert.deepEqual(ttsCalls,[],'Neither Android nor browser speech service may be called');
console.log('PASS: three announcers use recorded MP3, Diva 93 mapped keys, captions, ducking, mute and no TTS');
