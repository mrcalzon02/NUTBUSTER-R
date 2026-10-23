# Nutbuster — Announcer B Script & Original Voice Gap Ledger

**Status:** Approved-for-review *recording script*, NOT synthesized/recorded audio and NOT implemented announcer switching. Prepared against the 2026-10-22 working `main` source and the [Nutbuster Sounds Drive folder](https://drive.google.com/drive/folders/1IwvPgWwzabBliPODifPDdT61WqJhfmxu).

**Audit baseline:** `assets/audio/catalog.json` contains **19 announcer MP3s**, **4 reaction grunts**, **17 sound effects**, and one music loop (41 total), and `web/audio.js` maps all 19 announcer clips. A comparison with the designated Drive folder found those same 19 recorded announcer titles. No additional separate, unimported voice clip was evident in that folder. The current `web/game.js` dispatches the original lines for stage entry, combo milestones, victory/loss, and rewards, but the numerous functions exposed by `web/fishing-ui.js`, Homestead, elemental trials, daily moves, and Nutdex generally have no distinct announcer line. Fishing already exposes an **80-species** catalog; record rarity-based cues instead of 80 repetitive species-name clips.

## Announcer B: The Nutvale Auditor

**Personality:** Immaculately composed, professionally exhausted, and clinically amused by the game's ridiculous economy. Where the original announcer is a booming commercial hype machine, the Auditor sounds like the internal accountant forced to certify the consequences. Use understated irony, dry ceremonial gravitas, and perfectly controlled pauses. Voice gender and accent can vary; do not require a stock imitation of a specific actor. The player is in on the joke, not the butt of it. Delivery should be an original distinct performance, not a speed/pitch-shifted copy of existing recordings.

**Performance target:** Sub-2.5-second board callouts; 2–4 seconds for rare triumphs and new scenes. Leave 100–200 ms silence around clips. High tension/alerts are clear and intelligible at phone volume. Do not try to speak on every click, tracking tap, nut pop, or frame of fish movement.

## A. Existing spoken events: record these 19 for the alternate pack

These keys already exist in `web/audio.js`. Their existing MP3s remain untouched. Record the same event key for the Auditor so a setting can switch voices without changing puzzle outcomes.

| Existing key | Current use | Auditor recording script | Priority |
|---|---|---|---|
| `big-one` | 5+ nut clear / large move | “Five nuts successfully liquidated.” | P0 |
| `magnificent` | Two-stage cascade | “Multiple departments have reported success.” | P0 |
| `cascade` | Three-stage cascade | “The situation continues to escalate.” | P0 |
| `win` | Ordinary stage victory | “Your performance has exceeded the minimum legal requirement.” | P0 |
| `close` | Current catch-all defeat | “An unfortunate shortfall. The paperwork is extensive.” | P0 |
| `nutbuster` | Chest / reward exclamation | “Nutbuster. The figures are extraordinary.” | P0 |
| `nutbuster-soft` | Stage entry / subdued reward | “Welcome back to the operation.” | P0 |
| `package` | Major package / bundle | “A considerable acquisition. The treasury is concerned.” | P0 |
| `premium` | VIP and large rewards | “Premium privileges have been provisionally approved.” | P1 |
| `satisfaction` | Daily reward | “Your satisfaction has been entered into the ledger.” | P0 |
| `oh-my` | Booster and bonus exclamation | “Oh dear. That was unexpectedly effective.” | P0 |
| `deal` | Ordinary $0 checkout | “Remarkable value. We have billed you precisely nothing.” | P0 |
| `look-out` | Timed-acorn detonation | “The risk department has resigned.” | P0 |
| `nutsplosion` | Four- or five-stage cascade | “A catastrophic surplus of nuts.” | P0 |
| `heck-package` | Large satirical checkout | “The purchasing committee has lost control.” | P0 |
| `nutsselence` | Large two-stage cascade | “An excellence report will be filed immediately.” | P0 |
| `nut-destruction` | Combo or large clear | “Those assets are no longer on the books.” | P0 |
| `nutravaganza` | Five-level win / special reward | “A festival of deeply questionable expenditures.” | P0 |
| `busted` | Six-plus cascade | “The entire market appears to have collapsed.” | P0 |

**Important semantic correction:** The current `close` clip (“That Was Close”) is triggered for *all* defeats, whether the player almost won or failed badly. When wiring future events, keep a true `close-win` line only for near misses and use `loss-normal` for ordinary defeats. Similarly, `look-out` is currently triggered *after* a timed acorn has detonated; `fuse-warning` should precede the explosion instead of using that cue as a late warning.

## B. Coverage gaps: new lines for BOTH announcers

**Original** = new script for the existing high-energy performer. **Auditor** = new script for Announcer B. Every row is a distinct *proposed event*, not a claim that game code currently triggers it. P0 = essential identity/feedback, P1 = meaningful milestone/variation, P2 = optional seasoning. Keep matching IDs across both packs.

### Campaign & board

| Event key | Trigger / condition | Priority | Original announcer — new recording | The Nutvale Auditor — new recording |
|---|---|---|---|---|
| `start-first` | First time starting the campaign | P0 | “WELCOME TO NUTBUSTER! LET THE CRACKING BEGIN!” | “You have entered the nut industry. My condolences.” |
| `start-repeat` | Repeat level entry (infrequent) | P1 | “BACK FOR MORE NUTS? EXCELLENT!” | “Another attempt. We admire persistence when it is free.” |
| `new-nut` | New standard nut type introduced (currently text banner only) | P0 | “A BRAND-NEW NUT! GIVE IT A PROPER BUSTING!” | “A new asset class has entered the portfolio.” |
| `first-match` | First successful match, once per account | P1 | “THERE IT IS! YOUR VERY FIRST BUST!” | “Our first transaction has cleared.” |
| `match-four` | Four-in-a-row special created | P0 | “FOUR OF A KIND! THAT'S ONE POWERFUL NUT!” | “Four aligned assets. An unusual but welcome formation.” |
| `match-five` | Five-in-a-row rainbow created | P0 | “FIVE IN A ROW! RAINBOW NUT INCOMING!” | “Five in sequence. We shall notify the authorities.” |
| `special-pair` | Two crafted specials combined | P0 | “DOUBLE SPECIAL! THIS BOARD IS FINISHED!” | “Two special instruments combined. The auditors are alarmed.” |
| `invalid-swap` | Nonmatching swap spent a move (not an illegal touch) | P1 | “NO MATCH! THAT MOVE STILL COUNTS!” | “A transaction without a return. How conventional.” |
| `deadlock-shuffle` | No scoring move; forced repair/shuffle | P1 | “TIME FOR A FRESH MIX!” | “The market has been discreetly rearranged.” |
| `low-moves-three` | Exactly three moves remain | P0 | “THREE MOVES LEFT! MAKE THEM NUT!” | “Three transactions remain. Please spend responsibly.” |
| `last-move` | Exactly one move remains | P0 | “LAST MOVE! MAKE IT LEGENDARY!” | “Final authorization pending. Choose carefully.” |
| `close-win` | Near-miss defeat only (do not use for every loss) | P0 | “SO CLOSE! ONE MORE NUT WOULD HAVE DONE IT!” | “A narrow loss. The difference is rather embarrassing.” |
| `loss-normal` | Normal stage failure (new distinct cue) | P0 | “NOT QUITE! BACK TO THE NUT GRINDER!” | “The board has rejected your proposal.” |
| `three-stars` | Three-star stage completion | P1 | “THREE STARS! ABSOLUTE NUT PERFECTION!” | “A flawless rating. We are investigating.” |
| `chapter-open` | First visit to a newly unlocked region | P1 | “NEW REGION! NEW NUTS! EVEN MORE TROUBLE!” | “Operations have expanded into an unprofitable new district.” |
| `chapter-finale` | Chapter final victory | P1 | “CHAPTER CRACKED! THE WHOLE KINGDOM HEARD THAT!” | “The regional accounts are now closed.” |
| `level-500` | Campaign finale cleared | P2 | “FIVE HUNDRED LEVELS! THE UNBUSTABLE HAS BEEN BUSTED!” | “Five hundred levels. We never expected anyone to complete the forms.” |

### Obstacles & powers

| Event key | Trigger / condition | Priority | Original announcer — new recording | The Nutvale Auditor — new recording |
|---|---|---|---|---|
| `ice-hit` | Ice takes damage but remains | P1 | “CRACK THAT ICE! IT'S NOT DONE YET!” | “The frost barrier has depreciated.” |
| `ice-broken` | Final ice layer removed | P1 | “ICE SHATTERED! NUTS ARE FREE!” | “Frozen assets have been released.” |
| `lock-open` | Locked tile truly unlocked | P1 | “LOCKS OFF! LET THOSE NUTS MOVE!” | “The restrictions have been lifted.” |
| `chest-open` | Chest fully opened | P1 | “TREASURE UNLOCKED! THAT'S A JUICY HAUL!” | “The vault has yielded its contents.” |
| `jam-spread` | Peanut butter spreads | P1 | “THE BUTTER IS SPREADING!” | “Contamination has reached another department.” |
| `jam-cleared` | Peanut butter hazard removed | P1 | “STICKY PROBLEM SOLVED!” | “An exceptionally adhesive liability has been resolved.” |
| `fuse-warning` | Timed acorn has one turn left, pre-explosion | P0 | “ONE TURN BEFORE THAT ACORN BLOWS!” | “An imminent detonation has been added to your calendar.” |
| `fuse-defused` | Timed acorn safely removed before expiry | P1 | “BOMB DEFUSED! THAT WAS NUTS!” | “A significant expense has been avoided.” |
| `conveyor-shift` | Major conveyor reveal / first lesson only | P2 | “THERE GOES THE CONVEYOR!” | “The assets have been moved without consultation.” |
| `portal-swap` | Major portal reveal / first lesson only | P2 | “PORTAL POWER! NUTS ON THE MOVE!” | “The inventory has changed locations. Naturally.” |
| `wind-gust` | Wind hazard first triggers / major gust | P2 | “HOLD ON TO YOUR NUTS!” | “The forecast indicates substantial asset migration.” |
| `elemental-trigger` | Elemental nut actually activates | P0 | “ELEMENTAL POWER! FEEL THAT CRACKLE!” | “The elemental division has produced results.” |
| `elemental-chain` | Two or more genuine elemental activations chain | P0 | “ELEMENTAL CHAIN REACTION!” | “A chain of reactive assets. Compliance is unavailable.” |
| `elemental-trial-win` | Elemental trial completed | P1 | “ELEMENTAL TRIAL CONQUERED!” | “Your experimental license has been renewed.” |
| `elemental-trial-loss` | Elemental trial lost | P1 | “THE ELEMENTS WON THIS ROUND!” | “The experiment has been declared inconclusive.” |
| `elemental-relic` | One of the fifteen relics earned | P1 | “A NEW RELIC! NOW THAT'S NUT HISTORY!” | “An artifact has been registered in the estate accounts.” |
| `daily-moves-low` | Shared daily-move allowance running low | P1 | “DON'T WASTE THOSE DAILY MOVES!” | “Your daily allowance is approaching exhaustion.” |
| `daily-moves-empty` | No daily moves left; do not pretend a clock timer | P1 | “OUT OF DAILY MOVES! SEE YOU NEXT TIME!” | “Your allocation has been depleted. An admirable restraint.” |
| `nutdex-first` | First opening of Nutdex help panel | P2 | “WELCOME TO THE NUTDEX! LEARN YOUR NUTS!” | “The reference manual is unexpectedly comprehensive.” |

### Estate, economy & cosmetics

| Event key | Trigger / condition | Priority | Original announcer — new recording | The Nutvale Auditor — new recording |
|---|---|---|---|---|
| `new-house` | New house tier genuinely built | P1 | “A BIGGER HOUSE! FOR ALL THOSE NUTS!” | “The property portfolio has expanded.” |
| `renovation-complete` | A purchased renovation rank is completed | P1 | “RENOVATION COMPLETE! LUXURY EVERYWHERE!” | “Another improvement of questionable necessity.” |
| `new-zone` | Estate ground first unlocked | P1 | “MORE LAND! MORE ROOM FOR NUTS!” | “Additional acreage is now taxable.” |
| `decor-placed` | Decoration successfully placed; low frequency | P2 | “THAT LOOKS NUT-TASTIC!” | “The new object appears suitably expensive.” |
| `outfit-equipped` | Avatar changes outfit; infrequent | P2 | “LOOKING SHARP! VERY PREMIUM!” | “A revised uniform has been authorized.” |
| `companion-equipped` | Garden companion equipped | P2 | “A NEW LITTLE FRIEND!” | “Additional personnel have entered the estate.” |
| `collection-complete` | Curated collection completed | P1 | “COLLECTION COMPLETE! YOU ABSOLUTE NUT LEGEND!” | “The collection is complete. Display it excessively.” |
| `purchase-zero` | Final satirical $0 checkout completes | P0 | “TOTAL PAID: ZERO! WHAT A BEAUTIFUL BUSINESS!” | “The total comes to zero. Please keep the receipt.” |
| `prestige-award` | New cabinet / estate achievement | P2 | “PRESTIGE UNLOCKED! THE NEIGHBORS WILL NEVER RECOVER!” | “You have received a ceremonial commendation.” |

### Fishing wharf

| Event key | Trigger / condition | Priority | Original announcer — new recording | The Nutvale Auditor — new recording |
|---|---|---|---|---|
| `wharf-welcome` | First time entering wharf | P0 | “WELCOME TO THE NUTVALE FISHING WHARF!” | “Welcome to fisheries. Returns are uncertain.” |
| `bait-daily` | Daily bait replenishment actually granted | P0 | “FRESH BAIT! TIME TO GO FISHING!” | “Your daily bait allotment has been issued.” |
| `bait-empty` | Cast blocked for lack of bait | P1 | “OUT OF BAIT! GET BACK TO THE TACKLE SHOP!” | “We appear to have exhausted the worms.” |
| `bait-purchased` | Bait purchased in shop | P1 | “PREMIUM BAIT ACQUIRED!” | “Another investment in worms.” |
| `bait-crafted` | Higher-tier bait crafted | P1 | “FANCY BAIT! FANCY FISH!” | “We have upgraded our edible inventory.” |
| `booster-traded` | Power-up successfully exchanged for bait | P1 | “YOU TRADED POWER FOR WORMS! INCREDIBLE!” | “A strategic conversion of valuable equipment into bait.” |
| `cast-line` | Line cast; randomly selected, not every click | P0 | “CAST AWAY! THERE ARE FISH TO BE HAD!” | “The fishing operation has commenced.” |
| `fish-hooked` | Fish actually takes the hook | P0 | “FISH ON! DON'T LET IT GET AWAY!” | “A prospective acquisition is resisting.” |
| `tension-high` | Line tension crosses danger threshold once | P0 | “CAREFUL! THAT LINE'S ABOUT TO SNAP!” | “Our equipment is approaching catastrophic failure.” |
| `fish-struggling` | Fish makes a large directional surge; rate-limited | P1 | “IT'S FIGHTING! HOLD YOUR NERVE!” | “The specimen disputes the terms of the acquisition.” |
| `line-snapped` | Fishing fight lost due to snapped line | P0 | “SNAP! THERE GOES THE BIG ONE!” | “The line has terminated our agreement.” |
| `fish-escaped` | Fish escapes for another reason | P0 | “THE ONE THAT GOT AWAY!” | “The prospective asset has withdrawn.” |
| `fish-common` | Successful common catch | P0 | “A FISH! A BEAUTIFUL, WONDERFUL FISH!” | “An ordinary specimen. Welcome to the ledger.” |
| `fish-uncommon` | Successful uncommon catch | P1 | “OOOH! THAT'S NOT AN EVERYDAY FISH!” | “A slightly less ordinary specimen has arrived.” |
| `fish-rare` | Successful rare catch | P0 | “RARE FISH! YOU GLORIOUS ANGLER!” | “A rare asset. Please resist celebrating excessively.” |
| `fish-epic` | Successful epic catch | P0 | “EPIC CATCH! THE WHOLE WHARF IS SHAKING!” | “The specimen's valuation requires executive approval.” |
| `fish-legendary` | Successful legendary catch | P0 | “LEGENDARY FISH! WHAT HAVE YOU PULLED OUT OF THERE?!” | “This creature was not included in the risk assessment.” |
| `fish-kept` | Player confirms keep in aquarium | P0 | “WELCOME HOME, LITTLE FISHY FRIEND!” | “The specimen has been transferred to residential holdings.” |
| `fish-sold` | Player confirms sale for Nutvale Dollars | P0 | “SOLD! SWEET, SWEET NUTVALE DOLLARS!” | “The fish has been successfully monetized.” |
| `fish-released` | Player releases fish for no payment | P1 | “BACK TO THE WILD! FAREWELL, FISHY FRIEND!” | “The asset has been released without compensation.” |
| `aquarium-full` | Keep refused because all aquarium slots are filled | P1 | “YOUR TANK IS FULL! TIME TO EXPAND!” | “There is no authorized vacancy.” |
| `aquarium-expanded` | Aquarium capacity upgrade purchased | P0 | “MORE ROOM FOR FISH! AQUARIUM EXPANDED!” | “Residential capacity has been increased.” |
| `aquarium-first-fish` | First fish ever placed in tank | P1 | “YOUR FIRST AQUARIUM RESIDENT!” | “Our inaugural aquatic tenant has arrived.” |
| `aquarium-decor` | Tank decoration / background actually changed | P2 | “YOUR FISH ARE LIVING IN LUXURY!” | “The habitat is now substantially overfurnished.” |
| `rod-new` | Fishing rod tier / model purchased | P1 | “NEW ROD! BIGGER FISH, BIGGER DREAMS!” | “Capital equipment has been upgraded.” |
| `rod-worn` | Rod durability reaches warning threshold | P1 | “YOUR ROD'S LOOKING ROUGH!” | “Maintenance has become financially advisable.” |
| `rod-broken` | Rod reaches zero durability | P1 | “ROD BROKEN! SOMEONE CALL THE TACKLE SHOP!” | “A complete equipment failure. Delightful.” |
| `rod-repaired` | Damaged rod is repaired | P1 | “FIXED UP! BACK TO THE WATER!” | “The apparatus has been returned to service.” |
| `fish-collection-milestone` | New fish collection record / species milestone | P2 | “YOUR COLLECTION KEEPS GROWING!” | “Biodiversity has become a collectible metric.” |

## Recording budget and implementation contract

- Alternate announcer initial complete replacement: **19** existing-key lines plus **74** new-event lines = **93** distinct spoken recordings. 
- Original announcer supplemental gap package: **74** newly written lines, not re-recordings of the current 19. 
- Joint full plan: **167** new audio files across both voices, before extra takes. Stage the recording rather than requiring the entire library at once. 
- New event priorities: **27 P0**, **36 P1**, and **11 P2**. For high-frequency P0 events, record two optional alternate takes if repetition remains noticeable after gameplay review.
- Filenames: `web/audio/voices/original/<event-key>.mp3` for additions only and `web/audio/voices/auditor/<event-key>.mp3` for the alternate. Keep current `web/audio/<original-filename>.mp3` paths and keys valid. Use an event manifest mapping existing and new IDs, not blind filename normalization or duplicated logic.
- The announcer option should use one persistence field (`announcerVoice:'original'|'auditor'`) within the existing save, selectable in the current compact **Audio & Settings** screen. Voice-off is a separate global setting; keep speech captions visible. Lack of an alternate clip should produce a clear development validation error; avoid suddenly playing the wrong character's voice.
- Event triggers belong at authoritative outcomes (actual fish catch/escape, successful purchase, real elemental chain, real place/build), not button clicks that might be invalid. Do **not** voice a kept fish until `resolve(...,'keep')` succeeds or announce a premium fish simply because it was hooked.
- Audio chatter suppression: global priority ordering **failure/success > threat > milestone > ambient**; suppress repeated common calls while a higher-priority clip is speaking. No overlapping announcers. Make severe line tension actionable; avoid talking over important high-speed fishing actions.
- Respect the game's local, fully offline audio policy. Export as normalized MP3s playable on Android API 26; retain Drive master references, license provenance, source name, size, hash, duration, and validation in `assets/audio/catalog.json`. No new permission to upload audio into the game is implied by this script.
- Prototype with a few representative recordings first: `win`, `nutsplosion`, `loss-normal`, `wharf-welcome`, `fish-rare`, `fish-sold`, `purchase-zero`, `elemental-chain`; then verify actual audible intelligibility on a phone before completing the rest.
- `close-win`, `loss-normal`, rarity cues, rod damage, aquarium actions, Nutdex, and elemental trials need explicit code wiring and tests. Documentation here does not prove those triggers already exist.

## Evidence and source paths

- `assets/audio/catalog.json` — existing MP3 inventory and Drive reference IDs
- `web/audio.js` — current voice keys, rate/pitch variance and channel logic
- `web/game.js` — current spoken event calls and their timing
- `web/fishing.js` / `web/fishing-ui.js` — current species roster, bait, rod repairs, fish outcomes and aquarium affordances
- `docs/wiki/Audio-Pipeline.md` — current effect/voice routing and offline bundling requirements

This list is a script and gap inventory, *not a completed audio recording, live voice-selector implementation, or release*.
