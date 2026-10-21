# Verification and release gates

| Gate | Required evidence |
|---|---|
| G0 Engine | `node tests/engine.test.js` passes 500 levels × 5 seeded starts, scoring swaps, deliberate non-matching swaps, gravity identity and deterministic starts |
| G1 Input | Adjacent taps and swipes consume exactly one move whether or not a match is made; invalid non-adjacent swaps do not |
| G2 Levels | Level configurations progress from 4×5 to 8×9; the void mask remains intact; surviving nuts descend in recorded columns; cascades are visibly sequential |
| G3 Economy | Shop prices remain in-fiction until final checkout; review → $0.00 FREE total → completion credits rewards without billing integration |
| G4 Assets | Art load never flashes substitute emojis; missing art falls back legibly; actual sprite quality visually reviewed on target devices |
| G5 Android | Newly built APK installed and launched on API 26 and modern Android; phone-size layout and input/animations verified; offline operation intact |
| G6 Desktop | Windows/Linux downloads open equivalent game/menu/save states; integrity and release provenance verified |
| G7 UX/audio | Compact counters and dynamic tile sizing checked on small phone, tablet and desktop; end screens usable; voice/music configurable; screenshots reviewed |
| G8 Update consent | Signed Android build checks at startup and on level start, throttles repeat polls, offers Download before fetching and Install before starting Android's installer; cancellation never triggers either action |
| G9 Invitations | Share sends public GitHub release link via native Android chooser, Web Share, or copy fallback; recipient chooses to install; no login/contact permissions or cloud-progress claims |
| G10 UI regression | `node tests/ui.test.js` checks checkout, grant, game screen persistence, non-matching/matching swaps, failure continuation and victory |

**Current evidence:** The update/share JavaScript contract tests passed in an isolated JS runtime, and changes were committed and read back from GitHub. Native dialog behavior and APK installation still require device testing. **Current evidence:** Engine regression passed in an isolated JavaScript execution (2,500 scoring and 2,500 non-scoring swaps), and UI-flow regression passed with a mocked DOM. Changed files and final test source have been read back from GitHub `main`. On-device visuals, actual APK compilation, platform packaging, and new-release publication still require separate verification; no build or signed release should be inferred from a source commit.

| G9 Power-ups | `tests/booster-objectives.test.js` verifies all 10 player tools, 4 match-created specials, five objective families, void masks and inventory usage |


## Nutvale Homestead phase 2

Run `node tests/homestead.test.js`, `node tests/homestead-expansion.test.js` and `node tests/homestead-ui.test.js`. Gates: 44 stable plot indices, four level-gated expansions, one-time Golden Nut house costs, no accidental purchase from a locked stage, persisted companions, collectible set prizes, score provenance and opt-in prestige-plate sharing. All device-dependent layout and actual Android/desktop release artifacts remain separate verification gates.

## Nutvale illustrated residence / renovation gates

Use `node tests/homestead-house-tiers.test.js` to verify 40 actual WebP headers and correct manifest order; use `node tests/homestead-renovations.test.js` to exercise 1,000 distinct ranks across all 40 houses, campaign gate validity, earned Golden Nut debits, no charges on denied or completed upgrades, stable saves and achievement awards. The UI harness `node tests/homestead-ui.test.js` covers purchasing decorations, building tiers, renovations, visible artwork flair, $0 checkout behavior and reload persistence.

The 1,000 cosmetic overlays are not 1,000 different painted images. Production release still requires device-scale visual review and on-device/desktop package validation. No real-money SDK, forced timer or online verification is introduced.
