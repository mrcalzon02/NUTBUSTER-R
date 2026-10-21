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
| G8 UI regression | `node tests/ui.test.js` checks checkout, grant, game screen persistence, non-matching/matching swaps, failure continuation and victory |

**Current evidence:** Engine regression passed in an isolated JavaScript execution (2,500 scoring and 2,500 non-scoring swaps), and UI-flow regression passed with a mocked DOM. Changed files and final test source have been read back from GitHub `main`. On-device visuals, actual APK compilation, platform packaging, and new-release publication still require separate verification; no build or signed release should be inferred from a source commit.
