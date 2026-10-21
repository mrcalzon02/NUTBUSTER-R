# NUTBUSTER — Premium Mobile Monetization Satire

NUTBUSTER is an offline-first, nut-themed match-three parody of predatory mobile monetization. The **player-facing fiction** sells exclusive bundles, hearts, gems, VIP status, and absurdly urgent offers as though purchases are inevitable. The joke must not be spoiled in onboarding or ordinary store copy: tapping BUY leads through a fictional offer review to a final checkout whose total is **FREE / $0.00**. All rewards are delivered without real payment. The app must not collect billing information or integrate purchase, advertising, tracking, or subscription SDKs.

## Current alpha

- **Nutvale Homestead:** persistent 12-plot estate editor, 28 decoration collectibles, 8 avatar personas, 11 trophy-cabinet achievements, best-score records, and an absurd Royal Manor cosmetic checkout that reveals a final $0.00 total. The estate shares campaign save data and runs offline on every game wrapper.
- Shared deterministic match-three engine and 500 seeded level configurations, including a 4×5 to 8×9 board progression, non-matching legal swaps, per-nut gravity/cascade traces, blocker layers, four usable boosters, persistent browser/device progress, satirical two-stage checkout, distinct victory/loss screens, and reward claims.
- Primary art is **the original five owner-generated glossy sprite sheets** from this project's design conversation. The sixth, labeled board reference sheet is supplementary only; it is not a replacement for the original art.
- 84 cropped sprites generated from primary art by `tools/prepare_assets.py` (source sheets can be downloaded in the separately provided asset archive). Board geometry uses runtime CSS edges until seamless corner patches are verified.
- Android native wrapper: minSdk **26**, compileSdk **36**, targetSdk **36**, matching verified ReverieVR `app/build.gradle` values as of 2026-10-20.
- Desktop wrapper: a self-contained Go Windows/Linux launcher serving the **same** embedded `web/` game offline in the user’s default browser. An optional Electron shell also exists.

## Run / test

Run `node tests/homestead.test.js` and `node tests/homestead-ui.test.js` for estate persistence, cosmetics, achievement gating, and the two-stage $0.00 premium order. Run `node tests/engine.test.js` for 2,500 deterministic level/seed cases, including 2,500 scoring swaps, 2,500 non-matching swaps, and recorded fall-trace verification. Run `node tests/ui.test.js` for a dependency-free mocked-DOM smoke test of checkout, stable board rendering, match animation plumbing, and dedicated win/loss screens. These checks do not substitute for an actual Android/device rendering test.

Open `web/index.html` in a modern browser or run `python3 -m http.server 8000 --directory web` and visit `http://localhost:8000/`. For a desktop application: `cd desktop && npm install && npm start` (downloads Electron from npm). To make an Android debug APK, install JDK 17, Android SDK 36/build-tools and Gradle 9.6.1; `cd android && gradle :app:assembleDebug`. APK output is `android/app/build/outputs/apk/debug/app-debug.apk`. Verify on an API 26 device and a modern Android emulator.

The source includes Gradle wrapper configuration but not the wrapper JAR. Local builds can use installed Gradle 9.6.1; **GitHub Actions now provisions Gradle 9.6.1, SDK 36, JDK 17 and the build requirements automatically**. See `.github/workflows/build-and-release.yml`. Every main-branch push produces debug APK and Windows/Linux desktop artifacts, and attempts an Android API-26 emulator launch test. Signed APK publication requires the exact existing ReverieVR publisher secrets, which must be explicitly shared to this repository; absent secrets, the workflow warns and does not publish a falsely signed release. The native Android app checks for signed GitHub releases on startup and on level entry (rate-limited to once per hour while the app is running); Settings also provides an explicit Check for Updates button. Discovery never authorizes a download. A newer verified release triggers a **Download?** prompt; after downloading and verifying SHA-256, package ID, increasing version code, and pinned publisher certificate, a separate **Install?** prompt is shown before launching the Android installer for its own approval. Debug builds are not in the signed update lineage. The Windows executable opens an offline local web server in the default browser.

## Invitations, local progress, and account policy

Players can select **INVITE FRIENDS** from the home screen, Nutvale Homestead, or Settings. Android uses the system's share chooser to send the public [NUTBUSTER releases page](https://github.com/mrcalzon02/NUTBUSTER-R/releases) to compatible installed apps; web/desktop uses Web Share or a copy-link fallback. Sending an invitation does not require Facebook login, contacts access, social IDs, or a new service. Receiving players must choose, download, and install the release themselves; the invitation is not multiplayer.

Progress, avatar selection, homestead inventory, and earned prestige are stored on the current installation. There is no NUTBUSTER cloud saving, linked account identity, or cross-device syncing. Android automatic backup is disabled. GitHub receives ordinary network request metadata when an update check is made, and the chosen social network receives any link the player explicitly shares.

Later social profiles/prestige plates may use privacy-reviewed **read-only, self-contained share links** hosted by a static page rather than a player database. See `docs/wiki/Social-and-Prestige-Sharing.md`.

## Audio library

The owner-supplied [Drive Sounds / NUTBUSTER](https://drive.google.com/drive/folders/1IwvPgWwzabBliPODifPDdT61WqJhfmxu) folder has been imported as 15 voice/reaction clips plus one optimized MP3 music loop. The original full-resolution music remains in Drive; all runtime audio is local under `web/audio/`. Music and announcer audio use independent controls, and gameplay captions remain visible with sound off. `node tests/audio.test.js` validates 16 SHA-256 digests and simulated playback. See `docs/wiki/Audio-Pipeline.md`.

## Art asset import

To generate the full art pack, copy five original sheet PNGs into `assets/source/` retaining filenames, then run `python -m pip install Pillow` and `python tools/prepare_assets.py`. The build automatically includes any `web/art/primary/` files. Without them, puzzle pieces degrade to readable fallback symbols rather than crashing. **The original full-resolution sources and 84 generated assets are included in the accompanying starter ZIP. The GitHub repository also includes 34 compact 96-pixel variants** from those primary sheets so the core game renders the actual art immediately. Import the full-res PNGs and regenerate when production-ready.

See `docs/wiki/Home.md`, `docs/wiki/Nutvale-Homestead.md`, `docs/wiki/Build-and-APK.md`, `docs/wiki/Assets-and-Board-Rules.md`, and `docs/wiki/Test-Gates.md`. These are wiki-ready pages in the main repository; the separate GitHub Wiki git repository requires a separate publication step and is **not** claimed to be updated.

## Production scope / known limitations

This alpha is a functional vertical slice, not a final content-complete match-three release. The boards are seeded procedural shapes, not 500 bespoke tuned puzzles. Special nut combinations, diverse objective types, advanced blockers, and device-specific animation and layout quality still require implementation or balance testing. Currency grants and unlocks are local to each installation. The three-hour chest tracks a local cooldown, while immediate opening remains accessible. VIP and currency remain offline. Final checkout reveals a zero-dollar price; no payment credentials are requested.
