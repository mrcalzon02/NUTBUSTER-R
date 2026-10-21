(function(root){'use strict';
// Local-only audio. No streaming, ads, payments, analytics or third-party SDKs.
const base='audio/';
const catalog={
  'big-one':'ooh-thats-a-big-one.mp3', 'magnificent':'magnificent-nuts.mp3',
  'cascade':'they-just-keep-coming.mp3','win':'unbelievable-performance.mp3',
  'close':'that-was-close.mp3','nutbuster':'nutbuster-exclamation.mp3',
  'nutbuster-soft':'nutbuster-soft.mp3','package':'enormous-package.mp3',
  'premium':'premium-nuts-for-everyone.mp3','satisfaction':'satisfaction-guaranteed.mp3',
  'oh-my':'oh-my.mp3'
};
const hasAudio=typeof root.Audio==='function';
const speaker=hasAudio?new root.Audio():null;
const reaction=hasAudio?new root.Audio():null;
const music=hasAudio?new root.Audio(base+'bubbly-whistle.mp3'):null;
let voicesOn=true,musicOn=true,unlocked=false,gruntIndex=0,lastVoice=0;
let voiceRate=1,reactionRate=1;
let voiceLevel=0.90,musicLevel=0.28,reactionLevel=0.38;
const grunts=['grunt-1.mp3','grunt-2.mp3','grunt-3.mp3','grunt-4.mp3'];
if(speaker){speaker.preload='none';speaker.volume=0.90; speaker.onended=unduck;speaker.onerror=unduck;restoreRateAfterLoad(speaker,()=>voiceRate);}
if(reaction){reaction.preload='none';reaction.volume=.38;restoreRateAfterLoad(reaction,()=>reactionRate);}
if(music){music.preload='none';music.loop=true;music.volume=.28;}
function unduck(){if(music)music.volume=musicLevel;}
function setLevels(levels){
 const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0));
 if('voice' in levels)voiceLevel=clamp(levels.voice);
 if('music' in levels)musicLevel=clamp(levels.music);
 if('reactions' in levels)reactionLevel=clamp(levels.reactions);
 if(speaker)speaker.volume=voiceLevel;
 if(reaction)reaction.volume=reactionLevel;
 if(music)music.volume=musicLevel;
 return getLevels();
}
function getLevels(){return {voice:voiceLevel,music:musicLevel,reactions:reactionLevel};}
function play(el){if(!el)return false;try{const result=el.play();if(result&&result.catch)result.catch(()=>{if(el===speaker)unduck();});return true;}catch(_){if(el===speaker)unduck();return false;}}
function applyRate(el,rate){
 // Browser pitch correction would otherwise cancel the tonal difference.
 for(const prop of ['preservesPitch','webkitPreservesPitch','mozPreservesPitch']){
  if(prop in el)try{el[prop]=false;}catch(_){} // Older WebViews may have read-only aliases.
 }
 // A new source may restore its default rate; make the chosen rate the default too.
 try{el.defaultPlaybackRate=rate;}catch(_){}
 el.playbackRate=rate;
}
function restoreRateAfterLoad(el,getRate){
 if(typeof el.addEventListener!=='function')return;
 // Some media backends initialize/reset playback properties asynchronously on src changes.
 for(const event of ['loadedmetadata','playing'])el.addEventListener(event,()=>{
  const rate=getRate();
  if(Math.abs(el.playbackRate-rate)>.0001||('preservesPitch' in el&&el.preservesPitch!==false))applyRate(el,rate);
 });
}
function varyPlayback(el,spread,previous){
 let rate=1+(Math.random()*2-1)*spread;
 // Avoid imperceptible 1.8% differences: consecutive lines now differ by at least
 // 72% of the allowed spread, even if the random source repeatedly returns 0.5.
 if(Math.abs(rate-previous)<spread*.72){
  const opposite=previous>=1?-1:1;
  rate=1+opposite*spread*(.78+.22*Math.random());
 }
 applyRate(el,rate);
 return rate;
}
function setVoiceEnabled(value){voicesOn=!!value;if(!voicesOn){if(speaker)speaker.pause();if(reaction)reaction.pause();unduck();}return voicesOn;}
function setMusicEnabled(value){musicOn=!!value;if(!music)return musicOn;if(!musicOn)music.pause();else if(unlocked)play(music);return musicOn;}
function unlock(){unlocked=true;if(musicOn&&music?.paused&&!(root.document&&root.document.hidden))play(music);}
function voice(key){if(!voicesOn||!speaker||!catalog[key])return false;
  // Always play wins and rewards. Ordinary mid-game voices have a brief spacing guard.
  const now=Date.now(),high=['win','close','package','premium','satisfaction','nutbuster'].includes(key);
  if(!high&&now-lastVoice<750)return false;
  lastVoice=now;try{if(reaction)reaction.pause();speaker.pause();speaker.src=base+catalog[key];speaker.currentTime=0;voiceRate=varyPlayback(speaker,.09,voiceRate);if(music&&!music.paused)music.volume=musicLevel*.39;const accepted=play(speaker);if(!accepted)unduck();return accepted;}catch(_){unduck();return false;}
}
function grunt(){if(!voicesOn||!reaction)return false;
 try{reaction.pause();reaction.src=base+grunts[gruntIndex++%grunts.length];reaction.currentTime=0;reactionRate=varyPlayback(reaction,.11,reactionRate);return play(reaction);}catch(_){return false;}
}
// Suspend playback when the app is backgrounded; resume music when visible.
if(root.document&&typeof root.document.addEventListener==='function'){
 root.document.addEventListener('visibilitychange',()=>{
  if(root.document.hidden){if(music)music.pause();if(speaker)speaker.pause();if(reaction)reaction.pause();unduck();}
  else if(unlocked&&musicOn)play(music);
 });
}
root.NutAudio={unlock,voice,grunt,setVoiceEnabled,setMusicEnabled,setLevels,getLevels,
 getState:()=>({voicesOn,musicOn,unlocked}),catalog:Object.freeze({...catalog})};
})(window);
