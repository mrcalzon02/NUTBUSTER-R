/* Lightweight offline sound cues. Never replaces the authored announcer recordings. */
(function(root){'use strict';
const PRESETS=Object.freeze({
 ui:[490,640,.055,'sine',.12],select:[420,690,.075,'triangle',.17],
 invalid:[260,155,.14,'triangle',.18],swap:[340,490,.09,'sine',.19],
 match:[520,170,.12,'triangle',.17],crack:[185,85,.16,'square',.10],
 ice:[940,310,.18,'sine',.20],chain:[270,115,.22,'triangle',.22],
 chest:[390,760,.22,'triangle',.23],coin:[720,1080,.20,'sine',.18],
 booster:[220,780,.27,'sawtooth',.17],shuffle:[550,250,.28,'triangle',.18],
 hazard:[440,110,.36,'sawtooth',.20],portal:[290,920,.32,'sine',.20],
 transport:[270,460,.19,'sine',.16],victory:[540,1120,.42,'triangle',.19],
 failure:[300,120,.42,'triangle',.20],cast:[350,850,.27,'sine',.16],
 reel:[340,430,.08,'triangle',.12],caught:[470,980,.37,'triangle',.23],
 escaped:[430,145,.32,'sine',.21],place:[360,590,.18,'triangle',.18]
});
let context=null,enabled=true,volume=.48,unlocked=false,lastPitch=1;

const RECORDINGS=Object.freeze({
 ui:['klick.mp3','snick.mp3'],select:['snick.mp3','klick.mp3'],
 invalid:['sneck.mp3'],swap:['slice.mp3'],match:['snap.mp3','snick.mp3'],
 crack:['krunk.mp3'],ice:['las.mp3','snick.mp3'],chain:['curlunk.mp3'],
 chest:['cargothukl.mp3'],coin:['coinkilck.mp3','coinlerkilck.mp3'],
 booster:['bash.mp3'],shuffle:['thrumthump.mp3'],
 hazard:['lightning-crackle.mp3','thundering.mp3'],
 portal:['plas.mp3','las.mp3'],transport:['slice.mp3'],
 victory:['deng.mp3','coinlerkilck.mp3'],failure:['thrumthump.mp3','krunk.mp3'],
 reel:['snick.mp3'],caught:['coinlerkilck.mp3'],escaped:['sneck.mp3'],
 place:['curlunk.mp3']
});
const liveSamples=new Set();let clipIndex=0;
function playbackSample(name,rate,delay,level){
 const choices=RECORDINGS[name];
 if(!choices||!root.Audio||liveSamples.size>=8)return false;
 let sound;try{sound=new root.Audio('audio/sfx/'+choices[clipIndex++%choices.length]);}
 catch(_){return false;}
 liveSamples.add(sound);
 let finished=false;
 function finish(){if(finished)return;finished=true;liveSamples.delete(sound);}
 sound.preload='auto';
 sound.volume=Math.min(1,Math.max(.02,volume*level*1.5));
 try{sound.preservesPitch=false;if('webkitPreservesPitch' in sound)sound.webkitPreservesPitch=false;}catch(_){}
 sound.playbackRate=Math.max(.80,Math.min(1.20,rate));
 function fallback(){if(finished)return;finish();synthesize(name,rate,0,level);}
 sound.onended=finish;sound.onerror=fallback;
 function start(){
  if(finished)return;
  if(!enabled){finish();return;}
  try{const result=sound.play();result?.catch?.(fallback);}
  catch(_){fallback();}
 }
 if(delay>0&&root.setTimeout)root.setTimeout(start,Math.round(Math.min(1,delay)*1000));
 else start();
 return true;
}

function getContext(){
 if(!unlocked)return null;
 if(!context){
  const Constructor=root.AudioContext||root.webkitAudioContext;
  if(!Constructor)return null;
  try{context=new Constructor();}catch(_){return null;}
 }
 if(context.state==='suspended'&&context.resume)try{const pending=context.resume();pending?.catch?.(()=>{});}catch(_){}
 return context;
}
function unlock(){unlocked=true;return !!getContext()||typeof root.Audio==='function';}
function setEnabled(value){enabled=!!value;if(!enabled)for(const sound of [...liveSamples]){try{sound.pause();sound.onended?.();}catch(_){liveSamples.delete(sound);}}return enabled;}
function setVolume(value){const v=Number(value);volume=Number.isFinite(v)?Math.max(0,Math.min(1,v)):.48;return volume;}
function chooseShift(){
 let shift=1+(Math.random()*2-1)*.055;
 if(Math.abs(shift-lastPitch)<.03)shift=lastPitch>=1?.946:1.054;
 lastPitch=shift;return shift;
}
function play(name,{delay=0,pitch=1,level=1}={}){
 if(!PRESETS[name]||!unlocked||!enabled||volume<=0)return false;
 const rate=pitch*chooseShift();
 if(playbackSample(name,rate,delay,level))return true;
 return synthesize(name,rate,delay,level);
}
function synthesize(name,pitch,delay=0,level=1){
 const spec=PRESETS[name],ctx=enabled&&volume>0?getContext():null;
 if(!spec||!ctx||typeof ctx.createOscillator!=='function')return false;
 try{
  const [from,to,duration,wave,strength]=spec;
  const start=ctx.currentTime+Math.max(0,Math.min(1,delay));
  const osc=ctx.createOscillator(),gain=ctx.createGain(),peak=Math.max(.0001,Math.min(.30,strength*volume*level));
  osc.type=wave;osc.frequency.setValueAtTime(Math.max(20,from*pitch),start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20,to*pitch),start+duration);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(peak,start+.014);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(ctx.destination);
  osc.start(start);osc.stop(start+duration+.01);
  return true;
 }catch(_){return false;}
}
// Each destroyed nut has its own brief pop. Cap simultaneous voices on huge cascades.
function burst(count){
 const n=Math.min(32,Math.max(0,Math.trunc(Number(count)||0)));
 for(let i=0;i<n;i++)play('match',{delay:i*.012,pitch:.82+(i%7)*.065,level:n>18?.55:.72});
 return n;
}
root.NutSFX=Object.freeze({unlock,play,burst,setEnabled,setVolume,getState:()=>({enabled,volume,unlocked}),presets:PRESETS,recordings:RECORDINGS});
})(window);
