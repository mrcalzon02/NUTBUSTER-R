'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const tiers=require('../tools/test-tiers.js').classify();
const root=path.resolve(__dirname,'..');
const all=fs.readdirSync(path.join(root,'tests')).filter(p=>p.endsWith('.test.js')).map(p=>'tests/'+p).sort();
assert.deepEqual([...tiers.functional,...tiers.diagnostic].sort(),all,'Every test must run in exactly one tier');
assert.ok(tiers.functional.includes('tests/test-tiers.test.js'),'Classification changes must be release-blocking');
for(const name of ['engine','currency-shop','progression','primary-contract-lock','update-contract','promo-codes','package','apk-release-compliance'])
  assert.ok(tiers.functional.includes('tests/'+name+'.test.js'),'Required gameplay/security suite not release-blocking: '+name);
for(const name of ['premium-icon-integrity','tile-overlay-visibility','release-news','ui-smoke'])
  assert.ok(tiers.diagnostic.includes('tests/'+name+'.test.js'),'Purely visual/content checks should be diagnostics: '+name);
const wf=fs.readFileSync(path.join(root,'.github/workflows/build-and-release.yml'),'utf8');
assert.match(wf,/^  functional-tests:\n/m);
assert.match(wf,/^  diagnostics:\n/m);
assert.match(wf,/^  desktop:\n    needs: functional-tests\n/m);
assert.match(wf,/^  android-debug:\n    runs-on:/m,'Debug build must not gate the signed publisher');
assert.match(wf,/^  emulator-smoke:\n    needs: android-debug\n/m);
const publish=wf.slice(wf.indexOf('  publisher-release:'));
assert.match(publish,/needs: \[functional-tests, desktop\]/,'Publisher must wait for functional tests and required distributables');
assert.doesNotMatch(publish,/needs:.*(?:diagnostics|emulator-smoke|android-debug)/,'Diagnostic failures must not block release');
assert.match(publish,/Validate Nutbuster-owned publisher signing secrets/);
assert.match(publish,/Remote release asset size and GitHub SHA-256 verified/,'Remote integrity remains mandatory');
console.log('PASS: critical game tests gate release; diagnostics remain visible without blocking signed APK publication');
