const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../outputs/harbor-bid/dist'),saved=new Map(),nodes=new Map();
const document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',showModal(){},close(){}});return nodes.get(id);},querySelectorAll:()=>[],addEventListener(){}};
const source=['catalog.js','all-items.js','electronics-atlases.js','container-art.js','item-images.js','loot.js','loans.js','grid.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n');
function load(){const ctx=vm.createContext({console,document,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)}});vm.runInContext(source,ctx);return ctx;}
const ctx=load();

vm.runInContext(`
 for(const random of [0,.5,.999999]){Math.random=()=>random;for(let index=0;index<6;index++){const t=cargoTypes[index],box=generate(t,index);if(!cargoMeetsOutcome(t,box.items,random<cargoBreakEvenChances[index]))throw Error('Extreme RNG fallback');}}
 for(let index=0;index<cargoTypes.length;index++){
  const t=cargoTypes[index];let seed=20261005;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};Math.random=rng;
  const before=generate(t,index);seed=20261005;s.cash=0;s.loan.balance=6000000;s.records=[{cost:10000000,revenue:0}];Math.random=rng;
  const after=generate(t,index);if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Player-state dependent odds');
 }
`,ctx);
console.log('Extreme RNG fallback and player-state independence: passed.');
