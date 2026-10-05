// Categories remain mixed; premium containers enforce the requested colour/size gate.
const CARGO_BALANCE_REVISION=6;
const cargoRiskProfiles=[
 {
  "surgeChance": 0.02,
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
  "surgeChance": 0.04,
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
  "surgeChance": 0.06,
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
  "surgeChance": 0.1,
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
  "surgeChance": 0.13,
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
  "surgeChance": 0.16,
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
