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
assert.match(flow,/for suite in tests\/\*\.test\.js|tests\/android-emulator-smoke-contract\.test\.js/,'enforce smoke test design in CI');
console.log('PASS: bounded Android 26 emulator startup/install/launch/screenshot, explicit checks, preserved diagnostics');
