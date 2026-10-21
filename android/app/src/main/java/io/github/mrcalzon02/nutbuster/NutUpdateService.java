package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.SystemClock;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

/** Offline-safe GitHub release discovery with explicit player consent for download and installation. */
final class NutUpdateService implements AutoCloseable {
    private static final String API =
        "https://api.github.com/repos/mrcalzon02/NUTBUSTER-R/releases?per_page=30";
    private static final String RELEASE_PREFIX =
        "https://github.com/mrcalzon02/NUTBUSTER-R/releases/download/";
    private static final String APK_NAME = "NUTBUSTER-Android-phone-test.apk";
    // Release-asset discovery avoids the shared anonymous GitHub REST API rate limit.
    private static final String LATEST_MANIFEST =
        "https://github.com/mrcalzon02/NUTBUSTER-R/releases/latest/download/NUTBUSTER-update.json";
    private final Activity activity;
    private final Consumer<String> status;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy = new AtomicBoolean(false);
    private static final long AUTO_CHECK_INTERVAL_MS = 60L * 60L * 1000L;
    private volatile long lastAutoCheckAt = -AUTO_CHECK_INTERVAL_MS;
    private volatile long lastOfferedCode = -1L;

    NutUpdateService(Activity activity, Consumer<String> status) {
        this.activity = activity;
        this.status = status;
    }

    /** The Settings menu always allows a manual request, even after a declined offer. */
    void checkForUpdates() { checkForUpdates(true); }

    /** Called on boot and level entry. No download, install, or prompt unless newer signed release exists. */
    void checkForUpdatesAutomatically() { checkForUpdates(false); }

    private void checkForUpdates(boolean manual) {
        if (!manual && !BuildConfig.UPDATE_CHANNEL_ENABLED) return;
        if (!busy.compareAndSet(false, true)) return;
        if (!manual) {
            long now = SystemClock.elapsedRealtime();
            if (now - lastAutoCheckAt < AUTO_CHECK_INTERVAL_MS) {
                busy.set(false);
                return;
            }
            lastAutoCheckAt = now;
        }
        worker.execute(() -> {
            try { runCheck(manual); }
            catch (Exception error) {
                if (manual) status.accept(explainCheckFailure(error));
            }
            finally { busy.set(false); }
        });
    }

    private static final class Release {
        final String url, checksum;
        final long code, size;
        Release(String url, String checksum, long code, long size) {
            this.url = url; this.checksum = checksum; this.code = code; this.size = size;
        }
    }

    private void runCheck(boolean manual) throws Exception {
        String expectedSigner = BuildConfig.DISTRIBUTION_SIGNER_SHA256;
        if (!BuildConfig.UPDATE_CHANNEL_ENABLED || !expectedSigner.matches("[0-9a-f]{64}")) {
            if (manual) status.accept("This build has no trusted publisher signing identity. Install a signed phone-test release to enable updates.");
            return;
        }
        PackageManager pm = activity.getPackageManager();
        PackageInfo installed = installedInfo(pm, activity.getPackageName());
        if (installed == null || !expectedSigner.equals(fingerprint(installed))) {
            if (manual) status.accept("Installed app is not signed by the expected publisher. Update blocked.");
            return;
        }
        long currentCode = version(installed);
        Release best = manifestRelease(expectedSigner);
        if (best == null) {
        // Older releases lack a manifest: use the legacy GitHub API as fallback.
        HttpURLConnection con = connect(API);
        String raw;
        try (InputStream in = con.getInputStream()) {
            byte[] data = readBounded(in, 1024 * 1024);
            raw = new String(data, java.nio.charset.StandardCharsets.UTF_8);
        } finally { con.disconnect(); }
        JSONArray arr = new JSONArray(raw);
        for (int i = 0; i < arr.length(); i++) {
            JSONObject release = arr.optJSONObject(i);
            if (release == null || release.optBoolean("draft", true) || release.optBoolean("prerelease", false)) continue;
            String tag = release.optString("tag_name", "");
            if (!tag.matches("nutbuster-phone-test-[0-9]+-[0-9]+")) continue;
            String body = release.optString("body", "");
            // Never offer an incompatible legacy-signed APK. A previously installed
            // certificate cannot be changed by Android's package installer.
            String publisherLine = "NUTBUSTER publisher signer SHA-256: " + expectedSigner;
            String legacyLine = "Persistent ReverieVR signer SHA-256: " + expectedSigner;
            if (!body.contains(publisherLine) && !body.contains(legacyLine)) continue;
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?m)^Android versionCode: ([0-9]{1,10})\\r?$").matcher(body);
            if (!m.find()) continue;
            long code = Long.parseLong(m.group(1));
            if (m.find() || code <= currentCode || code > 2_100_000_000L) continue;
            JSONArray assets = release.optJSONArray("assets");
            if (assets == null) continue;
            for (int j=0; j<assets.length(); j++) {
                JSONObject a=assets.optJSONObject(j);
                if (a == null || !APK_NAME.equals(a.optString("name", ""))) continue;
                String url=a.optString("browser_download_url", "");
                String digest=a.optString("digest", "").toLowerCase(Locale.US);
                long size=a.optLong("size", 0L);
                if (!url.equals(RELEASE_PREFIX + tag + "/" + APK_NAME) ||
                    !digest.matches("sha256:[0-9a-f]{64}") || size<=1024 || size>100_000_000L) continue;
                if (best == null || code>best.code) best=new Release(url,digest.substring(7),code,size);
            }
        }
        }
        if (best == null || best.code <= currentCode) {
            if (manual) status.accept("Up to date, or no newer update with this app's signing certificate. Keep your installed app to preserve progress.");
            return;
        }
        if (!manual && best.code == lastOfferedCode) return;
        // No APK download is initiated by a check. A visible native decision is mandatory.
        final Release available = best;
        final long installedCode = currentCode;
        activity.runOnUiThread(() -> showDownloadOffer(available, installedCode, expectedSigner, manual));
    }

    /** HTTPS-only latest-release discovery; download still requires explicit consent. */
    private static Release manifestRelease(String expectedSigner) {
        HttpURLConnection con = null;
        try {
            con = connect(LATEST_MANIFEST);
            String raw;
            try (InputStream in = con.getInputStream()) {
                raw = new String(readBounded(in, 32768), java.nio.charset.StandardCharsets.UTF_8);
            }
            JSONObject meta = new JSONObject(raw);
            JSONObject apk = meta.optJSONObject("apk");
            if (meta.optInt("schema", -1) != 1 || apk == null ||
                !expectedSigner.equals(meta.optString("signerSha256", ""))) return null;
            String tag = meta.optString("tag", "");
            long code = meta.optLong("androidVersionCode", -1L);
            String url = apk.optString("url", "");
            String checksum = apk.optString("digest", "").toLowerCase(Locale.US);
            long size = apk.optLong("size", -1L);
            if (!tag.matches("nutbuster-phone-test-[0-9]+-[0-9]+") ||
                code < 1 || code > 2_100_000_000L ||
                !APK_NAME.equals(apk.optString("name", "")) ||
                !url.equals(RELEASE_PREFIX + tag + "/" + APK_NAME) ||
                !checksum.matches("sha256:[0-9a-f]{64}") ||
                size <= 1024 || size > 100_000_000L) return null;
            return new Release(url, checksum.substring(7), code, size);
        } catch (Exception unavailable) {
            // 404 is expected until the first manifest-bearing release is published.
            return null;
        } finally {
            if (con != null) con.disconnect();
        }
    }

    /** Diagnose HTTP failures without implying a release check was completed. */
    private static String explainCheckFailure(Exception error) {
        String detail = error.getMessage();
        if (detail != null && detail.matches("GitHub HTTP (403|429)"))
            return "GitHub limited the update check (" + detail + "). Try later or tap VIEW RELEASES.";
        if (detail != null && detail.matches("GitHub HTTP [0-9]{3}"))
            return "Update server returned " + detail + ". Try again or tap VIEW RELEASES.";
        if (detail != null && detail.equals("Oversized release metadata"))
            return "Update metadata exceeded safety limits. Tap VIEW RELEASES.";
        if (error instanceof java.io.IOException)
            return "Update server unreachable. Check your connection or tap VIEW RELEASES.";
        if (error instanceof org.json.JSONException)
            return "Update metadata could not be read. Try again or tap VIEW RELEASES.";
        return "Update check failed: " + error.getClass().getSimpleName() +
            (detail == null ? "" : " (" + detail.substring(0, Math.min(detail.length(), 100)) + ")");
    }

    private void showDownloadOffer(Release release, long installedCode, String signer, boolean manual) {
        if (activity.isFinishing() || activity.isDestroyed()) return;
        if (!manual && release.code == lastOfferedCode) return;
        lastOfferedCode = release.code;
        status.accept("Update " + release.code + " available. Download only with player approval.");
        new AlertDialog.Builder(activity)
            .setTitle("NUTBUSTER update available")
            .setMessage("A newer signed version (" + release.code + ") is available. Download the update from GitHub? Your local game progress remains on this device.")
            .setPositiveButton("Download", (dialog, which) -> downloadApproved(release, installedCode, signer))
            .setNegativeButton("Later", (dialog, which) -> status.accept("Update deferred. Play offline as usual."))
            .show();
    }

    private void downloadApproved(Release release, long currentCode, String signer) {
        if (!busy.compareAndSet(false, true)) return;
        worker.execute(() -> {
            File parent = new File(activity.getCacheDir(), "verified-updates");
            File apk = new File(parent, "nutbuster-" + release.code + ".apk");
            try {
                status.accept("Downloading update " + release.code + " after your approval…");
                if (!parent.isDirectory() && !parent.mkdirs())
                    throw new IllegalStateException("Could not make update cache");
                downloadAndVerify(release, apk, activity.getPackageManager(), signer, currentCode);
                activity.runOnUiThread(() -> showInstallOffer(apk, release.code));
            } catch (Exception error) {
                if (apk.exists()) apk.delete();
                status.accept("Update download/verification failed: " +
                    (error instanceof IllegalStateException && error.getMessage() != null
                        ? error.getMessage() : error.getClass().getSimpleName()));
            } finally { busy.set(false); }
        });
    }

    private void showInstallOffer(File verifiedApk, long releaseCode) {
        if (activity.isFinishing() || activity.isDestroyed()) {
            verifiedApk.delete();
            return;
        }
        status.accept("Update " + releaseCode + " verified. Installation requires separate approval.");
        new AlertDialog.Builder(activity)
            .setTitle("Install verified NUTBUSTER update?")
            .setMessage("The download passed SHA-256, app identity, version and publisher certificate checks. Open Android's installer now? Android will also request your approval.")
            .setPositiveButton("Install", (dialog, which) -> openInstaller(verifiedApk))
            .setNegativeButton("Later", (dialog, which) -> {
                verifiedApk.delete();
                status.accept("Installation deferred. No installation was started.");
            })
            .setOnCancelListener(dialog -> verifiedApk.delete())
            .show();
    }

    private void downloadAndVerify(Release release, File apk, PackageManager pm,
                                   String signer, long currentCode) throws Exception {
        HttpURLConnection con = connect(release.url);
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        long total = 0;
        try (InputStream input=con.getInputStream(); FileOutputStream output=new FileOutputStream(apk)) {
            byte[] buf=new byte[65536]; int n;
            while ((n=input.read(buf))!=-1) {
                if (n==0) continue;
                total+=n;
                if (total>release.size || total>100_000_000L) throw new IllegalStateException("APK size exceeded declared release size");
                sha.update(buf,0,n);
                output.write(buf,0,n);
            }
            output.getFD().sync();
        } finally { con.disconnect(); }
        if (total!=release.size || !toHex(sha.digest()).equals(release.checksum))
            throw new IllegalStateException("APK SHA-256 or size mismatch");
        PackageInfo candidate = pm.getPackageArchiveInfo(apk.getAbsolutePath(), signingFlags());
        if (candidate == null || !activity.getPackageName().equals(candidate.packageName) ||
            version(candidate)!=release.code || version(candidate)<=currentCode ||
            !signer.equals(fingerprint(candidate))) {
            throw new IllegalStateException("APK package, version, or signing certificate does not match installed app");
        }
    }

    private void openInstaller(File apk) {
        if (Build.VERSION.SDK_INT>=26 && !activity.getPackageManager().canRequestPackageInstalls()) {
            status.accept("Allow Nutbuster to install app updates in Android settings, then check again.");
            activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:"+activity.getPackageName())));
            return;
        }
        Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName()+".updates", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        activity.startActivity(intent);
    }

    private static HttpURLConnection connect(String url) throws Exception {
        HttpURLConnection con=(HttpURLConnection)new URL(url).openConnection();
        con.setConnectTimeout(10000); con.setReadTimeout(25000);
        con.setInstanceFollowRedirects(true);
        con.setRequestProperty("User-Agent", "NUTBUSTER/0.1 UpdateChecker");
        // APK and manifest are ordinary release assets, not GitHub API JSON.
        con.setRequestProperty("Accept", url.equals(API)
            ? "application/vnd.github+json" : "*/*");
        if (con.getResponseCode()!=200) {
            int code=con.getResponseCode(); con.disconnect();
            throw new IllegalStateException("GitHub HTTP "+code);
        }
        return con;
    }
    private static byte[] readBounded(InputStream in, int max) throws Exception {
        java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();
        byte[] buf=new byte[8192]; int n;
        while ((n=in.read(buf))!=-1) {
            if (out.size()+n>max) throw new IllegalStateException("Oversized release metadata");
            out.write(buf,0,n);
        }
        return out.toByteArray();
    }
    private static String toHex(byte[] b) {
        StringBuilder s=new StringBuilder();
        for (byte c:b) s.append(String.format(Locale.US, "%02x", c & 255));
        return s.toString();
    }
    private static int signingFlags(){ return Build.VERSION.SDK_INT>=28?
       PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES; }
    private static PackageInfo installedInfo(PackageManager pm, String name) throws Exception {
        return pm.getPackageInfo(name, signingFlags());
    }
    private static long version(PackageInfo info) {
        return Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;
    }
    private static String fingerprint(PackageInfo info) throws Exception {
        Signature[] signatures;
        if (Build.VERSION.SDK_INT>=28 && info.signingInfo!=null)
            signatures=info.signingInfo.getApkContentsSigners();
        else signatures=info.signatures;
        if (signatures==null || signatures.length!=1) return "";
        return toHex(MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray()));
    }
    @Override public void close(){worker.shutdownNow();}
}
