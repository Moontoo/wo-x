const fs=require('fs');
const rows=[
 ['复苏呼吸机',3528786],['ECMO',2157502],['自动体外除颤器',1962186],['医疗机械人',1265066],['呼吸机',447606],['便携氧气筒',158970],['检眼镜',112384],['静脉定位器',78711],['心脏支架',77364],['哮喘吸入器',75073],['血氧仪',66444],['体内除颤器',58466],['E型滤毒罐',68166],['离心机',61164],['生化培养箱',56868],
 ['血压仪',41591],['人工膝关节',24434],['输液加温器',22103],['急救喷雾',15428],['无菌敷料包',48370],['医疗无人机',32595],['骨锯',22401],['电子显微镜',15354],['听诊器',16031],['医用酒精',12348],['额温枪',10731],['医用吻合器',7611],['输液工具',2496],['小药瓶',2597],['注射器',2364],
 ['手术镊子',2228],['盐溶液',2048],['含氟牙膏',2264],['样本试管',1984],['外科手套',1120],['手术剪刀',1012]
];
const extra={
 'ECMO':[3,3,1021],'医疗机械人':[2,3,1024],'便携氧气筒':[1,3,1261],'检眼镜':[1,2,1285],'心脏支架':[1,2,1026],'哮喘吸入器':[1,1,1262],'体内除颤器':[1,1,1019],'离心机':[2,2,842],'生化培养箱':[2,2,841],'人工膝关节':[1,2,836],'输液加温器':[1,1,1322],'急救喷雾':[1,1,1286],'电子显微镜':[1,3,838],'医用吻合器':[1,1,1355]
};
const github='https://github.com/jiansenc/DeltaForceData/blob/main/public/json/props/collection.json';
const dataset=JSON.parse(fs.readFileSync('work/collection-source.json','utf8')).jData.data.data.list;
const files=['f4164589dbb166fec5a4134abbb1deaa.png','ffec31a55d235de6dc5c2a972b66d93d.png','a41815e7a12f2349425b8739f09ddd61.png'];
const colors=['白','绿','蓝','紫','金','红'];
const items=rows.map(([name,price],idx)=>{
 const d=dataset.find(x=>x.objectName===name),e=extra[name];
 if(!d&&!e)throw Error('Missing: '+name);
 const width=e?e[0]:d.length,height=e?e[1]:d.width;
 const grade=idx<5?5:idx<13?4:idx<20?3:idx<27?2:idx<32?1:0;
 const screenshot=Math.floor(idx/15)+1,local=idx%15;
 return {id:idx+1,name,category:'医疗道具',price,priceSource:'用户截图的显示价格，仅作游戏参考价',screenshot,screenshotFile:files[screenshot-1],row:Math.floor(local/3)+1,column:local%3+1,width,height,cells:width*height,orientation:width===height?'方形':width>height?'横向':'竖向',grade,color:colors[grade],gradeSource:'用户截图标签底色',sizeStatus:'已查到网络尺寸，用户未逐项复核',sizeSource:e?'https://orzice.com/v/info/'+e[2]:github,sourceFields:e?{width:e[0],height:e[1]}:{length:d.length,width:d.width},...(d?{objectID:d.objectID,officialIconURL:d.pic}:{}),...(name==='检眼镜'?{corroboratingSource:'https://ol.3dmgame.com/gl/337714.html'}:{})};
});
const data={category:'医疗道具',checkedAt:'2026-10-05',count:36,sizeConvention:'宽×高；横向长边在宽度，竖向长边在高度。数据源 length 对应游戏横向格数、width 对应纵向格数，已与之前用户确认的电子物品尺寸交叉校验。',status:'已整理待后续分类统一接入；本次未修改游戏或精修现有图片',items};
fs.writeFileSync('work/medical-items.json',JSON.stringify(data,null,2));
fs.writeFileSync('outputs/医疗道具数据.json',JSON.stringify(data,null,2));
let md='# 医疗道具清单\n\n共 36 件，按截图从左到右、从上到下编号。尺寸为**宽×高**。格数来自网络资料，品阶和参考价格按用户截图记录；并非用户逐项确认。核查日期：2026-10-05。\n\n| 编号 | 名称 | 品阶 | 宽×高 | 占格 | 方向 | 截图参考价 | 格数来源 |\n|---:|---|---|---|---:|---|---:|---|\n';
for(const x of items)md+='| '+[x.id,x.name,x.color,x.width+'×'+x.height,x.cells,x.orientation,x.price.toLocaleString('en-US'),'[查阅]('+x.sizeSource+')'].join(' | ')+' |\n';
md+='\n格数来源：社区收藏品数据集 DeltaForceData 与三角洲小涛查（Orzice）物品详情页。检眼镜另用 [3DM 的竖向两格说明](https://ol.3dmgame.com/gl/337714.html)交叉核对。网络资料可能随版本更新，后续如与用户实际游戏版本不同，以用户提供的游戏格子画面为准。\n\n本次只保存医疗分类资料；既有电子图标细节按用户要求，等其他分类收齐后统一修改。\n';
fs.writeFileSync('outputs/医疗道具清单.md',md);
const groups={};for(const x of items)(groups[x.width+'×'+x.height]??=[]).push(x.name);
console.log(JSON.stringify({count:items.length,groups},null,2));
