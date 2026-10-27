#!/usr/bin/env node
'use strict';
// An explicit opt-in diagnostic tier: unknown new tests are release-blocking.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const testsDir=path.join(root,'tests');
const manifest=path.join(testsDir,'diagnostic-suites.txt');
function classify(){
  const all=fs.readdirSync(testsDir).filter(f=>f.endsWith('.test.js')).sort();
  if(!all.length)throw new Error('No JavaScript test suites discovered');
  const known=new Set(all), diagnostics=new Set();
  for(const raw of fs.readFileSync(manifest,'utf8').split(/\r?\n/)){
    const name=raw.trim();
    if(!name||name.startsWith('#'))continue;
    if(name!==path.basename(name)||!name.endsWith('.test.js')||!known.has(name))throw new Error('Unknown or unsafe diagnostic test: '+name);
    if(diagnostics.has(name))throw new Error('Duplicate diagnostic test: '+name);
    diagnostics.add(name);
  }
  const functional=all.filter(name=>!diagnostics.has(name));
  if(!functional.length)throw new Error('Functional release gate must never be empty');
  const mustBlock=['engine.test.js','currency-shop.test.js','progression.test.js','primary-contract-lock.test.js',
    'update-contract.test.js','promo-codes.test.js','package.test.js','tile-overlay-mechanics.test.js','platform-parity.test.js'];
  for(const name of mustBlock)if(!functional.includes(name))throw new Error('Critical suite must remain release-blocking: '+name);
  return {functional:functional.map(n=>'tests/'+n),diagnostic:[...diagnostics].sort().map(n=>'tests/'+n)};
}
if(require.main===module){
  try{
    const tier=process.argv[2],result=classify();
    if(tier==='validate')console.log('PASS: '+result.functional.length+' functional release gates, '+result.diagnostic.length+' report-only suites; all discovered suites assigned.');
    else if(tier==='functional'||tier==='diagnostic')process.stdout.write(result[tier].join('\n')+'\n');
    else throw new Error('Usage: node tools/test-tiers.js validate|functional|diagnostic');
  }catch(err){console.error('Test tier classification failure:',err.message);process.exitCode=1;}
}
module.exports={classify};
