# Nutravaganza — Fishing and Waterfront Art Production Ledger

Status: **design and production backlog**, not a claim that the assets below exist. Art inventory reviewed against `web/art/primary/nuts/expansion-v2-manifest.json`, `web/art/homestead/manifest.json`, and the fishing model in `web/fishing.js`.

## Art direction and invariants

Maintain the existing hand-painted, cheekily luxurious Nutbuster/Nutvale illustrated atlas style, coordinated with the existing 40 house tiers and established avatars. Fish are animals, **the main Nutvale avatar remains human**; no replacement squirrel protagonist. Produce clean RGBA / transparent WebP or PNG sprites with all fins, tails, rods, highlights, hooks, and shadows comfortably inside canvas bounds. No straight-line clipping, no accidental opaque white background. Include enough negative space for turns and strikes. Verify alpha bounds and mobile-scale silhouettes, not merely that files exist.

Use source atlas → approved sprite bounding boxes → individually isolated named files → manifest entries (source SHA, output SHA, dimensions, alpha bounds) → phone-scale gameplay review → tests. Original source art and game-ready sprites must remain traceable. Avoid emoji as final game art; current icons and fish glyphs are **working placeholders**.

## Critical gameplay art (P0)

| ID | Asset | Pieces / variations | Role and suggested path |
|---|---|---|---|
| NUTRA-ART-001 | Nutvale waterfront establishing illustration | Daylight wharf, pier, Moonnut Lake shore, shop counter, signage | `web/art/fishing/scenes/wharf-*.webp` |
| NUTRA-ART-002 | Fishing tackle and interaction props | Wooden pier foreground, bobber/hook, rod tip, line, water wake, cast splash, lure, crossed-line warning | `web/art/fishing/tackle/` |
| NUTRA-ART-003 | Fish species sprite atlases | 12 species × readable side view, opposite direction, catch portrait | `web/art/fishing/fish/<id>/` |
| NUTRA-ART-004 | Fishing action frames | Species-specific swim cycle (4–8 frames), struggle / dart (3–5), hooked / landed, escape reaction | `web/art/fishing/fish/<id>/` |
| NUTRA-ART-005 | Active catch HUD | Hook tracking cursor, fish tracking cursor, tension meter, tension warning, progress indicator, slack effect | `web/art/fishing/ui/` |
| NUTRA-ART-006 | Aquarium environment | Glass walls, illuminated backdrop, water caustics, substrate, front framing, reflections | `web/art/fishing/aquarium/` |
| NUTRA-ART-007 | Aquarium motion effects | Bubbles, filtered light rays, floating particles, drift, surface shimmer | `web/art/fishing/aquarium/fx/` |

### Twelve confirmed fish identities

| Fish ID | In-game name | Personality and silhouette |
|---|---|---|
| `minnow` | Penny Minnow | Small streamlined silver fish; fast and unpretentious |
| `bluegill` | Bluegill Baron | Blue-gold round sunfish and oversized social-climber expression |
| `perch` | Gilded Perch | Golden barred fins; self-satisfied collector's trophy |
| `carp` | Dividend Carp | Plump ornamental carp with a comically respectable face |
| `trout` | Rainbow Trout | Spotted iridescent body with pronounced tail |
| `bass` | Bigmouth Bass | Comically enormous mouth, energetic dark-green body |
| `catfish` | Tax Haven Catfish | Whiskers, broad head, pompous treasure-keeper demeanor |
| `koi` | Royal Koi | Red/white/black patterns, flowing elegant fins |
| `puffer` | Inflation Puffer | Distinct inflated and ordinary states, round silhouette |
| `eel` | Electric Eel | Long snaking profile, electric-blue glimmers |
| `sturgeon` | Imperial Sturgeon | Long armored body, stately underbite |
| `leviathan` | Nutvale Leviathan | Mythic rare specimen with dramatic ornamental fins; still fits the tank art scale |

## Equipment, progression and estate art (P1)

| ID | Asset | Pieces / variations |
|---|---|---|
| NUTRA-ART-008 | Rod upgrade ladder | Six rod sprites (tiers 0–5), with increasingly gaudy metalwork and polished reel |
| NUTRA-ART-009 | Bait icons and materials | Honest Worm, Glitter Grub, Royal Roe, bait containers and upgrade cues |
| NUTRA-ART-010 | Aquarium upgrade ladder | 11 visually distinct frames/capacities, baseline tier 0 through tier 10; reusable modular tank frame |
| NUTRA-ART-011 | Aquarium residents' furniture | Coral, stones, driftwood, plants, castle, treasure chest, bubbling ornaments (each separate and placeable-ready) |
| NUTRA-ART-012 | Nutvale Dollars | Distinct N$ banknote/coin icon, bill stacks, wallet badge, sale sparkle; **not** Golden Nuts or gems |
| NUTRA-ART-013 | Estate integration | Wharf entrance/shoreline structure, standalone estate aquarium building, tackle-shop placard |
| NUTRA-ART-014 | Catch/reward presentation | Catch rarity frames, specimen portraits, record-size ribbon, sale stamp, escaped-line feedback |
| NUTRA-ART-015 | Collectible progression | Fish-collection book badges, achievement trophy, trophy fish wall plaque |
| NUTRA-ART-016 | Fishing environmental variants | Early morning, noon, dusk, moonlit reflection variants for background layer (optional only, no asset download) |

## Nut expansion inventory — **already produced**

The existing **12 transparent 192×192** regular match-nut sprite assets and their atlas manifest are present under `web/art/primary/nuts`: `beechnut`, `brazil-nut`, `candlenut`, `chestnut`, `coconut`, `ginkgo-nut`, `hickory-nut`, `macadamia`, `pecan`, `pili-nut`, `pine-nut`, `tiger-nut`.

These are **reuse/verification**, not a request to draw 12 replacements. Remaining work for nuts is unlock-reveal FX, rare/elemental nut identities only after the matching art is actually approved, and phone-scale verification. New standard nuts must have distinct readable silhouettes and never duplicate a palette identity indistinguishably.

## Production packaging gate

1. Generate concept sheets individually by category, then approve crop regions on original atlas before slicing.
2. Output transparencies and check nonempty alpha pixels, fully contained bounding boxes, sprite frame consistency and file presence against manifest.
3. Hook sprite IDs to the `FISH` and `BAITS` tables without changing saved IDs. For motion, animate frames rather than stretching static fish portrait images.
4. Verify fish inside the actual aquarium at 320px, 390px, and desktop widths. Ensure every creature stays within glass bounds and rotates correctly.
5. Verify fishing overlay and HUD layers at Android portrait/landscape and desktop, including reduced-motion alternatives.
6. Only call an asset finished when source atlas, slices, manifest, app references, and runtime display are verified.

## Intended integration boundaries

- `web/fishing.js`: authoritative fishing/bait/currency state, no art dependency.
- `web/fishing-ui.js`: current functional UI; swap visual placeholders for authored assets with exact names after production.
- `web/fishing.css`: wharf/tank animation and responsive rendering.
- Existing Homestead houses and backyard garden art remain untouched unless the named waterfront building is being added.
- Keep all asset production and wiring inside Nutbuster; do not modify other projects or repositories.
