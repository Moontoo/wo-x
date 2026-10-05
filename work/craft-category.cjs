const fs=require('fs');
(async()=>{
 const root='https://orzice.com/v/scp_book?grade=-1&mtype=1&n=&p=1&top=3-2';
 const h=await(await fetch(root)).text();
 fs.writeFileSync('work/craft-category-first.html',h);
 console.log(h.match(/当前显示.{0,100}/)?.[0]);
 console.log([...h.matchAll(/href="([^"]+)"/g)].map(m=>m[1]).filter(x=>x.includes('scp_book')&&x.includes('p=')));
 const links=[...h.matchAll(/href="(\/v\/info\/\d+)"[^>]*title="查看 ([^"]+) 详情"/g)].map(m=>({path:m[1],name:m[2]}));
 fs.writeFileSync('work/craft-category-links.json',JSON.stringify(links,null,2)); console.log(links);
})().catch(console.error);
