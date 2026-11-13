// A lived-in bench: 8 coffees with diaries, a Top 5, 9 brews and a profile.
const demo=()=>{const y=new Date().getFullYear(),d=(m,dd)=>y+'-'+String(m).padStart(2,'0')+'-'+String(dd).padStart(2,'0');
  const B=[['guj1x2345','Guji Hambela','Archers','ethiopia','natural','landrace',4.5,true,'blueberry, jasmine, cacao'],['kar1x2345','Karimukui AA','Spirit Hub','kenya','washed','sl28',4.5,true,'blackcurrant, grapefruit, cane sugar'],
   ['aji1x2345','Aroma Nativo Ají','Spirit Hub','colombia','hydrohoney','aji',5,true,'peach, berries, passion fruit'],['har1x2345','Haraz Mocha','Mocca Co','yemen','natural','yemenia',5,false,'raisin, spice, cocoa'],
   ['esm1x2345','Esmeralda Geisha','Ninety Plus','panama','washed','geisha',5,false,'jasmine, bergamot, peach'],['inj1x2345','El Injerto','Kayan','guatemala','washed','bourbon',4,false,'milk chocolate, orange'],
   ['nya1x2345','Nyamasheke','Archers','rwanda','honey','bourbon',4,false,'plum, black tea'],['div1x2345','El Diviso Pink Bourbon','SEY','colombia','washed','pinkbourbon',4.5,false,'red grape, hibiscus']];
  const beans=B.map(([id,name,roaster,origin,process,variety,rating,shelf,fl],i)=>({id,name,roaster,origin,process,variety,rating,shelf,flavours:fl,tried:d(10-Math.floor(i/3),20-i*2),roastDate:d(10-Math.floor(i/3),12-i),bag:250,
    diary:i===0?[{id:'dya1',d:d(10,22),k:'best',t:'Syrupy and bright: 15 g, 250 ml, grind 5.6 on the ZP6. Blueberry everywhere.'},{id:'dya2',d:d(10,12),k:'opened',t:'The bag smells like jam and jasmine.'}]
      :i===1?[{id:'dyb1',d:d(10,18),k:'dial',t:'Coarser by half a step and 92°C: the tomato note finally turned to blackcurrant.'}]:i===2?[{id:'dyc1',d:d(10,25),k:'shared',t:'Brewed it for the family on Friday. Everyone asked for a second cup.'}]:[]}));
  localStorage.setItem('bb-beans',JSON.stringify(beans));
  localStorage.setItem('bb-top3',JSON.stringify({[y]:{ids:['esm1x2345','aji1x2345','har1x2345','guj1x2345',''],hm:['kar1x2345'],at:Date.now()}}));
  const now=Date.now(),L=[];for(let i=0;i<9;i++)L.push({id:'l'+i+'demo',ts:now-i*1.7*864e5,date:new Date(now-i*1.7*864e5).toISOString(),coffee:B[i%3][1],rating:4+(i%2),stars:4+(i%2),snap:{b:['v60','sw','v60'][i%3],dose:15,rec:['The Ultimate V60','Kasuya 4:6','Hoffmann 1 cup'][i%3],bean:{id:B[i%3][0]}}});
  localStorage.setItem('bb-log',JSON.stringify(L));
  localStorage.setItem('bb-profile',JSON.stringify({nick:'Sam',name:'Sam Rivers',brief:'Chasing florals with a Switch and a ZP6. Washed Ethiopians forever.',city:'Lisbon',style:'bright',brewer:'v60',origin:'ethiopia',av:{e:'🌸',c:'#4F8A74'},since:Date.now()-200*864e5,updated:1})) };
module.exports=demo;
