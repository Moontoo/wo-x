const fs=require('fs');
const rows=require('./equipment-rows.json'),extras=require('./equipment-extras.json');
const sources=Object.fromEntries(['armor','helmet','chest','bag'].map(n=>[n,JSON.parse(fs.readFileSync('work/'+n+'-source.json')).jData.data.data.list]));
const files=['8baf403a5a915d10e747049ea5bb18d0.png','3de6eb175eaf39aa6a12daffc9d1ff52.png','8c549592952f5e2ebb95691267c93b89.png','1c83d4a948eb1f7512fb297e9fcc2e36.png','c6f4208bc2e19d0576fbb9a0ba4af805.png','58e87fa5ee9d468897bac8c3ad64d74f.png','a7e1a70621684c2e96ba7ed6d8204661.png'];
const starts=[0,12,19,31,42,57,72],colors=['白','绿','蓝','紫','金','红'];
const norm=n=>n.replace(/（全新）/g,'').replace(/\s/g,'').toLowerCase();
const items=rows.map(([name,price,grade,screenshot,equipmentType],idx)=>{
 const type={'防弹衣':'armor','头盔':'helmet','胸挂':'chest','背包':'bag'}[equipmentType];
 const d=sources[type].find(x=>norm(x.objectName)===norm(name)),e=extras.find(x=>x.id===idx+1),local=idx-starts[screenshot-1];
 const base={id:idx+1,name,category:'装备',equipmentType,price,priceSource:'用户截图显示价格，仅作游戏参考价',screenshot,screenshotFile:files[screenshot-1],row:Math.floor(local/3)+1,column:local%3+1,grade,color:colors[grade],gradeSource:'用户截图标签底色',...(name.includes('（全新）')?{condition:'全新'}:{})};
 if(d){base.objectID=d.objectID;base.officialIconURL=d.pic;}
 if(!d&&!e)throw Error('Missing footprint: '+name);
 const width=e?e.width:d.length,height=e?e.height:d.width;
 return {...base,width,height,cells:width*height,orientation:width===height?'方形':width>height?'横向':'竖向',sizeRequired:true,sizeStatus:'已查到网络尺寸，用户未逐项复核',sizeSource:e?e.source:'https://github.com/jiansenc/DeltaForceData/blob/main/public/json/protect/'+type+'.json',sourceFields:e?{width,height}:{length:d.length,width:d.width},...(!e?{sourceName:d.objectName}:{})};
});
if(items.length!==78||new Set(items.map(x=>x.name)).size!==78)throw Error('Count/duplicate mismatch');
const typed=Object.fromEntries(['防弹衣','头盔','胸挂','背包'].map(t=>[t,items.filter(x=>x.equipmentType===t).length]));
for(const x of items){
 if(!Number.isFinite(x.price))throw Error('Missing price');
 if(x.sizeRequired&&(!Number.isInteger(x.width)||!Number.isInteger(x.height)||x.cells!==x.width*x.height))throw Error('Invalid size '+x.name);
 if(Object.hasOwn(x,'capacity'))throw Error('Internal capacity must be omitted');
}
const data={category:'装备',checkedAt:'2026-10-05',count:78,equipmentTypeCounts:typed,sizeConvention:'宽×高；网络数据 length 对应横向格数、width 对应纵向格数。全部装备记录物品本身占格，背包和胸挂的内部容量不记录。',sizePolicy:{recordItemFootprint:true,recordInternalCapacity:false},pendingSizeItems:[],status:'78件已建档，包含21件背包；全部已查到物品占格尺寸；待统一接入游戏',items};
fs.writeFileSync('outputs/装备数据.json',JSON.stringify(data,null,2));
let md='# 装备清单\n\n共78件，统一归入“装备”分类：防弹衣19件、头盔23件、胸挂15件、背包21件。名称、全新状态、品阶和价格按用户截图保存。核查日期：2026-10-05。\n\n全部装备均记录物品本身占格，尺寸为**宽×高**。78件均已查到网络尺寸，尚未由用户逐项复核。已按用户最新说明补回21件背包的占格；背包和胸挂内部容量不记录。\n\n编号按7张截图从左到右、从上到下连续排列。\n\n| 编号 | 名称 | 类型 | 品阶 | 截图参考价 | 宽×高 | 占格 | 格数来源 |\n|---:|---|---|---|---:|---|---:|---|\n';
for(const x of items)md+='| '+[x.id,x.name,x.equipmentType,x.color,x.price.toLocaleString('en-US'),x.sizeRequired?x.width+'×'+x.height:'',x.sizeRequired?x.cells:'',x.sizeRequired?'[查阅]('+x.sizeSource+')':''].join(' | ')+' |\n';
md+='\n格数来源：DeltaForceData装备数据及三角洲小涛查物品详情。价格保留截图参考价，不以网上交易价覆盖。胸挂占格与内部容量不同，本清单只记录占格。全部装备资料已整理，等待统一接入游戏。\n';
fs.writeFileSync('outputs/装备清单.md',md);
console.log(JSON.stringify({count:items.length,types:typed,withFootprint:items.filter(x=>x.sizeRequired).length,backpacksWithoutSize:items.filter(x=>!x.sizeRequired).length,summary:require('./exclude-unpriced.cjs')()},null,2));
