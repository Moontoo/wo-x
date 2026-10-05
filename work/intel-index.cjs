const fs=require('fs');
(async()=>{
 let url='https://orzice.com/v/scp_book?top=3-2&grade=-1&mtype=7&n=&p=1',links=[],p=1;
 while(url){
  const h=await(await fetch(url)).text();fs.writeFileSync('work/intel-category-'+p+'.html',h);
  const found=[...h.matchAll(/href="(\/v\/info\/\d+)"[^>]*title="查看 ([^"]+) 详情"/g)].map(m=>({path:m[1],name:m[2]}));
  links.push(...found);console.log(p,JSON.stringify(found));
  const next=[...h.matchAll(/href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].find(m=>m[1].includes('scp_book')&&m[2].includes('下一页'));
  url=next?'https://orzice.com'+next[1].replace(/&amp;/g,'&'):null;p++;
  if(p>10)throw Error('Unexpected page count');
 }
 fs.writeFileSync('work/intel-links.json',JSON.stringify(links,null,2));
})().catch(console.error);
