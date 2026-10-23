# NUTBUSTER Play — Financial and Account Security Boundary

Status: **implemented security scaffolding, not a verified production-payment release**. All changes belong to `feature/google-play-contingency`; the free `main` release remains independent.

## Deliberate risk distinction

**Sensitive:** payment tokens, Google Play purchase state, account-linked purchases, OAuth authorization codes, PGS identity, server session signatures, Play publishing/upload signing keys, Google Cloud service-account credentials, and player financial entitlements. Treat these as credentials/financial-security material.

**Not treated as financial secrets:** local gameplay saves, unlocked nuts, incidental pack contents, sprites, screenshots, invitation text, ordinary game state exports and public achievements. Do not add invasive sign-in, encryption or surveillance to ordinary game actions. NUTBUSTER remains playable offline without Play Games account linking.

NUTBUSTER never asks for or stores payment-card numbers, CVV, billing address, Google password, personal email, phone number, contacts or access to friends unrelated to gameplay. Real payment instruments remain entirely within the Google Play-managed billing UI.

## Implemented defense in depth

1. **Signed artifact lineage.** Play Android `assembleRelease` and `bundleRelease` retain the NUTBUSTER publisher-upload key fingerprint check; release also requires the Play Integrity Cloud project number, public PGS OAuth web client ID and verifier HTTPS URL. Mainline GitHub APK signing is unchanged. The **Play App Signing certificate SHA-256** is a *separate* value configured only on the verification server as `PLAY_APP_SIGNING_CERT_SHA256`. These certificates might not be identical: obtain the actual app-signing fingerprint from Play Console, never guess/copy the upload fingerprint.
2. **Play Integrity standard verdict for each account and purchase verification.** Native `PlayIntegrityGate` obtains an app-attestation token bound to a SHA-256 request hash that includes the exact package, SKU, purchase token, random attempt ID and per-install pseudonym. Account-link verification binds a separate hash to a fresh PGS one-time auth code. Server decodes through Google's Play Integrity API and checks matching package, exact hash, short freshness window (two minutes, with limited clock skew), `PLAY_RECOGNIZED` app and configured Play signer certificate. No raw tokens are used as `requestHash`.
3. **Purchase verification on server.** The HTTPS backend queries the Google Android Publisher API `purchases.productsv2.getproductpurchasev2`, requires `PURCHASED`, exact registered SKU, single line item and valid quantity / refundable quantity. `PENDING`, `CANCELLED`, refunded zero-quantity and mismatched purchases cannot reach the grant ledger. Failures or missing cloud configuration reject granting.
4. **Replay and double fulfillment.** Firestore transaction reserves a SHA-256 purchase-token identifier atomically. Consumables are tied to the original install pseudonym; permanent products may restore subject to their verified account binding. The Android client sends a receipt identifier (not the Google purchase token) to WebView gameplay, persists the receipt/grant locally before confirmation, then acknowledges the durable product or consumes the consumable. Ordinary local save modifications do not change the server's financial receipt ledger.
5. **Optional verified account without identity collection.** On a deliberate player press, the Play Games v2 client requests a one-use *server authorization code* without email, profile or OpenID scopes. The server exchanges it with Google, obtains `players/me.playerId` from Google, immediately HMAC-pseudonymizes it, and discards the raw ID and Google OAuth tokens. A short-lived, signed 15-minute session is returned to **native Android memory only**. Account sessions and code never enter WebView, localStorage, files, console logs or share intents. Players may clear the native session at any time. Offline gameplay still works signed out.
6. **Two independent signing secrets.** `PGS_ACCOUNT_PSEUDONYM_KEY` derives a stable opaque player key used for ownership; do not rotate it casually without a documented migration. `PGS_ACCOUNT_SESSION_SECRET` signs 15-minute sessions and can be rotated without renaming accounts. Both are generated securely and stored in the cloud secret service, not the APK, source control, or the local web game. Revoked/expired/forged sessions fail closed.
7. **Constrained network and WebView.** Financial OAuth/purchase credentials use native HTTPS POSTs with bounded replies, connection/read timeouts, and automatic redirects disabled. The WebView blocks all network loads and will not navigate away from the bundled `file:///android_asset/index.html` main frame; it cannot access arbitrary external file URLs. No outside site should obtain its native account/billing bridges.

## Server deployment variables

| Environment variable | Purpose | Where stored |
|---|---|---|
| `PLAY_APP_SIGNING_CERT_SHA256` | 64-character lowercase hex fingerprint from **Play App Signing** | Cloud environment/config, not a signing private key |
| `PLAY_INTEGRITY_PROJECT_NUMBER` | Google Cloud project number with enabled Play Integrity API | Cloud configuration |
| `PGS_SERVER_OAUTH_CLIENT_ID` | Google server-side OAuth web client ID | Cloud configuration |
| `PGS_SERVER_OAUTH_CLIENT_SECRET` | Google OAuth client secret | **Cloud Secret Manager only** |
| `PGS_ACCOUNT_PSEUDONYM_KEY` | Long-lived, randomly generated HMAC key for private account identifiers | **Cloud Secret Manager only** |
| `PGS_ACCOUNT_SESSION_SECRET` | Independently rotatable, randomly generated HMAC signing key for 15-minute sessions | **Cloud Secret Manager only** |
| `DENY_TEST_PURCHASES` | Optional test-payment denial control | Cloud configuration |

Configure a **minimal-permissions workload identity**: Play Integrity token decoding, Play Publisher purchase reading, Firestore receipt ledger transactions, and Play Games server OAuth exchange. Do not distribute service-account JSON files or OAuth client secrets with builds. Cloud Run should enforce HTTPS, appropriate rate limiting/concurrency quotas, and log **no request bodies**, OAuth codes, Google purchase tokens, bearer sessions, or raw player IDs. Provide a dedicated privacy policy before publishing.

## Important remaining release blockers

- **Play Console / account:** create real Play Games credentials, a production signing lineage, live SKU catalog, and backend services. No real Play Store app/account exists in this branch, so actual identity and purchase verification have **not** been exercised yet.
- **Financial transaction durability:** complete and test an end-to-end *server-authoritative delivery and recovery journal*. An acknowledged/consumed Google purchase cannot necessarily be recovered by `queryPurchasesAsync` after local save loss. Current local-save fulfillment alone is not an acceptable final real-money guarantee.
- **Refunds and chargebacks:** implement Google Real-time Developer Notifications (RTDN), voided-purchases reconciliation and entitlement compensation/removal rules after approval. A valid past receipt alone is not proof of permanent ownership.
- **Account unlink and rotation:** ensure account-linked durable purchases can be restored using a verified PGS identity on another device without revealing a raw identity; test signer and secret rotation.
- **Device/test certification:** build the AAB, Play license tester transactions, authentic app-signing certificate match, security-negative tests, device upgrades, offline gameplay, interruption/reinstall recovery, Meta login if still required, and independent privacy/Google Play review.
- **Publishing controls:** never ship an APK/AAB as secure solely because static tests pass; no automatic merge or publish to Play, and no changes to `main` release workflow.

Google official references: 
- Play Integrity standard requests: https://developer.android.com/google/play/integrity/standard
- Play Integrity verdicts: https://developer.android.com/google/play/integrity/verdicts
- Billing purchase state: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.productsv2
- Server-side Play Games authorization: https://developer.android.com/games/pgs/android/server-access
