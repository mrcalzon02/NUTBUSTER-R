# NUTBUSTER — Google Play contingency branch

**Branch:** `feature/google-play-contingency` (not `main`)  
**Status:** Integration work in progress, **NOT verified for paid publication**.  
**Purpose:** Prepare one switchable Android/Play distribution without changing the current GitHub APK release, signing identity, desktop builds, zero-dollar parody storefront, or GitHub updater on `main`.

## Distribution separation

| Concern | Current `main` | This Play branch |
|---|---|---|
| Android delivery | Signed GitHub Release APK | Google Play app bundle (`bundleRelease`) once credentials/config are ready |
| Updates | Native GitHub release discovery, checksum and publisher-signature validation; manual download/install | Google Play Core flexible in-app updates; **no sideload permission** or FileProvider |
| Store packages | Explicit $0 checkout parody; local grants | **All non-VIP packages are FREE ($0.00)**; only optional Lifetime VIP uses verified Google Play Billing |
| Price | Fictional display prices | FREE on every non-VIP offer; **only** VIP displays a localized Google Play price |
| Heart and moves refills | Free 12-hour claim | Still free and independent |
| Invites and sharing | GitHub release-link sharesheet/browser copy | Play listing-link sharesheet/browser copy, including Facebook where installed |
| Achievements and friends | Offline/local progress | Play Games v2 achievement client and permission-based Friends read; local play must remain possible without sign-in |
| Facebook Login / account friends | Not present | **Not yet linked; requires Meta app, IDs, permissions, review and real-device testing** |
| Cross-device save sync | Local save only | Still local. An optional safe reconciliation system must be designed separately |

### One paid SKU — Lifetime VIP

**Only `nutbuster_lifetime_vip` (existing shop index 4) is a real transaction.**
This is a one-time durable, non-consumable in-app product processed with Google Play Billing, never a subscription. The actual localized price is read from Play, not from the app's illustrative price array. Intended starting sticker price in the game design is $2.99, subject to Play Console regional prices.

The offer explicitly thanks the player for enjoying NUTBUSTER, invites voluntary support, and makes clear that gameplay and all other packages remain FREE. VIP has the already-described fixed daily bonuses and initial pack; no randomized real-money purchases. This is an optional digital supporter purchase, **not a charitable or tax-deductible donation**.

Shop indices **0, 1, 2, 3, 5, 6, 7 and 8 are all FREE**; none has an active Play Billing SKU. Even when an obsolete SKU exists in a future Play Console, the app deliberately cannot query, initiate, validate, consume, or acknowledge it. The Royal Manor kit is free. VIP purchase confirmation is idempotent and requires verification.

VIP already unlocked locally through a previous free build or valid promotion does not automatically count as a paid supporter purchase. A separate verified receipt determines whether the supporter product has actually been bought. Users need not pay to retain locally unlocked game benefits.

The separate Play shop displays a large thank-you and **ENTIRELY OPTIONAL** disclaimer; its checkout repeats the disclosure and offers a visible **NO THANKS · KEEP PLAYING FREE** action before entering the real Google Play payment flow.

## Native Play code

- `PlayBillingCoordinator.java`: query catalog, start Billing flow, process `PENDING` / `PURCHASED` / canceled states; verify purchase token against trusted HTTPS verifier; notify WebView only when verified; consume one-time consumables and acknowledge durable items **after local delivery was saved**.
- `PlayUpdateService.java`: request Play Core flexible updates, player approval and a restart/finish step; no APK downloading/sideload installation.
- `PlaySocialService.java`: opt-in Play Games v2 achievements (levels 1, 100, 500, 1000), achievements UI, and friend discovery subject to separate player consent. PGS friends API is not the retired Play real-time multiplayer invitation service. Do not claim Facebook friends are PGS friends.
- `web/play-platform.js`: Play-only browser bridge. Paid purchases **fail closed** when the native bridge or localized catalog is missing.
- `services/play-verifier`: starter Cloud Run-compatible HTTPS receipt-verification endpoint. It checks PurchaseState `PURCHASED` via `purchases.productsv2.getproductpurchasev2`, ensures exact product/quantity, and stores an atomic hash-based purchase ledger in Firestore. Installation pseudonyms bind consumables to their original install; durable purchases can be restored from the original Play account's owned-token query. Cloud credentials remain **off device and out of GitHub**.

## Configuration required after Play Console enrollment

1. Register Google Play developer account; create app package **`io.github.mrcalzon02.nutbuster`** and its Play Games game project. Review Play Console account verification, country, testers, merchant setup and payments profile.
2. Decide and verify signing migration before first upload. Existing signed GitHub APKs will upgrade in place only if installed-update certificates are compatible. Never replace the NUTBUSTER publisher key or break the GitHub installation lineage by accident. Configure Play App Signing / upload key using actual Play Console instructions and certificate fingerprints.
3. Create **only the single** non-consumable Play Console in-app product `nutbuster_lifetime_vip`. Assign regional prices, availability, license testers and product offers; verify its catalog price on a Play-installed test app. Do not create paid products for any other bundle.
4. Enable Android Publisher API for the Cloud project, authorize a server-side service account to read purchase states, provision **Firestore** and deploy `services/play-verifier` to Cloud Run with HTTPS. Do **not** put credentials into `gradle.properties`, `assets`, source code or the APK.
5. Supply `-PnutbusterPlayVerifierUrl=https://YOUR-VERIFIER/verify` and `-PnutbusterPlayGamesProjectId=YOUR_NUMERIC_PROJECT_ID` at Play build time; optional `-PplayAchievementLevel1=...`, `-PplayAchievementLevel100=...`, `-PplayAchievementLevel500=...`, `-PplayAchievementLevel1000=...`. Product/achievement IDs can only come from real Play Console configuration.
6. For Facebook account-linked friends, separately create a Meta developer application, obtain Facebook Login Android configuration, add corresponding URL/deep-link handling, request any applicable review for `user_friends`, and implement meaningful consent/permission-declined UX. This API can reveal only **participating app-using friends** who provided the required permissions, not a general list of Facebook friends. The existing Android sharesheet can already target Facebook without Facebook Login.
7. Audit privacy policy, Data safety, child safety/audience, digital purchase disclosures, accessibility and refund flows; create an actual Play Store listing and test AAB via internal testing.

Local dev check: `gradle -p android --no-daemon :app:assembleDebug`, `node tests/play-contingency.test.js`, `node tests/play-verifier-policy.test.js`. The **release** build fails unless verifier HTTPS URL, Games ID and the pinned publisher signer are configured. **No automated Play publishing workflow has been added.**

## Mandatory pre-launch gates — unresolved

- [ ] Compile Android APK + AAB against resolved Play libraries; launch it on a real Play-installed internal-test build. Browser/static source checks are not sufficient.
- [ ] Test the VIP SKU with Play license testers: localized price, cancellations, pending payments, duplicate callbacks, lost network, Play unavailable, restore after reinstall, Google Play account changes, and exact guaranteed VIP contents. Confirm **all other bundles remain free** and never invoke BillingClient.
- [ ] **Security gate:** authenticated backend account binding / Play Integrity anti-abuse, coherent multi-device product ownership, robust transaction journal and failure-safe acknowledgment. Present receipt bridge and local save remain insufficient as final high-value monetary authority; an instrumented client can change local state. Do not claim a secure production economy until independently verified.
- [ ] **Recovery gate:** missing localStorage and interrupted/reinstalled installs must recover the non-consumable VIP entitlement safely, without double grants or losing an already paid but unacknowledged order. The native Play owned-purchase query and verified account restore require device testing.
- [ ] Verify refunds, chargebacks and voided purchases / RTDN server notifications. A valid receipt once does not prove the purchase remains valid forever.
- [ ] Verify Play Games authentication, consent, achievement IDs, platform opt-out and friend data minimization. Restore genuinely completed milestones after opt-in if wanted, without fabricating achievements.
- [ ] Complete Meta Login + reviewed Facebook friend functionality, if it remains required for Play launch. Sharesheet is not Facebook friend integration.
- [ ] Audit branch tests inherited from the GitHub APK distribution for Play-branch intent; never relax original `main` tests just to pass a contingency build.
- [ ] Confirm package name, upload signing and in-place migration strategy with actual Play Console.
- [ ] Preserve `main`'s GitHub updater and release workflow; **do not merge or publish this branch automatically**.

Google references: https://developer.android.com/google/play/billing/integrate ,
https://developer.android.com/google/play/billing/lifecycle/one-time ,
https://developer.android.com/guide/playcore/in-app-updates/kotlin-java ,
https://developer.android.com/games/pgs/android/friends ,
https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.productsv2 .

## Swap criterion

Only after all gates pass, explicitly authorize integration onto the production branch and configure a Play-distribution release. Preserve GitHub/self-hosted builds independently; never silently redirect existing APK installations to Play while their signing/update path is unresolved.

## October 23 security continuation

The branch now has purchase-bound Play Integrity standard attestations, server-side Play App Signing certificate checks, Google Play Games one-time server authorization, HMAC-pseudonymous optional accounts, signed short-lived sessions and tightened native WebView/network boundaries. **Financial and account data are protected more strongly than ordinary local game assets.** Exact implementation and outstanding launch gates are maintained in [Play Financial and Account Security](Play-Financial-And-Account-Security.md). Do not substitute this infrastructure for the pending real-device, Google-account, refund and delivery-recovery tests.
