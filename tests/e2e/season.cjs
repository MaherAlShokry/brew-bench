// Origins map: "In season" lists the origins being harvested this month and those whose new crop is arriving, from
// each origin's harvest months; the map highlights them, and a region in the legend replaces the season.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1200);
const r=await p.evaluate(()=>({a:JSON.stringify(harvestRanges('Oct to Jan')),b:JSON.stringify(harvestRanges('Main Oct to Dec, fly crop Apr to Jun')),c:harvestRanges('Year-round: main crop'),d:harvestRanges('Varies by region'),
  // November (10): Kenya (Oct–Dec) is being picked; Brazil (May–Sep) finished 2 months ago, so its new crop is arriving; in July (6) Brazil is being picked.
  kenyaNov:seasonOf('kenya',10),brazilNov:seasonOf('brazil',10),brazilJul:seasonOf('brazil',6),wrap:seasonOf('ethiopia',0)}));
ok('harvest months are read from the text, a year-round crop and an unknown one too',r.a==='[[9,0]]'&&r.b==='[[9,11],[3,5]]'&&r.c==='all'&&r.d===null,r);
ok('being picked and new crop arriving are worked out by month, across the new year',r.kenyaNov.now&&!r.kenyaNov.arriving&&!r.brazilNov.now&&r.brazilNov.arriving&&r.brazilJul.now&&r.wrap.now,r);
await p.evaluate(()=>goTab('map'));await p.waitForTimeout(1500);
await p.click('[data-ss="now"]');await p.waitForTimeout(300);
const on=await p.evaluate(()=>{const mo=new Date().getMonth(),want=seasonList('now',mo),chips=[...document.querySelectorAll('.ms-chips [data-o]')].map(x=>x.dataset.o),hl=[...document.querySelectorAll('#worldmap .o.hl')].map(x=>x.dataset.k);
  return{same:JSON.stringify(want)===JSON.stringify(chips),dim:$('worldmap').classList.contains('dim'),hlOk:hl.every(k=>want.includes(k)),n:chips.length}});
ok('Harvest now lists this month’s origins and highlights them on the map',on.same&&on.dim&&on.hlOk&&on.n>0,on);
await p.click('.ms-chips [data-o]');await p.waitForTimeout(400);ok('a listed origin opens on the map',await p.evaluate(()=>!!SEL));
await p.click('#legend [data-hl]');await p.waitForTimeout(300);ok('picking a region replaces the season',await p.evaluate(()=>SEASON===null&&!document.querySelector('.ms-chips')));
ok('no errors',!errs.length,errs);await b.close()})();
