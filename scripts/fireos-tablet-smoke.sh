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
# The unaccelerated AOSP tablet occasionally breaks the ADB streamed install
# transport even when package manager is healthy. Avoid streamed mode, retry
# only on failure, and keep the real return status/evidence visible.
echo '1/6: Installing signed-equivalent debug APK on Google-free AOSP tablet' | tee -a "$LOG"
installed=0
for attempt in 1 2; do
  echo "ADB non-streaming install attempt $attempt/2" | tee -a "$LOG"
  if timeout --signal=TERM --kill-after=5s 150s adb install --no-streaming -r "$APK" \
      > "validation/fireos-tablet-install-${attempt}-stdout.txt" \
      2> "validation/fireos-tablet-install-${attempt}-stderr.txt"; then
    cat "validation/fireos-tablet-install-${attempt}-stdout.txt" | tee -a "$LOG"
    installed=1
    break
  else
    result=$?
    echo "::warning::Fire tablet APK installation failed (attempt $attempt, exit $result)" | tee -a "$LOG"
    cat "validation/fireos-tablet-install-${attempt}-stderr.txt" | tee -a "$LOG"
    if (( attempt < 2 )); then
      timeout --signal=TERM --kill-after=3s 20s adb wait-for-device || true
      sleep 5
    fi
  fi
done
if (( installed != 1 )); then
  echo '::error::Fire tablet APK could not be installed; runtime compatibility remains UNVERIFIED' | tee -a "$LOG"
  exit 1
fi
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
# AOSP API30 cold-boot ADB can hang while dumping the full main buffer.
# Read only the bounded dedicated crash buffer, retry once if the transport
# stalls, and keep failure evidence. Never treat a timeout as "no crashes".
echo '6/6: Read bounded AndroidRuntime crash buffer (two bounded attempts)' | tee -a "$LOG"
CRASH_LOG=validation/fireos-tablet-crashlog.txt
: > "$CRASH_LOG"
verified=0
for attempt in 1 2; do
  echo "logcat attempt $attempt/2" | tee -a "$LOG"
  if timeout --signal=TERM --kill-after=5s 30s adb shell logcat -b crash -d -t 150 -s AndroidRuntime:E \
      > "$CRASH_LOG" 2> "validation/fireos-tablet-logcat-${attempt}-stderr.txt"; then
    verified=1
    break
  else
    status=$?
    echo "::warning::Fire tablet crash-buffer read failed (attempt $attempt, exit $status)" | tee -a "$LOG"
    if (( attempt < 2 )); then
      timeout --signal=TERM --kill-after=3s 8s adb get-state \
        > "validation/fireos-tablet-logcat-transport.txt" 2>&1 || true
      sleep 3
    fi
  fi
done
if (( verified != 1 )); then
  echo '::error::Unable to verify Android crash buffer; Fire tablet smoke remains INCONCLUSIVE' | tee -a "$LOG"
  exit 1
fi
if grep -Fq 'FATAL EXCEPTION' "$CRASH_LOG"; then
  echo '::error::Android runtime crash on tablet proxy' | tee -a "$LOG"
  exit 1
fi
echo 'Crash-buffer query completed without AndroidRuntime FATAL EXCEPTION.' | tee -a "$LOG"
echo 'PASS: Google-free API30 tablet proxy installed, launched, stayed foreground, and captured screenshot without Android runtime crash.' | tee -a "$LOG"
