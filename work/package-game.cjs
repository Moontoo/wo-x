const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../outputs/harbor-bid/dist');
let html=fs.readFileSync(root+'/index.html','utf8');
for(const name of ['style.css','grid.css','scratch.css','item-images.css','online-v3.css'])html=html.replace('<link rel="stylesheet" href="'+name+'">','<style>'+fs.readFileSync(root+'/'+name,'utf8')+'</style>');
for(const name of ['catalog.js','all-items.js','electronics-atlases.js','scratch.js','container-art.js','item-images.js','loot.js','loans.js','grid.js','online-v2.js'])html=html.replace('<script src="'+name+'"></script>','<script>'+fs.readFileSync(root+'/'+name,'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
for(const src of new Set(html.match(/assets\/[\w-]+\.png/g)||[]))html=html.replaceAll(src,'data:image/png;base64,'+fs.readFileSync(path.join(root,src)).toString('base64'));
fs.writeFileSync(path.resolve(__dirname,'../outputs/港口盲箱.html'),html);
console.log('Standalone game updated: '+(Buffer.byteLength(html)/1048576).toFixed(1)+' MB.');
