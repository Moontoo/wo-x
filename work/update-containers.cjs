const fs=require('fs'),root='outputs/harbor-bid/dist/';
let js=fs.readFileSync(root+'grid.js','utf8');
function replaceFunction(name,source){const start=js.indexOf('function '+name+'(');if(start<0)throw Error(name);const end=js.indexOf('\nfunction ',start+1);if(end<0)throw Error('end '+name);js=js.slice(0,start)+source+'\n'+js.slice(end+1);}
js=js.replace('START_CASH=250000','START_CASH=3000000');
js=js.replace(/^const cargoTypes=.*$/m,"const cargoTypes=[{name:'01号集装箱',cat:null,price:1500000,w:6,h:6,count:7,tint:'#32c7df',art:0},{name:'02号集装箱',cat:null,price:2500000,w:8,h:6,count:9,tint:'#59b68e',art:1},{name:'03号集装箱',cat:null,price:4000000,w:8,h:8,count:11,tint:'#718ce5',art:2},{name:'04号集装箱',cat:null,price:6000000,w:10,h:8,count:12,tint:'#ee934c',art:3},{name:'05号集装箱',cat:null,price:8000000,w:10,h:10,count:16,tint:'#dd6268',art:4},{name:'06号集装箱',cat:null,price:10000000,w:12,h:10,count:20,tint:'#dfb458',art:5}];");
replaceFunction('pickCatalog','function pickCatalog(pool){return pick(pool);}');
replaceFunction('generate',`function generate(t,index){
 const items=pack(t,catalog);items.forEach((it,i)=>it.uid='C'+s.round+'-'+index+'-'+i);
 return {...t,id:'HB-'+String(s.round).padStart(3,'0')+'-'+(index+1),items};
}`);
js=js.replace('version:2,cash:START_CASH','version:2,pricingRevision:3,cash:START_CASH');
js=js.replace('s.stock=s.stock.map(normalizeItem).filter(Boolean);','if(s.pricingRevision!==3){s.cash=Math.max(s.cash,START_CASH);s.pricingRevision=3;s.offers=[];}\n s.stock=s.stock.map(normalizeItem).filter(Boolean);');
replaceFunction('market',`function containerVisual(t){const cell=containerArtwork.width/3,row=containerArtwork.height/2;return \`<svg class="container-image" viewBox="\${(t.art%3)*cell} \${Math.floor(t.art/3)*row} \${cell} \${row}" role="img" aria-label="\${t.name}" preserveAspectRatio="xMidYMid meet"><image href="\${containerArtwork.src}" width="\${containerArtwork.width}" height="\${containerArtwork.height}" /></svg>\`;}
function market(){
 return heading('CARGO / MARKET','选一箱，揭晓你的运气。','每箱货物从全部491件物品中随机抽取，物品价值固定使用截图标价。')+\`<div class="cards">\${s.offers.map((t,i)=>\`<article class="lot container-lot" style="--container-tint:\${t.tint}"><div class="container-visual">\${containerVisual(t)}<span class="container-number">0\${i+1}</span></div><div class="lot-head"><div class="eyebrow">\${t.w} × \${t.h} 格 / \${t.items.length} 件货物</div><div class="serial">\${t.id}</div></div><div class="lot-body"><h3>\${t.name}</h3><p>全库随机货物 · 实际占格</p><div class="lot-bottom"><div class="price"><small>整箱售价</small><strong>\${money(t.price)}</strong></div><button data-buy="\${i}" \${s.cash<t.price?'disabled':''}>购买开箱</button></div></div></article>\`).join('')}</div><div class="notice">不同颜色区分不同售价。物品库共491件，所有集装箱都从同一物品库随机抽取。背包按自身占格计算，房卡均为1×1。完整标价可在物品图鉴查看。</div>\${s.cash<cargoTypes[0].price?\`<div class="notice negative">现金不足以购买最便宜的箱子。\${s.stock.length?'去仓库出售货物补充资金。':'可以在页面底部重新开局。'}</div>\`:''}<button id="refreshCargo" class="secondary">换一批货源</button>\`;
}`);
// Existing unopened offers use the new artwork and full-random pool; purchased cargo remains intact.
js=js.replace('function ensure(){if(!s.offers.length&&!s.current)',"function ensure(){if(s.offers.some(t=>t.cat||!Number.isInteger(t.art)))s.offers=[];if(!s.offers.length&&!s.current)");
fs.writeFileSync(root+'grid.js',js);
fs.writeFileSync(root+'container-art.js',"const containerArtwork={src:'assets/container-colors-v1.png',width:1536,height:1024};\n");
let images=fs.readFileSync(root+'item-images.js','utf8').replace('[...catalogSheets,...electronicAtlases]','[...catalogSheets,...electronicAtlases,containerArtwork]');fs.writeFileSync(root+'item-images.js',images);
let html=fs.readFileSync(root+'index.html','utf8');
html=html.replace('250,000 哈夫币启动资金','3,000,000 哈夫币启动资金').replace('不同集装箱有不同价格、尺寸和货物倾向。','不同颜色的集装箱有不同价格和尺寸，货物都从完整物品库随机抽取。');
html=html.replace('<script src="item-images.js"></script>','<script src="container-art.js"></script><script src="item-images.js"></script>');
fs.writeFileSync(root+'index.html',html);
fs.appendFileSync(root+'item-images.css','\n.container-lot{border-color:color-mix(in srgb,var(--container-tint) 45%,var(--line));overflow:hidden}.container-visual{position:relative;min-height:220px;background:#111b24;border-bottom:1px solid color-mix(in srgb,var(--container-tint) 30%,var(--line))}.container-image{display:block;width:100%;height:240px;overflow:hidden;filter:drop-shadow(0 8px 10px #0005)}.container-number{position:absolute;top:14px;left:18px;font:700 18px monospace;letter-spacing:3px;color:var(--container-tint)}.container-lot .price strong,.container-lot h3{color:var(--container-tint)}.container-lot .lot-head{padding-bottom:4px}.container-lot .lot-body{padding-top:12px}.container-lot .lot-bottom{gap:12px;flex-wrap:wrap}.container-lot button{border:1px solid var(--container-tint);background:color-mix(in srgb,var(--container-tint) 85%,#f0e0c0);color:#10212b}.container-lot button:disabled{opacity:.35}@media(max-width:520px){.container-image{height:230px}}\n');
let pack=fs.readFileSync('work/package-game.cjs','utf8').replace("'scratch.js','item-images.js'","'scratch.js','container-art.js','item-images.js'");fs.writeFileSync('work/package-game.cjs',pack);
console.log('Six container appearances; all cargo uniformly sampled from the complete catalog.');
