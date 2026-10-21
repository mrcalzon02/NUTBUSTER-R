# NUTBUSTER Campaign Maps — Five Chapters, 500 Markers

The six scenic, fullscreen portrait maps are committed independently of their markers. The five chapter background maps contain **zero hard-coded UI, level numbers, markers, prices, or labels**. One overview panorama selects the five chapter maps. This lets us move and rebalance all 500 levels without repainting the artwork.

| Chapter | Levels | Full-screen map | Difficulty intent |
|---|---|---|---|
| 1 — Nutwood Meadows | 1–100 | `web/art/maps/chapter-1-nutwood-meadows.webp` | Gentle introduction and progressive teaching |
| 2 — Peanut Butter Factory | 101–200 | `web/art/maps/chapter-2-peanut-butter-factory.webp` | Reaches normal difficulty ceiling around level 200 |
| 3 — Squirrel Hoard Highlands | 201–300 | `web/art/maps/chapter-3-squirrel-hoard-highlands.webp` | Begins intentionally unfair combinations |
| 4 — Autumn Windmill Vale | 301–400 | `web/art/maps/chapter-4-autumn-windmill-vale.webp` | Extreme constraints and overlapping hazards |
| 5 — Moonlit Golden Palace | 401–500 | `web/art/maps/chapter-5-moonlit-golden-palace.webp` | Ridiculously punitive, all boosters remain free |

## Authoritative data

`web/campaign-maps.js` defines the five chapters and normalized route waypoints, measured relative to the original **941×1672** artwork. `nodes(chapterId)` distributes **exactly 100 nodes at approximately equal IMAGE-PIXEL arclength** along that path. The same algorithm works on the desktop and WebView versions. There are no per-level image files and no hand-placed baked markers. This file is the editable source of truth for board-map paths and chapter assignments.

All level buttons are HTML elements layered over the map art. Each has a stable global ID (1–500), local chapter number (1–100), accessible full level title, and completion/star state. Every twentieth marker and each chapter endpoint receives milestone styling. Distinct challenge, hard, treasure, booster and finale stage types receive CSS overlays using the pre-existing icon pack. The map can be panned vertically and horizontally, and the player can zoom from 70% to 150%. When a chapter opens from gameplay, the view centers on the next playable marker.

`web/art/maps/manifest.json` inventories each optimized runtime image, its SHA-256, and its full-resolution source filename. The generated original artwork is preserved separately from the runtime WebP encoding; the images are **not** atlas sheets and must never be sliced into level buttons.

## Progression and limitations

The existing game save contains `unlocked` and `stars`, and this remains compatible with the earlier 30-level alpha. The engine now accepts IDs 1–500, with progressive move limits and blocker counts. The **first 500 boards are configuration-generated**, not 500 handcrafted or playtested individual puzzles. The shape library still has only eight families; additional blockers, level objectives, and true map balancing remain development tasks. An apparently locked level can be played for free, as always.

Tests: `node tests/campaign-maps.test.js`, `node tests/campaign-ui.test.js`, and the existing engine, audio, interface, and package suites. GitHub Actions compiles the packaged maps into Android and desktop builds; no user-local build is required.

## Map release discipline

When a new map image is produced: archive an image with a stable descriptive name, create a consistent WebP runtime image, record the source and runtime hashes in the manifest, upload the real binary as a Git blob, commit it with path and metadata, read back the main branch and blob identity, then run CI. **Image generation by itself is not a GitHub commit**, and the GitHub workflow cannot automatically access imagery that exists only in a chat. Never claim publication without remote verification.
