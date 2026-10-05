const fs=require('fs');
const rows=require('./craft-rows.json'),extras=require('./craft-extras.json');
const cube=extras.find(x=>x.name==='心灵感应.魔方');cube.width=1;cube.height=1;cube.evidence='网页详情正文';
fs.writeFileSync('work/craft-extras.json',JSON.stringify(extras,null,2));
const dataset=JSON.parse(fs.readFileSync('work/collection-source.json','utf8')).jData.data.data.list;
const github='https://github.com/jiansenc/DeltaForceData/blob/main/public/json/props/collection.json';
const files=['67e4095728d399db30947d28d2eeca5f.png','33dfe836f76a419a4ca16a4a6aec2dbd.png','2391d82bd686f7ac5bde79e0fc992cdd.png','55e0c63ffe32ec174488632c3523f1b0.png'];
const colors=['白','绿','蓝','紫','金','红'];
const items=rows.map(([name,price],idx)=>{
 const d=dataset.find(x=>x.objectName===name),e=extras.find(x=>x.name===name);
 if(!d&&!e)throw Error('Missing: '+name);
 const width=e?e.width:d.length,height=e?e.height:d.width;
 const grade=idx<21?5:idx<40?4:idx<51?3:idx<57?2:1;
 const screenshot=Math.floor(idx/15)+1,local=idx%15;
 const item={id:idx+1,name,category:'工艺藏品',price,priceSource:'用户截图显示价格，仅作游戏参考价',screenshot,screenshotFile:files[screenshot-1],row:Math.floor(local/3)+1,column:local%3+1,width,height,cells:width*height,orientation:width===height?'方形':width>height?'横向':'竖向',grade,color:colors[grade],gradeSource:'用户截图标签底色',sizeStatus:'已查到网络尺寸，用户未逐项复核',sizeSource:e?e.source:github,sourceFields:e?{width,height}:{length:d.length,width:d.width},...(d?{objectID:d.objectID,officialIconURL:d.pic}:e.officialIconURL?{officialIconURL:e.officialIconURL}:{})};
 if(e&&e.sourceName!==name){item.sourceName=e.sourceName;item.note='截图名称为“起舞的女郎挂饰”；网络详情称“跳舞的女郎挂饰”，截图参考价 84,443 与详情一致，网络描述为金色版本。与第55件蓝色挂饰分别保留。';}
 if(name==='便携式生命支持系统'||name==='腕带'){item.sourceCategory=name==='腕带'?'电子物品':'医疗道具';item.note='网络资料分类为'+item.sourceCategory+'；本清单按用户截图批次保留在工艺藏品。';}
 return item;
});
if(items.length!==60||new Set(items.map(x=>x.name)).size!==60)throw Error('Catalog count/duplicate mismatch');
if(items.some(x=>!Number.isInteger(x.width)||!Number.isInteger(x.height)||x.width<1||x.height<1))throw Error('Invalid size');
const data={category:'工艺藏品',checkedAt:'2026-10-05',count:60,sizeConvention:'宽×高；横向格数为宽，纵向格数为高。数据源 length 对应宽、width 对应高；不依据物品图片的视觉长宽猜格数。',status:'已整理待后续分类统一接入；本次未修改游戏或精修现有图片',items};
for(const p of ['work/craft-items.json','outputs/工艺藏品数据.json'])fs.writeFileSync(p,JSON.stringify(data,null,2));
let md='# 工艺藏品清单\n\n共 60 件，按四张截图从左到右、从上到下编号。尺寸为**宽×高**；品阶与参考价格按用户截图记录。格数来自网络资料，尚未由用户逐项确认。核查日期：2026-10-05。\n\n| 编号 | 名称 | 品阶 | 宽×高 | 占格 | 方向 | 截图参考价 | 格数来源 |\n|---:|---|---|---|---:|---|---:|---|\n';
for(const x of items)md+='| '+[x.id,x.name,x.color,x.width+'×'+x.height,x.cells,x.orientation,x.price.toLocaleString('en-US'),'[查阅]('+x.sizeSource+')'].join(' | ')+' |\n';
md+='\n## 核查备注\n\n';
for(const x of items.filter(x=>x.note))md+='- 第 '+x.id+' 件，'+x.name+'：'+x.note+' [详情]('+x.sizeSource+')\n';
md+='\n来源为社区收藏品数据集 DeltaForceData 和三角洲小涛查（Orzice）物品详情页。图片本身的长宽不等于库存占格方向，因此尺寸使用资料字段。价格保存截图值，不采用波动中的实时交易价。若后续与用户实际游戏版本的格子画面不符，以用户提供的游戏画面为准。\n\n本次仅保存分类资料，图片细节和游戏接入等其他分类收齐后统一处理。\n';
fs.writeFileSync('outputs/工艺藏品清单.md',md);
const catalogs=[['电子物品','电子物品数据.json'],['医疗道具','医疗道具数据.json'],['家居物品','家居物品数据.json'],['工具材料','工具材料数据.json'],['工艺藏品','工艺藏品数据.json']].map(([category,file])=>({category,file,count:JSON.parse(fs.readFileSync('outputs/'+file,'utf8')).items.length}));
fs.writeFileSync('outputs/物品分类汇总.json',JSON.stringify({updatedAt:'2026-10-05',total:catalogs.reduce((n,c)=>n+c.count,0),catalogs,remainingCategories:['资料情报','能源燃料'],status:'电子物品已接入游戏；医疗、家居、工具材料、工艺藏品资料已建档，等待其余分类统一接入'},null,2));
const sizes={},grades={};for(const x of items){sizes[x.width+'×'+x.height]=(sizes[x.width+'×'+x.height]||0)+1;grades[x.color]=(grades[x.color]||0)+1;}
console.log(JSON.stringify({count:items.length,sizes,grades,sourceCounts:{dataset:items.filter(x=>x.sizeSource===github).length,detail:items.filter(x=>x.sizeSource!==github).length},total:catalogs.reduce((n,c)=>n+c.count,0),notes:items.filter(x=>x.note).map(x=>({id:x.id,name:x.name,note:x.note}))},null,2));
