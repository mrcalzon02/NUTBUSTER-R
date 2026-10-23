# NUTBUSTER Level Design — 500 Stage Framework

Campaign staging is five chapters of 100 levels each. Every chapter contains ten blocks of ten levels, with each block expected to introduce, practice, combine, and then evaluate a selected mechanic. A milestone every 20 levels is emphasized on the map.

| Range | Chapter | Design pressure |
|---|---|---|
| 1–100 | Nutwood Meadows | Friendly teaching, readable blockers, steadily tighter move budgets |
| 101–200 | Peanut Butter Factory | Add chains, crates, conveyors and intersecting objectives; reach ordinary high difficulty by 200 |
| 201–300 | Squirrel Hoard Highlands | After the normal difficulty ceiling, stack ice, locks, chests and route constraints |
| 301–400 | Autumn Windmill Vale | Narrow boards, multiple stages of damage, timing and asymmetric geometry |
| 401–500 | Moonlit Golden Palace | Brutal multi-system combinations, with unlimited free shortcuts and boosters |

Board geometry grows by stage: levels 1–10 are 4×5, 11–30 are 5×6, 31–70 are 6×7, 71–140 are 7×8, and 141–500 are 8×9. The largest grid is deliberately a high-difficulty ceiling, not an introductory size. A non-matching adjacent swap is legal and costs one move, so moves represent a planning budget rather than only scoring actions.\n\nThe engine has eight functioning mask families: full grid, hourglass, winged spine, ring, bridged twin chambers, stepped field, asymmetrical corners, and diamond. The first implementation reuses them across 500 level IDs with deterministic seeds, increasing score goals, stronger blockers, and fewer moves. These are **500 valid stage configurations**, not 500 bespoke balanced stages. Wider mechanics remain in the roadmap; no claims are made that unreleased objectives already work.

Fairness calibration gates: automatic valid-start, non-matching-swap and scoring-swap checks for all 500 IDs; device test for tap targets; clear in-game description of every new blocker; losses must be due to known rules rather than invisible operations. The deliberate unfairness after level 200 is comedic and can be bypassed with the game's freely available power-ups. Player saves keep the same numbering and stats format.

See `Campaign-Maps.md` for the editable chapter map paths and assets.

## Fixed Factory infrastructure (development gate)

Conveyors begin at level **125**; portals begin at **164**. A conveyor cycles nut identities and special-nut identities in its continuous row segment every other move; later campaigns speed it up. Portals exchange nut payloads between distant occupied cells every third turn, accelerating later. Blockers, ice, locked cells, chests, sticky butter and timed-acorn hazard markers remain fixed to their tiles. Their transport movement is animated separately and can trigger ordinary cascades, but no extra player move is charged. Levels 125, 126, 164 and 165 teach the rules on-screen.

`tests/board-features.test.js` verifies 500 feature plans, mask integrity, timing, payload identities and real swap triggering. `tools/difficulty-audit.js` produces seeded structural indicators per chapter, **not** measured player win rates. An additional simulation and human-play balancing gate is needed before promoting level 200's difficulty ceiling.

## Repeatable balancing evidence

Every GitHub Actions test job uploads `Nutbuster-difficulty-audit-<run ID>` containing the full-campaign structural statistics and 400 seeded trials across the first 200 levels from a basic non-booster matching bot. **Bot victories are not human win rates**; a greedy algorithm can miss intended puzzle strategies. The report supports identifying suspicious level blocks before human testing. Keep changes to fair early levels evidence-based and reserve intentionally harsh multi-mechanic pressure for levels 201–500.

## Autumn and Palace wind tunnels

Autumn Windmill Vale (levels 301–400) adds one fixed vertical wind tunnel to each eligible stage, first taught at level 301. Every second player turn it cycles the existing nut types and special powers up or down within the same contiguous column segment. The direction reverses after every gust and is marked on the board before the turn. Moonlit Golden Palace (401–500) adds up to two lanes, gusting every turn. Wind does not move ice, locks, treasure chests, peanut butter, bombs, or the void mask. New matches after a gust resolve with the regular cascade animation. Level lessons 301/302/320/401/402 teach the escalation. All effect paths remain deterministic and test-gated.

## Chapter 1–2 difficulty revision — initial automated evidence

The prior 400 seeded non-booster greedy-bot games yielded 182 wins / 200 tries in Nutwood Meadows and 185 / 200 in Peanut Butter Factory. This is a *weak AI proxy*, not player telemetry. Stage numbers 70, 72, and 98 each failed both sampled attempts; they now receive +3 moves while they await human-play review. To avoid an easier second campaign, Factory goals increase gradually through stage 200, and the collection and blocker objectives gain additional pressure in four 25-stage bands beginning after level 125. This is provisional, not a claim of proven human win-rate balance. The 500-stage feasibility test now explicitly checks advertised blocker quantities against placed layers; the 400-sample bot report is retained for before/after comparison.

## Authored spotlight expansion (67 stages)

Twenty additional hand-authored encounter profiles have been inserted across all five chapters. These are gameplay configurations, not cosmetic renames: each binds a named level, concrete objective family, fixed blocker placement count and formation, and a hint explaining the interacting mechanics. Nutwood now introduces a pre-finale combination gate; the Factory teaches new-color collection, spreading peanut butter, conveyor-bound ice, and portal-independent locks; the Highlands combine frozen routes with countdown acorns and treasure; the Windmill layers stationary blockers under reversible wind; and the Palace adds two-lane moving-nut puzzles with static vault and ice objectives. The new spotlight IDs are 84, 99, 101, 116, 139, 151, 177, 199, 201, 218, 240, 275, 312, 330, 360, 389, 410, 435, 460, 490. These supplement the existing 47 authored stages rather than altering their tuning.

Acceptance is checked by `tests/level-design.test.js`: each of the 500 level IDs has a legal opening, matches the map title, and has physically satisfiable starting blockers; every new spotlight is also exercised with three reproducible alternate board seeds. Structural playability is not a claim of human-completion balance. The original 0.5/0.6 fairness boundary remains at the first 200 levels; later stages continue the deliberate, freely bypassable difficulty escalation.


## Early-pressure difficulty revision (October 2026)

Player feedback showed requirements too low through stage 40. Score goals are **5×** the previous linear baseline throughout levels 1–40. Collection and blocker demands also start at **5×** their previous requested quantity, subject to physically placed tiles and visible hit-point stock. Stronger 3–5 hit blockers are numbered and consume their layers through the existing match/booster damage rules. No phantom objectives are permitted. The 38% cap on immovable blockers remains, preserving >60% of cells for matches.

Difficulty keeps climbing beyond stage 40 using separate score and quota scales. Mission stock now increases more quickly as blockers unlock. Moves follow a differentiated 12–36 budget with gradual reductions and small allowances on chapter transitions; the 301–500 nine-move plateau was eliminated. **Board sizes are unchanged**: levels 1–10 use 4×5, 11–30 use 5×6, 31–70 use 6×7, 71–140 use 7×8, and 141–500 use 8×9. Level layouts, original 500 stage IDs, progression and art remain unchanged. Seeded legal openings and initial objective-stock checks demonstrate physical starting feasibility, not player win-rate guarantees; completion balancing and device endurance tests are still required.


## Shared daily move allowance (October 2026)

The revised per-stage move curve seeds a **single persistent daily balance** rather than a refill on every level start. Normal campaign stages and elemental trials draw from the same bank. Retries and moving between areas do not regenerate moves. The next local day restores the stage-based baseline, while explicit +5 Moves items and Nature's successful butter cleanse add saved bonus moves. All original board-size transitions remain unchanged.

## Campaign II: chapters 6–10 (October 2026 development)

The stage book now covers **1,000 main campaign IDs**, with **100 IDs per chapter and ten named ten-stage acts per chapter**. New authored spotlight and finale profiles cover 501, 520, 540, 560, 580, 600 and equivalent milestone sets in chapters 7–10; the remainder are seeded deterministic level configurations, not bespoke human-balanced puzzles. Level 1000 has a proper campaign-completion outcome rather than looping to itself.

To prevent collisions between main levels 501–1000 and existing numeric trial IDs, the dedicated elemental-trial range was reassigned to **1001–1300**. Ten chapters each have 30 trials, gated by their own matching main campaign progress. Elemental variants reuse the 15 existing real abilities rather than inventing extra assetless types. The shared daily move bank persists across campaign and elemental stages. Pre-release save compatibility is not guaranteed; this changes prior development-only trial IDs.

Existing 4×5 through 8×9 board transitions, mechanically honest blocker HP, seven original core nuts, rotating expansion nuts, conveyors, portals and wind lanes remain authoritative. New chapters remix supported mechanics at increasing pressure, including optional support through earned boosters. Automated openings and objective-stock evidence are **not** proof of human difficulty fairness; run phone-size map review, seeded tests across all 1,300 IDs, actual gameplay balancing, offline/Android install tests and release provenance gates before declaring release-ready.
