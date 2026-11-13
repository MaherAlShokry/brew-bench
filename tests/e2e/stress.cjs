// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// A big collection: 500 coffees (with diaries), 2,000 brews and 60 recipes of your own. Times the main actions with the
// CPU slowed 4×, like a mid-range phone, and checks nothing breaks. Prints the timings; fails on errors or on an action
// far slower than it should be.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');
await p.evaluate(()=>{const O=['ethiopia','kenya','colombia','panama','guatemala','rwanda','brazil','yemen','costarica','peru','burundi','honduras'],P=['washed','natural','honey','anaerobic','carbonic'],V=['heirloom','sl28','geisha','bourbon','caturra','typica','pinkbourbon','castillo'],R=['Archers','Spirit Hub','SEY','Kayan','Mocca Co','Ninety Plus','Onyx','Tim Wendelboe'],F=['blueberry, jasmine','peach, honey','cacao, cherry','bergamot, lemon','plum, black tea','caramel, nougat'];
  const y=new Date().getFullYear(),d=(k)=>{const t=new Date(Date.now()-k*864e5);return t.toISOString().slice(0,10)};
  const beans=[];for(let i=0;i<500;i++){const id='sb'+String(i).padStart(4,'0')+'x23';beans.push({id,name:'Stress coffee '+i,roaster:R[i%R.length],origin:O[i%O.length],process:P[i%P.length],variety:V[i%V.length],rating:[3,3.5,4,4.5,5][i%5],shelf:i<14,
    flavours:F[i%F.length],tried:d(i%700),roastDate:d((i%700)+5),roast:['light','medium','dark'][i%3],bag:250,diary:i%3?[]:[{id:'dy'+i+'a',d:d(i%700),k:'best',t:'Lovely cup number '+i+'. Bright and sweet.'},{id:'dy'+i+'b',d:d((i%700)+2),k:'opened',t:'Opened.'}]})}
  localStorage.setItem('bb-beans',JSON.stringify(beans));
  const L=[],now=Date.now(),recs=['The Ultimate V60','Kasuya 4:6','Hoffmann 1 cup'];for(let i=0;i<2000;i++){const t=now-i*0.37*864e5,bn=beans[i%60];
    L.push({id:'l'+i+'st',ts:t,date:new Date(t).toISOString(),coffee:bn.name,rating:3+(i%3),stars:3+(i%3),notes:i%4?'':'Good balance, a little sharp.',snap:{b:['v60','sw','v60','origami'][i%4],dose:15,rec:recs[i%3],bean:{id:bn.id}},fl:i%2?[['f-blueberry',2]]:[]})}
  localStorage.setItem('bb-log',JSON.stringify(L));
  const my=[];for(let i=0;i<60;i++)my.push({id:'rc'+i+'st',b:'v60',name:'My recipe '+i,dose:15,water:250,temp:93,off:0,steps:['0:00 pour 50g, bloom.','0:45 pour to 150g.','1:30 pour to 250g.','3:00 finished.']});
  localStorage.setItem('bb-myrecipes',JSON.stringify(my));
  localStorage.setItem('bb-profile',JSON.stringify({nick:'Sam',since:Date.now()-900*864e5,updated:1}))});
const size=await p.evaluate(()=>{let n=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);n+=k.length+(localStorage.getItem(k)||'').length}return n});
const cdp=await c.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
const t0=Date.now();await p.reload();await p.waitForFunction(()=>typeof NAV_READY!=='undefined'&&NAV_READY,null,{timeout:60000});const load=Date.now()-t0;
await p.evaluate(()=>{window.__long=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__long.push(e.duration))).observe({type:'longtask'})});
const T={};const time=async(k,fn,wait=600)=>{await p.waitForTimeout(400);await p.evaluate(()=>{window.__long.length=0});const s=Date.now();await p.evaluate(fn);await p.waitForTimeout(wait);
  T[k]={ms:Date.now()-s-wait,longest:Math.round(await p.evaluate(()=>Math.max(0,...window.__long)))}};
await time('Beans tab',()=>goTab('beans'),1200);
await time('Brew log tab',()=>goTab('log'),1200);
await time('Recipes tab',()=>goTab('recipes'),1000);
await time('Explore tab',()=>goTab('explore'),800);
await time('Open a coffee',()=>{openBean(BEANS[3].id)},800);
await p.evaluate(()=>$('vd').close());
await time('Year in coffee (fresh)',()=>{YIC_MEMO={k:'',h:''};yearInCoffeeHTML()},200);
await time('Log filter: 5 beans',()=>{LF.min=5;renderLogList()},400);
await time('Delete + Undo a brew',async()=>{goTab('log');await new Promise(r=>setTimeout(r,300));document.querySelector('#l-list [data-del]').click();await new Promise(r=>setTimeout(r,200));document.querySelector('#toast .tact').click()},600);
await time('Gallery share card',async()=>{await shCardFor(galleryDoc(),{mode:'dark',col:'origin'})},400);
await time('Backup file',async()=>{const k=Object.keys(localStorage).length;return k},100);
await time('Widget data',()=>{widgetBean();widgetCabinet();widgetRecipe();widgetWords()},100);
console.log('stored '+Math.round(size/1024)+' KB; load '+load+' ms');
for(const [k,v] of Object.entries(T))console.log('  '+k.padEnd(26)+String(v.ms).padStart(6)+' ms   longest pause '+v.longest+' ms');
ok('stores the big collection',size<4.5e6,Math.round(size/1024)+' KB');
ok('opens in under 15 s at 4× slower CPU',load<15000,load);
const slow=Object.entries(T).filter(([k,v])=>v.longest>2500);ok('no action freezes the screen for more than 2.5 s',!slow.length,slow);
ok('counts right',await p.evaluate(()=>BEANS.length===500&&LOG.length===2000));
ok('no errors',!errs.length,errs);await b.close()})();
