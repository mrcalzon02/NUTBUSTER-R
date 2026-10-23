/* Deterministic ZIP bridge for importing owner-produced art through authorized connectors.
   Plain ECMAScript; GitHub upload orchestration controls credentials separately.
   This helper never makes HTTP requests, writes data, or changes repository files. */
const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const rev=Object.create(null);for(let i=0;i<chars.length;i++)rev[chars[i]]=i;
function fromBase64(s){
 if(s.length%4)throw Error("Invalid base64 length");
 const n=s.length/4*3-(s.endsWith("==")?2:s.endsWith("=")?1:0),b=new Uint8Array(n);
 let p=0;for(let i=0;i<s.length;i+=4){const v=(rev[s[i]]<<18)|(rev[s[i+1]]<<12)|((rev[s[i+2]]||0)<<6)|(rev[s[i+3]]||0);b[p++]=(v>>>16)&255;if(p<n)b[p++]=(v>>>8)&255;if(p<n)b[p++]=v&255;}return b;
}
function toBase64(b){
 let out="",buf="";for(let i=0;i<b.length;i+=3){const a=b[i],x=i+1<b.length?b[i+1]:0,y=i+2<b.length?b[i+2]:0;
 buf+=chars[a>>>2]+chars[((a&3)<<4)|(x>>>4)]+(i+1<b.length?chars[((x&15)<<2)|(y>>>6)]:"=")+(i+2<b.length?chars[y&63]:"=");
 if(buf.length>45000){out+=buf;buf="";}}return out+buf;
}
function inflate(data,original){
 if(!Number.isSafeInteger(original)||original<0||original>30000000)throw Error("Unsafe inflate size");
 let pos=0,bitbuf=0,bits=0,output=new Uint8Array(original),out=0;
 function read(n){while(bits<n){if(pos>=data.length)throw Error("Truncated deflate");bitbuf|=data[pos++]<<bits;bits+=8;}const v=bitbuf&((1<<n)-1);bitbuf>>>=n;bits-=n;return v;}
 function tree(lengths){const count=Array(16).fill(0);for(const len of lengths)if(len)count[len]++;const next=Array(16).fill(0);let code=0;
 for(let len=1;len<=15;len++){code=(code+count[len-1])*2;next[len]=code;}
 const root=[];for(let sym=0;sym<lengths.length;sym++){const len=lengths[sym];if(!len)continue;let code=next[len]++,p=root;for(let shift=len-1;shift>=0;shift--){const bit=(code>>shift)&1;if(shift===0)p[bit]=sym;else{p[bit]??=[];p=p[bit];}}}return root;}
 function symbol(t){let p=t;while(typeof p!=="number"){p=p[read(1)];if(p===undefined)throw Error("Bad Huffman");}return p;}
 const lb=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258],le=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
 const db=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],de=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
 let final;do{final=read(1);const kind=read(2);
 if(kind===0){bitbuf=0;bits=0;const n=data[pos]|(data[pos+1]<<8);pos+=4;output.set(data.subarray(pos,pos+n),out);out+=n;pos+=n;continue;}
 let lt,dt;
 if(kind===1){lt=tree(Array.from({length:288},(_,i)=>i<144?8:i<256?9:i<280?7:8));dt=tree(Array(32).fill(5));}
 else if(kind===2){const nl=read(5)+257,nd=read(5)+1,nc=read(4)+4,order=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],lens=Array(19).fill(0);
 for(let i=0;i<nc;i++)lens[order[i]]=read(3);const ct=tree(lens),ll=[];
 while(ll.length<nl+nd){const c=symbol(ct);if(c<=15)ll.push(c);else if(c===16){const last=ll[ll.length-1];if(last===undefined)throw Error("Invalid repeat");let n=read(2)+3;while(n--)ll.push(last);}else{let n=c===17?read(3)+3:read(7)+11;while(n--)ll.push(0);}}
 lt=tree(ll.slice(0,nl));dt=tree(ll.slice(nl,nl+nd));}
 else throw Error("Reserved block type");
 for(;;){const c=symbol(lt);if(c<256)output[out++]=c;else if(c===256)break;else{const k=c-257,length=lb[k]+read(le[k]),d=symbol(dt),distance=db[d]+read(de[d]);if(distance>out||d>=30)throw Error("Invalid distance");for(let i=0;i<length;i++)output[out++]=output[out-distance];}
 if(out>original)throw Error("Overflow");}
 }while(!final);
 if(out!==original)throw Error("Incorrect output length "+out+"/"+original);return output;
}
function unzip(bytes){
 const u16=p=>bytes[p]|(bytes[p+1]<<8),u32=p=>(bytes[p]|(bytes[p+1]<<8)|(bytes[p+2]<<16)|(bytes[p+3]<<24))>>>0;
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(u32(i)===0x06054b50){end=i;break;}
 if(end<0)throw Error("Missing ZIP directory");
 let at=u32(end+16),count=u16(end+10),files=[];
 for(let i=0;i<count;i++){if(u32(at)!==0x02014b50)throw Error("Bad central directory");
 const method=u16(at+10),compressed=u32(at+20),size=u32(at+24),fn=u16(at+28),ex=u16(at+30),comment=u16(at+32),local=u32(at+42);
 let name="";for(let j=0;j<fn;j++)name+=String.fromCharCode(bytes[at+46+j]);
 if(u32(local)!==0x04034b50)throw Error("Bad local header");
 const start=local+30+u16(local+26)+u16(local+28),data=bytes.subarray(start,start+compressed);
 const plain=method===0?data:method===8?inflate(data,size):null;
 if(!plain||plain.length!==size)throw Error("Invalid decompression "+name);
 files.push({name,data:plain});at+=46+fn+ex+comment;
 }return files;
}
async function importBatch(tools,{start,limit=8,extras=false,repository="mrcalzon02/NUTBUSTER-R"}){
 if(!Number.isInteger(start)||start<0||!Number.isInteger(limit)||limit<1||limit>10)throw Error("Invalid batch parameters");
 const drive=await tools.mcp__Google_Drive__fetch({url:"https://drive.google.com/file/d/1ySfEltY1N0rS5w2RWOSxFh0WbHXaY_l2/view",download_raw_file:true,include_base64:true});
 if(!drive.result?.b64_string)throw Error("Owner source archive cannot be downloaded");
 const all=unzip(fromBase64(drive.result.b64_string));
 const files=all.filter(x=>extras?
 (x.name==="QA-REPORT.json"||x.name==="assets/source/expansion/nutvale-mining-pickaxes-gloves-original.png"||x.name==="web/art/nutvale/mining-tools/manifest.json"||x.name==="web/art/nutvale/mining-tools/atlas-pickaxes.png"||x.name==="web/art/nutvale/mining-tools/atlas-gloves.png"||x.name==="web/art/nutvale/mining-tools/preview-pickaxes.png"||x.name==="web/art/nutvale/mining-tools/preview-gloves.png"):
 /^web\/art\/nutvale\/mining-tools\/(pickaxes|gloves)\/[^/]+\.png$/.test(x.name))
 .map(x=>({path:x.name==="QA-REPORT.json"?"docs/assets/nutvale-mining-tool-qa-report.json":x.name,data:x.data}))
 .sort((a,b)=>a.path.localeCompare(b.path));
 if(files.length!==(extras?7:86))throw Error("Source archive file count mismatch "+files.length);
 const jobs=files.slice(start,start+limit),uploaded=[];if(!jobs.length)throw Error("Batch beyond file count");
 let i=0;const errors=[];
 async function worker(){while(i<jobs.length){const item=jobs[i++];try{
 const result=await tools.mcp__GitHub__create_blob({repository_full_name:repository,content:toBase64(item.data),encoding:"base64"});
 uploaded.push({path:item.path,sha:result.result.sha,bytes:item.data.length});
 }catch(error){errors.push({path:item.path,error:String(error).slice(0,170)})}}}
 await Promise.all(Array.from({length:Math.min(6,jobs.length)},worker));
 if(errors.length)throw Error("Blob failures: "+JSON.stringify(errors));
 const head=JSON.parse((await tools.mcp__GitHub__fetch({url:"https://api.github.com/repos/"+repository+"/git/ref/heads/main"})).result.content).object.sha;
 const baseTree=JSON.parse((await tools.mcp__GitHub__fetch({url:"https://api.github.com/repos/"+repository+"/git/commits/"+head})).result.content).tree.sha;
 const tree=(await tools.mcp__GitHub__create_tree({repository_full_name:repository,base_tree_sha:baseTree,tree_elements:uploaded.map(item=>({path:item.path,mode:"100644",type:"blob",sha:item.sha}))})).result.sha;
 const commit=(await tools.mcp__GitHub__create_commit({repository_full_name:repository,tree_sha:tree,parent_sha:head,message:"assets(nutvale): verified "+(extras?"production files":"sprites")+" "+(start+1)+"-"+(start+jobs.length)+" of "+files.length})).result.sha;
 const updated=await tools.mcp__GitHub__update_ref({repository_full_name:repository,branch_name:"main",sha:commit,expected_sha:head});
 if(!updated.result.success)throw Error("Branch update not confirmed");
 return {commit,start,count:jobs.length,expected:files.length,bytes:uploaded.reduce((s,x)=>s+x.bytes,0),lastPath:jobs[jobs.length-1].path};
}
const api={fromBase64,toBase64,unzip,inflate,importBatch};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
