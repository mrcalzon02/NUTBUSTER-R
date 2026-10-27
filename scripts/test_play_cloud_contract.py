#!/usr/bin/env python3
"""Test Nut Buster Play snapshot persistence bridge and restore safety."""
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
manifest = (root/"android/app/src/play/AndroidManifest.xml").read_text()
launcher = (root/"android/app/src/play/java/io/github/mrcalzon02/nutbuster/PlayMainActivity.java").read_text()
java = (root/"android/app/src/play/java/io/github/mrcalzon02/nutbuster/PlayCloudBridge.java").read_text()
game = (root/"web/game.js").read_text()
failures=[]

def require(ok,label,fix):
    print(("PASS: " if ok else "FAIL: ") + label)
    if not ok:
        print("SOLUTION: " + fix)
        failures.append(label)

require('.PlayMainActivity' in manifest and 'tools:node="remove"' in manifest,
 "Sideload launcher removed only from Play", "Correct AndroidManifest Play overlay's launcher replacement.")
require('addJavascriptInterface' in launcher and '"NutPlayCloud"' in launcher,
 "Play-only bridge installed on packaged game", "Attach bridge exclusively in PlayMainActivity.")
require(all(x in java for x in ('isAuthenticated()', 'SnapshotsClient', 'client.open(', 'writeBytes(',
 'commitAndClose(', 'readFully(', 'discardAndClose(')),
 "Real Play Games authenticated Saved Games read and write calls",
 "Implement SnapshotsClient actual Task calls, including verified upload and snapshot close.")
require(all(x in game for x in ('cloud-backup','cloud-restore','cloud-apply','cloud-cancel',
 'pendingCloudRestore', '.before-cloud-restore', 'NutPlayCloudMessage')),
 "Cloud restore consent, local rollback and status UI",
 "Provide explicit preview and confirmation before replacing the existing local save.")
require('GAME UPDATES' in game and 'window.NutPlayCloud?' in game,
 "Play UI hides sideload APK update controls", "Condition the GitHub APK update controls on absence of the Play bridge.")
syntax = subprocess.run(['node','--check',str(root/'web/game.js')],text=True,capture_output=True)
require(syntax.returncode==0,"Game JavaScript parses","Fix JavaScript syntax: "+syntax.stderr[-450:])
main_activity = (root/"android/app/src/main/java/io/github/mrcalzon02/nutbuster/MainActivity.java").read_text()
require('prepareGameWebView(game);' in main_activity and
        main_activity.index('prepareGameWebView(game);') < main_activity.index('game.loadUrl('),
        "Cloud bridge hooks before the first game page navigation",
        "Call prepareGameWebView(game) before game.loadUrl() in MainActivity.")
require('prepareGameWebView(WebView game)' in launcher and
        '"NutPlayCloud"' in launcher,
        "Play subclass registers the cloud JavaScript API at pre-navigation hook",
        "Override prepareGameWebView(WebView game) and attach the bridge there.")
require('SnapshotsClient.RESOLUTION_POLICY_MANUAL' in java and
        'RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED' not in java,
        "Cloud snapshot conflicts are never auto-resolved by last-modified timestamp",
        "Use RESOLUTION_POLICY_MANUAL and reject or explicitly reconcile divergent remote snapshots.")

require(all(x in java for x in ('void replace(String json, String inspectedVersion)',
        'fingerprint(current).equals(inspectedVersion)', 'Arrays.equals(current, data)',
        'Different cloud progress', 'RESOLUTION_POLICY_MANUAL')),
        "Cloud writes require previewed version and explicit conflict choice",
        "Check remote snapshot fingerprint, reject divergent cloud saves without consent, and provide an explicit replace action.")
require(all(x in game for x in ('pendingCloudVersion', 'cloud-replace',
        'NutPlayCloud.replace(JSON.stringify(saved),pendingCloudVersion)')),
        "Play restore preview can explicitly replace only inspected cloud revision",
        "Expose an explicit replace choice after preview; retain device saves when cloud changes.")

for label in failures: print("::error title=Nut Buster cloud-save contract::"+label)
print("NUT BUSTER PLAY CLOUD CONTRACT: "+("FAIL" if failures else "PASS"))
sys.exit(1 if failures else 0)
