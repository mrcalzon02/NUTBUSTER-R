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
Ice has two separately removable layers. Chains shield a nut but do not prevent swaps. Chests take two hits. Butter absorbs a hit before other shields and spreads every third move. Timed acorns expire for a penalty of two moves. A master key removes all chain layers even under butter. Special matches make rockets, blasts and rainbow nuts.

Conveyors rotate payloads beginning at level 125, portals exchange payloads at 164, and wind tunnels begin at 301. Fixed hazards do not travel with the payload. Void cells break gravity into segments. Rock and crate images are present but are not active blockers.

Current ordinary nut variants count: 19, with the twelve art expansion varieties rotating into rosters starting at level 41.

## Evidence and follow-up
The existing engine passed 14 focused behavioral checks for layered ice, chains, butter, timed acorns, portal movement, wind, and animation planning. The new automated test checks the index status labels and sprite-file contract as well as actual engine behavior. Elemental effects and Android index UX are not certified or enabled yet.

The source atlas is retained in the Nutbuster Google Drive folder at https://drive.google.com/file/d/13lBWifXqDQuD34WjVLLi-IjkQcBR07UZ/view . To re-slice, save it as assets/source/expansion/elemental-nuts-3x5.png and run python tools/slice_elemental_3x5.py.
