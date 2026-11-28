// A bench lived in for a year: the demo bench (seed2) plus 24 more coffees and 150 brews with ratings, flavours, notes,
// dial-in snapshots and how they tasted. The speed check runs on this: slowdowns that only show with a real log (the
// Brew log opening from Settings, the diary, the profile) show here before they reach a phone.
const demo=require('./seed2.cjs');
const more=()=>{const y=new Date().getFullYear(),now=Date.now(),beans=JSON.parse(localStorage.getItem('bb-beans')||'[]');
  const O=['ethiopia','kenya','colombia','panama','guatemala','rwanda','yemen','brazil','costarica','honduras','peru','burundi'],P=['washed','natural','honey','anaerobic'],R=['Archers','Spirit Hub','SEY','Kayan','Mocca Co','Ninety Plus'];
  const F=['peach, jasmine, honey','blueberry, cacao','plum jam, black tea','grapefruit & caramel','raisin, cocoa, spice','bergamot, peach'];
  for(let i=0;i<24;i++)beans.push({id:'big'+i+'x123',name:'Lot '+(i+1)+' '+O[i%O.length].replace(/^./,c=>c.toUpperCase()),roaster:R[i%R.length],origin:O[i%O.length],process:P[i%P.length],rating:3+(i%3),shelf:i<4,flavours:F[i%F.length],
    tried:y+'-'+String(1+i%11).padStart(2,'0')+'-10',roastDate:y+'-'+String(1+i%11).padStart(2,'0')+'-02',bag:250});
  localStorage.setItem('bb-beans',JSON.stringify(beans));
  const L=JSON.parse(localStorage.getItem('bb-log')||'[]'),FL=['fruity.stone-fruit.peach','floral.floral.jasmine','fruity.berry.blueberry','nutty-cocoa.cocoa.cacao','fruity.citrus-fruit.bergamot','fruity.stone-fruit.plum','floral.tea-like.black-tea','sweet.brown-sugar.caramel'];
  const RN=['Tetsu Kasuya 4:6','The Ultimate V60','New Hybrid (2025)','Standard hybrid','Hoffmann 1 cup'],BR=['v60','v60','sw','sw','v60'];
  for(let i=0;i<150;i++){const b=beans[i%beans.length],k=i%5,ts=now-(i+2)*2.1*864e5;
    L.push({id:'big'+i+'log',ts,date:new Date(ts).toISOString(),coffee:b.name,settings:RN[k]+', 15g : 250g, 93°C',stars:2+(i%4),rating:2+(i%4),brewer:BR[k],pred:i%3?'':'Balanced',
      notes:i%4?'':'Sweet and clean, a touch thin at the end. Next time a click finer.',taste:['sour','good','bitter'][i%3],fl:[[FL[i%FL.length],3],[FL[(i+3)%FL.length],2]],
      snap:{b:BR[k],dose:15,water:250,rec:RN[k],g:'zp6',c:44+(i%5),t:93,bean:{id:b.id}}})}
  localStorage.setItem('bb-log',JSON.stringify(L))};
// One self-contained function (the speed check sends it into the page as text): the demo bench, then the year of brews.
module.exports=eval('(()=>{('+demo.toString()+')();('+more.toString()+')()})');
