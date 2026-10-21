# NUTBUSTER — Invites, Profiles & Prestige Sharing

## Implemented first slice: invite without accounts

- Home, Homestead and Settings expose **INVITE FRIENDS**.
- Android uses `Intent.ACTION_SEND` and `Intent.createChooser()`. Installed receiving apps decide how to handle a text URL. No account, Facebook token, contacts, invite tracking, referral ID, or permission request is required.
- Browser/desktop uses Web Share, a clipboard copy, or a selectable fallback. The destination is the public GitHub Releases page; users install it themselves. No friend progress is exchanged.
- Progress is device-local. Android auto-backup is disabled. GitHub sees ordinary HTTP metadata only when checking the signed release channel.

## Future gate 1 — Prestige plate and estate postcard

Build a compact, **owner-approved and read-only** public snapshot from `NutHomestead.stats(save)`, `save.homestead.avatar`, and up to 12 publicly eligible decor IDs. Never include the entire save, wallet balances, advertising identifiers, localStorage, real names, location, timestamps, device identifiers, or account tokens. Let the player preview what will be disclosed and choose Share or Cancel. Display a clear **self-reported snapshot** marker, not falsely verified worldwide ranks.

One serverless method is a versioned, small, length-limited, schema-validated record encoded inside a URL fragment of a static GitHub Pages profile viewer. The viewer reconstructs a static estate and avatar locally and never contacts an account backend. Respect URL/OS share limits; alternatively export a PNG card via a local canvas renderer and Android image Sharesheet. Validate all input against the canonical costume/decor ID catalogs, never render raw shared HTML, and cap lengths and numeric values.

## Future gate 2 — Social publishing

Use the Android sharesheet for Facebook, Discord, X, Bluesky and messaging services when available. Instagram may require an image postcard because its handling of text links differs by client; do not promise a Facebook or Instagram post succeeded merely because a share chooser opened. In browser/desktop, copy/link share is the reliable fallback.

Do not implement platform posting APIs or permissions before they are truly needed. **Facebook Login is not required to share.** If ever needed for identity, it requires a Meta developer app, platform policies, consent, and an app-scoped identity or token even without email collection. Authentication does not synchronize saved data by itself.

## Future gate 3 — Real visits or multiplayer

A self-contained snapshot can be *viewed* by anyone with the URL, but it is not a live, mutable player home. Real-time visiting, invitations tied to identities, messaging, cross-device progress, public leaderboards and anti-cheat verification require a reachable service or a carefully designed peer-to-peer session protocol. GitHub Releases/Pages alone do not provide these capabilities. Do not mark them implemented.

## Privacy and safety

- Sharing starts only after a deliberate press of Share, never automatically after a win, update, or level.
- Published cards and links are optional. Never submit a player's save silently.
- A new device begins a separate save without a synchronization mechanism.
- Social platforms receive player-shared content under their own privacy terms; NUTBUSTER does not collect or retain recipients or share telemetry.
