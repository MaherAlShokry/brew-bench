// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const ok=(c,m,x)=>{console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();
for(const [w,dark] of [[390,0],[320,1]]){
const c=await b.newContext({viewport:{width:w,height:844},deviceScaleFactor:2,colorScheme:dark?'dark':'light',serviceWorkers:'block'});
await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(600);
await p.evaluate(()=>{goTab('beans');openBeanEditor(null,{})});await p.waitForTimeout(500);
ok(await p.locator('#be-vars select').count()===1,'one picker to start');
ok(await p.locator('.bvar-x').count()===0,'no remove button with a single variety');
await p.selectOption('#be-vars select','bourbon');
await p.click('#be-addv');await p.locator('#be-vars select').nth(1).selectOption('typica');
await p.click('#be-addv');await p.locator('#be-vars select').nth(2).selectOption('caturra');
ok(await p.locator('#be-vars select').nth(0).inputValue()==='bourbon','first pick kept after adding');
ok((await p.textContent('#be-vlbl'))==='Varieties','label becomes plural');
await p.click('#be-addv');ok(await p.isHidden('#be-addv'),'add hides at four');
await p.locator('.bvar-x').nth(3).click();ok(await p.locator('#be-vars select').count()===3,'remove works');
await (await p.$('.beform')).screenshot({path:`shots/mv-ed-${w}.png`});
const bx=await p.evaluate(()=>{const f=document.getElementById('be-vars').getBoundingClientRect(),r=[...document.querySelectorAll('.bvar')].map(x=>[x.getBoundingClientRect().right,x.scrollWidth>x.clientWidth+1]);return {fr:f.right,r}});
ok(bx.r.every(x=>x[0]<=bx.fr+1&&!x[1]),'rows fit the form',bx);
await p.fill('#be-name','Finca Blend');await p.click('#be-save');await p.waitForTimeout(500);
const sv=await p.evaluate(()=>{const b=BEANS.find(x=>x.name==='Finca Blend');return b&&[b.variety,b.vars]});
ok(sv&&sv[0]==='bourbon'&&JSON.stringify(sv[1])==='["typica","caturra"]','saved all three',sv);
const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('bb-beans')).find(x=>x.name==='Finca Blend'));ok(st&&st.vars.length===2,'stored');
await p.reload();await p.waitForTimeout(700);
await p.evaluate(()=>{goTab('beans');openBean(BEANS.find(x=>x.name==='Finca Blend').id)});await p.waitForTimeout(500);
const t=await p.textContent('#vd-in');ok(/Varieties\s*(Red )?Bourbon, Typica & Caturra/.test(t),'coffee page lists them',t.match(/Variet[^A-Z]*[A-Z][^R]{0,40}/)?.[0]);
await (await p.$('#vd-in')).screenshot({path:`shots/mv-page-${w}.png`});
// edit: they come back, remove one
await p.evaluate(()=>openBeanEditor(BEANS.find(x=>x.name==='Finca Blend')));await p.waitForTimeout(400);
ok(await p.locator('#be-vars select').count()===3,'editor reopens with three');
await p.locator('.bvar-x').nth(0).click();await p.click('#be-save');await p.waitForTimeout(400);
const s2=await p.evaluate(()=>{const b=BEANS.find(x=>x.name==='Finca Blend');return [b.variety,b.vars]});ok(s2[0]==='typica'&&s2[1][0]==='caturra','removing the first promotes the next',s2);
// search finds by a second variety
await p.evaluate(()=>{document.getElementById('vd').close();BQ='caturra';renderGrid()});await p.waitForTimeout(300);
ok(await p.evaluate(()=>/Finca Blend/.test(document.getElementById('bv-coffees').innerText)),'search finds by any variety');
// sanitizer
const z=await p.evaluate(()=>okBean({id:'abcd1234',variety:'',vars:['typica','typica','nope','sl28','geisha:panama','bourbon','caturra']}));
ok(z.variety==='typica'&&JSON.stringify(z.vars)==='["sl28","geisha:panama","bourbon"]','sanitizer: dedupe, drop unknown, promote, cap at four',z);
ok(!('vars' in await p.evaluate(()=>okBean({id:'abcd1235',variety:'bourbon'}))),'single variety stays as before');
// scan with two varieties
const sc=await p.evaluate(()=>{const j=parseLabel('Colombia Huila\nVarieties: Caturra, Castillo\nWashed\nRoasted 2026-10-20');return j.variety_keys});ok(sc&&sc.length>=2,'scanner keeps every variety',sc);
ok(errs.length===0,'no errors',errs);await c.close()}
await b.close()})();
