const fs=require('fs'),rows=require('./keycard-rows.json');
const list=JSON.parse(fs.readFileSync('work/key-source.json')).jData.data.data.list;
console.log(JSON.stringify({count:rows.length,missing:rows.map((x,i)=>({id:i+1,name:x[0]})).filter(x=>!list.some(d=>d.objectName===x.name))},null,2));
