(function(root){'use strict';
// Gameplay and saves remain offline. The signed native updater alone checks GitHub;
// checking never authorizes a download or install.
const RELEASES='https://github.com/mrcalzon02/NUTBUSTER-R/releases';
const updates={
  lastStatus:'Updates are checked at launch and when starting levels (at most once per hour). Download and installation always require your approval.',
  receive(message){
    updates.lastStatus=String(message||'');
    updates.syncStatus();
  },
  syncStatus(){
    const el=document.querySelector('[data-update-status]');
    if(el)el.textContent=updates.lastStatus;
  },
  autoCheck(reason){
    // The Android service enforces cooldown and suppresses repeat prompts.
    const bridge=root.NUTBUSTER_UPDATE_BRIDGE;
    if(bridge && typeof bridge.checkForUpdatesAutomatically==='function')
      bridge.checkForUpdatesAutomatically();
  },
  openReleases(){
    const bridge=root.NUTBUSTER_UPDATE_BRIDGE;
    if(bridge && typeof bridge.openReleases==='function')bridge.openReleases();
    else if(root.open)root.open(RELEASES,'_blank','noopener,noreferrer');
  },
  check(){
    const bridge=root.NUTBUSTER_UPDATE_BRIDGE;
    if(bridge && typeof bridge.checkForUpdates==='function'){
      updates.receive('Checking signed NUTBUSTER releases…');
      bridge.checkForUpdates();
    }else{
      updates.receive('Open GitHub Releases to compare and download a newer desktop/browser version.');
      updates.openReleases();
    }
  }
};
root.NutbusterUpdates=updates;
updates.autoCheck('boot');
})(window);
