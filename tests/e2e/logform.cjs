// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const ok=(c,m,x)=>console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
(async()=>{const b=await chromium.launch();const errs=[];
const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});await c.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme','light')});
const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(()=>{localStorage.setItem('bb-profile',JSON.stringify({nick:'Sam',name:'Sam',since:Date.now(),updated:Date.now()}));const B=JSON.parse(localStorage.getItem('bb-beans'));B[0].flavours='Blueberry, Jasmine, Caramel, Stroopwafel';localStorage.setItem('bb-beans',JSON.stringify(B))});
await p.reload();await p.waitForTimeout(900);
// from the dial-in with a bean picked
await p.evaluate(()=>{useBean(BEANS[0]);goTab('dial')});await p.waitForTimeout(400);await p.evaluate(()=>$('tolog').click());await p.waitForTimeout(600);
ok(await p.evaluate(()=>!!document.querySelector('#l-bean .l-beancard')&&$('l-coffee-f').hidden),'bean shows as a card, coffee box hidden');
ok(/^How was your /.test(await p.textContent('#l-howq')),'asks how the coffee was',await p.textContent('#l-howq'));
ok(await p.evaluate(()=>!$('l-predshow').hidden&&/expected/.test($('l-predshow').textContent)),'prediction shown as a line',await p.textContent('#l-predshow'));
const bag=await p.$$eval('#l-bag .tn-c',l=>l.map(x=>x.textContent+(x.dataset.bagfl?'':'(off)')));ok(bag.length===4&&bag[3].includes('(off)'),'bag notes shown, Turkish delight not on wheel',bag);
await p.click('#l-bag [data-bagfl]');await p.waitForTimeout(150);await p.click('#l-bag [data-bagfl]:nth-of-type(2)');await p.waitForTimeout(150);
ok(/2 of 3/.test(await p.textContent('#l-bag .l-match')),'match line',await p.textContent('#l-bag .l-match'));
ok((await p.$$eval('#l-flchips .flchip',l=>l.length))===2,'tapped notes are in your cup');
await p.click('#l-stars button:nth-child(4)');ok(await p.textContent('#l-starword')==='Lovely','star word');
// share card uses the profile name
ok(await p.evaluate(()=>{const e=$('l-share');return e.hidden||(!$('sh-name')&&/Sam/.test(e.textContent))}),'shared log uses profile name');
await p.evaluate(()=>$('l-form').scrollIntoView({block:'start'}));await p.waitForTimeout(300);await p.screenshot({path:'logform1.png'});
await p.evaluate(()=>document.querySelectorAll('.re-card')[2].scrollIntoView({block:'center'}));await p.waitForTimeout(300);await p.screenshot({path:'logform2.png'});
await p.evaluate(()=>$('l-save').click());await p.waitForTimeout(500);
const e=await p.evaluate(()=>({coffee:LOG[0].coffee,fl:LOG[0].fl,bean:(LOG[0].snap&&LOG[0].snap.bean&&LOG[0].snap.bean.id)||LOG[0].beanId,first:BEANS[0].id,stars:LOG[0].stars}));ok(e.bean===e.first&&e.fl.length===2&&e.stars===4,'saved with bean, notes and stars',e);
ok(await p.evaluate(()=>!document.querySelector('#l-bean .l-beancard')&&!$('l-coffee-f').hidden),'form resets');
// pick a bean manually
await p.click('#l-beanchg');await p.waitForTimeout(500);ok(/did you brew/.test(await p.textContent('#vd-title')),'picker asks which you brewed');
await p.click('#bp-body [data-usebean]');await p.waitForTimeout(400);ok(await p.evaluate(()=>!!document.querySelector('#l-bean .l-beancard')),'picked bean shows as card');
// edit an entry restores the bean
await p.evaluate(()=>endEdit());await p.evaluate(()=>editBrew(LOG[0]));await p.waitForTimeout(300);ok(await p.evaluate(()=>!!document.querySelector('#l-bean .l-beancard')&&LFL.length===2),'editing restores bean and notes');
await b.close();ok(!errs.length,'no errors',errs)})()
