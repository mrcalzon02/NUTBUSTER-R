#!/usr/bin/env bash
# Google-free AOSP API-30 1280x800 tablet runtime smoke (Fire OS 8 proxy).
# Does not claim real Amazon Fire OS certification or visual QA.
set -euo pipefail
mkdir -p validation
APK=validation/release/NUTBUSTER-Android-debug.apk
PACKAGE=io.github.mrcalzon02.nutbuster
LOG=validation/fireos-tablet-steps.txt
test -s "$APK"
echo 'AOSP API 30 tablet proxy; actual Fire OS hardware is NOT exercised' > "$LOG"
if adb shell pm list packages | grep -Fq 'package:com.google.android.gms'; then
  echo '::error::Expected Google-free AOSP image, found Google Play Services' | tee -a "$LOG"
  exit 1
fi
timeout --signal=TERM --kill-after=5s 30s adb shell wm size 1280x800
timeout --signal=TERM --kill-after=5s 30s adb shell wm density 240
timeout --signal=TERM --kill-after=5s 150s adb install -r "$APK"
timeout --signal=TERM --kill-after=5s 30s adb shell am start -W -n "$PACKAGE/.MainActivity" > validation/fireos-tablet-launch.txt
: > validation/fireos-tablet-pid.txt
for attempt in $(seq 1 12); do
  if timeout 8s adb shell pidof "$PACKAGE" > validation/fireos-tablet-pid.txt 2>/dev/null && [[ -s validation/fireos-tablet-pid.txt ]]; then break; fi
  sleep 2
done
test -s validation/fireos-tablet-pid.txt
sleep 4
timeout --signal=TERM --kill-after=5s 25s adb shell dumpsys activity activities > validation/fireos-tablet-activity.txt
grep -Eq '(mResumedActivity|ResumedActivity):? .*io.github.mrcalzon02.nutbuster/.MainActivity' validation/fireos-tablet-activity.txt
timeout --signal=TERM --kill-after=5s 45s adb exec-out screencap -p > validation/fireos-tablet-screen.png
python3 - <<'PY'
import pathlib,struct
p=pathlib.Path('validation/fireos-tablet-screen.png')
data=p.read_bytes()
if len(data)<1024 or data[:8]!=b'\x89PNG\r\n\x1a\n':
    raise SystemExit('invalid tablet screenshot')
w,h=struct.unpack('>II',data[16:24])
if sorted((w,h))!=[800,1280]:
    raise SystemExit(f'expected 1280x800 tablet, got {w}x{h}')
print('Google-free tablet screenshot:',w,h)
PY
timeout --signal=TERM --kill-after=5s 20s adb logcat -d -s AndroidRuntime:E > validation/fireos-tablet-crashlog.txt
if grep -Fq 'FATAL EXCEPTION' validation/fireos-tablet-crashlog.txt; then
  echo '::error::Android runtime crash on tablet proxy' | tee -a "$LOG"; exit 1
fi
echo 'PASS: Google-free API30 tablet proxy installed, launched, stayed foreground, and captured screenshot without Android runtime crash.' | tee -a "$LOG"
