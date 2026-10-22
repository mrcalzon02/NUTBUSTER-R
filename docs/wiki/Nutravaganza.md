# Nutravaganza — Nutvale Waterfront Expansion

Status: **in active development; not a published update or final art release**.

## Experience

Nutravaganza extends the existing Nutvale Homestead with a fishing wharf, active fishing fights, a permanent home aquarium, daily bait, a new locally earned `Nutvale Dollars` (N$) wallet, upgrade tracks, and a larger rotating mix of illustrated match-three nuts. The expansion remains playable offline, on the common web/Android/desktop client; no new account, cloud service, or real-money commerce is required.

The satirical premium language is intentional. **N$ is fictional earned play currency, not a real-money in-app purchase.** Golden Nuts and gems remain separate. None of the existing Homestead renovations, buildings or player inventory should be reset by the expansion.

## Fishing loop and initial content

Go to Homestead → Fishing Wharf. Six Honest Worms are granted on the first login and on each successive *local calendar day*, accumulating up to 12 from the automatic grant (booster exchanges can exceed the grant cap). Choose one available bait. Casting always consumes one bait. A fish fight begins. Player actions track left/right, reel in line, or slack off to manage tension. Fish species vary by speed, directional surges, resistance and value. Success provides a caught-fish decision:

- **Keep** it: the unique specimen (species, length, appraised price) occupies one aquarium slot. Collection is never silently sold.
- **Sell** it: the same specimen is removed from catch selection and its N$ price is credited exactly once.
- **Release** it: remove the catch without payment if the aquarium is full or the player does not want it.
- **Escape or snapped line**: no catch and no automatic bait refund.

Only one active fight or caught-fish decision can be held at a time; both persist in the existing offline save. Navigation must not silently erase either. The fight is currently command-driven; true continuous arcade input and framed motion should be evaluated during the game-feel pass, not claimed as implemented prematurely.

The 12 fish species are Penny Minnow, Bluegill Baron, Gilded Perch, Dividend Carp, Rainbow Trout, Bigmouth Bass, Tax Haven Catfish, Royal Koi, Inflation Puffer, Electric Eel, Imperial Sturgeon, and Nutvale Leviathan.

## Economy and improvements

`Nutvale Dollars` earned from fish sales buy: five rod upgrades (six visible tiers including starter), two premium bait-quality unlocks, and ten aquarium expansions (11 visible tank tiers including starter). Tank capacity starts at **four fish**, increasing by three per upgrade. Rod-skill upgrades expand the target zone, improve steering, and boost reeling. Sixteen separate rod models are purchasable and equippable, with individual durability and fish-species affinities. Rod models unlock through the existing 0–5 rod-skill progression. Each cast wears rod condition by one point (two for very difficult fish); a snapped line wears two more. Broken rods cannot cast and do not spend bait. Repair paid rods with earned N$, and repair the starter Woodland rod free to prevent softlocks. Bait quality and the equipped rod independently modify seeded catch probabilities; no rod guarantees rare fish.

Crafting cost: Glitter Grub = 1 Honest Worm + N$35; Royal Roe = 1 Honest Worm + N$100, after the corresponding bait-quality unlock. Existing match-three earned power-ups exchange for **2, 3, or 4 worms per item**, depending on their type. Trade deducts the real existing booster and adds actual bait in the same synchronous operation; no decorative-only transaction buttons.

Upgrades are local, earned and capped. The existing fictional-premium satirical checkout contract is unchanged; there is no paid bait or backend purchase path.

## Nutravaganza match-three variety

Reuse the already authored 12 extra nut sprites from `web/art/primary/nuts/expansion-v2-manifest.json` without redrawing them: beechnut, brazil nut, candlenut, chestnut, coconut, ginkgo nut, hickory nut, macadamia, pecan, pili nut, pine nut, tiger nut.

The original seven identity IDs stay stable; 12 more append to the global type registry. **Do not populate all 19 simultaneously.** Rotate new identities in 20-level bands beginning at 41, add a second rotating new identity from 201, and retain each chapter's original starter set. This yields an increasing 3–9 simultaneous nut palette without creating an inherently dead board. The animated rainbow remains special-only, not an ordinary spawn nut.

Difficulty should respond to play-tester feedback: early tutorial boards remain legible; later levels become progressively more constrained by wider palette, objective mixes, blockers, wind, transport, and tighter moves. Never assume that a structurally playable board is human-fair: deterministic legal-move checks are a first test, not a win-rate study. Preserve the existing chapter progression and the intentionally severe late-game challenge.

## Art backlog

See [Nutravaganza Art Production](Nutravaganza-Art-Production.md) for **16 art work packages**, including the wharf, aquarium, 12 fish species and animation sheets, bait, six rods, 11 tank appearances, N$ currency and estate integration. Current in-game fish graphics and dock furniture are functional placeholder emoji, not completed assets.

## Build and release gates

| Gate | Deliverable | Exit criteria |
|---|---|---|
| NUTRA-G1 | Save and daily bait integrity | Day rollover only once, backward clock no duplicate, no loss of other wallets or existing campaign state |
| NUTRA-G2 | Fishing gameplay | Cast, four controls, tension, escapes, rare catches, keep/sell/release, reload during encounter |
| NUTRA-G3 | Aquarium and upgrades | Unique specimens, capacity/upgrade costs, animated residents, reduced motion, no clipping |
| NUTRA-G4 | Cross-system economy | Booster exchange, crafting, N$ credit/spend, earned booster count deducted correctly |
| NUTRA-G5 | Nut variety and difficulty | All 12 illustrated nuts actually appear; 500 seeded stages open legally; score/refill objectives and special mechanics remain correct |
| NUTRA-G6 | Art pipeline | Source-to-slice manifests, alpha/size integrity, rendered appearance on Android and desktop; no placeholder final sprites |
| NUTRA-G7 | End-to-end tests | Run full Node tests, sustained play with forced restarts, responsive viewport checks, install/launch smoke, no dead buttons |
| NUTRA-G8 | Release | Independent signed Android APK + Windows + Linux packages, verified installation and update delivery; no release claim without published artifacts |

NUTRA-G1–G5 have initial working code and regression tests. **Do not mark gates closed** until their tests and player-experience checks have been observed. G6–G8 remain pending. In particular, current development is not a release, and prepared documentation is not proof of generated artwork.

## Files

- `web/fishing.js`: authoritative local economy, state and encounter loop.
- `web/fishing-ui.js`: wharf / aquarium rendering and action dispatch.
- `web/fishing.css`: compact fishing controls, responsive waterfront and animated fish.
- `web/index.html` and `web/game.js`: minimal existing-shell integration.
- `web/engine.js`: staged roster of authored new nut types.
- `tests/nutravaganza.test.js`: fishing, wallet, nut roster and integration checks.
- `docs/wiki/Nutravaganza-Art-Production.md`: artwork manifest and production tasks.

## Near-term refinement

Produce the P0 fish-and-wharf atlas and replace visible placeholders; make the aquarium a real persistent habitat with per-fish animations (not only scrolling glyphs); review the mini game's tactile feel on actual touchscreens; perform adaptive balancing on the 500-level nut ramp, rather than treating additional colors as sufficient difficulty by themselves. Ship only after the independent installation and release gates are verified.
