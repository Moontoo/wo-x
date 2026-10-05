const fs=require('fs');
(async()=>{
 let links=JSON.parse(fs.readFileSync('work/craft-category-links.json'));
 for(let p=2;p<=10;p++){
  const url='https://orzice.com/v/scp_book?top=3-2&grade=-1&mtype=1&n=&p='+p;
  const h=await(await fetch(url)).text();
  fs.writeFileSync('work/craft-category-'+p+'.html',h);
  const found=[...h.matchAll(/href="(\/v\/info\/\d+)"[^>]*title="查看 ([^"]+) 详情"/g)].map(m=>({path:m[1],name:m[2]}));
  links.push(...found); console.log(p,JSON.stringify(found));
 }
 fs.writeFileSync('work/craft-category-links.json',JSON.stringify(links,null,2));
})().catch(console.error);
