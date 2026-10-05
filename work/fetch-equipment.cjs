const fs=require('fs');
(async()=>{
 const names=['armor','helmet','chest','bag'];
 const results=await Promise.allSettled(names.map(async name=>{
  const url='https://raw.githubusercontent.com/jiansenc/DeltaForceData/refs/heads/main/public/json/protect/'+name+'.json';
  const r=await fetch(url);if(!r.ok)throw Error(r.status+' '+name);
  const data=await r.json();fs.writeFileSync('work/'+name+'-source.json',JSON.stringify(data,null,2));
  const list=data.jData.data.data.list;
  return {name,count:list.length,first:list[0],names:list.map(x=>x.objectName)};
 }));
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
