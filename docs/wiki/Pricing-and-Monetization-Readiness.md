# Nutbuster — Fair Pricing Preview & Future Monetization Gate

**Status (2026-10-22):** Fictional price-preview revision implemented. **No payment collection is enabled or approved.** Every package continues to end in a clearly disclosed **FREE / $0.00** checkout and grants only local entitlements. No Play Billing, other purchase SDK, subscriptions, payment credentials, analytics, or real ad SDK have been added.

## Display-price ladder

The existing package IDs/array positions and reward quantities are retained deliberately. The display prices below are **USD planning anchors**, not Play Console product prices, real promotions, purchase commitments, or regional price quotes.

| Index | Offer | Preview | Current delivery | Future eligibility |
|---|---|---:|---|---|
| 0 | Gigantic Nut Package | **$4.99** | 50,000 Golden Nuts, 250 Gems, current level-valid boosters | Optional single-purchase consumable; evaluate player economy first |
| 1 | Ridiculously Premium Gems | **$9.99** | 2,000 Golden Nuts, 2,000 Gems, current level-valid boosters | Optional single-purchase consumable; high-end price ceiling |
| 2 | Royal Squirrel Bundle | **$3.99** | 9,999 Golden Nuts, 500 Gems, current level-valid boosters | Optional single-purchase consumable |
| 3 | Hundred Year Chest | **$1.99** | 10,000 Golden Nuts, 150 Gems, current level-valid boosters | Optional single-purchase consumable; no paid random reward |
| 4 | Absolutely Necessary VIP · Lifetime | **$2.99** | 1,000 Golden Nuts, 100 Gems, boosters, one-time `saved.vip` flag | If ever billed, a **one-time** entitlement; define actual enduring perks first |
| 5 | Nutty Booster Crate | **$0.99** | 3,000 Golden Nuts, 30 Gems, displayed eligible booster bundle | Optional fixed/disclosed product; never paid gambling |
| 6 | Emergency Heart Refill | **FREE** | Refill to five hearts | Always-free recovery; no paid defeat pressure |
| 7 | Extra Five Moves | **FREE** | Five additional daily moves into the current board | Always-free rescue option; no real-money pay-to-continue |
| 8 | Exclusive Royal Manor Kit | **$2.99** | Platinum Royal portrait, Platinum Fountain, Diamond Throne | Optional one-time cosmetic with durable restore entitlement |

The store's six normal cards span **$0.99–$9.99**. The Royal Manor Kit is also $2.99. The previous $199.99 / $499.99 stickers, $29.99/month VIP claim, and misleading mansion “was $499.99” price have been removed. Cosmetic and VIP ownership are **not subscriptions**, and nothing has an artificial timer or claimed discount from a fabricated former price.

## Fairness and player-protection constraints

1. **Game must stay completely playable without paying.** Story levels, Nutdex, special nuts, elemental trials, Homestead, fishing, the aquarium, and necessary assistive gameplay must remain accessible through play. The two defeat-recovery options stay free.
2. **No subscriptions by default.** The VIP flag currently persists as one-time ownership. Do not market it as monthly, recurring, or subscription-based. Before any paid VIP launch, define exactly what permanent ownership supplies beyond other free features.
3. **No real-money loot boxes.** Any eventual paid bundle must state its guaranteed contents clearly at review time; the eligible booster mix presently depends on which powers the player unlocked. Resolve and lock that specification before billing. Keep any randomized claim-only rewards earnable without paid gambling.
4. **No coercive scarcity or false discounts.** Avoid fictional countdowns, fake previous prices, forced ad views, fabricated limited supply, or urgency messaging in a truly billable checkout. A local parody ad can still award its free fictional benefits; its 50% mock discount **cannot** be treated as authorization for a real paid discount.
5. **Never charge for a free purchase.** All offers continue to disclose `TOTAL DUE: FREE ($0.00)` before fulfillment in the current version. Free hearts and free extra moves show **FREE** already on the offer review and never provide a fake discount watch button.
6. **Preserve existing player grants.** If the distribution model changes later, separately plan how to grandfather existing cosmetic ownership, booster inventories, and purchased-in-parody entitlements. Do not revoke content or convert an already earned or gifted item into a new paid requirement.
7. **No pay-to-win competitive ladder.** Evaluate effects on difficulty and future leaderboards before monetizing currencies or boosters. Nutvale Dollars, bait, fish, and aquarium progress are earned in-game at present; do not silently reclassify them as cash products.

## Technical boundary before collecting money

This update only modifies `web/game.js` fictional price presentation and supporting documentation/tests. It deliberately does not install a billing SDK, identify an external customer, verify a transaction, register purchase products, or enforce receipt-backed entitlements. The current local checkout grants the selected item for $0.00; simply replacing the total with a dollar amount would be incorrect and unsafe.

Before any real paid release, require a separately authorized billing project: create durable catalog product IDs and explicit product types (consumable versus non-consumable); use the applicable store's localized price metadata rather than fixed US strings; display a clear actual price and permission/confirmation; validate, fulfill, and acknowledge receipts with safe idempotency; restore one-time entitlements after reinstall/device change; test refunds, canceled and interrupted payments, offline states, Play versus GitHub distribution, and accidental double-delivery. The Play Billing integration lifecycle should follow the [Android Developers current guide](https://developer.android.com/google/play/billing/integrate), rechecked when work begins.

No changes to Google Play signing, publisher workflow, GitHub update mechanism, subscriptions, accounts, or ad-tech are authorized by this price-preview work.

## Tests and authoritative files

- `web/game.js`: UI prices, original offer array indices, discount/free preview rendering, no billing
- `web/progression.js`: unchanged bundle/booster rewards
- `web/homestead.js`: unchanged cosmetic purchase semantics
- `tests/ui-smoke.test.js`: preview ladder and $0 recovery / permanent-VIP assertions
- `docs/wiki/Anti-Monetization.md`: satire and transparent zero-dollar checkout contract
- `docs/wiki/Post-1.0-Platform-Roadmap.md`: monetization still requires separate approval
