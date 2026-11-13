const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const errs=[];const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-profile',JSON.stringify({nick:'Sam',name:'Sam',since:Date.now(),updated:Date.now()}))});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(900);
const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.evaluate(()=>{goTab('log')});await p.waitForTimeout(400);
await p.click('#l-stars [data-s="4"]');await p.waitForTimeout(120);
ok('bean rating picks 4',await p.evaluate(()=>STAR===4&&document.querySelectorAll('#l-stars button.on').length===4&&!!document.querySelector('#l-stars button svg .bo')));
await p.evaluate(()=>{document.querySelector('.l-rate').scrollIntoView({block:'center'})});await p.screenshot({path:'br-form.png',clip:{x:0,y:250,width:390,height:330}});
await p.evaluate(()=>{$('l-filter').scrollIntoView({block:'start'});scrollBy(0,-90)});await p.waitForTimeout(200);await p.screenshot({path:'br-list.png'});
ok('no star glyphs in log',await p.evaluate(()=>!/★/.test($('log').textContent)));
// bean page: brew taken off the bag, cup stepper
const r=await p.evaluate(()=>{const b=BEANS[0];b.shelf=true;b.bag=250;b.left=null;b.ts=Date.now()-1e6;b.roastDate='';saveBeans();const before=gramsLeft(b);LOG.unshift({id:'t1',ts:Date.now(),date:'x',coffee:'X',settings:'18g : 290g, 93°C',stars:3,beanId:b.id});save('bb-log',LOG);saveBeans();return before-gramsLeft(b)});ok('hand-logged brew comes off the bag',r===18,r);
await p.evaluate(()=>{goTab('beans');openBean(BEANS[0].id)});await p.waitForTimeout(600);
ok('cup stepper starts at last dose',await p.evaluate(()=>$('bd-cg').textContent==='18 g'));
const g0=await p.evaluate(()=>gramsLeft(BEANS[0]));await p.click('#bd-cp');await p.click('#bd-cp');await p.click('#bd-cup');await p.waitForTimeout(300);ok('take off 20 g',await p.evaluate(g0=>g0-gramsLeft(BEANS[0])===20,g0));
ok('roast date prompt',await p.evaluate(()=>!!$('bd-rd')));
await p.evaluate(()=>{document.querySelector('.bd-shelf').scrollIntoView({block:'center'})});await p.waitForTimeout(200);await p.screenshot({path:'br-bean.png'});
await p.evaluate(()=>{const i=$('bd-rd');i.value=new Date(Date.now()-10*864e5).toISOString().slice(0,10);i.dispatchEvent(new Event('change'))});await p.waitForTimeout(400);ok('roast date saved',await p.evaluate(()=>!!BEANS[0].roastDate&&!!document.querySelector('.bd-f')));
// diary with hand-logged brew no crash
await p.evaluate(()=>{$('vd')&&$('vd').close&&$('vd').close();BVIEW='diary';renderBeanViews&&renderBeanViews()});await p.waitForTimeout(400);
ok('diary renders hand-logged brew',await p.evaluate(()=>/Brewed/.test(($('bv-diary')||{}).textContent||'')));
await p.evaluate(()=>{goTab('recipes')});await p.waitForTimeout(700);await p.evaluate(()=>{document.querySelector('.colshelf').scrollIntoView({block:'center'})});await p.waitForTimeout(200);await p.screenshot({path:'br-recipes.png'});
ok('no errors',!errs.length,errs);await b.close()})()
