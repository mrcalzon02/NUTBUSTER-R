#!/usr/bin/env node
'use strict';
/* Functional release-line contract. Native previews remain independent of the
 * signed Android/Fire publisher. Never promote a partial port as a full release. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const catalog=path.join(root,'config/platform-parity.json');
const statuses=new Set(['functionally-tested','preview-partial','not-ported','verified']);
const mobileStatus=new Set(['functionally-tested','verified']);
const desktopStatus=new Set(['preview-partial','not-ported','verified']);
const expectedTargets=['android','fire_os','windows','linux'];
const norm=p=>p.replaceAll('\\','/').replace(/^\.\//,'');
function exists(rel){return fs.existsSync(path.join(root,rel));}
function check(condition,message){if(!condition)throw Error(message);}
function read(){
 const ledger=JSON.parse(fs.readFileSync(catalog,'utf8'));
 check(ledger.schemaVersion===1,'Unknown parity schema');
 check(JSON.stringify(Object.keys(ledger.targets).sort())===JSON.stringify([...expectedTargets].sort()),'Four platform targets required');
 const t=ledger.targets;
 check(t.android.implementation==='mobile'&&t.fire_os.implementation==='mobile','Mobile shared code must remain one implementation');
 check(t.fire_os.sameArtifactAs==='android','Fire OS is same byte-identical signed Android APK, not a new fork');
 check(t.windows.implementation==='native'&&t.linux.implementation==='native','Desktop must use native implementation');
 check(t.windows.runtime==='cpp17-sdl3'&&t.linux.runtime==='cpp17-sdl3','Desktop must remain C++ SDL3');
 check(t.windows.releaseLine==='ci-preview'&&t.linux.releaseLine==='ci-preview','Do not claim a native full release before parity signoff');
 check(t.android.releaseLine==='signed-sideload-apk'&&t.fire_os.releaseLine==='same-signed-apk','Android/Fire publishing identity drift');
 check(t.windows.productionReady===false&&t.linux.productionReady===false,'Native full release requires audited signoff');
 check(t.fire_os.deviceCertified===false,'AOSP Fire tablet proxy is not physical Fire OS certification');
 check(ledger.rules.androidPublisherIndependentOfNativePreview===true,'Native preview must not block unrelated signed APK');
 check(ledger.rules.fullDesktopReleaseRequiresAllFeaturesVerified===true,'Full desktop parity protection removed');
 check(ledger.rules.desktopMustNotEmbedBrowser===true,'Browser based desktop prohibited');
 check(ledger.rules.pendingParityBlocksDesktopProduction===true,'Partial port cannot be sold as full native release');
 check(ledger.features.length>=13,'Parity inventory unexpectedly short');
 const ids=new Set(),seen=new Set();
 for(const feature of ledger.features){
  check(/^[a-z][a-z0-9-]+$/.test(feature.id),'Invalid feature id '+feature.id);
  check(!ids.has(feature.id),'Duplicate feature id '+feature.id);ids.add(feature.id);
  check(typeof feature.name==='string'&&feature.name.length>7,'Missing feature label '+feature.id);
  check(typeof feature.gap==='string'&&feature.gap.length>12,'Document native parity gap for '+feature.id);
  check(mobileStatus.has(feature.mobile)&&desktopStatus.has(feature.native),'Invalid code coverage status '+feature.id);
  for(const field of ['sources','mobileTests','nativeSources']){
   check(Array.isArray(feature[field]),'Missing '+field+' '+feature.id);
   for(const file of feature[field]){
    check(typeof file==='string'&&file===norm(file)&&exists(file),'Missing tracked file '+file+' for '+feature.id);
    if(field==='sources')check(file.startsWith('web/'),'Mobile gameplay feature source not web/ '+file);
    if(field==='nativeSources')check(file.startsWith('native/'),'Native evidence must be actual native code/art '+file);
   }
  }
  check(feature.sources.length>0&&feature.mobileTests.length>0,'Untracked mobile feature/test '+feature.id);
  if(feature.native==='not-ported')check(feature.nativeSources.length===0,'Not-ported feature falsely lists implemented native code '+feature.id);
  if(feature.native!=='not-ported')check(feature.nativeSources.length>0,'Native preview feature lacks source '+feature.id);
  for(const file of feature.sources)seen.add(file);
 }
 check(seen.has('web/engine.js')&&seen.has('web/game.js')&&seen.has('web/nutvale-mines.js'),'Critical gameplay files missing from tracker');
 const mobileJs=fs.readdirSync(path.join(root,'web')).filter(n=>n.endsWith('.js')&&n!=='release-news.js').map(n=>'web/'+n);
 const unlisted=mobileJs.filter(n=>!seen.has(n));
 check(unlisted.length===0,'Every current mobile gameplay JS module must be tracked: '+unlisted.join(', '));
 const native=fs.readFileSync(path.join(root,'.github/workflows/native-desktop-preview.yml'),'utf8');
 const android=fs.readFileSync(path.join(root,'.github/workflows/build-and-release.yml'),'utf8');
 check(native.includes('web/**')&&native.includes('config/platform-parity.json'),'Native build must trigger on gameplay and parity updates');
 check(native.includes('node tools/platform-parity.js validate'),'Native workflow missing parity gate');
 check(native.includes('node tools/platform-parity.js impact'),'Native workflow missing cross-implementation change detection');
 check(android.includes('node tools/platform-parity.js validate'),'Signed Android workflow must validate parity contract');
 const published=android.slice(android.indexOf('  publisher-release:'));
 check(published.includes('needs: [functional-tests]'),'Signed publisher functional gate absent');
 check(!/needs:.*(native|diagnostics|emulator-smoke)/.test(published),'Signed APK must not depend on unfinished native preview');
 check(!native.includes('NUTBUSTER-Native-Production.zip'),'No native production artifact allowed at preview status');
 return ledger;
}
function status(ledger){
 const present=ledger.features.filter(x=>x.native==='verified').length;
 const partial=ledger.features.filter(x=>x.native==='preview-partial').length;
 const missing=ledger.features.filter(x=>x.native==='not-ported').length;
 return {total:ledger.features.length,verified:present,partial,missing};
}
function report(ledger){
 const s=status(ledger);
 console.log('NUTBUSTER four-target parity ledger, source-level inventory (not device certification)');
 console.log('Android + Fire OS: ONE Android APK implementation; Fire OS real-hardware approval pending');
 console.log('Windows + Linux: ONE native SDL3 implementation; preview CI artifacts only');
 console.log('Native features: '+s.verified+' verified; '+s.partial+' partial; '+s.missing+' not ported; '+s.total+' tracked');
 for(const f of ledger.features)console.log('  '+f.id.padEnd(24)+f.native.padEnd(16)+' | '+f.gap);
}
function impact(ledger,file){
 const changed=fs.readFileSync(file,'utf8').split(/\r?\n/).map(norm).filter(Boolean);
 const mapped=new Set(ledger.features.flatMap(f=>f.sources));
 const relevant=changed.filter(p=>p.startsWith('web/')&&p.endsWith('.js')&&
   !['web/release-news.js'].includes(p));
 const unmapped=relevant.filter(p=>!mapped.has(p));
 check(unmapped.length===0,'New/changed gameplay JS lacks platform feature mapping: '+unmapped.join(', ')+'. Add it to the parity ledger.');
 const affected=ledger.features.filter(f=>f.sources.some(p=>relevant.includes(p)));
 for(const f of affected)console.log('Changed gameplay feature: '+f.id+'; native='+f.native);
 if(relevant.length){
  const synced=changed.some(p=>p.startsWith('native/')||p==='config/platform-parity.json');
  check(synced,'Gameplay changed without a native implementation update or explicit config/platform-parity.json review. '+relevant.join(', '));
 }
 console.log('PASS cross-platform change accounting: '+relevant.length+' game JS files; '+affected.length+' impacted features.');
}
function main(){
 const cmd=process.argv[2]||'validate',ledger=read();
 if(cmd==='validate'){const s=status(ledger);console.log('PASS four-platform development contract: '+s.total+' features, native '+s.partial+' partial/'+s.missing+' missing; previews only.');}
 else if(cmd==='report')report(ledger);
 else if(cmd==='impact'){check(process.argv[3],'Usage: platform-parity.js impact changed-paths.txt');impact(ledger,path.resolve(process.argv[3]));}
 else if(cmd==='require-full'){
  const incomplete=ledger.features.filter(f=>f.native!=='verified');
  check(!incomplete.length,'Native production release BLOCKED: '+incomplete.map(x=>x.id).join(', '));
  check(ledger.targets.windows.productionReady===true&&ledger.targets.linux.productionReady===true,'Native production release not signed off');
  console.log('PASS native production parity signoff');
 }else throw Error('Usage: node tools/platform-parity.js validate|report|impact <file>|require-full');
}
try{main();}catch(e){console.error('Platform parity contract failure:',e.message);process.exitCode=1;}
