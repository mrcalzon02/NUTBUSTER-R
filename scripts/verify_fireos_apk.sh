#!/usr/bin/env bash
# Validate the Fire OS 7/8 download is the exact publisher-signed Android APK.
# This is a build/metadata compatibility check, NOT Fire hardware certification.
set -euo pipefail
FIRE="${1:?Fire OS APK path required}"
ANDROID="${2:?Original signed Android APK path required}"
test -s "$FIRE"
test -s "$ANDROID"
cmp -s "$FIRE" "$ANDROID" || { echo '::error::Fire OS and Android packages differ; refusing to create incompatible update line'; exit 1; }
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}/build-tools/36.0.0"
test -x "$SDK/aapt"
test -x "$SDK/apksigner"
BADGING="$("$SDK/aapt" dump badging "$FIRE")"
grep -F "package: name='io.github.mrcalzon02.nutbuster'" <<<"$BADGING" >/dev/null
MIN_SDK="$(sed -n "s/^sdkVersion:'\([0-9]*\)'$/\1/p" <<<"$BADGING")"
TARGET_SDK="$(sed -n "s/^targetSdkVersion:'\([0-9]*\)'$/\1/p" <<<"$BADGING")"
test "$MIN_SDK" = 26 || { echo "::error::Unexpected minSdk: $MIN_SDK"; exit 1; }
test "$TARGET_SDK" = 36 || { echo "::error::Unexpected targetSdk: $TARGET_SDK"; exit 1; }
# A hardware feature marked as required would prevent install on some Fire tablets.
if grep -E "^uses-feature: name='android.hardware." <<<"$BADGING"; then
  echo '::error::Fire tablet APK unexpectedly requires Android hardware features'
  exit 1
fi
ZIP_ENTRIES="$(unzip -Z -1 "$FIRE")"
for path in assets/index.html assets/game.js assets/nutvale-mines.js assets/mine-ore-atlas.js; do
  grep -Fx "$path" <<<"$ZIP_ENTRIES" >/dev/null || {
    echo "::error::Missing packaged game asset: $path"; exit 1;
  }
done
# The Android wrapper must not rely on proprietary Google runtime services.
if grep -RE 'com\.google\.android\.gms|com\.google\.firebase' android/app/build.gradle android/app/src/main/java; then
  echo '::error::Google Play Services/Firebase dependency in Fire tablet wrapper'; exit 1
fi
VERIFY="$("$SDK/apksigner" verify --verbose --print-certs "$FIRE")"
SIGNER="$(sed -n 's/^Signer #1 certificate SHA-256 digest: //p' <<<"$VERIFY" | head -n 1 | tr '[:upper:]' '[:lower:]')"
PINNED="$(tr -d '[:space:]' < config/nutbuster-publisher.sha256)"
test -n "$SIGNER" && test "$SIGNER" = "$PINNED" || { echo '::error::Fire OS APK does not use the pinned NUTBUSTER signer'; exit 1; }
mkdir -p release/publish
{
  echo 'Fire OS 7 (API 28) / Fire OS 8 (API 30) sideload compatibility candidate'
  echo 'Distribution: same APK bytes, package ID, signer and update lineage as Android.'
  echo "minSdk=$MIN_SDK targetSdk=$TARGET_SDK"
  echo "package=io.github.mrcalzon02.nutbuster"
  echo "sha256=$(sha256sum "$FIRE" | cut -d' ' -f1)"
  echo 'No runtime Google Play Services dependency found in Android wrapper.'
  echo 'Validation: APK metadata/assets/signature only; real Fire OS tablet install/gameplay unverified.'
  echo 'Amazon Appstore submission is not asserted or performed.'
} > release/publish/FIREOS-COMPATIBILITY.txt
echo 'Fire OS candidate packaging checked; physical Fire OS validation still required.'
