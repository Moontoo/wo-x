// Value bands are independent of item category or colour.
const CARGO_BALANCE_REVISION=4;
const cargoRiskProfiles=[
 {surgeChance:.02,normal:[65,20,12,2.9,.1],surge:[12,12,35,36,5],label:'小额试运气'},
 {surgeChance:.07,normal:[65,20,12,2.9,.1],surge:[12,12,35,36,5],label:'进阶淘货'},
 {surgeChance:.12,normal:[65,20,12,2.9,.1],surge:[12,12,35,36,5],label:'风险加码'},
 {surgeChance:.20,normal:[65,20,12,2.9,.1],surge:[12,12,35,36,5],label:'高风险高回报'},
 {surgeChance:.24,normal:[74,18,6,1.9,.1],surge:[12,12,35,36,5],label:'高风险高回报'},
 {surgeChance:.25,normal:[80,15,4,.9,.1],surge:[10,10,33,40,7],label:'高风险高回报'}
];
function cargoValueBand(price){return price<50000?0:price<200000?1:price<1000000?2:price<5000000?3:4;}
function cargoDrawWeights(index){const profile=cargoRiskProfiles[index];return Math.random()<profile.surgeChance?profile.surge:profile.normal;}
const cargoBandCache=new WeakMap();
function pickCargoItem(pool,weights){
 let bands=cargoBandCache.get(pool);
 if(!bands){bands=[[],[],[],[],[]];for(const item of pool)bands[cargoValueBand(item.referencePrice)].push(item);cargoBandCache.set(pool,bands);}
 const total=weights.reduce((sum,w,i)=>sum+(bands[i].length?w:0),0);
 let roll=Math.random()*total;
 for(let i=0;i<bands.length;i++){if(!bands[i].length)continue;roll-=weights[i];if(roll<0)return pick(bands[i]);}
 return pick(bands.findLast(band=>band.length));
}
