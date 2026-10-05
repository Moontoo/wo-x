const fs=require('fs');
(async()=>{
 const url='https://deltaforce.th.gl/zh-CN/db/collectibles/item_15200000160';
 const h=await(await fetch(url)).text();fs.writeFileSync('work/intel-db.html',h);
 for(const m of h.matchAll(/.{0,150}破损的脑机.{0,150}/g))console.log(m[0]);
})().catch(console.error);
