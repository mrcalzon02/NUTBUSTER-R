# Nutbuster — playable tile-overlay difficulty curve

The approved 16 tile-overlay sprites are gameplay elements, not cosmetic stickers. The tile itself owns each status; an ordinary nut and its elemental emblem remain separate. The four existing overlays (Frost, Chain-Lock, Sticky Butter, Timed Acorn) retain their original layer and turn rules.

| Main campaign entry | Overlay | In-game action |
| ---: | --- | --- |
| 3 | Frost | Existing pinned ice layers must be cracked before a nut moves. |
| 28 | Chain-Lock | Existing pinned locks are chipped through layered strikes or Master Key. |
| 45 | Fire | A two-turn ember damages its own nut and four orthogonal neighbors on expiry. |
| 110 | Sticky Butter | Existing sticky layer absorbs hits and spreads every third player turn. |
| 115 | Poison | A two-turn venom mark matures into sticky butter; Poison Nuts also inject marks. |
| 155 | Nature Vines | Roots anchor a nut for two turns, then plant its color into one adjacent movable nut. |
| 195 | Crystal | A delayed crystal gives two held gravity drops and one combo scoring charge. |
| 210 | Timed Acorn | Existing fuse expires into a two-move penalty unless disarmed. |
| 245 | Shadow | A two-turn ward absorbs one hit and expires. |
| 285 | Arcane | Two-turn runes transmute a nut to the next available match color; resulting matches resolve. |
| 325 | Water | Two-turn water washes sticky butter, poison and burning effects from its row. |
| 365 | Radiance | Two-turn radiance cleanses up to three nearby harmful layers or protections. |
| 425 | Lightning | Two-turn lightning strikes up to three nearest nuts of the same type. |
| 525 | Storm | Two-turn storm strikes four nearby nuts. |
| 625 | Magma | Two-turn magma damages all occupied squares in one column. |
| 745 | Void-Rock | A two-turn rune hardens into a two-hit fixed stone seal over its nut. |

These entries are the **first eligible stage**, not guaranteed individual spawn on every board. The deterministic `overlayPlan(level)` uses one scheduled active effect before level 150, two from 150, three from 300 and four from 600. It selects from effects unlocked at that stage. Placement refuses any candidate that makes a seeded opening unplayable or creates a free starting match. Higher levels mix earlier statuses into new hazards; no early campaign node gets endgame auras.

## Elemental and overlay combinations

The 15 existing elemental nut abilities are authoritative in `web/elemental-powers.js` and shown verbatim in the Nutdex via `ABILITIES`. They trigger when the actual nut is destroyed—not when an intervening tile shield is chipped. Lightning, Fire, Storm, Earth and Magma can crack tile statuses, barriers and other elemental nuts; this can chain more activations. Water and Radiance clean hostile overlays. Nature seeds rooting vines and refunds a move when it successfully washes butter. Shadow wards and Crystal holds interact with damage and actual gravity rather than being visual labels. Arcane can create real matches through transmutation.

Square-bound statuses remain attached to the tile while nut identities, hold charges, and elemental markers follow the nut through valid transport and gravity. All mutation and scheduling are seeded and included in snapshots. Expiring auras produce a distinct animation stage *before* any follow-up match cascades; the animation is reduced-motion aware.

## Acceptance checks

- Every available elemental kind has a specific non-generic skill description and fires on a real destruction.
- Every approved tile-overlay sprite has a corresponding live Nutdex entry and a defined gameplay effect.
- All 1,000 main stages and 300 optional trials remain match-free and playable at opening with deterministic seeds.
- Rooting and stone shields cannot manufacture a dead opening; arcane/nature matches resolve through ordinary cascade logic.
- Poison maturation, fire damage, crystal holding, water cleansing and two-hit Void-Rock protection are observable in board state.
- The board UI uses transparent overlays with numeric countdowns where applicable.
