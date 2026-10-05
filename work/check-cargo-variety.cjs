const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../outputs/harbor-bid/dist');
const source=['catalog.js','all-items.js','electronics-atlases.js','container-art.js','item-images.js','loot.js','loans.js','grid.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n');
const ctx=vm.createContext({console,document:{getElementById:()=>({}),querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}}});
vm.runInContext(source.replace("throw Error('Diverse cargo outcome could not be filled')","throw Error(JSON.stringify({price:t.price,win,value,budget,chosen:chosen.map(it=>[it.name,it.referencePrice]),count:items.length,variety:cargoVariety(t,items)}))"),ctx);
vm.runInContext(`for(const random of [0,.5,.999999])for(const t of cargoTypes.slice(4,6))for(const win of [true,false]){Math.random=()=>random;const box=cargoFallback(t,win);if(!box.every(it=>it.w===1&&it.h===1)||!cargoMeetsOutcome(t,box,win))throw Error('Compact fallback invariants');}`,ctx);
const result=vm.runInContext(`(()=>{
 let seed=20261006;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 return cargoTypes.slice(4,6).map((t,i)=>{let compact=0,maxCopies=0,minUnique=Infinity,wins=0,lowSum=0,highSum=0;const names=new Set(),patterns=new Set();
 for(let n=0;n<5000;n++){const box=generate(t,i+4);if(!cargoVariety(t,box.items))throw Error('Composition rule');const counts=new Map();for(const it of box.items){names.add(it.key);counts.set(it.key,(counts.get(it.key)||0)+1);}maxCopies=Math.max(maxCopies,...counts.values());minUnique=Math.min(minUnique,counts.size);if(box.items.reduce((v,it)=>v+it.value,0)>=t.price)wins++;
 const small=box.items.filter(it=>it.w===1&&it.h===1);if(small.length===t.count){compact++;patterns.add(box.items.map(it=>it.key).sort().join('|'));lowSum+=small.filter(it=>it.value<50000).length;highSum+=small.filter(it=>it.value>=200000).length;}}
 return {price:t.price,samples:5000,breakEven:wins/5000,compact,uniqueCompactCombinations:patterns.size,maxCopies,minUnique,catalogNames:names.size,averageCompactLow:lowSum/compact,averageCompactHigh:highSum/compact};});
})()`,ctx);
for(const row of result){assert(row.compact>0);assert(row.uniqueCompactCombinations>100);assert(row.maxCopies<=2);assert(row.minUnique>=row.price/1000000+4);assert(Math.abs(row.breakEven-.75)<.025);}
console.log(JSON.stringify({checks:'Both compact outcomes at extreme RNG; retained all-one-cell boxes, varied combinations, at most two copies of any item, price diversity and 75% break-even probability',result},null,2));
