package io.github.mrcalzon02.nutbuster;

import android.os.Bundle;

/** Google Play-only launcher; binds cloud saves to the packaged offline game. */
public final class PlayMainActivity extends MainActivity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (packagedGameView() != null) {
            packagedGameView().addJavascriptInterface(
                new PlayCloudBridge(this, packagedGameView()), "NutPlayCloud");
        }
    }
}
