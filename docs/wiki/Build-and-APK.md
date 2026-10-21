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
