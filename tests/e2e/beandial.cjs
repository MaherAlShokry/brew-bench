const {chromium}=require('playwright');const demo=require('./seed2.cjs');(async()=>{const b=await chromium.launch();const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
 const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await c.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await p.goto('http://localhost:8099/index.html');await p.evaluate(demo);
 // an old save with a regional Geisha
 await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('bb-state')||'{}');s.variety='geisha:panama';delete s.region;delete s.bean;localStorage.setItem('bb-state',JSON.stringify(s))});await p.reload();await p.waitForTimeout(700);
 ok('old Panama Geisha save → Geisha + Panama',await p.evaluate(()=>document.getElementById('i-variety').value==='geisha'&&document.getElementById('i-region').value==='panama'&&S.variety==='geisha:panama'));
 const sel=async(id,v)=>p.evaluate(([id,v])=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))},[id,v]);
 await sel('i-region','ethiopia');ok('region Ethiopia → Ethiopian Gesha profile',await p.evaluate(()=>S.variety),'geisha:ethiopia');
 await sel('i-region','');ok('region Not sure → plain Geisha',await p.evaluate(()=>S.variety==='geisha'));
 await sel('i-region','peru');ok('region Peru → other-origins profile',await p.evaluate(()=>S.variety==='geisha:other'));
 await sel('i-variety','caturra');ok('Caturra ignores region',await p.evaluate(()=>S.variety==='caturra'));
 // picker title
 await p.evaluate(()=>{showTab('dial');openSelect(document.getElementById('i-variety'))});await p.waitForTimeout(300);ok('variety picker title',await p.evaluate(()=>document.getElementById('sel-title').textContent),'Variety');
 await p.evaluate(()=>document.getElementById('selsheet').close());
 // a gallery coffee drives the dial-in
 const bid=await p.evaluate(()=>{const g=BEANS[0];g.process='anaerobicnatural' in PROCESSES?'anaerobicnatural':Object.keys(PROCESSES)[5];g.variety='geisha';g.origin='colombia';g.roast='light';const d=new Date(Date.now()-10*864e5);g.roastDate=d.toISOString().slice(0,10);saveBeans();useBean(g);render();return g.id});
 let st=await p.evaluate(()=>({p:S.process,v:S.variety,r:S.region,ro:S.roast,age:S.age,ui:[document.getElementById('i-variety').value,document.getElementById('i-region').value,document.getElementById('v-age').textContent]}));
 ok('coffee sets process, variety, region, roast, age',st.v==='geisha:colombia'&&st.r==='colombia'&&st.ro==='light'&&st.age===10,st);
 await p.reload();await p.waitForTimeout(800);ok('remembered after reopening',await p.evaluate(id=>S.bean&&S.bean.id===id&&S.variety==='geisha:colombia',bid));
 // a manual tweak stays
 await sel('i-process','washed');await p.evaluate(()=>showTab('recipes'));await p.evaluate(()=>showTab('dial'));ok('manual process change stays',await p.evaluate(()=>S.process==='washed'));
 // edit the coffee in the gallery → dial-in follows
 await p.evaluate(()=>{const g=beanById(S.bean.id);g.process='natural';saveBeans()});await p.evaluate(()=>showTab('recipes'));await p.evaluate(()=>showTab('dial'));ok('coffee edited → dial-in follows',await p.evaluate(()=>S.process==='natural'));
 // a new day → the age moves on
 await p.evaluate(()=>{S.bday='2000-01-01';const g=beanById(S.bean.id);g.roastDate=new Date(Date.now()-17*864e5).toISOString().slice(0,10);});
 await p.evaluate(()=>{S.bsig=[beanById(S.bean.id).process,beanById(S.bean.id).variety,beanById(S.bean.id).roast,beanById(S.bean.id).origin,beanById(S.bean.id).roastDate].join('|')});
 await p.evaluate(()=>showTab('recipes'));await p.evaluate(()=>showTab('dial'));ok('next day → days since roast updated',await p.evaluate(()=>S.age),17);
 ok('no errors',!errs.length,errs);await b.close()})();
