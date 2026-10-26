# Native Windows and Linux port

The desktop target is **C++17 + SDL3 native rendering**, NOT Chromium, Electron, WebView, a local web server, or the system browser. Android and Fire OS are unchanged.

## Native preview implemented
- SDL3 game window with sprite rendering, real text and mouse input.
- Deterministic C++ match-three board with adjacent drag/tap swaps, nonmatching moves, cascades, and scoring.
- Native progress file stored separately from Android/browser saves.
- Approved source nut art and all 24 approved Nutvale mining ore sprites converted to BMP during build without changing the originals.
- Native mine rendering, deterministic baseline mineral distribution and excavation interactions.
- Headless C++ gameplay tests and Linux SDL3 frame capture.

## Gaps before a release
**This is a playable prototype, not game parity.** The source JavaScript campaign design book, full stage objectives, boosters, blockers, Homestead, Wharf, Fishing, Shop, reward flows, audio and migration of existing saves have not been ported. Native Mines now has its mechanical cart/refinery/equipment economy, but UI presentation, art completeness, day-rollover device testing, gameplay parity and save compatibility still require verification. It is wrong to advertise these as implemented.

The old Go browser launchers and Electron shell are no longer part of the shipping release pipeline. Native Windows and Linux apps are uploaded as separate CI preview ZIP artifacts. Nothing browser-based is allowed to substitute for full-game native releases.

## Build
Install CMake 3.24+, C++17 compiler, Git, SDL3 build dependencies and Python Pillow.
```sh
python -m pip install Pillow
python native/prepare_assets.py
cmake -S native -B native/build -DCMAKE_BUILD_TYPE=Release
cmake --build native/build --config Release
cmake --install native/build --config Release --prefix native/package
native/package/NUTBUSTER-Linux-x64 --self-test
```
On Windows use `native/package/NUTBUSTER-Windows-x64.exe`. Keep the packaged `data/` directory beside the executable.

## Development order
1. Match JS source rules/objective cases and authored stage data with deterministic parity checks.
2. Native blockers, boosters, elemental features, full native sprite/audio pipeline.
3. Port all Nutvale Mines mechanics, equipment and economy with artwork and save verification.
4. Port Shop, Homestead, Wharf, Fishing, rewards and progression.
5. Native save import, signed updates and installers, plus real Windows and Linux gameplay tests.
6. Publish native desktop releases only after demonstrated feature parity.

Only functional failures gate publication. Never replace the approved sprites with fallback symbols or screenshots.

## Native mine mechanics parity pass (2026-10-26)
The native mine no longer regenerates on opening. A dedicated `mine.hpp/mine.cpp` C++ simulation handles seeded geology (including coal, precious metals, gems, fossils, relics, blasting/lens charges), mining damage, surveys, cart/exposed ore, unloading, refinement, manufacturing, sales, Writs, daily equipment charges and the original mine/cart/refinery/pickaxe/glove upgrade price formulas. The SDL3 mine view now has **EXCAVATE / EQUIPMENT / REFINERY** tabs with working actions and saves on successful mutations. Mining progress is serialized in a guarded `MINE_V2` format beside native preview progression; older `V1` preview unlocked-level saves remain readable.

The native preview deliberately does **not** claim complete port parity: preview mine saves are distinct from mobile saves, and the equipment/visual/sfx/UX still needs the finished-art and interactive parity review. Importing a mobile save has not been implemented. No native real-money transactions, app-store SDKs, or browser runtime are introduced.

`native/generate_mine_fixtures.js` reads the existing JS mining engine to generate independent numeric geology fixtures for every map tier; CI compares these directly to the C++ implementation. `--self-test` now also exercises equipment purchasing, surveys, stored ore, refinery/manufacturing, Writs, blasts, daily reset and native mine save/reload. A failed functional native test blocks **preview ZIP creation**, not unrelated Android signed releases.

## Native functional UI capture
In addition to the default board and untouched mine, the Linux SDL3 CI job now calls the real mine-screen mouse handler to excavate a seeded non-barren rock. It asserts the strike count decreased and the rock became cleared, then captures `native-mine-dug.png`. It also captures `native-mine-equipment.png` and `native-mine-refinery.png`. Screenshots are evidence of native rendering/input, not evidence of complete feature parity, and the approved ore sprites remain the actual textures.

## Approved equipment illustrations
The SDL3 native equipment tab displays the exact approved 40-tier pickaxe and 40-tier glove artwork from `web/nutvale-mining-gear.js`. The build-time converter reads that authoritative catalog and rejects missing source sprites or missing tiers; tier images are shipped in `data/gear/` as native BMP format alongside the existing 24 ore sprites and 19 nut sprites. No emoji, SVG stand-ins, or hand-selected replacements are used. All five equipment upgrade operations retain their original costs and progression requirements; map/cart/refinery buttons remain text-only until their own correctly assigned icons are added.

## Authoritative campaign import and blocker preview
`native/generate_campaign_levels.js` now executes the existing DOM-free NUTBUSTER match engine **during the native build only**, exporting the full set of 1,000 main-campaign authored stage definitions (move/score targets, ordinary and dual goal counters, irregular board masks, original seeded nut identities, and starting ice/lock/chest/jam/fuse layers) to `data/campaign.tsv`. Node is a **build-time tool only**; no JavaScript runtime, browser, Chromium, Electron or web server is packaged in the desktop game.

`native/src/campaign.cpp` validates all 1,000 stage records on launch and refuses missing, stale-format, or invalid data rather than substituting fabricated score-only stages. The native match engine now honors starting holes, locked/pinned positions, matching neighbors of fixed blockers, source objective values and seeded layouts. Basic damage/layer progression, gravity, jam spread and bomb turn penalties are present; complex specials, elemental reactions, tile-aura expiration, conveyors, portals, wind, and the remaining scripted campaign behaviors are **not fully ported**. Do not call these late-stage boards gameplay-parity certified until the other systems are integrated and compared against JS after actual turns.

Approved ice, chains, chests, jam and bomb sprites are read from their existing PNGs and converted to raw **RGBA with full alpha** (not opaque BMP color flattening). SDL3 uploads the pixels to native textures directly. The authorized PNGs are never modified. This export is a gameplay authority input, not a second, independently authored campaign.
