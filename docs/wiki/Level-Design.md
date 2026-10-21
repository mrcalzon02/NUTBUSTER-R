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
