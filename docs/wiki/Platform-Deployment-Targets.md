# NUTBUSTER deployment targets (Android, Fire OS, Windows, Linux)

## One game, four download targets

The authoritative game is the shared `web/` content. Never fork assets, levels, currency icons, mining mechanics, saves or menus merely because the player uses a different platform.

| Distribution | Built artifact | Build entry point | Evidence and limits |
|---|---|---|---|
| Android phone/tablet (API 26+) | `NUTBUSTER-Android-phone-test.apk` | `gradle -p android :app:assembleRelease` with pinned signing material | Android debug build, API26 emulator smoke, signed APK verification; real device UI remains to be checked. |
| Amazon Fire tablets, Fire OS 7/8 (API 28/30) | `NUTBUSTER-FireOS-tablet.apk` | Byte-for-byte copy of the *same signed* Android APK, verified by `scripts/verify_fireos_apk.sh` | No Google Play Services dependence in native wrapper. Google-free API30 tablet emulator smoke is a proxy, **not** actual Fire OS certification. |
| Windows x64 | `NUTBUSTER-Windows-x64.exe` | `tools/build_desktop_launchers.sh` (Go) | CI builds the self-contained launcher. Windows interactive launch remains hardware validation. |
| Linux x64 | `NUTBUSTER-Linux-x64` | `tools/build_desktop_launchers.sh` (Go) | CI builds, starts the launcher, and checks HTTP route and packaged files. Desktop opens the system's default browser. |

The `NUTBUSTER-FireOS-tablet.apk` download is deliberately the same package bytes as Android: application ID `io.github.mrcalzon02.nutbuster`, pinned NUTBUSTER publisher signer, versionCode, update manifest, and local-save identity. This permits a safe single sideloaded upgrade lineage rather than two conflicting applications. It is a separately labeled *distribution artifact*, not a second code fork, APK flavor, or Amazon Appstore-certified package.

Amazon identifies Fire OS 7 as API 28 and Fire OS 8 as API 30; current `minSdk 26` therefore admits both families but excludes Fire OS 5 (API 22) and 6 (API 25). `targetSdk 36` remains unchanged for the Android release. Check future tablet/API combinations against the [Amazon Fire tablet documentation](https://developer.amazon.com/docs/fire-tablets/fire-os-8.html) and [device filtering guidance](https://developer.amazon.com/docs/app-submission/device-filtering-and-compatibility.html).

The app uses local Android WebView and packaged files, with no Google Mobile Services requirement. The only native network feature is the permission-controlled signed GitHub updater. Do **not** silently substitute Amazon IAP/ads/login or strip the existing user-approved update flow. Amazon Appstore publication is a different channel requiring store policy review, device compatibility, and potentially a store-specific installer/update policy; this change enables APK sideloading only.

## Verification requirements

- On every main-branch release: functional game tests; the original Android signed APK; the Fire-named byte-identical signed APK; Windows/Linux desktop files; signed manifest and full SHA-256 remote release read-back.
- `scripts/verify_fireos_apk.sh` checks equality, package ID, SDK versions, embedded mining/game assets, native Google service dependencies, and the pinned signer. It writes `FIREOS-COMPATIBILITY.txt`, explicitly stating the limitations.
- `fire-tablet-smoke` boots a **Google-free AOSP API30** emulator with 1280x800 tablet resolution, installs the Android APK, launches its main activity, confirms a running foreground process, captures a PNG, and checks for AndroidRuntime crashes. This job reports independently and does not block the existing publisher.
- Before claiming Fire OS fully verified: install on an actual Fire OS 7/8 tablet; confirm offline launch, touch-swipe swap, mining excavation sprites, persistent progress, shop/checkout, sound, orientation, readable tablet layouts, and permissioned update prompts. Run an uninstall/reinstall save-risk evaluation before suggesting cross-channel migration.
- Before claiming Windows fully verified: launch EXE on Windows, test input, persistence and exit. Before claiming Linux fully verified: repeat using downloaded Linux binary outside CI.

## Release policy

Only functioning game tests block publishing; emulators and cosmetic observations report separately. Do not rewrite or remap approved art, fork game engines, change app IDs/signers or replace UI icons for platform adaptation. Publish no platform-specific success statement until the release and its files can be read back from GitHub.
