(function(root){'use strict';
// Offline-first APK distribution: only a user tap opens GitHub in the external browser.
// No background checks, APK downloads, installation permission or native installer.
const RELEASES='https://github.com/mrcalzon02/NUTBUSTER-R/releases';
const updates={
  lastStatus:'To update, open GitHub Releases in your browser, download the newest NUTBUSTER-Android-phone-test.apk and install it using Android. Keep the existing app installed to preserve local saves.',
  receive(message){
    updates.lastStatus=String(message||'');
    updates.syncStatus();
  },
  syncStatus(){
    const el=document.querySelector('[data-update-status]');
    if(el)el.textContent=updates.lastStatus;
  },
  openReleases(){
    const bridge=root.NUTBUSTER_UPDATE_BRIDGE;
    if(bridge && typeof bridge.openReleases==='function')bridge.openReleases();
    else if(typeof root.open==='function')root.open(RELEASES,'_blank','noopener,noreferrer');
  },
  check(){
    updates.receive('Opening GitHub Releases. Download the newest Android APK and install it manually over the existing app.');
    updates.openReleases();
  }
};
root.NutbusterUpdates=updates;
})(window);
