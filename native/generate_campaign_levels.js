#!/usr/bin/env node
'use strict';
// Offline build-time export from the authoritative NUTBUSTER gameplay engine.
// No browser, embedded JS or Node is included in the native Windows/Linux ZIP.
const fs=require('node:fs'),path=require('node:path');
const E=require('../web/engine.js');
const kind={score:0,collect:1,ice:2,locks:3,chests:4,jam:5};
const lines=['NUTBUSTER_CAMPAIGN_V1 1000'];
for(let level=1;level<=1000;level++){
 const g=E.create(level,level*7919),cfg=g.cfg,goals=cfg.objectives;
 if(goals.length<1||goals.length>2)throw Error('Unexpected objective count at '+level);
 const token=o=>o?[kind[o.kind],o.target,o.kind==='collect'?o.color:-1]:[-1,0,-1];
 if(goals.some(o=>!(o.kind in kind)||o.target<1))throw Error('Unknown objective at '+level);
 const seed=g.cells.map(c=>c?[c.type,c.ice,c.lock,c.chest,c.jam,c.fuse].join(':'):'-1:0:0:0:0:0').join(',');
 const titleHex=Buffer.from(cfg.stageTitle,'utf8').toString('hex');
 const fields=[level,cfg.width,cfg.height,cfg.moves,cfg.goal,
                ...token(goals[0]),...token(goals[1]),cfg.roster.join(','),seed,titleHex];
 if(fields.some(v=>String(v).includes(' ')||String(v).includes('\n')))throw Error('Invalid export token '+level);
 lines.push('L '+fields.join(' '));
}
const dst=path.resolve(__dirname,'generated-assets/data/campaign.tsv');
fs.mkdirSync(path.dirname(dst),{recursive:true});
fs.writeFileSync(dst,lines.join('\n')+'\n');
console.log('Exported exact authored seed and objective data for 1000 main-campaign stages:',dst);
