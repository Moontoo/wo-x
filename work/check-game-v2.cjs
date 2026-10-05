const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root='outputs/harbor-bid/dist/',saved=new Map(),nodes=new Map();
const document={title:'',getElementById:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',showModal(){},close(){}});return nodes.get(id);},querySelectorAll:()=>[],addEventListener:()=>{}};
const sources=['catalog.js','all-items.js','electronics-atlases.js','container-art.js','item-images.js','loot.js','loans.js','grid.js'].map(f=>fs.readFileSync(root+f,'utf8')).join('\n');
function context(save=saved){return vm.createContext({console,Math,JSON,localStorage:{getItem:k=>save.get(k)||null,setItem:(k,v)=>save.set(k,v)},document});}
const ctx=context();vm.runInContext(sources,ctx);
const expected=JSON.parse(fs.readFileSync('outputs/全部物品数据.json','utf8')).items;
const actual=JSON.parse(vm.runInContext('JSON.stringify(catalog)',ctx));
assert.equal(actual.length,491);assert.equal(new Set(actual.map(x=>x.key)).size,491);
for(const x of actual){const d=expected.find(i=>i.key===x.key);assert.equal(x.referencePrice,d.price);assert.equal(x.fixedGrade,d.grade);assert.equal(x.w,d.width);assert.equal(x.h,d.height);assert(x.sourceId||x.imageSpec);}
assert(!actual.some(x=>['建筑图纸5号','破损的脑机'].includes(x.name)));
vm.runInContext(`
 let wins=0,losses=0;const seenCategories=new Set(),outcomes={};
 for(let j=0;j<60;j++)for(let index=0;index<cargoTypes.length;index++){
  const t=generate(cargoTypes[index],index),seen=new Set();let value=0;
  for(const it of t.items){const original=itemByKey.get(it.key);seenCategories.add(it.cat);if(it.value!==original.referencePrice||it.fixedGrade!==original.fixedGrade||it.w!==original.w||it.h!==original.h)throw Error('altered catalog item');if(t.cat&&it.cat!==t.cat)throw Error('wrong category');if(it.x<0||it.y<0||it.x+it.w>t.w||it.y+it.h>t.h)throw Error('bounds');for(let y=it.y;y<it.y+it.h;y++)for(let x=it.x;x<it.x+it.w;x++){const key=x+','+y;if(seen.has(key))throw Error('overlap');seen.add(key);}value+=it.value;}
  const o=outcomes[t.name]||{win:0,loss:0};if(value>t.price){wins++;o.win++;}if(value<t.price){losses++;o.loss++;}outcomes[t.name]=o;
 }
 if(!wins||!losses)throw Error('missing outcomes');
 // Every item can fit in a mixed container with its exact dimensions and price.
 for(const it of catalog){const type=cargoAllowsItem(cargoTypes[5],it)?cargoTypes[5]:cargoTypes[0];const packed=pack(type,[it],it);if(!packed.length||packed[0].key!==it.key||packed[0].value!==it.referencePrice)throw Error('unreachable item');seenCategories.add(packed[0].cat);}
 if(seenCategories.size!==10)throw Error('missing categories');
 buy(0);const paid=s.current.price,total=s.current.items.reduce((sum,it)=>sum+it.value,0);if(s.cash!==START_CASH-paid)throw Error('purchase');
 s.current.items.forEach((it,i)=>{revealGrid(i);revealGrid(i);});if(s.stock.length!==s.current.items.length)throw Error('duplicate reveal');
 [...s.stock].forEach(it=>{sellItem(it.uid);sellItem(it.uid);});if(s.cash!==START_CASH-paid+total||s.stock.length)throw Error('sale balance');
 for(const view of [market(),unboxGrid(),warehouseGrid(),libraryGrid()])if(/普通|优良|稀有|史诗|传说|至尊|珍藏级/.test(view))throw Error('visible quality name');
 libraryCategory='房卡';if(libraryItems().length!==80||libraryItems().some(x=>x.w!==1||x.h!==1))throw Error('keycards');libraryCategory='装备';if(libraryItems().length!==78)throw Error('equipment');librarySearch='重型登山包';if(libraryItems().length!==1||!libraryGrid().includes(money(libraryItems()[0].referencePrice)))throw Error('search');
 renderGrid();console.log(JSON.stringify({items:catalog.length,containersChecked:360,categories:seenCategories.size,wins,losses,outcomes,purchaseRevealSale:'passed'}));
`,ctx);
const reload=context();vm.runInContext(sources,reload);assert.equal(vm.runInContext('s.cash',reload),vm.runInContext('s.cash',ctx));
const old={cash:100000,round:3,stock:[{sourceId:1,name:'便携军用雷达',value:1000,uid:'old-1',record:'oldbox'}],records:[{id:'oldbox',total:1,sold:0,revenue:0,cost:100}],offers:[],current:null};
const legacy=new Map([['harbor-grid-v1',JSON.stringify(old)]]),migration=context(legacy);vm.runInContext(sources,migration);assert.equal(vm.runInContext('s.stock[0].value',migration),expected[0].price);assert.equal(vm.runInContext('s.cash',migration),3000000);assert.deepEqual(JSON.parse(legacy.get('harbor-grid-v1-backup')),old);
const html=fs.readFileSync('outputs/港口盲箱.html','utf8');assert(!/src="[^" ]+\.js"|href="[^" ]+\.css"|assets\/[\w-]+\.png/.test(html));assert(html.includes('data:image/png;base64,'));
assert.equal(vm.runInContext('cargoTypes.filter(t=>t.cat===null).length',ctx),6);
assert.equal(vm.runInContext('new Set(cargoTypes.map(t=>t.art)).size',ctx),6);
assert(!vm.runInContext('drawBalancedCargo.toString()',ctx).includes('s.cash'));assert(!vm.runInContext('drawBalancedCargo.toString()',ctx).includes('s.records'));
const embedded=vm.createContext({console,Math,JSON,Blob,URL,atob,localStorage:{getItem:()=>null,setItem:()=>{}},document});
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n');vm.runInContext(scripts,embedded);
assert(vm.runInContext('containerArtwork.src.startsWith("blob:")&&catalogSheets.every(x=>x.src.startsWith("blob:"))&&electronicAtlases.every(x=>x.src.startsWith("blob:"))',embedded));
assert.equal(vm.runInContext('s.offers.length',embedded),6);
assert.equal((nodes.get('game').innerHTML.match(/class="container-image"/g)||[]).length,6);
console.log('Catalog consistency, price display, packing, search, save reload, migration and standalone assets: passed.');
