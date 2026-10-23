# Nutbuster Offline Promo Codes — Signed Voucher System

**Implementation state (October 22, 2026):** First-generation issuer, offline verifier, in-game redemption form, constrained reward grants, and local replay ledger are now implemented. **No production issuer key is configured in the repository**, so no actual production vouchers have been generated or published. Do not advertise live promo redemption until the issuer public key is provisioned and device tests pass.

## What it can — and cannot — guarantee

NUTBUSTER is offline-first. Its promotional voucher uses an **ECDSA P-256 SHA-256 digital signature**. The issuer signs the reward; the game ships the **public key only** and rejects forged/modified codes. A 128-bit CSPRNG nonce distinguishes issued vouchers. A player must explicitly redeem each voucher and a record persists in `nutbuster.v1` (`promoRedemptions[nonce]`) to reject duplicate claims **within the same save**.

A cryptographic signature is **not encryption**, and it is **not a centralized redemption service**. Offline code validation **cannot** enforce genuine global single-use, limited total campaign redemption, one code per person/account/device, revocation, or trustworthy expiration against deliberate local-clock changes and save rollback. The player can restore a backup from before redemption or claim the same valid voucher on another installation. No change to the local ledger can eliminate those possibilities. A globally single-use code, first-N-redemptions promotion, real-money entitlement, or fraud-sensitive campaign needs a server or an online platform redemption authority to record claims atomically.

The offline signature does prevent someone inventing new valid codes or changing one voucher from 750 Golden Nuts to 750,000, assuming the issuer private signing key remains secret.

## Format and supported grants

The voucher is `NBR1.<base64url JSON payload>.<base64url 64-byte signature>`. The signature authenticates the exact ASCII bytes `NBR1.<payload>` using ECDSA P-256 SHA-256. This intentionally produces a **paste/QR-friendly long code**, not a deceptively short 12–16-character CD key. Short readable keys with a secure global inventory would require a separate server or a shipped and exhaustible list of predefined keys.

The signed JSON is `{"v":1,"kid":"main-2026","nonce":"32 lowercase hex characters","nbf":0,"exp":0,"grant":{"nuts":750,"gems":10,"boosters":{"hammer":2}}}`. `nbf` and `exp` are epoch milliseconds, with zero meaning no boundary. Issuer ID `kid` allows multiple trusted public keys (for rotation, but not retroactive revocation while offline). Grant types and hard caps:

| Field | Maximum per voucher | Result |
|---|---:|---|
| `nuts` | 100,000 | Golden Nuts in the existing wallet |
| `gems` | 10,000 | Gems in the existing wallet |
| `moves` | 50 | Extra moves added to the current 24-hour daily wallet, not reset |
| `hearts` | 5 | Up to five hearts total |
| `boosters` | 20 per named kind | Guaranteed quantities; locked kinds turn into the strongest currently unlocked booster |
| `vip` | boolean | Permanent VIP unlock for this save, including the current daily benefit allocation |

There are **no random grant outcomes**: the voucher encodes the actual reward and the client validates it before applying. Other currencies, aquarium animals/rods, cosmetics, timed paid offers, and arbitrary executable actions are intentionally **not authorized** in first-generation codes. The one-time ledger holds at most 5,000 unique redemption identifiers per save to bound untrusted data growth; reaching the cap returns a clear error.

## Issuer creation and example command

Run on a trusted machine with Node installed, outside the game repository. **The private key must never be copied into `web/`, Drive's public release assets, a GitHub commit, or an APK**. Never check in generated code lists if they are intended for controlled release.

```bash
node tools/promo-issuer.js keygen --out /secure/nutbuster-issuer --kid main-2026
```

This creates a private PEM, public JWK, and a `promo-keys.js` public-key configuration. Store the PEM as a backed-up private secret, with restrictive filesystem permissions, and copy **only** the generated `promo-keys.js` into `web/promo-keys.js` before testing a production build. At this time that game file is an **empty public-key registry** on purpose. Replacing it requires a separate publisher-authorized key provisioning step: do not generate and commit a private key for convenience.

Once the public key is packaged, issue a group of vouchers:

```bash
node tools/promo-issuer.js issue --private /secure/nutbuster-issuer/issuer-private.pem --kid main-2026 --grant '{"nuts":750,"gems":25,"boosters":{"hammer":1}}' --count 10 --exp 2027-01-01T00:00:00Z --output /secure/nutbuster-codes.txt
```

The issuer uses Node's `crypto.randomBytes(16)` for unique nonces and `crypto.sign('sha256', ..., {dsaEncoding:'ieee-p1363'})` to produce the 64-byte format expected by browser Web Crypto. No encryption/decryption key is needed on the client. No seed, sequence, or pseudo-random schedule inside the APK can generate new authentic vouchers.

## Redemption UX and device checks

The **Shop** and **Rewards** pages contain a compact expandable **Redeem a Promo Code** entry. Players paste the entire code, redeem explicitly, and receive a concrete reward notification. Empty/invalid/expired/previously redeemed codes do not grant anything. The redemption button is disabled in a build with no registered issuer public key. The local redemption record is saved using the existing `nutbuster.v1` key; normal app restart preserves it. Using a fresh save is inherently a different redemption environment.

The verifier relies on `crypto.subtle.importKey('jwk')` and `crypto.subtle.verify()`, which requires a Web Crypto-capable secure context. Compatibility varies by WebView/security origin; **Android API 26's real packaged WebView must be exercised**, including offline `file://` origin behavior. No insecure plaintext or mathematical fallback is permitted if Web Crypto is absent. Device tests must cover signed good/bad codes, clipboard paste, key import, signature corruption, expiration, restart, countdown interaction, duplicate input while pending, and a disconnected device.

For a later genuinely monetized release, voucher/receipt claims must not depend solely on editable local saves. Add a separately authorized online service or platform redemption system for secure global use limits and synchronization. Deployed signing keys, Play Billing, user accounts, and cloud telemetry are **not** part of this task.

## Source ownership and testing

- `tools/promo-issuer.js`: issuance and private key generation; refuses an issuer secret inside the repository
- `web/promo-keys.js`: intentionally unconfigured public verification-key registry
- `web/promo-codes.js`: P-256 signed code validation and deterministic reward application with save-local ledger
- `web/game.js`, `web/style.css`, `web/index.html`: integrated compact offline redemption interface
- `tests/promo-codes.test.js`: real Node P-256/WebCrypto sign+verify and tamper/replay tests
- `tests/benefits-and-claim-clocks.test.js`: independent 12h manual claims and VIP daily 24h grants

A signed-code source test is not evidence that the APK's real WebView can import keys in its installed origin; complete that gate before calling promo code redemption production-ready.
