const fs=require('fs'),rows=require('./keycard-rows.json'),links=require('./keycard-links.json');
const ds=JSON.parse(fs.readFileSync('work/key-source.json')).jData.data.data.list;
(async()=>{
 const need=rows.map((r,i)=>({id:i+1,name:r[0]})).filter(x=>!ds.some(d=>d.objectName===x.name));
 const extras=[],failed=[];
 for(let i=0;i<need.length;i+=3){
  const batch=need.slice(i,i+3);
  const results=await Promise.allSettled(batch.map(async x=>{
   const l=links.find(l=>l.name===x.name);if(!l)throw Error('Missing link');
   const t=await fetch(l.url).then(r=>r.text());fs.writeFileSync('work/keycard-info-'+x.id+'.html',t);
   const m=t.match(/class="o_weight"[^>]*>\s*(\d+)\s*×\s*(\d+)/)||t.match(/>\s*(\d+)\s*×\s*(\d+)\s*</);
   if(!m||!t.includes(x.name))throw Error('No verified dimension');
   const img=t.match(/class="orz-item-img"[^>]*>[\s\S]*?src="([^"]+)"/);
   return {...x,width:Number(m[1]),height:Number(m[2]),source:l.url,...(img?{officialIconURL:img[1]}:{})};
  }));
  for(const [j,r] of results.entries())if(r.status==='fulfilled')extras.push(r.value);else failed.push({...batch[j],reason:String(r.reason)});
 }
 fs.writeFileSync('work/keycard-extras.json',JSON.stringify(extras,null,2));
 console.log(JSON.stringify({found:extras.length,failed,sizes:[...new Set(extras.map(x=>x.width+'×'+x.height))]},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
