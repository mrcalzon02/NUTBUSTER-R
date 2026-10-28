# Real-engine planning AI — integration verification, 27 October 2026

## Scope and guarantee

A third **diagnostic-only** move policy is now available at `tools/planning-policy.js`. It is an intentionally bounded depth-three beam search over **actual** `NutEngine.swap` calls. It does not edit the level generator, gameplay, difficulty, booster costs, or art. It is not shipped in the app.

The policy has three strict properties:

1. **Real mechanics:** Each hypothetical action applies full match resolution, created specials, chained cascades, feature updates, fuse expiry, game objectives, and actual wallet move charges as the live `web/game.js` code does. Earned elemental move refunds are also credited. Hypothetical boards are separately deep-copied, not altered in place.
2. **Reproducible branching:** `NutEngine` exposes a deterministic xorshift RNG closure. The planner observes one 32-bit output, *inverts* the xorshift to restore the prior RNG state, and installs a forkable generator that produces exactly the original next outputs. Each child branch independently receives that same RNG state. Test contracts verify that cloning and search do not change board state, the next random draws, or real-world wallet accounting.
3. **Bounded computation:** Beam search examines up to three prospective moves, at most three retained states per depth, four top-priority candidate swaps per state, and **40 simulated live-engine swaps per decision**. No free booster stock or unlimited actions. This is **not** exhaustive search, and even apparent failure does not prove a level unsolvable.

### Fair comparison

`tools/planning-integration.js` compares the one-turn objective-aware policy and the new planner on the original fixed, published stage seeds. Extra runs with an exact-engine one-ply chooser and an optional single emergency Hammer serve as distinct controls.

- **Stages:** 210, 300, 400, 500, 600, 700, 720, 800, 860, 900, 980, and 1000.
- **Seeds:** two board seeds per stage, using `level*16321 + trial*7093 + 11`.
- **Controls:** all 24 pairs compare objective-aware and planner without boosters. Trial 0 of each stage also compares exact-engine one-ply search and three-ply search with at most one emergency Hammer.
- **Wallet:** every attempt gets its own full stage-specific 24-hour daily move allowance. The planner searches with the actual remaining wallet and debits one move plus two for each expired fuse. No next-day refill, moves shop, purchases, or earned booster inventory are assumed.
- **Evidence:** objective counts, exact win/loss, unused move balance, earned move refunds, hazard expiries, search decision count, simulated swaps, reason for loss, and residual objectives are recorded. `tools/planning-report.js` independently validates all samples and cross-checks the objective-aware control on trial-0 seeds against the prior 1,000-level campaign evidence.

**Important interpretation limit:** The hypothetical planner has access to future random-number outcomes because deterministic RNG state is cloned for each simulated branch. This makes it *stronger than a human who does not know future random draws*. It is useful for asking whether a sampled seed has a reachable successful path within the tested search budget, but its win rate is not a prediction of human performance. The search is bounded and cannot prove failure means impossibility.

### CI and follow-up

GitHub Actions runs `tests/planning-policy.test.js` and `tests/planning-integration.test.js` as **report-only** suites. The full seeded planner benchmark is a separate report-only step. It writes `nutbuster-planning-probe.json` (the complete per-attempt evidence) and `nutbuster-planning-summary.json` (validated summary) into the diagnostics artifact, plus a comparison in the workflow Summary.

All signed Android/Fire publication remains gated solely on required functional tests, not exploratory planning. Native Windows/Linux parity is unaffected. Do not alter gameplay difficulty solely to make these bots win. If the planner cannot solve a stage, inspect failure-causes first and test more seeds or deeper explicitly bounded planning before proposing adjustments.

## Setup-aware planning versus match-only control (follow-up)

The planner can now consider a **legal deliberately nonmatching swap**, rather than exclusively swaps which clear tiles immediately. This is still an engine move: it consumes one daily move, can advance hazards, and does not receive fake points or boosters. The change is *only* to diagnostic policy in `tools/planning-policy.js`, never to live `web/engine.js` or game stage data.

Candidate screening keeps up to two setup swaps alongside immediate matches, chooses potentially useful tile alignments, and probes the best few for next-swap match possibilities. Every speculative tile exchange is reversed before evaluation finishes, without consuming the game's random stream. A reserved root beam slot gives one setup candidate a chance to be tested against subsequent actual NutEngine swaps, rather than discarding it solely for having zero immediate progress. The final selection still compares real objective progress and daily move costs; no nonmatch is treated as a free action.

The paired benchmark now has **five distinct policies**: objective-aware one-turn, exact-engine one-ply, three-ply match-only, three-ply setup-aware, and setup-aware with at most one hypothetical emergency Hammer (trial 0 only). Both three-ply policies use identical fixed stages, seeds, allowances, and search budgets. Evidence counts setup candidates actually simulated and real setup moves selected, in addition to wins, goal completion and fuse penalties. This prevents attributing an ordinary planner improvement to setup moves that were never executed.

The first CI comparison confirmed 650 simulated nonmatching actions and 37 real setup selections, **but Chapter 3 goal completion regressed** from 47% under match-only planning to 17% under setup-aware planning. A new safety rule penalizes each speculative setup for its lost move, reserves beam space only for promising setups, and rejects a setup when a comparable match-only continuation has nearly the same forecast quality. This deliberately treats an unproven setup as worse than direct progress; run-by-run evidence, not a fixed win count, determines if it improves outcomes. No level objectives or daily budgets were altered.

The diagnostic suite checks that an offered setup is adjacent, makes no immediate score-producing match, survives a genuine engine swap, preserves the source board and RNG, and replays deterministically. No outcome can prove an arbitrary level impossible; these fixed two-seed samples remain exploratory.
