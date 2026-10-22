# Elemental Nut Rules and Nut Index

## Status
The approved first 3x5 artwork provides 15 elemental variants, available as transparent 192x192 PNG assets. The rejected second 8x5 sheet is not in use. Elemental gameplay is **not enabled**: the Nut Index presents the following as proposed rules, never as mechanics already functioning.

## Shared activation contract
An elemental variant retains its underlying ordinary color for matching. When its nut is finally removed, after any shielding is cleared, its ability activates once. Resolve effects in deterministic cell order; never trigger from merely damaging a shield. Hazards and new effects require visible icons, accessible descriptions and tests before being enabled.

| Variant | Proposed distinct ability |
|---|---|
| Fire | Damage one surface layer on each orthogonal neighbor |
| Ice | Freeze two adjacent movable pieces for one turn |
| Water | Wash sticky butter from its row |
| Earth | Strike three nearby cells in its column |
| Wind | Rotate three movable nut payloads without moving fixed obstacles |
| Lightning | Chain to three nuts of the underlying color |
| Nature | Clean one adjacent butter layer; refund a move if successful |
| Poison | Mark two adjacent cells that become sticky next turn |
| Radiance | Clean the nearest three hostile statuses, prioritizing butter |
| Shadow | Protect one visible target from automatic effects for one turn |
| Crystal | Store a charge and grant a bonus on the next scoring cascade |
| Magma | Strike a column again after the subsequent gravity shift |
| Frost | Create a one-hit ice shell on a nearby unshielded nut |
| Storm | Fork to five nuts prioritizing separate rows and columns |
| Arcane | Recolor two adjacent ordinary nuts to the activated color |

## Live rules explained in the index
Ice blocks are immovable two-layer replacement pieces. Chained walnuts cannot swap, fall or be transported until unlocked. Treasure chests are immovable two-hit replacement pieces. Matching beside any of these damages a layer. Butter absorbs a hit before other shields and spreads every third move. Timed acorns expire for a penalty of two moves. A master key removes all chain layers even under butter. Special matches make rockets, blasts and rainbow nuts.

Conveyors rotate payloads beginning at level 125, portals exchange payloads at 164, and wind tunnels begin at 301. Tile statuses stay in their cells while whole-piece blockers interrupt transport. Void cells and occupied whole-piece blockers break gravity into segments. Rock and crate images are present but are not active blockers.

Current core nut identities: 19 registry entries, with one retired closed-pistachio lookalike. Eleven approved expansion varieties enter progressively from level 15; the elemental family remains preview-only.

## Evidence and follow-up
The existing engine passed 14 focused behavioral checks for layered ice, chains, butter, timed acorns, portal movement, wind, and animation planning. The new automated test checks the index status labels and sprite-file contract as well as actual engine behavior. Elemental effects and Android index UX are not certified or enabled yet.

The source atlas is retained in the Nutbuster Google Drive folder at https://drive.google.com/file/d/13lBWifXqDQuD34WjVLLi-IjkQcBR07UZ/view . To re-slice, save it as assets/source/expansion/elemental-nuts-3x5.png and run python tools/slice_elemental_3x5.py.

## Canonical split: special nut replacements and tile effects (2026-10-22)

The source illustrated `ice-1.png`, `ice-2.png`, `chain-1.png`, `chain-2.png` and `chest.png` are **whole-piece replacements**. They must not be composited over arbitrary nuts as if they were status icons. Ice and chest conceal an ordinary nut; the original chain art is specifically a locked **walnut**, so unlocking reveals a walnut. Until their last layer is broken, all these pieces are *anchored*: they cannot be swapped, matched as an ordinary type, gravity-dropped, conveyed or transported through a portal or wind lane. Match an orthogonally adjacent group of three to hit a neighboring blocker once per cascade stage; matching special attacks and tactical tools can directly strike their square. A Master Key removes all locked walnuts. For solvability, initial whole-piece blockers occupy at most 38% of usable board positions.

The upcoming **tile status** atlas belongs to a different layer: jam/sticky butter, timed fuses, future status effects, and other square-attached mechanics. Status effects may remain when nut payloads move. Do not substitute or overwrite the reserved original replacement-nut art with the new tile-overlay icons until the new sprite assets are committed and validated.

### Elemental Nut Chain — proposed system (not yet active)

The approved fifteen elemental nut sprites form a separate *whole-nut power family*, each with an underlying match color. A fully destroyed elemental nut releases its named power once, and may trigger a second elemental nut only if the first power **actually destroys** it. Shield damage, purely cosmetic effects, tile-status changes and moving an unbroken elemental nut do not count. Process activations in deterministic cell order with one activation per nut per resolution, never unbounded loops. Proposed demonstrable chain: **Fire → Lightning → Storm**, provided Fire actually destroys an adjacent exposed Lightning nut and Lightning destroys a same-color Storm nut; Storm can then fork to additional targets. An **Earth → Magma → Storm** assault chain is possible under the same destroyed-nut conditions. **Water + Nature + Radiance** is a recovery *synergy*, not an activation chain, because cleansing a tile status does not destroy another elemental nut. The exact elemental effects, activation targets and unlock progression remain design-only pending implementation and live test coverage. The Nutdex identifies all fifteen as **PREVIEW**, never LIVE.

## Tile status overlay sprites — verified import (2026-10-22)

The new 4×4 transparent effects atlas ships as **sixteen 192×192 RGBA icons** in `web/art/tile-overlays/game_192`. This is an independent presentation layer, not a replacement for the approved whole-nut `web/art/primary/blockers` or the 15 elemental nut sprites. The original whole-piece locked walnut, ice and chest remain stationary until unlocked.

Only **sticky-butter** (`cell.jam`) and **bomb** (`cell.fuse`) already have tested live game rules, so those two sprites now appear in the game and the Nutdex status index. Both icons keep the nut underneath visible and attach to the tile, not the moving nut payload. The timed sprite carries a legible turn counter.

The remaining fourteen images (fire, frost, lightning, water, nature-vines, poison, radiance, shadow, crystal, magma, storm, arcane, chain-lock, void-rock) are displayed in Nutdex under **Tile FX** as previews. There is **no** automatic transfer of elemental-nut rules to identically named tile sprites. `chain-lock.png` is NOT the existing immovable illustrated walnut. `void-rock.png` is NOT the empty board cell mechanic. They need explicit rule design, statuses, lifecycle and tests before activation.
