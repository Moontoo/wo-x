const GRID_KEY='harbor-grid-screenshot-v2',START_CASH=3000000;
const itemByKey=new Map(catalog.map(it=>[it.key,it])),categories=[...new Set(catalog.map(it=>it.cat))];
let libraryCategory='',librarySearch='',libraryStatsOnly=false;
const sizes=[[1,1],[1,2],[1,3],[2,2],[2,3],[2,4],[3,3],[3,4],[4,4]];
const grades=['#e6edf4','#75df9a','#70b4ff','#c290ff','#ffcc59','#ff737d'].map(color=>({color}));
function itemGrade(it){return it.fixedGrade;}
function gradeBadge(it){return `<span class="grade-dot" style="--grade:${grades[it.grade].color}" aria-hidden="true"></span>`;}
function gradeLegend(){return `<div class="grade-legend" aria-label="品级颜色由低到高">${grades.map(g=>`<span style="--grade:${g.color}"><i></i></span>`).join('')}<small>颜色区分品级</small></div>`;}
let lastRevealed=null,lastRecovery=null,stopLossTarget=null;
const cargoTypes=[{name:'01号集装箱',cat:null,price:1500000,w:6,h:9,count:11,tint:'#32c7df',art:0},{name:'02号集装箱',cat:null,price:2500000,w:8,h:9,count:14,tint:'#59b68e',art:1},{name:'03号集装箱',cat:null,price:4000000,w:8,h:12,count:17,tint:'#718ce5',art:2},{name:'04号集装箱',cat:null,price:6000000,w:10,h:12,count:18,tint:'#ee934c',art:3},{name:'05号集装箱',cat:null,price:8000000,w:10,h:15,count:24,tint:'#dd6268',art:4},{name:'06号集装箱',cat:null,price:10000000,w:12,h:15,count:30,tint:'#dfb458',art:5},{name:'07号炫彩集装箱',cat:null,price:50000000,w:16,h:52,count:50,tint:'#c69bff',art:6,unrestricted:true}];
let s,canSave=true;
function newGame(){return {version:2,pricingRevision:3,balanceRevision:CARGO_BALANCE_REVISION,loanRuleRevision:LOAN_RULE_REVISION,discoveryRevision:1,redFinds:{},cash:START_CASH,loan:freshLoan(),round:1,stock:[],records:[],offers:[],current:null,view:'port'};}
function canonical(it){return itemByKey.get(it.key)||catalog.find(x=>x.name===it.name||(it.sourceId&&x.cat==='电子物品'&&x.sourceId===it.sourceId));}
function normalizeItem(it){const original=canonical(it);return original?{...it,...original,value:original.referencePrice,grade:original.fixedGrade}:null;}
function migrate(old){
 localStorage.setItem('harbor-grid-v1-backup',JSON.stringify(old));
 const next={...newGame(),discoveryRevision:0,cash:Math.max(START_CASH,old.cash),round:old.round||1,records:old.records||[],stock:(old.stock||[]).map(normalizeItem).filter(Boolean),migrationNotice:true};
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
 normalizeDiscoveryStats();
}catch{s=newGame();canSave=false;}

// Existing saves can only recover item-level history still present in stock/current cargo.
function normalizeDiscoveryStats(){
 const counts={};
 for(const it of catalog){const count=s.redFinds?.[it.key];if(it.fixedGrade===5&&Number.isSafeInteger(count)&&count>0)counts[it.key]=count;}
 s.redFinds=counts;
 if(s.discoveryRevision!==1){
  s.redFinds={};const seen=new Set();
  for(const it of [...s.stock,...(s.current?s.current.items.filter(it=>it.revealed):[])]){
   if(!it.uid||seen.has(it.uid))continue;seen.add(it.uid);recordDiscovery(it);
  }
  s.discoveryRevision=1;s.discoveryHistoryPartial=true;
 }
}
function recordDiscovery(it){const original=canonical(it);if(original?.fixedGrade===5)s.redFinds[original.key]=(s.redFinds[original.key]||0)+1;}
function revealCargoItem(t,i){
 const it=t.items[i];if(!it||it.revealed)return false;
 it.revealed=true;recordDiscovery(it);s.stock.push({...it,record:t.id});return true;
}
function discoverySummary(){
 const reds=catalog.filter(it=>it.fixedGrade===5),opened=reds.filter(it=>s.redFinds[it.key]>0);
 return {kinds:opened.length,available:reds.length,total:opened.reduce((n,it)=>n+s.redFinds[it.key],0),value:opened.reduce((n,it)=>n+s.redFinds[it.key]*it.referencePrice,0)};
}
function discoveryPanel(){const stats=discoverySummary();return `<section class="discovery-panel" aria-label="开出统计"><div class="intro"><div><div class="eyebrow">DISCOVERIES / 开出统计</div><h2><i class="discovery-dot" aria-hidden="true"></i>珍藏收获</h2></div><p>每揭晓一件计一次，出售或止损后仍保留。</p></div><div class="stats"><div class="stat"><small>累计开出</small><strong>${stats.total}<em> 件</em></strong></div><div class="stat"><small>已开出种类</small><strong>${stats.kinds}<em> / ${stats.available}</em></strong></div><div class="stat"><small>累计标价价值</small><strong>${money(stats.value)}</strong></div></div>${s.discoveryHistoryPartial?'<p class="discovery-note">旧存档已补记仓库及当前箱内已揭晓的物品；更早已售出、无明细的物品无法追溯。</p>':''}</section>`;}
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
 return {...t,...(t.unrestricted?{h:Math.max(...items.map(it=>it.y+it.h))}:{}),id:'HB-'+String(s.round).padStart(3,'0')+'-'+(index+1),items};
}
function ensure(){if(s.offers.some(t=>t.cat||!Number.isInteger(t.art)))s.offers=[];if(!s.offers.length&&!s.current)s.offers=cargoTypes.map(generate);}
function persist(){try{localStorage.setItem(GRID_KEY,JSON.stringify(s));}catch{canSave=false;}document.getElementById('saveStatus').textContent=canSave?'本机自动存档':'本次进度暂不存档';}
function heading(k,t,p){return `<div class="intro"><div><div class="eyebrow">${k}</div><h1>${t}</h1><p>${p}</p></div><span class="chip">06 号码头 · 第 ${s.round} 批货源</span></div>`;}
function renderGrid(){ensure();persist();document.title='洲洲盲盒 · 格子开箱';document.getElementById('cash').textContent=money(s.cash);document.getElementById('debtStatus').textContent=s.loan.balance?'未还贷款 '+money(s.loan.balance):'无未还贷款';document.getElementById('day').textContent=`第 ${s.round} 批`;document.getElementById('stockCount').textContent=s.stock.length;document.querySelectorAll('nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===s.view));document.getElementById('game').innerHTML=s.view==='online'?'<div class="empty">正在连接朋友的房间…</div>':s.view==='loan'?loanGrid():s.view==='library'?libraryGrid():s.view==='warehouse'?warehouseGrid():s.view==='ledger'?ledgerGrid():s.current?unboxGrid():market();if(s.view==='online'&&typeof onlineRender==='function')onlineRender();else if(s.view!=='online'&&typeof initScratch==='function')initScratch();document.querySelectorAll('[data-online-open]').forEach(b=>b.classList.toggle('active',s.view==='online'));}
function containerVisual(t){
 const cell=containerArtwork.width/3,row=containerArtwork.height/2,art=t.unrestricted?5:t.art;
 const image=`<image href="${containerArtwork.src}" x="${-(art%3)*cell}" y="${-Math.floor(art/3)*row}" width="${containerArtwork.width}" height="${containerArtwork.height}" />`;
 const id='rainbow-'+t.id;
 const colour=t.unrestricted?`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff6fba"/><stop offset=".2" stop-color="#ffb34c"/><stop offset=".4" stop-color="#83efb0"/><stop offset=".6" stop-color="#58d8ff"/><stop offset=".8" stop-color="#9886ff"/><stop offset="1" stop-color="#f285e1"/></linearGradient><mask id="${id}-mask" x="0" y="0" width="${cell}" height="${row}" style="mask-type:alpha">${image}</mask></defs><rect width="${cell}" height="${row}" fill="url(#${id})" mask="url(#${id}-mask)" style="mix-blend-mode:color"/>`:'';
 return `<svg class="container-image${t.unrestricted?' rainbow-image':''}" viewBox="0 0 ${cell} ${row}" role="img" aria-label="${t.name}" preserveAspectRatio="xMidYMid meet"><svg x="0" y="0" width="${cell}" height="${row}" style="overflow:hidden;isolation:isolate">${image}${colour}</svg></svg>`;
}
function cargoDescription(t,index){return t.unrestricted?'50件全库等概率独立抽取 · 允许重复 · 无保底':cargoRiskProfiles[index].label+' · 分类随机 · 回本约'+Math.round(cargoBreakEvenChances[index]*100)+'%';}
function market(){
 return heading('CARGO / MARKET','选一箱，揭晓你的运气。','低价箱更容易回本，高价箱保留大幅盈亏。600万、800万、1000万箱每箱至少四件不同的红色物品，分类随机。')+recoveryNotice()+`<section class="online-entry"><div><strong>朋友联机 · 轮廓竞拍</strong><p>2–6人 · 每人5000万独立资金 · 每箱24件</p></div><div class="actions"><button data-online-create>创建房间</button><button class="secondary" data-online-join>加入房间</button></div></section><div class="cards">${s.offers.map((t,i)=>`<article class="lot container-lot${t.unrestricted?' rainbow-lot':''}" style="--container-tint:${t.tint}"><div class="container-visual">${containerVisual(t)}<span class="container-number">0${i+1}</span></div><div class="lot-head"><div class="eyebrow">${t.w} × ${t.h} 格 / ${t.items.length} 件货物</div><div class="serial">${t.id}</div></div><div class="lot-body"><h3>${t.name}</h3><p>${cargoDescription(t,i)}</p><div class="lot-bottom"><div class="price"><small>整箱售价</small><strong>${money(t.price)}</strong></div><button data-buy="${i}" ${s.cash<t.price?'disabled':''}>购买开箱</button></div></div></article>`).join('')}</div><div class="notice">150万、250万箱回本机会约95%，400万约90%，600万约85%，800万、1000万约75%。600万、800万、1000万箱每箱至少四件不同的红色物品；白色、绿色物品只允许3×3或2×4尺寸。回本按整箱标价货值计算，贷款还款另计。5000万炫彩箱含50件物品，全库等概率独立抽取，可重复；不设回本率、红色保底、品级或重复数量限制。标价与占格保持不变。</div>${s.cash<cargoTypes[0].price?`<div class="notice negative">现金不足以购买最便宜的箱子。${s.stock.length?'去仓库出售货物补充资金。':'可申请贷款周转，或在页面底部重新开局。'}</div>`:''}<button id="refreshCargo" class="secondary">换一批货源</button> <button data-view="loan" class="secondary">贷款周转</button>`;
}
function buy(i){if(s.current)return;const t=s.offers[i];if(!t||s.cash<t.price)return;s.cash-=t.price;s.current=t;lastSale=null;lastRecovery=null;s.records.push({id:t.id,name:t.name,cost:t.price,revenue:0,total:t.items.length,sold:0,confirmedValue:null,profitRepaymentBase:0});renderGrid();}
function stopLossStatus(){
 const t=s.current,record=t&&s.records.find(r=>r.id===t.id);
 if(!t||!record||record.stopLoss)return {eligible:false,reason:'当前没有可回收的集装箱。'};
 const revealed=t.items.filter(it=>it.revealed||(typeof scratchPendingReveals!=='undefined'&&scratchPendingReveals.has(it.uid))).length,limit=Math.floor(t.items.length/3),refund=Math.floor(t.price*85/100);
 const reason=revealed>limit?'已揭晓超过三分之一，不能回收。':record.sold>0?'本箱已有物品出售，不能整箱回收。':'';
 return {eligible:!reason,reason,record,t,revealed,limit,refund};
}
function stopLossControls(){const info=stopLossStatus();return `<button id="stopLoss" class="secondary stop-loss" ${info.eligible?'':'disabled'} title="${info.reason||('按箱价85%回收，到账 '+money(info.refund))}">及时止损</button>`;}
function updateStopLossControls(){const info=stopLossStatus(),button=document.getElementById('stopLoss');if(button){button.disabled=!info.eligible;button.title=info.reason||('按箱价85%回收，到账 '+money(info.refund));}}
function requestStopLoss(){const info=stopLossStatus();if(!info.eligible)return false;stopLossTarget=info.t.id;document.getElementById('stopLossDetails').textContent=`已揭晓 ${info.revealed}/${info.t.items.length} 件，最多允许 ${info.limit} 件。系统将回收本箱全部货物，包括已刮出的物品；到账 ${money(info.refund)}（买箱价的85%），本箱亏损 ${money(info.t.price-info.refund)}，不扣贷款。`;document.getElementById('stopLossDialog').showModal();return true;}
function recoverCargo(expectedId){
 const info=stopLossStatus();if(!info.eligible||info.t.id!==expectedId)return false;
 const {t,record,refund}=info;s.cash+=refund;s.stock=s.stock.filter(it=>it.record!==t.id);
 record.revenue=refund;record.confirmedValue=refund;record.profitRepaymentBase=0;record.stopLoss={refund,revealed:info.revealed,total:t.items.length};
 lastRecovery={name:t.name,refund,loss:t.price-refund};lastSale=null;lastRevealed=null;stopLossTarget=null;
 s.current=null;s.round++;s.offers=[];s.view='port';renderGrid();return true;
}
function recoveryNotice(){return lastRecovery?`<div class="notice" role="status">已及时止损：${lastRecovery.name}全部货物已交回系统，到账 ${money(lastRecovery.refund)}，本箱亏损 ${money(lastRecovery.loss)}。贷款未扣款。</div>`:'';}
function revealGrid(i){const t=s.current;if(!t||!revealCargoItem(t,i))return;lastRevealed=t.items[i].uid;confirmCargoProfit(t);renderGrid();lastRevealed=null;}
function cargoTile(it,i){const g=grades[it.grade],isLarge=it.w>=2&&it.h>=2;return `<button class="cargo-item grade-tile ${it.revealed?'opened':'scratch-pending'} ${lastRevealed===it.uid?'just-revealed':''}" style="--grade:${g.color};grid-column:${it.x+1} / span ${it.w};grid-row:${it.y+1} / span ${it.h}" data-scratch-item="${i}" ${it.revealed?'disabled':''} aria-label="${it.revealed?escapeHTML(it.name)+' '+money(it.value):'按住拖动，刮开'+it.w+'乘'+it.h+'格包裹；键盘按回车可揭晓'}"><div class="prize-content" ${it.revealed?'':'aria-hidden="true"'}>${itemVisual(it,'tile')}${isLarge?`<span class="cargo-label">${escapeHTML(it.name)}</span>`:''}<small style="font-size:${Math.min(12,Math.max(7,Math.floor((it.w*46-6)/(money(it.value).length*.61))))}px" title="${money(it.value)}">${money(it.value)}</small></div>${it.revealed?'':`<canvas class="scratch-cover" data-scratch="${i}" aria-hidden="true"></canvas>`}</button>`;}
function unboxGrid(){const t=s.current,found=t.items.filter(it=>it.revealed),done=found.length===t.items.length,value=found.reduce((sum,it)=>sum+it.value,0),record=s.records.find(r=>r.id===t.id),profit=value-t.price;
 return heading('UNBOX / SCRATCH',t.name,`${t.id} · 买入 ${money(t.price)} · 按住鼠标左键拖动，刮开包裹。`)+gradeLegend()+`<div class="unbox-layout"><section class="panel"><div class="intro"><h2>集装箱内部</h2><div class="unbox-progress">${stopLossControls()}<span class="chip">已拆 ${found.length} / ${t.items.length}</span></div></div><div class="cargo-scroll"><div class="cargo-grid" style="--cols:${t.w};--rows:${t.h}">${t.items.map(cargoTile).join('')}</div></div><p class="grid-hint">沿着包裹刮动，划过的区域才会显露。刮开约一半后，物品会完整揭晓。</p><p class="grid-hint">及时止损：揭晓不超过 ${Math.floor(t.items.length/3)} 件且本箱未卖货时，可按买箱价85%回收（${money(Math.floor(t.price*85/100))}）。已刮出的货物也会交回系统。</p></section><aside class="panel"><div class="eyebrow">RESULT / 收获</div><h2 style="margin-top:12px">${done?'整箱揭晓':'正在刮箱'}</h2><small>已发现总价值</small><div class="auction-price" style="font-size:36px">${money(value)}</div>${done?`<div class="notice">整箱盈亏<br><strong class="${profit>=0?'positive':'negative'}" style="font-size:25px">${profit>=0?'+':''}${money(profit)}</strong></div>`:'<p>边框颜色区分物品品级，标价与截图一致。</p>'}${saleNotice()}${loanHint()}<div class="actions">${!done?'<button id="revealAll" class="secondary">快速揭晓整箱</button>':`<button id="sellCargo" ${record.sold===record.total?'disabled':''}>${record.sold===record.total?'整箱已出售':'出售本箱货物'}</button><button id="finishCargo" class="secondary">继续选箱</button>`}</div><div class="findings" aria-live="polite">${found.slice().reverse().map(it=>`<div class="finding" style="--grade:${grades[it.grade].color}"><span><span class="finding-image-wrap">${itemVisual(it,'finding')}<span>${it.name}</span></span><small>${it.cat} · ${it.w}×${it.h} · ${it.w*it.h}格</small></span><strong>${money(it.value)}</strong></div>`).join('')||'<p>按住问号区域，刮出第一件宝贝。</p>'}</div></aside></div>`;}

function sellItem(uid){const index=s.stock.findIndex(it=>it.uid===uid);if(index<0)return null;const it=s.stock[index],r=s.records.find(r=>r.id===it.record);if(r){r.revenue+=it.value;r.sold++;}const receipt=settleLoanSale(it.value,r);s.cash+=receipt.cash;if(r)r.repaid=(r.repaid||0)+receipt.repaid;s.stock.splice(index,1);return receipt;}
function warehouseGrid(){const value=s.stock.reduce((sum,it)=>sum+it.value,0);return heading('WAREHOUSE / STOCK','开出的货物，都在这里。','留下收藏，或者出售换回现金。每件物品按截图标价出售。')+saleNotice()+loanHint()+`<div class="intro"><span class="chip">${s.stock.length} 件 · 总售价 ${money(value)}</span>${s.stock.length?'<button id="sellAllStock">全部出售</button>':''}</div>`+(s.stock.length?`<div class="cards">${s.stock.map(it=>`<div class="item graded-stock" style="--grade:${grades[it.grade].color}">${itemVisual(it,'stock')}<h3>${it.name}</h3><p>${it.cat} · ${it.w}×${it.h} · ${it.w*it.h}格</p><small>${it.record}</small><div class="value">${money(it.value)}</div><button data-sell-item="${it.uid}" class="secondary">出售</button></div>`).join('')}</div>`:'<div class="empty"><h2>仓库还空着</h2><p>买一箱货，拆开看看。</p><button data-view="port">返回集装箱市场</button></div>');}
function ledgerGrid(){const settled=s.records.filter(r=>r.stopLoss||r.sold===r.total),profit=settled.reduce((sum,r)=>sum+r.revenue-r.cost,0);return heading('LEDGER / HISTORY','赚了多少，亏了多少。','盈亏按货物原价结算；偿还本金会减少现金到账，但不重复计入货物亏损。')+saleNotice()+loanHint()+`<div class="stats"><div class="stat"><small>可用资金</small><strong>${money(s.cash)}</strong></div><div class="stat"><small>仓库售价</small><strong>${money(s.stock.reduce((sum,it)=>sum+it.value,0))}</strong></div><div class="stat"><small>已结算盈亏</small><strong class="${profit>=0?'positive':'negative'}">${profit>=0?'+':''}${money(profit)}</strong></div></div>`+(s.records.length?`<div class="panel table-wrap"><table><thead><tr><th>集装箱</th><th>买入价</th><th>出售 / 回收收入</th><th>自动还贷</th><th>实际到账</th><th>货物盈亏</th></tr></thead><tbody>${s.records.slice().reverse().map(r=>`<tr><td>${r.id}<br><small>${r.name}${r.stopLoss?' · 已止损回收':''}</small></td><td>${money(r.cost)}</td><td>${money(r.revenue)}</td><td>${money(r.repaid||0)}</td><td>${money(r.revenue-(r.repaid||0))}</td><td class="${r.stopLoss||r.sold===r.total?(r.revenue>=r.cost?'positive':'negative'):''}">${r.stopLoss||r.sold===r.total?((r.revenue>=r.cost?'+':'')+money(r.revenue-r.cost)):`已售 ${r.sold}/${r.total}`}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty"><h2>你的第一箱，尚未开始。</h2></div>');}

function itemCard(it){return `<div class="item graded-stock" style="--grade:${grades[it.fixedGrade].color}">${itemVisual(it,'stock')}<h3>${escapeHTML(it.name)}</h3><p>${it.cat} · ${it.w}×${it.h} · ${it.w*it.h}格</p><small>截图标价</small><div class="value">${money(it.referencePrice)}</div>${it.fixedGrade===5?`<div class="discovery-count ${s.redFinds[it.key]?'discovered':''}"><i class="discovery-dot" aria-hidden="true"></i><span>累计开出 <strong>${s.redFinds[it.key]||0}</strong> 次</span></div>`:''}</div>`;}
function libraryItems(){return catalog.filter(it=>(!libraryStatsOnly||it.fixedGrade===5)&&(!libraryCategory||it.cat===libraryCategory)&&(!librarySearch||it.name.toLocaleLowerCase().includes(librarySearch.toLocaleLowerCase())));}
function libraryGrid(){const items=libraryItems();return heading('CATALOG / ITEMS','物品图鉴','完整保留截图标价，边框颜色区分品级。格数表示物品自身占格。')+gradeLegend()+discoveryPanel()+`<div class="library-controls"><label>分类<select id="libraryCategory"><option value="">全部分类</option>${categories.map(c=>`<option value="${c}" ${c===libraryCategory?'selected':''}>${c}（${catalog.filter(it=>it.cat===c).length}）</option>`).join('')}</select></label><label>查找物品<input id="librarySearch" type="search" placeholder="输入物品名称" value="${escapeHTML(librarySearch)}"></label><label class="discovery-filter"><input id="libraryStatsOnly" type="checkbox" ${libraryStatsOnly?'checked':''}><i class="discovery-dot" aria-hidden="true"></i>仅看统计物品</label><span class="chip" id="libraryCount">${items.length} / ${catalog.length} 件</span></div><div class="cards" id="libraryResults">${items.map(itemCard).join('')||'<div class="empty">没有符合条件的物品</div>'}</div>`;}
function updateLibrary(){const items=libraryItems();document.getElementById('libraryCount').textContent=`${items.length} / ${catalog.length} 件`;document.getElementById('libraryResults').innerHTML=items.map(itemCard).join('')||'<div class="empty">没有符合条件的物品</div>';}
document.addEventListener('change',e=>{if(e.target.id==='libraryCategory'){libraryCategory=e.target.value;updateLibrary();}else if(e.target.id==='libraryStatsOnly'){libraryStatsOnly=e.target.checked;updateLibrary();}});
document.addEventListener('input',e=>{if(e.target.id==='librarySearch'){librarySearch=e.target.value;updateLibrary();}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.view){s.view=b.dataset.view;renderGrid();}else if(b.dataset.loan!==undefined){if(borrowLoan(Number(b.dataset.loan)))renderGrid();}else if(b.dataset.buy!==undefined)buy(Number(b.dataset.buy));else if(b.dataset.sellItem){sellItems([b.dataset.sellItem]);renderGrid();}else if(b.id==='stopLoss'){requestStopLoss();}else if(b.id==='cancelStopLoss'){stopLossTarget=null;document.getElementById('stopLossDialog').close();}else if(b.id==='confirmStopLoss'){const expected=stopLossTarget;document.getElementById('stopLossDialog').close();if(!recoverCargo(expected)){stopLossTarget=null;renderGrid();}}else if(b.id==='revealAll'){s.current.items.forEach((it,i)=>revealCargoItem(s.current,i));confirmCargoProfit(s.current);renderGrid();}else if(b.id==='sellCargo'){sellItems(s.stock.filter(it=>it.record===s.current.id).map(it=>it.uid));renderGrid();}else if(b.id==='sellAllStock'){sellItems(s.stock.map(it=>it.uid));renderGrid();}else if(b.id==='finishCargo'){s.current=null;s.round++;s.offers=[];renderGrid();}else if(b.id==='refreshCargo'){s.round++;s.offers=[];renderGrid();}else if(b.id==='helpBtn')document.getElementById('help').showModal();else if(b.id==='closeHelp')document.getElementById('help').close();else if(b.id==='resetBtn')document.getElementById('resetDialog').showModal();else if(b.id==='cancelReset')document.getElementById('resetDialog').close();else if(b.id==='confirmReset'){s=newGame();lastSale=null;lastRecovery=null;stopLossTarget=null;document.getElementById('resetDialog').close();renderGrid();}});
renderGrid();
