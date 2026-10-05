const fs=require('fs');
(async()=>{
 const urls=['https://orzice.com/v/scp_book',...[3,4].map(p=>'https://orzice.com/v/scp_book?grade=-1&mtype=-1&n=&p='+p+'&top=3-2')];
 const list=[];
 for(const u of urls){const h=await(await fetch(u)).text();for(const m of h.matchAll(/href="(\/v\/info\/\d+)"[^>]*title="查看 ([^"]+) 详情"/g))list.push({path:m[1],name:m[2]});}
 fs.writeFileSync('work/craft-index.json',JSON.stringify(list,null,2));console.log(JSON.stringify(list));
})().catch(console.error);
