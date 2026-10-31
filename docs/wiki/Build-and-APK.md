# Build and APK environment

## Compatibility

Verified reference: `mrcalzon02/ReverieVR/app/build.gradle`: `minSdk = 26`, `targetSdk = 36`, `compileSdk = 36`. Nutbuster uses the same API boundaries but not the VR-specific NDK and sensors.

## Android

1. Install JDK 17, Android SDK Platform 36/build-tools, Gradle 9.6.1 and accept SDK licenses.
2. Import the five original PNG sheets into `assets/source`, run `python tools/prepare_assets.py` with Pillow installed. Confirm sprite manifest contains 84 primary entries.
3. From `android/`, run `gradle :app:assembleDebug`.
4. Inspect `app/build/outputs/apk/debug/app-debug.apk` and install using `adb install -r`.
5. Run tests on Android 8.0 (API 26), on the current Android emulator, on narrow phone portrait, wider tablet landscape, and with device connectivity disabled.

The Android manifest does not declare `INTERNET` or `REQUEST_INSTALL_PACKAGES`: gameplay and saves are offline, and update downloads occur only through the external browser after a deliberate tap. No payment, ads, social-login, contacts or account libraries are in the Android wrapper. The in-app WebView loads `file:///android_asset/index.html` and blocks network requests. JavaScript is required, and local DOM storage saves game progress.

## Desktop

Native Windows and Linux use C++17 with SDL3 windows and direct sprite rendering, never Chromium, Electron, WebView or a browser launcher. See [native port build instructions](../../native/README.md). The old Go server and Electron prototype must not be distributed.

## Failure policy

Do not label an APK as built or an installer released without artifact read-back, install/launch, and on-device menu/game/store checks. Do not add GitHub Actions by default. If a connector write fails, retry boundedly and inspect remote commit evidence.


## GitHub Actions build and updater (2026-10-20)

`.github/workflows/build-and-release.yml` runs game/audio/asset/update-contract tests, packages a debug Android 26–36 APK and runs Android emulator install/launch tests. The separate native SDL3 workflow builds Windows/Linux preview applications and performs native gameplay tests and framebuffer capture. Workflow artifacts can be downloaded on the Actions run page regardless of signing readiness. These builds are not claimed as installed on the owner's personal devices.

The signed phone-test release gate **reuses ReverieVR's four existing secret names and actual publisher certificate**. GitHub repository secrets are scoped per repository; source access alone cannot read/copy them. The owner must provision NUTBUSTER-R with the same secret *values* stored in ReverieVR's ignored `.local/reverievr-signing/github-secrets.txt`. Use:

```powershell
# Windows PowerShell, from the Nutbuster checkout, with gh logged in:
.\scripts\copy-reverie-signing-to-nutbuster.ps1 -ReverieRoot 'C:\PATH\TO\ReverieVR' -TriggerBuild
```

Never generate a replacement signing key, expose the secrets in logs, or commit the ignored ReverieVR key file. The workflow verifies the resulting APK against the derived certificate SHA-256 and refuses mismatches. If secrets are absent, the unsigned (debug-key-signed) test artifact remains available but **there is no signed update release**. Do not silently replace the key or tell users debug builds will upgrade in place to the publisher line.

Published tags use `nutbuster-phone-test-RUN-ATTEMPT`; the signed release includes identically signed Android/Fire OS APKs, release notes with versionCode and certificate fingerprint, GitHub SHA-256 digests, `SHA256SUMS.txt`, and build evidence. **No update manifest or APK installer service is packaged or published.** The Settings button now simply opens https://github.com/mrcalzon02/NUTBUSTER-R/releases in the external browser after a user tap. Choose the newest published release (including prereleases), download `NUTBUSTER-Android-phone-test.apk`, and use Android's own Downloads/files UI to install it over the existing app. The pinned signer and monotonically increasing versionCode protect in-place upgrade compatibility; the game does not verify the external browser download itself. Do not uninstall a version holding valuable local saves. The game never checks GitHub in the background, accesses the network itself, asks for unknown-source installation privileges, or launches an APK installer. Normal Android/browser safeguards remain in place; users must not disable Play Protect. Invitations use Android's native share chooser without contacts permission.

No release is considered proven until Actions and the remote GitHub release both report successful completed and verified artifacts.
