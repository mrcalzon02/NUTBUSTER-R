package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.graphics.Bitmap;
import org.json.JSONObject;

/** Offline-first native game. Update checks use network; downloads and installation are opt-in. */
public final class MainActivity extends Activity {
    private WebView game;
    private NutUpdateService updater;
    private PlayUpdateService playUpdater;
    private PlayBillingCoordinator billing;
    private PlaySocialService social;
    private PlayAccountCoordinator playAccount;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (BuildConfig.PLAY_DISTRIBUTION) playUpdater = new PlayUpdateService(this, this::showUpdateStatus);
        else updater = new NutUpdateService(this, this::showUpdateStatus);
        game = new WebView(this);
        game.setWebViewClient(new WebViewClient() {
            // JavaScript interfaces are exposed to loaded documents. NEVER permit a remote
            // main-frame navigation that could obtain access to account/billing bridges.
            private boolean blocked(String url) {
                return !"file:///android_asset/index.html".equals(url);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return request.isForMainFrame() && blocked(request.getUrl().toString());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return blocked(url);
            }
            @Override public void onPageStarted(WebView view, String url, Bitmap favicon) {
                if (blocked(url)) {
                    view.stopLoading();
                    return;
                }
                super.onPageStarted(view,url,favicon);
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (!blocked(url) && billing != null) {
                    billing.refreshCatalog(); billing.restorePurchases();
                }
            }
        });
        WebSettings s = game.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true); // Only the packaged game is loaded.
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        s.setBlockNetworkLoads(true); // The web game cannot make network requests.
        game.addJavascriptInterface(new Object() {
            @JavascriptInterface public void checkForUpdates() {
                if (BuildConfig.PLAY_DISTRIBUTION) runOnUiThread(() -> playUpdater.check(true));
                else updater.checkForUpdates();
            }
            @JavascriptInterface public void checkForUpdatesAutomatically() {
                if (BuildConfig.PLAY_DISTRIBUTION) runOnUiThread(() -> playUpdater.check(false));
                else updater.checkForUpdatesAutomatically();
            }
            @JavascriptInterface public void openReleases() {
                runOnUiThread(() -> {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW,
                            Uri.parse(BuildConfig.PLAY_DISTRIBUTION
                            ? "https://play.google.com/store/apps/details?id=" + getPackageName()
                            : "https://github.com/mrcalzon02/NUTBUSTER-R/releases")));
                    } catch (ActivityNotFoundException unavailable) {
                        showUpdateStatus("No browser available to open GitHub Releases.");
                    }
                });
            }
        }, "NUTBUSTER_UPDATE_BRIDGE");
        game.addJavascriptInterface(new Object() {
            @JavascriptInterface public void shareInvite() {
                runOnUiThread(() -> {
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType("text/plain");
                    send.putExtra(Intent.EXTRA_SUBJECT, "NUTBUSTER — Join the Nut Odyssey");
                    send.putExtra(Intent.EXTRA_TEXT,
                        "Come bust some nuts in NUTBUSTER! Get the latest game release here:\n" +
                        (BuildConfig.PLAY_DISTRIBUTION
                            ? "https://play.google.com/store/apps/details?id=" + getPackageName()
                            : "https://github.com/mrcalzon02/NUTBUSTER-R/releases"));
                    startActivity(Intent.createChooser(send, "Invite a friend to NUTBUSTER"));
                });
            }
        }, "NUTBUSTER_SHARE_BRIDGE");
        if (BuildConfig.PLAY_DISTRIBUTION) {
            social = new PlaySocialService(this, this::showUpdateStatus);
            billing = new PlayBillingCoordinator(this, this::sendPlayScript);
            playAccount = new PlayAccountCoordinator(this, this::sendPlayScript);
            billing.setAccountCoordinator(playAccount);
            game.addJavascriptInterface(new Object() {
                @JavascriptInterface public void buy(int index) { billing.purchase(index); }
                @JavascriptInterface public void confirmFulfillment(String receiptId) {
                    runOnUiThread(() -> billing.confirmFulfillment(receiptId));
                }
                @JavascriptInterface public void refreshCatalog() { runOnUiThread(() -> billing.refreshCatalog()); }
                @JavascriptInterface public void restorePurchases() { runOnUiThread(() -> billing.restorePurchases()); }
                @JavascriptInterface public void achievements() { runOnUiThread(() -> social.showAchievements()); }
                @JavascriptInterface public void achievementUnlocked(String key) { runOnUiThread(() -> social.unlock(key)); }
                @JavascriptInterface public void friends() { runOnUiThread(() -> social.friends()); }
                @JavascriptInterface public void linkAccount() { runOnUiThread(() -> playAccount.link()); }
                @JavascriptInterface public void unlinkAccount() { runOnUiThread(() -> playAccount.unlink()); }
            }, "NUTBUSTER_PLAY_BRIDGE");
        }
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(game);
        game.loadUrl("file:///android_asset/index.html");
    }
    private void sendPlayScript(String script) {
        runOnUiThread(() -> { if (game != null) game.evaluateJavascript(script, null); });
    }
    private void showUpdateStatus(String message) {
        runOnUiThread(() -> {
            if (game != null) game.evaluateJavascript(
                "window.NutbusterUpdates && window.NutbusterUpdates.receive(" +
                JSONObject.quote(message) + ")", null);
        });
    }
    @Override protected void onResume() {
        super.onResume();
        if (playUpdater != null) playUpdater.onResume();
        if (billing != null) billing.restorePurchases();
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (social != null) social.onActivityResult(request, result);
    }
    @Override public void onBackPressed() {
        if (game != null) game.evaluateJavascript("window.NutbusterApp && window.NutbusterApp.nav('campaign')", null);
    }
    @Override protected void onDestroy() {
        if (updater != null) updater.close();
        if (playUpdater != null) playUpdater.close();
        if (billing != null) billing.close();
        if (playAccount != null) playAccount.close();
        if (game != null) { game.destroy(); game = null; }
        super.onDestroy();
    }
}
