/* Nutravaganza Campaign II: mined entry economy, five 100-stage regions.
 * Display levels 1-500; save IDs 1001-1500 keep trials 501-650 intact.
 * Every mine roll is deterministic within its site; no paid RNG. */
(function(root){
'use strict';
const REGIONS=Object.freeze([
 {id:1,name:'The Buried Boardwalk',icon:'⛏️',description:'Abandoned wharf mines and salted crystal seams'},
 {id:2,name:'The Gilded Underroots',icon:'🌳',description:'Petrified groves, root tunnels and stubborn walnut veins'},
 {id:3,name:'Prismatic Hollow',icon:'💎',description:'Luminous geodes and deep cascading ore'},
 {id:4,name:'The Fossil Treasury',icon:'🦴',description:'Ancient bones, underground vaults and peculiar riches'},
 {id:5,name:'The Crown Below',icon:'👑',description:'A royal subterranean maze guarding the legendary Nut Core'}
]);
const OUTCOMES=Object.freeze([
 Object.freeze({id:'ordinary',name:'Ordinary Vein',weight:55,ore:1}),
 Object.freeze({id:'rich',name:'Rich Vein',weight:25,ore:2}),
 Object.freeze({id:'fossil',name:'Fossil Cluster',weight:15,ore:3}),
 Object.freeze({id:'crystal',name:'Crystal Pocket',weight:5,ore:5})
]);
const W = 4, H = 4, COST = 3, MAX_TIER = 5;
function localDay(now=Date.now()){
 const d=new Date(now);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function hash(n){let x=n>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);return (x^(x>>>16))>>>0;}
function isUnlocked(save){return Number(save?.stars?.[500])>0;}
function totalPicks(n){return 8+2*n.mineTier;}
function cellFor(n,index){
 const roll=hash(n.seed+index*274177+17)%100;
 let chance=roll,result=OUTCOMES[OUTCOMES.length-1];
 for(const o of OUTCOMES){chance-=o.weight;if(chance<0){result=o;break;}}
 const hardness=1+hash(n.seed+index*1691+83)%3;
 return {index,hardness,ore:result.ore,kind:result.id};
}
function resetSite(n){n.seed=hash(n.seed+n.sites*15485863+0x2f9187)||113;n.site=Array.from({length:W*H},()=>0);n.sites++;}
function ensure(save,now=Date.now()){
 if(!save.nutravaganzaExpedition||typeof save.nutravaganzaExpedition!=='object'||Array.isArray(save.nutravaganzaExpedition))save.nutravaganzaExpedition={};
 const n=save.nutravaganzaExpedition;
 const clamp=(v,max)=>Number.isSafeInteger(v)?Math.max(0,Math.min(max,v)):0;
 n.ore=clamp(n.ore,999999);n.writs=clamp(n.writs,999999);
 n.mineTier=clamp(n.mineTier,MAX_TIER);
 n.sites=clamp(n.sites,999999);
 if(!Number.isSafeInteger(n.seed)||!n.seed)n.seed=4099;
 if(!Array.isArray(n.site)||n.site.length!==16)n.site=Array.from({length:16},()=>0);
 n.site=n.site.map((v,i)=>clamp(v,cellFor(n,i).hardness));
 n.unlocked=clamp(n.unlocked,500)||1;
 if(!n.stars||typeof n.stars!=='object'||Array.isArray(n.stars))n.stars={};
 n.completed=clamp(n.completed,500);
 n.picks=clamp(n.picks,totalPicks(n));
 const today=localDay(now);
 if(typeof n.day!=='string'){n.day=today;n.picks=totalPicks(n);}
 else if(today>n.day){n.day=today;n.picks=totalPicks(n);}
 return n;
}
function mine(save,index,now=Date.now()){
 if(!isUnlocked(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,now);
 if(!Number.isInteger(index)||index<0||index>=16)return {valid:false,reason:'cell'};
 if(n.picks<1)return {valid:false,reason:'picks'};
 const cell=cellFor(n,index);
 if(n.site[index]>=cell.hardness)return {valid:false,reason:'empty'};
 n.picks--;n.site[index]++;
 const cleared=n.site[index]===cell.hardness;
 if(cleared)n.ore=Math.min(999999,n.ore+cell.ore);
 const result={valid:true,index,cleared,hits:n.site[index],hardness:cell.hardness,
  ore:cleared?cell.ore:0,kind:cleared?cell.kind:null,picks:n.picks,balance:n.ore};
 if(n.site.every((hits,i)=>hits>=cellFor(n,i).hardness)){resetSite(n);result.siteReset=true;}
 return result;
}
function refine(save,count=1,now=Date.now()){
 if(!isUnlocked(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,now);
 if(!Number.isSafeInteger(count)||count<1||count>10)return {valid:false,reason:'quantity'};
 if(n.ore<count*COST)return {valid:false,reason:'ore',short:count*COST-n.ore};
 if(n.writs>999999-count)return {valid:false,reason:'full'};
 n.ore-=count*COST;n.writs+=count;
 return {valid:true,oreSpent:count*COST,writs:count,balance:n.writs};
}
function nextCost(n){return n.mineTier>=MAX_TIER?null:200+360*n.mineTier;}
function upgrade(save,now=Date.now()){
 if(!isUnlocked(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,now),price=nextCost(n);
 if(price===null)return {valid:false,reason:'max'};
 const wharf=root.NutFishing?.ensure(save,now);
 if(!wharf||wharf.dollars<price)return {valid:false,reason:'dollars',short:price-(wharf?.dollars||0)};
 wharf.dollars-=price;n.mineTier++;n.picks=Math.min(totalPicks(n),n.picks+2);
 return {valid:true,cost:price,tier:n.mineTier,picks:totalPicks(n)};
}
function level(id){return Number.isInteger(id)&&id>=1001&&id<=1500?id-1000:null;}
function region(local){return REGIONS[Math.floor((local-1)/100)]||null;}
function available(save,id){
 const number=level(id),n=ensure(save);
 return number!==null&&isUnlocked(save)&&number<=n.unlocked&&n.writs>0;
}
function admit(save,id,now=Date.now()){
 const number=level(id);
 if(number===null)return {valid:false,reason:'level'};
 if(!isUnlocked(save))return {valid:false,reason:'campaign'};
 const n=ensure(save,now);
 if(number>n.unlocked)return {valid:false,reason:'sequence'};
 if(n.writs<1)return {valid:false,reason:'writs'};
 n.writs--;n.attempts=(n.attempts||0)+1;
 return {valid:true,id,local:number,region:region(number),writs:n.writs};
}
function complete(save,id,stars=1,score=0,now=Date.now()){
 const number=level(id);
 if(number===null||!isUnlocked(save))return {valid:false,reason:'level'};
 const n=ensure(save,now);
 if(number>n.unlocked)return {valid:false,reason:'sequence'};
 const first=!n.stars[number];
 n.stars[number]=Math.max(n.stars[number]||0,Math.max(1,Math.min(3,Math.trunc(stars)||1)));
 if(first){n.completed++;n.unlocked=Math.min(500,Math.max(n.unlocked,number+1));}
 n.bestScore=Math.max(n.bestScore||0,Math.trunc(score)||0);
 return {valid:true,first,stars:n.stars[number],unlocked:n.unlocked,completed:n.completed};
}
function status(save,now=Date.now()){
 const n=ensure(save,now);return {open:isUnlocked(save),ore:n.ore,writs:n.writs,picks:n.picks,
  daily:totalPicks(n),tier:n.mineTier,upgradeCost:nextCost(n),completed:n.completed,unlocked:n.unlocked,
  regions:REGIONS.map((r,i)=>({...r,start:i*100+1,end:(i+1)*100,
   completed:Object.keys(n.stars).filter(k=>Number(k)>=i*100+1&&Number(k)<=(i+1)*100).length}))};
}
const api=Object.freeze({REGIONS,OUTCOMES,ENTRY_COST:COST,ensure,isUnlocked,cellFor,mine,refine,upgrade,nextCost,level,region,available,admit,complete,status,localDay});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutExpedition=api;
})(typeof window!=='undefined'?window:globalThis);
