# Nutbuster Offline Promo Codes — Signed Voucher System

**Implementation state (October 22, 2026):** A working **public verification key** (`nutbuster-2026-a`) is now configured in the game, and nine **genuine signed master codes** (one per store offer) have been issued and cryptographically verified. The nine codes and matching private PEM are **not stored in GitHub**: the owner receives them as a separate private owner-vault archive. The local issuer manager and save-local replay protection are implemented. **Android API 26 packaged WebView redemption is not yet verified**; do not claim Play release readiness from source/Node checks. No server-side single-use guarantee exists.

## What it can — and cannot — guarantee

NUTBUSTER is offline-first. Its promotional voucher uses an **ECDSA P-256 SHA-256 digital signature**. The issuer signs the reward; the game ships the **public key only** and rejects forged/modified codes. A 128-bit CSPRNG nonce distinguishes issued vouchers. A player must explicitly redeem each voucher and a record persists in `nutbuster.v1` (`promoRedemptions[nonce]`) to reject duplicate claims **within the same save**.

A cryptographic signature is **not encryption**, and it is **not a centralized redemption service**. Offline code validation **cannot** enforce genuine global single-use, limited total campaign redemption, one code per person/account/device, revocation, or trustworthy expiration against deliberate local-clock changes and save rollback. The player can restore a backup from before redemption or claim the same valid voucher on another installation. No change to the local ledger can eliminate those possibilities. A globally single-use code, first-N-redemptions promotion, real-money entitlement, or fraud-sensitive campaign needs a server or an online platform redemption authority to record claims atomically.

The offline signature does prevent someone inventing new valid codes or changing one voucher from 750 Golden Nuts to 750,000, assuming the issuer private signing key remains secret.

## Format and supported grants

The voucher is `NBR1.<base64url JSON payload>.<base64url 64-byte signature>`. The signature authenticates the exact ASCII bytes `NBR1.<payload>` using ECDSA P-256 SHA-256. This intentionally produces a **paste/QR-friendly long code**, not a deceptively short 12–16-character CD key. Short readable keys with a secure global inventory would require a separate server or a shipped and exhaustible list of predefined keys.

The signed JSON can carry a fixed grant (for example, `{"v":1,"kid":"nutbuster-2026-a","nonce":"32 lowercase hex characters","nbf":0,"exp":0,"grant":{"nuts":750,"gems":10,"boosters":{"hammer":2}}}`) or a **signed store package ID**, such as `"grant":{"package":"shop0"}`. The package's full contents are resolved by the game's trusted catalog, not supplied by an unauthenticated client. `nbf` and `exp` are epoch milliseconds, with zero meaning no boundary. Issuer ID `kid` allows multiple trusted public keys (for rotation, but not retroactive revocation while offline). Grant types and hard caps:

| Field | Maximum per voucher | Result |
|---|---:|---|
| `nuts` | 100,000 | Golden Nuts in the existing wallet |
| `gems` | 10,000 | Gems in the existing wallet |
| `moves` | 50 | Extra moves added to the current 24-hour daily wallet, not reset |
| `hearts` | 5 | Up to five hearts total |
| `boosters` | 20 per named kind | Guaranteed quantities; locked kinds turn into the strongest currently unlocked booster |
| `vip` | boolean | Permanent VIP unlock for this save, including the current daily benefit allocation |
| `package` | one approved SKU | Grant its exact bundle through the game store/booster authority; cannot be mixed with other grant fields |

There are **no random grant outcomes**: the voucher encodes the actual reward and the client validates it before applying. Other currencies, aquarium animals/rods, arbitrary cosmetics, timed paid offers, and executable actions are not authorized; the **specific existing Royal Manor Kit** is an approved fixed-package entitlement and unlocks through `NutHomestead.purchase`. The one-time ledger holds at most 5,000 unique redemption identifiers per save to bound untrusted data growth; reaching the cap returns a clear error.

## Issuer creation and example command

Run on a trusted machine with Node installed, outside the game repository. **The private key must never be copied into `web/`, Drive's public release assets, a GitHub commit, or an APK**. Never check in generated code lists if they are intended for controlled release.

```bash
node tools/promo-issuer.js keygen --out /secure/nutbuster-issuer --kid main-2026
```

This creates a private PEM, public JWK, and a `promo-keys.js` public-key configuration. Store the PEM as a backed-up private secret, with restrictive filesystem permissions, and copy **only** the generated `promo-keys.js` into `web/promo-keys.js` before testing a production build. The first publisher public key is already in `web/promo-keys.js`. **Do not overwrite it**: existing master codes depend on it. The private material for that key is in the separately delivered owner vault. To add a later issuer, `promo-manager.js publish-key` merges a NEW key ID into the public registry, preserving old published keys.

Once the public key is packaged, issue a group of vouchers:

```bash
node tools/promo-issuer.js issue --private /secure/nutbuster-issuer/issuer-private.pem --kid main-2026 --grant '{"nuts":750,"gems":25,"boosters":{"hammer":1}}' --count 10 --exp 2027-01-01T00:00:00Z --output /secure/nutbuster-codes.txt
```

The issuer uses Node's `crypto.randomBytes(16)` for unique nonces and `crypto.sign('sha256', ..., {dsaEncoding:'ieee-p1363'})` to produce the 64-byte format expected by browser Web Crypto. No encryption/decryption key is needed on the client. No seed, sequence, or pseudo-random schedule inside the APK can generate new authentic vouchers.

## Local owner manager and preissued nine-code master list (2026-10-22)

Download the separately provided **NUTBUSTER owner-vault ZIP**, then extract it to a private local directory **outside the GitHub checkout**. It contains `issuer-private.pem`, `issuer-public.jwk.json`, `promo-keys.js` (public only), `master-codes.csv` (nine signed codes), `inventory.jsonl` (issuance audit ledger with SHA-256 fingerprints but **not** reusable codes), and owner instructions. Keep the ZIP and the extracted private PEM off GitHub and public/shared Drive folders. Back up the original vault in a securely controlled location; losing the PEM prevents further issuance under this public key. Restrict filesystem access to the issuer operator.

The game accepts **one signed code per package per save** for that specific nonce; each of the nine vouchers has a distinct 128-bit nonce. A code can be shared or claimed on other saves/devices, so these are **not** globally single-use. The owner cannot discover who redeemed them from the offline issuance ledger.

| Code identity | Exactly granted in-game |
|---|---|
| `shop0` | Gigantic Nut Package: 50,000 Golden Nuts, 250 Gems, + current eligible `shop0` booster pack |
| `shop1` | Ridiculously Premium Gems: 2,000 Golden Nuts, 2,000 Gems, + current `shop1` boosters |
| `shop2` | Royal Squirrel Bundle: 9,999 Golden Nuts, 500 Gems, + `shop2` boosters |
| `shop3` | Hundred Year Chest: 10,000 Golden Nuts, 150 Gems, + `shop3` boosters |
| `shop4` | Lifetime VIP: 1,000 Golden Nuts, 100 Gems, + `shop4` boosters, permanent VIP and immediate current-cycle daily benefits |
| `shop5` | Nutty Booster Crate: 3,000 Golden Nuts, 30 Gems, + `shop5` boosters |
| `hearts` | Restore hearts to five if not already full (does not consume the separate 12-hour free refill claim) |
| `moves` | Add five moves to the current daily wallet (separate from the 12-hour free +5 claim) |
| `manor` | One-time Royal Manor Kit: Platinum Royal avatar, Platinum Fountain, Diamond Throne |

All nine are guaranteed, deterministic grants, with the same level-safe booster replacement rules as existing shop packages. The voucher for hearts is not consumed while hearts are already full; the Manor kit is not consumed if already owned. No recurring payments are created.

**On a machine with Node.js 20 or newer**, inside the repository checkout:

```powershell
node tools/promo-manager.js list --vault "C:\NutbusterPrivate\nutbuster-owner-vault"
node tools/promo-manager.js issue --vault "C:\NutbusterPrivate\nutbuster-owner-vault" --offer shop0 --count 25 --batch autumn-giveaway
```

The `issue` command creates a new private CSV under the vault's `exports` folder and appends nonce, code hash, package and batch metadata to `inventory.jsonl`. It refuses overwritten batch names or code files. Other supported commands: `verify --vault VAULT --file CODE_TXT` (a single bare voucher), `list --vault VAULT`, and `publish-key --vault VAULT` (if provisioning an additional issuer). The full code itself is never inserted into a Git commit.

For a **new separate issuer** (not the already-provisioned original), run:

```powershell
node tools/promo-manager.js init --vault "C:\NutbusterPrivate\second-issuer" --kid nutbuster-2027-b
node tools/promo-manager.js publish-key --vault "C:\NutbusterPrivate\second-issuer"
```

`init` creates a fresh P-256 keypair and an entirely new nine-code master list. Publishing merges its public key into `web/promo-keys.js`; commit only that public file and distribute a new game build. **Codes from new issuers do not authenticate on old game builds until the new public key ships.**

An issuer manager is a local inventory management system, **not** a service capable of checking whether an offline player has redeemed a code. Code validity and per-save redemption happen in the shipped application.

## Redemption UX and device checks

The **Shop** displays a **large gold “REDEEM PROMO CODE!” coupon button immediately below its heading**, above the merchandise. Tapping it reveals and focuses the signed-code input without repainting the whole screen; tapping it again collapses the field. The **Rewards** page retains a compact expandable redemption entry. Players paste the entire code, redeem explicitly, and receive a concrete reward notification. Empty/invalid/expired/previously redeemed codes do not grant anything. The redemption button is disabled in a build with no registered issuer public key. The local redemption record is saved using the existing `nutbuster.v1` key; normal app restart preserves it. Using a fresh save is inherently a different redemption environment.

The verifier relies on `crypto.subtle.importKey('jwk')` and `crypto.subtle.verify()`, which requires a Web Crypto-capable secure context. Compatibility varies by WebView/security origin; **Android API 26's real packaged WebView must be exercised**, including offline `file://` origin behavior. No insecure plaintext or mathematical fallback is permitted if Web Crypto is absent. Device tests must cover signed good/bad codes, clipboard paste, key import, signature corruption, expiration, restart, countdown interaction, duplicate input while pending, and a disconnected device.

For a later genuinely monetized release, voucher/receipt claims must not depend solely on editable local saves. Add a separately authorized online service or platform redemption system for secure global use limits and synchronization. Deployed signing keys, Play Billing, user accounts, and cloud telemetry are **not** part of this task.

## Source ownership and testing

- `tools/promo-issuer.js`: issuance and private key generation; refuses an issuer secret inside the repository
- `tools/promo-manager.js`: owner CLI for secure nine-code master list, append-only local issuance inventory, new batches, signature verification and public-key publishing
- `web/promo-keys.js`: intentionally unconfigured public verification-key registry
- `web/promo-codes.js`: P-256 signed code validation and deterministic reward application with save-local ledger
- `web/game.js`, `web/style.css`, `web/index.html`: integrated compact offline redemption interface
- `tests/promo-codes.test.js`: real Node P-256/WebCrypto sign+verify and tamper/replay tests
- `tests/promo-issuer.test.js`: private/public key separation and CLI-issued codes verified with WebCrypto
- `tests/promo-manager.test.js`: nine voucher package identities, exact grants, 12-hour bonus separation, idempotency and later batches
- `tests/promo-ui.test.js`: actual Shop redemption event, local persistence, duplicate rejection and tampered-code rejection
- `tests/benefits-and-claim-clocks.test.js`: independent 12h manual claims and VIP daily 24h grants

A signed-code source test is not evidence that the APK's real WebView can import keys in its installed origin; complete that gate before calling promo code redemption production-ready.
