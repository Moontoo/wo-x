const fs=require('fs');
const rows=require('./equipment-rows.json');
const sources=Object.fromEntries(['armor','helmet','chest','bag'].map(n=>[n,JSON.parse(fs.readFileSync('work/'+n+'-source.json')).jData.data.data.list]));
const norm=n=>n.replace(/（全新）/g,'').replace(/\s/g,'').toLowerCase();
let missing=[];
for(const [i,r] of rows.entries()){
 const type={'防弹衣':'armor','头盔':'helmet','胸挂':'chest','背包':'bag'}[r[4]];
 const d=sources[type].find(x=>norm(x.objectName)===norm(r[0]));
 if(!d)missing.push({id:i+1,name:r[0],type});
}
console.log(JSON.stringify({count:rows.length,missing},null,2));
