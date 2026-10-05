const fs=require('fs');
(async()=>{for(const [id,name] of [[1322,'输液加温器'],[1355,'医用吻合器']]){
 const t=await fetch('https://orzice.com/v/info/'+id).then(r=>r.text());fs.writeFileSync('work/medical-info-'+id+'.html',t);
 const i=t.indexOf('×');console.log(name,t.slice(i-450,i+200));
}})().catch(e=>{console.error(e.message);process.exitCode=1});
