# NUTBUSTER Level Design — 500 Stage Framework

Campaign staging is five chapters of 100 levels each. Every chapter contains ten blocks of ten levels, with each block expected to introduce, practice, combine, and then evaluate a selected mechanic. A milestone every 20 levels is emphasized on the map.

| Range | Chapter | Design pressure |
|---|---|---|
| 1–100 | Nutwood Meadows | Friendly teaching, readable blockers, steadily tighter move budgets |
| 101–200 | Peanut Butter Factory | Add chains, crates, conveyors and intersecting objectives; reach ordinary high difficulty by 200 |
| 201–300 | Squirrel Hoard Highlands | After the normal difficulty ceiling, stack ice, locks, chests and route constraints |
| 301–400 | Autumn Windmill Vale | Narrow boards, multiple stages of damage, timing and asymmetric geometry |
| 401–500 | Moonlit Golden Palace | Brutal multi-system combinations, with unlimited free shortcuts and boosters |

The engine has eight functioning mask families: full grid, hourglass, winged spine, ring, bridged twin chambers, stepped field, asymmetrical corners, and diamond. The first implementation reuses them across 500 level IDs with deterministic seeds, increasing score goals, stronger blockers, and fewer moves. These are **500 valid stage configurations**, not 500 bespoke balanced stages. Wider mechanics remain in the roadmap; no claims are made that unreleased objectives already work.

Fairness calibration gates: automatic valid-start and legal-swap checks for all 500 IDs; device test for tap targets; clear in-game description of every new blocker; losses must be due to known rules rather than invisible operations. The deliberate unfairness after level 200 is comedic and can be bypassed with the game's freely available power-ups. Player saves keep the same numbering and stats format.

See `Campaign-Maps.md` for the editable chapter map paths and assets.
