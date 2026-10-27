# NUTBUSTER deployment targets (Android, Fire OS, Windows, Linux)

## One game, four download targets

The authoritative game is the shared `web/` content. Never fork assets, levels, currency icons, mining mechanics, saves or menus merely because the player uses a different platform.

| Distribution | Built artifact | Build entry point | Evidence and limits |
|---|---|---|---|
| Android phone/tablet (API 26+) | `NUTBUSTER-Android-phone-test.apk` | `gradle -p android :app:assembleRelease` with pinned signing material | Android debug build, API26 emulator smoke, signed APK verification; real device UI remains to be checked. |
| Amazon Fire tablets, Fire OS 7/8 (API 28/30) | `NUTBUSTER-FireOS-tablet.apk` | Byte-for-byte copy of the *same signed* Android APK, verified by `scripts/verify_fireos_apk.sh` | No Google Play Services dependence in native wrapper. Google-free API30 tablet emulator smoke is a proxy, **not** actual Fire OS certification. |
| Windows x64 native preview | `NUTBUSTER-Native-Windows-x64-PREVIEW.zip` | `native/CMakeLists.txt` (C++17/SDL3) | Native window, SDL3 sprite rendering, interactive match-three prototype; functional tests. Full campaign parity pending. |
| Linux x64 native preview | `NUTBUSTER-Native-Linux-x64-PREVIEW.zip` | `native/CMakeLists.txt` (C++17/SDL3) | Native Linux window and SDL3 rendering, headless logic tests, real frame capture under Xvfb. Full game parity pending. |

The `NUTBUSTER-FireOS-tablet.apk` download is deliberately the same package bytes as Android: application ID `io.github.mrcalzon02.nutbuster`, pinned NUTBUSTER publisher signer, versionCode, update manifest, and local-save identity. This permits a safe single sideloaded upgrade lineage rather than two conflicting applications. It is a separately labeled *distribution artifact*, not a second code fork, APK flavor, or Amazon Appstore-certified package.

Amazon identifies Fire OS 7 as API 28 and Fire OS 8 as API 30; current `minSdk 26` therefore admits both families but excludes Fire OS 5 (API 22) and 6 (API 25). `targetSdk 36` remains unchanged for the Android release. Check future tablet/API combinations against the [Amazon Fire tablet documentation](https://developer.amazon.com/docs/fire-tablets/fire-os-8.html) and [device filtering guidance](https://developer.amazon.com/docs/app-submission/device-filtering-and-compatibility.html).

The app uses local Android WebView and packaged files, with no Google Mobile Services requirement. The only native network feature is the permission-controlled signed GitHub updater. Do **not** silently substitute Amazon IAP/ads/login or strip the existing user-approved update flow. Amazon Appstore publication is a different channel requiring store policy review, device compatibility, and potentially a store-specific installer/update policy; this change enables APK sideloading only.

## Verification requirements

- On every signed main-branch release: functional game tests; Android APK; byte-identical Fire-named signed APK; signed manifest and SHA-256 remote read-back. Native desktop builds are separate CI PREVIEW artifacts until full-game parity.
- `scripts/verify_fireos_apk.sh` checks equality, package ID, SDK versions, embedded mining/game assets, native Google service dependencies, and the pinned signer. It writes `FIREOS-COMPATIBILITY.txt`, explicitly stating the limitations.
- `fire-tablet-smoke` boots a **Google-free AOSP API30** emulator with 1280x800 tablet resolution, installs the Android APK, launches its main activity, confirms a running foreground process, captures a PNG, and checks for AndroidRuntime crashes. This job reports independently and does not block the existing publisher.
- Before claiming Fire OS fully verified: install on an actual Fire OS 7/8 tablet; confirm offline launch, touch-swipe swap, mining excavation sprites, persistent progress, shop/checkout, sound, orientation, readable tablet layouts, and permissioned update prompts. Run an uninstall/reinstall save-risk evaluation before suggesting cross-channel migration.
- Before claiming native Windows/Linux fully verified: execute the packaged SDL3 application (not a browser), exercise keyboard/mouse input, art and sound, progression, mining, shops, persistent saves, update flow and exit. The first native preview does NOT yet include all required features.

## Release policy

Only functioning game tests block publishing; emulators and cosmetic observations report separately. Do not rewrite or remap approved art, fork game engines, change app IDs/signers or replace UI icons for platform adaptation. Publish no platform-specific success statement until the release and its files can be read back from GitHub.

## Desktop decision: actual native executables

The former Go programs were only HTTP servers opening a browser, and Electron was a Chromium window. Both are excluded from current distribution workflows. The only supported desktop direction is a direct C++17 SDL3 native render path; see [native port status](../../native/README.md). Previews are not falsely published as full-game releases. Android/Fire OS remain unchanged.

## Standing cross-platform development contract
For all future gameplay development, track the feature across **Android, Fire OS, Windows and Linux** in `config/platform-parity.json`. A change to `web/` automatically triggers native desktop checks. Source changes must include a native implementation update or explicit parity-ledger review; unported features remain preview-only. Full desktop publication is blocked while required native areas remain incomplete. See [Cross-platform feature parity](Cross-Platform-Feature-Parity.md) for the executable contract, status definitions and validation commands. Android and Fire OS continue sharing the exact same signed APK and are not held hostage by independent native preview failures.
