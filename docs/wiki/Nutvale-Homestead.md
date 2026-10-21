# Nutvale Homestead — design and implementation specification v1.0

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

## Initial content
A 12-plot garden with a fixed cottage; 28 decoration definitions (26 earned, 2 premium), 8 avatars (7 earned, 1 premium), and 11 award definitions. Milestones include 1/5/10/20/25/50/100/200/300/400/500 (other intervening decorations add more granular rewards). Medal cabinet aggregates completed levels, stars, best recorded level score, three-star finishes, and high score records. Completion at level 500 awards the capstone "Legend of Nutvale" monument.

## Satirical premium exchange
Advertise the "Exclusive Royal Manor Kit" at a ludicrous fictional price. Show order review using existing checkout route and hide final price there; next screen discounts to FREE $0.00 without accepting payment details. Completing order records royal-estate=true, granting Platinum Royal avatar, Platinum Fountain, and Diamond Throne once. Store/reward claims should never introduce a genuine premium lock or a deadline that destroys collectibles.

## Planned expansion (beyond v1.0)
- Visually distinct estate grounds and larger unlocked wings for later campaigns, rather than tiny plots forever.
- Trophy pedestals, collectible sets, thematic architecture, placeable animated pets, and larger static trophy exhibits.
- Limited-looking event collections with always-available catch-up or archive paths; parody the pressure without inducing actual player loss.
- Humorous faux rarity, fake prestige rankings explicitly labeled fictional, and eventually a property visitor gallery export requiring no external social API.
- Additional premium theater: multi-currency exchanges, VIP tier ladders, mock subscriptions, and season-pass fanfare, all still $0 on checkout and never required for fair gameplay.

## Release gates
A. Baseline Node engine/progression/board tests remain green.
B. Old save migration does not reduce stars/booster inventories/wallet; initialized Homestead is stable on repeat.
C. Clearing eligible stage unlocks matching decor, a cabinet record, and newly eligible avatar; failed attempts and unplayed stages do not.
D. Placement, re-placement, removal, unsupported IDs, unknown slots, reload and premium claims are verified.
E. Review vs final checkout behavior preserves the reveal; premium item is owned only after completion.
F. Screen fits narrow Android landscape/portrait and desktop input; no runtime external asset fetch.
G. Builds and signed release artifacts are independently verified before asserting distribution.
