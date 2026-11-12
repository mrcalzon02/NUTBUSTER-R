package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Test-APK-only installed WebView regression, driven by real injected touchscreen
 * motion rather than DOM click dispatch or mocked browser objects. No production
 * entitlement bypass or test hook is shipped in the release APK.
 *
 * The fixture records a simulated finale victory in an isolated emulator save,
 * then invokes the real NutProgress.firstClear() before restarting the WebView.
 * This does NOT prove 1000 campaign stages were played through on a device.
 */
public final class EditorTouchInstrumentation extends Instrumentation {
    private static final String PKG = "io.github.mrcalzon02.nutbuster";
    private static final String FAVORITES = "nutbuster.custom-level.favorites.v1";
    private Activity activity;
    private WebView web;

    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        start();
    }

    @Override public void onStart() {
        super.onStart();
        Bundle result = new Bundle();
        int exit = Activity.RESULT_CANCELED;
        try {
            execute();
            result.putString("editor_touch", "EDITOR_TOUCH_PASS: installed API26 WebView physical taps, horizontal swipe, persistence, activity relaunch, screenshots");
            exit = Activity.RESULT_OK;
        } catch (Throwable error) {
            result.putString("editor_touch", "EDITOR_TOUCH_FAIL: " + error);
            result.putString("stack", android.util.Log.getStackTraceString(error));
        } finally {
            finish(exit, result);
        }
    }

    private static void check(boolean truth, String message) {
        if (!truth) throw new AssertionError(message);
    }

    private void launch() throws Exception {
        Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.setClassName(PKG, PKG + ".MainActivity");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity = startActivitySync(intent);
        check(activity != null, "MainActivity did not start");
        waitForIdleSync();
        View child = ((ViewGroup) activity.findViewById(android.R.id.content)).getChildAt(0);
        check(child instanceof WebView, "Expected packaged Android WebView");
        web = (WebView) child;
        long deadline = SystemClock.uptimeMillis() + 30000;
        while (SystemClock.uptimeMillis() < deadline) {
            if ("true".equals(js("!!(window.NutbusterApp && window.NutProgress && window.NutEngine)"))) return;
            SystemClock.sleep(250);
        }
        throw new AssertionError("Packaged game JavaScript did not initialize");
    }

    private String js(String expression) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>("null");
        web.post(() -> web.evaluateJavascript(expression, output -> {
            value.set(output == null ? "null" : output);
            done.countDown();
        }));
        check(done.await(15, TimeUnit.SECONDS), "WebView JavaScript evaluation timed out");
        return value.get();
    }

    private void requireJs(String expression, String message) throws Exception {
        check("true".equals(js(expression)), message);
    }

    private JSONArray bounds(String selector) throws Exception {
        String quoted = JSONObject.quote(selector);
        requireJs("(function(){var e=document.querySelector(" + quoted
            + ");if(!e)return false;e.scrollIntoView({block:'center',inline:'center'});return true;})()",
            "Missing installed control: " + selector);
        SystemClock.sleep(250);
        String response = js("(function(){var e=document.querySelector(" + quoted
            + ");if(!e||e.disabled)return null;var r=e.getBoundingClientRect();"
            + "return [r.left,r.top,r.width,r.height,window.innerWidth,window.innerHeight];})()");
        check(response.startsWith("["), "Control cannot be tapped: " + selector + " / " + response);
        JSONArray rect = new JSONArray(response);
        check(rect.getDouble(2) >= 20 && rect.getDouble(3) >= 20, "Touch target too small: " + selector);
        return rect;
    }

    private float[] point(double xCss, double yCss, JSONArray r) throws Exception {
        int[] loc = new int[2];
        web.getLocationOnScreen(loc);
        double cssW = r.getDouble(4), cssH = r.getDouble(5);
        check(cssW > 0 && cssH > 0, "Invalid WebView viewport");
        float x = (float)(loc[0] + xCss * web.getWidth() / cssW);
        float y = (float)(loc[1] + yCss * web.getHeight() / cssH);
        check(x >= loc[0] && x < loc[0] + web.getWidth()
                && y >= loc[1] && y < loc[1] + web.getHeight(),
              "Control center outside actual Android display");
        return new float[]{x, y};
    }

    private void inject(int action, long downAt, long when, float x, float y) {
        MotionEvent e = MotionEvent.obtain(downAt, when, action, x, y, 0);
        e.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        try {
            check(getUiAutomation().injectInputEvent(e, true), "Touch injection rejected: " + action);
        } finally {
            e.recycle();
        }
    }

    private void tap(String selector) throws Exception {
        JSONArray r = bounds(selector);
        float[] p = point(r.getDouble(0) + r.getDouble(2) / 2,
                          r.getDouble(1) + r.getDouble(3) / 2, r);
        long start = SystemClock.uptimeMillis();
        inject(MotionEvent.ACTION_DOWN, start, start, p[0], p[1]);
        SystemClock.sleep(75);
        inject(MotionEvent.ACTION_UP, start, SystemClock.uptimeMillis(), p[0], p[1]);
        SystemClock.sleep(250);
    }

    private void swipePalette() throws Exception {
        JSONArray r = bounds(".editor-nut-palette");
        float[] a = point(r.getDouble(0) + r.getDouble(2) * .78,
                          r.getDouble(1) + r.getDouble(3) * .55, r);
        float[] b = point(r.getDouble(0) + r.getDouble(2) * .22,
                          r.getDouble(1) + r.getDouble(3) * .55, r);
        long start = SystemClock.uptimeMillis();
        inject(MotionEvent.ACTION_DOWN, start, start, a[0], a[1]);
        for (int i = 1; i <= 8; i++) {
            SystemClock.sleep(25);
            float t = i / 8f;
            inject(MotionEvent.ACTION_MOVE, start, SystemClock.uptimeMillis(),
                   a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
        }
        inject(MotionEvent.ACTION_UP, start, SystemClock.uptimeMillis(), b[0], b[1]);
        SystemClock.sleep(500);
    }

    private void screenshot(String name) throws Exception {
        Bitmap image = getUiAutomation().takeScreenshot();
        check(image != null && image.getWidth() > 100 && image.getHeight() > 100,
              "Missing Android framebuffer evidence: " + name);
        File dir = getTargetContext().getExternalFilesDir(null);
        check(dir != null && (dir.isDirectory() || dir.mkdirs()), "No emulator evidence directory");
        try (FileOutputStream out = new FileOutputStream(new File(dir, name))) {
            check(image.compress(Bitmap.CompressFormat.PNG, 100, out), "PNG write failed: " + name);
        } finally {
            image.recycle();
        }
    }

    private void execute() throws Exception {
        launch();
        requireJs("!window.NutProgress.hasLevelEditor(window.NutbusterApp.getSave())",
                  "Fresh install must not have editor entitlement");
        requireJs("(function(){var s=window.NutbusterApp.getSave();"
            + "return !window.NutProgress.firstClear(s,1000).valid;})()",
            "Finale grant must reject an uncompleted level");

        // Test-only cleared-stage fixture, followed by the production firstClear
        // grant. Never set levelEditorUnlocked directly or alter production code.
        requireJs("(function(){var s=window.NutbusterApp.getSave();s.stars[1000]=1;"
            + "var r=window.NutProgress.firstClear(s,1000);"
            + "if(!r.valid||!window.NutProgress.hasLevelEditor(s))return false;"
            + "localStorage.setItem('nutbuster.v1',JSON.stringify(s));return true;})()",
            "Real finale progression grant did not unlock the editor");
        web.post(web::reload);
        SystemClock.sleep(900);
        requireJs("window.NutProgress.hasLevelEditor(window.NutbusterApp.getSave())",
                  "Editor entitlement did not survive packaged WebView reload");
        requireJs("(window.NutbusterApp.nav('editor'),window.NutbusterApp.getState().page==='editor')",
                  "Could not enter actual unlocked editor");

        String beforeCampaign = js("JSON.stringify(localStorage.getItem('nutbuster.v1'))");
        String beforeDraft = js("JSON.stringify(localStorage.getItem('nutbuster.custom-level.draft.v1'))");
        requireJs("!!document.querySelector('img[src=\"art/primary/nuts/peanut.png\"]')",
                  "Real nut sprite missing from editor");
        tap("[data-action='editor-favorite-toggle'][data-type='0']");
        tap("[data-action='editor-favorite-toggle'][data-type='1']");
        requireJs("(function(){var f=JSON.parse(localStorage.getItem('" + FAVORITES
            + "'));return f.version===1&&f.types.join(',')==='peanut,walnut'&&!f.only;})()",
            "Two physical STAR taps did not persist");
        tap("[data-action='editor-favorites-filter']");
        requireJs("(function(){var s=window.NutbusterApp.getState();"
            + "return s.editorFavoritesOnly&&!!document.querySelector('[data-action=\"editor-select\"][data-type=\"1\"]')"
            + "&&!document.querySelector('[data-action=\"editor-select\"][data-type=\"2\"]');})()",
            "Actual favorites-only touch did not filter real palette");
        tap("[data-action='editor-select'][data-type='1']");
        requireJs("window.NutbusterApp.getState().editorNut===1", "SELECT touch did not select walnut");
        tap("[data-action='editor-favorite-toggle'][data-type='0']");
        requireJs("(function(){var f=JSON.parse(localStorage.getItem('" + FAVORITES
            + "'));return f.types.join(',')==='walnut'&&f.only;})()",
            "Physical UNSTAR did not update filtered persistent list");
        tap("[data-action='editor-favorites-filter']");
        requireJs("!window.NutbusterApp.getState().editorFavoritesOnly", "SHOW ALL touch failed");
        js("document.querySelector('.editor-nut-palette').scrollLeft=0");
        swipePalette();
        requireJs("document.querySelector('.editor-nut-palette').scrollLeft>18",
                  "Physical horizontal palette swipe did not scroll");
        tap("[data-action='editor-favorite-toggle'][data-type='2']");
        tap("[data-action='editor-favorites-filter']");
        requireJs("(function(){var f=JSON.parse(localStorage.getItem('" + FAVORITES
            + "'));return f.only&&f.types.length===2&&f.types[0]==='walnut'"
            + "&&f.types[1]===window.NutEngine.TYPES[2];})()",
            "Re-star/filter state not persisted correctly");
        check(beforeCampaign.equals(js("JSON.stringify(localStorage.getItem('nutbuster.v1'))")),
              "Favorites touched official campaign save");
        check(beforeDraft.equals(js("JSON.stringify(localStorage.getItem('nutbuster.custom-level.draft.v1'))")),
              "Favorites touched custom draft");
        screenshot("editor-touch-filtered.png");

        runOnMainSync(() -> activity.finish());
        waitForIdleSync();
        SystemClock.sleep(350);
        launch();
        requireJs("window.NutProgress.hasLevelEditor(window.NutbusterApp.getSave())",
                  "Finale entitlement lost on activity relaunch");
        requireJs("(window.NutbusterApp.nav('editor'),window.NutbusterApp.getState().page==='editor')",
                  "Editor unavailable after activity relaunch");
        requireJs("(function(){var f=JSON.parse(localStorage.getItem('" + FAVORITES
            + "'));return f.only&&f.types.length===2&&f.types[0]==='walnut'"
            + "&&f.types[1]===window.NutEngine.TYPES[2]"
            + "&&window.NutbusterApp.getState().editorFavoritesOnly"
            + "&&!document.querySelector('[data-action=\"editor-select\"][data-type=\"0\"]');})()",
            "Persistent favorites/filter did not survive installed WebView relaunch");
        screenshot("editor-touch-relaunch.png");
    }
}
