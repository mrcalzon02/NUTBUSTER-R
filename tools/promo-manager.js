#!/usr/bin/env node
/* Node-only offline owner console. Never store keys or codes in GitHub. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Issuer=require('./promo-issuer.js'),Promo=require('../web/promo-codes.js');
const ROOT=path.resolve(__dirname,'..');
const NAMES=Object.freeze({shop0:'Gigantic Nut Package',shop1:'Ridiculously Premium Gems',shop2:'Royal Squirrel Bundle',shop3:'Hundred Year Chest',shop4:'Lifetime VIP',shop5:'Nutty Booster Crate',hearts:'Emergency Heart Refill',moves:'Extra Five Moves',manor:'Exclusive Royal Manor Kit'});
const OFFERS=Object.keys(Promo.PACKAGE_GRANTS);
function args(argv){const out={command:argv[2]};for(let i=3;i<argv.length;i+=2){if(!argv[i]?.startsWith('--')||argv[i+1]===undefined)throw Error('Expected --option VALUE: '+argv[i]);const k=argv[i].slice(2);if(k in out)throw Error('Duplicate option '+k);out[k]=argv[i+1];}return out;}
function vaultPath(opts){if(!opts.vault)throw Error('Use --vault PRIVATE_DIRECTORY outside the checkout');return Issuer.outsideRepo(opts.vault);}
function config(vault){const privatePath=path.join(vault,'issuer-private.pem'),meta=path.join(vault,'issuer-public.jwk.json');if(!fs.existsSync(privatePath)||!fs.existsSync(meta))throw Error('Missing issuer key material in '+vault);const {kid,jwk}=JSON.parse(fs.readFileSync(meta,'utf8'));if(!kid||!jwk?.x||!jwk?.y)throw Error('Invalid issuer metadata');return {privatePath,kid,jwk};}
function withLock(vault,fn){const lock=path.join(vault,'.issue.lock');let handle;try{handle=fs.openSync(lock,'wx',0o600);}catch(e){if(e.code==='EEXIST')throw Error('Vault is locked; check for an active manager before removing '+lock);throw e;}try{fs.writeSync(handle,String(process.pid)+'\n');return fn();}finally{fs.closeSync(handle);fs.unlinkSync(lock);}}
function records(vault){const file=path.join(vault,'inventory.jsonl');return fs.existsSync(file)?fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x)):[];}
function offerCheck(id){if(!Object.prototype.hasOwnProperty.call(NAMES,id))throw Error('Unknown offer '+id+' (valid: '+OFFERS.join(', ')+')');return id;}
function csv(rows){return rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n')+'\n';}
function issueBatch(vault,entries,options){
 const batch=options.batch;
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,60}$/.test(batch||''))throw Error('Provide a unique --batch identifier');
 const {privatePath,kid}=config(vault);
 const output=Issuer.outsideRepo(options.output||path.join(vault,'exports',batch+'.csv'));
 if(fs.existsSync(output))throw Error('Code file already exists: '+output);
 const old=records(vault);if(old.some(x=>x.batch===batch))throw Error('Batch already issued');
 const start=Issuer.parseTime(options.starts,'starts'),expires=Issuer.parseTime(options.expires,'expires');
 if(expires&&expires<=start)throw Error('Expiry must follow activation time');
 const seen=new Set(old.map(x=>x.nonce)),newRows=[],issued=new Date().toISOString();
 for(const {offer,count} of entries){
  offerCheck(offer);
  if(!Number.isSafeInteger(count)||count<1||count>500)throw Error('Count must be between 1 and 500');
  const codes=Issuer.issueCodes({private:privatePath,kid,grant:JSON.stringify({package:offer}),count,nbf:start?new Date(start).toISOString():'0',exp:expires?new Date(expires).toISOString():'0'});
  for(const code of codes){const parsed=Promo.format(code);if(seen.has(parsed.payload.nonce))throw Error('Duplicate random nonce detected');seen.add(parsed.payload.nonce);newRows.push({batch,offer,name:NAMES[offer],code,nonce:parsed.payload.nonce,kid,sha256:crypto.createHash('sha256').update(code).digest('hex'),issued,nbf:start,exp:expires});}
 }
 if(!newRows.length)throw Error('Nothing to issue');
 fs.mkdirSync(path.dirname(output),{recursive:true,mode:0o700});
 const rows=[['batch','offer_id','offer_name','code','nonce','issued_at','expires_at'],...newRows.map(x=>[x.batch,x.offer,x.name,x.code,x.nonce,x.issued,x.exp?new Date(x.exp).toISOString():''])];
 fs.writeFileSync(output,csv(rows),{flag:'wx',mode:0o600});
 fs.appendFileSync(path.join(vault,'inventory.jsonl'),newRows.map(({code,name,...row})=>JSON.stringify(row)).join('\n')+'\n',{mode:0o600});
 return {batch,count:newRows.length,output};
}
function init(opts){
 const vault=vaultPath(opts);
 Issuer.keygen({out:vault,kid:opts.kid||'nutbuster-2026'});
 const result=withLock(vault,()=>issueBatch(vault,OFFERS.map(offer=>({offer,count:1})),{batch:'master-initial',output:path.join(vault,'master-codes.csv')}));
 console.log('Nine master vouchers created: '+result.output);
 console.log('Issuer private key stays outside GitHub. Run: node tools/promo-manager.js publish-key --vault "'+vault+'"');
 return result;
}
function issue(opts){
 const vault=vaultPath(opts),offer=offerCheck(opts.offer),count=opts.count===undefined?1:Number(opts.count);
 if(!Number.isSafeInteger(count)||count<1||count>500)throw Error('Count must be 1–500');
 const result=withLock(vault,()=>issueBatch(vault,[{offer,count}],{batch:opts.batch,output:opts.output,starts:opts.starts,expires:opts.expires}));
 console.log('Issued '+result.count+' signed codes to PRIVATE file: '+result.output);return result;
}
function list(opts){const vault=vaultPath(opts),id=config(vault),items=records(vault),counts={};for(const row of items)counts[row.offer]=(counts[row.offer]||0)+1;console.log('Issuer '+id.kid+' · '+items.length+' issued vouchers in '+new Set(items.map(x=>x.batch)).size+' batches');for(const id of OFFERS)console.log(id.padEnd(8),String(counts[id]||0).padStart(5),NAMES[id]);console.log('No global redemption status is available offline.');return {total:items.length,counts};}
function verify(opts){
 const vault=vaultPath(opts),id=config(vault);
 const code=opts.code||(opts.file?fs.readFileSync(opts.file,'utf8').trim():'');
 if(!code)throw Error('Supply --file CODE_FILE or --code VALUE');
 const parsed=Promo.format(code);
 if(!Promo.validate(parsed.payload)||parsed.payload.kid!==id.kid)throw Error('Invalid issuer or reward');
 const key=crypto.createPublicKey({key:id.jwk,format:'jwk'});
 if(!crypto.verify('sha256',Buffer.from(parsed.signed,'ascii'),{key,dsaEncoding:'ieee-p1363'},Buffer.from(parsed.sig)))throw Error('Invalid signature');
 console.log('VALID: '+(parsed.payload.grant.package||'custom')+' · '+parsed.payload.nonce);
 return {valid:true,offer:parsed.payload.grant.package||null};
}
function publishKey(opts){
 const id=config(vaultPath(opts)),file=path.join(ROOT,'web','promo-keys.js'),text=fs.readFileSync(file,'utf8');
 const match=/root\.NutPromoKeys\s*=\s*\{\s*keys:\s*(\{[^\n]*\})\s*\}/.exec(text);
 if(!match)throw Error('Unknown public key registry structure');
 const keys=JSON.parse(match[1]);
 if(Object.prototype.hasOwnProperty.call(keys,id.kid)){
  if(JSON.stringify(keys[id.kid])!==JSON.stringify(id.jwk))throw Error('Refusing to replace a different key for '+id.kid);
  console.log('Public key already installed');return {changed:false};
 }
 keys[id.kid]=id.jwk;
 const newText="/* PUBLIC promo verification keys only — never commit private keys or code lists. */\n"+
  "(function(root){'use strict';root.NutPromoKeys={keys:"+JSON.stringify(keys)+"};})(window);\n";
 fs.writeFileSync(file,newText,{mode:0o644});
 console.log('Published public key to '+file+'. Review and commit this public file.');
 return {changed:true,file};
}
function main(argv=process.argv){
 const o=args(argv);
 if(o.command==='init')return init(o);
 if(o.command==='issue')return issue(o);
 if(o.command==='list')return list(o);
 if(o.command==='verify')return verify(o);
 if(o.command==='publish-key')return publishKey(o);
 console.log('NUTBUSTER local promo manager — Node 20+, no npm dependencies');
 console.log(' init --vault PRIVATE_DIR --kid nutbuster-2026             Create key + nine master codes');
 console.log(' publish-key --vault PRIVATE_DIR                         Install PUBLIC key in game');
 console.log(' issue --vault PRIVATE_DIR --offer shop0 --count 10 --batch giveaway-01');
 console.log(' list --vault PRIVATE_DIR                                View issued inventory');
 console.log(' verify --vault PRIVATE_DIR --file PRIVATE_SINGLE_CODE_FILE');
 console.log(' Offers: '+OFFERS.join(', '));
 return null;
}
if(require.main===module)try{main();}catch(e){console.error('Promo manager:',e.message);process.exitCode=1;}
module.exports={NAMES,OFFERS,main,init,issue,list,verify,publishKey,issueBatch};
