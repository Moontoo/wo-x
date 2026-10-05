const fs=require('fs'),path=require('path');
const categories=['电子物品','医疗道具','家居物品','工具材料','工艺藏品','资料情报','能源燃料','贵重物品','装备','房卡'];
const out=path.resolve('outputs'),dist=path.join(out,'harbor-bid/dist');
const archive=JSON.parse(fs.readFileSync(path.join(out,'剔除物品记录.json'),'utf8'));
const all=[],catalogs=[];
for(const category of categories){
 const file=category+'数据.json',d=JSON.parse(fs.readFileSync(path.join(out,file),'utf8'));
 const removed=d.items.filter(x=>x.name==='破损的脑机');
 for(const x of removed)if(!archive.items.some(a=>a.category===category&&a.id===x.id))archive.items.push({...x,category,excludedAt:'2026-10-05',exclusionReason:'用户明确要求剔除该物品'});
 d.items=d.items.filter(x=>x.name!=='破损的脑机');d.count=d.items.length;d.pendingSizeItems=[];
 d.status='已接入游戏；价格使用截图标价，品级仅以颜色显示';
 d.excludedUnpricedCount=archive.items.filter(x=>x.category===category&&typeof x.price!=='number').length;
 d.excludedManualCount=archive.items.filter(x=>x.category===category&&typeof x.price==='number').length;
 fs.writeFileSync(path.join(out,file),JSON.stringify(d,null,2));
 catalogs.push({category,file,count:d.count});
 all.push(...d.items.map(x=>({...x,category,catalogId:x.id,key:category+'-'+x.id})));
}
archive.count=archive.items.length;archive.updatedAt='2026-10-05';archive.policy='剔除没有截图价格的物品，以及用户明确要求剔除的物品';
fs.writeFileSync(path.join(out,'剔除物品记录.json'),JSON.stringify(archive,null,2));
for(const item of all)if(!Number.isFinite(item.price)||!Number.isInteger(item.width)||!Number.isInteger(item.height))throw Error('Incomplete '+item.name);
for(const file of ['全部物品数据.json','物品分类汇总.json']){
 const d=JSON.parse(fs.readFileSync(path.join(out,file),'utf8'));
 Object.assign(d,{updatedAt:'2026-10-05',count:all.length,total:all.length,catalogs,pendingSizeItems:[],sizeOmittedItems:[],missingPriceItems:[],excludedUnpricedCount:1,excludedManualCount:1,status:'全部491件物品已接入游戏，价格使用截图标价，品级仅以颜色显示'});
 if(file==='全部物品数据.json')d.items=all;
 fs.writeFileSync(path.join(out,file),JSON.stringify(d,null,2));
}
let md=fs.readFileSync(path.join(out,'资料情报清单.md'),'utf8');
md=md.replace(/共 44 件/,'共 43 件').replace(/43件格数已查到网络资料，第32件“破损的脑机”格数待确认。/,'所有保留物品的格数均已确认。').replace(/有效物品共44件/g,'有效物品共43件');
md=md.split('\n').filter(line=>!line.startsWith('| 32 |')&&!line.startsWith('- 第 32 件，')).join('\n');
if(!md.includes('用户明确要求剔除“破损的脑机”'))md+='\n已按用户明确要求剔除“破损的脑机”（原截图第32件）。\n';
fs.writeFileSync(path.join(out,'资料情报清单.md'),md);
fs.writeFileSync(path.join(out,'全部物品清单.md'),'# 全部物品分类总览\n\n共491件、10个分类，均已接入[港口盲箱](港口盲箱.html)。价值使用截图标价，品级仅通过颜色显示。装备、背包记录物品实际占格，房卡均为1×1。\n\n| 分类 | 数量 | 清单 | 数据 |\n|---|---:|---|---|\n'+catalogs.map(c=>`| ${c.category} | ${c.count} | [查看](${c.category}清单.md) | [JSON](${c.file}) |`).join('\n')+'\n\n已剔除“建筑图纸5号”（截图无价格）和“破损的脑机”（用户明确要求）。\n\n[全部物品数据](全部物品数据.json) · [剔除记录](剔除物品记录.json)\n');
const screenshotRoot='C:/Users/qiche/OneDrive/xwechat_files/wxid_aaevt1l9b0lj31_443c/temp/RWTemp/2026-10/9e20f478899dc29eb19741386f9343c8';
const sheets=[],byFile=new Map();
for(const x of all.filter(x=>x.screenshotFile)){
 if(!byFile.has(x.screenshotFile))byFile.set(x.screenshotFile,[]);
 byFile.get(x.screenshotFile).push(x);
}
const imageSpecs=new Map();
for(const [file,items] of byFile){
 const buffer=fs.readFileSync(path.join(screenshotRoot,file)),width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20),idx=sheets.length;
 const src='assets/catalog-sheet-'+idx+'.png';fs.copyFileSync(path.join(screenshotRoot,file),path.join(dist,src));
 sheets.push({src,width,height});
 const detail=items.length===1&&height>width*.7;
 const cols=Math.max(...items.map(x=>x.column||1)),rows=Math.max(...items.map(x=>x.row||1));
 for(const item of items){
  const cw=width/cols,ch=height/rows;
  const box=detail?{x:width*.12,y:95,width:width*.76,height:225}:{x:((item.column||1)-1)*cw+cw*.10,y:((item.row||1)-1)*ch+32,width:cw*.8,height:Math.max(40,ch-65)};
  imageSpecs.set(item.key,{sheet:idx,...box});
 }
}
const icons={'电子物品':'🔌','医疗道具':'🩺','家居物品':'🏺','工具材料':'🔧','工艺藏品':'💎','资料情报':'📂','能源燃料':'🔋','贵重物品':'🐉','装备':'🎒','房卡':'🗝️'};
const gameCatalog=all.map(x=>({key:x.key,name:x.name,cat:x.category,w:x.width,h:x.height,fixedGrade:x.grade,referencePrice:x.price,base:x.price,icon:icons[x.category],...(x.category==='电子物品'?{sourceId:x.id}:{}),...(imageSpecs.has(x.key)?{imageSpec:imageSpecs.get(x.key)}:{})}));
fs.writeFileSync(path.join(dist,'catalog.js'),"'use strict';\nconst money=n=>'◈ '+n.toLocaleString('zh-CN'),pick=a=>a[Math.floor(Math.random()*a.length)],rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;\nconst escapeHTML=v=>String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));\n");
fs.writeFileSync(path.join(dist,'all-items.js'),'const catalog='+JSON.stringify(gameCatalog)+';\nconst catalogSheets='+JSON.stringify(sheets)+';\n');
console.log(JSON.stringify({items:all.length,categories:catalogs,sheets:sheets.length,excluded:archive.items.map(x=>x.name)},null,2));
