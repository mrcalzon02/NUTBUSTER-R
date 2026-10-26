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
**This is a playable prototype, not game parity.** The source JavaScript campaign design book, full stage objectives, boosters, blockers, detailed mines economy/cart/refinery/upgrades, Homestead, Wharf, Fishing, Shop, reward flows, audio and migration of existing saves have not been ported. It is wrong to advertise these as implemented.

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
