const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const notes=[];
class Osc {constructor(){this.frequency={setValueAtTime:(v,t)=>notes.push(['from',v,t]),exponentialRampToValueAtTime:(v,t)=>notes.push(['to',v,t])};}
 connect(){}start(t){notes.push(['start',t]);}stop(t){notes.push(['stop',t]);}}
class Gain {constructor(){this.gain={setValueAtTime(){},exponentialRampToValueAtTime(){}};}connect(){}}
class AudioContext {constructor(){this.currentTime=7;this.destination={};this.state='running';}createOscillator(){return new Osc();}createGain(){return new Gain();}}
const window={AudioContext};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/sfx.js'),'utf8'),{window});
const s=window.NutSFX;
assert.equal(s.play('select'),false,'Must not autoplay before user gesture');
assert.equal(s.unlock(),true);assert.equal(s.play('select'),true);
assert.ok(notes.some(n=>n[0]==='start'));
for(const cue of ['ui','invalid','swap','match','crack','ice','chain','chest','coin','booster','shuffle','hazard','portal','transport','victory','failure','cast','reel','caught','escaped','place'])assert.equal(s.play(cue),true,cue);
const before=notes.filter(n=>n[0]==='start').length;assert.equal(s.burst(100),32);
assert.equal(notes.filter(n=>n[0]==='start').length-before,32,'Batched nuts make independent pops, capped at 32');
assert.equal(s.setEnabled(false),false);assert.equal(s.play('booster'),false);
s.setEnabled(true);assert.equal(s.setVolume(0),0);assert.equal(s.play('booster'),false);
assert.equal(s.setVolume(.5),.5);assert.equal(s.play('booster'),true);
const empty={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/sfx.js'),'utf8'),{window:empty});assert.equal(empty.NutSFX.unlock(),false);assert.equal(empty.NutSFX.play('select'),false);
const html=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');
assert.ok(html.indexOf('src="sfx.js"')<html.indexOf('src="game.js"'));
console.log('PASS: offline sound cues, gesture unlocking, all events, independent nut pops, caps, sound controls, graceful fallback');
