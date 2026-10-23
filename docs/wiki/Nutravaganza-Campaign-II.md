# Nutravaganza Campaign II — chapters 6 through 10

**Status:** integrated development content; **not released**, not yet phone-verified or human-balanced.

## Scope and scene inventory

The new campaign has 500 normal stages, 100 in each chapter; the 500 original levels remain unchanged in ID and board-size schedule. A separate oceanside overview offers chapters 6–10. Its selectors and the 100 markers per chapter are HTML overlay buttons, not printed in the scene art. Each map has an independent 941×1672 source-coordinate route with endpoints and evenly spaced level nodes. The new roads are first-pass hand-traces requiring visual alignment review.

| Main stages | Chapter | Ten sequential ten-stage acts | Themed difficulty |
|---|---|---|---|
| 501–600 | Moonnut Lake Shores | Lantern Jetty; Pebble Crescent; Moonlit Pier; Mistwater Grove; Fishermans Causeway; Starfall Inlet; Reedbank Locks; Mirrorwater Grotto; Midnight Wharf; Lunar Headland | Moving currents simulated with existing conveyors, portals, double wind; ice and layered treasure |
| 601–700 | Sunken Shell Kingdom | Seaweed Stair; Clamshell Terrace; Reef of Lanterns; Tideglass Bridges; Coral Switchbacks; Pearl Gate; Sunken Court; Nautilus Arch; Trident Pass; Shell Throne | Reinforced ice, immovable reef gates, locked lanes, spreading sticky tiles |
| 701–800 | Stormbreaker Archipelago | Broken Jetty; Palmwatch; Brigantine Reach; Ropebridge Gauntlet; Corsair Cove; Powder Deck; Stormtide Narrows; Black Sail Fort; Thunder Reef; Stormbreaker Keep | Hazard countdowns, chained crossings, double wind and multi-goal fort assaults |
| 801–900 | The Abyssal Nutworks | Glowvent Approach; Gearreef Station; Pressure Gate; Coral Boilerworks; Tidal Turbines; Amber Condensers; Brasslight Crossing; Deepwheel Control; Blackwater Foundry; Abyssal Core | Conveyor/portal/wind combinations with fixed pressure locks, layered cooling ice and sticky spills |
| 901–1000 | Leviathan's Crown | Broken Crown Causeway; Moonpearl Bastion; Trench Cathedral; Abyss Observatory; Colossus Gate; Crowned Current; Starless Vault; Tidemaw Crossing; Imperial Shelldome; Leviathan Throne | Maximum supported overlap of persistent blockers, moving nuts, countdowns and collection objectives |

## Implementation contracts

1. `web/level-design.js`: the authoritative ten-acts-per-chapter book and 30 authored spotlight profiles (six per new chapter). Non-spotlight stages derive names and objectives deterministically; no claim of 500 individually hand-designed boards.
2. `web/engine.js`: accepts normal stages 1–1000 with continued score/quota ramp and repeating campaign-specific move budgets. Existing board sizes, booster algorithms and legal-start repairs remain intact.
3. `web/campaign-maps.js`: exactly ten 100-marker chapters, image-relative route points and a second overview; first five routes preserve original coordinates. Each chapter art file must exist in the asset manifest and distribution bundle.
4. `web/game.js`: two compact world selectors, five chapter buttons per world, map zoom/scroll, correct main-stage next buttons, world-aware return after gameplay, persistent `unlocked` and `stars` through 1000.
5. `web/elemental-challenges.js` and `web/elemental-rewards.js`: 30 optional trials per region (300 total), IDs **1001–1300**, without collision with any regular stage. Required main-stage clearance follows the associated region. Every tenth trial awards existing elemental mastery, with only the first clear paying a reward.
6. `web/progression.js`: normal first-clear milestone rewards and the 20-level challenge track must accept 1–1000, while maintaining the already earned rewards at levels 1–500.

## Authored milestone encounters

| Chapter | Authored stages |
|---|---|
| 6 | 501 shoreline arrival; 520 ice; 540 locks; 560 treasure dual-goal; 580 ice-and-wind dual-goal; 600 lake finale |
| 7 | 601 kelp locks; 620 reef ice; 640 pearl vault; 660 spreading tiles; 680 wind and locks; 700 pearl throne finale |
| 8 | 701 hazardous crossing; 720 fort locks; 740 powder deck; 760 ice barricades; 780 thunder reef; 800 Stormbreaker finale |
| 9 | 801 pressure gate; 820 clockwork locks; 840 cooling ice; 860 boiler vault; 880 spillway; 900 Nutworks finale |
| 10 | 901 ancient frost; 920 moonpearl vault; 940 colossus locks; 960 tidemaw spill; 980 crown ice; 1000 grand finale |

**Important:** no new physics system is implied by the narrative names. All currently implemented effects are existing functional match-three mechanics. Future unique water pressure, pirate crossing and leviathan boss rules require separate code, art and validation gates.

## Release-blocking verification

- Validate the ten background hashes and binary blobs from the **remote main-branch files**, including portrait dimensions.
- Node regression tests: campaign maps, campaign UI, 1000-stage profile and objective stock, 300 trials, retained original campaign functionality, booster/daily moves, and packages.
- Test representative seeds across **1–1300** for no initial match, legal swap, and physically satisfiable blocker stock. Confirm trials 1001 and 1300 cannot be misidentified as ordinary levels.
- Visually inspect road markers against each new painting at 320, 390 and desktop widths; tune coordinates, hitboxes and chapter-selector visibility. Physical route alignment cannot be established by coordinate tests alone.
- Run actual Android API 26 and modern Android install/launch, full play UI, save persistence, update consent, and desktop offline smoke; verify published release artifacts separately.

No release or production-readiness claim is implied by source integration alone.
