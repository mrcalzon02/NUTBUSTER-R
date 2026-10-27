# Cross-platform feature-parity and release-line contract

**Standing project rule:** Continue NUTBUSTER development across Android, Fire OS, Windows and Linux. Do not silently deliver a gameplay change to one implementation and describe the others as having it. Keep every new system, mechanic, interaction, item, and approved asset in the same feature ledger until each applicable native implementation is functionally verified.

## Implementation ownership

| Target | Implementation | Artifact | Release state |
|---|---|---|---|
| Android | `web/` game packaged into Android application | Signed Android APK | Independent publisher functional gate |
| Fire OS | Same Android code and byte-identical signed APK | Fire-labeled signed Android APK | AOSP tablet proxy only; actual Fire device verification outstanding |
| Windows | C++17 / SDL3, direct native rendering | Windows executable + approved data ZIP | **Development preview only** |
| Linux | Same C++17 / SDL3 sources | Linux executable + approved data ZIP | **Development preview only** |

No Electron, Chromium, WebView, HTTP/browser launcher, bundled Node runtime, or browser substitute is permitted in desktop packages. Node used by build-time campaign and mining scripts is **not** a desktop runtime.

These are **four distribution targets but two active gameplay implementations**: mobile WebView content, and desktop SDL3. A changed mobile source does not magically update desktop mechanics. Google Play remains a separate contingency/distribution branch with a separate signer and store policy: it is **not** automatically merged or published by this contract.

## Source of truth

`config/platform-parity.json` contains the release targets, mapped gameplay sources, corresponding test references, actual native source files, and unresolved gaps. `tools/platform-parity.js` supports:

- `validate`: checks all four target identities; shared Android/Fire release; C++/SDL3 desktop runtimes; that every present `web/*.js` gameplay module (except release-note metadata) is assigned to a feature; source/test paths; preview-only status and CI contract.
- `report`: emits a readable inventory of partial or missing native features. This is the report attached to native CI preview packages.
- `impact <changed-paths.txt>`: refuses unmapped new game JavaScript modules and flags mobile gameplay changes without **either** corresponding native source work **or** an explicit ledger review committed in that revision.
- `require-full`: fails while any required native feature is partial/unported or native targets lack deliberate production signoff. This is the required guard before establishing a desktop production release pipeline.

The `functionally-tested` mobile label means there is source-level test coverage, **not** that every device or every feature flow has been tested. Likewise, native `preview-partial` indicates working portions verified in CI, **not** parity completion. Never substitute documentation updates for implemented gameplay.

## Developer change procedure

1. Review which of the 19 feature areas a gameplay change affects. If adding new gameplay, map its source in the ledger before CI.
2. Implement/review the change in **both** code bases when the feature applies to both. For changes not yet possible on desktop, keep the native status `preview-partial` or `not-ported`, update the gap honestly, and commit the explicit parity review. Do **not** call it shipped on Windows/Linux.
3. Keep approved art identities fixed. Source artwork and economy data are shared and must be explicitly imported where appropriate. No placeholders/emoji for assigned assets.
4. Run source-specific mobile functional tests and `node tests/platform-parity.test.js`; use the cross-platform report to confirm parity status.
5. On push/PR, Android + Fire signed release functional tests validate the ledger independently. Native CI runs on `web/**`, `native/**`, parity metadata, and workflows. Each of Windows/Linux compiles, runs gameplay/mining checks, checks packages, and produces preview ZIPs.
6. Read back the Actions jobs and downloadable artifacts; do not claim successful releases until verified. Reassess outstanding native gaps before promising production feature parity.

### Failure and publishing policy

Functional diagnostics and release-integrity failures can block the **affected** artifact. Cosmetic/screenshot/text failures can report problems but must not become signed Android release dependencies. Native partial implementations or native runner failures do **not** block an otherwise verified signed Android/Fire OS release. They **do** prevent incorrectly declaring parity and creating a full desktop release. Fire OS proxy compatibility cannot be described as physical device certification.

GitHub Actions triggers check modified source on each push, including changes made to the mobile game. When modifying a mobile gameplay script with no same-commit native work, include an explicit parity-ledger review in that commit. The automation checks **accountability and evidence**, not equivalence of every intermediate game state. Deterministic turn-by-turn JavaScript/C++ parity tests must be expanded as native mechanics are ported.

The `config/platform-parity.json` file is a feature backlog and source-level contract, not a user-facing claim that all target builds offer all listed features.
