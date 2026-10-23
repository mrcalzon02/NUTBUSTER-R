# Anti-monetization and satire contract

**Google Play contingency branch exception (October 23, 2026):** This page records the original zero-dollar parody checkout on `main`; the Play build keeps all other bundles free at the outset, while offering **one optional real-money, one-time Lifetime VIP supporter package** through Google Play. The Play build never charges for nuts, gems, crates, boosters, Royal Manor or standard gameplay. VIP asks the player to support development if they enjoyed the game, with explicit pricing and an easy decline. See [Google Play Contingency](Google-Play-Contingency.md) for the binding Play-branch policy.


The game **parodies** a free-to-play premium shop without copying its most exploitative pricing. From 2026-10-22 onward, fictional optional package stickers range from **$0.99 to $9.99**, the VIP unlock is unambiguously **one-time and permanent**, and emergency hearts / five extra moves are free even at first review. There are no real subscriptions, fabricated “was” markdowns, artificial offer countdowns, or payment pressure after a defeat. The satirical surprise remains the final checkout's **TOTAL DUE: FREE ($0.00)**. Avoid spoiling that reveal in normal store cards, but never conceal or misstate a price if real payments are introduced in a separately authorized future release.

## Transaction fiction

1. Offer cards show the fictional sticker price and a **BUY PACKAGE** action.
2. Offer review maintains the premium pitch and shows the advertised price.
3. The **final checkout** reveals **TOTAL DUE: FREE ($0.00)**, states that this is parody checkout, and lets the player complete the order.
4. Completion actually grants the advertised local rewards. The heart refill and loss-screen +5 moves stay priced **FREE** at preview, do not offer fake 50%-off ads, and follow the same $0 fulfillment path. Each is an **explicit manual redemption** on its own **rolling 12-hour cooldown** since last claim; unclaimed rewards do not stack. The separate normal move allowance refills every rolling 24 hours.
5. Back/cancel must work. No payment data, account, billing permission, real card form, SDK purchase, subscription, contacts permission, coerced sharing, identity harvesting or required advertising is ever involved.

The design is satire, not real deceptive commerce: users must never be asked for payment information, and the final zero-dollar total must be legible before claiming. The app can be transparently described as free in developer documentation and external disclosures, but the in-game dramatic timing should be preserved.

## Interface and fairness

The puzzle board is stable: each swap costs one move, including swaps that make no match. Only matched tiles clear, surviving nuts keep their identities and descend via gravity, and new nuts arrive from above in legible animated cascades. Between animations, the board and controls must remain mounted instead of flashing replacement emoji and images. Early levels start at 4×5; the 8×9 board is the late-game size ceiling.

**Functional guarantee:** no decorative claim-only buttons. Test state changes, transaction totals, end screens, sprite stability, controls, and fall traces. UI parody must not compromise accessibility, discoverability of the final total, or offline function.

## Local parody ad rewards (2026-10-22)

The original eight squirrel-product posters are included as optimized local `web/art/ads/*.webp` art, not loaded from an ad exchange. They play in a voluntary **120-second fake advertisement viewer** with a small side-to-side wobble (disabled for reduced-motion preferences), a visual countdown and progress bar, and a clear **Skip · No Reward** control.

The original `Wah wahvoice.mp3` recording loops quietly during a foreground watch, respecting the voice toggle and an ad-only mute control. The ad timer **does not progress while the document is hidden**, and a delayed tick is capped to prevent a resumed phone from crediting minutes of background time. Closing, navigating away or aborting stops audio and cancels the current timer without paying.

**Daily opt-in path:** once per local calendar day, a completed watch awards **750 Golden Nuts** (`saved.coins`) and **one Hammer** (existing booster inventory). The day key persists in the local save and avoids duplicate daily payouts; this is separate from the existing daily-login gift. Gems remain separate and unchanged.

**Fictional shop path:** on non-free offer previews only, a completed watch applies **50% off that fictional sticker price** (rounded to whole cents); it never changes contents or collects money. Always-free recovery items do not offer a discount watch. Every checkout still ends in **TOTAL DUE: FREE ($0.00)**. The fake discount is bound to one offer and may not be reused as a real-money promotion without future product/legal review.

No network connection, real ad SDK, billing, analytics, or watch telemetry is required. The fake ad is a satirical optional reward, not a gate on regular level progression or existing freebies.

See [Pricing and Monetization Readiness](Pricing-and-Monetization-Readiness.md) for all nine mock offer prices, one-time ownership, and boundaries for any potential paid edition.

**Offline vouchers:** Nutbuster's optional P-256 signed promo-code support uses a per-save redemption ledger, not centralized single-use enforcement. It is not a monetization or account system. See [Promo Code System](Promo-Code-System.md); production issuing keys are intentionally not provisioned yet.
