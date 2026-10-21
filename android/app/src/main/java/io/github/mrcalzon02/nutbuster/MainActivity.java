package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Offline-first native shell. No INTERNET permission, advertisements, or store SDK. */
public final class MainActivity extends Activity {
    private WebView game;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        game = new WebView(this);
        game.setWebViewClient(new WebViewClient());
        WebSettings s = game.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true); // packaged local app assets only
        s.setAllowContentAccess(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        s.setBlockNetworkLoads(true);
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(game);
        game.loadUrl("file:///android_asset/index.html");
    }
    @Override public void onBackPressed() {
        game.evaluateJavascript("window.NutbusterApp && window.NutbusterApp.nav('campaign')", null);
    }
    @Override protected void onDestroy(){ if(game!=null){game.destroy();game=null;} super.onDestroy(); }
}
