const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const images=[],timers=[];
const document={body:{appendChild(x){images.push(x);}},createElement(){return {style:{},setAttribute(){},remove(){this.removed=true;}}}};
const window={document,innerWidth:360,innerHeight:720,setTimeout(fn){timers.push(fn);}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/fx.js'),'utf8'),{window});
const FX=window.NutFX;
const rect={getBoundingClientRect(){return {left:20,top:40,width:50,height:50};}};
assert.equal(FX.emit('burst'),true);assert.ok(images.at(-1).src.endsWith('match-burst.png'));
assert.equal(FX.emit('invalid-effect'),false);
assert.equal(FX.emit('chest-open',{getBoundingClientRect(){return {left:20,top:40,width:200,height:200};}}),true);
assert.equal(images.at(-1).style.left,'120px');assert.equal(images.at(-1).style.top,'140px');
const expected={
 hammer:['shell-crack','sparkle-burst'],row:['horizontal-clear'],column:['vertical-clear'],
 cross:['horizontal-clear','vertical-clear'],blast:['supernova'],color:['rainbow'],
 shuffle:['shell-ring','rainbow'],extra:['time-boost'],drill:['rocket-impact'],
 unlock:['chain-break'],butter_hold:['golden-acorn-glow'],jam_hold:['royal-boost']
};
for(const [id,kinds] of Object.entries(expected)){
 const before=images.length;assert.equal(FX.booster(id,rect),true,id);
 assert.equal(images.length-before,kinds.length,id+' must emit its own authored art');
 for(const img of images.slice(before))assert.ok(img.className.includes('booster'),id+' booster class');
}
assert.equal(FX.booster('not-a-booster',rect),false);
const original=[{type:0,ice:0,lock:0,chest:0,jam:0,fuse:0,special:null},
 {type:1,ice:1,lock:0,chest:0,jam:0,fuse:0,special:null},
 {type:2,ice:0,lock:1,chest:0,jam:0,fuse:0,special:null},
 {type:3,ice:0,lock:0,chest:2,jam:0,fuse:0,special:null},
 {type:4,ice:0,lock:0,chest:0,jam:0,fuse:0,special:'line-h'}];
const cleared=original.map(x=>({...x}));
cleared[0].type=null;cleared[1].ice=0;cleared[2].lock=0;cleared[3].chest=1;cleared[4].type=null;
const stage={kind:'cascade',before:original,afterClear:cleared,clear:[0,1,2,3,4]};
const plan=FX.planCascade(stage,2);
assert.deepEqual(Array.from(plan.removed,x=>x.index),[0,4],'Only actually removed nuts may shake and pop');
assert.deepEqual(Array.from(plan.blockers,x=>x.kind),['chain-break','shell-crack']);
assert.deepEqual(Array.from(plan.specials,x=>x.kind),['horizontal-clear']);
const board={querySelector(s){const i=Number(s.match(/\d+/)[0]);return {getBoundingClientRect(){return {left:i*50,top:40,width:45,height:45};}};}};
const count=FX.burstCascade(stage,board,2);
assert.equal(count,5,'Every removed nut plus non-ice blocker and activated special gets an individual FX');
const fresh=images.slice(-count);assert.ok(fresh.every(x=>x.className.includes('tile')));
assert.ok(fresh.every(x=>x.style.width==='78.75px'));
for(const tick of timers)tick();assert.ok(images.every(x=>x.removed),'FX nodes must be removed after timeout');
const game=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
assert.ok(game.includes('window.NutFX?.planCascade(stage,wave)'),'Cascade must use per-cell removal plan');
assert.ok(game.includes('window.NutFX?.burstCascade?.(stage,board,wave)'),'Cascade must emit each tile burst');
assert.ok(game.includes('window.NutFX?.booster?.(id,target)'),'Booster must trigger even without a cascade');
assert.ok(game.includes('window.NutFX?.booster?.(id,screen.querySelector('),'Hold products must emit effects');
const css=fs.readFileSync(path.join(__dirname,'../web/style.css'),'utf8');
assert.ok(css.includes('.cell.nut-shaking .nut-visual')&&css.includes('.cell.nut-exploding .nut-visual'));
const index=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');assert.ok(index.includes('src="fx.js"'));
for(const file of Object.values(FX.assets))assert.ok(fs.existsSync(path.join(__dirname,'../web',file)),file);
assert.equal(Object.keys(FX.assets).length,18,'All 18 sliced source effects must be registered');
console.log('PASS: all 10 booster and both gravity-hold VFX; each removed nut shakes/explodes; shielded survivors unaffected; assets valid');
