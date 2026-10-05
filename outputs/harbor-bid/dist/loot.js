// Categories remain mixed; premium containers enforce the requested colour/size gate.
const CARGO_BALANCE_REVISION=8;
const cargoRiskProfiles=[
 {
  "surgeChance": 0.035,
  "dudChance": 0.03,
  "normal": [
   30,
   55,
   14.8,
   0.18,
   0.02
  ],
  "surge": [
   15,
   30,
   52,
   2.8,
   0.2
  ],
  "dud": [
   70,
   25,
   4.5,
   0.45,
   0.05
  ],
  "label": "小额试运气"
 },
 {
  "surgeChance": 0.06,
  "dudChance": 0.04,
  "normal": [
   24,
   53,
   22.7,
   0.25,
   0.05
  ],
  "surge": [
   15,
   30,
   52,
   2.8,
   0.2
  ],
  "dud": [
   70,
   25,
   4.5,
   0.45,
   0.05
  ],
  "label": "进阶淘货"
 },
 {
  "surgeChance": 0.09,
  "dudChance": 0.05,
  "normal": [
   18,
   46,
   35.65,
   0.3,
   0.05
  ],
  "surge": [
   15,
   30,
   52,
   2.8,
   0.2
  ],
  "dud": [
   70,
   25,
   4.5,
   0.45,
   0.05
  ],
  "label": "风险加码"
 },
 {
  "surgeChance": 0.13,
  "dudChance": 0.14,
  "normal": [
   5,
   30,
   64,
   0.95,
   0.05
  ],
  "surge": [
   8,
   25,
   54,
   12,
   1
  ],
  "dud": [
   70,
   25,
   4.5,
   0.45,
   0.05
  ],
  "label": "高风险高回报"
 },
 {
  "surgeChance": 0.24,
  "dudChance": 0.2,
  "normal": [
   5,
   30,
   64,
   0.95,
   0.05
  ],
  "surge": [
   8,
   25,
   54,
   12,
   1
  ],
  "dud": [
   70,
   25,
   4.5,
   0.45,
   0.05
  ],
  "label": "高风险高回报"
 },
 {
  "surgeChance": 0.34,
  "dudChance": 0.27,
  "normal": [
   5,
   30,
   64,
   0.95,
   0.05
  ],
  "surge": [
   8,
   25,
   54,
   12,
   1
  ],
  "dud": [
   70,
   25,
   4.5,
   0.45,
   0.05
  ],
  "label": "高风险高回报"
 }
];
function cargoValueBand(price){return price<50000?0:price<200000?1:price<1000000?2:price<5000000?3:4;}
// Choose shared cargo quality before drawing individual items; never use player finances.
function cargoDrawWeights(index){const profile=cargoRiskProfiles[index],roll=Math.random();return roll<profile.surgeChance?profile.surge:roll<profile.surgeChance+profile.dudChance?profile.dud:profile.normal;}
function cargoAllowsItem(t,item){return t.price<6000000||item.fixedGrade>=2||(item.w===3&&item.h===3)||(item.w===2&&item.h===4);}
const cargoPoolCache=new WeakMap();
function cargoItemPool(t,pool){if(t.price<6000000)return pool;let filtered=cargoPoolCache.get(pool);if(!filtered){filtered=pool.filter(item=>cargoAllowsItem(t,item));cargoPoolCache.set(pool,filtered);}return filtered;}
const cargoBandCache=new WeakMap();
function pickCargoItem(pool,weights){
 let bands=cargoBandCache.get(pool);
 if(!bands){bands=[[],[],[],[],[]];for(const item of pool)bands[cargoValueBand(item.referencePrice)].push(item);cargoBandCache.set(pool,bands);}
 const total=weights.reduce((sum,w,i)=>sum+(bands[i].length?w:0),0);
 let roll=Math.random()*total;
 for(let i=0;i<bands.length;i++){if(!bands[i].length)continue;roll-=weights[i];if(roll<0)return pick(bands[i]);}
 return pick(bands.findLast(band=>band.length));
}

// Roll the advertised outcome independently of funds, debt and play history.
const cargoBreakEvenChances=[.95,.95,.90,.85,.75,.75];
function cargoMinimumReds(t){return t.price>=6000000?4:0;}
const cargoRedCache=new WeakMap();
function cargoRedPool(pool){let reds=cargoRedCache.get(pool);if(!reds){reds=pool.filter(it=>it.fixedGrade===5);cargoRedCache.set(pool,reds);}return reds;}
function cargoMeetsOutcome(t,items,win){return items.length===t.count&&new Set(items.filter(it=>it.fixedGrade===5).map(it=>it.key)).size>=cargoMinimumReds(t)&&(items.reduce((sum,it)=>sum+it.value,0)>=t.price)===win;}
function cargoFallback(t,win){
 const small=cargoItemPool(t,catalog).filter(it=>it.w===1&&it.h===1).sort((a,b)=>a.referencePrice-b.referencePrice);
 const reds=small.filter(it=>it.fixedGrade===5),required=cargoMinimumReds(t);
 if(!small.length||required&&!reds.length)throw Error('No compact cargo fallback');
 const chosen=Array.from({length:t.count},(_,i)=>i<required?reds[i]:small[0]);
 let value=chosen.reduce((sum,it)=>sum+it.referencePrice,0);
 const budget=t.price*(win?1.08:.80);
 for(let i=0;i<chosen.length;i++){
  const pool=i<required?reds.filter(it=>!chosen.some((other,j)=>j!==i&&j<required&&other.key===it.key)):small,room=budget-value+chosen[i].referencePrice;
  const options=pool.filter(it=>it.referencePrice<=room);
  if(options.length){const replacement=options[options.length-1];value+=replacement.referencePrice-chosen[i].referencePrice;chosen[i]=replacement;}
 }
 if(win&&value<t.price){
  for(let i=0;i<chosen.length&&value<t.price;i++){
   const pool=i<required?reds.filter(it=>!chosen.some((other,j)=>j!==i&&j<required&&other.key===it.key)):small,need=t.price-value+chosen[i].referencePrice;
   const replacement=pool.find(it=>it.referencePrice>=need)||pool[pool.length-1];
   if(replacement.referencePrice>chosen[i].referencePrice){value+=replacement.referencePrice-chosen[i].referencePrice;chosen[i]=replacement;}
  }
 }
 const items=pack(t,small,null,cargoRiskProfiles[0].normal,chosen);
 if(!cargoMeetsOutcome(t,items,win))throw Error('Cargo outcome could not be filled');
 return items;
}
function drawBalancedCargo(t,index){
 const win=Math.random()<cargoBreakEvenChances[index],weights=cargoDrawWeights(index);
 const reds=cargoRedPool(cargoItemPool(t,catalog));
 for(let attempt=0;attempt<64;attempt++){
  const remaining=reds.slice(),required=[];
  for(let i=0;i<cargoMinimumReds(t);i++){const item=pickCatalog(remaining,weights);required.push(item);remaining.splice(remaining.indexOf(item),1);}
  const items=pack(t,catalog,null,weights,required);
  const value=items.reduce((sum,it)=>sum+it.value,0),ceiling=[1.28,1.30,1.40,Infinity,Infinity,Infinity][index];
  if(cargoMeetsOutcome(t,items,win)&&(!win||weights===cargoRiskProfiles[index].surge||value<=t.price*ceiling))return items;
 }
 return cargoFallback(t,win);
}
