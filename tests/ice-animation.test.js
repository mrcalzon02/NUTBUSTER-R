const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const E=require('../web/engine.js'),Ice=require('../web/ice-effects.js');
const index=fs.readFileSync(path.join(root,'web/index.html'),'utf8');
const game=fs.readFileSync(path.join(root,'web/game.js'),'utf8');
const css=fs.readFileSync(path.join(root,'web/style.css'),'utf8');
const fx=fs.readFileSync(path.join(root,'web/fx.js'),'utf8');
assert.match(index,/src="ice-effects\.js".*?<script src="invite\.js"/);
assert.match(game,/NutIceFX\?\.animate\(stage,board/,'run ice animation for each engine cascade');
assert.match(game,/stage\.before\?\.\[i\]\?\.type!=null&&stage\.afterClear\?\.\[i\]\?\.type===null/,'only truly removed nuts fade');
assert.doesNotMatch(game,/\?['"]ice-shatter['"]:result\.cracked/,'no premature global ice break');
for(const name of ['nut-ice-jolt','nut-ice-crack','nut-ice-break'])assert.match(css,new RegExp('@keyframes '+name));
assert.match(fx,/kind==='ice-shatter'/);
for(const file of ['web/art/primary/blockers/ice-1.png','web/art/primary/blockers/ice-2.png','web/art/additions/effects/ice-shatter.png'])
 assert.ok(fs.statSync(path.join(root,file)).size>2000,file+' missing');
const c=ice=>({type:2,ice,lock:0,chest:0});
assert.deepEqual(Ice.plan({before:[c(2),c(1),c(2)],afterClear:[c(1),c(0),c(0)]}),[
 {index:0,step:0,from:2,to:1,breaks:false},
 {index:1,step:0,from:1,to:0,breaks:true},
 {index:2,step:0,from:2,to:1,breaks:false},
 {index:2,step:1,from:1,to:0,breaks:true}
]);
assert.deepEqual(Ice.plan({kind:'repair',cells:[c(1)]}),[]);
const first=E.create(40,8521),i=first.cells.findIndex(x=>x?.ice===2);
assert.ok(i>=0,'level 40 has heavy ice');
const row=E.booster(first,'row',i);assert.equal(row.valid,true);
const crack=Ice.plan(row.stages[0]).filter(e=>e.index===i);
assert.equal(crack.length,1);assert.equal(crack[0].from,2);assert.equal(crack[0].to,1);
const second=E.create(40,8521),j=second.cells.findIndex(x=>x?.ice===2);
const hammer=E.booster(second,'hammer',j);assert.equal(hammer.valid,true);
assert.deepEqual(Ice.plan(hammer.stages[0]).filter(e=>e.index===j).map(e=>[e.from,e.to,e.breaks]),[[2,1,false],[1,0,true]]);
function tile(initial){
 const history=[],classes=new Set, image={src:'art/primary/overlays/frost.png'};
 const overlay={dataset:{strength:String(initial)},offsetWidth:42,querySelector:s=>s==='.blocker-sprite'?image:null,
 classList:{add(...names){for(const n of names){classes.add(n);history.push('add:'+n)}},remove(...names){for(const n of names){classes.delete(n);history.push('remove:'+n)}}},
 remove(){history.push('removed');overlay.removed=true}};
 return {image,overlay,history,querySelector:s=>s==='.overlay.blocker-art.ice'&&!overlay.removed?overlay:null,getBoundingClientRect:()=>({left:0,top:0,width:40,height:40})};
}
(async()=>{
 const emitted=[],t=[tile(2),tile(1),tile(2)];
 global.NutFX={emit:(kind,at)=>{emitted.push({kind,at});return true}};
 const board={querySelector:s=>t[Number(s.match(/\d+/)[0])]};
 await Ice.animate({before:[c(2),c(1),c(2)],afterClear:[c(1),c(0),c(0)]},board);
 assert.equal(t[0].overlay.dataset.strength,'1');
 assert.equal(t[0].overlay.removed,undefined);
 assert.equal(t[1].overlay.removed,true);
 assert.equal(t[2].overlay.removed,true);
 assert.deepEqual(emitted.map(x=>x.at),[t[1],t[2]],'shatter only on full break');
 assert.equal(t[2].history.filter(x=>x==='add:ice-hit').length,2,'Hammer must shake twice');
 assert.ok(t[2].history.indexOf('add:ice-damaged')<t[2].history.indexOf('add:ice-break'));
 const quiet=tile(1),previous=emitted.length;
 await Ice.animate({before:[c(1)],afterClear:[c(0)]},{querySelector:()=>quiet},{reducedMotion:true});
 assert.equal(quiet.overlay.removed,true);assert.equal(quiet.history.includes('add:ice-hit'),false);assert.equal(emitted.length,previous);
 const aborted=tile(2);
 await Ice.animate({before:[c(2)],afterClear:[c(1)]},{querySelector:()=>aborted},{active:()=>false});
 console.log('PASS: engine ice damage, staged removal, cancellation and reduced-motion behavior');
})().catch(e=>{console.error(e);process.exitCode=1});
