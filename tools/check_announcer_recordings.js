'use strict';
/** Verify every scripted voice clip exists before packaging an Auditor-enabled build. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const keys=Object.keys(require('../web/announcer-lines.js').auditor);
const base=path.resolve(__dirname,'../web/audio/announcers/auditor');
const failures=[];
for(const key of keys){
 const name=path.join(base,key+'.mp3');
 if(!fs.existsSync(name)){failures.push(key+': missing');continue;}
 const data=fs.readFileSync(name);
 if(data.length<256 || !(data.subarray(0,3).toString('ascii')==='ID3' || (data[0]===0xff && (data[1]&0xe0)===0xe0)))failures.push(key+': invalid/empty MP3');
}
assert.equal(keys.length,93,'Expected a complete 93-event Auditor script');
const manifestPath=path.join(base,'manifest.json');
if(!fs.existsSync(manifestPath))failures.push('Mira provenance manifest missing');
else{
 try{
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(manifest.voice!=='mira-cc0'||manifest.complete!==true||manifest.files?.length!==93)
   failures.push('Mira voice provenance incomplete or wrong engine');
  else{
   const seen=new Set();
   for(const item of manifest.files){
    if(!keys.includes(item.key)||seen.has(item.key)){failures.push('Duplicate/invalid manifest key');continue;}
    seen.add(item.key);
    const p=path.join(base,item.key+'.mp3');
    if(!fs.existsSync(p))continue;
    const digest=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    if(digest!==item.sha256)failures.push(item.key+': SHA-256 differs from authored take');
   }
   if(seen.size!==93)failures.push('Manifest key coverage incomplete');
  }
 }catch(error){failures.push('Mira manifest cannot be parsed: '+error.message);}
}
if(failures.length){
 console.error('AUDITOR VOICE BANK INCOMPLETE ('+failures.length+'/'+keys.length+'):\n'+failures.join('\n'));
 process.exitCode=1;
}else console.log('PASS: all 93 prerecorded Auditor MP3 files present; decode/device playback still required');
