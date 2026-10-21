package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
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

/** User-invoked GitHub updater; never runs during normal offline game play. */
final class NutUpdateService implements AutoCloseable {
    private static final String API =
        "https://api.github.com/repos/mrcalzon02/NUTBUSTER-R/releases?per_page=30";
    private static final String RELEASE_PREFIX =
        "https://github.com/mrcalzon02/NUTBUSTER-R/releases/download/";
    private static final String APK_NAME = "NUTBUSTER-Android-phone-test.apk";
    private final Activity activity;
    private final Consumer<String> status;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy = new AtomicBoolean(false);

    NutUpdateService(Activity activity, Consumer<String> status) {
        this.activity = activity;
        this.status = status;
    }

    void checkForUpdates() {
        if (!busy.compareAndSet(false, true)) return;
        worker.execute(() -> {
            try { runCheck(); }
            catch (Exception error) { status.accept("Update check failed: " + error.getClass().getSimpleName()); }
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

    private void runCheck() throws Exception {
        String expectedSigner = BuildConfig.DISTRIBUTION_SIGNER_SHA256;
        if (!BuildConfig.UPDATE_CHANNEL_ENABLED || !expectedSigner.matches("[0-9a-f]{64}")) {
            status.accept("This test APK has no trusted publisher signing identity. Use the signed phone-test release to enable updates.");
            return;
        }
        PackageManager pm = activity.getPackageManager();
        PackageInfo installed = installedInfo(pm, activity.getPackageName());
        if (installed == null || !expectedSigner.equals(fingerprint(installed))) {
            status.accept("Installed app is not signed by the expected publisher. Update blocked.");
            return;
        }
        long currentCode = version(installed);
        HttpURLConnection con = connect(API);
        String raw;
        try (InputStream in = con.getInputStream()) {
            byte[] data = readBounded(in, 1024 * 1024);
            raw = new String(data, java.nio.charset.StandardCharsets.UTF_8);
        } finally { con.disconnect(); }
        JSONArray arr = new JSONArray(raw);
        Release best = null;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject release = arr.optJSONObject(i);
            if (release == null || release.optBoolean("draft", true) || release.optBoolean("prerelease", false)) continue;
            String tag = release.optString("tag_name", "");
            if (!tag.matches("nutbuster-phone-test-[0-9]+-[0-9]+")) continue;
            String body = release.optString("body", "");
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
        if (best == null) {
            status.accept("Up to date, or no verified newer Nutbuster APK exists.");
            return;
        }
        status.accept("Verified release found. Downloading update " + best.code + "…");
        File parent = new File(activity.getCacheDir(), "verified-updates");
        if (!parent.isDirectory() && !parent.mkdirs()) throw new IllegalStateException("Could not make update cache");
        File apk = new File(parent, "nutbuster-" + best.code + ".apk");
        try {
            downloadAndVerify(best, apk, pm, expectedSigner, currentCode);
            status.accept("Update verified. Opening Android's installer…");
            File finalApk=apk;
            activity.runOnUiThread(() -> openInstaller(finalApk));
        } catch (Exception e) {
            if (apk.exists()) apk.delete();
            throw e;
        }
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
        con.setRequestProperty("Accept", "application/vnd.github+json");
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
