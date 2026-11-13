// A few coffees and brews, stored the way the app stores them, then a reload.
module.exports=async p=>{await p.evaluate(()=>{const y=new Date().getFullYear(),d=(m,dd)=>y+'-'+String(m).padStart(2,'0')+'-'+String(dd).padStart(2,'0');
  const beans=[['guj1x2345','Guji Hambela','Archers','ethiopia','natural','landrace',4.5,true],['kar1x2345','Karimukui AA','Spirit Hub','kenya','washed','sl28',4.5,true],
    ['har1x2345','Haraz Mocha','Mocca Co','yemen','natural','yemenia',5,false],['div1x2345','El Diviso Pink Bourbon','SEY','colombia','washed','pinkbourbon',4,false]]
   .map(([id,name,roaster,origin,process,variety,rating,shelf],i)=>({id,name,roaster,origin,process,variety,rating,shelf,tried:d(9,1+i*5),roastDate:d(9,1+i*5),flavours:'peach, jasmine, honey',bag:250,diary:[]}));
  localStorage.setItem('bb-beans',JSON.stringify(beans));
  const now=Date.now();localStorage.setItem('bb-log',JSON.stringify([0,1,2].map(i=>({id:'l'+i+'abcd',ts:now-i*864e5,date:new Date(now-i*864e5).toISOString(),coffee:'Guji Hambela',rating:4,stars:4,snap:{b:'v60',dose:15,bean:{id:'guj1x2345'}}}))))});
  await p.reload({waitUntil:'networkidle'})};
