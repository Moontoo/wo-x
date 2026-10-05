const fs=require('fs');
const rows=[
 ['扫拖一体机器人',2035478],['强力吸尘器',1452358],['奥莉薇娅香槟',340710],['“钻石”鱼子酱',175607],['盒装挂耳咖啡',355097],['飞行员眼镜',82094],['“蓝宝石”龙舌兰',81502],['咖啡',68903],['纯金打火机',62155],['营养粥罐头',59704],['海鲜粥罐头',58505],['胶囊咖啡机套组',39133],['小糖人姜饼人',23090],['鳄鱼蛋',23089],['鼻通',22698],
 ['爽身粉',22481],['清新橘味能量凝胶',38731],['电动牙刷',16435],['生津柠檬茶',19189],['阿萨拉时尚周刊',16958],['摩卡咖啡壶',15249],['木雕烟斗',14472],['军用罐头',14426],['三角洲特种部队：刺刀特遣队',11535],['维生素泡腾片',10046],['英式袋泡茶',13863],['可乐',12798],['大豆蛋白粉包',12323],['香喷喷炒面',8882],['糖三角',12108],
 ['三角洲特种部队：黑鹰坠落-战队之刃',10882],['调料套组',6779],['阿萨拉新闻周刊',5563],['袋装咖啡豆',5363],['阿萨拉娱乐月刊',5205],['酒店宣传海报',4529],['野外能量棒',2883],['当地再制咖啡',2853],['强力胶',2938],['迷你氢电池',2562],['电火机',2553],['苹果',2468],['无糖缓释能量棒',1742],['纯净水',2013],['胡椒瓶',1770]
];
const extra={
 '“钻石”鱼子酱':{width:1,height:1,source:'https://orzice.com/v/info/1035'},
 '“蓝宝石”龙舌兰':{width:1,height:2,source:'https://orzice.com/v/info/1033'},
 '营养粥罐头':{width:1,height:1,source:'https://orzice.com/v/info/902'},
 '海鲜粥罐头':{width:1,height:1,source:'https://orzice.com/v/info/900'},
 '小糖人姜饼人':{width:1,height:2,source:'https://orzice.com/v/info/1231'},
 '爽身粉':{width:1,height:1,source:'https://orzice.com/v/info/1290'}
};
for(const x of JSON.parse(fs.readFileSync('work/home-extra-found.json','utf8')))extra[x.name]=x;
const dataset=JSON.parse(fs.readFileSync('work/collection-source.json','utf8')).jData.data.data.list;
const github='https://github.com/jiansenc/DeltaForceData/blob/main/public/json/props/collection.json';
const colors=['白','绿','蓝','紫','金','红'];
const files=['d6a49ce37dddb0a5f458d0ddf51d4f5a.png','ccd829e0974d356e354194bbe952420d.png','20b3bad54d86862adbe1dcb29031c724.png'];
const items=rows.map(([name,price],idx)=>{
 const d=dataset.find(x=>x.objectName===name),e=extra[name];
 if(!d&&!e)throw Error('Missing size: '+name);
 const width=e?e.width:d.length,height=e?e.height:d.width;
 if(!width||!height)throw Error('Invalid dimensions: '+name);
 const grade=idx<4?5:idx<11?4:idx<19?3:idx<31?2:1;
 const screenshot=Math.floor(idx/15)+1,local=idx%15;
 return {id:idx+1,name,category:'家居物品',price,priceSource:'用户截图显示价格，仅作游戏参考价',screenshot,screenshotFile:files[screenshot-1],row:Math.floor(local/3)+1,column:local%3+1,width,height,cells:width*height,orientation:width===height?'方形':width>height?'横向':'竖向',grade,color:colors[grade],gradeSource:'用户截图标签底色',sizeStatus:'已查到网络尺寸，用户未逐项复核',sizeSource:e?e.source:github,sourceFields:e?{width,height}:{length:d.length,width:d.width},...(d?{objectID:d.objectID,officialIconURL:d.pic}:{}),...(e?.icon?{officialIconURL:e.icon}: {})};
});
if(items.length!==45||new Set(items.map(x=>x.name)).size!==45)throw Error('Catalog count/duplicate mismatch');
const data={category:'家居物品',checkedAt:'2026-10-05',count:45,sizeConvention:'宽×高；横向长边在宽度，竖向长边在高度。数据源 length 对应横向格数、width 对应纵向格数。',status:'已整理待后续分类统一接入；本次未修改游戏或精修现有图片',items};
for(const p of ['work/home-items.json','outputs/家居物品数据.json'])fs.writeFileSync(p,JSON.stringify(data,null,2));
let md='# 家居物品清单\n\n共 45 件，按三张截图从左到右、从上到下编号。尺寸为**宽×高**；品阶和参考价格按用户截图记录。格数来自网络资料，尚未由用户逐项确认。核查日期：2026-10-05。\n\n| 编号 | 名称 | 品阶 | 宽×高 | 占格 | 方向 | 截图参考价 | 格数来源 |\n|---:|---|---|---|---:|---|---:|---|\n';
for(const x of items)md+='| '+[x.id,x.name,x.color,x.width+'×'+x.height,x.cells,x.orientation,x.price.toLocaleString('en-US'),'[查阅]('+x.sizeSource+')'].join(' | ')+' |\n';
md+='\n来源为社区收藏品数据集 DeltaForceData 和三角洲小涛查（Orzice）物品详情页。价格只保存截图值，不使用波动中的实时交易价。网络资料可能随版本更新；若后续与用户游戏的格子画面不符，以用户提供的游戏画面为准。\n\n本次仅保存家居分类资料，图片细节和游戏接入等其他分类收齐后统一处理。\n';
fs.writeFileSync('outputs/家居物品清单.md',md);
const sizes={},grades={};for(const x of items){sizes[x.width+'×'+x.height]=(sizes[x.width+'×'+x.height]||0)+1;grades[x.color]=(grades[x.color]||0)+1;}
console.log(JSON.stringify({count:items.length,sizes,grades,sourceCounts:{dataset:items.filter(x=>x.sizeSource===github).length,detail:items.filter(x=>x.sizeSource!==github).length}},null,2));
