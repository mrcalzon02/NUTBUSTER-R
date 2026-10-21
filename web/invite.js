(function(root){'use strict';
// Invite by public release link only. Never access accounts, friends, contacts or personal IDs.
const URL='https://github.com/mrcalzon02/NUTBUSTER-R/releases';
const MESSAGE='Come play NUTBUSTER with me! Get the game here: '+URL;
function fallbackSelect(){
 if(typeof root.prompt==='function')root.prompt('Copy this invitation link:',URL);
 else if(typeof document!=='undefined'){
   const el=document.querySelector('[data-invite-url]');
   if(el&&typeof el.select==='function'){el.select();}
 }
 return false;
}
async function copy(){
 try{
   if(root.navigator?.clipboard?.writeText){
     await root.navigator.clipboard.writeText(URL);
     return true;
   }
 }catch(_){}
 return fallbackSelect();
}
async function share(){
 const bridge=root.NUTBUSTER_SHARE_BRIDGE;
 if(bridge&&typeof bridge.shareInvite==='function'){bridge.shareInvite();return 'native';}
 if(root.navigator&&typeof root.navigator.share==='function'){
   try{await root.navigator.share({title:'NUTBUSTER',text:MESSAGE,url:URL});return 'shared';}
   catch(error){if(error&&error.name==='AbortError')return 'cancelled';}
 }
 return await copy()?'copied':'select';
}
root.NutbusterInvite={url:URL,message:MESSAGE,share,copy};
})(window);
