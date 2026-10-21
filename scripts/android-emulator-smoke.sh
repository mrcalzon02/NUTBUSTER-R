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
note '1/5: Emulator running; installing debug APK (maximum 150 seconds)'
timeout --signal=TERM --kill-after=5s 150s adb install -r "$APK" || fail 'adb-install'
note '2/5: Starting NUTBUSTER MainActivity (maximum 30 seconds)'
timeout --signal=TERM --kill-after=5s 30s adb shell am start -n "$ACTIVITY" > validation/android26-launch.txt || fail 'activity-start'
cat validation/android26-launch.txt
grep -Eq 'Starting: Intent|Warning: Activity not started' validation/android26-launch.txt || fail 'activity-start-output'
note '3/5: Checking running app process and foreground activity'
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
note '4/5: Capturing screenshot directly (maximum 45 seconds; no device file/pull hang)'
timeout --signal=TERM --kill-after=5s 45s adb exec-out screencap -p > validation/nutbuster-android26.png || fail 'screenshot-timeout'
python3 - <<'PY'
from pathlib import Path
png=Path('validation/nutbuster-android26.png').read_bytes()
if len(png)<1024 or not png.startswith(b'\x89PNG\r\n\x1a\n'):
    raise SystemExit('::error::Android 26 screenshot is missing, tiny, or not a PNG')
print(f'Android 26 screenshot PNG captured: {len(png)} bytes')
PY
note '5/5: Inspecting AndroidRuntime failures (maximum 20 seconds)'
timeout --signal=TERM --kill-after=5s 20s adb logcat -d -s AndroidRuntime:E > validation/android26-crashlog.txt || fail 'logcat-timeout'
if grep -F 'FATAL EXCEPTION' validation/android26-crashlog.txt; then
  fail 'android-runtime-crash'
fi
note 'PASS: Android 26 APK installed, app process running, foreground verified, PNG captured, and no runtime crash'
