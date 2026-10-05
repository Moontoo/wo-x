const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../outputs/harbor-bid/dist');
const source=['catalog.js','all-items.js','electronics-atlases.js','container-art.js','item-images.js','loot.js','loans.js','grid.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n');
function load(saved=new Map()){
 const listeners={},nodes=new Map(),document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',showModal(){},close(){}});return nodes.get(id);},querySelectorAll:()=>[],addEventListener:(type,fn)=>(listeners[type]||=[]).push(fn)};
 const ctx=vm.createContext({console,document,localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)}});vm.runInContext(source,ctx);
 return {ctx,saved,run:code=>vm.runInContext(code,ctx),click:(id,dataset={})=>{for(const fn of listeners.click||[])fn({target:{closest:()=>({id,dataset,disabled:false})}});}};
}
for(const amount of [1000000,3000000,6000000]){const c=load();assert(c.run('borrowLoan('+amount+')'));assert.equal(c.run('s.cash'),3000000+amount);assert.equal(c.run('s.loan.balance'),amount);assert(!c.run('borrowLoan(1000000)'));assert.equal(c.run('s.cash'),3000000+amount);c.run('persist()');const restored=load(c.saved);assert.equal(restored.run('s.loan.balance'),amount);assert.equal(restored.run('s.cash'),3000000+amount);}
assert(!load().run('borrowLoan(2000000)'));
const outcomes=[];
for(const mode of ['single','cargo','warehouse']){
 const c=load();c.run(`borrowLoan(1000000);const originals=catalog.filter(it=>it.referencePrice<200000).slice(0,12);s.stock=originals.map((it,i)=>({...it,value:it.referencePrice,grade:it.fixedGrade,uid:'test-'+i,record:'test-box',revealed:true}));s.records=[{id:'test-box',name:'测试箱',cost:1500000,revenue:0,total:12,sold:0}];s.current={...cargoTypes[0],id:'test-box',items:s.stock};`);
 const gross=c.run('s.stock.reduce((sum,it)=>sum+it.value,0)');
 if(mode==='single')for(let i=0;i<12;i++)c.click('',{sellItem:'test-'+i});
 else c.click(mode==='cargo'?'sellCargo':'sellAllStock');
 const paid=Math.floor(gross*3/10);assert.equal(c.run('s.cash'),4000000+gross-paid);assert.equal(c.run('s.loan.balance'),1000000-paid);assert.equal(c.run('s.records[0].revenue'),gross);assert.equal(c.run('s.records[0].repaid'),paid);assert.equal(c.run('s.stock.length'),0);
 const before=c.run('s.cash');c.click('sellAllStock');assert.equal(c.run('s.cash'),before);assert.equal(c.run('s.loan.balance'),1000000-paid);
 c.run('persist()');const reloaded=load(c.saved);assert.equal(reloaded.run('s.loan.remainder'),c.run('s.loan.remainder'));assert.equal(reloaded.run('s.loan.balance'),1000000-paid);assert(c.run('ledgerGrid().includes("自动还贷")'));outcomes.push({mode,gross,paid});
}
const cap=load();cap.run('borrowLoan(1000000);s.loan.balance=100;s.loan.repaid=999900;');assert.equal(cap.run('settleLoanSale(2000).cash'),1900);assert.equal(cap.run('s.loan.balance'),0);assert.equal(cap.run('s.loan.repaid'),1000000);assert.equal(cap.run('settleLoanSale(2000).cash'),2000);assert(cap.run('borrowLoan(6000000)'));
const small=load();small.run('borrowLoan(1000000)');for(let i=0;i<10;i++)small.run('settleLoanSale(1)');assert.equal(small.run('s.loan.repaid'),3);
const old=load();old.run('s.cash=876543;s.stock=[{...s.offers[0].items[0],record:"old"}];persist()');const before=JSON.parse(old.saved.get('harbor-grid-screenshot-v2'));delete before.loan;old.saved.set('harbor-grid-screenshot-v2',JSON.stringify(before));const migrated=load(old.saved);assert.equal(migrated.run('s.cash'),876543);assert.equal(migrated.run('s.loan.balance'),0);assert.deepStrictEqual(JSON.parse(migrated.run('JSON.stringify(s.stock)')),before.stock);assert.deepStrictEqual(JSON.parse(migrated.run('JSON.stringify(s.offers)')),before.offers);
const reset=load();reset.run('borrowLoan(6000000)');reset.click('confirmReset');assert.equal(reset.run('s.cash'),3000000);assert.equal(reset.run('s.loan.balance'),0);
assert.deepStrictEqual(JSON.parse(reset.run('JSON.stringify(cargoTypes.map(t=>t.count))')),[11,14,17,18,24,30]);assert.deepStrictEqual(JSON.parse(reset.run('JSON.stringify(cargoTypes.map(t=>t.w*t.h))')),[54,72,96,120,150,180]);
console.log(JSON.stringify({loanTiers:[1000000,3000000,6000000],repaymentPercent:30,salePaths:outcomes,checks:'duplicate borrowing, double sale, fractional carry, debt cap, full repayment, reload, old save migration, restart, expanded capacity: passed'},null,2));
