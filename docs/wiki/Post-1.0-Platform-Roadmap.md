# NUTBUSTER — Post-1.0 Platform & Social Roadmap

Status: **PLANNED / DEFERRED UNTIL 1.0**. Owner decision: leave the existing GitHub APK updater, release signing, and distribution behavior unchanged during the 1.0 development cycle. This is a planning document, **not** authorization to implement a Play Store variant, alter the current release pipeline, register accounts, or introduce external SDKs.

## The boundary

**Through 1.0:** Deliver the complete offline-first match-three game, campaign, powers, reward economy, Nutvale Homestead, functional local achievements, polished Android / Windows / Linux builds, and user-consent GitHub updates. Retain the existing Android package ID and signing strategy, current save namespace (`nutbuster.v1`), and the existing no-ad, no-real-billing satire. No social login, collection of contacts, remote accounts, cloud-save dependencies, or new online requirements.

The only *pre-1.0* preparation authorized by this roadmap is **documentation and design discipline**: keep stable IDs for achievements, decorations, avatars, levels, and save migrations; avoid making essential game rules depend on remote services; and ensure achievements, display snapshots, and save schema can later be adapted without changing earned entitlements. Any actual refactoring or new runtime interfaces must be evaluated as a separately scoped 1.0 task and cannot delay gameplay completion.

**After 1.0:** Evaluate each stage independently, in the following order. Milestone labels 1.1/1.2/etc. are proposals, not committed release dates.

## Platform gates

### P1 / Proposed 1.1 — Google Play distribution

Deliverable: an **independently verified** Google Play production listing with an Android App Bundle (`.aab`), separate from the existing GitHub-distributed APK and Windows/Linux GitHub artifacts.

- Check current Play Console enrollment, identity verification, fees, tester requirements, privacy policy, Data Safety, content rating, target SDK and supported-device requirements **at execution time**; policies may change.
- Audit in-game purchase satire and marketing to avoid misleading real-payment representations; preserve $0/no ads/no tracking intent.
- Evaluate Google Play App Signing, upload key, the current package identifier `io.github.mrcalzon02.nutbuster`, and the existing publisher signing lineage before publishing. Never replace the existing GitHub signing key without an explicit compatibility decision.
- **Only in this phase**, split Android distribution behavior: GitHub builds retain user-consented signed GitHub APK checks/download/install; Play builds must use compliant Google Play delivery / in-app update facilities and must not self-install external APK updates. Remove or exclude `REQUEST_INSTALL_PACKAGES` and the external APK updater in the Play flavor. Existing user consent expectations remain.
- Build the Play AAB and test Play delivery, real upgrade/rollback behavior, manifest permissions, restore of local saves where supported, and offline play. Never claim successful Play publishing from a local AAB build alone.
- Preserve Windows/Linux delivery on GitHub unchanged.

**Exit gate:** approved store listing, actual store install and subsequent store-managed update verified on devices, unchanged core offline gameplay, no unauthorized network or installs, publisher identity verified, and GitHub distribution still works.

### P2 / Proposed 1.2 — Optional Google Play Games

- Add opt-in Play Games player authentication without replacing local player identity or requiring a login.
- Map the existing immutable local achievement IDs and verified completed-level/trophy records to Play Games achievements. Do not fabricate retroactive scores.
- Add leaderboards with clear integrity rules and no claim that locally editable offline values are globally authoritative; consider server-side score validation if competitive rankings justify it.
- Evaluate Google Play Games Saved Games for opted-in Android backup/restore. Explicitly design save schema versioning, conflict resolution, device migration, and failure recovery. Authentication **alone** is not cloud saving.
- Never delete or block a player's local progress due to a failed login or cloud outage.

**Exit gate:** signed-out offline play unchanged; achievements and saves survive login/logout and fresh-device restore tests; conflicts cannot silently destroy earned progression; leaderboards clearly describe their authority.

### P3 / Proposed 1.3 — Prestige and social sharing

- Keep today's implemented `INVITE FRIENDS` behavior: Android sharesheet / browser copy link to GitHub Releases, with no contact list or Facebook login.
- Add user-previewed, deliberately shared Nutvale **trophy cards**, prestige plates, avatar portraits, homestead postcards/screenshots and, if feasible, compact validated static snapshot links.
- Serialize only a **whitelisted** public snapshot (e.g., earned milestone IDs, eligible decor layout, selected avatar, chosen display alias). Exclude raw saves, wallet, device/advertising identifiers, social tokens, location, or recipients.
- Image shares should work with Android Sharesheet targets including apps which do not accept ordinary text links (notably Instagram); browser and desktop get image export and copy/link fallback.
- Verify share-target capabilities for Facebook, Discord, Bluesky, X, Instagram and messaging apps; do not claim publishing succeeded merely because the chooser opened.
- Prefer no Facebook Login. Investigate Meta SDK/consent only if a later concrete account-based requirement justifies it. Optional provider authentication is not a substitute for a save-sync service.

**Exit gate:** explicit preview and consent; no background posting; recipient can view the exported trophy/homestead without NUTBUSTER accounts; malicious malformed snapshot data cannot inject content.

### P4 / Proposed 1.4+ — Online homestead visits and cross-platform identity (conditional)

Interactive visiting, shared mutable homes, public profiles, cross-platform synchronization, anti-cheat leaderboards, and friend relationships are **not** promised by GitHub Pages/Releases or Google Play Games alone. Require a scoped service or peer-to-peer architecture, hosting/privacy/abuse budget, moderation/report/block rules where user-generated public content exists, and a concrete reason the player base needs it. Optional only; offline game must remain complete.

### P5 — Monetization (conditional, not currently authorized)

The game presently parodies predatory free-to-play monetization without taking money. Real-money cosmetics, digital goods, randomized paid rewards, ad tech, subscriptions, or billing SDKs are **out of scope** unless the owner changes that policy explicitly. Any future proposal needs a separate content/policy/consumer-protection assessment and applicable Play billing compliance.

## Future integration contracts (design reservations, not existing interfaces)

| Existing authoritative source | Potential adapter | Invariant |
|---|---|---|
| `web/game.js` local save under `nutbuster.v1` | Optional Play Saved Games / other backup provider | Offline writes remain authoritative until user-approved reconciliation; versioned migration |
| `web/homestead.js` catalog and `stats(save)` | Play Games achievements / export cards | Earned records are computed from real victories; stable catalog IDs |
| `web/invite.js` native/browser share | Future image and snapshot share transport | Shares require a deliberate press; no login/contact harvesting |
| `web/update.js` + Android native GitHub updater | Play Core in-app updater in a future Play-specific build | Only one compliant updater per distribution; no download/install without appropriate consent |
| Android `applicationId` and release signer | Play signing and upload-key planning | Never break existing installed user's ability to upgrade unknowingly |

## Deferred execution checklist

- [ ] **1.0 complete and validated** before any Play delivery refactor.
- [ ] Recheck official Play/Meta/Play Games policies and costs against then-current rules.
- [ ] Choose developer account type, app listing identity and signing migration path.
- [ ] Specify and implement Play-only build configuration and permission separation; verify the GitHub updater remains correct for sideloaded installs.
- [ ] Implement and verify AAB + Play-managed in-app updates on real test distribution.
- [ ] Implement Play Games, optional account/cloud save, social exports, and/or online visiting only at their respective approved milestones.
- [ ] Attach evidence (builds, device test, accepted store/release, restore scenarios and commit hashes) before labeling a gate complete.

**Do not add GitHub Actions or modify existing workflows as part of this planning item.** Release and integration claims require remote verification; a document commit does not constitute a released APK, successful Play publishing, or completed native integration.

Related: [Build and APK](Build-and-APK.md), [Social and Prestige Sharing](Social-and-Prestige-Sharing.md), [Nutvale Homestead](Nutvale-Homestead.md), [Test Gates](Test-Gates.md).
