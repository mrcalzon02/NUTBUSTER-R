(function(root){'use strict';
// Gameplay and saves remain offline. The signed native updater alone checks GitHub;
// checking never authorizes a download or install.
const RELEASES='https://play.google.com/store/apps/details?id=io.github.mrcalzon02.nutbuster';
const updates={
  lastStatus:'Google Play handles updates and installs with your consent. Checks are throttled.' ,
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
      updates.receive('Checking Google Play for an eligible update…');
      bridge.checkForUpdates();
    }else{
      updates.receive('Open the Google Play listing to check for an update.');
      updates.openReleases();
    }
  }
};
root.NutbusterUpdates=updates;
updates.autoCheck('boot');
})(window);
