// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const ok=(c,m,x)=>console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
const id=await p.evaluate(()=>{const b=okBean({id:'b'+Date.now().toString(36)+'zz',name:'Fresh Bag',tried:'',ts:Date.now()});BEANS.unshift(b);saveBeans();return b.id});
await p.evaluate(id=>{const b=beanById(id);S.bean=okSBean({name:b.name,id:b.id});goTab('dial')},id);await p.waitForTimeout(600);
await p.evaluate(()=>$('tolog').click());await p.waitForTimeout(600);await p.evaluate(()=>$('l-save').click());await p.waitForTimeout(600);
const r=await p.evaluate(id=>({tried:beanById(id).tried,today:todayISO(),bean:LOG[0].snap&&LOG[0].snap.bean&&LOG[0].snap.bean.id}),id);
ok(r.bean===id,'brew linked to bag',r.bean);ok(r.tried===r.today,'tried set on first brew',r);
const other=await p.evaluate(()=>BEANS.filter(b=>b.name!=='Fresh Bag').every(b=>/^\d{4}-\d\d-\d\d$/.test(b.tried)));ok(other,'older coffees keep their dates');
await b.close();ok(!errs.length,'no errors',errs)})()
