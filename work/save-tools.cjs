const fs=require('fs');
const rows=[
 ['强化碳纤维板',2048661],['军用炮弹',1459184],['飞秒激光器',565956],['超声波切割刀',200191],['军用炸药',135122],['紫外线灯',97634],['液压破门器',83202],['陆军万用表',66770],['移动电缆',229491],['自旋型手锯',58648],['高出力粉碎钳',36553],['OLIGHT WARRIOR 3S联名手电',28132],['植物样本',19065],['聚乙烯纤维',15342],['特种钢',34487],
 ['一包水泥',51007],['无线便携电钻',30445],['一桶油漆',21894],['机械破障锤',29135],['芳纶纤维',22895],['火药',19725],['枪械零件',16999],['高精数显卡尺',15203],['转换插座',10182],['石工锤',12384],['手锯',11606],['水平仪',4236],['压力计',3944],['原木木板',4025],['电动爆破锤',4023],
 ['角磨机',3901],['喷漆',3739],['LED灯管',3189],['螺丝刀',2741],['电笔',2486],['模拟温度计',2404],['尖嘴钳',2372],['插座',2278],['电线',2272],['波纹软管',2373],['便携液压扳手',2258],['羊角锤',3633],['一盒钉子',2794],['直角尺',2590],['工具刀',2293],
 ['油漆刷',1368],['布基胶带',1216],['精密工具组',1086],['防水胶布',1077],['网线',1067],['音波测距卷尺',1024]
];
const extra={
 '飞秒激光器':[3,1,1283],'超声波切割刀':[1,1,1225],'紫外线灯':[1,2,1028],'液压破门器':[1,2,1228],'陆军万用表':[1,1,1202],'OLIGHT WARRIOR 3S联名手电':[1,1,1220],'植物样本':[1,1,861]
};
const dataset=JSON.parse(fs.readFileSync('work/collection-source.json','utf8')).jData.data.data.list;
const github='https://github.com/jiansenc/DeltaForceData/blob/main/public/json/props/collection.json';
const files=['53c72a8535726be083741f6c0fee91aa.png','b35606afbada219d2f00e20d2c097356.png','bfbe8958f7d2727c627b571b3af9f087.png','ec6519ca9311b14c29511ed9cc330f3c.png'];
const colors=['白','绿','蓝','紫','金','红'];
const items=rows.map(([name,price],idx)=>{
 const d=dataset.find(x=>x.objectName===name),e=extra[name];
 if(!d&&!e)throw Error('Missing: '+name);
 const width=e?e[0]:d.length,height=e?e[1]:d.width;
 const grade=idx<4?5:idx<9?4:idx<15?3:idx<24?2:idx<41?1:0;
 const screenshot=Math.floor(idx/15)+1,local=idx%15;
 return {id:idx+1,name,category:'工具材料',price,priceSource:'用户截图显示价格，仅作游戏参考价',screenshot,screenshotFile:files[screenshot-1],row:Math.floor(local/3)+1,column:local%3+1,width,height,cells:width*height,orientation:width===height?'方形':width>height?'横向':'竖向',grade,color:colors[grade],gradeSource:'用户截图标签底色',sizeStatus:'已查到网络尺寸，用户未逐项复核',sizeSource:e?'https://orzice.com/v/info/'+e[2]:github,sourceFields:e?{width,height}:{length:d.length,width:d.width},...(d?{objectID:d.objectID,officialIconURL:d.pic}: {})};
});
if(items.length!==51||new Set(items.map(x=>x.name)).size!==51)throw Error('Catalog count/duplicate mismatch');
if(items.some(x=>!Number.isInteger(x.width)||!Number.isInteger(x.height)||x.width<1||x.height<1))throw Error('Invalid size');
const data={category:'工具材料',checkedAt:'2026-10-05',count:51,sizeConvention:'宽×高；横向长边在宽度，竖向长边在高度。数据源 length 对应横向格数、width 对应纵向格数；不依据图片的视觉长宽猜格数。',status:'已整理待后续分类统一接入；本次未修改游戏或精修现有图片',items};
for(const p of ['work/tool-items.json','outputs/工具材料数据.json'])fs.writeFileSync(p,JSON.stringify(data,null,2));
let md='# 工具材料清单\n\n共 51 件，按四张截图从左到右、从上到下编号。尺寸为**宽×高**；品阶与参考价格按用户截图记录。格数来自网络资料，尚未由用户逐项确认。核查日期：2026-10-05。\n\n| 编号 | 名称 | 品阶 | 宽×高 | 占格 | 方向 | 截图参考价 | 格数来源 |\n|---:|---|---|---|---:|---|---:|---|\n';
for(const x of items)md+='| '+[x.id,x.name,x.color,x.width+'×'+x.height,x.cells,x.orientation,x.price.toLocaleString('en-US'),'[查阅]('+x.sizeSource+')'].join(' | ')+' |\n';
md+='\n来源为社区收藏品数据集 DeltaForceData 和三角洲小涛查（Orzice）物品详情页。图片本身的长宽不等于库存占格方向，因此尺寸使用资料字段，不按截图中的物品形状猜测。价格保存截图值，不采用波动中的实时交易价。若后续与用户实际游戏版本的格子画面不符，以用户提供的游戏画面为准。\n\n本次仅保存工具材料分类资料，图片细节和游戏接入等其他分类收齐后统一处理。\n';
fs.writeFileSync('outputs/工具材料清单.md',md);
const catalogs=[['电子物品','电子物品数据.json'],['医疗道具','医疗道具数据.json'],['家居物品','家居物品数据.json'],['工具材料','工具材料数据.json']].map(([category,file])=>({category,file,count:JSON.parse(fs.readFileSync('outputs/'+file,'utf8')).items.length}));
fs.writeFileSync('outputs/物品分类汇总.json',JSON.stringify({updatedAt:'2026-10-05',total:catalogs.reduce((n,c)=>n+c.count,0),catalogs,remainingCategories:['工艺藏品','资料情报','能源燃料'],status:'电子物品已接入游戏；医疗、家居、工具材料资料已建档，等待其余分类统一接入'},null,2));
const sizes={},grades={};for(const x of items){sizes[x.width+'×'+x.height]=(sizes[x.width+'×'+x.height]||0)+1;grades[x.color]=(grades[x.color]||0)+1;}
console.log(JSON.stringify({count:items.length,sizes,grades,sourceCounts:{dataset:items.filter(x=>x.sizeSource===github).length,detail:items.filter(x=>x.sizeSource!==github).length},total:catalogs.reduce((n,c)=>n+c.count,0)},null,2));
