/* Elemental trial rewards are separate from the existing 20-level challenge track.
   A first clear is atomic: mark the trial, then pay the reward once. */
(function(root){'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./elemental-challenges.js'):root.NutElementalChallenges;
const P=typeof module!=='undefined'&&module.exports?require('./progression.js'):root.NutProgress;
if(!C||!P)throw Error('Load elemental challenge profiles and progression first');
const num=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(999999,Math.trunc(Number(n)))):0;
function ensure(save){
 if(!save.elementalTrials||typeof save.elementalTrials!=='object'||Array.isArray(save.elementalTrials))save.elementalTrials={};
 if(!save.elementalRelics||typeof save.elementalRelics!=='object'||Array.isArray(save.elementalRelics))save.elementalRelics={};
 return save;
}
function clear(save,id,score=0){
 ensure(save);const spec=C.profile(Number(id));
 if(!spec)return {valid:false,reason:'trial'};
 if(!C.available(save,spec.id)&&!C.done(save,spec.id))return {valid:false,reason:'locked'};
 if(C.done(save,spec.id))return {valid:true,first:false,contents:{},coins:0,gems:0,relic:null};
 // Lock the first clear before applying grants, so a repeated result is idempotent.
 save.elementalTrials[spec.id]=Math.max(1,num(score));
 const coins=250+spec.area*200+spec.local*30;
 const gems=4+spec.area*2+(spec.milestone?12:0)+(spec.mastery?18:0);
 save.coins=num(save.coins)+coins;save.gems=num(save.gems)+gems;
 let contents={},relic=null;
 if(spec.milestone){
  const kind=spec.mastery?'finale':spec.local%10===5?'shop2':'treasure';
  contents=P.actualPack(save,kind);P.grant(save,contents);
 }
 if(spec.mastery){relic=spec.element;save.elementalRelics[relic]=true;}
 return {valid:true,first:true,coins,gems,contents,relic,id:spec.id,area:spec.area};
}
function summary(save){
 ensure(save);
 const completed=Object.keys(save.elementalTrials).filter(id=>C.done(save,Number(id))&&C.profile(Number(id))).length;
 return {completed,total:C.LAST-C.FIRST+1,relics:C.ELEMENTS.filter(id=>save.elementalRelics[id]===true),
  areas:Array.from({length:C.CHAPTERS.length},(_,i)=>({area:i+1,completed:C.regionProgress(save,i+1),total:30}))};
}
const api=Object.freeze({ensure,clear,summary});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutElementalRewards=api;
})(typeof window!=='undefined'?window:globalThis);
