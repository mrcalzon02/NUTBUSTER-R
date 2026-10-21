(function(root){'use strict';
// The game's web UI remains offline; only the native Android shell may reach GitHub.
const updates={
  receive(message){
    const el=document.querySelector('[data-update-status]');
    if(el) el.textContent=message;
  },
  check(){
    if(root.NUTBUSTER_UPDATE_BRIDGE && typeof root.NUTBUSTER_UPDATE_BRIDGE.checkForUpdates==='function'){
      updates.receive('Checking the signed Nutbuster release channel…');
      root.NUTBUSTER_UPDATE_BRIDGE.checkForUpdates();
    }else updates.receive('Desktop/browser builds: check the GitHub Releases page for updates.');
  }
};
root.NutbusterUpdates=updates;
})(window);
