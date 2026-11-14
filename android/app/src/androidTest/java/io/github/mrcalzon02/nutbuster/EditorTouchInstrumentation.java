package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
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
    private final StringBuilder bootConsole = new StringBuilder();

    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        start();
    }

    @Override public void onStart() {
        super.onStart();
        Bundle result = new Bundle();
        int exit = Activity.RESULT_CANCELED;
        String stage = "editor_touch";
        try {
            execute();
            result.putString("editor_touch", "EDITOR_TOUCH_PASS: installed API26 WebView physical taps, horizontal swipe, persistence, activity relaunch, screenshots");
            stage = "irregular_board";
            result.putString("irregular_board", runIrregularBoardProof());
            stage = "irregular_resume";
            result.putString("irregular_resume", runIdleResumeProof());
            stage = "booster_hud";
            result.putString("booster_hud", runBoosterHudProof());
            stage = "two_cascade";
            result.putString("two_cascade", runTwoCascadeProof());
            exit = Activity.RESULT_OK;
        } catch (Throwable error) {
            result.putString(stage, stage.toUpperCase(java.util.Locale.ROOT) + "_FAIL: " + error);
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
        // The API26 image may ship an older WebView than the developer browser.
        // Test-only reload captures script parse/runtime failures from page start;
        // do not change release WebView permissions or ignore failed assertions.
        web.post(() -> {
            web.setWebChromeClient(new WebChromeClient() {
                @Override public boolean onConsoleMessage(ConsoleMessage message) {
                    synchronized (bootConsole) {
                        if (bootConsole.length() < 6000)
                            bootConsole.append(message.messageLevel()).append(' ')
                                .append(message.sourceId()).append(':')
                                .append(message.lineNumber()).append(' ')
                                .append(message.message()).append('\n');
                    }
                    return true;
                }
            });
            web.reload();
        });
        long deadline = SystemClock.uptimeMillis() + 30000;
        while (SystemClock.uptimeMillis() < deadline) {
            if ("true".equals(js("!!(window.NutbusterApp && window.NutProgress && window.NutEngine)"))) return;
            SystemClock.sleep(250);
        }
        String documentEvidence;
        try {
            documentEvidence = js("(function(){return JSON.stringify({url:location.href,"
                + "ready:document.readyState,engine:!!window.NutEngine,"
                + "progress:!!window.NutProgress,app:!!window.NutbusterApp,"
                + "scripts:document.scripts.length,ua:navigator.userAgent});})()");
        } catch (Exception diagnosticError) {
            documentEvidence = "evaluation failed: " + diagnosticError;
        }
        android.content.pm.PackageInfo provider = WebView.getCurrentWebViewPackage();
        String providerVersion = provider == null ? "unknown" :
            provider.packageName + "/" + provider.versionName;
        String console;
        synchronized (bootConsole) {
            console = bootConsole.toString();
        }
        throw new AssertionError("Packaged game JavaScript did not initialize"
            + "; WebView=" + providerVersion
            + "; document=" + documentEvidence + "; console=" + console);
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
    /**
     * Emulator-only visual reproduction of issue #1. No production test hooks:
     * a fixed NutEngine seed is installed through the existing app state, then
     * the real packaged game's two touchscreen cell handlers resolve the swap.
     * Capture both actual Android framebuffers and inspect every visible tile.
     */
    private String runIrregularBoardProof() throws Exception {
        String fixture = """
            (function(){
              var E=window.NutEngine,app=window.NutbusterApp,chosen=null;
              for(var level=301;level<=500&&!chosen;level++){
                var cfg=E.makeLevel(level),splitColumns=0;
                for(var x=0;x<cfg.width;x++){
                  var runs=0,inside=false;
                  for(var y=0;y<cfg.height;y++){
                    var filled=!!cfg.mask[y*cfg.width+x];
                    if(filled&&!inside)runs++;
                    inside=filled;
                  }
                  if(runs>1)splitColumns++;
                }
                if(!splitColumns)continue;
                var seed=(74565+level*7919)>>>0;
                var board=E.create(level,seed),w=board.cfg.width;
                for(var a=0;a<board.cells.length&&!chosen;a++){
                  for(var direction=0;direction<2&&!chosen;direction++){
                    var b=a+(direction===0?1:w);
                    if(!E.adjacent(board,a,b))continue;
                    var probe=E.create(level,seed),turn=E.swap(probe,a,b);
                    if(!turn.valid)continue;
                    var falling=0,spawns=0,crossings=0;
                    (turn.stages||[]).forEach(function(stage){
                      if(stage.kind!=='cascade')return;
                      (stage.falls||[]).forEach(function(fall){
                        if(fall.from<0){spawns++;return;}
                        falling++;
                        if(fall.from%w!==fall.to%w){crossings++;return;}
                        var lo=Math.min(fall.from,fall.to)/w|0;
                        var hi=Math.max(fall.from,fall.to)/w|0;
                        for(var yy=lo;yy<=hi;yy++){
                          if(!probe.cfg.mask[yy*w+fall.to%w])crossings++;
                        }
                      });
                    });
                    if(!falling&&!spawns)continue;
                    if(crossings)return {error:'Cascade crossed a void/column',level:level,a:a,b:b,crossings:crossings};
                    chosen={level:level,seed:seed,a:a,b:b,splitColumns:splitColumns,falls:falling,spawns:spawns};
                  }
                }
              }
              if(!chosen)return {error:'No deterministic split-column board with an actual cascade in levels 301-500'};
              app.start(chosen.level);
              var state=app.getState();
              if(state.page!=='game')return {error:'Production game start rejected test fixture'};
              state.game=E.create(chosen.level,chosen.seed);
              app.nav('home');
              app.nav('game');
              if(state.page!=='game'||!document.querySelector('.board'))
                return {error:'Production game board failed to render'};
              return chosen;
            })()
            """;
        JSONObject selection = new JSONObject(js(fixture));
        check(!selection.has("error"), "Irregular fixture failed: " + selection);
        int a = selection.getInt("a"), b = selection.getInt("b");
        String audit = """
            (function(){
              var state=window.NutbusterApp.getState(),g=state.game;
              var board=document.querySelector('.board');
              if(!g||!board||state.page!=='game')return {error:'Game board unavailable'};
              var active=0,visible=0,voids=0,errors=[];
              for(var i=0;i<g.cfg.mask.length;i++){
                var tile=board.querySelector('[data-cell="'+i+'"]');
                if(!g.cfg.mask[i]){voids++;if(tile)errors.push('void tile '+i);continue;}
                active++;
                var cell=g.cells[i];
                if(!cell||cell.type===null){errors.push('empty playable '+i);continue;}
                if(!tile){errors.push('missing DOM tile '+i);continue;}
                var visual=tile.querySelector('.nut-visual');
                if(!visual){errors.push('missing nut visual '+i);continue;}
                var style=window.getComputedStyle(visual);
                if(style.visibility==='hidden'||Number(style.opacity)<0.01||
                  tile.classList.contains('nut-exploding')||
                  tile.classList.contains('clearing')){
                  errors.push('hidden visual '+i);continue;
                }
                var image=visual.querySelector('img.piece');
                var fallback=visual.querySelector('.fallback');
                var imageOk=!!image&&image.complete&&image.naturalWidth>0&&
                  getComputedStyle(image).display!=='none'&&getComputedStyle(image).visibility!=='hidden';
                var fallbackOk=!!fallback&&!!fallback.textContent.trim()&&
                  getComputedStyle(fallback).display!=='none'&&
                  getComputedStyle(fallback).visibility!=='hidden';
                if(!imageOk&&!fallbackOk){errors.push('blank sprite '+i);continue;}
                if(tile.getAttribute('data-nut-key').split(':')[0]!==String(cell.type)){
                  errors.push('stale nut '+i);continue;
                }
                visible++;
              }
              return {active:active,visible:visible,voids:voids,errors:errors,
                turns:g.history.length,animating:state.animating};
            })()
            """;
        SystemClock.sleep(700);
        JSONObject before = new JSONObject(js(audit));
        check(!before.has("error") && before.getJSONArray("errors").length() == 0 &&
              before.getInt("visible") == before.getInt("active"),
              "Initial installed irregular board has blank cells: " + before);
        screenshot("irregular-board-before.png");
        tap("[data-cell='" + a + "']");
        tap("[data-cell='" + b + "']");
        long deadline = SystemClock.uptimeMillis() + 14000;
        boolean resolved = false;
        while(SystemClock.uptimeMillis() < deadline){
            if("true".equals(js("(function(){var s=window.NutbusterApp.getState();"
                + "return s.page==='game'&&!s.animating&&s.game.history.length>0;})()"))){
                resolved = true;
                break;
            }
            SystemClock.sleep(300);
        }
        check(resolved, "Real Android cascade did not settle; fixture=" + selection);
        SystemClock.sleep(500);
        JSONObject after = new JSONObject(js(audit));
        screenshot("irregular-board-after.png");
        check(!after.has("error") && after.getJSONArray("errors").length() == 0 &&
              after.getInt("visible") == after.getInt("active") && after.getInt("turns") > 0,
              "Irregular cascade left a blank playable nut: " + selection + " / " + after);
        return "IRREGULAR_BOARD_PASS: real Chrome69 Android swap; selection=" + selection
            + "; before=" + before + "; after=" + after
            + "; actual framebuffer PNGs saved";
    }

    /**
     * Installed Android 26 lifecycle regression: deliberately conceal one
     * existing nut on a real irregular board, send the actual Activity task to
     * the background and bring it back without making another move. Chrome69
     * must deliver real document visibility changes and restore only that
     * sprite, leaving authored voids, cells, history and HUD intact.
     */
    private String runIdleResumeProof() throws Exception {
        JSONObject stale = new JSONObject(js("""
            (function(){
              var s=window.NutbusterApp.getState(),g=s.game,board=document.querySelector('.board');
              if(s.page!=='game'||s.animating||!g||!board)
                return {error:'Idle playable board unavailable'};
              var voids=0,active=0,chosen=-1;
              for(var i=0;i<g.cfg.mask.length;i++){
                if(!g.cfg.mask[i]){voids++;continue;}
                active++;
                var tile=board.querySelector('[data-cell="'+i+'"]');
                if(tile&&tile.querySelector('.nut-visual img.piece')&&
                   tile.querySelector('.nut-visual .fallback')&&chosen<0)chosen=i;
              }
              if(!voids||!active||chosen<0)return {error:'Not an irregular board with a complete sprite'};
              var tile=board.querySelector('[data-cell="'+chosen+'"]');
              var visual=tile.querySelector('.nut-visual');
              var image=visual.querySelector('img.piece');
              var fallback=visual.querySelector('.fallback');
              // Full cell payload, all void bits and turn counters are authoritative.
              var snapshot=function(){return JSON.stringify({
                mask:Array.prototype.slice.call(g.cfg.mask),
                cells:g.cells.map(function(c){return c?{
                  type:c.type,special:c.special,elemental:c.elemental,hold:c.hold,
                  ice:c.ice,lock:c.lock,chest:c.chest
                }:null;}),
                moves:g.moves,score:g.score,turns:g.history.length
              });};
              window.__nbIdleResume={
                board:board,tile:tile,index:chosen,baseline:snapshot(),
                snapshot:snapshot,events:[]
              };
              document.addEventListener('visibilitychange',function(){
                window.__nbIdleResume.events.push(document.hidden?'hidden':'visible');
              });
              // Corrupt only the presented installed WebView sprite. The game
              // engine and its original fixed mask are never rewritten.
              visual.style.visibility='hidden';
              image.style.display='none';
              image.classList.add('loaded');
              fallback.style.visibility='hidden';
              tile.classList.add('nut-exploding');
              var r=tile.getBoundingClientRect();
              return {index:chosen,active:active,voids:voids,
                hidden:getComputedStyle(visual).visibility==='hidden',
                turns:g.history.length,
                bounds:{left:r.left,top:r.top,width:r.width,height:r.height,
                  viewportWidth:innerWidth,viewportHeight:innerHeight}};
            })()
            """));
        check(!stale.has("error") && stale.getBoolean("hidden"),
              "Could not reproduce the hidden nut in installed Chrome69: " + stale);
        check(stale.getInt("active") > 0 && stale.getInt("voids") > 0,
              "Idle resume must use an irregular masked board");
        // Give the real Chrome69 compositor time to submit the deliberately
        // hidden tile before taking its device framebuffer screenshot.
        SystemClock.sleep(700);
        screenshot("idle-resume-hidden.png");

        // This is an actual Android Activity lifecycle transition, not a
        // synthetic visibilitychange dispatch in a mocked browser/DOM.
        runOnMainSync(() -> check(activity.moveTaskToBack(true),
              "Failed to background the installed MainActivity task"));
        SystemClock.sleep(1300);
        Intent resume = new Intent(Intent.ACTION_MAIN);
        resume.setClassName(PKG, PKG + ".MainActivity");
        resume.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP |
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        getTargetContext().startActivity(resume);
        waitForIdleSync();
        SystemClock.sleep(900);

        JSONObject restored = new JSONObject(js("""
            (function(){
              var fixture=window.__nbIdleResume;
              if(!fixture)return {error:'Activity replaced original WebView/board on return'};
              var s=window.NutbusterApp.getState(),g=s.game;
              var board=document.querySelector('.board');
              if(!g||!board)return {error:'Playable board missing on resume'};
              var visible=0,active=0,voids=0,errors=[];
              for(var i=0;i<g.cfg.mask.length;i++){
                var tile=board.querySelector('[data-cell="'+i+'"]');
                if(!g.cfg.mask[i]){
                  voids++;
                  if(tile)errors.push('void tile '+i);
                  continue;
                }
                active++;
                if(!g.cells[i]||g.cells[i].type===null||!tile){
                  errors.push('missing playable nut '+i);continue;
                }
                var visual=tile.querySelector('.nut-visual');
                var img=visual&&visual.querySelector('img.piece');
                var fallback=visual&&visual.querySelector('.fallback');
                if(!visual||getComputedStyle(visual).visibility==='hidden'||
                   Number(getComputedStyle(visual).opacity)<0.01||
                   tile.classList.contains('nut-exploding')){
                  errors.push('hidden nut '+i);continue;
                }
                var imgOk=img&&img.complete&&img.naturalWidth>0&&
                  getComputedStyle(img).display!=='none';
                var fallbackOk=fallback&&fallback.textContent.trim()&&
                  getComputedStyle(fallback).visibility!=='hidden'&&
                  getComputedStyle(fallback).display!=='none';
                if(!imgOk&&!fallbackOk){errors.push('blank sprite '+i);continue;}
                visible++;
              }
              return {events:fixture.events,visible:visible,active:active,
                voids:voids,errors:errors,page:s.page,animating:s.animating,
                sameBoard:board===fixture.board,
                sameTile:board.querySelector('[data-cell="'+fixture.index+'"]')===fixture.tile,
                unchanged:fixture.snapshot()===fixture.baseline,
                nowVisible:!document.hidden,
                turns:g.history.length};
            })()
            """));
        screenshot("idle-resume-recovered.png");
        checkSpriteFramebufferTransition(stale.getJSONObject("bounds"));
        check(!restored.has("error") &&
              restored.getJSONArray("events").toString().contains("hidden") &&
              restored.getJSONArray("events").toString().contains("visible") &&
              restored.getBoolean("nowVisible"),
              "Actual Android background/foreground visibilitychange was not delivered: " + restored);
        check(restored.getBoolean("sameBoard") && restored.getBoolean("sameTile") &&
              restored.getBoolean("unchanged") &&
              "game".equals(restored.getString("page")) &&
              !restored.getBoolean("animating") &&
              restored.getInt("turns")==stale.getInt("turns"),
              "Idle resume changed the original board, mask, moves or payload: " + restored);
        check(restored.getJSONArray("errors").length()==0 &&
              restored.getInt("visible")==restored.getInt("active") &&
              restored.getInt("voids")==stale.getInt("voids"),
              "Real Android resume left blank playable nuts or altered true voids: " + restored);
        return "IRREGULAR_RESUME_PASS: Chrome69 installed Android Activity lifecycle, "
            + "real hidden nut restored with zero new moves, unchanged payload/void masks "
            + "and fixed board; before/after framebuffer PNGs; " + restored;
    }

    /**
     * Screenshot evidence must show the actual hidden sprite becoming visible,
     * not merely two identical device PNGs captured before composition.
     * Compare the center of the real selected tile in screen coordinates.
     */
    private void checkSpriteFramebufferTransition(JSONObject bounds) throws Exception {
        File dir = getTargetContext().getExternalFilesDir(null);
        check(dir != null, "No device evidence directory");
        Bitmap hidden = BitmapFactory.decodeFile(new File(dir, "idle-resume-hidden.png").getPath());
        Bitmap restored = BitmapFactory.decodeFile(new File(dir, "idle-resume-recovered.png").getPath());
        check(hidden != null && restored != null, "Could not decode captured Android PNGs");
        try {
            check(hidden.getWidth() == restored.getWidth() &&
                  hidden.getHeight() == restored.getHeight(),
                  "Android screenshot dimensions changed across Activity resume");
            int[] origin = new int[2];
            web.getLocationOnScreen(origin);
            double sx = web.getWidth() / bounds.getDouble("viewportWidth");
            double sy = web.getHeight() / bounds.getDouble("viewportHeight");
            int x0 = Math.max(0, origin[0] + (int)((bounds.getDouble("left")
                + bounds.getDouble("width") * .2) * sx));
            int x1 = Math.min(hidden.getWidth(), origin[0] + (int)((bounds.getDouble("left")
                + bounds.getDouble("width") * .8) * sx));
            int y0 = Math.max(0, origin[1] + (int)((bounds.getDouble("top")
                + bounds.getDouble("height") * .2) * sy));
            int y1 = Math.min(hidden.getHeight(), origin[1] + (int)((bounds.getDouble("top")
                + bounds.getDouble("height") * .8) * sy));
            check(x1 - x0 >= 15 && y1 - y0 >= 15,
                  "Selected real nut has no visible screenshot comparison area");
            int changed = 0;
            for (int y = y0; y < y1; y += 2) {
                for (int x = x0; x < x1; x += 2) {
                    if (hidden.getPixel(x, y) != restored.getPixel(x, y)) changed++;
                }
            }
            check(changed >= 100,
                  "Android hidden/recovered screenshots did not visibly differ at "
                  + "the selected nut (" + changed + " pixel samples changed)");
        } finally {
            hidden.recycle();
            restored.recycle();
        }
    }

    /**
     * A real installed Chrome69 WebView layout/tap regression for the former
     * twelve-tool pileup. Exercise 320px and 360px *content* widths inside
     * the installed game without mocking its DOM, art or CSS engine.
     */

    /**
     * Real installed API26 WebView: level 36 / seed 7 / first swap 8,9.
     * Cancel the *native* Web Animations on both gravity waves in the
     * instrumentation-only page context. No game hooks, saves or engine logic
     * are shipped with this test APK. Measure actual playable/void mask counts
     * instead of borrowing counts from the older level-306 screenshot.
     */
    private String runTwoCascadeProof() throws Exception {
        JSONObject fixture = new JSONObject(js("""
            (function(){
              var E=window.NutEngine,app=window.NutbusterApp,s=app.getState();
              if(s.animating||app.getSave().hearts<1||app.getSave().dailyMoves.remaining<2)
                return {error:'Isolated emulator account needs a heart and two daily moves'};
              if(!Element.prototype.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)
                return {error:'Installed WebView must support enabled native Web Animations'};
              var preview=E.create(36,7),w=preview.cfg.width,mask=preview.cfg.mask;
              var split=0;
              for(var x=0;x<w;x++){
                var inside=false,runs=0;
                for(var y=0;y<preview.cfg.height;y++){
                  var present=!!mask[y*w+x];
                  if(present&&!inside)runs++;
                  inside=present;
                }
                if(runs>1)split++;
              }
              if(split<2||!E.adjacent(preview,8,9))
                return {error:'Level 36 no longer contains the authored split-column / 8,9 fixture'};
              var wallet=app.getSave().dailyMoves.remaining;
              preview.moves=wallet;
              preview.cfg.objectives=[{kind:'score',target:Number.MAX_SAFE_INTEGER}];
              var result=E.swap(preview,8,9);
              if(!result.valid)return {error:'8,9 must be a valid actual engine swap'};
              var cascades=result.stages.filter(function(stage){return stage.kind==='cascade';});
              var falls=cascades.reduce(function(all,stage){return all.concat(stage.falls||[]);},[]);
              if(cascades.length<2||cascades.some(function(stage){return !(stage.falls||[]).length;})||
                 falls.length<5||!falls.some(function(f){return f.from<0;})||
                 !falls.some(function(f){return f.from>=0;}))
                return {error:'Two real gravity waves with moved and spawned nuts are required',
                  cascades:cascades.length,falls:falls.length};
              for(var k=0;k<falls.length;k++){
                var f=falls[k],col=f.to%w;
                if(!mask[f.to])return {error:'Fall target is void',fall:k};
                if(f.from<0)continue;
                if(f.from%w!==col)return {error:'Cross-column gravity',fall:k};
                var lo=Math.min(Math.floor(f.from/w),Math.floor(f.to/w));
                var hi=Math.max(Math.floor(f.from/w),Math.floor(f.to/w));
                for(var yy=lo;yy<=hi;yy++){
                  if(!mask[yy*w+col])return {error:'Cross-void gravity',fall:k};
                }
              }
              app.start(36);s=app.getState();
              if(s.page!=='game')return {error:'Production game start failed'};
              s.game=E.create(36,7);
              s.game.cfg.objectives=[{kind:'score',target:Number.MAX_SAFE_INTEGER}];
              app.nav('home');app.nav('game');
              var board=document.querySelector('.board');
              if(s.page!=='game'||!board)return {error:'Installed board did not render'};
              var originalAnimate=Element.prototype.animate;
              window.__nb36={
                originalAnimate:originalAnimate,board:board,
                wallet:wallet,expected:preview.cells.map(function(c){return c?c.type:null;}),
                waves:cascades.length,falls:falls.length,
                started:0,canceled:0,batches:0
              };
              Element.prototype.animate=function(){
                var animation=originalAnimate.apply(this,arguments);
                if(this.classList&&this.classList.contains('falling-nut')){
                  var proof=window.__nb36;
                  proof.started++;
                  if(board.querySelectorAll('.falling-nut').length===1)proof.batches++;
                  setTimeout(function(){
                    // Deliberately interrupt real Chrome Web Animations; the
                    // game must still release overlays and restore nut sprites.
                    if(animation.playState!=='finished'){
                      animation.cancel();
                      proof.canceled++;
                    }
                  },30);
                }
                return animation;
              };
              board.scrollIntoView({block:'center',inline:'center'});
              return {level:36,seed:7,a:8,b:9,
                active:mask.filter(Boolean).length,
                voids:mask.filter(function(x){return !x;}).length,
                splitColumns:split,waves:cascades.length,falls:falls.length,
                walletBefore:wallet};
            })()
            """));
        check(!fixture.has("error") && fixture.getInt("active") > 0 &&
              fixture.getInt("voids") > 0 && fixture.getInt("splitColumns") >= 2 &&
              fixture.getInt("waves") >= 2 && fixture.getInt("falls") >= 5,
              "Level-36 two-wave installed fixture invalid: " + fixture);

        String audit = """
            (function(){
              var s=window.NutbusterApp.getState(),g=s.game,proof=window.__nb36;
              var board=document.querySelector('.board');
              if(!proof||!g||!board)return {error:'Installed game state missing'};
              var active=0,visible=0,voids=0,errors=[];
              for(var i=0;i<g.cfg.mask.length;i++){
                var tile=board.querySelector('[data-cell="'+i+'"]');
                if(!g.cfg.mask[i]){
                  voids++;if(tile)errors.push('void has a tile '+i);continue;
                }
                active++;
                var cell=g.cells[i];
                if(!cell||cell.type===null||!tile){
                  errors.push('missing playable nut '+i);continue;
                }
                var visual=tile.querySelector('.nut-visual');
                if(!visual||getComputedStyle(visual).visibility==='hidden'||
                  Number(getComputedStyle(visual).opacity)<.01||
                  tile.classList.contains('nut-exploding')||
                  tile.classList.contains('clearing')){
                  errors.push('hidden sprite '+i);continue;
                }
                var img=visual.querySelector('img.piece');
                var fallback=visual.querySelector('.fallback');
                var imageOk=img&&img.complete&&img.naturalWidth>0&&
                  getComputedStyle(img).display!=='none'&&
                  getComputedStyle(img).visibility!=='hidden';
                var fallbackOk=fallback&&fallback.textContent.trim()&&
                  getComputedStyle(fallback).visibility!=='hidden'&&
                  getComputedStyle(fallback).display!=='none';
                if(!imageOk&&!fallbackOk){
                  errors.push('blank image and fallback '+i);continue;
                }
                if(!tile.getAttribute('data-nut-key')||
                   tile.getAttribute('data-nut-key').split(':')[0]!==String(cell.type)){
                  errors.push('stale nut type '+i);continue;
                }
                visible++;
              }
              var expected=proof.expected,actual=g.cells.map(function(c){return c?c.type:null;});
              return {active:active,visible:visible,voids:voids,errors:errors,
                page:s.page,animating:s.animating,turns:g.history.length,
                walletBefore:proof.wallet,walletAfter:window.NutbusterApp.getSave().dailyMoves.remaining,
                expectedMatches:JSON.stringify(expected)===JSON.stringify(actual),
                sameBoard:board===proof.board,overlays:board.querySelectorAll('.falling-nut').length,
                waves:proof.waves,falls:proof.falls,started:proof.started,
                canceled:proof.canceled,batches:proof.batches};
            })()
            """;
        SystemClock.sleep(600);
        JSONObject before = new JSONObject(js(audit));
        check(before.getJSONArray("errors").length() == 0 &&
              before.getInt("visible") == fixture.getInt("active") &&
              before.getInt("voids") == fixture.getInt("voids") &&
              before.getInt("turns") == 0,
              "Installed two-cascade initial mask or sprite mismatch: " + before);
        screenshot("two-cascade-before.png");

        // Actual injected touchscreen events, not .click() or test-only doSwap.
        tap("[data-cell='8']");
        tap("[data-cell='9']");
        boolean resolved = false;
        long deadline = SystemClock.uptimeMillis() + 16000;
        while(SystemClock.uptimeMillis() < deadline){
            if("true".equals(js("(function(){var s=window.NutbusterApp.getState();"
                + "return s.page==='game'&&!s.animating&&s.game.history.length===1;})()"))){
                resolved = true;
                break;
            }
            SystemClock.sleep(180);
        }
        check(resolved, "Two real interrupted WebView cascades failed to release input");
        requireJs("(document.querySelector('.board').scrollIntoView({block:'center',inline:'center'}),true)",
                  "Cannot center the installed board for framebuffer evidence");
        SystemClock.sleep(700);
        JSONObject after = new JSONObject(js(audit));
        screenshot("two-cascade-after.png");
        check(after.getJSONArray("errors").length() == 0 &&
              after.getInt("visible") == fixture.getInt("active") &&
              after.getInt("voids") == fixture.getInt("voids") &&
              after.getInt("turns") == 1 &&
              !after.getBoolean("animating") &&
              "game".equals(after.getString("page")) &&
              after.getBoolean("sameBoard") && after.getBoolean("expectedMatches") &&
              after.getInt("walletBefore") - after.getInt("walletAfter") == 1 &&
              after.getInt("overlays") == 0 &&
              after.getInt("started") >= fixture.getInt("falls") &&
              after.getInt("canceled") >= fixture.getInt("falls") &&
              after.getInt("batches") >= 2,
              "Installed two-cascade interruption, sprite or daily-wallet regression: " + after);
        checkTwoCascadeFramebuffers();
        requireJs("(Element.prototype.animate=window.__nb36.originalAnimate,true)",
                  "Could not restore original native animation method");
        return "TWO_CASCADE_PASS: installed Chrome69 level36 seed7 first swap 8,9; "
            + "native fall Web Animations canceled; authentic before/after PNGs; "
            + "no void crossings, every playable sprite visible, exactly one daily move; "
            + "fixture=" + fixture + "; before=" + before + "; after=" + after;
    }

    private void checkTwoCascadeFramebuffers() throws Exception {
        File dir = getTargetContext().getExternalFilesDir(null);
        check(dir != null, "Installed framebuffer evidence directory missing");
        Bitmap before = BitmapFactory.decodeFile(new File(dir, "two-cascade-before.png").getPath());
        Bitmap after = BitmapFactory.decodeFile(new File(dir, "two-cascade-after.png").getPath());
        check(before != null && after != null, "Missing actual Android two-cascade framebuffers");
        try {
            check(before.getWidth()==after.getWidth() && before.getHeight()==after.getHeight(),
                  "Installed screen dimensions changed between two-cascade frames");
            // Compare genuine device pixels, not in-memory DOM markup.
            // The puzzle occupies the center of this installed screen; the
            // same board is re-centered before each framebuffer capture.
            int changed=0;
            for(int y=after.getHeight()/4;y<after.getHeight()*3/4;y+=3){
                for(int x=after.getWidth()/6;x<after.getWidth()*5/6;x+=3){
                    if(before.getPixel(x,y)!=after.getPixel(x,y))changed++;
                }
            }
            check(changed>=100,
                  "Installed two-cascade before/after display did not change enough ("
                  + changed + " sampled pixels)");
        } finally {
            before.recycle();
            after.recycle();
        }
    }

    private String runBoosterHudProof() throws Exception {
        JSONObject layout = new JSONObject(js("""
            (function(){
              var panel=document.querySelector('.play-layout');
              var belt=document.querySelector('.game-active .boosters');
              if(!panel||!belt)return {errors:['Game/booster HUD missing']};
              var previous=panel.style.width,errors=[],evidence=[];
              [320,360].forEach(function(width){
                panel.style.width=width+'px';
                var box=belt.getBoundingClientRect();
                var buttons=Array.prototype.slice.call(belt.querySelectorAll('button'));
                if(buttons.length!==12)errors.push(width+': expected 12 tools, got '+buttons.length);
                if(Math.abs(box.width-width)>2)errors.push(width+': belt grid collapsed to '+box.width);
                buttons.forEach(function(button,i){
                  var r=button.getBoundingClientRect();
                  var label=button.querySelector('.booster-label');
                  var art=button.querySelector('img.booster-icon,img.hold-icon');
                  if(r.width<44||r.height<44)errors.push(width+': small hit target '+i+' '+r.width+'x'+r.height);
                  if(r.left<box.left-1||r.right>box.right+1)errors.push(width+': tool outside belt '+i);
                  if(i>0&&i%6!==0){
                    var prev=buttons[i-1].getBoundingClientRect();
                    if(r.left<prev.right-1)errors.push(width+': overlapping tools '+(i-1)+'/'+i);
                    if(Math.abs(r.top-prev.top)>1)errors.push(width+': broken six-column row '+i);
                  }
                  if(i>=6){
                    var above=buttons[i-6].getBoundingClientRect();
                    if(r.top<above.bottom-1)errors.push(width+': overlapping rows '+i);
                  }
                  if(!label)errors.push(width+': missing label '+i);
                  else{
                    var lr=label.getBoundingClientRect();
                    if(lr.left<r.left-1||lr.right>r.right+1||lr.bottom>r.bottom+1)
                      errors.push(width+': overflowing label bounds '+i);
                    if(label.scrollHeight>label.clientHeight+1||label.scrollWidth>label.clientWidth+1)
                      errors.push(width+': clipped label '+i+' '+label.textContent.trim());
                  }
                  if(!art||!art.complete||art.naturalWidth<1||art.getBoundingClientRect().width<20)
                    errors.push(width+': missing illustrated tool '+i);
                });
                evidence.push({contentWidth:width,beltWidth:box.width,
                  firstButton:buttons[0]?buttons[0].getBoundingClientRect().width:null,
                  tools:buttons.length});
              });
              panel.style.width=previous;
              return {errors:errors,evidence:evidence};
            })()
            """));
        check(layout.getJSONArray("errors").length()==0,
            "Compact installed booster HUD has overlapping, clipped or untouchable tools: " + layout);
        // A real injected screen tap must reach the actual game tool handler.
        tap("[data-hold-tool='butter_hold']");
        check("true".equals(js("(function(){var s=window.NutbusterApp.getState();"
            + "return s.page==='shop'||s.holdTool==='butter_hold';})()")),
            "Touchscreen did not activate Butter Hold or open its offer");
        return "BOOSTER_HUD_PASS: Chrome69 320/360px twelve-tool geometry, "
            + "44px hitboxes, original art, readable labels and real Butter Hold tap; " + layout;
    }

}
