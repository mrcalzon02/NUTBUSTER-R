#!/usr/bin/env node
/* Offline promotional-code issuer. Run privately on the owner's machine only.
 * NEVER commit the generated private PEM, keep it out of the repository. */
'use strict';
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const Promo=require('../web/promo-codes.js');
const PREFIX='NBR1';
function args(argv){
 const out={command:argv[2]};
 for(let i=3;i<argv.length;i+=2){
  if(!argv[i]?.startsWith('--')||!argv[i+1])throw Error('Expected --option value: '+argv[i]);
  out[argv[i].slice(2)]=argv[i+1];
 }
 return out;
}
const repoRoot=path.resolve(__dirname,'..');
function outsideRepo(p){
 const resolved=path.resolve(p);
 if(resolved===repoRoot||resolved.startsWith(repoRoot+path.sep))
  throw Error('Issuer secrets must stay OUTSIDE the game repository: '+resolved);
 return resolved;
}
function encode(value){return Buffer.from(value).toString('base64url');}
function keygen(opts){
 if(!opts.out)throw Error('keygen requires --out /secure/path');
 const directory=outsideRepo(opts.out);
 const kid=opts.kid||'main-2026';
 if(!/^[a-zA-Z0-9-]{1,32}$/.test(kid))throw Error('Invalid key ID');
 if(fs.existsSync(directory))throw Error('Output directory must not already exist');
 fs.mkdirSync(directory,{recursive:true,mode:0o700});
 const keys=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const jwk=keys.publicKey.export({format:'jwk'});
 const publicKey={kty:'EC',crv:'P-256',x:jwk.x,y:jwk.y,ext:true,key_ops:['verify']};
 const privatePath=path.join(directory,'issuer-private.pem');
 fs.writeFileSync(privatePath,keys.privateKey.export({type:'pkcs8',format:'pem'}),{mode:0o600,flag:'wx'});
 fs.writeFileSync(path.join(directory,'issuer-public.jwk.json'),JSON.stringify({kid,jwk:publicKey},null,2)+'\n',{mode:0o600,flag:'wx'});
 const config="/* Publish ONLY this public key; issuer-private.pem stays outside the repository. */\n"+
  "(function(root){root.NutPromoKeys={keys:"+JSON.stringify({[kid]:publicKey})+"};})(window);\n";
 fs.writeFileSync(path.join(directory,'promo-keys.js'),config,{mode:0o600,flag:'wx'});
 console.log('Private issuer created outside repo:',privatePath);
 console.log('Copy ONLY this public config to web/promo-keys.js:',path.join(directory,'promo-keys.js'));
 console.log('Key ID:',kid,'Public key SHA-256:',crypto.createHash('sha256').update(JSON.stringify(publicKey)).digest('hex'));
}
function parseTime(s,label){
 if(!s||s==='0')return 0;
 const time=Date.parse(s);
 if(!Number.isFinite(time)||time<0||time>4102444800000)throw Error('Invalid '+label+' timestamp');
 return time;
}
function issueCodes(opts){
 if(!opts.private||!opts.kid||!opts.grant)throw Error('issue requires --private, --kid and --grant');
 const pemPath=outsideRepo(opts.private);
 const key=crypto.createPrivateKey(fs.readFileSync(pemPath));
 if(key.asymmetricKeyType!=='ec'||key.asymmetricKeyDetails?.namedCurve!=='prime256v1')throw Error('Expected P-256 issuer key');
 if(!/^[a-zA-Z0-9-]{1,32}$/.test(opts.kid))throw Error('Invalid kid');
 const manifest=path.join(path.dirname(pemPath),'issuer-public.jwk.json');
 if(!fs.existsSync(manifest))throw Error('Missing adjacent issuer-public.jwk.json; cannot verify issuer identity');
 const metadata=JSON.parse(fs.readFileSync(manifest,'utf8'));
 const derived=crypto.createPublicKey(key).export({format:'jwk'});
 if(metadata.kid!==opts.kid||metadata.jwk?.x!==derived.x||metadata.jwk?.y!==derived.y)
  throw Error('Signing key / public registry / key ID mismatch');
 const grant=JSON.parse(opts.grant);
 const nbf=parseTime(opts.nbf,'nbf'),exp=parseTime(opts.exp,'exp');
 const count=Number(opts.count||1);
 if(!Number.isSafeInteger(count)||count<1||count>1000)throw Error('Count must be 1–1000');
 const codes=[];
 for(let i=0;i<count;i++){
  const payload={v:1,kid:opts.kid,nonce:crypto.randomBytes(16).toString('hex'),nbf,exp,grant};
  if(!Promo.validate(payload))throw Error('Invalid reward; check IDs, quantities and expiry');
  const signed=PREFIX+'.'+encode(JSON.stringify(payload));
  const sig=crypto.sign('sha256',Buffer.from(signed,'ascii'),{key,dsaEncoding:'ieee-p1363'});
  if(sig.length!==64)throw Error('Issuer signature length mismatch');
  codes.push(signed+'.'+encode(sig));
 }
 return codes;
}
function issue(opts){
 const codes=issueCodes(opts);
 const output=codes.join('\n')+'\n';
 if(opts.output){
  const file=path.resolve(opts.output);
  fs.writeFileSync(file,output,{flag:'wx',mode:0o600});
  console.log('Wrote',codes.length,'codes to',file);
 }else process.stdout.write(output);
}
function main(){
 const a=args(process.argv);
 if(a.command==='keygen')return keygen(a);
 if(a.command==='issue')return issue(a);
 console.error('Usage:\n node tools/promo-issuer.js keygen --out /secure/issuer-folder --kid main-2026\n node tools/promo-issuer.js issue --private /secure/issuer-folder/issuer-private.pem --kid main-2026 --grant \'{"nuts":750,"boosters":{"hammer":1}}\' --count 10 --exp 2027-01-01T00:00:00Z --output /secure/codes.txt');
 process.exitCode=1;
}
if(require.main===module){try{main();}catch(e){console.error('Issuer error:',e.message);process.exitCode=1;}}
module.exports={keygen,issue,issueCodes,parseTime,outsideRepo};
