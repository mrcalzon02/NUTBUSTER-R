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
**This is a playable prototype, not game parity.** All 1000 authored campaign starting boards and objectives now load from the original game, with partial native blocker mechanics, but boosters, special combinations, elemental effects, complete board transports/hazards, Homestead, Wharf, Fishing, Shop, reward flows, audio and mobile save migration have **not** been fully ported. Native Mines now has its mechanical cart/refinery/equipment economy, but UI presentation, art completeness, day-rollover device testing, gameplay parity and save compatibility still require verification. It is wrong to advertise these as implemented.

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

## Native Butter/Jam compiled acceptance checkpoint

The native preview workflow runs the packaged executable's `--self-test`
on both Windows and Linux, including shop confirmation/cancellation, insufficient
funds, held-nut consumption and V1–V4 save compatibility. On Linux it additionally
runs `--smoke-hold-shop --smoke-render native-hold-shop.bmp` under Xvfb:
this uses the actual SDL3 game, clicks the shop, confirms a 15-gem Butter
purchase, rejects a repeated confirmation, reloads the V4 save, applies the
purchased hold to a real nut, saves/reloads the consumed stock, and captures
the approved-art shop screen. The resulting PNG is retained in the native
preview workflow artifact. This is a CI acceptance *requirement*, not a
claim of successful Windows/Linux execution until the exact-commit jobs pass.
It does not certify physical desktop interaction or full native game parity.

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

## Peanut Butter / Jam held-nut simulation parity (2026-10-27)

The C++17 match engine now carries the mobile source's **Peanut Butter
(1 gravity resolution)** and **Jam (2 gravity resolutions)** counters on
the moving **nut payload**, never the board coordinate. An occupied held
nut splits its current gravity segment, including around irregular/void
columns; only an actual cleared vacancy consumes one remaining drop.
Matched held nuts score **180 instead of 60** before the existing cascade
multiplier (3x), and successful swaps carry the hold with the nut. Invalid,
finished, pinned, void and already-held booster targets do not consume a
simulation use; Jam can upgrade an existing one-drop Butter hold. The
existing stage layout, overlay damage and preview save format remain intact.

`native/generate_hold_fixtures.js` executes the authoritative mobile
`web/engine.js` during CI to produce **15 state-by-state fixtures**.
`nutbuster-hold-parity-test` compares the C++ result after each gravity
step, including a second independent drop, blocked and void segments,
simultaneous holds, refill, invalid targeting and triple-match bonus.
CTest is registered on **both Windows and Linux** in the native preview
workflow. These are functional source parity checks, **not** device or
graphics certification.

**Native desktop hold controls and inventory (2026-10-28):** The SDL3 board now
has separate Peanut Butter and Jam selection buttons with stock counts. A
selected booster applies to the next valid clicked nut and decrements exactly
one owned use only when `Board::applyHold` succeeds; invalid, void, pinned,
finished and already-fully-held targets cannot debit stock. The on-nut number
shows remaining gravity-drop holds. Swaps are suppressed while targeting.
Native preview progress now writes `NUTBUSTER_NATIVE_PREVIEW_V3` with a guarded
`HOLD_STOCK_V1` trailer after the existing `MINE_V2` payload; V1/V2 previews
remain readable and migrate with **zero** hold stock, never free grants. The
existing `--self-test` covers the actual click path, failed/repeated use,
Butter-to-Jam upgrade, V3 stock roundtrip, corrupt-save rejection and V1/V2
migration. The existing JS-vs-C++ held-nut simulation fixtures still cover
one/two gravity resolutions and the ×3 held-match bonus.

**Native confirmed gem hold shop (2026-10-29, verification pending):**
The SDL3 board's HOLD SHOP button opens a native in-window shop (no browser)
with the mobile-authored 15-gem Butter / 30-gem Jam prices, owned quantities,
explicit selection → confirmation, cancellation and insufficient-funds refusal.
A purchase debits exactly once and adds one usable hold to the existing
finite inventory. The approved Peanut and Jam hourglass art are used, not
invented replacement sprites. The separate native gem wallet begins at
the mobile game's **25 gems**; a completed board awards **10 gems** as on
mobile. Mine gems are distinct minerals, not shop money. No free Butter/Jam
stock is granted.

Save format `NUTBUSTER_NATIVE_PREVIEW_V4` appends `GEM_WALLET_V1` after
the V3 `HOLD_STOCK_V1` trailer. V1/V2/V3 previews migrate with zero
hold stock unless V3 already contains stock, and with the original mobile
25-gem starting wallet; later V4 saves persist exact remaining gems and
inventory. Invalid V4 wallet data fails before assigning loaded state.
The actual click/confirm/cancel, insufficient-gem, purchase/use/reload,
V1/V2/V3 migration and corrupt wallet paths are exercised in
`--self-test`. Windows/Linux exact-commit CTest/packaged UI acceptance
must be checked separately; source/test presence is **not** CI success.

**Still missing:** Native in-progress board/hold state is not persisted
between launches (only inventory, wallet, highest unlocked stage and mine).
Full native Shop/boosters, accessibility labels, special-combination parity,
other boosters, mobile save import and device UX acceptance remain outstanding.
This remains **preview-partial**, not a full feature-parity release.

## Native functional UI capture
In addition to the default board and untouched mine, the Linux SDL3 CI job now calls the real mine-screen mouse handler to excavate a seeded non-barren rock. It asserts the strike count decreased and the rock became cleared, then captures `native-mine-dug.png`. It also captures `native-mine-equipment.png` and `native-mine-refinery.png`. Screenshots are evidence of native rendering/input, not evidence of complete feature parity, and the approved ore sprites remain the actual textures.

## Approved equipment illustrations
The SDL3 native equipment tab displays the exact approved 40-tier pickaxe and 40-tier glove artwork from `web/nutvale-mining-gear.js`. The build-time converter reads that authoritative catalog and rejects missing source sprites or missing tiers; tier images are shipped in `data/gear/` as native BMP format alongside the existing 24 ore sprites and 19 nut sprites. No emoji, SVG stand-ins, or hand-selected replacements are used. All five equipment upgrade operations retain their original costs and progression requirements; map/cart/refinery buttons remain text-only until their own correctly assigned icons are added.

## Authoritative campaign import and blocker preview
`native/generate_campaign_levels.js` now executes the existing DOM-free NUTBUSTER match engine **during the native build only**, exporting the full set of 1,000 main-campaign authored stage definitions (move/score targets, ordinary and dual goal counters, irregular board masks, original seeded nut identities, and starting ice/lock/chest/jam/fuse layers) to `data/campaign.tsv`. Node is a **build-time tool only**; no JavaScript runtime, browser, Chromium, Electron or web server is packaged in the desktop game.

`native/src/campaign.cpp` validates all 1,000 stage records on launch and refuses missing, stale-format, or invalid data rather than substituting fabricated score-only stages. The native match engine now honors starting holes, locked/pinned positions, matching neighbors of fixed blockers, source objective values and seeded layouts. Basic damage/layer progression, gravity, jam spread and bomb turn penalties are present; complex specials, elemental reactions, tile-aura expiration, conveyors, portals, wind, and the remaining scripted campaign behaviors are **not fully ported**. Do not call these late-stage boards gameplay-parity certified until the other systems are integrated and compared against JS after actual turns.

Approved ice, chains, chests, jam and bomb sprites are read from their existing PNGs and converted to raw **RGBA with full alpha** (not opaque BMP color flattening). SDL3 uploads the pixels to native textures directly. The authorized PNGs are never modified. This export is a gameplay authority input, not a second, independently authored campaign.

## Authored-layout visual evidence
The Linux SDL3 preview workflow captures `native-board.png`, `native-stage-3.png` and `native-stage-1000.png` using a deliberately named `--preview-stage <level>` developer-only CLI parameter. These prove that the native renderer switches to the correct source-authored starting cells (the images must be different), including blocker layers and late dual-objective labels. Gameplay gaps in the later campaign are still documented above; displaying the correct layout alone does not establish full feature parity.

## Native campaign navigation
The new game-owned **CAMPAIGN** screen displays the approved campaign-overview image, sourced from `web/art/maps/campaign-overview.webp`, and reads the selected level's title, moves and objectives from the exported authoring data. Players can scroll backward or forward within **unlocked** stages and choose `PLAY THIS STAGE`, allowing replay without resetting completed progression. Successful completion advances the highest unlocked stage only if it was the current frontier; replaying a lower stage does not grant arbitrary new levels. This menu is SDL3 native rendering (not browser HTML), and CI captures `native-campaign.png` from the actual renderer.

The existing `NUTBUSTER_NATIVE_PREVIEW_V2` save format continues to store highest unlocked level and mining state. Selected replay stage is session-local. No Android/Fire OS resources or saves are modified.

## Standing four-target development requirement (2026-10-26)
Every future feature affects **Android, Fire OS, Windows and Linux** and must be tracked to the correct implementation. Android/Fire OS share **one** signed APK, while Windows/Linux share **one** native C++ SDL3 implementation. Updating the mobile game does **not** constitute implementing the change on desktops. Use [cross-platform feature parity rules](../docs/wiki/Cross-Platform-Feature-Parity.md) and the source-audited `config/platform-parity.json` ledger. The native pipeline now triggers on **all** mobile gameplay source changes and checks whether the native source was updated or the remaining gap was explicitly reviewed.

Only source-level implementation/test evidence supports ledger statuses. Native full releases remain prohibited while required features are `preview-partial` or `not-ported`. Signed Android/Fire publishing still gates only its own functional and package integrity tests.
