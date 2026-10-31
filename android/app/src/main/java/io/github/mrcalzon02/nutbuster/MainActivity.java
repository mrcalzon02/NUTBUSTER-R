package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONObject;

/** Offline-first game. User-initiated GitHub release links open in Android's browser. */
public final class MainActivity extends Activity {
    private WebView game;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        game = new WebView(this);
        // The JavaScript bridges are trusted only by packaged game content.
        // External release pages open in Android's browser, never in this WebView.
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl(), request.isForMainFrame());
            }
            @SuppressWarnings("deprecation")
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNavigation(Uri.parse(url), true);
            }
        });
        WebSettings s = game.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true); // Required for packaged file:///android_asset/ content.
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setAllowContentAccess(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        s.setBlockNetworkLoads(true); // The web game cannot make network requests.
        game.addJavascriptInterface(new Object() {
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
        // Fixed, allowlisted destination. The offline WebView must not navigate to GitHub.
        game.addJavascriptInterface(new Object() {
            @JavascriptInterface public void openJewelBrookReleases() {
                runOnUiThread(() -> {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW,
                            Uri.parse("https://github.com/mrcalzon02/Jewel_Brook/releases")));
                    } catch (ActivityNotFoundException unavailable) {
                        showUpdateStatus("No browser available to open Jewel Brook releases.");
                    }
                });
            }
        }, "NUTBUSTER_PROMO_BRIDGE");
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
    private boolean handleNavigation(Uri url, boolean mainFrame) {
        if (!mainFrame) return false;
        String target = url.toString();
        if (target.startsWith("file:///android_asset/")) return false;
        if ("https".equalsIgnoreCase(url.getScheme())
                && "github.com".equalsIgnoreCase(url.getHost())) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, url));
            } catch (ActivityNotFoundException unavailable) {
                showUpdateStatus("No browser available to open the external link.");
            }
        }
        // All other main-frame navigation is blocked in the bridged WebView.
        return true;
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
        if (game != null) { game.destroy(); game = null; }
        super.onDestroy();
    }
}
