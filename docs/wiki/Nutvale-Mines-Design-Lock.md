# Nutvale Mines — Mining & Industrial Economy Design Lock v1.0

**Status: DESIGN LOCKED / IMPLEMENTATION PENDING.** This is the approved product contract, **not** proof that the current game has the finished mining minigame. All changes to the HARD rules require explicit owner approval. Machine-readable authority: [nutvale-mines-design-lock.v1.json](../economy/nutvale-mines-design-lock.v1.json).

## Concept and player loop

The mine is a separate, fully playable **tap-to-excavate** minigame. We deliberately reuse the match-three game's large, clear square tile tap interaction, sound cues and layered effects, **but not its swap/match logic**. The player cracks persistent stone targets with a finite daily strike allowance, surveys rock with unlockable gloves, and hauls whatever ore actually exists. Most importantly, **some stones are barren**. Large boards offer more total ore pockets but *lower per-tile odds* of striking ore.

Progression loop: **Mining strikes → concealed rocks → ore in cart → unload → refinery (ore → metal → goods) → sell goods for Nutvale Dollars (N$) → buy Prospector's Writs → enter the second Nutravaganza campaign.** Fishing sales continue funding the same N$ balance, so no new paid wallet or softlock is needed. N$ also upgrades the mine, tools and refinery.

The mine and second campaign unlock only after **first-campaign level 500**. The second campaign comprises five fresh maps of 100 stages each, displayed as levels 1–500 but assigned **internal IDs 1001–1500**. IDs 501–650 remain reserved for existing elemental trials. The ordinary level 1–500 campaign and its progress are not replaced.

## Mining board, odds and daily tools

Each dig site has a single immutable, seed-derived rock layout. A tap on an unbroken rock consumes **one daily pickaxe strike** and advances that rock's **1–3 hit** durability. Hardness distribution is **55% one-hit / 35% two-hit / 10% three-hit**, independent of the ore type. Only the *last* tap breaks open the deposit; barren tiles grant **zero ore**. A tile produces at most one ore payout per site. A new site opens automatically **only after all active tiles are excavated and all exposed ore is claimed**; opening another page or force-closing the application cannot reroll the board.

Upgrading the **Mine Map** adds one row and one column, from 4×4 up to 9×9, without wiping the coordinates of existing rocks. Empty-rock probability rises per tier. The total expected number of ore-bearing rocks still rises across the larger grids: approximately **8.8 → 24.3 pockets per complete site**, before considering available pick strikes.

The **Pickaxe** controls how many strikes can be spent in a local calendar day (12–37); it does not automatically one-shot rocks. **Survey Gloves** grant 0–5 non-destructive surveys per day. A scan reveals only **ore present / barren**, not the exact rarity or yield, and a previously scanned tile stays identified without burning another scan. Survey actions cannot excavate deposits. **Mining Cart** holds 10–80 ore units before unloading. If full when a deposit is revealed, the ore stays visibly exposed at that tile and can be picked up after unloading; it never vanishes or silently exceeds capacity.

There is one daily allowance for strikes and scans, refilled on the **next forward local calendar day**, never on refresh or backward clock movement. Upgrades give only the newly added same-day capacity (+5 strikes for Pickaxe; +1 scan for Gloves), so they cannot refill the whole daily bank. No purchasable reroll or paid strike supply is in this locked version.

| Tier | Board | Barren | Ordinary | Rich | Crystal | Expected ore pockets per site | Daily pick strikes | Glove scans | Cart max | Ore → metal | Metal → goods | N$ per good |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 4×4 | 45% | 40% | 12% | 3% | 8.80 | 12 | 0 | 10 | 4:1 | 2:1 | 300 |
| 1 | 5×5 | 50% | 35% | 11% | 4% | 12.50 | 17 | 1 | 20 | 4:1 | 2:1 | 340 |
| 2 | 6×6 | 55% | 29% | 11% | 5% | 16.20 | 22 | 2 | 30 | 3:1 | 2:1 | 380 |
| 3 | 7×7 | 60% | 25% | 9% | 6% | 19.60 | 27 | 3 | 45 | 3:1 | 2:1 | 430 |
| 4 | 8×8 | 65% | 20% | 9% | 6% | 22.40 | 32 | 4 | 60 | 2:1 | 2:1 | 480 |
| 5 | 9×9 | 70% | 16% | 8% | 6% | 24.30 | 37 | 5 | 80 | 2:1 | 2:1 | 550 |

**Drop table meaning:** Barren = 0 ore, Ordinary seam = 1 ore, Rich vein = 2 ore, Crystal pocket = 4 ore. The four listed probabilities add to **100% at every tier**. The chance of a nonempty rock is 55%, 50%, 45%, 40%, 35%, and 30% by mine tier. This is the **per-rock hidden contents distribution**, not the chance of a successful dig tap: each target still requires 1–3 strikes before its contents are known.

The UI shows these exact odds at the mine, not vague rarity labels. Ore content and rock hardness are derived from different salted seed samples at stable `x,y` coordinates; upgrading the board cannot change already revealed rocks or cherry-pick rerolls.

## Five separately upgradeable facilities (tiers 0–5)

All five tracks begin at tier 0, unlock tiers 1 through 5, and use **earned N$**; no Golden Nuts, Gems, or other premium denomination is silently converted. Show cost, before/after benefits, and actual resulting inventory **before purchase confirmation**.

| Track | Upgrade costs for tiers 1 / 2 / 3 / 4 / 5 | Guaranteed effect |
|---|---|---|
| Mine Map | N$250 / N$600 / N$1150 / N$1900 / N$3000 | Grid side grows by one; probability of any ore in a tile decreases |
| Pickaxe | N$160 / N$380 / N$720 / N$1200 / N$1900 | +5 free strikes/day; more total taps, no damage multiplier |
| Survey Gloves | N$140 / N$340 / N$650 / N$1100 / N$1750 | +1 non-destructive binary survey/day |
| Mining Cart | N$120 / N$300 / N$580 / N$960 / N$1540 | Increases haul capacity; exposed overflow stays claimable |
| Refinery | N$300 / N$700 / N$1300 / N$2200 / N$3500 | Improves ore-to-metal ratios and goods sale revenue |

A cost that would exceed available N$ must not be deducted. Max-tier upgrade controls become non-interactive with `MAX`, not an offer for an imaginary higher tier. Glove scans are explicit scan-mode actions; surveys do not alter the underlying ore distribution.

## Refinery, goods, sale, and Writ Office

Refining is a **multi-step material conversion**: unload cart ore into permanent mine stock, convert ore to metal ingots, convert metal ingots into manufactured goods, then sell goods to credit the **existing** `saved.nutravaganza.dollars` wallet. Recipes by refinery tier are in the table above. At tier 0, **4 ore → 1 metal**, **2 metal → 1 goods crate**, which sells for **N$300**; at tier 5, **2 ore → 1 metal**, **2 metal → 1 goods crate**, which sells for **N$550**.

Craft/convert buttons state precise input and output quantities, operate on positive integer batches, refuse insufficient inventory, persist on completion, and prevent duplicate grants after a restart. Metal and goods are not interchangeable with gems, Golden Nuts, or aquarium currency; only the finished goods sale raises the shared N$ wallet.

At the Writ Office, **one Prospector's Writ costs exactly N$180**, bought singly or in a disclosed batch, subject only to sufficient N$. N$ can come from mining goods or from fishing. There is **no direct ore → Writ conversion**. Each second-campaign stage attempt consumes **one Writ at admission**; restarting after a completed attempt is another admission. A crash during admission/loading must be handled transactionally so that the user never loses a Writ without an attempt being created. On victories, the second campaign grants its own level progress and has its own rewards ledger. Writs are never required for the original 500 levels or elemental trials.

## Campaign II and progression

| Region | Visible levels | Internal level IDs | Biome/theme |
|---|---:|---:|---|
| The Buried Boardwalk | 1–100 | 1001–1100 | Salted wharf tunnels |
| The Gilded Underroots | 101–200 | 1101–1200 | Fossilized tree roots |
| Prismatic Hollow | 201–300 | 1201–1300 | Luminous geode chambers |
| The Fossil Treasury | 301–400 | 1301–1400 | Fossil and vault systems |
| The Crown Below | 401–500 | 1401–1500 | Crown and legendary Nut Core |

All 500 Campaign II levels must be separately seeded/configured and **not** treated as copies of campaign levels 1–500 just because the legacy engine clamps level numbers. The campaign selection and victory handlers must discriminate modes; ordinary `saved.stars`, `saved.unlocked`, `saved.completed`, `P.firstClear` rewards and original campaign maps stay unchanged. The existing elemental trials at 501–650 remain independent.

## UI & art decomposition

The Mine Hub leads to **Dig**, **Equipment / Cart**, **Refinery**, and **Writ Office** views. Use one compact, touch-friendly screen per actual activity, not redundant explanatory panels. The dig view shows today's strikes, scans, carried ore, the revealed-rock grid, two clear actions (`DIG`/`SCAN`), and a compact odds disclosure. An ore rock visibly cracks and ejects its contents on its final strike; barren rock visibly crumbles without pretending that it paid a reward. Tap state and cooldown must not trigger double grants.

The four approved scene concepts from this chat serve as **art direction only until imported and visually verified in the repository**: `whimsical_crystal_cavern_mine.png` (dig), `squirrel_mountain_mining_workshop.png` (equipment), `squirrel_foundry_in_the_mountain_village.png` (refinery), and `whimsical_squirrel_mining_village.png` (hub). Decorative squirrel miners are NPCs; **the established playable human avatar must not be replaced by a squirrel**. Painted scenes are backgrounds, not fake buttons or static ore tiles. Create independently rendered rock tile sprites (3 damage stages), barren/vein reveals, pickaxe impact, glove scan pulse, cart fill state, refinery pours, ingots, goods and Writ overlays. Preserve safe-area support, reduced-motion state, and accessible non-color-only distinctions.

## Save migration and atomic transactions

Reuse `nutbuster.v1` and `saved.nutravaganzaExpedition`; add `schemaVersion: 2`, independent equipment tiers (`mineTier`, `pickTier`, `gloveTier`, `cartTier`, `refineryTier`), permanent `tileHitsByXY` and `tileScansByXY` keyed by stable coordinates, `exposedOreByXY`, cart ore, warehouse ore, metal, goods, writs, daily budgets, and Campaign II stars.

The current prototype at `web/nutravaganza-expedition.js` has a 4×4 fixed board, a guaranteed ore reward per rock, one `mineTier` that governs picks, and an **old direct ore → Writs refine action**. These are explicitly **superseded prototype rules** and must be replaced before integrating the minigame with the player UI. Preserve legitimate pre-v2 ore, writs, region progress, day, seed and previously cracked cells. On migration, old broken tiles must be marked as already paid, not rolled into fresh ore prizes; old pick budgets must not refill on that migration. Negative, NaN, fractional and overflow transaction quantities are rejected rather than credited.

## Definition of done and release gate

1. All 6 boards render; existing tile coordinates and excavation progress survive upgrades/reload.
2. No ore from barren stone; odds match disclosed tier probabilities for all rock outcomes.
3. Strikes and scans consume correct daily budgets; invalid/full/excavated taps do not spend.
4. Ore never disappears when cart full; exposed unclaimed deposits remain redeemable.
5. Reenter mine, foreground/background app, backward-clock and restart cannot reroll an opened site.
6. Refinery and workshop deduct inputs atomically; sales credit only one N$ balance.
7. Writ buys spend N$180 exactly; 1 Writ debited per admitted expedition attempt.
8. Five 100-level areas use IDs 1001-1500 and preserve trials 501-650 and base campaign 1-500.
9. No first-campaign stars/rewards/unlocked state modified when second campaign levels complete.
10. Shop odds/upgrade yields accurate; no undisclosed rewards or paywall.
11. No release-certified claims until actual device minigame endurance and package smoke tests.

**Lock classification:** gameplay and economic rules above are HARD / OWNER_APPROVAL_FOR_CHANGE. The numeric balance is **v1.0 provisional for playtesting but locked as the current implementation target**; adjustments require a new version and explicit approval, not silent auto-balancing. The existence of this design, the approved scene images, or a passing schema test is **not** a claim that the full mining game has shipped.
