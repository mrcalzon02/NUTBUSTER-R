# Nutvale Mines — 40-tier Pickaxe and Survey Glove Implementation (v1.1)

**Approved equipment-scope amendment to [v1.0 mining design lock](Nutvale-Mines-Design-Lock.md).** The user's direct instruction authorizes 40 meaningful states for each of the two equipment tracks. This document supersedes **only** the six-stage equipment progression, associated upgrade prices, daily caps, and tier limits in the earlier locked spec. All other original mining rules remain authoritative.

## Capacity, economy, and artwork

Each track has **40 states (0–39)** and **39 individually purchased upgrades**. Pickaxes begin at **12 strikes/day**, adding five on every purchase to reach **207**. Survey Gloves begin at **zero scans/day**, adding one on every purchase to reach **39**. There are no empty upgrade tiers. Purchasing a tier adds only its incremental capacity to today's remaining budget, not a complete daily refill.

Pickaxe prices start at **N$160** and reach **N$7,190**, with **N$111,390** total investment. Glove prices start at **N$140** and reach **N$6,300**, with **N$98,140** total investment. The investment to master both is **N$209,530**, earned using the common mining/fishing Nutvale Dollars economy. Costs are increasing and shown before confirmation, alongside the player's current balance and remaining balance. No Golden Nuts, Gems, actual dollars, or purchases are involved.

40 named pickaxes and 40 named gloves directly correspond to the equipment levels; the extra four pickaxe and two glove icons are preserved as reserve cosmetics. **No level numbers are printed on the art.** Machine-readable progression is at `docs/economy/nutvale-mines-equipment-v1.1.json`. Runtime tier logic is `web/nutvale-mining-gear.js`; mining board, cart, refinery and Writ economy are in `web/nutvale-mines.js`, with `web/nutvale-mines-ui.js` and a dedicated CSS stylesheet.

## Mine activity and phased readiness

The Mine opens upon verified first-campaign level 500 completion. The playable screen offers Dig, Equipment, Refinery, and Writ Office. Dig uses immutable per-site seeded rock contents, 55%/35%/10% hardness, six independent map configurations, cart hold/overflow behavior and monotonic daily budgets. N$ mining upgrades use the established cart/map/refinery five-upgrade tracks, unchanged.

Smelt ore into metal, craft metal into goods, sell goods for N$ and purchase Writs for N$180. The old direct-ore-to-Writ prototype is intentionally **not loaded**. The **Campaign II 500-stage minigame is still unimplemented**, and Writ entry buttons will not be presented as playable until its level engine, mode ledger and atomic admission are actually authored and verified.

## Asset distribution and integration

The transparent, individually sliced source art (86 complete sprites, two atlases, checksums, slicer and proofs) has been uploaded to the user's connected Google Drive NUTBUSTER folder:
**[Nutvale_Mining_Tools_86_Transparent_Sprites.zip](https://drive.google.com/file/d/1ySfEltY1N0rS5w2RWOSxFh0WbHXaY_l2/view?usp=drivesdk)**.

The web application references the PNGs by their stable paths `web/art/nutvale/mining-tools/{pickaxes,gloves}/<name>.png`. Art binaries are **not yet verified in the GitHub repository**; the UI falls back to an emoji if an asset has not been installed. This is an intentional staging gap, not a claim that the graphics are included in the packaged game. Unpack the Drive ZIP at repository root and run the reproducible slicer before the final asset commit and app packaging.

## Required tests

Run `node tests/nutvale-mines-40-tier.test.js` and legacy `node tests/nutvale-mines-design-lock.test.js`, then the full existing tests. Device visual QA and a release-build installation test are still necessary. The v1.0 design lock remains in place for all rules other than the expressly approved equipment amendment.
