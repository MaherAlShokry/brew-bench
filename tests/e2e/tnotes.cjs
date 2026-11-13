const {chromium}=require('playwright');const ok=(c,m,x)=>console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [th,w] of [['light',390],['dark',320]]){const c=await b.newContext({viewport:{width:w,height:844},deviceScaleFactor:2,serviceWorkers:'block'});
await c.addInitScript(t=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t)},th);const p=await c.newPage();p.on('pageerror',e=>errs.push(e.stack.split('\n').slice(0,4).join(' | ')));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);

await p.evaluate(()=>openBeanEditor());await p.waitForTimeout(400);
await p.selectOption('#be-origin','ethiopia');await p.selectOption('#be-process','natural');await p.waitForTimeout(200);
const sug=await p.$$eval('#tn-sug [data-add]',l=>l.map(x=>x.textContent));ok(sug.length>=3,'suggestions for Ethiopia natural',sug);
await p.click('#tn-sug [data-add]');
await p.fill('#tn-q','berg');await p.waitForTimeout(200);const o=await p.$$eval('#tn-list [role=option]',l=>l.map(x=>x.textContent));ok(o.some(x=>/Bergamot/.test(x)),'search finds bergamot',o);
await p.keyboard.press('Enter');
await p.fill('#tn-q','turkish delight');await p.keyboard.press('Enter');
await p.click('[data-fam="sweet"]');await p.waitForTimeout(300);
const fam=await p.$$eval('#tn-fam [data-add]',l=>l.length);ok(fam>5,'sweet family opens',fam);
await p.click('#tn-fam [data-add]');
const chips=await p.$$eval('#tn-sel .tn-x',l=>l.map(x=>x.textContent.trim()));ok(chips.length===4,'4 notes chosen',chips);
ok(await p.evaluate(()=>!!document.querySelector('#tn-sel .fwbar')),'balance bar shows');
await p.evaluate(()=>document.querySelector('.tn').scrollIntoView({block:'start'}));await p.evaluate(()=>{const d=document.querySelector('dialog[open]');d.scrollTop-=60});await p.waitForTimeout(300);
await p.screenshot({path:'tn-'+th+'.png'});
// remove one
await p.click('#tn-sel [data-rm="1"]');ok((await p.$$eval('#tn-sel .tn-x',l=>l.length))===3,'remove works');
await p.fill('#be-name','Notes Test');await p.evaluate(()=>$('be-save').click());await p.waitForTimeout(600);
const fl=await p.evaluate(()=>BEANS.find(b=>b.name==='Notes Test').flavours);ok(fl.split(', ').length===3,'saved as words',fl);
// edit keeps
const id=await p.evaluate(()=>BEANS.find(b=>b.name==='Notes Test').id);
await p.evaluate(id=>openBean(id),id);await p.waitForTimeout(500);ok(await p.evaluate(()=>document.querySelectorAll('dialog[open] .chip i.dot').length>=2),'detail chips coloured');
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(id=>openBeanEditor(beanById(id)),id);await p.waitForTimeout(400);ok((await p.$$eval('#tn-sel .tn-x',l=>l.length))===3,'edit loads notes');
const ov=await p.evaluate(()=>{const W=innerWidth;return[...document.querySelectorAll('.tn-box *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>W+1)}).map(e=>e.className).slice(0,3)});ok(!ov.length,'nothing off screen at '+w,ov);
await c.close()}
await b.close();ok(!errs.length,'no errors',errs)})()
