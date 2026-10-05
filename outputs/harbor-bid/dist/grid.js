const GRID_KEY='harbor-grid-screenshot-v2',START_CASH=3000000;
const itemByKey=new Map(catalog.map(it=>[it.key,it])),categories=[...new Set(catalog.map(it=>it.cat))];
let libraryCategory='',librarySearch='';
const sizes=[[1,1],[1,2],[1,3],[2,2],[2,3],[2,4],[3,3],[3,4],[4,4]];
const grades=['#e6edf4','#75df9a','#70b4ff','#c290ff','#ffcc59','#ff737d'].map(color=>({color}));
function itemGrade(it){return it.fixedGrade;}
function gradeBadge(it){return `<span class="grade-dot" style="--grade:${grades[it.grade].color}" aria-hidden="true"></span>`;}
function gradeLegend(){return `<div class="grade-legend" aria-label="品级颜色由低到高">${grades.map(g=>`<span style="--grade:${g.color}"><i></i></span>`).join('')}<small>颜色区分品级</small></div>`;}
let lastRevealed=null;
const cargoTypes=[{name:'01号集装箱',cat:null,price:1500000,w:6,h:9,count:11,tint:'#32c7df',art:0},{name:'02号集装箱',cat:null,price:2500000,w:8,h:9,count:14,tint:'#59b68e',art:1},{name:'03号集装箱',cat:null,price:4000000,w:8,h:12,count:17,tint:'#718ce5',art:2},{name:'04号集装箱',cat:null,price:6000000,w:10,h:12,count:18,tint:'#ee934c',art:3},{name:'05号集装箱',cat:null,price:8000000,w:10,h:15,count:24,tint:'#dd6268',art:4},{name:'06号集装箱',cat:null,price:10000000,w:12,h:15,count:30,tint:'#dfb458',art:5}];
let s,canSave=true;
function newGame(){return {version:2,pricingRevision:3,balanceRevision:CARGO_BALANCE_REVISION,loanRuleRevision:LOAN_RULE_REVISION,cash:START_CASH,loan:freshLoan(),round:1,stock:[],records:[],offers:[],current:null,view:'port'};}
function canonical(it){return itemByKey.get(it.key)||catalog.find(x=>x.name===it.name||(it.sourceId&&x.cat==='电子物品'&&x.sourceId===it.sourceId));}
function normalizeItem(it){const original=canonical(it);return original?{...it,...original,value:original.referencePrice,grade:original.fixedGrade}:null;}
function migrate(old){
 localStorage.setItem('harbor-grid-v1-backup',JSON.stringify(old));
 const next={...newGame(),cash:Math.max(START_CASH,old.cash),round:old.round||1,records:old.records||[],stock:(old.stock||[]).map(normalizeItem).filter(Boolean),migrationNotice:true};
 if(old.current){
  const occupied=Array(old.current.w*old.current.h).fill(false),items=[];
  for(const raw of old.current.items){const it=normalizeItem(raw);if(!it)continue;const pos=fit(occupied,old.current.w,old.current.h,it.w,it.h);if(!pos)continue;mark(occupied,old.current.w,it,pos);items.push({...it,...pos});}
  if(items.length)next.current={...old.current,items};
 }
 for(const r of next.records)r.total=r.sold+next.stock.filter(x=>x.record===r.id).length+(next.current?.id===r.id?next.current.items.filter(x=>!x.revealed).length:0);
 return next;
}
try{
 const cached=JSON.parse(localStorage.getItem(GRID_KEY)),legacy=cached?null:JSON.parse(localStorage.getItem('harbor-grid-v1'));
 s=cached||(legacy?migrate(legacy):newGame());
 if(!Number.isFinite(s.cash)||!Array.isArray(s.offers)||!Array.isArray(s.stock)||!Array.isArray(s.records))s=newGame();
 if(s.pricingRevision!==3){s.cash=Math.max(s.cash,START_CASH);s.pricingRevision=3;s.offers=[];}
 if(s.balanceRevision!==CARGO_BALANCE_REVISION){s.offers=[];s.balanceRevision=CARGO_BALANCE_REVISION;}
 normalizeLoan();
 s.stock=s.stock.map(normalizeItem).filter(Boolean);
 for(const t of [...s.offers,...(s.current?[s.current]:[])])t.items=t.items.map(normalizeItem).filter(Boolean);
 normalizeLoanRules();
}catch{s=newGame();canSave=false;}

function fit(occupied,w,h,iw,ih){const spots=[];for(let y=0;y<=h-ih;y++)for(let x=0;x<=w-iw;x++){let free=true;for(let dy=0;dy<ih;dy++)for(let dx=0;dx<iw;dx++)if(occupied[(y+dy)*w+x+dx])free=false;if(free)spots.push({x,y});}return spots.length?pick(spots):null;}
function pickCatalog(pool,weights){return pickCargoItem(pool,weights);}
function mark(occupied,w,it,pos){for(let dy=0;dy<it.h;dy++)for(let dx=0;dx<it.w;dx++)occupied[(pos.y+dy)*w+pos.x+dx]=true;}
function pack(t,pool,first=null,weights=cargoRiskProfiles[0].normal,required=[]){
 pool=cargoItemPool(t,pool);if(!pool.length)return [];if(first&&!cargoAllowsItem(t,first))first=null;
 if(required.some(it=>!cargoAllowsItem(t,it)))return [];
 const occupied=Array(t.w*t.h).fill(false),items=[];
 for(let i=0;i<t.count;i++){
  let data,pos;
  for(let attempt=0;attempt<12;attempt++){data=i===0&&first?first:i<required.length?required[i]:pickCatalog(pool,weights);pos=fit(occupied,t.w,t.h,data.w,data.h);if(pos)break;}
  if(!pos&&i<required.length)return [];
  if(!pos){const fits=pool.filter(x=>fit(occupied,t.w,t.h,x.w,x.h));if(!fits.length)break;data=pickCatalog(fits,weights);pos=fit(occupied,t.w,t.h,data.w,data.h);}
  mark(occupied,t.w,data,pos);items.push({...data,...pos,value:data.referencePrice,grade:data.fixedGrade,revealed:false});
 }
 return items;
}
function generate(t,index){
 const items=drawBalancedCargo(t,index);items.forEach((it,i)=>it.uid='C'+s.round+'-'+index+'-'+i);
 return {...t,id:'HB-'+String(s.round).padStart(3,'0')+'-'+(index+1),items};
}
function ensure(){if(s.offers.some(t=>t.cat||!Number.isInteger(t.art)))s.offers=[];if(!s.offers.length&&!s.current)s.offers=cargoTypes.map(generate);}
function persist(){try{localStorage.setItem(GRID_KEY,JSON.stringify(s));}catch{canSave=false;}document.getElementById('saveStatus').textContent=canSave?'本机自动存档':'本次进度暂不存档';}
function heading(k,t,p){return `<div class="intro"><div><div class="eyebrow">${k}</div><h1>${t}</h1><p>${p}</p></div><span class="chip">06 号码头 · 第 ${s.round} 批货源</span></div>`;}
function renderGrid(){ensure();persist();document.title='港口盲箱 · 格子开箱';document.getElementById('cash').textContent=money(s.cash);document.getElementById('debtStatus').textContent=s.loan.balance?'未还贷款 '+money(s.loan.balance):'无未还贷款';document.getElementById('day').textContent=`第 ${s.round} 批`;document.getElementById('stockCount').textContent=s.stock.length;document.querySelectorAll('nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===s.view));document.getElementById('game').innerHTML=s.view==='loan'?loanGrid():s.view==='library'?libraryGrid():s.view==='warehouse'?warehouseGrid():s.view==='ledger'?ledgerGrid():s.current?unboxGrid():market();if(typeof initScratch==='function')initScratch();}
function containerVisual(t){const cell=containerArtwork.width/3,row=containerArtwork.height/2;return `<svg class="container-image" viewBox="0 0 ${cell} ${row}" role="img" aria-label="${t.name}" preserveAspectRatio="xMidYMid meet"><svg x="0" y="0" width="${cell}" height="${row}" style="overflow:hidden"><image href="${containerArtwork.src}" x="${-(t.art%3)*cell}" y="${-Math.floor(t.art/3)*row}" width="${containerArtwork.width}" height="${containerArtwork.height}" /></svg></svg>`;}
function market(){
 return heading('CARGO / MARKET','选一箱，揭晓你的运气。','低价箱更容易回本，高价箱保留大幅盈亏。600万及以上每箱至少四件不同的红色物品，分类随机。')+`<div class="cards">${s.offers.map((t,i)=>`<article class="lot container-lot" style="--container-tint:${t.tint}"><div class="container-visual">${containerVisual(t)}<span class="container-number">0${i+1}</span></div><div class="lot-head"><div class="eyebrow">${t.w} × ${t.h} 格 / ${t.items.length} 件货物</div><div class="serial">${t.id}</div></div><div class="lot-body"><h3>${t.name}</h3><p>${cargoRiskProfiles[i].label} · 分类随机 · 回本约${Math.round(cargoBreakEvenChances[i]*100)}%</p><div class="lot-bottom"><div class="price"><small>整箱售价</small><strong>${money(t.price)}</strong></div><button data-buy="${i}" ${s.cash<t.price?'disabled':''}>购买开箱</button></div></div></article>`).join('')}</div><div class="notice">150万、250万箱回本机会约95%，400万约90%，600万约85%，800万、1000万约75%。600万及以上每箱至少四件不同的红色物品；白色、绿色物品只允许3×3或2×4尺寸。回本按整箱标价货值计算，贷款还款另计。分类随机，标价与占格保持不变。</div>${s.cash<cargoTypes[0].price?`<div class="notice negative">现金不足以购买最便宜的箱子。${s.stock.length?'去仓库出售货物补充资金。':'可申请贷款周转，或在页面底部重新开局。'}</div>`:''}<button id="refreshCargo" class="secondary">换一批货源</button> <button data-view="loan" class="secondary">贷款周转</button>`;
}
function buy(i){if(s.current)return;const t=s.offers[i];if(!t||s.cash<t.price)return;s.cash-=t.price;s.current=t;lastSale=null;s.records.push({id:t.id,name:t.name,cost:t.price,revenue:0,total:t.items.length,sold:0,confirmedValue:null,profitRepaymentBase:0});renderGrid();}
function revealGrid(i){const t=s.current;if(!t||!t.items[i]||t.items[i].revealed)return;const it=t.items[i];it.revealed=true;lastRevealed=it.uid;s.stock.push({...it,record:t.id});confirmCargoProfit(t);renderGrid();lastRevealed=null;}
function cargoTile(it,i){const g=grades[it.grade],isLarge=it.w>=2&&it.h>=2;return `<button class="cargo-item grade-tile ${it.revealed?'opened':'scratch-pending'} ${lastRevealed===it.uid?'just-revealed':''}" style="--grade:${g.color};grid-column:${it.x+1} / span ${it.w};grid-row:${it.y+1} / span ${it.h}" data-scratch-item="${i}" ${it.revealed?'disabled':''} aria-label="${it.revealed?escapeHTML(it.name)+' '+money(it.value):'按住拖动，刮开'+it.w+'乘'+it.h+'格包裹；键盘按回车可揭晓'}"><div class="prize-content" ${it.revealed?'':'aria-hidden="true"'}>${itemVisual(it,'tile')}${isLarge?`<span class="cargo-label">${escapeHTML(it.name)}</span>`:''}<small style="font-size:${Math.min(12,Math.max(7,Math.floor((it.w*46-6)/(money(it.value).length*.61))))}px" title="${money(it.value)}">${money(it.value)}</small></div>${it.revealed?'':`<canvas class="scratch-cover" data-scratch="${i}" aria-hidden="true"></canvas>`}</button>`;}
function unboxGrid(){const t=s.current,found=t.items.filter(it=>it.revealed),done=found.length===t.items.length,value=found.reduce((sum,it)=>sum+it.value,0),record=s.records.find(r=>r.id===t.id),profit=value-t.price;
 return heading('UNBOX / SCRATCH',t.name,`${t.id} · 买入 ${money(t.price)} · 按住鼠标左键拖动，刮开包裹。`)+gradeLegend()+`<div class="unbox-layout"><section class="panel"><div class="intro"><h2>集装箱内部</h2><span class="chip">已拆 ${found.length} / ${t.items.length}</span></div><div class="cargo-scroll"><div class="cargo-grid" style="--cols:${t.w};--rows:${t.h}">${t.items.map(cargoTile).join('')}</div></div><p class="grid-hint">沿着包裹刮动，划过的区域才会显露。刮开约一半后，物品会完整揭晓。</p></section><aside class="panel"><div class="eyebrow">RESULT / 收获</div><h2 style="margin-top:12px">${done?'整箱揭晓':'正在刮箱'}</h2><small>已发现总价值</small><div class="auction-price" style="font-size:36px">${money(value)}</div>${done?`<div class="notice">整箱盈亏<br><strong class="${profit>=0?'positive':'negative'}" style="font-size:25px">${profit>=0?'+':''}${money(profit)}</strong></div>`:'<p>边框颜色区分物品品级，标价与截图一致。</p>'}${saleNotice()}${loanHint()}<div class="actions">${!done?'<button id="revealAll" class="secondary">快速揭晓整箱</button>':`<button id="sellCargo" ${record.sold===record.total?'disabled':''}>${record.sold===record.total?'整箱已出售':'出售本箱货物'}</button><button id="finishCargo" class="secondary">继续选箱</button>`}</div><div class="findings" aria-live="polite">${found.slice().reverse().map(it=>`<div class="finding" style="--grade:${grades[it.grade].color}"><span><span class="finding-image-wrap">${itemVisual(it,'finding')}<span>${it.name}</span></span><small>${it.cat} · ${it.w}×${it.h} · ${it.w*it.h}格</small></span><strong>${money(it.value)}</strong></div>`).join('')||'<p>按住问号区域，刮出第一件宝贝。</p>'}</div></aside></div>`;}

function sellItem(uid){const index=s.stock.findIndex(it=>it.uid===uid);if(index<0)return null;const it=s.stock[index],r=s.records.find(r=>r.id===it.record);if(r){r.revenue+=it.value;r.sold++;}const receipt=settleLoanSale(it.value,r);s.cash+=receipt.cash;if(r)r.repaid=(r.repaid||0)+receipt.repaid;s.stock.splice(index,1);return receipt;}
function warehouseGrid(){const value=s.stock.reduce((sum,it)=>sum+it.value,0);return heading('WAREHOUSE / STOCK','开出的货物，都在这里。','留下收藏，或者出售换回现金。每件物品按截图标价出售。')+saleNotice()+loanHint()+`<div class="intro"><span class="chip">${s.stock.length} 件 · 总售价 ${money(value)}</span>${s.stock.length?'<button id="sellAllStock">全部出售</button>':''}</div>`+(s.stock.length?`<div class="cards">${s.stock.map(it=>`<div class="item graded-stock" style="--grade:${grades[it.grade].color}">${itemVisual(it,'stock')}<h3>${it.name}</h3><p>${it.cat} · ${it.w}×${it.h} · ${it.w*it.h}格</p><small>${it.record}</small><div class="value">${money(it.value)}</div><button data-sell-item="${it.uid}" class="secondary">出售</button></div>`).join('')}</div>`:'<div class="empty"><h2>仓库还空着</h2><p>买一箱货，拆开看看。</p><button data-view="port">返回集装箱市场</button></div>');}
function ledgerGrid(){const settled=s.records.filter(r=>r.sold===r.total),profit=settled.reduce((sum,r)=>sum+r.revenue-r.cost,0);return heading('LEDGER / HISTORY','赚了多少，亏了多少。','盈亏按货物原价结算；偿还本金会减少现金到账，但不重复计入货物亏损。')+saleNotice()+loanHint()+`<div class="stats"><div class="stat"><small>可用资金</small><strong>${money(s.cash)}</strong></div><div class="stat"><small>仓库售价</small><strong>${money(s.stock.reduce((sum,it)=>sum+it.value,0))}</strong></div><div class="stat"><small>已结算盈亏</small><strong class="${profit>=0?'positive':'negative'}">${profit>=0?'+':''}${money(profit)}</strong></div></div>`+(s.records.length?`<div class="panel table-wrap"><table><thead><tr><th>集装箱</th><th>买入价</th><th>货物收入</th><th>自动还贷</th><th>实际到账</th><th>货物盈亏</th></tr></thead><tbody>${s.records.slice().reverse().map(r=>`<tr><td>${r.id}<br><small>${r.name}</small></td><td>${money(r.cost)}</td><td>${money(r.revenue)}</td><td>${money(r.repaid||0)}</td><td>${money(r.revenue-(r.repaid||0))}</td><td class="${r.sold===r.total?(r.revenue>=r.cost?'positive':'negative'):''}">${r.sold===r.total?((r.revenue>=r.cost?'+':'')+money(r.revenue-r.cost)):`已售 ${r.sold}/${r.total}`}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty"><h2>你的第一箱，尚未开始。</h2></div>');}

function itemCard(it){return `<div class="item graded-stock" style="--grade:${grades[it.fixedGrade].color}">${itemVisual(it,'stock')}<h3>${escapeHTML(it.name)}</h3><p>${it.cat} · ${it.w}×${it.h} · ${it.w*it.h}格</p><small>截图标价</small><div class="value">${money(it.referencePrice)}</div></div>`;}
function libraryItems(){return catalog.filter(it=>(!libraryCategory||it.cat===libraryCategory)&&(!librarySearch||it.name.toLocaleLowerCase().includes(librarySearch.toLocaleLowerCase())));}
function libraryGrid(){const items=libraryItems();return heading('CATALOG / ITEMS','物品图鉴','完整保留截图标价，边框颜色区分品级。格数表示物品自身占格。')+gradeLegend()+`<div class="library-controls"><label>分类<select id="libraryCategory"><option value="">全部分类</option>${categories.map(c=>`<option value="${c}" ${c===libraryCategory?'selected':''}>${c}（${catalog.filter(it=>it.cat===c).length}）</option>`).join('')}</select></label><label>查找物品<input id="librarySearch" type="search" placeholder="输入物品名称" value="${escapeHTML(librarySearch)}"></label><span class="chip" id="libraryCount">${items.length} / ${catalog.length} 件</span></div><div class="cards" id="libraryResults">${items.map(itemCard).join('')||'<div class="empty">没有符合条件的物品</div>'}</div>`;}
function updateLibrary(){const items=libraryItems();document.getElementById('libraryCount').textContent=`${items.length} / ${catalog.length} 件`;document.getElementById('libraryResults').innerHTML=items.map(itemCard).join('')||'<div class="empty">没有符合条件的物品</div>';}
document.addEventListener('change',e=>{if(e.target.id==='libraryCategory'){libraryCategory=e.target.value;updateLibrary();}});
document.addEventListener('input',e=>{if(e.target.id==='librarySearch'){librarySearch=e.target.value;updateLibrary();}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.view){s.view=b.dataset.view;renderGrid();}else if(b.dataset.loan!==undefined){if(borrowLoan(Number(b.dataset.loan)))renderGrid();}else if(b.dataset.buy!==undefined)buy(Number(b.dataset.buy));else if(b.dataset.sellItem){sellItems([b.dataset.sellItem]);renderGrid();}else if(b.id==='revealAll'){s.current.items.forEach(it=>{if(!it.revealed){it.revealed=true;s.stock.push({...it,record:s.current.id});}});confirmCargoProfit(s.current);renderGrid();}else if(b.id==='sellCargo'){sellItems(s.stock.filter(it=>it.record===s.current.id).map(it=>it.uid));renderGrid();}else if(b.id==='sellAllStock'){sellItems(s.stock.map(it=>it.uid));renderGrid();}else if(b.id==='finishCargo'){s.current=null;s.round++;s.offers=[];renderGrid();}else if(b.id==='refreshCargo'){s.round++;s.offers=[];renderGrid();}else if(b.id==='helpBtn')document.getElementById('help').showModal();else if(b.id==='closeHelp')document.getElementById('help').close();else if(b.id==='resetBtn')document.getElementById('resetDialog').showModal();else if(b.id==='cancelReset')document.getElementById('resetDialog').close();else if(b.id==='confirmReset'){s=newGame();lastSale=null;document.getElementById('resetDialog').close();renderGrid();}});
renderGrid();
