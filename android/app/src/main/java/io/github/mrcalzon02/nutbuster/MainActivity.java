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
import org.json.JSONObject;

/** Offline-first native game. Update checks use network; downloads and installation are opt-in. */
public final class MainActivity extends Activity {
    private WebView game;
    private NutUpdateService updater;
    private NutAnnouncerTts auditor;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        updater = new NutUpdateService(this, this::showUpdateStatus);
        game = new WebView(this);
        game.setWebViewClient(new WebViewClient());
        auditor = new NutAnnouncerTts(this, this::onAuditorFinished);
        game.addJavascriptInterface(auditor, "NUTBUSTER_TTS_BRIDGE");
        WebSettings s = game.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true); // Only the packaged game is loaded.
        s.setAllowContentAccess(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        s.setBlockNetworkLoads(true); // The web game cannot make network requests.
        game.addJavascriptInterface(new Object() {
            @JavascriptInterface public void checkForUpdates() { updater.checkForUpdates(); }
            @JavascriptInterface public void checkForUpdatesAutomatically() { updater.checkForUpdatesAutomatically(); }
            @JavascriptInterface public void openReleases() {
                runOnUiThread(() -> {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW,
                            Uri.parse("https://github.com/mrcalzon02/NUTBUSTER-R/releases")));
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
                        "https://github.com/mrcalzon02/NUTBUSTER-R/releases");
                    startActivity(Intent.createChooser(send, "Invite a friend to NUTBUSTER"));
                });
            }
        }, "NUTBUSTER_SHARE_BRIDGE");
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(game);
        game.loadUrl("file:///android_asset/index.html");
    }
    private void onAuditorFinished(String utteranceId) {
        runOnUiThread(() -> {
            if (game != null) game.evaluateJavascript(
                "window.NutAudio && window.NutAudio.ttsFinished(" +
                JSONObject.quote(utteranceId) + ")", null);
        });
    }
    private void showUpdateStatus(String message) {
        runOnUiThread(() -> {
            if (game != null) game.evaluateJavascript(
                "window.NutbusterUpdates && window.NutbusterUpdates.receive(" +
                JSONObject.quote(message) + ")", null);
        });
    }
    @Override public void onBackPressed() {
        if (game != null) game.evaluateJavascript("window.NutbusterApp && window.NutbusterApp.nav('campaign')", null);
    }
    @Override protected void onDestroy() {
        if (updater != null) updater.close();
        if (auditor != null) { auditor.close(); auditor = null; }
        if (game != null) { game.destroy(); game = null; }
        super.onDestroy();
    }
}
