# Build and APK environment

## Compatibility

Verified reference: `mrcalzon02/ReverieVR/app/build.gradle`: `minSdk = 26`, `targetSdk = 36`, `compileSdk = 36`. Nutbuster uses the same API boundaries but not the VR-specific NDK and sensors.

## Android

1. Install JDK 17, Android SDK Platform 36/build-tools, Gradle 9.6.1 and accept SDK licenses.
2. Import the five original PNG sheets into `assets/source`, run `python tools/prepare_assets.py` with Pillow installed. Confirm sprite manifest contains 84 primary entries.
3. From `android/`, run `gradle :app:assembleDebug`.
4. Inspect `app/build/outputs/apk/debug/app-debug.apk` and install using `adb install -r`.
5. Run tests on Android 8.0 (API 26), on the current Android emulator, on narrow phone portrait, wider tablet landscape, and with device connectivity disabled.

No `INTERNET` permission or payment/ads libraries are present. Android WebView loads `file:///android_asset/index.html` and blocks network loads. JavaScript is required, and local DOM storage saves game progress.

## Desktop

`node tests/engine.test.js` for engine verification; `python3 -m http.server 8000 --directory web` for local browser; `cd desktop && npm install && npm start` to run equivalent Electron app. `npm run dist` is a packaging option; ensure packaging includes sibling `web/` files. Installer builds are not verified by the source-only smoke tests.

## Failure policy

Do not label an APK as built or an installer released without artifact read-back, install/launch, and on-device menu/game/store checks. Do not add GitHub Actions by default. If a connector write fails, retry boundedly and inspect remote commit evidence.


## GitHub Actions build and updater (2026-10-20)

`.github/workflows/build-and-release.yml` runs game/audio/asset/update-contract tests, packages a debug Android 26–36 APK and Windows/Linux executables, tests the Linux executable on localhost, then runs an Android 26 emulator install/launch smoke test. Workflow artifacts can be downloaded on the Actions run page regardless of signing readiness. These builds are not claimed as installed on the owner's personal devices.

The signed phone-test release gate **reuses ReverieVR's four existing secret names and actual publisher certificate**. GitHub repository secrets are scoped per repository; source access alone cannot read/copy them. The owner must provision NUTBUSTER-R with the same secret *values* stored in ReverieVR's ignored `.local/reverievr-signing/github-secrets.txt`. Use:

```powershell
# Windows PowerShell, from the Nutbuster checkout, with gh logged in:
.\scripts\copy-reverie-signing-to-nutbuster.ps1 -ReverieRoot 'C:\PATH\TO\ReverieVR' -TriggerBuild
```

Never generate a replacement signing key, expose the secrets in logs, or commit the ignored ReverieVR key file. The workflow verifies the resulting APK against the derived certificate SHA-256 and refuses mismatches. If secrets are absent, the unsigned (debug-key-signed) test artifact remains available but **there is no signed update release**. Do not silently replace the key or tell users debug builds will upgrade in place to the publisher line.

Published tags use `nutbuster-phone-test-RUN-ATTEMPT`; the release contains `NUTBUSTER-Android-phone-test.apk` plus desktop executables, notes containing the exact Android versionCode and certificate fingerprint, GitHub-provided SHA-256 asset digests, SHA256SUMS, and verification evidence. The Android in-app Check for Updates button calls native code only when explicitly pressed, downloads from this repository's HTTPS GitHub Releases endpoint, verifies digest + package/version/signer, and presents Android's user-approved installer. This is the same *verified signed GitHub-release approach* as ReverieVR's phone-test updater, not a transplant of its entire hub/module catalog. Regular play, audio and saves work without any network access.

No release is considered proven until Actions and the remote GitHub release both report successful completed and verified artifacts.
