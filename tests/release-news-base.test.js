'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chooseBase,validTag}=require('../tools/release-news-base.js');
const ROOT=path.resolve(__dirname,'..');
const old='a'.repeat(40),current='b'.repeat(40),after='c'.repeat(40),other='d'.repeat(40);
const releases=[
 {tagName:'nutbuster-phone-test-10-1',isDraft:false,publishedAt:'2026-10-01T00:00:00Z'},
 {tagName:'nutbuster-phone-test-11-1',isDraft:false,publishedAt:'2026-10-02T00:00:00Z'},
 {tagName:'nutbuster-phone-test-12-1',isDraft:false,publishedAt:'2026-10-03T00:00:00Z'},
 {tagName:'nutbuster-phone-test-13-1',isDraft:false,publishedAt:'2026-10-04T00:00:00Z'},
 {tagName:'nutbuster-phone-test-14-1',isDraft:true,publishedAt:'2026-10-05T00:00:00Z'},
 {tagName:'unrelated-release',isDraft:false,publishedAt:'2026-10-06T00:00:00Z'}
];
const shas={'nutbuster-phone-test-10-1':old,'nutbuster-phone-test-11-1':current,
 'nutbuster-phone-test-12-1':other,'nutbuster-phone-test-13-1':after};
const ancestors=new Set(['nutbuster-phone-test-10-1','nutbuster-phone-test-11-1']);
let fetches=[];
const git={resolveTag(tag){fetches.push(tag);return shas[tag];},
 isAncestor(tag){return ancestors.has(tag);}};
const chosen=chooseBase(releases,current,git);
assert.equal(chosen,'nutbuster-phone-test-10-1',
 'Skip current SHA self-tag AND newer unrelated release');
assert.deepEqual(fetches,['nutbuster-phone-test-13-1','nutbuster-phone-test-12-1',
 'nutbuster-phone-test-11-1','nutbuster-phone-test-10-1']);
assert.equal(chooseBase(releases,after,git),'nutbuster-phone-test-11-1',
 'A tag on an unrelated later commit must not become comparison baseline');
assert.equal(chooseBase([releases[1]],current,git),null,'Only self-tag is no valid prior baseline');
assert.equal(chooseBase([],current,git),null,'Initial publish needs no release baseline');
assert.equal(chooseBase([releases[0]],current,git),'nutbuster-phone-test-10-1');
assert.equal(validTag('nutbuster-phone-test-98-1'),true);
assert.equal(validTag('../bad-tag'),false);
assert.throws(()=>chooseBase([], 'oops', git),/Invalid checked-out revision/);
assert.throws(()=>chooseBase(null,current,{}),/Expected release list/);
const wf=fs.readFileSync(path.join(ROOT,'.github/workflows/build-and-release.yml'),'utf8');
const d=wf.slice(wf.indexOf('  diagnostics:'),wf.indexOf('  android-debug:'));
assert.match(d,/fetch-depth: 0/, 'Audit must have complete Git ancestry');
assert.match(d,/node tools\/release-news-base\.js/);
assert.match(d,/NUTBUSTER_RELEASE_BASE="\$BASE_TAG" node tools\/release-news\.js --check/);
assert.doesNotMatch(d,/LAST_TAG=/,'Do not compare against a newly published self-tag');
const news=fs.readFileSync(path.join(ROOT,'tools/release-news.js'),'utf8');
assert.match(news,/changed\.has\('release\/changelog\.json'\)/);
assert.match(news,/player-facing change is missing from release notes/);
console.log('PASS immutable published-ancestor selection: skips self, newer and unrelated tags, retains strict source coverage');
