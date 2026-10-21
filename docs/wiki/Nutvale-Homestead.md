# Nutvale Homestead — design and implementation specification v1.1 (expansion phase 2)

## Intent
Nutvale Homestead is a playable second progression layer inside the existing offline-first NUTBUSTER match-three satire. Players receive an estate, display earned trophies and cosmetics, change their squirrel persona, and compare their own achievements. No real checkout, ad dependency, tracking, subscription, or server account is permitted. A fictional premium offer must continue through the two-stage review and show the final **FREE / $0.00** price only at its conclusion; never prematurely disclose it in marketing copy.

## Design invariants
1. **Evidence-based trophies.** Level trophies and avatars require stars from an actual cleared level; an unlocked campaign marker or purchased cosmetics never proves a win. Best scores require real recorded victory results. Existing old saves have stars but no historical per-level scores; never fabricate them.
2. **Ownership survives rearrangement.** Item placement is a single-instance 12-plot 4-by-3 grid. Selecting a decoration then a plot moves it; tapping an occupied plot without selection returns the item to storage. Overwriting a plot returns displaced decor to storage. The estate itself is permanent. Collections unlock idempotently from the saved campaign record; players cannot repeatedly mint objects on a replay.
3. **Avatars are cosmetic.** Wardrobe changes do not alter win rates. The faux platinum-royal cosmetic set uses the existing satirical checkout. It unlocks exactly three cosmetics and remains available; no hidden actual charges, FOMO penalties, or restricted event windows.
4. **Compact presentation.** Single Homestead view, horizontal collection and wardrobe scrollers, concise cabinet, touch targets >=44 px, no redundant explanatory cards or extra tabs. Accessibility: semantic HTML buttons, names for each plot, no hover-only controls.
5. **Offline first.** Progress remains inside the existing nutbuster.v1 localStorage save. Reloads preserve layout, avatar, scores, and claimed cosmetics. Old saves migrate in place. No dependence on clock for ownership.
6. **Reward semantics.** Cosmetic grants are distinct from gameplay boosters and coins. Completing levels remains the main way to earn decorations. The satirical premium offer cannot falsify earned records.
7. **Interoperability.** All storefront offers ultimately charge $0 and grant locally. Shared engine, WebView Android, and Windows/Linux desktop use the same files. No extra SDKs or external assets.

## Core loop
Play campaign → earn stars and a true high score → unlock decorations, avatars and trophies → visit Homestead to place items → inspect cabinet and plan the next milestone → return to the level map.

## Original phase 1 content
A 12-plot garden with a fixed cottage; 28 decoration definitions (26 earned, 2 premium), 8 avatars (7 earned, 1 premium), and 11 award definitions. Milestones include 1/5/10/20/25/50/100/200/300/400/500 (other intervening decorations add more granular rewards). Medal cabinet aggregates completed levels, stars, best recorded level score, three-star finishes, and high score records. Completion at level 500 awards the capstone "Legend of Nutvale" monument.

## Satirical premium exchange
Advertise the "Exclusive Royal Manor Kit" at a ludicrous fictional price. Show order review using existing checkout route and hide final price there; next screen discounts to FREE $0.00 without accepting payment details. Completing order records royal-estate=true, granting Platinum Royal avatar, Platinum Fountain, and Diamond Throne once. Store/reward claims should never introduce a genuine premium lock or a deadline that destroys collectibles.

## Phase 2 implementation: Nutvale becomes a proper estate

Five geographically distinct grounds are now navigable from one compact screen. All unlock from **actual stars earned at the milestone**, not merely the campaign's unlocked level. A prize or pay-to-win-style cosmetic offer must never fabricate those stars.

| Grounds | Victory gate | Display plots | Stable positions | Visual identity |
|---|---:|---:|---|---|
| Cottage Green | Initial | 12 | 0–11 | Green lawn, original cottage |
| Whispering Orchard | Level 25 | 8 | 12–19 | Fruit grove, warm meadow |
| Manor Terrace | Level 100 | 8 | 20–27 | Pale stone terrace |
| Moonnut Lake | Level 250 | 8 | 28–35 | Blue waterfront |
| Crown Gardens | Level 400 | 8 | 36–43 | Royal gold and purple |

Players select a grounds button and then tap an inventory item followed by a valid plot. Existing decorations may be moved between grounds without duplication; displaced furniture returns to the collection. Attempting a locked plot is rejected by the model itself, not only through a disabled UI control. Migration preserves the exact original 0–11 positions and newly earned valid placements; it rejects fabricated rewards and invalid or duplicate placement entries. Decorative scenic details and companion motion use CSS, with reduced-motion support.

### Buildings and estate investment

| Building | Victory gate | Golden Nuts to construct |
|---|---:|---:|
| Acorn Cottage | Initial | 0 |
| Walnut Lodge | 25 | 2,000 |
| Nutwood Manor | 100 | 8,000 |
| Regal Estate | 250 | 20,000 |
| Nutvale Palace | 400 | 50,000 |

Once built, a house is permanently available in the player's local collection. Switching back to an owned building costs nothing. A fresh construction reduces the existing Golden Nut wallet only once and never consumes gems or real currency. A gate checks actual cleared-level stars before coins. Buildings are aesthetic upgrades; they do not improve puzzle odds or rewrite the record.

### Companions and cosmetics

Eight passive companions are available: Resident Squirrel (starter), Garden Hedgehog (10), Accountant Owl (25), Prizewinning Rabbit (50), Estate Inspector Fox (100), Night Auditor Raccoon (150), Golden-Horned Deer (250), and Overleveraged Dragon (500). They animate within the property display without needing a pet-food timer, breeding resources, or other compulsory attention economy. Companions are permanently available once their level is completed; selecting one persists.

### Collector rewards

The decoration catalog expands to **57 unique items**, including 24 new campaign-earned ornaments and five special set-completion items. Five curated sets form secondary goals: The Homely Collection, The Antique Nut Society, Bragging Rights, Distinguished Gardens, and The Great Nut Odyssey. When all specified components are earned through campaign clears, the set automatically awards its commemorative object. There are 15 achievement definitions, including collection and opened-estate milestones. Non-premium items are not lost when arrangements change; buying the Royal Manor Kit never counts as a campaign completion.

### Prestige plate, invitations and privacy

The prestige plate summarizes the player's achievement tier, chosen house, avatar and companion, completed levels, earned stars, cabinet awards, completed curated sets, and actual recorded personal best. The share/copy button runs through the existing local device-share helper. It sends only the generated text and the public releases link at the user's request. No email, social account, leaderboard server, unique player ID, advertising SDK, contacts permission, cloud save, or upload is required. Historic saves with no level-best records must show zero rather than fabricate score history.

### Future phase gates

1. Replace emoji/scenic gradients with licensed, optimized property art and animated sprite variants. Preserve semantic button hitboxes and fallback rendering.
2. Add personal profile themes, estate title plates, custom appearance permutations, and a collectible achievement gallery.
3. Add a local screenshot/image share path for the prestige card without an account dependency; do not claim other people's estates can be visited until a real, consent-based distribution backend exists.
4. Expand parody cosmetics and false scarcity only where missed collections have accessible archive/catch-up paths; every final checkout must remain $0.
5. Connect estate trophies to campaign finale cinematics, non-purchasable high-score distinctions, and post-500 prestige routes. Never confuse purchased cosmetics with genuine milestones.

## Release gate additions for phase 2

H. The original 12-slot save persists unchanged and serializes new grounds using stable global indices 12–43; locked grounds cannot accept tampered or premature placement.
I. Construction is atomic and one-time per building; re-equipping is free, and insufficient Golden Nuts or missing level clears do not change the wallet.
J. Collection rewards are computed from earned components (not store offers), and companion selection is level-gated.
K. Prestige plate reports only known local data, supports opt-in share/copy, and does not perform automatic uploads.
L. The eight-plot expanded-garden screen, all house buttons, pet choices, curated-set progress, and reduced-motion behavior require touch-device visual inspection before signing a production APK.

## Release gates
A. Baseline Node engine/progression/board tests remain green.
B. Old save migration does not reduce stars/booster inventories/wallet; initialized Homestead is stable on repeat.
C. Clearing eligible stage unlocks matching decor, a cabinet record, and newly eligible avatar; failed attempts and unplayed stages do not.
D. Placement, re-placement, removal, unsupported IDs, unknown slots, reload and premium claims are verified.
E. Review vs final checkout behavior preserves the reveal; premium item is owned only after completion.
F. Screen fits narrow Android landscape/portrait and desktop input; no runtime external asset fetch.
G. Builds and signed release artifacts are independently verified before asserting distribution.
