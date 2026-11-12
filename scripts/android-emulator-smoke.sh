#!/usr/bin/env bash
# Time-bound API-26 install/launch smoke test; every stall names its failing phase.
set -euo pipefail
mkdir -p validation
APK=validation/release/NUTBUSTER-Android-debug.apk
PACKAGE=io.github.mrcalzon02.nutbuster
ACTIVITY="$PACKAGE/.MainActivity"
test -s "$APK"
note() {
  printf '%s %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a validation/android26-smoke-steps.txt
}
fail() {
  note "::error::Android 26 smoke test failed at $1"
  exit 1
}
note '1/6: Emulator running; installing debug APK (maximum 150 seconds)'
timeout --signal=TERM --kill-after=5s 150s adb install -r "$APK" || fail 'adb-install'
note '2/6: Starting NUTBUSTER MainActivity (maximum 30 seconds)'
timeout --signal=TERM --kill-after=5s 30s adb shell am start -n "$ACTIVITY" > validation/android26-launch.txt || fail 'activity-start'
cat validation/android26-launch.txt
grep -Eq 'Starting: Intent|Warning: Activity not started' validation/android26-launch.txt || fail 'activity-start-output'
note '3/6: Checking running app process and foreground activity'
: > validation/android26-pid.txt
for attempt in $(seq 1 12); do
  if timeout 8s adb shell pidof "$PACKAGE" > validation/android26-pid.txt 2>/dev/null && [[ -s validation/android26-pid.txt ]]; then
    break
  fi
  sleep 2
done
[[ -s validation/android26-pid.txt ]] || fail 'app-process-never-started'
sleep 3
timeout --signal=TERM --kill-after=5s 25s adb shell dumpsys activity activities > validation/android26-activity.txt || fail 'activity-dumpsys-timeout'
grep -E '(mResumedActivity|ResumedActivity):? .*io.github.mrcalzon02.nutbuster/.MainActivity' validation/android26-activity.txt || fail 'app-not-in-foreground'
note '4/6: Capturing screenshot directly (maximum 45 seconds; no device file/pull hang)'
timeout --signal=TERM --kill-after=5s 45s adb exec-out screencap -p > validation/nutbuster-android26.png || fail 'screenshot-timeout'
python3 - <<'PY'
from pathlib import Path
png=Path('validation/nutbuster-android26.png').read_bytes()
if len(png)<1024 or not png.startswith(b'\x89PNG\r\n\x1a\n'):
    raise SystemExit('::error::Android 26 screenshot is missing, tiny, or not a PNG')
print(f'Android 26 screenshot PNG captured: {len(png)} bytes')
PY
note '5/6: Inspecting AndroidRuntime failures (maximum 20 seconds)'
timeout --signal=TERM --kill-after=5s 20s adb logcat -d -s AndroidRuntime:E > validation/android26-crashlog.txt || fail 'logcat-timeout'
if grep -F 'FATAL EXCEPTION' validation/android26-crashlog.txt; then
  fail 'android-runtime-crash'
fi
note 'PASS: Android 26 APK installed, app process running, foreground verified, PNG captured, and no runtime crash'
note '6/6: Installing test-only runner and physically tapping unlocked Level Editor controls'
EDITOR_TEST_APK=validation/release/NUTBUSTER-Android-editor-test.apk
test -s "$EDITOR_TEST_APK" || fail 'missing-editor-test-apk'
timeout --signal=TERM --kill-after=5s 60s adb shell am force-stop "$PACKAGE" || fail 'instrumentation-reset'
timeout --signal=TERM --kill-after=5s 120s adb install -r "$EDITOR_TEST_APK" || fail 'test-apk-install'
timeout --signal=TERM --kill-after=5s 200s adb shell am instrument -w \
  "$PACKAGE.test/$PACKAGE.EditorTouchInstrumentation" > validation/android26-editor-touch.txt || fail 'editor-instrumentation'
cat validation/android26-editor-touch.txt
grep -F 'EDITOR_TOUCH_PASS' validation/android26-editor-touch.txt || fail 'editor-touch-assertions'
grep -F 'IRREGULAR_BOARD_PASS' validation/android26-editor-touch.txt || fail 'irregular-board-assertions'
grep -F 'INSTRUMENTATION_CODE: -1' validation/android26-editor-touch.txt || fail 'editor-instrumentation-exit'
for frame in editor-touch-filtered editor-touch-relaunch irregular-board-before irregular-board-after; do
  timeout --signal=TERM --kill-after=5s 30s adb pull \
    "/sdcard/Android/data/$PACKAGE/files/$frame.png" "validation/nutbuster-$frame.png" ||
    fail "editor-screenshot-$frame"
done
python3 - <<'PY'
from pathlib import Path
for stage in ('filtered', 'relaunch', 'irregular-board-before', 'irregular-board-after'):
    file = Path(f'validation/nutbuster-{stage}.png' if stage.startswith('irregular') else f'validation/nutbuster-editor-touch-{stage}.png')
    data = file.read_bytes()
    if len(data) < 1024 or not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise SystemExit(f'::error::Missing real on-device editor screenshot: {file}')
    print(f'PASS {stage}: actual Android PNG, {len(data)} bytes')
PY
note 'PASS: API26 real injected touchscreen editor and deterministic split-column cascade; before/after framebuffer PNGs validated'
