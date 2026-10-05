const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root='C:/Users/qiche/Documents/Codex/2026-10-04/wo-x/outputs/harbor-bid/dist';
const nodes=new Map(),saved=new Map(),listeners={};
const ctx=vm.createContext({console,Math,JSON,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},document:{title:'',getElementById:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',showModal(){},close(){}});return nodes.get(id);},querySelectorAll:()=>[],addEventListener:(k,fn)=>listeners[k]=fn}});
const sources=['catalog.js','electronics.js','electronics-atlases.js','item-images.js','grid.js'].map(f=>fs.readFileSync(root+'/'+f,'utf8')).join('\n');vm.runInContext(sources,ctx);
vm.runInContext(`
 const covered=new Set();let wins=0,losses=0;
 for(let j=0;j<300;j++)for(let index=0;index<cargoTypes.length;index++){
 const t=generate(cargoTypes[index],index),seen=new Set();
 for(const it of t.items){covered.add([it.w,it.h].sort((a,b)=>a-b).join('x'));if(it.x<0||it.y<0||it.x+it.w>t.w||it.y+it.h>t.h)throw Error('bounds');for(let y=it.y;y<it.y+it.h;y++)for(let x=it.x;x<it.x+it.w;x++){const key=x+','+y;if(seen.has(key))throw Error('overlap');seen.add(key);}if(it.value<0)throw Error('negative value');if(it.sourceId){const original=electronicCatalog.find(x=>x.sourceId===it.sourceId);if(it.w!==original.w||it.h!==original.h||it.name!==original.name||itemGrade(it)!==original.fixedGrade)throw Error('changed fixed electronic item');}else if(t.cat==='电子物品')throw Error('placeholder in electronic box');}
 const value=t.items.reduce((n,it)=>n+it.value,0);if(value>t.price)wins++;if(value<t.price)losses++;
 }
 if(covered.size!==9||!wins||!losses)throw Error('missing dimension or random outcomes');
 buy(0);const paid=s.current.price,total=s.current.items.reduce((sum,it)=>sum+it.value,0);if(s.cash!==5000-paid)throw Error('purchase');
 s.current.items.forEach((it,i)=>{revealGrid(i);revealGrid(i);});if(s.stock.length!==s.current.items.length)throw Error('duplicate reveal');
 [...s.stock].forEach(it=>{sellItem(it.uid);sellItem(it.uid);});if(s.cash!==5000-paid+total||s.stock.length)throw Error('sale balance');
 renderGrid();console.log(JSON.stringify({containersChecked:1800,dimensions:covered.size,wins,losses,purchaseRevealSale:'passed'}));
 `,ctx);
const reload=vm.createContext({console,Math,JSON,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},document:ctx.document});vm.runInContext(sources,reload);assert.equal(vm.runInContext('s.cash',reload),vm.runInContext('s.cash',ctx));console.log('Save reload: passed');
