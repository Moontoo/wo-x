const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../outputs/harbor-bid/dist');
const source=['catalog.js','all-items.js','electronics-atlases.js','container-art.js','item-images.js','loot.js','loans.js','scratch.js','grid.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n');
function load(saved=new Map()){
 const listeners={},nodes=new Map(),document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);},querySelectorAll:()=>[],addEventListener:(type,fn)=>(listeners[type]||=[]).push(fn)};
 const ctx=vm.createContext({console,document,localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)}});vm.runInContext(source,ctx);
 return {saved,run:code=>vm.runInContext(code,ctx),click:id=>{for(const fn of listeners.click||[])fn({target:{closest:()=>({id,dataset:{},disabled:false})}});}};
}
const summary=[];
for(let tier=0;tier<6;tier++){
 for(const boundary of ['zero','limit','over']){
  const c=load();c.run(`borrowLoan(6000000);s.cash+=10000000;buy(${tier});const target=s.current.id;const other={...catalog[0],value:catalog[0].referencePrice,uid:'other',record:'old-box'};s.stock.push(other);const startingCash=s.cash,startingDebt=JSON.stringify(s.loan),limit=Math.floor(s.current.items.length/3);`);
  const count=c.run('s.current.items.length'),limit=Math.floor(count/3),found=boundary==='zero'?0:boundary==='limit'?limit:limit+1;
  for(let i=0;i<found;i++)c.run(`revealGrid(${i})`);
  assert.equal(c.run('stopLossStatus().eligible'),boundary!=='over');
  assert(c.run('unboxGrid().includes(\'id="stopLoss"\')'));assert(c.run('unboxGrid().indexOf(\'id="stopLoss"\')<unboxGrid().indexOf(\'已拆\')'));
  c.click('stopLoss');
  if(boundary==='over'){const cash=c.run('s.cash');c.click('confirmStopLoss');assert.equal(c.run('s.cash'),cash);assert.equal(c.run('s.current.id'),c.run('target'));continue;}
  assert(c.run('document.getElementById("stopLossDialog").open'));c.click('cancelStopLoss');assert.equal(c.run('s.cash'),c.run('startingCash'));assert(c.run('s.current'));
  c.click('stopLoss');const savedCurrent=c.run('JSON.stringify(s.current)'),expectedRefund=c.run('Math.floor(s.current.price*85/100)');c.click('confirmStopLoss');
  assert.equal(c.run('s.cash'),c.run('startingCash')+expectedRefund);assert.equal(c.run('JSON.stringify(s.loan)'),c.run('startingDebt'));assert.equal(c.run('s.current'),null);assert.equal(c.run('s.stock.length'),1);assert.equal(c.run('s.stock[0].uid'),'other');
  assert.equal(c.run('s.records[0].revenue'),expectedRefund);assert.equal(c.run('s.records[0].repaid||0'),0);assert.equal(c.run('s.records[0].stopLoss.revealed'),found);assert.equal(c.run('s.records[0].total'),count);assert.equal(c.run('s.records[0].sold'),0);assert(c.run('ledgerGrid().includes("已止损回收")'));assert(!c.run('ledgerGrid().includes("已售 0/")'));
  const cash=c.run('s.cash');c.click('confirmStopLoss');assert.equal(c.run('s.cash'),cash);assert(!c.run('recoverCargo(target)'));c.run('confirmCargoProfit('+savedCurrent+')');assert.equal(c.run('s.cash'),cash);
  const reload=load(c.saved);assert.equal(reload.run('s.cash'),cash);assert.equal(reload.run('JSON.stringify(s.loan)'),c.run('startingDebt'));assert.equal(reload.run('s.records[0].stopLoss.refund'),expectedRefund);assert.equal(reload.run('s.stock.length'),1);assert.equal(reload.run('s.current'),null);
  summary.push({tier:tier+1,count,limit,found,refund:expectedRefund});
 }
}
const sold=load();sold.run('buy(0);revealGrid(0);sellItems([s.current.items[0].uid]);const originalCash=s.cash,target=s.current.id;');assert(!sold.run('stopLossStatus().eligible'));sold.click('stopLoss');assert(!sold.run('recoverCargo(target)'));assert.equal(sold.run('s.cash'),sold.run('originalCash'));
const stale=load();stale.run('buy(0);const target=s.current.id;requestStopLoss();');for(let i=0;i<4;i++)stale.run(`revealGrid(${i})`);const staleCash=stale.run('s.cash');stale.click('confirmStopLoss');assert.equal(stale.run('s.cash'),staleCash);assert(stale.run('s.current'));
const pending=load();pending.run('buy(0);revealGrid(0);revealGrid(1);revealGrid(2);');assert(pending.run('stopLossStatus().eligible'));pending.run('scratchPendingReveals.add(s.current.items[3].uid);updateStopLossControls();');assert(!pending.run('stopLossStatus().eligible'));assert(pending.run('document.getElementById("stopLoss").disabled'));assert(!pending.run('recoverCargo(s.current.id)'));
const active=load();active.run('borrowLoan(6000000);buy(1);revealGrid(0);revealGrid(1);persist();');const activeReload=load(active.saved);assert(activeReload.run('stopLossStatus().eligible'));assert.equal(activeReload.run('stopLossStatus().revealed'),2);assert(activeReload.run('recoverCargo(s.current.id)'));
console.log(JSON.stringify({checks:'all six tiers: zero / exactly one-third / exceeded; modal cancellation, stale confirmation, pending scratch, already-sold guard, stock cleanup, loan preservation, ledger, repeat clicks, save and reload passed',summary},null,2));
