const fs=require('fs');
(async()=>{
 const rows=require('./craft-rows.json'),ds=JSON.parse(fs.readFileSync('work/collection-source.json')).jData.data.data.list;
 const links=[...require('./craft-category-links.json'),...require('./craft-index.json'),...require('./craft-links.json').flatMap(x=>x.matches)];
 const extras=[];
 const missing=rows.filter(([name])=>!ds.some(d=>d.objectName===name));
 for(let i=0;i<missing.length;i+=4){
  const rs=await Promise.allSettled(missing.slice(i,i+4).map(async([name,price])=>{
   const alias=name==='起舞的女郎挂饰'?'跳舞的女郎挂饰':name;
   let link=links.find(x=>x.name===alias);
   if(name==='腕带')link={path:'/v/info/1264',name};
   if(!link)throw Error('No link: '+name);
   const source='https://orzice.com'+link.path,h=await(await fetch(source)).text();
   fs.writeFileSync('work/craft-detail-'+link.path.split('/').pop()+'.html',h);
   const dim=h.match(/class="o_weight"[^>]*>\s*(\d+)\s*[×x]\s*(\d+)\s*</);
   const icon=h.match(/class="orz-item-img"[\s\S]{0,800}?<img[^>]*src="([^"]+)"/);
   const result={name,sourceName:alias,width:dim?Number(dim[1]):null,height:dim?Number(dim[2]):null,source,officialIconURL:icon?.[1]};
   if(name==='起舞的女郎挂饰')console.log(h.match(/跳舞的女郎挂饰[\s\S]{0,1400}/)?.[0]);
   return result;
  }));
  for(const r of rs){if(r.status==='fulfilled'){extras.push(r.value);console.log(JSON.stringify(r.value));}else console.log(String(r.reason));}
 }
 fs.writeFileSync('work/craft-extras.json',JSON.stringify(extras,null,2));
})().catch(console.error);
