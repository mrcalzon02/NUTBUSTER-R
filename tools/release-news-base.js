#!/usr/bin/env node
'use strict';
// Pick a published release STRICTLY BEFORE the checked-out revision.
// The publisher can publish a tag for HEAD while diagnostics are still
// running: comparing HEAD against that self-tag reports a false "reused"
// changelog. We must also reject tags from unrelated/newer commits.
const cp=require('node:child_process');
function validTag(tag){return /^nutbuster-phone-test-\d+-\d+$/.test(tag);}
function chooseBase(releases,head,git){
 if(!/^[a-f0-9]{40}$/.test(head))throw Error('Invalid checked-out revision');
 if(!Array.isArray(releases))throw Error('Expected release list');
 const eligible=releases.filter(x=>x&&x.isDraft===false&&validTag(x.tagName)&&
  typeof x.publishedAt==='string'&&!Number.isNaN(Date.parse(x.publishedAt)));
 eligible.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||b.tagName.localeCompare(a.tagName));
 const seen=new Set();
 for(const release of eligible){
  const tag=release.tagName;
  if(seen.has(tag))continue;
  seen.add(tag);
  const sha=git.resolveTag(tag);
  if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Invalid release tag object '+tag);
  if(sha===head)continue; // Current build's tag must never be its own comparison base.
  if(git.isAncestor(tag,head))return tag;
 }
 return null;
}
function git(...args){return cp.execFileSync('git',args,{encoding:'utf8'}).trim();}
function fromRepository(releases){
 const head=git('rev-parse','HEAD');
 return chooseBase(releases,head,{
  resolveTag(tag){
   // Immutable-tag fetch: a rewritten remote release tag is an error, not
   // a reason to silently choose a different source revision.
   git('fetch','--no-tags','origin','refs/tags/'+tag+':refs/tags/'+tag);
   return git('rev-parse',tag+'^{commit}');
  },
  isAncestor(tag,sha){
   const r=cp.spawnSync('git',['merge-base','--is-ancestor',tag,sha],{encoding:'utf8'});
   if(r.error)throw r.error;
   if(r.status===0)return true;
   if(r.status===1)return false;
   throw Error('Cannot establish published release ancestry: '+tag+': '+(r.stderr||r.status));
  }
 });
}
if(require.main===module){
 try{
  const releases=JSON.parse(require('node:fs').readFileSync(0,'utf8'));
  const tag=fromRepository(releases);
  if(tag)process.stdout.write(tag+'\n');
  else process.stderr.write('No prior published ancestor release available; initial-release validation only\n');
 }catch(e){console.error('Published release base selection failed: '+e.message);process.exitCode=1;}
}
module.exports={chooseBase,validTag,fromRepository};
