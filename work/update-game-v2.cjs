const fs=require('fs'),root='outputs/harbor-bid/dist/';
let js=fs.readFileSync(root+'grid.js','utf8');
function replaceFunction(name,source){const start=js.indexOf('function '+name+'(');if(start<0)throw Error(name);let end=js.indexOf('\nfunction ',start+1);if(end<0)throw Error('end '+name);js=js.slice(0,start)+source+'\n'+js.slice(end+1);}
js=js.replace("const GRID_KEY='harbor-grid-v1';","const GRID_KEY='harbor-grid-screenshot-v2',START_CASH=250000;\nconst itemByKey=new Map(catalog.map(it=>[it.key,it])),categories=[...new Set(catalog.map(it=>it.cat))];\nlet libraryCategory='',librarySearch='';");
js=js.replace(/^const grades=.*$/m,"const grades=['#e6edf4','#75df9a','#70b4ff','#c290ff','#ffcc59','#ff737d'].map(color=>({color}));");
replaceFunction('itemGrade','function itemGrade(it){return it.fixedGrade;}');
replaceFunction('gradeBadge','function gradeBadge(it){return `<span class="grade-dot" style="--grade:${grades[it.grade].color}" aria-hidden="true"></span>`;}');
js=js.replace(/^function gradeLegend.*$/m,'function gradeLegend(){return `<div class="grade-legend" aria-label="品级颜色由低到高">${grades.map(g=>`<span style="--grade:${g.color}"><i></i></span>`).join(\'\')}<small>颜色区分品级</small></div>`;}');
js=js.replace(/^const cargoTypes=.*$/m,"const cargoTypes=[{name:'家居物品箱',cat:'家居物品',price:50000,w:6,h:6,count:7},{name:'电子物品箱',cat:'电子物品',price:250000,w:8,h:6,count:9},{name:'工艺藏品箱',cat:'工艺藏品',price:600000,w:8,h:8,count:11},{name:'装备物资箱',cat:'装备',price:1000000,w:10,h:8,count:12},{name:'精品混装箱',cat:null,price:1800000,w:10,h:10,count:16},{name:'远洋神秘箱',cat:null,price:4500000,w:12,h:10,count:20}];");
js=js.replace(/^const largeNames=.*\r?\n/m,'');
js=js.replace('cash:5000','version:2,cash:START_CASH');
const loadStart=js.indexOf('try{s=JSON.parse'),loadEnd=js.indexOf('\nfunction fit(',loadStart);
js=js.slice(0,loadStart)+`function canonical(it){return itemByKey.get(it.key)||catalog.find(x=>x.name===it.name||(it.sourceId&&x.cat==='电子物品'&&x.sourceId===it.sourceId));}
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
 s.stock=s.stock.map(normalizeItem).filter(Boolean);
 for(const t of [...s.offers,...(s.current?[s.current]:[])])t.items=t.items.map(normalizeItem).filter(Boolean);
}catch{s=newGame();canSave=false;}
`+js.slice(loadEnd);
replaceFunction('pickElectronic',`function pickCatalog(pool){const weights=[18,38,26,12,5,1],available=grades.map((_,i)=>pool.filter(it=>it.fixedGrade===i));let roll=Math.random()*weights.reduce((n,v,i)=>n+(available[i].length?v:0),0);for(let i=0;i<weights.length;i++){if(!available[i].length)continue;roll-=weights[i];if(roll<0)return pick(available[i]);}return pick(pool);}
function mark(occupied,w,it,pos){for(let dy=0;dy<it.h;dy++)for(let dx=0;dx<it.w;dx++)occupied[(pos.y+dy)*w+pos.x+dx]=true;}
function pack(t,pool,first){
 const occupied=Array(t.w*t.h).fill(false),items=[];
 for(let i=0;i<t.count;i++){
  let data,pos;
  for(let attempt=0;attempt<12;attempt++){data=i===0&&first?first:pickCatalog(pool);pos=fit(occupied,t.w,t.h,data.w,data.h);if(pos)break;}
  if(!pos){const fits=pool.filter(x=>fit(occupied,t.w,t.h,x.w,x.h));if(!fits.length)break;data=pickCatalog(fits);pos=fit(occupied,t.w,t.h,data.w,data.h);}
  mark(occupied,t.w,data,pos);items.push({...data,...pos,value:data.referencePrice,grade:data.fixedGrade,revealed:false});
 }
 return items;
}`);
replaceFunction('generate',`function generate(t,index){
 const pool=t.cat?catalog.filter(it=>it.cat===t.cat):catalog,target=t.price*pick([.35,.55,.75,.9,1.1,1.3,1.5,2.3])*rand(85,115)/100;
 let items,best=Infinity;const jackpot=Math.random()<1/80,rare=pool.filter(x=>x.fixedGrade===5);
 if(jackpot&&rare.length)items=pack(t,pool,pick(rare));
 else for(let attempt=0;attempt<12;attempt++){const candidate=pack(t,pool),difference=Math.abs(candidate.reduce((n,it)=>n+it.value,0)-target);if(difference<best){items=candidate;best=difference;}}
 items.forEach((it,i)=>it.uid='C'+s.round+'-'+index+'-'+i);
 return {...t,id:'HB-'+String(s.round).padStart(3,'0')+'-'+(index+1),items};
}`);
replaceFunction('ensure','function ensure(){if(!s.offers.length&&!s.current)s.offers=cargoTypes.map(generate);}');
js=js.replace("s.view==='warehouse'?warehouseGrid()","s.view==='library'?libraryGrid():s.view==='warehouse'?warehouseGrid()");
js=js.replace('明码标价，直接购买。旧货、珍藏，或者一箱不值钱的东西。','明码标价，直接购买。物品价值固定使用截图标价，整箱收益取决于开出的货物。');
js=js.replace("${t.price>=9000?'高价盲箱':'普通盲箱'}",'${t.items.length}件');
js=js.replace("['日常旧物居多，偶尔藏着意外收获。','电子设备与退货，成色好坏全凭运气。','旧宅清理的藏品，也可能只是仿制品。','大件货物集中，占格多不代表值钱。','来源混杂，损失与惊喜都可能更大。','高价远洋货源，做好亏损的准备。']","['家居用品与日常物件，偶尔藏着意外收获。','电子设备货源，物品占格与价值各不相同。','来自工艺藏品分类的一箱收藏。','防弹衣、头盔、胸挂和背包统一归入装备。','十个分类混合装箱，损失与惊喜都可能更大。','大箱混合货源，也可能开出高价值物品。']");
js=js.replace('九种物品尺寸：1 格 · 2 格 · 3 格 · 2×2 · 2×3 · 2×4 · 3×3 · 3×4 · 4×4。格子越大，物品越大；价值要拆开才知道。','物品库共491件、10个分类。尺寸按物品实际占格计算，背包也计算占格；房卡均为1×1。可在物品图鉴查看完整标价。');
js=js.replace('s.cash<600','s.cash<cargoTypes[0].price');
js=js.replace("g.name+' '+it.name",'escapeHTML(it.name)');
js=js.replace('<span class="cargo-label">${it.name}</span><span class="tile-grade">${g.name}</span>','<span class="cargo-label">${escapeHTML(it.name)}</span>');
js=js.replace('<small>${money(it.value)}</small>','<small style="font-size:${Math.min(12,Math.max(7,Math.floor((it.w*46-6)/(money(it.value).length*.61))))}px" title="${money(it.value)}">${money(it.value)}</small>');
js=js.replace('颜色代表品阶：白、绿、蓝、紫、金、红，依次升高。','边框颜色区分物品品级，标价与截图一致。');
js=js.replace('${gradeBadge(it)} ${it.w}×${it.h} 格 · ${it.condition}','${it.cat} · ${it.w}×${it.h} · ${it.w*it.h}格');
js=js.replace('所有报价均已计入物品成色。','每件物品按截图标价出售。');
js=js.replace('${gradeBadge(it)}<p>${it.w}×${it.h} 格 · ${it.condition}${it.rare?\' · 珍藏\':\'\'}</p>','<p>${it.cat} · ${it.w}×${it.h} · ${it.w*it.h}格</p>');
js=js.replace('s.cash+=it.value;r.revenue+=it.value;r.sold++;','s.cash+=it.value;if(r){r.revenue+=it.value;r.sold++;}');
const library=`
function itemCard(it){return \`<div class="item graded-stock" style="--grade:\${grades[it.fixedGrade].color}">\${itemVisual(it,'stock')}<h3>\${escapeHTML(it.name)}</h3><p>\${it.cat} · \${it.w}×\${it.h} · \${it.w*it.h}格</p><small>截图标价</small><div class="value">\${money(it.referencePrice)}</div></div>\`;}
function libraryItems(){return catalog.filter(it=>(!libraryCategory||it.cat===libraryCategory)&&(!librarySearch||it.name.toLocaleLowerCase().includes(librarySearch.toLocaleLowerCase())));}
function libraryGrid(){const items=libraryItems();return heading('CATALOG / ITEMS','物品图鉴','完整保留截图标价，边框颜色区分品级。格数表示物品自身占格。')+gradeLegend()+\`<div class="library-controls"><label>分类<select id="libraryCategory"><option value="">全部分类</option>\${categories.map(c=>\`<option value="\${c}" \${c===libraryCategory?'selected':''}>\${c}（\${catalog.filter(it=>it.cat===c).length}）</option>\`).join('')}</select></label><label>查找物品<input id="librarySearch" type="search" placeholder="输入物品名称" value="\${escapeHTML(librarySearch)}"></label><span class="chip" id="libraryCount">\${items.length} / \${catalog.length} 件</span></div><div class="cards" id="libraryResults">\${items.map(itemCard).join('')||'<div class="empty">没有符合条件的物品</div>'}</div>\`;}
function updateLibrary(){const items=libraryItems();document.getElementById('libraryCount').textContent=\`\${items.length} / \${catalog.length} 件\`;document.getElementById('libraryResults').innerHTML=items.map(itemCard).join('')||'<div class="empty">没有符合条件的物品</div>';}
document.addEventListener('change',e=>{if(e.target.id==='libraryCategory'){libraryCategory=e.target.value;updateLibrary();}});
document.addEventListener('input',e=>{if(e.target.id==='librarySearch'){librarySearch=e.target.value;updateLibrary();}});
`;
js=js.replace("document.addEventListener('click'",library+"document.addEventListener('click'");
fs.writeFileSync(root+'grid.js',js);
let html=fs.readFileSync(root+'index.html','utf8');
html=html.replace('<button data-view="ledger">交易账本</button>','<button data-view="ledger">交易账本</button><button data-view="library">物品图鉴</button>');
html=html.replace('5,000 元启动资金','250,000 哈夫币启动资金');
html=html.replace('物品占用 1×1、1×2、1×3、2×2、2×3、2×4、3×3、3×4、4×4 格。大件也可能是便宜旧货。','所有491件物品按实际尺寸占格，背包也计算自身占格，房卡均为1×1。物品价格固定使用截图标价。');
html=html.replace('品阶从低到高为白色普通、绿色优良、蓝色稀有、紫色史诗、金色传说、红色至尊。出售货物后资金立即到账。','边框颜色区分品级。出售货物按截图标价结算，资金立即到账。');
html=html.replace('<script src="electronics.js"></script>','<script src="all-items.js"></script>');
fs.writeFileSync(root+'index.html',html);
fs.appendFileSync(root+'item-images.css','\n.item-image-tile:has(+.cargo-label){height:calc(100% - 40px)}.grade-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--grade)}.library-controls{display:flex;gap:20px;flex-wrap:wrap;align-items:end;margin:24px 0}.library-controls label{display:flex;flex-direction:column;gap:8px;color:var(--muted)}.library-controls select,.library-controls input{background:#172630;border:1px solid var(--line);border-radius:8px;padding:12px;color:var(--text);font:inherit;min-width:220px}.finding{border-left:3px solid var(--grade);padding-left:10px}.graded-stock .value{color:var(--grade)}.grade-legend small{color:var(--muted)}\n');
console.log('Updated game logic and catalog UI.');
