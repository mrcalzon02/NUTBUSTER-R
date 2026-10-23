(function(root){'use strict';
// Local-only audio. No streaming, ads, payments, analytics or third-party SDKs.
const base='audio/';
const catalog={
  'big-one':'ooh-thats-a-big-one.mp3', 'magnificent':'magnificent-nuts.mp3',
  'cascade':'they-just-keep-coming.mp3','win':'unbelievable-performance.mp3',
  'close':'that-was-close.mp3','nutbuster':'nutbuster-exclamation.mp3',
  'nutbuster-soft':'nutbuster-soft.mp3','package':'enormous-package.mp3',
  'premium':'premium-nuts-for-everyone.mp3','satisfaction':'satisfaction-guaranteed.mp3',
  'oh-my':'oh-my.mp3','deal':'what-a-deal.mp3','look-out':'look-out.mp3',
  'nutsplosion':'nutsplosion.mp3','heck-package':'heck-package.mp3',
  'nutsselence':'nutsselence.mp3','nut-destruction':'nut-destruction.mp3',
  'nutravaganza':'nutravaganza.mp3','busted':'busted.mp3'
};
const hasAudio=typeof root.Audio==='function';
const speaker=hasAudio?new root.Audio():null;
const reaction=hasAudio?new root.Audio():null;
const music=hasAudio?new root.Audio(base+'bubbly-whistle.mp3'):null;
let voicesOn=true,musicOn=true,unlocked=false,gruntIndex=0,lastVoice=0,announcerVoice='original';
let activeSpeech=null,ttsToken=0;
let voiceRate=1,reactionRate=1;
let voiceLevel=0.90,musicLevel=0.28,reactionLevel=0.38;
const grunts=['grunt-1.mp3','grunt-2.mp3','grunt-3.mp3','grunt-4.mp3'];
if(speaker){speaker.preload='none';speaker.volume=0.90; speaker.onended=unduck;speaker.onerror=unduck;restoreRateAfterLoad(speaker,()=>voiceRate);}
if(reaction){reaction.preload='none';reaction.volume=.38;restoreRateAfterLoad(reaction,()=>reactionRate);}
if(music){music.preload='none';music.loop=true;music.volume=.28;}
function unduck(){if(music)music.volume=musicLevel;}
function duck(){if(music&&!music.paused)music.volume=musicLevel*.39;}
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
function setVoiceEnabled(value){voicesOn=!!value;if(!voicesOn){stopAnnouncer();if(reaction)reaction.pause();}return voicesOn;}
function setMusicEnabled(value){musicOn=!!value;if(!music)return musicOn;if(!musicOn)music.pause();else if(unlocked)play(music);return musicOn;}
function unlock(){unlocked=true;if(musicOn&&music?.paused&&!(root.document&&root.document.hidden))play(music);}
function speechBridge(){return root.NUTBUSTER_TTS_BRIDGE||null;}
function localBrowserVoice(){
 const synth=root.speechSynthesis;
 if(!synth||typeof synth.getVoices!=='function'||typeof root.SpeechSynthesisUtterance!=='function')return null;
 const options=synth.getVoices().filter(v=>v.localService===true&&/^en\b|^en[-_]/i.test(v.lang||''));
 return options.find(v=>/^en[-_]US/i.test(v.lang||''))||options[0]||null;
}
function ttsStatus(){
 const bridge=speechBridge();
 if(bridge&&typeof bridge.getStatus==='function'){
  try{return bridge.getStatus();}catch(_){return 'unavailable';}
 }
 return localBrowserVoice()?'ready':'offline-voice-missing';
}
function stopAnnouncer(){
 if(speaker)speaker.pause();
 activeSpeech=null;
 try{speechBridge()?.stop?.();}catch(_){}
 try{root.speechSynthesis?.cancel?.();}catch(_){}
 unduck();
}
function setAnnouncerVoice(id){
 if(id!=='original'&&id!=='auditor')return false;
 if(id!==announcerVoice){stopAnnouncer();announcerVoice=id;}
 return true;
}
function caption(key,original){return root.NutAnnouncers?.line?.(announcerVoice,key)||original;}
function ttsFinished(id){
 if(activeSpeech===id){activeSpeech=null;unduck();}
}
function speakAuditor(key){
 const line=root.NutAnnouncers?.line?.('auditor',key);
 if(!line)return false;
 const now=Date.now();
 const high=['win','close','package','premium','satisfaction','nutbuster','deal','look-out','nutsplosion','heck-package','nutsselence','nut-destruction','nutravaganza','busted'].includes(key);
 if(!high&&now-lastVoice<750)return false;
 if(ttsStatus()!=='ready')return false; // NEVER fall back to the wrong character or online TTS.
 lastVoice=now;
 stopAnnouncer();
 const token='auditor-'+(++ttsToken);
 const bridge=speechBridge();
 if(bridge&&typeof bridge.speak==='function'){
  try{
   if(!bridge.speak(token,line,voiceLevel))return false;
   activeSpeech=token;duck();return true;
  }catch(_){unduck();return false;}
 }
 const synth=root.speechSynthesis,Voice=root.SpeechSynthesisUtterance,voice=localBrowserVoice();
 if(!synth||!voice||typeof Voice!=='function')return false;
 try{
  const utterance=new Voice(line);
  utterance.voice=voice;utterance.lang=voice.lang;
  utterance.rate=.88;utterance.pitch=.88;utterance.volume=voiceLevel;
  utterance.onend=()=>ttsFinished(token);utterance.onerror=()=>ttsFinished(token);
  activeSpeech=token;duck();synth.speak(utterance);return true;
 }catch(_){activeSpeech=null;unduck();return false;}
}
function voice(key){
 if(!voicesOn)return false;
 if(announcerVoice==='auditor')return speakAuditor(key);
 if(!speaker||!catalog[key])return false;
  // Always play wins and rewards. Ordinary mid-game voices have a brief spacing guard.
  const now=Date.now(),high=['win','close','package','premium','satisfaction','nutbuster','deal','look-out','nutsplosion','heck-package','nutsselence','nut-destruction','nutravaganza','busted'].includes(key);
  if(!high&&now-lastVoice<750)return false;
  lastVoice=now;try{if(reaction)reaction.pause();stopAnnouncer();speaker.src=base+catalog[key];speaker.currentTime=0;voiceRate=varyPlayback(speaker,.09,voiceRate);duck();const accepted=play(speaker);if(!accepted)unduck();return accepted;}catch(_){unduck();return false;}
}
function grunt(){if(!voicesOn||!reaction)return false;
 try{reaction.pause();reaction.src=base+grunts[gruntIndex++%grunts.length];reaction.currentTime=0;reactionRate=varyPlayback(reaction,.11,reactionRate);return play(reaction);}catch(_){return false;}
}
// Suspend playback when the app is backgrounded; resume music when visible.
if(root.document&&typeof root.document.addEventListener==='function'){
 root.document.addEventListener('visibilitychange',()=>{
  if(root.document.hidden){if(music)music.pause();stopAnnouncer();if(reaction)reaction.pause();unduck();}
  else if(unlocked&&musicOn)play(music);
 });
}
root.NutAudio={unlock,voice,grunt,setVoiceEnabled,setMusicEnabled,setLevels,getLevels,setAnnouncerVoice,caption,ttsStatus,ttsFinished,stopAnnouncer,
 getAnnouncerVoice:()=>announcerVoice,getState:()=>({voicesOn,musicOn,unlocked,announcerVoice,ttsStatus:ttsStatus()}),catalog:Object.freeze({...catalog})};
})(window);
