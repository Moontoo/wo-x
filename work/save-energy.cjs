const fs=require('fs');
const rows=require('./energy-rows.json'),extras=require('./energy-extras.json');
const ds=JSON.parse(fs.readFileSync('work/collection-source.json')).jData.data.data.list;
const github='https://github.com/jiansenc/DeltaForceData/blob/main/public/json/props/collection.json';
const files=['2a49a2b2188c87b9a3e5bf816298671a.png','b724ec3516edee35101de802dc1237dd.png','a254007fcc3c6e1b9ef4749e4fda313f.png','d52d5556b4d63e1bae94be0ce47b1726.png','303c0c75008ea6eb3907797c2d31f7ee.png','2efc877aefd97916e7807f4f0a89835f.png','3344d9bbc7ea2fa98aa329f4d19cd89c.png','1cb5a4f43f5121d7988a76778899dd75.png','0ae7952c2d32795bb50f89b52e1f0a1b.png','64cce295dd10767bc862ece81cb22cf2.png'];
const colors=['白','绿','蓝','紫','金','红'];
const energy=rows.map(([name,price],idx)=>{
 const d=ds.find(x=>x.objectName===name),e=extras.find(x=>x.name===name);
 if(!d&&!e)throw Error('Missing '+name);
 const width=e?e.width:d.length,height=e?e.height:d.width;
 const grade=idx<6?5:idx<12?4:idx<17?3:idx<23?2:idx<25?1:0;
 const screenshot=idx<15?1:2,local=idx<15?idx:idx-15;
 return {id:idx+1,name,category:'能源燃料',price,priceSource:'用户截图显示价格，仅作游戏参考价',screenshot,screenshotFile:files[screenshot-1],row:Math.floor(local/3)+1,column:local%3+1,width,height,cells:width*height,orientation:width===height?'方形':width>height?'横向':'竖向',grade,color:colors[grade],gradeSource:'用户截图标签底色',sizeStatus:'已查到网络尺寸，用户未逐项复核',sizeSource:e?e.source:github,sourceFields:e?{width,height}:{length:d.length,width:d.width},...(d?{objectID:d.objectID,officialIconURL:d.pic}:e.officialIconURL?{officialIconURL:e.officialIconURL}:{})};
});
const redRows=[
 ['“阿萨拉一号”','能源燃料',1500000,1,4,3],
 ['乙巳玄武','贵重物品',1000000,2,2,4],
 ['炫彩克小圈','工艺藏品',588888,1,2,5],
 ['马上转运','工艺藏品',1000000,2,2,6],
 ['白里出红瓶','工艺藏品',888888,2,3,7],
 ['岁岁鸭','工艺藏品',588888,2,2,8],
 ['得吃鸡缸杯','工艺藏品',188888,1,1,9],
 ['阿萨拉兔俑','工艺藏品',288888,1,2,10]
];
const reds=redRows.map(([name,category,price,width,height,screenshot])=>({name,category,price,priceSource:'用户物品详情截图显示价格，仅作游戏参考价',screenshot,screenshotFile:files[screenshot-1],row:1,column:1,width,height,cells:width*height,orientation:width===height?'方形':width>height?'横向':'竖向',grade:5,color:'红',gradeSource:'用户截图左上角红色品阶图标',categorySource:'用户截图价格旁的分类文字',sizeStatus:'已按用户截图右下角亮色占格小图核对',sizeSourceType:'用户截图',sizeSource:files[screenshot-1],sourceFields:{width,height}}));
energy.push({...reds[0],id:27});
for(const x of [...energy,...reds])if(!Number.isInteger(x.width)||!Number.isInteger(x.height)||x.width<1||x.height<1)throw Error('Invalid size '+x.name);
if(energy.length!==27||new Set(energy.map(x=>x.name)).size!==27)throw Error('Energy count mismatch');
const sizeConvention='宽×高；网络数据 length 对应横向格数、width 对应纵向格数。单件详情图的亮色小格直接对应占格宽高。';
const energyData={category:'能源燃料',checkedAt:'2026-10-05',count:energy.length,sizeConvention,status:'分类资料已整理，待统一接入游戏',items:energy};
fs.writeFileSync('outputs/能源燃料数据.json',JSON.stringify(energyData,null,2));
const craft=JSON.parse(fs.readFileSync('outputs/工艺藏品数据.json'));
for(const red of reds.filter(x=>x.category==='工艺藏品')){
 const existing=craft.items.find(x=>x.name===red.name);
 if(existing)Object.assign(existing,red);else craft.items.push({...red,id:craft.items.length+1});
}
craft.count=craft.items.length;craft.updatedAt='2026-10-05';craft.status='原四张截图60件，加补充单件截图6件，共66件；分类资料已整理，待统一接入游戏';
if(craft.count!==66||new Set(craft.items.map(x=>x.name)).size!==66)throw Error('Craft count mismatch');
fs.writeFileSync('outputs/工艺藏品数据.json',JSON.stringify(craft,null,2));
const precious={category:'贵重物品',checkedAt:'2026-10-05',count:1,sizeConvention,status:'按用户截图标注单列，待接入游戏',items:[{...reds[1],id:1}]};
fs.writeFileSync('outputs/贵重物品数据.json',JSON.stringify(precious,null,2));
function table(items,includeCategory=false){
 let md=includeCategory?'| 编号 | 名称 | 分类 | 品阶 | 宽×高 | 占格 | 方向 | 截图参考价 | 格数来源 |\n|---:|---|---|---|---|---:|---|---:|---|\n':'| 编号 | 名称 | 品阶 | 宽×高 | 占格 | 方向 | 截图参考价 | 格数来源 |\n|---:|---|---|---|---:|---|---:|---|\n';
 for(const [index,x] of items.entries()){
  const source=x.sizeSourceType==='用户截图'?'用户详情截图'+x.screenshot:'[查阅]('+x.sizeSource+')';
  md+='| '+[x.id??index+1,x.name,...(includeCategory?[x.category]:[]),x.color,x.width+'×'+x.height,x.cells,x.orientation,x.price.toLocaleString('en-US'),source].join(' | ')+' |\n';
 }
 return md;
}
const energyMd='# 能源燃料清单\n\n共27件：前两张列表截图26件，另加第三张单件详情图“阿萨拉一号”。编号按列表从左到右、从上到下排序，详情图作为第27件。尺寸为**宽×高**。品阶与价格按用户截图保存；网络格数尚未由用户逐项复核。核查日期：2026-10-05。\n\n'+table(energy)+'\n“阿萨拉一号”的详情图亮色占格为1列4行，即竖向1×4，共4格。来源为用户截图。\n\n其余格数来源为 DeltaForceData 和三角洲小涛查（Orzice）物品详情；价格保留截图值，不用实时交易价覆盖。\n';
fs.writeFileSync('outputs/能源燃料清单.md',energyMd);
fs.writeFileSync('outputs/补充红色物品清单.md','# 补充红色物品清单\n\n共8件，按本批第三至第十张单件详情截图顺序排列。分类按价格旁的文字，格数按右下角亮色占格小图，价格按截图显示值，品阶均为红色。尺寸为**宽×高**。\n\n'+table(reds,true)+'\n已分别并入能源燃料1件、工艺藏品6件、贵重物品1件。贵重物品作为独立分类保留，未改成工艺藏品。\n');
fs.writeFileSync('outputs/贵重物品清单.md','# 贵重物品清单\n\n按用户截图标注保留此独立分类。当前1件，红色品阶；尺寸为宽×高，直接核对截图占格小图。\n\n'+table(precious.items));
const craftMd=fs.readFileSync('outputs/工艺藏品清单.md','utf8').split('\n## 本批补充红色藏品')[0];
fs.writeFileSync('outputs/工艺藏品清单.md',craftMd+'\n## 本批补充红色藏品\n\n新增6件，分类、价格、格数均按单件详情截图记录。与前60件合计66件。以下编号继续使用61至66。\n\n'+table(craft.items.slice(60)));
const categories=['电子物品','医疗道具','家居物品','工具材料','工艺藏品','资料情报','能源燃料','贵重物品'];
const catalogs=categories.map(category=>{const file=category+'数据.json',data=JSON.parse(fs.readFileSync('outputs/'+file));return {category,file,count:data.items.length};});
const all=catalogs.flatMap(c=>JSON.parse(fs.readFileSync('outputs/'+c.file)).items.map(x=>({...x,catalogId:x.id,key:c.category+'-'+x.id})));
if(all.length!==catalogs.reduce((n,c)=>n+c.count,0)||new Set(all.map(x=>x.key)).size!==all.length||new Set(all.map(x=>x.name)).size!==all.length)throw Error('Combined count/duplicate mismatch');
const pending=all.filter(x=>x.width===null||x.height===null).map(x=>({category:x.category,id:x.id,name:x.name}));
const missingPrice=all.filter(x=>x.price===null).map(x=>({category:x.category,id:x.id,name:x.name}));
const summary={updatedAt:'2026-10-05',total:all.length,catalogs,remainingCategories:[],pendingSizeItems:pending,missingPriceItems:missingPrice,status:'用户已提供全部七类及贵重物品补充截图；335件已建档，破损的脑机格数待确认，建筑图纸5号截图价格缺失；待统一接入游戏'};
fs.writeFileSync('outputs/物品分类汇总.json',JSON.stringify(summary,null,2));
fs.writeFileSync('outputs/全部物品数据.json',JSON.stringify({updatedAt:summary.updatedAt,count:all.length,sizeConvention,pendingSizeItems:pending,missingPriceItems:missingPrice,items:all},null,2));
fs.writeFileSync('outputs/全部物品清单.md','# 全部物品分类总览\n\n共335件物品，七个原分类已收齐，另按截图单列贵重物品。分类清单保存名称、品阶、截图价格、宽×高、格数与来源。电子物品已接入游戏；其余资料已建档，等待统一接入。\n\n| 分类 | 数量 | 清单 | 数据 |\n|---|---:|---|---|\n'+catalogs.map(c=>'| '+c.category+' | '+c.count+' | [查看]('+c.category+'清单.md) | [JSON]('+c.file+') |').join('\n')+'\n\n待补资料：资料情报第32件“破损的脑机”格数；第39件“建筑图纸5号”截图显示价格为“--”，数据中以null保留。\n\n[补充红色物品清单](补充红色物品清单.md) · [全部物品JSON](全部物品数据.json)\n');
const grades={};for(const x of energy)grades[x.color]=(grades[x.color]||0)+1;
console.log(JSON.stringify({newItems:34,energy:energy.length,energyGrades:grades,craft:craft.count,precious:precious.count,total:all.length,pending,missingPrice},null,2));
console.log('应用无价格物品剔除规则：',JSON.stringify(require('./exclude-unpriced.cjs')()));
