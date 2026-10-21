# Verification and release gates

| Gate | Required evidence |
|---|---|
| G0 Engine | `node tests/engine.test.js` passes all 600 level×seed starts |
| G1 Input | Neighbor swap works by tap and swipe, nonmatches revert and don't spend a move |
| G2 Levels | 30 selectable levels, 8 irregular mask variants, gravity does not fill holes |
| G3 Economy | Every bundle, refill, reward and VIP button changes local state, no paid service |
| G4 Assets | 84 primary cropped sprites visually checked; missing art falls back legibly; supplemental sheet not used as core tiles |
| G5 Android | APK actually built, installed and launched on API26 + contemporary Android; offline, no network permission |
| G6 Desktop | Desktop browser and packaged installer open equivalent menu/game/save states |
| G7 UX/audio | Layout works in small-phone, tablet, desktop; announcer can be disabled; screenshots reviewed |

**Status:** G0 local tests passed; G1–G7 pending full device and UI validation. GitHub commit verification does not count as APK build proof.
