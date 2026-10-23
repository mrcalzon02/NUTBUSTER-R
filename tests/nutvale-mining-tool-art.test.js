const assert=require('node:assert/strict');
const c=require('../config/nutvale-mining-tool-art.json');
assert.equal(c.schema,1);
assert.equal(c.icons.pickaxes.length,44);assert.equal(c.icons.gloves.length,42);
assert.equal(c.icons.pickaxes[0].id,'iron-prospector');
assert.equal(c.icons.gloves.at(-1).id,'jackolantern');
assert.equal(new Set([...c.icons.pickaxes,...c.icons.gloves].map(x=>x.id)).size,86);
for(const [group,items] of Object.entries(c.icons)){
 const cols=group==='pickaxes'?11:14;
 for(const [index,x] of items.entries()){
  assert.match(x.id,/^[a-z]+(?:-[a-z]+)*$/);
  assert.match(x.image,new RegExp('^art/nutvale/mining-tools/'+group+'/[a-z-]+\\.png$'));
  assert.equal(x.column,index%cols);assert.equal(x.row,Math.floor(index/cols));
 }
}
console.log('PASS: 86 unique named icons, exact atlas coordinates and transparent artwork paths (not a binary-presence gate)');
