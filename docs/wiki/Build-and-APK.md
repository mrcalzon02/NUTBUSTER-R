# Build and APK environment

## Compatibility

Verified reference: `mrcalzon02/ReverieVR/app/build.gradle`: `minSdk = 26`, `targetSdk = 36`, `compileSdk = 36`. Nutbuster uses the same API boundaries but not the VR-specific NDK and sensors.

## Android

1. Install JDK 17, Android SDK Platform 36/build-tools, Gradle 9.6.1 and accept SDK licenses.
2. Import the five original PNG sheets into `assets/source`, run `python tools/prepare_assets.py` with Pillow installed. Confirm sprite manifest contains 84 primary entries.
3. From `android/`, run `gradle :app:assembleDebug`.
4. Inspect `app/build/outputs/apk/debug/app-debug.apk` and install using `adb install -r`.
5. Run tests on Android 8.0 (API 26), on the current Android emulator, on narrow phone portrait, wider tablet landscape, and with device connectivity disabled.

The Android manifest contains `INTERNET` solely for native signed update checks; the WebView blocks network requests and no payment, ads, social-login, contacts or account libraries are present. Android WebView loads `file:///android_asset/index.html` and blocks network loads. JavaScript is required, and local DOM storage saves game progress.

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

Published tags use `nutbuster-phone-test-RUN-ATTEMPT`; the release contains `NUTBUSTER-Android-phone-test.apk` plus desktop executables, notes containing the exact Android versionCode and certificate fingerprint, GitHub-provided SHA-256 asset digests, SHA256SUMS, and verification evidence. The Android in-app Check for Updates button remains available in Settings. Native background checks also occur on boot and at level entry, at most once per hour per running app session. Detection never starts a download. When a newer signed release is found, the app offers an explicit `Download`/`Later` dialog. Only after `Download` does the native worker retrieve the APK and verify digest, size, package ID, increasing version code and publisher signer. It then offers a separate `Install`/`Later` dialog; only `Install` opens Android's own user-approved installer. If unknown-app install permission is missing, Android Settings is shown, not a silent install. Declined automatic offers are not repeated continuously during that session, though manual checks can prompt again. This is the same *verified signed GitHub-release approach* as ReverieVR's phone-test updater, not a transplant of its entire hub/module catalog. Regular play, audio and saves work without any network access. The automatic checker silently ignores network failure; manual requests expose an error status. This network use exposes normal connection metadata to GitHub and must be disclosed appropriately. Android cloud auto-backup is disabled; no NUTBUSTER server exists to sync progress. Invitations invoke Android's native text-sharing chooser, with no contact or Facebook permission.

No release is considered proven until Actions and the remote GitHub release both report successful completed and verified artifacts.
