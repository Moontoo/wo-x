const fs=require('fs');
(async()=>{
 const links=[];let url='https://orzice.com/v/keys',seen=new Set(),page=0;
 while(url&&!seen.has(url)&&page<15){
  seen.add(url);page++;
  const t=page===1?fs.readFileSync('work/keycards-index.html','utf8'):await fetch(url).then(r=>r.text());
  fs.writeFileSync('work/keycards-index-'+page+'.html',t);
  const found=[...t.matchAll(/href="(\/v\/info\/[^"?]+)"[^>]*title="点击查看【([^】]+)】详情"/g)].map(m=>({name:m[2],url:'https://orzice.com'+m[1]}));
  for(const x of found)if(!links.some(a=>a.name===x.name))links.push(x);
  console.log('page '+page+', items '+found.length+', total '+links.length);
  if(!found.length)break;
  const next=t.match(/<a href="([^"]+)" class="pagination-next">下一页/);
  url=next?new URL(next[1].replace(/&amp;/g,'&'),url).href:null;
 }
 fs.writeFileSync('work/keycard-links.json',JSON.stringify(links,null,2));
 const rows=require('./keycard-rows.json');console.log(JSON.stringify({count:links.length,missing:rows.filter(x=>!links.some(l=>l.name===x[0])).map(x=>x[0])},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
