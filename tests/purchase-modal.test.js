'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const P=require('../web/progression.js'),E=require('../web/engine.js'),F=require('../web/fishing.js');
const C=require('../web/loot-crates.js'),Purchases=require('../web/purchase-disclosures.js');
const root=path.resolve(__dirname,'..'),css=fs.readFileSync(path.join(root,'web/style.css'),'utf8');
assert.match(css,/\.purchase-overlay\{position:fixed;inset:0;z-index:1000/,'Modal belongs to viewport above shop and navigation');
assert.match(css,/\.purchase-confirm-dialog\{[^}]*max-height:min\(90dvh,760px\)/,'Dialog fits within visible viewport');
assert.match(css,/\.purchase-confirm-body\{[^}]*overflow-y:auto/,'Only contents scroll');
assert.match(css,/\.purchase-confirm-actions\{[^}]*flex-shrink:0/,'Confirm / Cancel stay on screen');
const windowHandlers={},bodyClasses=new Set(),state={markup:'',paints:0,modal:false,focus:0,restored:0};
const classes={add(name){bodyClasses.add(name)},remove(name){bodyClasses.delete(name)},toggle(name,on){on?bodyClasses.add(name):bodyClasses.delete(name)}};
const target={focus(){state.restored++}};
const screen={
 classList:{toggle(){}},addEventListener(type,fn){windowHandlers['screen-'+type]=fn;},
 get innerHTML(){return state.markup},
 set innerHTML(text){state.markup=text;state.paints++;state.modal=false;},
 querySelector(selector){
  if(selector==='.purchase-overlay'&&state.modal)return {remove(){state.markup=state.markup.slice(0,state.markup.indexOf('<div class="purchase-overlay">'));state.modal=false}};
  if(selector==='.purchase-confirm-dialog'&&state.modal)return {focus(){state.focus++}};
  return null;
 },querySelectorAll(){return []},
 insertAdjacentHTML(where,html){assert.equal(where,'beforeend');assert.match(html,/class="purchase-overlay"/);state.markup+=html;state.modal=true;}
};
const wallet={textContent:''},gems={textContent:''},toast={textContent:'',classList:{add(){},remove(){}}};
const document={body:{classList:classes},getElementById:id=>({screen,app:{classList:classes},wallet,gems,toast})[id]||null,querySelector(){return null},querySelectorAll(){return []}};
const fakeCrates={CRATES:C.CRATES,odds:C.odds,opens:0,open(save,id){this.opens++;return C.open(save,id,()=>0.999999)}};
const win={NutProgress:P,NutEngine:E,NutFishing:F,NutCrates:fakeCrates,NutPurchases:Purchases,
 NutAvatarArt:require('../web/avatar-art.js'),NutDailyMoves:require('../web/daily-moves.js'),
 NutBenefits:require('../web/benefits.js'),NutHomestead:require('../web/homestead.js'),
 NutCampaignMaps:require('../web/campaign-maps.js'),NutElementalRewards:require('../web/elemental-rewards.js'),
 NutElementalChallenges:require('../web/elemental-challenges.js'),addEventListener(name,fn){windowHandlers[name]=fn}};
const storage={};
vm.runInNewContext(fs.readFileSync(path.join(root,'web/game.js'),'utf8'),{
 window:win,document,localStorage:{getItem:k=>storage[k]||null,setItem:(k,value)=>{storage[k]=value}},
 setTimeout(){return 0},clearTimeout(){},console
});
const app=win.NutbusterApp;app.nav('shop');app.getSave().coins=5000;
const tap=(data,original=target)=>windowHandlers['screen-click']({target:{closest:()=>({dataset:data,focus:original.focus})}});
const before=state.paints,coins=app.getSave().coins;
tap({action:'crate-open',crate:'acorn'});
assert.equal(state.paints,before,'Opening popup must preserve underlying shop scroll and DOM');
assert.equal(state.modal,true);assert.ok(bodyClasses.has('purchase-modal-open'));
assert.equal(state.focus,1,'Dialog must focus without scrolling');
assert.match(state.markup,/ACTUAL DROP CHANCES/);
assert.equal(app.getSave().coins,coins,'Merely viewing odds costs nothing');
tap({action:'purchase-cancel'});
assert.equal(state.paints,before,'Cancelling popup must not redraw shop or lose scroll');
assert.equal(state.modal,false);
assert.equal(state.restored,1,'Restore focus to original purchase button');
assert.ok(!bodyClasses.has('purchase-modal-open'));
tap({action:'crate-open',crate:'acorn'});
let stopped=false;
windowHandlers.keydown({key:'Escape',preventDefault(){stopped=true}});
assert.equal(stopped,true);assert.equal(state.modal,false);
assert.equal(state.paints,before,'Escape leaves shop position intact');
tap({action:'crate-open',crate:'acorn'});
tap({action:'purchase-confirm'});
assert.equal(fakeCrates.opens,1,'Exactly one weighted roll follows confirmation');
assert.equal(app.getSave().coins,coins-700,'Opening debits the disclosed cost');
assert.equal(app.getSave().crateHistory.length,1);
assert.equal(state.modal,false);assert.ok(!bodyClasses.has('purchase-modal-open'));
assert.ok(state.paints>before,'Successful reward rerenders inventory');
tap({action:'purchase-confirm'});
assert.equal(fakeCrates.opens,1,'No double charge after dialog is dismissed');
console.log('PASS: centered purchase popup preserves shop scroll, shows odds, traps confirmation, closes with Escape, restores focus, and only debits once');
