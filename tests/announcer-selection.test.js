'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../web');
const audioInstances=[],calls=[],bridge={status:'ready',getStatus(){return this.status;},stop(){calls.push(['stop']);},speak(id,line,volume){calls.push(['speak',id,line,volume]);return this.status==='ready';}};
class FakeAudio{
 constructor(src=''){this.src=src;this.listeners={};this.volume=1;this.currentTime=0;this.paused=true;this.playCount=0;this.playbackRate=1;this.defaultPlaybackRate=1;this.preservesPitch=true;audioInstances.push(this);}
 addEventListener(n,fn){(this.listeners[n]??=[]).push(fn);}
 play(){this.paused=false;this.playCount++;return Promise.resolve();}
 pause(){this.paused=true;}
}
const window={Audio:FakeAudio,NUTBUSTER_TTS_BRIDGE:bridge,addEventListener(){}},math=Object.create(Math);math.random=()=>.5;
let testClock=Date.UTC(2026,9,22,12);
class TestDate extends Date {static now(){testClock+=1000;return testClock;}}
for(const file of ['announcer-lines.js','audio.js'])
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),'utf8'),{window,Date:TestDate,Math:math,console});
const A=window.NutAudio,L=window.NutAnnouncers;
A.unlock(); // Start music after the simulated user gesture so speech ducking is observable.
assert.equal(L.voices.length,2,'Only original and Auditor are currently selectable');
assert.equal(Object.keys(L.auditor).length,93,'All approved alternate lines imported');
assert.equal(A.getAnnouncerVoice(),'original','Original is the persistent-default voice');
assert.equal(A.caption('win','ORIGINAL TEXT'),'ORIGINAL TEXT');
assert.equal(A.voice('win'),true);assert.ok(audioInstances[0].src.endsWith('unbelievable-performance.mp3'));
const originalPlays=audioInstances[0].playCount;
assert.equal(A.setAnnouncerVoice('auditor'),true);
assert.equal(A.caption('win','ORIGINAL TEXT'),'Your performance has exceeded the minimum legal requirement.');
assert.equal(A.voice('win'),true,'Android bridge voices the Auditor');
const utterance=calls.find(x=>x[0]==='speak');
assert.equal(utterance[2],L.auditor.win,'Speech says exactly the alternative line');
assert.equal(utterance[3],.9,'Uses independent announcer volume');
assert.equal(audioInstances[0].playCount,originalPlays,'Must never play the original male clip while Auditor selected');
assert.ok(Math.abs(audioInstances[2].volume-.28*.39)<1e-10,'Music ducks for native speech');
A.ttsFinished(utterance[1]);assert.equal(audioInstances[2].volume,.28,'Music restores at speech completion');
assert.equal(A.voice('fish-rare'),true,'New lines are available as event text for later triggers');
assert.equal(calls.filter(x=>x[0]==='speak').at(-1)[2],L.auditor['fish-rare']);
A.setVoiceEnabled(false);assert.equal(A.voice('win'),false,'Global voice mute mutes chosen announcer');
A.setVoiceEnabled(true);
bridge.status='offline-voice-missing';assert.equal(A.voice('win'),false,'Never use network speech or the original on missing offline voice');
bridge.status='ready';assert.equal(A.setAnnouncerVoice('lady'),false,'Planned third voice is not misleadingly selectable');
assert.equal(A.setAnnouncerVoice('original'),true);
assert.equal(A.voice('win'),true,'Switching back restores original recordings');
assert.equal(audioInstances[0].playCount,originalPlays+1);
console.log('PASS: original default, Auditor 93 real scripts via offline Android TTS, no wrong-voice fallback, mute, captions, ducking, and voice switch');
