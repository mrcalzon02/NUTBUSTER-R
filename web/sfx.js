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
let context=null,enabled=true,volume=.48,unlocked=false;
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
function unlock(){unlocked=true;return !!getContext();}
function setEnabled(value){enabled=!!value;return enabled;}
function setVolume(value){const v=Number(value);volume=Number.isFinite(v)?Math.max(0,Math.min(1,v)):.48;return volume;}
function play(name,{delay=0,pitch=1,level=1}={}){
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
root.NutSFX=Object.freeze({unlock,play,burst,setEnabled,setVolume,getState:()=>({enabled,volume,unlocked}),presets:PRESETS});
})(window);
