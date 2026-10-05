const fs=require('fs');
function applyExclusion(){
 const categories=['电子物品','医疗道具','家居物品','工具材料','工艺藏品','资料情报','能源燃料','贵重物品','装备','房卡'];
 const recordPath='outputs/剔除物品记录.json';
 const history=fs.existsSync(recordPath)?JSON.parse(fs.readFileSync(recordPath,'utf8')).items:[];
 const catalogs=[],all=[];
 for(const category of categories){
  const file=category+'数据.json',path='outputs/'+file;if(!fs.existsSync(path))continue;
  const data=JSON.parse(fs.readFileSync(path,'utf8'));
  const removed=data.items.filter(x=>typeof x.price!=='number'||!Number.isFinite(x.price));
  for(const item of removed){
   if(!history.some(x=>x.category===category&&x.id===item.id))history.push({...item,excludedAt:'2026-10-05',exclusionReason:'用户要求剔除没有价格的物品'});
  }
  data.items=data.items.filter(x=>typeof x.price==='number'&&Number.isFinite(x.price));data.count=data.items.length;
  data.excludedUnpricedCount=history.filter(x=>x.category===category).length;
  if(data.pendingSizeItems)data.pendingSizeItems=data.items.filter(x=>x.sizeRequired!==false&&(x.width===null||x.height===null)).map(x=>({id:x.id,name:x.name}));
  if(category==='资料情报')data.status='已剔除无价格物品，保留44件；破损的脑机格数待确认；待统一接入游戏';
  fs.writeFileSync(path,JSON.stringify(data,null,2));
  if(category==='资料情报'&&fs.existsSync('work/intel-items.json'))fs.writeFileSync('work/intel-items.json',JSON.stringify(data,null,2));
  catalogs.push({category,file,count:data.items.length});
  all.push(...data.items.map(x=>({...x,catalogId:x.id,key:category+'-'+x.id})));
 }
 fs.writeFileSync(recordPath,JSON.stringify({updatedAt:'2026-10-05',count:history.length,policy:'没有价格的物品不进入待接入游戏的有效物品库；零价格不视为缺失价格',items:history},null,2));
 const pending=all.filter(x=>x.sizeRequired!==false&&(x.width===null||x.height===null)).map(x=>({category:x.category,id:x.id,name:x.name}));
 const sizeOmittedItems=all.filter(x=>x.sizeRequired===false).map(x=>({category:x.category,id:x.id,name:x.name,reason:x.sizeStatus}));
 const combinedPath='outputs/全部物品数据.json';
 const combined=JSON.parse(fs.readFileSync(combinedPath,'utf8'));
 Object.assign(combined,{updatedAt:'2026-10-05',count:all.length,missingPriceItems:[],pendingSizeItems:pending,sizeOmittedItems,excludedUnpricedCount:history.length,items:all});
 fs.writeFileSync(combinedPath,JSON.stringify(combined,null,2));
 const summaryPath='outputs/物品分类汇总.json',summary=JSON.parse(fs.readFileSync(summaryPath,'utf8'));
 Object.assign(summary,{updatedAt:'2026-10-05',total:all.length,catalogs,pendingSizeItems:pending,sizeOmittedItems,missingPriceItems:[],excludedUnpricedCount:history.length,status:'全部分类已建档；已按用户要求剔除无价格物品，有效物品'+all.length+'件；'+(pending.length?'待确认格数'+pending.length+'件；':'')+(sizeOmittedItems.length?'背包'+sizeOmittedItems.length+'件按用户要求不记录格数；':'')+'待统一接入游戏'});
 fs.writeFileSync(summaryPath,JSON.stringify(summary,null,2));
 let intelMd=fs.readFileSync('outputs/资料情报清单.md','utf8');
 intelMd=intelMd.replace('共 45 件','共 44 件').replace('44件格数已查到网络资料','43件格数已查到网络资料');
 intelMd=intelMd.split('\n').filter(line=>!(line.startsWith('| 39 |')||line.startsWith('- 第 39 件，'))).join('\n');
 if(!intelMd.includes('原截图编号保留'))intelMd+='\n已按用户要求剔除原截图第39件“建筑图纸5号”，原因是截图未提供价格。原截图编号保留，便于对应截图；有效物品共44件。\n';
 fs.writeFileSync('outputs/资料情报清单.md',intelMd);
 const overview='# 全部物品分类总览\n\n有效物品共'+all.length+'件，合计'+catalogs.length+'个分类。已剔除无价格物品'+history.length+'件。电子物品已接入游戏，其余分类资料等待统一接入。\n\n| 分类 | 数量 | 清单 | 数据 |\n|---|---:|---|---|\n'+catalogs.map(c=>'| '+c.category+' | '+c.count+' | [查看]('+c.category+'清单.md) | [JSON]('+c.file+') |').join('\n')+'\n\n待补资料：'+(pending.length?pending.map(x=>x.category+'第'+x.id+'件“'+x.name+'”格数').join('；'):'无')+'。所有有效物品均有截图价格。\n\n'+(sizeOmittedItems.length?'装备分类的'+sizeOmittedItems.length+'件背包按用户要求不记录格数或容量，无对应字段，且不列入格数待补清单。\n\n':'')+'已剔除：建筑图纸5号（原截图第39件，截图价格显示“--”）。剔除记录另存，后续不进入游戏物品库。\n\n[全部物品JSON](全部物品数据.json) · [剔除记录](剔除物品记录.json)\n';
 fs.writeFileSync('outputs/全部物品清单.md',overview);
 if(all.some(x=>typeof x.price!=='number'||!Number.isFinite(x.price)))throw Error('Missing price remains');
 if(all.length!==catalogs.reduce((n,c)=>n+c.count,0)||new Set(all.map(x=>x.key)).size!==all.length)throw Error('Count mismatch');
 return {total:all.length,excluded:history.map(x=>x.name),pendingSizeItems:pending};
}
module.exports=applyExclusion;
if(require.main===module)console.log(JSON.stringify(applyExclusion(),null,2));
