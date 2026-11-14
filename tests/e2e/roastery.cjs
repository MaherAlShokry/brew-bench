// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const ok=(c,m,x)=>{console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();
for(const w of [320,390]){const c=await b.newContext({viewport:{width:w,height:844},deviceScaleFactor:2,colorScheme:'dark',serviceWorkers:'block',hasTouch:true});
await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
await p.evaluate(()=>{goTab('beans');openBeanEditor(BEANS[0])});await p.waitForTimeout(600);
ok(await p.locator('datalist').count()===0,'no native list');
await p.fill('#be-roaster','');await p.focus('#be-roaster');await p.type('#be-roaster','a');await p.waitForTimeout(200);
const n=await p.locator('#be-rsug [role=option]').count();ok(n>0,'suggestions show',n);
const bx=await p.evaluate(()=>{const l=document.getElementById('be-rsug'),r=l.getBoundingClientRect(),cs=getComputedStyle(l);return {bg:cs.backgroundColor,r:r.right,l:r.left,vw:innerWidth}});
ok(!/rgba\(.*, 0\)|transparent/.test(bx.bg)&&bx.r<=bx.vw&&bx.l>=0,'solid card inside the screen',bx);
await p.screenshot({path:`shots/acl-${w}.png`});
const first=await p.locator('#be-rsug [role=option] b').first().textContent();
await p.locator('#be-rsug [role=option]').first().tap();await p.waitForTimeout(250);
ok(await p.inputValue('#be-roaster')===first,'tap fills it',first);ok(await p.isHidden('#be-rsug'),'list closes');
await p.fill('#be-roaster','');await p.focus('#be-roaster');await p.keyboard.type('ar');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');
ok((await p.inputValue('#be-roaster')).length>2,'keyboard picks',await p.inputValue('#be-roaster'));
await p.keyboard.type('zzzz');ok(await p.isHidden('#be-rsug'),'no match, no list');
await p.fill('#be-roaster','');await p.focus('#be-roaster');await p.keyboard.type('a');await p.keyboard.press('Escape');ok(await p.isHidden('#be-rsug'),'Escape closes the list');ok(await p.evaluate(()=>document.getElementById('vd').open),'Escape closes the list, not the dialog');
// header above the beans when scrolled
await p.evaluate(()=>{const d=document.getElementById('vd');[d,...d.querySelectorAll('*')].forEach(e=>{if(e.scrollHeight>e.clientHeight+5)e.scrollTop=420})});await p.waitForTimeout(300);
const top=await p.evaluate(()=>{const h=document.querySelector('.vd-head').getBoundingClientRect(),rb=document.querySelector('#be-rate .rb').getBoundingClientRect();const x=rb.left+rb.width/2,y=rb.top+rb.height/2;if(y>h.bottom)return 'not under';const e=document.elementFromPoint(x,y);return e.closest('.rb')?'beans on top':'header on top'});
ok(top!=='beans on top','header stays above the rating',top);await p.screenshot({path:`shots/edscroll-${w}.png`});
ok(await p.evaluate(()=>[...document.querySelectorAll('.beform .seg button')].every(x=>x.scrollWidth<=x.clientWidth+1)),'no cut-off pills in the editor');
// scan form
await p.evaluate(()=>{document.getElementById('vd').close();goTab('scan')});await p.waitForTimeout(600);
const vis=await p.isVisible('#s-roaster');if(vis){await p.fill('#s-roaster','');await p.focus('#s-roaster');await p.keyboard.type('a');await p.waitForTimeout(150);ok(await p.locator('#s-rsug [role=option]').count()>0,'scan form suggests roasteries from your coffees')}else console.log('(scan form roaster hidden until a scan)');
ok(errs.length===0,'no errors',errs);await c.close()}
await b.close()})();
