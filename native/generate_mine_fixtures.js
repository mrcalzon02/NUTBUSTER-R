#!/usr/bin/env node
'use strict';
require('../web/nutvale-mining-gear.js');
const mines=require('../web/nutvale-mines.js');
const kind={barren:0,ordinary:1,rich:2,crystal:3};
const deposit=['coal','deepCoal','copper','silver','gold','sapphire','amethyst','emerald','ruby','blueCluster','violetCluster','fossil','geode','magma','prismatic','firestone','treasury'];
let count=0;
for(const seed of [4099,113,17,987654321]){
 for(let tier=0;tier<6;tier++){
  const size=mines.MAP[tier].size;
  const coords=[[0,0],[1,1],[size-1,size-1],[size-1,0],[0,size-1],[Math.floor(size/2),2]];
  for(const [x,y] of coords){
   const t=mines.tile(seed,x,y,tier);
   const id=t.kind==='barren'?-1:deposit.indexOf(t.deposit);
   if(id< -1||!(t.kind in kind))throw Error('Unmapped find '+t.deposit);
   console.log('T',seed,tier,x,y,kind[t.kind],t.ore,t.hardness,id);
   count++;
  }
 }
}
if(count<100)throw Error('Insufficient JS geology fixtures');
