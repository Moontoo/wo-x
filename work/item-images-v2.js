function localImageURL(src){
 if(!src.startsWith('data:')||typeof Blob==='undefined')return src;
 const split=src.indexOf(','),mime=src.slice(5,src.indexOf(';')),binary=atob(src.slice(split+1)),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return URL.createObjectURL(new Blob([bytes],{type:mime}));
}
for(const sheet of [...catalogSheets,...electronicAtlases])sheet.src=localImageURL(sheet.src);
function itemVisual(it,kind='tile'){
 let atlas,box;
 if(it.sourceId){atlas=electronicAtlases[Math.floor((it.sourceId-1)/15)];box=atlas?.cells[(it.sourceId-1)%15];}
 else if(it.imageSpec){atlas=catalogSheets[it.imageSpec.sheet];box=it.imageSpec;}
 if(!atlas||!box)return `<span class="${kind==='tile'?'cargo-symbol':'fallback-icon'}">${it.icon}</span>`;
 return `<svg class="item-image item-image-${kind}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" role="img" aria-label="${escapeHTML(it.name)}" preserveAspectRatio="xMidYMid meet"><image href="${atlas.src}" x="0" y="0" width="${atlas.width}" height="${atlas.height}" /></svg>`;
}
