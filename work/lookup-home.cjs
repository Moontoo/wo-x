const fs=require('fs');
(async()=>{
 const targets=new Set(['飞行员眼镜','鳄鱼蛋','鼻通','电动牙刷']);const found=[];
 for(const url of ['https://orzice.com/v/scp_book?grade=-1&mtype=-1&n=&p=9&top=3-2','https://orzice.com/v/scp_book?grade=-1&mtype=-1&n=&p=13&top=3-2','https://orzice.com/v/scp_book?n='+encodeURIComponent('鳄鱼蛋')]){
  const t=await fetch(url).then(r=>r.text());
  for(const m of t.matchAll(/href="(\/v\/info\/\d+)"[^>]*title="查看 ([^"]+) 详情"/g)){
   if(!targets.has(m[2]))continue;
   const source='https://orzice.com'+m[1];const body=await fetch(source).then(r=>r.text());
   fs.writeFileSync('work/home-info-'+m[2]+'.html',body);
   const size=body.match(/class="o_weight">(\d+)×(\d+)</);
   const icon=body.match(/<div class="orz-item-img">\s*<img src="([^"]+)"/);
   const item={name:m[2],source,width:size?Number(size[1]):null,height:size?Number(size[2]):null,icon:icon?.[1]};
   found.push(item);console.log(JSON.stringify(item));
  }
 }
 fs.writeFileSync('work/home-extra-found.json',JSON.stringify(found,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1});
