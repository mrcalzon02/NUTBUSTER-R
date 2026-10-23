#!/usr/bin/env node
'use strict';
// One authoritative human-written changelog for in-game news and GitHub release notes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const CHANGELOG=path.join(ROOT,'release/changelog.json');
function fail(message){throw new Error('Release changelog: '+message);}
function validate(doc,exists=fs.existsSync){
  if(!doc||doc.schema!==1||typeof doc.headline!=='string'||doc.headline.trim().length<12||doc.headline.length>120)fail('schema or headline invalid');
  if(!Array.isArray(doc.changes)||doc.changes.length<1||doc.changes.length>12)fail('provide 1–12 real change entries');
  const referenced=new Set(),titles=new Set();
  for(const [i,entry] of doc.changes.entries()){
    if(!entry||typeof entry.title!=='string'||entry.title.trim().length<8||entry.title.length>100||typeof entry.detail!=='string'||entry.detail.trim().length<25||entry.detail.length>300)fail('entry '+(i+1)+' needs a specific title and meaningful detail');
    if(/(?:TODO|TBD|placeholder|lorem ipsum|coming updates|various fixes|misc fixes)/i.test(entry.title+' '+entry.detail))fail('entry '+(i+1)+' contains placeholder/unspecific claims');
    if(titles.has(entry.title.toLowerCase()))fail('duplicate change title');
    titles.add(entry.title.toLowerCase());
    if(!Array.isArray(entry.files)||entry.files.length<1||entry.files.length>30)fail('entry '+(i+1)+' needs source paths');
    for(const file of entry.files){
      if(typeof file!=='string'||file.startsWith('/')||file.includes('\\')||file.split('/').includes('..')||!file.trim())fail('unsafe change source path '+String(file));
      if(!exists(path.join(ROOT,file)))fail('claimed change source does not exist: '+file);
      referenced.add(file);
    }
  }
  return referenced;
}
function changedFiles(base){
  return cp.execFileSync('git',['diff','--name-only','--diff-filter=ACMRT',base,'HEAD','--'],{cwd:ROOT,encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
}
function check(base){
  const doc=JSON.parse(fs.readFileSync(CHANGELOG,'utf8'));
  const covered=validate(doc);
  if(base){
    const changed=new Set(changedFiles(base));
    if(!changed.has('release/changelog.json'))fail('must be rewritten for every published release: reused changelog');
    for(const [i,entry] of doc.changes.entries()){
      if(!entry.files.some(file=>changed.has(file)))fail('entry '+(i+1)+' is not backed by a file changed since '+base);
    }
    for(const file of changed){
      if(file.startsWith('web/') && file!=='web/release-news.js' &&
        (/\.(?:js|css|html|json|png|webp|svg)$/.test(file))&&!covered.has(file))
        fail('player-facing change is missing from release notes: '+file);
    }
  }
  return doc;
}
function buildNews(doc,tag,revision,buildDate){
  validate(doc);
  if(!/^nutbuster-phone-test-\d+-\d+$/.test(tag))fail('invalid publication tag');
  if(!/^[a-f0-9]{40}$/.test(revision))fail('invalid source revision');
  return {schema:1,tag,revision,publishedBuildDate:buildDate,headline:doc.headline,
    changes:doc.changes.map(({title,detail})=>({title,detail}))};
}
function generate(tag,revision,buildDate=new Date().toISOString().slice(0,10)){
  const news=buildNews(check(),tag,revision,buildDate);
  const js="(function(root){'use strict';root.NutbusterReleaseNews="+JSON.stringify(news)+";})(window);\n";
  fs.writeFileSync(path.join(ROOT,'web/release-news.js'),js);
  const publish=path.join(ROOT,'release/publish');
  fs.mkdirSync(publish,{recursive:true});
  fs.writeFileSync(path.join(publish,'NUTBUSTER-news.json'),JSON.stringify(news,null,2)+'\n');
  return news;
}
function releaseNotes(news,version,publisher){
  if(!/^\d{1,10}$/.test(version))fail('invalid Android versionCode');
  if(!/^[a-f0-9]{64}$/.test(publisher))fail('invalid signer fingerprint');
  return ['# '+news.headline,'',...news.changes.flatMap(c=>['- **'+c.title+'** — '+c.detail]),'',
    'NUTBUSTER testing release.','',
    'Android versionCode: '+version,'Source revision: '+news.revision,
    'NUTBUSTER publisher signer SHA-256: '+publisher,'',
    'Only the permanent NUTBUSTER publisher signing key is accepted. Android updates require an installed APK signed with this same key.',''].join('\n');
}
if(require.main===module){
  try{
    const [, ,mode,...args]=process.argv;
    if(mode==='--check'){check(process.env.NUTBUSTER_RELEASE_BASE||null);console.log('PASS: changelog valid and release change coverage verified');}
    else if(mode==='--generate'){generate(args[0],args[1]);console.log('Generated packaged release news from validated changelog');}
    else if(mode==='--notes'){const news=JSON.parse(fs.readFileSync(path.join(ROOT,'release/publish/NUTBUSTER-news.json'),'utf8'));process.stdout.write(releaseNotes(news,args[0],args[1]));}
    else fail('usage: --check | --generate TAG SOURCE_SHA | --notes VERSION_CODE SIGNER_SHA256');
  }catch(err){console.error(err.message);process.exitCode=1;}
}
module.exports={validate,check,changedFiles,buildNews,generate,releaseNotes};
