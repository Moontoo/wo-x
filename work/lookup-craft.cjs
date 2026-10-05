const fs=require('fs');
const rows=require('./craft-rows.json');
const ds=JSON.parse(fs.readFileSync('work/collection-source.json')).jData.data.data.list;
async function run(){
 const missing=rows.filter(([n])=>!ds.some(d=>d.objectName===n));
 const links=[];
 for(let start=0;start<missing.length;start+=4){
  const results=await Promise.allSettled(missing.slice(start,start+4).map(async([name])=>{
   const url='https://orzice.com/v/scp_book?grade=-1&mtype=-1&n='+encodeURIComponent(name.replace(/[“”]/g,''))+'&p=1&top=3-2';
   const html=await (await fetch(url)).text();
   fs.writeFileSync('work/craft-search-'+rows.findIndex(x=>x[0]===name)+'.html',html);
   const matches=[...html.matchAll(/href="(\/v\/info\/\d+)"[^>]*title="查看 ([^"]+) 详情"/g)].map(m=>({path:m[1],name:m[2]}));
   return {name,matches};
  }));
  for(const r of results){if(r.status==='fulfilled'){links.push(r.value);console.log(JSON.stringify(r.value));}else console.log(String(r.reason));}
 }
 fs.writeFileSync('work/craft-links.json',JSON.stringify(links,null,2));
}
run().catch(e=>{console.error(e);process.exitCode=1});
