const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../outputs/harbor-bid/dist');
const source=['catalog.js','all-items.js','electronics-atlases.js','container-art.js','item-images.js','loot.js','loans.js','scratch.js','grid.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n');
function load(saved=new Map()){
 const listeners={},nodes=new Map(),document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);},querySelectorAll:()=>[],addEventListener:(type,fn)=>(listeners[type]||=[]).push(fn)};
 const ctx=vm.createContext({console,document,localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)}});vm.runInContext(source,ctx);
 return {saved,run:code=>vm.runInContext(code,ctx),click:id=>{for(const fn of listeners.click||[])fn({target:{closest:()=>({id,dataset:{},disabled:false})}});},change:(id,value,checked)=>{for(const fn of listeners.change||[])fn({target:{id,value,checked}});}};
}
const c=load();
assert.equal(c.run('discoverySummary().total'),0);
c.run(`const red=catalog.find(it=>it.fixedGrade===5),gold=catalog.find(it=>it.fixedGrade===4);s.cash=60000000;buy(6);const originals=s.current.items;s.current.items=[red,red,gold,...originals.slice(3)].map((it,i)=>({...it,uid:'test-'+i,value:it.referencePrice,grade:it.fixedGrade,revealed:false}));`);
// Offers, catalog views, purchasing and partial scratch do not count as a discovery.
assert.equal(c.run('discoverySummary().total'),0);c.run('libraryGrid();scratchPendingReveals.add(s.current.items[0].uid);');assert.equal(c.run('discoverySummary().total'),0);
c.run('scratchPendingReveals.clear();revealGrid(0);revealGrid(0);revealGrid(1);revealGrid(2);');
assert.equal(c.run('s.redFinds[red.key]'),2);assert.equal(c.run('discoverySummary().kinds'),1);assert.equal(c.run('discoverySummary().value'),c.run('red.referencePrice*2'));
c.run('sellItems([s.current.items[0].uid]);');assert.equal(c.run('s.redFinds[red.key]'),2);
c.click('revealAll');const expected=c.run('s.current.items.filter(it=>it.fixedGrade===5).length');
assert.equal(c.run('discoverySummary().total'),expected);c.click('revealAll');assert.equal(c.run('discoverySummary().total'),expected);
assert(c.run('itemCard(red).includes("累计开出")'));assert(!c.run('itemCard(gold).includes("累计开出")'));
c.change('libraryStatsOnly','',true);assert(c.run('libraryItems().every(it=>it.fixedGrade===5)'));
c.run('libraryCategory=red.cat;librarySearch=red.name;updateLibrary();');assert(c.run('libraryItems().some(it=>it.key===red.key)'));assert(c.run('document.getElementById("libraryResults").innerHTML.includes("累计开出")'));
c.run('sellItems(s.stock.map(it=>it.uid));s.current=null;renderGrid();');
const reloaded=load(c.saved);assert.equal(reloaded.run('discoverySummary().total'),expected);
reloaded.click('confirmReset');assert.equal(reloaded.run('discoverySummary().total'),0);assert.equal(load(reloaded.saved).run('discoverySummary().total'),0);
// Revealed items returned through stop loss remain lifetime discoveries.
const recovered=load();recovered.run(`s.cash=60000000;buy(6);s.current.items[0]={...s.current.items[0],...catalog.find(it=>it.fixedGrade===5)};revealGrid(0);const key=s.current.items[0].key;recoverCargo(s.current.id);`);
assert.equal(recovered.run('s.redFinds[key]'),1);assert.equal(load(recovered.saved).run('discoverySummary().total'),1);
// Backfill legacy saves once, merging current cargo and stock by UID. Sold current items
// can be recovered from revealed cargo, but hidden cargo and lost historic sales cannot.
const old=load();old.run(`s.cash=25000000;borrowLoan(3000000);buy(3);const red=catalog.find(it=>it.fixedGrade===5),gold=catalog.find(it=>it.fixedGrade===4);s.current.items.slice(0,4).forEach((it,i)=>Object.assign(it,i===3?gold:red));revealGrid(0);revealGrid(1);revealGrid(3);sellItems([s.current.items[1].uid]);s.stock.push({...red,value:red.referencePrice,grade:5,record:'old',uid:'older-stock'});s.stock=s.stock.map(normalizeItem);s.current.items=s.current.items.map(normalizeItem);delete s.redFinds;delete s.discoveryRevision;persist();`);
const stateBefore=old.run('JSON.stringify({cash:s.cash,loan:s.loan,stock:s.stock,records:s.records,current:s.current,offers:s.offers,round:s.round})');
const migrated=load(old.saved);assert.equal(migrated.run('discoverySummary().total'),3);assert(migrated.run('s.discoveryHistoryPartial'));
assert.equal(migrated.run('JSON.stringify({cash:s.cash,loan:s.loan,stock:s.stock,records:s.records,current:s.current,offers:s.offers,round:s.round})'),stateBefore);
const migratedAgain=load(migrated.saved);assert.equal(migratedAgain.run('discoverySummary().total'),3);migratedAgain.run('revealGrid(2);');assert.equal(migratedAgain.run('discoverySummary().total'),4);
// Reject damaged/foreign counters without resetting financial or item progress.
const damaged=load();damaged.run(`s.cash=12345678;s.redFinds={[catalog.find(it=>it.fixedGrade===5).key]:-10,[catalog.find(it=>it.fixedGrade===4).key]:999,unknown:55};persist();`);
const sanitized=load(damaged.saved);assert.equal(sanitized.run('discoverySummary().total'),0);assert.equal(sanitized.run('s.cash'),12345678);
// Earliest v1 migration also initializes the statistics from available item history.
const v1=load();v1.run(`const red=catalog.find(it=>it.fixedGrade===5);localStorage.setItem('harbor-grid-v1',JSON.stringify({cash:4000000,round:1,records:[],stock:[{...red,uid:'v1-red',record:'v1'}]}));`);v1.saved.delete(c.run('GRID_KEY'));
assert.equal(load(v1.saved).run('discoverySummary().total'),1);
console.log(JSON.stringify({checks:'red-only counts; repeated item quantities; individual/bulk reveal idempotency; sold/recovered retention; filters; save/reload/reset; current+stock legacy deduplication; old sales excluded; hidden/pending excluded; financial preservation; malformed counters; v1 migration',catalog: c.run('catalog.length'),trackedItems:c.run('catalog.filter(it=>it.fixedGrade===5).length')},null,2));

