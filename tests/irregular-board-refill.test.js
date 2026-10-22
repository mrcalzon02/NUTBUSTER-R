// Reported Android symptom: a visible board tile in a hole-shaped map
// stays blank. Verify data filling independent of UI animation and disconnected segments.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../web/engine.js');
const rng=E.rng(0x14a9dd38);
let moves=0,stages=0,brokenSegments=0,voidBoards=0;
function complete(g,where){
 const mask=g.cfg.mask;
 assert.equal(g.cells.length,mask.length);
 for(let i=0;i<mask.length;i++){
  assert.equal(!!g.cells[i],!!mask[i],where+' topology at '+i);
  if(mask[i])assert.ok(Number.isInteger(g.cells[i].type)&&g.cfg.roster.includes(g.cells[i].type),
   where+': playable tile '+i+' is empty / invalid');
 }
}
function segment(g,index){
 const w=g.cfg.width,x=index%w;
 let y=Math.floor(index/w);
 while(y>0&&g.cfg.mask[(y-1)*w+x])y--;
 return x+':'+y;
}
for(let level=1;level<=500;level++){
 for(let seed=1;seed<=3;seed++){
  const g=E.create(level,seed*1787+level*31);
  if(g.cfg.mask.includes(false))voidBoards++;
  complete(g,'initial '+level);
  // Force missing payloads in interrupted columns and isolated vertical islands.
  // They must refill independently, not from another segment across a hole.
  const missing=[];
  for(let i=0;i<g.cells.length;i++)if(g.cells[i]&&rng()<.27){
   g.cells[i].type=null;g.cells[i].special=null;missing.push(i);
  }
  if(missing.length){
   const previous=g.cells.map(c=>c?.type??null),falls=[];
   E.gravity(g,falls);
   complete(g,'artificial holes '+level);
   for(const f of falls){
    assert.ok(g.cfg.mask[f.to],'gravity must land on a real tile');
    if(f.from>=0){
     assert.equal(f.from%g.cfg.width,f.to%g.cfg.width,'gravity stays in column');
     assert.equal(segment(g,f.from),segment(g,f.to),'gravity must not cross void mask');
     assert.equal(previous[f.from],f.type,'gravity moved original nut identity');
    }
   }
   brokenSegments++;
  }
  g.cfg.objectives=[{kind:'score',target:1e15}];
  for(let turn=0;turn<12;turn++){
   let pair=null;
   for(let a=0;a<g.cells.length&&!pair;a++)for(const b of [a+1,a+g.cfg.width]){
    if(E.adjacent(g,a,b)){pair=[a,b];break;}
   }
   if(!pair)break;
   const result=E.swap(g,...pair);
   assert.ok(result.valid);
   complete(g,'after turn '+turn+' level '+level);
   for(const stage of result.stages){
    stages++;
    if(stage.cells)for(let i=0;i<g.cfg.mask.length;i++)
     if(g.cfg.mask[i])assert.ok(stage.cells[i]&&Number.isInteger(stage.cells[i].type),
      'transient stage '+stage.kind+' left a playable tile blank: '+level+'/'+i);
   }
   moves++;
   if(g.lost||g.won)break;
  }
 }
}
const game=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'../web/style.css'),'utf8');
assert.match(game,/function reconcileBoardNuts\(\)/,'settled board must reconcile sprites after animated stages');
assert.match(game,/finally\{if\(epoch===state\.epoch\)\{reconcileBoardNuts\(\)/,'always restore sprites after resolution');
assert.match(style,/\.nut-visual \.piece\{opacity:1;/,'sprite may not rely on Android firing onload');
console.log('PASS: '+moves+' seeded moves, '+stages+' complete resolution stages, '+voidBoards+' irregular boards and '+brokenSegments+' forced refill scenarios; no blank playable tiles');
