const {chromium}=require('playwright');const ok=(c,m,x)=>{console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();
for(const [w,th] of [[390,'dark'],[320,'light'],[1200,'dark']]){const c=await b.newContext({viewport:{width:w,height:844},deviceScaleFactor:2,serviceWorkers:'block',hasTouch:w<760});
await c.addInitScript(t=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t)},th);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(700);
await p.evaluate(()=>{goTab('beans');openBeanEditor(null,{})});await p.waitForTimeout(500);
ok(await p.evaluate(()=>!!document.querySelector('#be-rdate').closest('.datew')&&!!document.querySelector('#be-tried').closest('.datew')),'editor dates use the app field');
ok((await p.textContent('#be-rdate ~ .dw-t'))==='Choose a date','empty roast date reads "Choose a date"');
const tried=await p.textContent('#be-tried ~ .dw-t');ok(tried==='Choose a date','tried starts empty',tried);
const fld=await p.$('#be-rdate');await (await fld.evaluateHandle(e=>e.closest('.datew'))).asElement().click();await p.waitForTimeout(450);
ok(await p.evaluate(()=>document.getElementById('selsheet').open&&!!document.querySelector('.cal')),'calendar opens in the app sheet');
await p.screenshot({path:`shots/cal-${w}-${th}.png`});
ok(await p.evaluate(()=>!!document.querySelector('.cd.today')),'today is marked');
ok(await p.evaluate(()=>{const t=new Date();t.setDate(t.getDate()+1);const v=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');const e=document.querySelector('.cd[data-d="'+v+'"]');return !e||e.disabled}),'no roast date in the future');
ok(await p.isDisabled('#cal-n'),'cannot page into future months');
await p.click('#cal-p');await p.waitForTimeout(150);
const d5=await p.$('.cd[data-d$="-05"]');const iso=await d5.getAttribute('data-d');await d5.click();await p.waitForTimeout(450);
ok(await p.inputValue('#be-rdate')===iso,'picking a day sets the value',iso);
ok(!(await p.evaluate(()=>document.getElementById('selsheet').open)),'sheet closes on pick');
ok(/\d/.test(await p.textContent('#be-rdate ~ .dw-t')),'field shows the picked date');
// month view
await (await (await p.$('#be-rdate')).evaluateHandle(e=>e.closest('.datew'))).asElement().click();await p.waitForTimeout(400);
await p.click('#cal-t');ok(await p.locator('.cm').count()===12,'month view');await p.click('.cm[data-m="0"]');ok(await p.locator('.cd').count()>=28,'back to days');
await p.click('.calclear');await p.waitForTimeout(400);ok(await p.inputValue('#be-rdate')==='','Clear empties an optional date');
// Tried on is optional now: Clear shows (disabled while empty); Yesterday works
await (await (await p.$('#be-tried')).evaluateHandle(e=>e.closest('.datew'))).asElement().click();await p.waitForTimeout(400);
ok(await p.locator('.calclear').count()===1,'optional tried date has Clear');
await p.click('.calq .chip:has-text("Yesterday")');await p.waitForTimeout(400);
const y=await p.evaluate(()=>{const t=new Date(Date.now()-864e5);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')});ok(await p.inputValue('#be-tried')===y,'Yesterday chip');
// save works with these values
await p.fill('#be-name','Cal Test');await p.click('#be-save');await p.waitForTimeout(500);
ok(await p.evaluate(y=>{const x=BEANS.find(b=>b.name==='Cal Test');return x&&x.tried===y&&x.roastDate===''},y),'saved with the chosen dates');
// scan form: code sets the date, field updates
await p.evaluate(()=>{showTab('scan');document.getElementById('scan-text').value='Origin: Kenya\nProcess: Washed\nRoasted 2026-10-20';runLocalScan(false)});await p.waitForTimeout(800);
const sd=await p.evaluate(()=>[document.getElementById('s-date').value,document.querySelector('#s-date ~ .dw-t').textContent]);ok(sd[0]==='2026-10-20'&&/20/.test(sd[1]),'scan fills the date and the words follow',sd);
// keyboard
await p.evaluate(()=>document.getElementById('s-date').closest('.datew').focus());await p.keyboard.press('Enter');await p.waitForTimeout(400);ok(await p.evaluate(()=>document.getElementById('selsheet').open),'keyboard opens it');
if(w>=760){await p.keyboard.press('ArrowLeft');await p.keyboard.press('Enter');await p.waitForTimeout(400);ok(await p.inputValue('#s-date')==='2026-10-19','arrow keys move a day',await p.inputValue('#s-date'))}else{await p.keyboard.press('Escape');await p.waitForTimeout(300)}
// diary composer date
await p.evaluate(()=>{goTab('beans');openBean(BEANS[0].id,true)});await p.waitForTimeout(600);
ok(await p.evaluate(()=>!!document.querySelector('input[type=date][id$="-dd"]')?.closest('.datew')),'diary date uses the app field');
ok(errs.length===0,'no errors',errs);await c.close()}
await b.close()})();
