# NUTBUSTER power-ups — canonical system contract (0.2 → 1.0)

**No power may be merely a differently drawn score bonus.** Every item needs a distinct spatial, blocker, collection, or move-economy purpose. The glossy original nut artwork is authoritative. Controls must stay compact: horizontal scrolling tool belt with accessible names and tooltips, not enormous explanatory cards. All powers are obtainable via gameplay reward tracks, timers, currencies, and the satirical checkout (the payment total reveals $0 only at the checkout step). No actual billing or rewarded-ad dependency.

## A. Match-created specials (not inventory items)

| ID | Creation | Effect | Why it matters | First target |
|---|---|---|---|---|
| line-h | Match 4 horizontally | Clears the entire occupied row | Long horizontal seams, row blockers | 0.2 |
| line-v | Match 4 vertically | Clears the entire occupied column | Separated vertical chambers | 0.2 |
| burst | T/L/cross match (overlapping runs) | Hits a 3×3 radius | Dense layers and corner pockets | 0.2 |
| rainbow | Match 5+ | Removes one chosen nut color anywhere | Distant targets and move scarcity | 0.2 |
| mega-wild | Match 6+ or event reward | Multi-color color selection | Extreme late-game color restrictions | 0.7 |
| nut-nova | Rare high-combo creation | Explodes neighboring regions in waves | Multi-section finishers | 0.8 |

Specials survive ordinary gravity, keep their original nut identity, and explode when included in a clearing effect. A special-special swap is always an activation, regardless of whether a normal three-match forms. A five-match does not magically recolor the surviving nut.

## B. Player-directed booster inventory

| ID | Player action / real behavior | Best reason to use it | Target |
|---|---|---|---|
| hammer | Tap a cell; break reinforced layers, then the nut | Last stubborn blocker; precision | 0.2 |
| row | Pick a cell; strike its whole row | Clear horizontal lines and ice bands | 0.2 |
| column | Pick a cell; strike its whole column | Reach deep isolated vertical cells | 0.2 |
| cross | Row + column through selected cell | Narrow bridges or multi-lane objectives | 0.2 |
| blast | 3×3 region centered on selected cell | Tight clusters and chest clusters | 0.2 |
| color | Choose a nut color by tapping one specimen; eliminate it globally | Color-collection goals and isolated matches | 0.2 |
| shuffle | Reorder existing nut identities while retaining board mask and blockers | Deadlocked or near-useless board | 0.2 |
| extra | Add five moves without resetting the board | Finish nearly completed objectives | 0.2 |
| drill | Bore through one full column, removing multiple blocker layers | Deep ice/chain stacks | 0.2 |
| unlock | Universal key: remove all chains/locks on the board | Many inaccessible locked targets | 0.2 |
| paint | Recolor one selected nut to a player-selected color | Construct precision five-matches | 0.4 |
| swap-any | Exchange two nonadjacent nuts | Cross-board combo setup | 0.4 |
| gravity-flip | One board-wide reverse gravity cycle | Hard-to-reach falling objectives | 0.5 |
| portal-key | Redirect a portal pair for one cascade | Disconnected chambers | 0.6 |
| squirrel-squad | Deploy autonomous helpers for three turns | Multi-target puzzle cleanup | 0.7 |
| time-freeze | Pause on-board countdown hazards for three turns | Timed bombs / shrinking board | 0.7 |
| shell-shield | Prevent next explosion penalty or spreading hazard | Volatile hazard boards | 0.8 |
| board-buster | Break all removable layers, then one nut per cell | Deliberately impossible levels | 0.8 |
| golden-override | Guaranteed objective completion, no money asked | Optional safety valve beyond level 200 | 0.9 |

Do not expose unimplemented effects as live buttons. Preview them in a prize catalog as **Coming Later**, not an inert control. Track uses per booster, not only a total. The inventory can be generous, but a use must still produce a readable effect and real progress.

## C. Special + special combinations

| Combination | Distinct result | Target |
|---|---|---|
| line-h + line-v (or two lines) | Full cross at intersection | 0.2 |
| line + burst | Three adjacent rows and columns | 0.3 |
| burst + burst | Enlarged 5×5 blast | 0.3 |
| rainbow + line | Convert all matching-color nuts into line specials and detonate | 0.3 |
| rainbow + burst | Color-match global blast pulses | 0.3 |
| rainbow + rainbow | Entire board (one layer per occupied tile) | 0.2 |
| mega-wild + any special | Endgame multi-wave combination | 0.8 |

## D. Objectives that justify boosters

Not every level is a score race. Introduce *remove ice layers*, *break chain locks*, *open chest layers*, *collect named nut colors*, *clear designated targets*, and later *deliver cargo to exits*, *survive spreading peanut-butter contamination*, *disable timed bombs*, and *multi-stage objective sets*. Targets must be exposed at the top of the level as concise counters. Booster damage counts toward objectives. Clearing the wrong target does not. For a multi-goal board, victory requires **all** objective counters, not merely a score threshold.

The first 100 levels teach these mechanisms separately and fairly; levels 101–200 combine and tighten them to the normal ceiling; 201–500 may stack mechanics aggressively while keeping every bypass and booster free.

## E. Economy purpose and acquisition

Challenge-track reward nodes, streak rewards, stage milestones, treasure chests, free refills, daily gifts, fake premium bundles, and the squirrel-commercial prize screen all award specific boosters/currencies via one inventory API. Cooldowns measure real time, but a checkout path always reaches a $0 total. The joke must be hidden until the fake payment step, not announced everywhere in advance. Power-ups are functional without ads or social permissions. The premium economy must never compromise save files or device privacy.

## Gates for each implemented power

**Verify:** 1) predictable target set; 2) distinct obstacle interaction; 3) deterministic state after execution; 4) at most one inventory use, even during cascades; 5) no destruction of void geometry; 6) UI button and input; 7) playback and VFX nonblocking; 8) source commit and three platform packages read back from GitHub. Planned powers remain unimplemented until all eight pass.
