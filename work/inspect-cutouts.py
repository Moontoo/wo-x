from PIL import Image
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent / 'outputs' / '电子物品图集'
result=[]
for i in range(1,6):
    p=root/f'电子物品图集-{i}-清理版.png' if i>=4 else root/f'电子物品图集-{i}.png'
    im=Image.open(p).convert('RGBA')
    a=im.getchannel('A')
    hist=a.histogram()
    rows=2 if i==5 else 5
    cells=[]
    pixels=a.load()
    for n in range(4 if i==5 else 15):
        col=n%3; row=n//3
        left=round(col*im.width/3);right=round((col+1)*im.width/3)
        top=round(row*im.height/rows);bottom=round((row+1)*im.height/rows)
        xs=[];ys=[]
        for y in range(top,bottom):
            for x in range(left,right):
                if pixels[x,y]>=64: xs.append(x);ys.append(y)
        if not xs: raise RuntimeError(f'Empty object cell {i}/{n}')
        x0=max(left,min(xs)-4);y0=max(top,min(ys)-4)
        x1=min(right,max(xs)+5);y1=min(bottom,max(ys)+5)
        cells.append({'x':x0,'y':y0,'width':x1-x0,'height':y1-y0})
    result.append({'sheet':i,'width':im.width,'height':im.height,'alphaRange':a.getextrema(),'fullyTransparentFraction':hist[0]/(im.width*im.height),'cornerAlpha':[a.getpixel((x,y)) for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]],'rows':rows,'cells':cells})
print(json.dumps(result))
(root/'图集参数.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
