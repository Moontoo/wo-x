const fs=require('fs');
(async()=>{
 let url='https://orzice.com/v/scp_book?top=3-2&grade=-1&mtype=5&n=&p=1',links=[],p=1;
 while(url){
  const h=await(await fetch(url)).text();fs.writeFileSync('work/energy-index-'+p+'.html',h);
  links.push(...[...h.matchAll(/href="(\/v\/info\/\d+)"[^>]*title="查看 ([^"]+) 详情"/g)].map(m=>({path:m[1],name:m[2]})));
  const next=[...h.matchAll(/href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].find(m=>m[1].includes('scp_book')&&m[2].includes('下一页'));
  url=next?'https://orzice.com'+next[1].replace(/&amp;/g,'&'):null;p++;if(p>10)throw Error('Unexpected pages');
 }
 fs.writeFileSync('work/energy-links.json',JSON.stringify(links,null,2));console.log(JSON.stringify(links));
 const rows=require('./energy-rows.json'),ds=JSON.parse(fs.readFileSync('work/collection-source.json')).jData.data.data.list,extras=[];
 for(const [name] of rows.filter(([n])=>!ds.some(d=>d.objectName===n))){
  const link=links.find(x=>x.name===name);if(!link){console.log('NO LINK',name);continue;}
  const source='https://orzice.com'+link.path,h=await(await fetch(source)).text();
  fs.writeFileSync('work/energy-detail-'+link.path.split('/').pop()+'.html',h);
  const dim=h.match(/class="o_weight"[^>]*>\s*(\d+)\s*[×x]\s*(\d+)\s*</),icon=h.match(/class="orz-item-img"[\s\S]{0,800}?<img[^>]*src="([^"]+)"/);
  const e={name,width:dim?Number(dim[1]):null,height:dim?Number(dim[2]):null,source,...(icon?{officialIconURL:icon[1]}:{})};extras.push(e);console.log(JSON.stringify(e));
 }
 fs.writeFileSync('work/energy-extras.json',JSON.stringify(extras,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
