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
for label in failures: print("::error title=Nut Buster cloud-save contract::"+label)
print("NUT BUSTER PLAY CLOUD CONTRACT: "+("FAIL" if failures else "PASS"))
sys.exit(1 if failures else 0)
