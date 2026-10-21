# NUTBUSTER — Completely Free. No, Really.

A nut-themed match-three game satirizing hostile mobile monetization: hearts, premium currencies, rewards, VIP membership, chest timers, friend referrals, extra moves, and absurd bundles **actually grant their rewards for free**, indefinitely. No network, account, ad SDK, payment SDK, purchase screen, or subscription system is included.

## Current alpha

- Shared deterministic match-three engine, 30 generated irregular levels, legal-swap and cascade logic, limited layered blockers, four free boosters, persistent browser/device progress, functional shop and reward claim buttons.
- Primary art is **the original five owner-generated glossy sprite sheets** from this project's design conversation. The sixth, labeled board reference sheet is supplementary only; it is not a replacement for the original art.
- 84 cropped sprites generated from primary art by `tools/prepare_assets.py` (source sheets can be downloaded in the separately provided asset archive). Board geometry uses runtime CSS edges until seamless corner patches are verified.
- Android native wrapper: minSdk **26**, compileSdk **36**, targetSdk **36**, matching verified ReverieVR `app/build.gradle` values as of 2026-10-20.
- Desktop wrapper: Electron; the **same** `web/` game is playable directly in a desktop browser.

## Run / test

`node tests/engine.test.js` runs 600 deterministic level/seed checks without external dependencies.

Open `web/index.html` in a modern browser or run `python3 -m http.server 8000 --directory web` and visit `http://localhost:8000/`. For a desktop application: `cd desktop && npm install && npm start` (downloads Electron from npm). To make an Android debug APK, install JDK 17, Android SDK 36/build-tools and Gradle 9.6.1; `cd android && gradle :app:assembleDebug`. APK output is `android/app/build/outputs/apk/debug/app-debug.apk`. Verify on an API 26 device and a modern Android emulator.

The source includes Gradle wrapper configuration but **not** a generated wrapper JAR. Use a local Gradle 9.6.1 installation to bootstrap a wrapper with `gradle wrapper` if desired. No automated CI workflow is configured.

## Art asset import

To generate the full art pack, copy five original sheet PNGs into `assets/source/` retaining filenames, then run `python -m pip install Pillow` and `python tools/prepare_assets.py`. The build automatically includes any `web/art/primary/` files. Without them, puzzle pieces degrade to readable fallback symbols rather than crashing. **The original sources and generated assets are included in the accompanying downloadable starter ZIP**, but the GitHub connector used for repository writes is text-oriented and cannot presently import those PNGs directly; commit the art binaries from the starter ZIP through normal Git tooling.

See `docs/wiki/Home.md`, `docs/wiki/Build-and-APK.md`, `docs/wiki/Assets-and-Board-Rules.md`, and `docs/wiki/Test-Gates.md`. These are wiki-ready pages in the main repository; the separate GitHub Wiki git repository requires a separate publication step and is **not** claimed to be updated.

## Production scope / known limitations

This alpha is a functional vertical slice, not a final content-complete match-three release. The sampled boards are seeded procedural shapes, not 30 bespoke tuned puzzles. Special nut animation/combinations, diverse objective types, sound design/recorded announcer, aesthetic production HUD, and advanced blockers must be implemented and balance-tested. Currency grants and unlocks are local to each installation. Timer UI and VIP parody do not communicate with any external service.
