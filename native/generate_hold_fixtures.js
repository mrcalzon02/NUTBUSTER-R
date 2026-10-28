#!/usr/bin/env node
'use strict';
// Independent expected results from the existing mobile JS engine. The native
// CI executable compares every serialized state, not a reimplemented JS rule.
const E=require('../web/engine.js');
const w=4,h=5;
function cell(type,extra={}) {
 return {type,ice:0,lock:0,chest:0,jam:0,fuse:0,hold:0,
         special:null,elemental:null,rock:0,frozen:0,...extra};
}
function base(){
 return Array.from({length:w*h},(_,i)=>cell((Math.floor(i/w)+i%w)%4));
}
const cases=[
 ['butter-one-drop','butter_hold',5,false,-1,c=>{c[17].type=null;}],
 ['jam-two-drops','jam_hold',5,false,17,c=>{c[17].type=null;}],
 ['jam-upgrades-butter','jam_hold',5,false,17,c=>{c[5].hold=1;c[17].type=null;}],
 ['butter-already-held','butter_hold',5,false,-1,c=>{c[5].hold=1;}],
 ['jam-already-held','jam_hold',5,false,-1,c=>{c[5].hold=2;}],
 ['invalid-ice-anchor','butter_hold',5,false,-1,c=>{c[5].ice=1;c[17].type=null;}],
 ['invalid-void','jam_hold',5,false,-1,c=>{c[5]=null;c[17].type=null;}],
 ['invalid-outside','jam_hold',99,false,-1,c=>{c[17].type=null;}],
 ['invalid-unknown','unknown',5,false,-1,c=>{c[17].type=null;}],
 ['finished-game','butter_hold',5,true,-1,c=>{c[17].type=null;}],
 ['void-split-island','butter_hold',5,false,-1,c=>{c[9]=null;c[13]=null;c[17].type=null;}],
 ['two-anchors-and-third','butter_hold',5,false,-1,c=>{c[0].hold=1;c[10].hold=2;c[17].type=null;}],
 ['no-vacancy-no-consumption','jam_hold',5,false,-1,()=>{}],
 ['scoring-three-in-a-row','jam_hold',1,false,-1,c=>{
   c[0].type=2;c[1].type=2;c[2].type=2;c[0].hold=1;
 }],
 ['jam-surface-stays-on-cell','jam_hold',5,false,17,c=>{
   c[5].jam=1;c[17].type=null;
 }]
];
function encode(cells){
 return cells.map(c=>c?
  [c.type===null?-2:c.type,c.ice,c.lock,c.chest,c.jam,c.fuse,c.hold].join(':'):'X').join(',');
}
console.log('# NUTBUSTER JS engine hold/gravity parity v1');
for(const [name,kind,target,finished,clearSecond,prepare] of cases){
 const cells=base();prepare(cells);
 const g={cfg:{width:w,height:h,roster:[0,1,2,3],typeCount:4,objectives:[]},
   cells,rand:()=>0.01,won:finished,lost:false,boosterUsed:0,uses:{}};
 const initial=encode(g.cells);
 const result=E.applyHold(g,kind,target);
 const hits=[...E.matches(g).hit].sort((a,b)=>a-b);
 const bonus=hits.filter(i=>g.cells[i]?.hold>0).length*120;
 E.gravity(g);
 const afterFirst=encode(g.cells);
 if(clearSecond>=0){
  if(!g.cells[clearSecond])throw Error('Second vacancy is void: '+name);
  g.cells[clearSecond].type=null;g.cells[clearSecond].hold=0;
  E.gravity(g);
 }
 const afterSecond=encode(g.cells);
 const fields=['CASE',name,w,h,kind,target,finished?1:0,clearSecond,
   initial,result.valid?1:0,g.boosterUsed,afterFirst,afterSecond,
   hits.join(','),bonus];
 console.log(fields.join('|'));
}
