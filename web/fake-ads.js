/* Purely fictional, local rewarded ads. No network, billing, analytics or ad SDK.
   Keep time and payout authorization independent of the UI. */
(function(root){'use strict';
 const DURATION_MS=120000;
 const posters=Object.freeze([
  {id:'nutramax-deluxe',name:'NutraMax Deluxe Acorn Polish'},
  {id:'tailfluff-supreme',name:'TailFluff Supreme'},
  {id:'squirrelphone-3000',name:'SquirrelPhone 3000'},
  {id:'branchfit-pro',name:'BranchFit Pro'},
  {id:'oak-bark-energy-chews',name:'Oak Bark Energy Chews'},
  {id:'wintercache-vault',name:'WinterCache Vault'},
  {id:'whisker-wax-plus',name:'Whisker Wax Plus'},
  {id:'squirrel-life-resort',name:'Live the Squirrel Life'}
 ].map(p=>Object.freeze({...p,image:'art/ads/'+p.id+'.webp'})));
 // Only approved, full-frame 16:9 wharf posters; legacy collage crops stay inactive.
 const wharfPosters=Object.freeze([
  {id:'wharf-sit-back-fish-earn',name:'Sit Back. Fish. Earn.'},
  {id:'wharf-fish-more-nuts',name:'Fish More Nuts!'},
  {id:'wharf-fish-more-nuts-alt',name:'Fish More Nuts! Alternate'},
  {id:'wharf-catch-bigger-dreams',name:'Catch Bigger Dreams!'}
 ].map(p=>Object.freeze({...p,image:'art/ads/wharf/landscape/'+p.id+'.webp'})));
 let playback=null;
 function session(kind,offer,posterIndex=0,now=0){
  if(kind!=='daily'&&kind!=='discount'&&kind!=='wharf')return null;
  if(kind==='discount'&&(!Number.isInteger(offer)||offer<0||offer>8))return null;
  const pool=kind==='wharf'?wharfPosters:posters;
  const index=Math.abs(Math.trunc(Number(posterIndex)||0))%pool.length;
  return {kind,offer:kind==='discount'?offer:null,poster:pool[index],
   elapsed:0,last:Number.isFinite(now)?now:0,ready:false,claimed:false,cancelled:false};
 }
 function tick(s,now,visible=true){
  if(!s||s.cancelled||s.claimed)return false;
  const next=Number.isFinite(now)?now:s.last;
  // Progress only during foreground playback; never award a hidden / suspended ad.
  // Clamp one tick to defeat a clock jump or long browser suspension.
  const delta=Math.min(1100,Math.max(0,next-s.last));
  s.last=next;
  if(visible&&s.elapsed<DURATION_MS)s.elapsed=Math.min(DURATION_MS,s.elapsed+delta);
  s.ready=s.elapsed===DURATION_MS;
  return s.ready;
 }
 function remaining(s){return s?Math.max(0,Math.ceil((DURATION_MS-s.elapsed)/1000)):DURATION_MS/1000;}
 function claim(s){if(!s||s.cancelled||s.claimed||!s.ready)return false;s.claimed=true;return true;}
 function cancel(s){if(s&&!s.claimed){s.cancelled=true;}stopAudio();}
 const audioPath='audio/ads/wah-wah-voice.mp3';
 function stopAudio(){
  if(!playback)return;
  try{playback.pause();playback.currentTime=0;}catch(_){}
  playback=null;
 }
 function audio(enabled,level=1){
  if(!enabled){if(playback)try{playback.pause();}catch(_){}return false;}
  if(!root.Audio)return false;
  if(!playback){
   try{playback=new root.Audio(audioPath);playback.preload='auto';playback.loop=true;}
   catch(_){playback=null;return false;}
  }
  playback.volume=Math.min(.34,Math.max(0,Number(level)||0)*.3);
  if(!playback.volume){try{playback.pause();}catch(_){}return false;}
  try{const p=playback.play();p?.catch?.(()=>{});return true;}catch(_){return false;}
 }
 function dayKey(date=new Date()){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
 const api=Object.freeze({posters,wharfPosters,DURATION_MS,audioPath,session,tick,remaining,claim,cancel,stopAudio,audio,dayKey});
 root.NutFakeAds=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
