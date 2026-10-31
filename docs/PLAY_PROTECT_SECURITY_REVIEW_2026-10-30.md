# Play Protect / Android security review — October 30, 2026

**Repository:** mrcalzon02/NUTBUSTER-R; reviewed source base: `1581513e6176ceed34ab595af6e40e682c17dd4d`.

**Report:** User observed Google Play Protect mark Nutbuster harmful. The exact Play Protect classification, visible warning wording, installed APK SHA-256, and device versionCode have not been captured; the detection cause is **unconfirmed**.

## Findings and fixes

1. **Play permission defect — corrected in source:** Shared manifest contains `REQUEST_INSTALL_PACKAGES` for the independent GitHub APK updater. Google Play policy prohibits this permission for self-updating apps distributed through Google Play. The `src/play/AndroidManifest.xml` overlay now removes it only in Play builds. The GitHub/Fire OS release channel retains its consent-based installer. Existing `build.gradle` already disables `UPDATE_CHANNEL_ENABLED` for the Play variant, and requires a distinct Play upload key.
2. **Bridged WebView navigation — hardened in source:** `MainActivity` has update, share and promo JavaScript bridges. The app previously blocked network loads but used the default navigation client. Now only `file:///android_asset/` navigation stays in the bridged WebView; HTTPS GitHub pages open in the external browser and other main-frame destinations are blocked. Cross-file universal access and mixed content are disabled.
3. **Runtime permissions:** Shared manifest declares only `INTERNET` and `REQUEST_INSTALL_PACKAGES`. It does not declare SMS, contacts, location, accessibility-service, notification-listener, or account permissions.
4. **Existing update protections:** `NutUpdateService` requires explicit player consent for both download and installation, and verifies file size, checksum, app ID, version and signing certificate before offering an APK install.
5. **Signing:** GitHub phone-test releases use the pinned Nutbuster publisher certificate. Google Play build requires a separate upload key, with device signing and listing managed by Google Play.

## Still unverified

- This was a **source-level** audit: no APK binary scan, Play Protect classification report, or Android hardware re-scan occurred.
- Google Play Console policy status, registration, Data safety, privacy-policy URL and the app's actual Play listing were not available.
- Merged Play manifest, production-signed AAB, Play Console review and release-device checks must be independently verified. A static assertion does **not** prove Google has approved an app.
- The permission is a verified *Play policy* issue, but not confirmed as the *Play Protect detection* reason for the sideloaded APK.

## Required follow-up checks

1. Build `./gradlew :app:processPlayMainManifest` and inspect the merged Play manifest: it must **not** contain `REQUEST_INSTALL_PACKAGES`. Verify the independent `release` build still has it.
2. Build `:app:bundlePlay` using the separate Play upload keystore; inspect the AAB's manifest, version and certificate. Confirm the Play build cannot launch the GitHub APK installer.
3. Record the exact Play Protect warning title and full message, affected APK SHA-256, signing fingerprint, package name and versionCode; compare to GitHub release `SHA256SUMS.txt`.
4. Test the signed sideload APK on a disposable Android device with Play Protect enabled; verify updater consent and integrity rejection paths.
5. If a verified clean APK remains classified harmful, submit a Play Protect classification appeal using the warning category, exact artifact and evidence.

**Policies reviewed:**
- https://support.google.com/googleplay/android-developer/answer/12085295
- https://support.google.com/googleplay/android-developer/answer/16558241
- https://developers.google.com/android/play-protect/warning-dev-guidance
- https://developers.google.com/android/play-protect/warning-strings
