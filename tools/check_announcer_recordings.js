'use strict';
/** Verify every scripted voice clip exists before packaging an Auditor-enabled build. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
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
if(failures.length){
 console.error('AUDITOR VOICE BANK INCOMPLETE ('+failures.length+'/'+keys.length+'):\n'+failures.join('\n'));
 process.exitCode=1;
}else console.log('PASS: all 93 prerecorded Auditor MP3 files present; decode/device playback still required');
