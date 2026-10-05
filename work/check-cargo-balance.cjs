const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../outputs/harbor-bid/dist');
const nodes=new Map(),saved=new Map();
const document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',showModal(){},close(){}});return nodes.get(id);},querySelectorAll:()=>[],addEventListener(){}};
const source=['catalog.js','all-items.js','electronics-atlases.js','container-art.js','item-images.js','loot.js','grid.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n');
function context(){const ctx=vm.createContext({console,document,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)}});vm.runInContext(source,ctx);return ctx;}
const ctx=context();
const report=vm.runInContext(`(()=>{let seed=812535;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};return cargoTypes.map((t,index)=>{const values=[];let millions=0,total=0,top=0;for(let n=0;n<10000;n++){const box=generate(t,index);if(box.items.length!==t.count)throw Error('Short box');let value=0;for(const item of box.items){value+=item.value;total++;if(item.value>=1000000)millions++;if(item.value>=5000000)top++;}values.push(value);}values.sort((a,b)=>a-b);return {tier:index+1,price:t.price,samples:values.length,profitChance:values.filter(v=>v>t.price).length/values.length,doubleChance:values.filter(v=>v>=2*t.price).length/values.length,lossHalfChance:values.filter(v=>v<t.price/2).length/values.length,medianValue:values[5000],p95Value:values[9500],millionPerItem:millions/total,topPerItem:top/total};});})()`,ctx);
for(let i=1;i<report.length;i++){assert(report[i].millionPerItem>report[i-1].millionPerItem,'Higher price must increase high-value frequency');assert(report[i].lossHalfChance>report[i-1].lossHalfChance,'Higher price must increase large-loss risk');assert(report[i].p95Value>report[i-1].p95Value,'Higher price must improve upper-tail reward');}
assert(report[0].topPerItem>0,'Low-price jackpot must remain possible');
for(let tier=0;tier<6;tier++)for(const item of vm.runInContext('catalog',ctx)){const profile=vm.runInContext('cargoRiskProfiles',ctx)[tier];for(const weights of [profile.normal,profile.surge])assert.equal(vm.runInContext('pickCargoItem',ctx)([item],weights).key,item.key);}
vm.runInContext(`s.cash=1234567;s.stock=[{...s.offers[0].items[0],revealed:true,record:'old-box'}];s.current=s.offers[1];persist();`,ctx);
const old=JSON.parse(saved.get('harbor-grid-screenshot-v2'));delete old.balanceRevision;saved.set('harbor-grid-screenshot-v2',JSON.stringify(old));
const reload=context(),next=JSON.parse(saved.get('harbor-grid-screenshot-v2'));
assert.equal(next.cash,old.cash);assert.deepStrictEqual(next.stock,old.stock);assert.deepStrictEqual(next.records,old.records);assert.deepStrictEqual(next.current,old.current);assert.equal(next.offers.length,0);assert.equal(next.balanceRevision,4);
console.log(JSON.stringify({samples:60000,report,migration:'cash, stock, records and purchased box preserved; unopened offers invalidated',reachability:'all 491 items in all six tiers'},null,2));
