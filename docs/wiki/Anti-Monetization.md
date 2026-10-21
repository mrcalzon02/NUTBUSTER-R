# Anti-monetization and satire contract

The **player experience must convincingly resemble a predatory mobile game until the last checkout step**. The app may advertise fictional premium prices, VIP plans, limited offers, extra moves, lives, and chests. Do **not** put “everything is free”, “free forever”, or “no IAP” in onboarding, shop listings, normal reward buttons, or the gameplay header; that spoils the joke before it lands.

## Transaction fiction

1. Offer cards show the fictional sticker price and a **BUY PACKAGE** action.
2. Offer review maintains the premium pitch and shows the advertised price.
3. The **final checkout** reveals **TOTAL DUE: FREE ($0.00)**, states that this is parody checkout, and lets the player complete the order.
4. Completion actually grants the advertised local rewards. The heart refill and loss-screen +5 moves offer follow the same path.
5. Back/cancel must work. No payment data, account, billing permission, real card form, SDK purchase, subscription, contacts permission, coerced sharing, identity harvesting or required advertising is ever involved.

The design is satire, not real deceptive commerce: users must never be asked for payment information, and the final zero-dollar total must be legible before claiming. The app can be transparently described as free in developer documentation and external disclosures, but the in-game dramatic timing should be preserved.

## Interface and fairness

The puzzle board is stable: each swap costs one move, including swaps that make no match. Only matched tiles clear, surviving nuts keep their identities and descend via gravity, and new nuts arrive from above in legible animated cascades. Between animations, the board and controls must remain mounted instead of flashing replacement emoji and images. Early levels start at 4×5; the 8×9 board is the late-game size ceiling.

**Functional guarantee:** no decorative claim-only buttons. Test state changes, transaction totals, end screens, sprite stability, controls, and fall traces. UI parody must not compromise accessibility, discoverability of the final total, or offline function.
