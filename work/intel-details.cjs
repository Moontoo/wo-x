const fs=require('fs');
(async()=>{
 const rows=require('./intel-rows.json'),ds=JSON.parse(fs.readFileSync('work/collection-source.json')).jData.data.data.list,links=require('./intel-links.json');
 const extras=[];
 for(const [name] of rows.filter(([n])=>!ds.some(d=>d.objectName===n))){
  const link=links.find(x=>x.name===name);if(!link){console.log('NO LINK',name);continue;}
  const source='https://orzice.com'+link.path,h=await(await fetch(source)).text();
  fs.writeFileSync('work/intel-detail-'+link.path.split('/').pop()+'.html',h);
  const dim=h.match(/class="o_weight"[^>]*>\s*(\d+)\s*[×x]\s*(\d+)\s*</),icon=h.match(/class="orz-item-img"[\s\S]{0,800}?<img[^>]*src="([^"]+)"/);
  const e={name,width:dim?Number(dim[1]):null,height:dim?Number(dim[2]):null,source,...(icon?{officialIconURL:icon[1]}:{})};
  extras.push(e);console.log(JSON.stringify(e));
 }
 fs.writeFileSync('work/intel-extras.json',JSON.stringify(extras,null,2));
})().catch(console.error);
