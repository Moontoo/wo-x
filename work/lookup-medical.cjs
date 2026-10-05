const fs=require('fs');
(async()=>{
for(const [name,p] of [['输液加温器',12],['医用吻合器',16]]){
 const t=await fetch('https://orzice.com/v/scp_book?grade=-1&mtype=-1&n=&p='+p+'&top=3-2').then(r=>r.text());
 fs.writeFileSync('work/source-'+name+'.html',t);
 const links=[...t.matchAll(/href="(\/v\/info\/\d+)"[^>]*title="查看 ([^"]+) 详情"/g)].map(m=>({url:'https://orzice.com'+m[1],name:m[2]}));
 console.log(JSON.stringify(links));
}
})().catch(e=>{console.error(e.message);process.exitCode=1});
