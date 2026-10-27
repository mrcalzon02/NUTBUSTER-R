const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const flow=fs.readFileSync(path.join(root,'.github/workflows/build-and-release.yml'),'utf8');
const script=fs.readFileSync(path.join(root,'scripts/android-emulator-smoke.sh'),'utf8');
const block=flow.match(/  emulator-smoke:\n[\s\S]*?(?=\n  publisher-release:)/)?.[0];
assert.ok(block,'Android 26 job must exist');
assert.match(block,/emulator-boot-timeout: 300/,'bound emulator boot time');
assert.match(block,/script: bash scripts\/android-emulator-smoke\.sh/,'dedicated bounded smoke test');
assert.match(block,/if: always\(\)/,'retain diagnostic evidence even when emulator fails');
assert.doesNotMatch(block,/adb shell screencap -p \/sdcard|adb pull \/sdcard|am start -W/,'no old unbounded device commands');
for(const [name,pattern] of Object.entries({
  install:/timeout[^\n]*150s adb install/,
  start:/timeout[^\n]*30s adb shell am start/,
  activity:/dumpsys activity activities/,
  foreground:/mResumedActivity/,
  screenshot:/timeout[^\n]*45s adb exec-out screencap -p/,
  crash:/FATAL EXCEPTION/,
  diagnostics:/android26-smoke-steps\.txt/,
})) assert.match(script,pattern,name+' gate must exist');
const fire=fs.readFileSync(path.join(root,'scripts/fireos-tablet-smoke.sh'),'utf8');
assert.match(fire,/timeout[^\n]*150s adb install/,'Fire proxy retains bounded APK installation');
assert.match(fire,/adb install --no-streaming -r/,'Fire proxy avoids flaky streamed package-install transport');
assert.match(fire,/for attempt in 1 2;/,'Fire proxy bounds retry count');
assert.match(fire,/installed != 1/,'Fire proxy cannot ignore two failed install attempts');
assert.match(fire,/timeout[^\n]*45s adb exec-out screencap -p/,'Fire proxy retains real PNG screenshot');
assert.match(fire,/adb shell pm list packages android/,'Fire proxy waits for the actual package manager');
assert.match(fire,/adb install --no-streaming -r/,'Fire proxy avoids unstable streamed ADB installation');
assert.match(fire,/for attempt in 1 2;/,'Fire proxy retries transport failures after cold boot');
assert.match(fire,/installed != 1/,'Fire proxy must reject failed installations');
assert.match(fire,/adb shell pm path "\$PACKAGE"/,'Fire proxy verifies installed application is visible to PackageManager');
assert.match(fire,/APK installation rejected or failed non-transiently/,'Fire proxy never retries a real package-rejection as transport instability');
assert.match(fire,/adb shell logcat -b crash -d -t 150 -s AndroidRuntime:E/,'Fire proxy uses bounded crash-buffer query, not full unbounded logcat');
assert.match(fire,/for attempt in 1 2;/,'Fire proxy retries transient ADB logcat failures');
assert.match(fire,/verified != 1/,'Fire proxy must not pass on an unread crash log');
assert.match(fire,/FATAL EXCEPTION/,'Fire proxy must reject actual Android runtime crashes');
assert.ok(fire.includes('fireos-tablet-logcat-${attempt}-stderr.txt'),'Fire proxy keeps transport diagnostic evidence');
const syntax=require('node:child_process').spawnSync('bash',['-n',path.join(root,'scripts/fireos-tablet-smoke.sh')],{encoding:'utf8'});
assert.equal(syntax.status,0,'Fire shell script must remain parseable: '+syntax.stderr);
const diagnostics=fs.readFileSync(path.join(root,'tests/diagnostic-suites.txt'),'utf8');
assert.match(diagnostics,/^android-emulator-smoke-contract\.test\.js$/m,'Emulator design check must run in the report-only diagnostic tier');
assert.match(flow,/node tools\/test-tiers\.js diagnostic/,'Diagnostic test tier must execute in CI');
const publisher=flow.slice(flow.indexOf('  publisher-release:'));
assert.match(publisher,/needs: \[functional-tests\]/,'Only functional tests gate the signed APK publisher');
assert.doesNotMatch(publisher,/needs:.*(?:desktop|native)/,'Native preview failure must not block Android/Fire signed publishing');
assert.doesNotMatch(publisher,/needs:.*(?:emulator-smoke|android-debug|diagnostics)/,'Emulator failure must not suppress signed publishing');
console.log('PASS: Android 26 and Fire tablet startup/install/screenshots, bounded crash checks, functional-only publisher dependency');
